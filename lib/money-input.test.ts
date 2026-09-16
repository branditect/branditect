/** Run with: npm test — typing an amount in a country that writes 0,2. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleanMoneyText, parseMoney, moneyText } from "./money-input.ts";
import { LINES, GROUPS } from "./pricing-lines.ts";
import { en } from "./i18n/en.ts";
import { fi } from "./i18n/fi.ts";

const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("0,2 is an amount", () => {
  it("reads both separators", () => {
    assert.equal(parseMoney("0,2"), 0.2);
    assert.equal(parseMoney("0.2"), 0.2);
    assert.equal(parseMoney("0,25"), 0.25);
    assert.equal(parseMoney("12,90"), 12.9);
  });

  it("and a pasted amount with spaces in it", () => {
    assert.equal(parseMoney("1 234,50"), 1234.5);
    assert.equal(parseMoney("1 234,50"), 1234.5);
  });

  it("blank is not recorded, never zero", () => {
    // A product with no cost recorded is not a product that costs nothing.
    assert.equal(parseMoney(""), null);
    assert.equal(parseMoney("   "), null);
    assert.equal(parseMoney(null), null);
    assert.equal(parseMoney("-"), null);
    assert.equal(parseMoney(","), null);
    assert.equal(parseMoney("abc"), null);
  });

  it("keeps a half-typed number on screen instead of correcting it", () => {
    // The whole bug: "0," parsed to 0 and was rendered back as "0", so the
    // separator vanished under the cursor and the next key made it 2.
    assert.equal(cleanMoneyText("0,"), "0,");
    assert.equal(cleanMoneyText("0."), "0.");
    assert.equal(cleanMoneyText("-"), "-");
    assert.equal(cleanMoneyText("€ 12,5"), "12,5");
    assert.equal(cleanMoneyText("1,2,3"), "1,23", "a second separator is dropped, not the digits");
    assert.equal(cleanMoneyText("12abc"), "12");
  });

  it("round-trips a stored number back into a field", () => {
    assert.equal(moneyText(0.2), "0.2");
    assert.equal(moneyText(null), "");
    assert.equal(parseMoney(moneyText(12.9)), 12.9);
  });
});

describe("the fields show what was typed", () => {
  it("the product pricing lines render the raw text, not the parse", () => {
    const src = code("components/products/pricing-tab.tsx");
    assert.match(src, /value=\{raw\[l\.column\] \?\? ""\}/,
      "the line field renders the parsed number again, which eats the separator");
    assert.match(src, /cleanMoneyText\(e\.target\.value\)/);
  });

  it("a custom line keeps its own text while it is being typed", () => {
    const src = code("components/products/pricing-tab.tsx");
    assert.match(src, /const \[text, setText\] = useState\(moneyText\(line\.value\)\)/);
    assert.match(src, /onChange\(parseMoney\(next\)\)/);
  });

  it("the drawer hands the raw values down", () => {
    assert.match(code("components/products/product-drawer.tsx"), /raw=\{draft\.priceValues\}/);
  });

  it("the add-product form is not a number input, and does not parseFloat", () => {
    // type="number" is parsed against the browser's locale: "0,2" is refused
    // on an English profile, "0.2" on a Finnish one, and parseFloat("0,2") is 0.
    const src = code("app/(app)/knowledge/products/import/page.tsx");
    assert.ok(!/parseFloat\(/.test(src), "parseFloat reads 0,2 as 0");
    assert.match(src, /inputMode=\{money \? "decimal" : undefined\}/);
    assert.match(src, /type=\{money \? "text" : type\}/);
  });

  it("the calculators use the same parser as everything else", () => {
    const src = code("components/numbers/calc-shell.tsx");
    assert.match(src, /parseMoney\(s\)/);
    assert.match(src, /cleanMoneyText\(v\)/);
  });
});

describe("which prices carry VAT is on the label", () => {
  it("the two prices the customer pays say incl. VAT", () => {
    const retail = LINES.find((l) => l.id === "retail")!;
    const rrp = LINES.find((l) => l.id === "rrp")!;
    assert.match(en[retail.labelKey], /incl\. VAT/);
    assert.match(en[rrp.labelKey], /incl\. VAT/);
    assert.match(fi[retail.labelKey], /sis\. alv/);
    assert.match(fi[rrp.labelKey], /sis\. alv/);
  });

  it("the net price says excl. VAT, because that is what the margin uses", () => {
    assert.match(en["productPricing.netPriceExVat"], /excl\. VAT/);
    assert.match(fi["productPricing.netPriceExVat"], /alv 0|ilman alv/i);
    assert.match(code("components/products/pricing-tab.tsx"), /t\("productPricing\.netPriceExVat"\)/);
  });

  it("and the cost groups say they are net of it", () => {
    for (const g of GROUPS.filter((x) => x.id !== "in")) {
      assert.match(en[g.noteKey], /excluding VAT|Excluding VAT/);
      assert.match(fi[g.noteKey], /ilman alv/i);
    }
  });

  it("the products list column says it too", () => {
    assert.match(en["product.colPriceVat"], /incl\. VAT/);
    assert.match(code("app/(app)/knowledge/products/page.tsx"), /t\("product\.colPriceVat"\)/);
  });
});
