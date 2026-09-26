import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { guessLanguage, answerLanguageDirective, strategyLanguage } from "./answer-language.ts";

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

  it("the directive is explicit for both languages", () => {
    const en = answerLanguageDirective("en");
    assert.match(en, /Write the strategy in English/);
    assert.match(en, /JSON keys and field names stay[\s\S]*?exactly as specified/);
    const fi = answerLanguageDirective("fi");
    assert.match(fi, /Finnish/);
    // JSON keys must not be translated, or nothing downstream can read the row.
    // The directive is wrapped, so the assertion has to cross the line break.
    assert.match(fi, /JSON keys and field names stay[\s\S]*?exactly as specified/);
  });
});

/**
 * Saara, 2026-09-26: "if the language is Finnish and the answers are in
 * Finnish, generate the strategy in Finnish. The same for English."
 */
describe("the strategy language: interface and answers together", () => {
  const FI = ["Asiakkaamme ovat tavallisia perheitä, eivät ammattilaisia.", "Haluamme että tieto siirtyy seuraavalle omistajalle."];
  const EN = ["Our customers are ordinary families, and this is what they pay for.", "We want the knowledge to pass to the next owner."];

  it("Finnish interface, Finnish answers: Finnish", () => {
    assert.equal(strategyLanguage(FI, "fi"), "fi");
  });
  it("English interface, English answers: English", () => {
    assert.equal(strategyLanguage(EN, "en"), "en");
  });
  it("thin answers follow the interface instead of falling to English", () => {
    assert.equal(strategyLanguage(["Sorbify", "2026", "B2B"], "fi"), "fi");
    assert.equal(strategyLanguage(["Sorbify", "2026", "B2B"], "en"), "en");
    assert.equal(strategyLanguage([], "fi"), "fi");
  });
  it("clear answers win over the interface", () => {
    assert.equal(strategyLanguage(FI, "en"), "fi");
    assert.equal(strategyLanguage(EN, "fi"), "en");
  });
});
