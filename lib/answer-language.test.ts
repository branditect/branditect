import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { guessLanguage, answerLanguageDirective } from "./answer-language.ts";

/**
 * Reported 2026-09-23: "every Omistajatieto material and every answer was
 * given in Finnish, and it made the strategy in English." The strategy is
 * built out of the founder's own sentences, so it follows them.
 */
describe("the strategy follows the language the founder answered in", () => {
  const FI = [
    "Omistajatieto on paikka, johon omaisuuden tärkeä tieto kuuluu.",
    "Asiakkaamme ovat tavallisia perheitä, eivät ammattilaisia.",
    "Haluamme että mökin ja veneen tiedot siirtyvät seuraavalle omistajalle.",
  ];
  const EN = [
    "We keep the knowledge that normally lives in one person's head.",
    "Our customers are ordinary families, and this is what they pay for.",
  ];

  it("Finnish answers are read as Finnish", () => {
    const g = guessLanguage(FI);
    assert.equal(g.language, "fi");
    assert.equal(g.uncertain, false);
  });

  it("English answers are read as English", () => {
    assert.equal(guessLanguage(EN).language, "en");
  });

  it("an English product name in a Finnish answer does not flip it", () => {
    // The real failure mode: one quoted tagline turning the whole document.
    const mixed = [...FI, 'Tagline on englanniksi: "Protective Science for Life".'];
    assert.equal(guessLanguage(mixed).language, "fi");
  });

  it("nothing to go on falls to English, and says it is unsure", () => {
    for (const empty of [[], [""], [null, undefined], ["   "]]) {
      const g = guessLanguage(empty);
      assert.equal(g.language, "en");
      assert.equal(g.uncertain, true);
    }
    const noSignal = guessLanguage(["Sorbify 2026", "https://example.com", "42"]);
    assert.equal(noSignal.language, "en");
    assert.equal(noSignal.uncertain, true);
  });

  it("a stray marker is a win but an uncertain one", () => {
    // Guards the threshold: one Finnish word in an otherwise bare answer
    // should not read as confidently Finnish.
    assert.equal(guessLanguage(["Sorbify ja 2026"]).uncertain, true);
  });

  it("the directive is empty for English and explicit for Finnish", () => {
    assert.equal(answerLanguageDirective("en"), "");
    const fi = answerLanguageDirective("fi");
    assert.match(fi, /Finnish/);
    // JSON keys must not be translated, or nothing downstream can read the row.
    // The directive is wrapped, so the assertion has to cross the line break.
    assert.match(fi, /JSON keys and field names stay[\s\S]*?exactly as specified/);
  });
});
