/**
 * The strategy questionnaire, in Finnish.
 *
 * AN OVERLAY, NOT A REPLACEMENT. strategy-questions.ts stays canonical and
 * stays English. Keyed by the question `id`, which is also the storage key, so
 * a reworded question cannot drift the two files out of alignment.
 *
 * A missing id, or a missing field within one, falls back to English per field
 * rather than per question.
 */

export interface StrategyQuestionFi { question?: string; placeholder?: string }

/** Section headings, keyed by the English heading. */
export const SECTIONS_FI: Record<string, string> = {
  "Your business": "Yrityksesi",
  "Your customers": "Asiakkaasi",
  "Your competition": "Kilpailijasi",
  "What makes you different": "Mikä erottaa sinut",
  "How you sound": "Miltä kuulostat",
  "Where you are going": "Minne olet menossa",
};

export const QUESTIONS_FI: Record<string, StrategyQuestionFi> = {
  "biz-what": {
    question: "Mitä myyt?",
    placeholder: "Yksi lause, niin kuin sanoisit sen naapurille.",
  },
  "biz-why": {
    question: "Miksi aloitit tämän?",
    placeholder: "Mitä oikeasti tapahtui. Ei missiolausetta.",
  },
  "biz-promise": {
    question: "Mitä asiakas saa sinulta joka ikinen kerta?",
    placeholder: "Se mitä toimitat aina, huonollakin viikolla.",
  },
  "cust-who": {
    question: "Kuvaile paras asiakkaasi. Kuka hän on?",
    placeholder: "Yksi oikea ihminen jolle olet myynyt. Ikä, työ, tilanne.",
  },
  "cust-want": {
    question: "Mitä hän yrittää saada aikaan, ja mikä on tiellä?",
    placeholder: "Ensin mitä hän haluaa, sitten mikä tekee siitä vaikeaa.",
  },
  "cust-not": {
    question: "Kenelle tämä ei ole?",
    placeholder: "Ole tarkka. Se terävöittää kaiken muun.",
  },
  "comp-who": {
    question: "Jos joku ei osta sinulta, minne hän menee?",
    placeholder: "Nimeä kaksi tai kolme. Myös ”tekee itse” jos se on totuus.",
  },
  "comp-weak": {
    question: "Mitä nuo vaihtoehdot tekevät väärin?",
    placeholder: "Mistä asiakkaat oikeasti valittavat, heidän sanoillaan.",
  },
  "comp-price": {
    question: "Oletko heitä halvempi, samaa luokkaa vai kalliimpi?",
    placeholder: "Ja yhdellä rivillä miksi se on sinulle oikein.",
  },
  "diff-what": {
    question: "Mitä teet niin, ettei sitä voi helposti kopioida?",
    placeholder: "Yksi asia, selkeästi. Jos kilpailija voisi sanoa saman, se ei kelpaa.",
  },
  "diff-proof": {
    question: "Mitä todisteita sinulla on?",
    placeholder: "Lukuja, testejä, vuosia, sertifikaatteja, takuita. Ei adjektiiveja.",
  },
  "diff-never": {
    question: "Mitä et tekisi koskaan, vaikka kauppa jäisi saamatta?",
    placeholder: "Sinun oikea rajasi.",
  },
  "tone-words": {
    question: "Valitse kolme sanaa brändillesi.",
    placeholder: "Ei mitä toivoisit. Mitä se on tänään.",
  },
  "tone-feel": {
    question: "Miltä ihmisestä pitäisi tuntua asioinnin jälkeen?",
    placeholder: "Yksi tai kaksi tunnetta, rehellisesti.",
  },
  "tone-lang": {
    question: "Mitä sanoja käytät aina, ja mitä vältät?",
    placeholder: "Käytämme: ...\nVältämme: ...",
  },
  "tone-style": {
    question: "Miten kuvailisit tapaanne kirjoittaa?",
    placeholder: "Lyhyesti ja suoraan? Lämpimästi ja jutellen? Huolellisesti ja muodollisesti? Hauskasti?\nJa onko joku jonka kirjoitustyyliin vertaaminen olisi mieluista?",
  },
  "tone-always": {
    question: "Mitä teet asiakkaalle aina, tapahtui mitä tahansa?",
    placeholder: "Tavat jotka ihmiset huomaisivat.",
  },
  "next-goal": {
    question: "Mitä varten seuraavat kaksitoista kuukautta ovat?",
    placeholder: "Yksi tavoite, ei viittä.",
  },
  "next-steps": {
    question: "Mitä pitää tapahtua että pääset sinne?",
    placeholder: "Kaksi tai kolme asiaa, ja suunnilleen milloin.",
  },
  "next-tagline": {
    question: "Onko sinulla jo iskulause jonka haluat säilyttää?",
    placeholder: "Jätä tyhjäksi jos ei. Jos on, rakennamme sen ympärille.",
  },
};
