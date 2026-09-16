/**
 * The strategy questionnaire, in Finnish.
 *
 * AN OVERLAY, NOT A REPLACEMENT. `strategy-questions.ts` stays canonical and
 * stays English, because `questionKey` builds the storage key out of the
 * English section and question text:
 *
 *     `${q.section}|${q.question}`
 *
 * Every answer already saved in `brand_strategies.answers` is filed under that
 * English string. Translating the canonical array in place would orphan all of
 * them silently — the questionnaire would read as unanswered and the strategy
 * would regenerate from nothing. So the words are translated here, by index,
 * and the keys never move.
 *
 * Same shape as onboarding-questions.fi.ts, for the same reason: the English
 * file owns the structure, this file owns nothing but words, and neither
 * imports the other.
 *
 * Indexed by position in QUESTIONS. A missing index, or a missing field within
 * an index, falls back to English per field rather than per question.
 */

export interface StrategyQuestionFi {
  question?: string;
  placeholder?: string;
}

/** Section headings, keyed by the English heading. */
export const SECTIONS_FI: Record<string, string> = {
  "Founding Vision": "Perustamisen visio",
  "Your Offering": "Mitä tarjoat",
  "Competitive Landscape": "Kilpailukenttä",
  "Your Audience": "Kohderyhmäsi",
  "Brand Identity": "Brändi-identiteetti",
  "Brand Voice": "Brändin ääni",
  "Validation & Risks": "Näyttö ja riskit",
};

export const QUESTIONS_FI: Record<number, StrategyQuestionFi> = {
  // Perustamisen visio
  0: {
    question: "Minkä ongelman ratkaisemiseksi brändisi on olemassa, ja mikä oma kokemuksesi sai sinut tarttumaan siihen?",
    placeholder: "Ongelma + oma tarinasi...",
  },
  1: {
    question: "Jos brändisi onnistuu täysin, miltä maailma näyttää kymmenen vuoden päästä?",
    placeholder: "Maalaa visio...",
  },
  2: {
    question: "Mikä on voiton lisäksi se syvempi motivaatio joka ajaa tätä brändiä?",
    placeholder: "Mikä pitää sinut liikkeellä huonoina päivinä...",
  },
  3: {
    question: "Onko olemassa brändielementtejä jotka haluat SÄILYTTÄÄ ja rakentaa strategian niiden ympärille: iskulauseita, missiolause, arvoja, manifestin rivejä, nimeämiskäytäntöjä?",
    placeholder: "Iskulause: ...\nMissio: ...\nArvot: ...\n(Jätä tyhjäksi jos aloitat puhtaalta pöydältä)",
  },

  // Mitä tarjoat
  4: {
    question: "Kuvaile yhdellä selkeällä lauseella mitä tarjoat, ja täydennä sitten: \"Olemme ainoita jotka...\"",
    placeholder: "Ensimmäinen lause: ...\nOlemme ainoita jotka...",
  },
  5: {
    question: "Mikä on vahvin kilpailuetusi, se yksi asia jota kukaan ei pysty kopioimaan?",
    placeholder: "Se yksi asia...",
  },
  6: {
    question: "Miten toimituksesi, tuotteesi tai kokemuksesi tuntuu erilaiselta kuin kilpailijoilla?",
    placeholder: "Kuvaile mikä tuntuu erilaiselta...",
  },
  7: {
    question: "Mitkä ovat asiat joista et tingi, koskaan?",
    placeholder: "Rajat joita et ylitä...",
  },

  // Kilpailukenttä
  8: {
    question: "Ketkä ovat kolme tärkeintä kilpailijaasi, ja mikä on kunkin suurin heikkous?",
    placeholder: "Kilpailija 1: ...\nKilpailija 2: ...\nKilpailija 3: ...",
  },
  9: {
    question: "Mistä asiakkaat useimmin valittavat tällä toimialalla?",
    placeholder: "Turhautumiset joita ihmisillä on nykyisiin vaihtoehtoihin...",
  },
  10: {
    question: "Miten brändisi haastaa toimialasi normit ja vakiintuneet tavat?",
    placeholder: "Missä rikot sääntöjä...",
  },

  // Kohderyhmäsi
  11: {
    question: "Kuvaile ihanneasiakkaasi elävästi: kuka hän on, mihin hän uskoo, mistä hän välittää.",
    placeholder: "Rooli, arvot, elämäntapa, uskomukset, kipupisteet...",
  },
  12: {
    question: "Kuvaile muutos jonka asiakkaasi kokee, ennen ja jälkeen, myös tunnetasolla.",
    placeholder: "Ennen: ...\nJälkeen: ...\nTunnemuutos: ...",
  },
  13: {
    question: "Kuka EI ole kohdeasiakkaasi? Kenet rajaat ulos?",
    placeholder: "Emme ole niitä varten jotka...",
  },

  // Brändi-identiteetti
  14: {
    question: "Valitse kolme adjektiivia jotka kuvaavat miltä brändisi pitäisi tuntua, ja se tunnereaktio jonka sen pitäisi herättää.",
    placeholder: "Kolme adjektiivia + tunne jonka ne herättävät...",
  },
  15: {
    question: "Miten visuaalisen ilmeesi pitäisi erota muista toimialallasi, ja mitkä 2–3 brändiä inspiroivat estetiikkaasi?",
    placeholder: "Siinä missä muut näyttävät ..., me näytämme ...\nInspiraatiot: Brändi 1, Brändi 2...",
  },
  16: {
    question: "Jos brändisi olisi ihminen juhlissa, miten hän käyttäytyisi ja pukeutuisi?",
    placeholder: "Hän olisi se joka... pukeutuneena...",
  },

  // Brändin ääni
  17: {
    question: "Miten brändisi viestii (muodollisesti, rennosti, kärkevästi, arvovaltaisesti), ja mitä kieltä tai viittauksia yhteisösi käyttää?",
    placeholder: "Viestintätyyli + yhteisön kieli...",
  },
  18: {
    question: "Kirjoita esimerkkijulkaisu ihanneäänelläsi, ja listaa sanat tai ilmaukset joita brändisi ei saa KOSKAAN käyttää.",
    placeholder: "Esimerkkijulkaisu: ...\nEi koskaan: ...",
  },

  // Näyttö ja riskit
  19: {
    question: "Mitä näyttöä sinulla on siitä että brändisi toimii (suosittelut, data, vetovoima), ja mitkä mittarit liikevaihdon lisäksi kertovat onnistumisesta?",
    placeholder: "Todisteet + onnistumisen mittarit...",
  },
  20: {
    question: "Mitkä ovat brändisi suurimmat haasteet tai riskit seuraavan 12 kuukauden aikana?",
    placeholder: "Suurimmat uhat...",
  },
};
