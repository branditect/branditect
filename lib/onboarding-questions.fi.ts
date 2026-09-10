// Finnish onboarding content — an overlay, not a second table.
//
// WHY AN OVERLAY. `onboarding-questions.ts` owns the structure: which questions
// exist, their numbers, sections, kinds and which four are the gate. This file
// owns nothing but words. Add a question there and it appears in Finnish as
// English until someone translates it — which is the right failure. A parallel
// copy of the whole table would let the two drift silently, and the one nobody
// is reading is the one that goes wrong.
//
// So: every lookup falls back to the English entry. A missing key here is not
// an error.
//
// TRANSLATION NOTES, because these are decisions and not accidents:
//
// - Singular "sinä" throughout for questions to the founder, plural "te" when
//   the question is about the company ("Mitä myytte"). Finnish B2B software
//   that addresses one person as "te" reads like a tax form.
// - No contractions exist in Finnish, so the register marker the English
//   rubric uses does not apply. The equivalent lever here is written versus
//   spoken form, and this is written form throughout — "sinä", not "sä".
// - Finnish agglutinates. Every line here is shorter in words than its English
//   source and means the same thing. Do NOT check these against the English
//   sentence-length bands; see spec/finnish.md.
// - Avoided as machine-written tells: ratkaisu, innovatiivinen, saumaton,
//   hyödyntää, kokonaisvaltainen, ainutlaatuinen. None appear below.
// - The worked examples keep their concrete detail — 800 kilometres, 47 days
//   to 31, kehä ykkönen. A vague example teaches nothing, and vagueness is
//   what translation usually costs you.

import type { PerTrack, Track, SectionId } from "./onboarding-questions";

export const SECTIONS_FI: Record<SectionId, string> = {
  why: "Miksi olette olemassa",
  sell: "Mitä myytte",
  who: "Kenelle se on",
  show: "Millaisia olette",
};

export interface QuestionFi {
  q?: PerTrack<string> | string;
  help?: PerTrack<string>;
  ex?: Partial<Record<Track, string>>;
}

export const QUESTIONS_FI: Record<number, QuestionFi> = {
  1: {
    q: "Mikä sai sinut aloittamaan tämän?",
    help: { all: "Se hetki, ei missiolause. Mitä oikeasti tapahtui?" },
    ex: {
      physical:
        "Olin neljä vuotta töissä retkeilyliikkeessä ja katsoin, kun ihmiset heittivät 200 euron kengät roskiin, koska pohja oli kulunut puhki. Varret olivat ehjät.",
      digital:
        "Tein viisi vuotta töitä freelancerina ja kirjoitin joka sunnuntai-ilta saman kiusallisen sähköpostin, jossa pyysin jotakuta maksamaan.",
      service:
        "Olin töissä isossa siivousfirmassa. Meillä oli kahviloita kahden viikon sopimuksella, ja ne siivottiin ehkä kerran kvartaalissa. Kukaan ei tarkistanut.",
    },
  },

  2: {
    q: "Mikä on rikki siinä, miten ihmiset hoitavat tämän nyt?",
    help: {
      physical: "Ajattele tuotteita, joita he ostavat nyt. Älä ajattele markkinaa.",
      digital: "Ajattele työkaluja, joita he käyttävät nyt. Älä ajattele markkinaa.",
      service: "Ajattele, kenet he palkkaavat nyt. Älä ajattele markkinaa.",
    },
    ex: {
      physical:
        "Kengät on tehty vaihdettaviksi, ei korjattaviksi, ja suutarit jotka niitä ennen korjasivat ovat enimmäkseen lopettaneet.",
      digital:
        "Freelancerit eivät karhua, koska se tuntuu epäkohteliaalta. Niinpä he nielevät kolmen viikon viiveen ja kutsuvat sitä normaaliksi.",
      service:
        "Sopimukset on kirjoitettu niin, ettei kukaan pysty sanomaan mitä oikeasti sai. Pienet kohteet jäävät ensimmäisenä jalkoihin.",
    },
  },

  3: {
    q: "Jos tämä toimii kolmen vuoden päästä juuri niin kuin haluat, miltä se näyttää?",
    help: { all: "Konkreettisesti. Liikevaihto, tiimi, tavoittavuus — mitä ikinä oikeasti haluat." },
    ex: {
      physical:
        "Sarjat 40 yleisimpään kenkämalliin, myynnissä retkeilyliikkeiden omien tiskien kautta, ja meitä on edelleen neljä.",
      digital:
        "10 000 freelanceria käyttää sitä, myyntitiimiä ei edelleenkään ole, ja keskimääräinen maksuaika on koko käyttäjäkunnassa alle 30 päivää.",
      service:
        "Jokainen itsenäinen kahvila kehä ykkösen sisällä, kuusi pakettiautoa, enkä pese ikkunoita enää itse.",
    },
  },

  4: {
    q: "Mitä tässä tekisit edelleen ilmaiseksi?",
    help: {
      all: "Ei se, miksi teet tätä. Mistä osasta nautit niin paljon, ettei raha merkitse siinä mitään?",
    },
    ex: {
      physical:
        "Kuvat, joita ihmiset lähettävät kengästä jonka olivat heittämässä pois — takaisin polulla.",
      digital:
        "Viestit, joissa joku sai maksun työstä jonka oli jo kirjannut menetetyksi.",
      service:
        "Ensimmäinen tunti, ennen kuin kukaan on hereillä, kun koko katu on minun.",
    },
  },

  5: {
    q: "Mitä et tekisi koskaan, vaikka se maksaisi kaupan?",
    help: { all: "Oikea rajasi. Se asia, jonka takia kieltäytyisit rahasta." },
    ex: {
      physical:
        "Emme koskaan myy sarjaa kenkään, jota emme tiedä voitavan korjata kunnolla. Julkaisemme sen listan.",
      digital:
        "Emme koskaan lähetä karhukirjettä, jota freelancer ei ole nähnyt ja hyväksynyt.",
      service:
        "Emme koskaan laskuta käynnistä jota ei tehty. Jokaisesta käynnistä tulee aikaleimattu kuva.",
    },
  },

  6: {
    q: "Mikä tämä on, yhdellä lauseella niin että tuntematon ymmärtää?",
    help: { all: "Ei alan jargonia. Sano se niin kuin sanoisit naapurille." },
    ex: {
      physical:
        "Pohjaussarjat, joilla korjaat vaelluskenkäsi itse sen sijaan että ostaisit uudet.",
      digital: "Sovellus, joka karhuaa myöhässä olevat laskusi puolestasi.",
      service: "Ikkunanpesua liikkeille ja kahviloille Helsingin keskustassa.",
    },
  },

  7: {
    q: "Mitä teette toisin kuin kaikki muut alallanne?",
    help: { all: "Yksi asia, suoraan. Jos se pätee myös kilpailijoihisi, se ei kelpaa." },
    ex: {
      physical:
        "Julkaisemme listan kengistä joihin sarjamme eivät sovi — myös niistä, joilla tekisimme rahaa.",
      digital:
        "Karhukirje on kirjoitettu freelancerin omalla äänellä, ja se kiristyy hänen itse asettamallaan aikataululla.",
      service:
        "Jokainen käynti päättyy aikaleimattuun kuvaan sähköpostissasi, joten et koskaan mieti kävimmekö.",
    },
  },

  8: {
    q: "Miksi jonkun pitäisi uskoa sinua?",
    help: {
      physical: "Materiaalit, testaus, sertifikaatit, takuu, valmistuspaikka.",
      digital: "Käytettävyys, tietoturva, tulokset numeroina, kuka sen rakensi.",
      service: "Luvat, vakuutukset, vuodet alalla, kuka oikeasti tulee paikalle.",
    },
    ex: {
      physical:
        "Sarjat testattu 800 kilometriä polulla. Sopii 40 kenkämalliin. Jokaiseen vaihe vaiheelta -video, kuvattu reaaliajassa virheet mukaan lukien.",
      digital:
        "2 400 käyttäjää. Keskimääräinen maksuaika laski 47 päivästä 31 päivään. Pankkiyhteys vain lukuoikeudella, emme koskaan koske rahoihisi.",
      service:
        "2 miljoonan euron vastuuvakuutus. Puhdistettu vesi teleskooppivarrella 12 metriin. Ennen seitsemää, joten myyntiin ei kosketa. Alkaen 45 euroa käynti.",
    },
  },

  9: {
    q: "Jos joku ei osta sinulta, mitä hän tekee sen sijaan?",
    help: {
      physical:
        "Ota mukaan myös ”ei mitään” ja ”jatkaa rikkinäisellä”. Ne ovat yleensä se oikea kilpailija.",
      digital:
        "Ota mukaan myös ”ei mitään” ja ”tekee sen käsin”. Ne ovat yleensä se oikea kilpailija.",
      service:
        "Ota mukaan myös ”ei mitään” ja ”tekee sen itse”. Ne ovat yleensä se oikea kilpailija.",
    },
    ex: {
      physical: "Ostaa uudet kengät tai jatkaa kuluneilla pohjilla, kunnes liukastuu märällä kivellä.",
      digital: "Kirjoittaa viestit edelleen itse sunnuntai-iltaisin tai luovuttaa ja odottaa.",
      service: "Tekee sopimuksen ison siivousfirman kanssa tai pesee itse sunnuntaina kuivaimella.",
    },
  },

  10: {
    q: "Mistä ihmiset valittavat vaihtoehtojen kohdalla?",
    help: { all: "Mitä olet oikeasti kuullut jonkun sanovan? Hänen sanoillaan, ei sinun." },
    ex: {
      physical:
        "Suutari maksaa enemmän kuin uudet kengät. Kukaan ei tee tätä enää. En tiennyt että se on mahdollista.",
      digital:
        "Se tuntuu aggressiiviselta. En halua ärsyttää asiakasta jota tarvitsen. Kaikki pohjat kuulostavat perintätoimistolta.",
      service:
        "He tulivat kerran eivätkä koskaan enää. En saanut ketään kiinni puhelimesta. Sopimus oli vuoden mittainen.",
    },
  },

  11: {
    q: "Kuvaile paras asiakkaasi. Kuka hän on, ja mitä hänen elämässään tapahtuu?",
    help: { all: "Yksi ihminen, ei segmentti. Ajattele jotakuta, jolle olet oikeasti myynyt." },
    ex: {
      physical:
        "Mies, 45, omistaa yhdet hyvät kengät joita on pitänyt kahdeksan vuotta, korjaa pyöränsä itse, ärsyyntyy kertakäyttötavarasta.",
      digital:
        "Yksin toimiva suunnittelija, 12 asiakasta, laskuttaa 30 päivän ehdolla, saa rahat 55 päivässä, ei ole kertaakaan lähettänyt toista muistutusta.",
      service:
        "Kahvilanomistaja, yksi tai kaksi toimipistettä, avaa seitsemältä, huomaa lasit maanantaina kun valo osuu niihin.",
    },
  },

  12: {
    q: "Mikä on se hetki, jolloin hän tajuaa tarvitsevansa sinua?",
    help: {
      physical: "Laukaisija. Yleensä jokin hajosi, kului loppuun tai loppui.",
      digital: "Laukaisija. Yleensä jokin turhautuminen tulee rajalle.",
      service: "Laukaisija. Yleensä hän näki ongelman asiakkaan edessä.",
    },
    ex: {
      physical: "Hän kääntää kengän ympäri ennen reissua, ja kuviot ovat poissa.",
      digital:
        "On kuukauden 20. päivä, vuokra erääntyy, ja 4 000 euroa makaa laskuissa jotka lähtivät kuusi viikkoa sitten.",
      service: "Asiakas kuvaa flat whitensa, ja hän näkee taustalla juovat.",
    },
  },

  13: {
    q: "Mikä on hänelle toisin jälkeenpäin?",
    help: { all: "Konkreettisesti. Mitä hän voi tehdä — tai lopettaa?" },
    ex: {
      physical: "Hän pitää kengät jotka ovat jo muotoutuneet jalkaan, ja maksaa 30 euroa 220:n sijaan.",
      digital: "Hän lakkaa ajattelemasta asiaa. Raha tulee ilman yhtäkään kiusallista viestiä häneltä.",
      service:
        "Ikkunat pestään kahden viikon välein ilman että hän varaa mitään tai on paikalla.",
    },
  },

  14: {
    q: "Mitä hän pelkää ennen ostoa?",
    help: {
      physical: "Sopiiko se, toimiiko se, saako sen palauttaa. Ja hinta.",
      digital: "Omat tiedot, lukkiutuminen, kauanko oppiminen kestää. Ja hinta.",
      service: "Tuletteko paikalle, sitoutuuko hän, pitääkö hänen olla paikalla. Ja hinta.",
    },
    ex: {
      physical: "Että hän pilaa kengät. Että korjaus pettää ensimmäisessä märässä laskeutumisessa.",
      digital:
        "Että se lähettää jotain kömpelöä asiakkaalle, jota hän on kolme vuotta pitänyt tyytyväisenä.",
      service: "Että hän jää vuodeksi kiinni. Että he käyvät kahdesti ja katoavat.",
    },
  },

  15: {
    q: "Kenelle tämä ei ole?",
    help: { all: "Ole tarkka. Ääneen sanominen terävöittää kaiken yllä olevan." },
    ex: {
      physical:
        "Ihmiset jotka haluavat että se tehdään heidän puolestaan. Ihmiset joiden kengissä varsi on jo irtoamassa.",
      digital: "Toimistot joilla on oma talousihminen. Kaikki joiden asiakkaat maksavat jo ajallaan.",
      service: "Toimistot ja kerrostalot. Kaikki raitiovaunuverkon ulkopuolella.",
    },
  },

  16: {
    q: "Kolme sanaa brändistänne.",
    help: { all: "Ei tavoitetila. Mikä on totta tänään?" },
    ex: {
      physical: "Korjattava. Rehellinen. Koruton.",
      digital: "Rauhallinen. Tarkka. Sinun puolellasi.",
      service: "Luotettava. Näkymätön. Aikainen.",
    },
  },

  17: {
    q: {
      physical: "Jos brändinne olisi ihminen juhlissa, miten hän käyttäytyisi?",
      digital: "Jos brändinne olisi ihminen konferenssissa, miten hän käyttäytyisi?",
      service:
        "Jos brändinne olisi ihminen seisomassa asiakkaan keittiössä, miten hän käyttäytyisi?",
    },
    help: {
      physical:
        "Äänessä, kuuntelemassa, esittelemässä ihmisiä toisilleen vai korjaamassa musiikkia?",
      digital:
        "Lavalla, kiertämässä salia, piilossa kahvipöydässä vai vastaamassa kysymyksiin kunnolla käytävällä?",
      service: "Juttelevainen, sisään ja ulos, kaiken selittävä vai hiljaa työnsä tekevä?",
    },
    ex: {
      physical:
        "Ei äänekkäin. Päätyy keittiöön selittämään jonkin toimintaa kahdelle, jotka oikeasti haluavat tietää.",
      digital:
        "Jättää pääpuheen väliin. Vastaa kysymykseesi kunnolla käytävällä eikä myy sinulle mitään.",
      service: "Riisuu kengät ovella, tekee työn, eikä tarvitse siitä keskustelua.",
    },
  },

  18: {
    q: "Mikä näistä kuulostaa teiltä?",
    help: {
      all: "Valitse ääni ja lue oma otsikkosi kolmella tavalla kirjoitettuna. Mikään ei etene itsestään.",
    },
  },

  19: {
    q: "Eli: ei koskaan näin?",
    help: {
      all: "Koottu niistä vaihtoehdoista, joita et valinnut. Yksi napautus vahvistaa, ja Studio välttää näitä sävyjä.",
    },
  },

  20: {
    q: "Minkä brändien ilmeestä pidät, ja mistä niissä tarkalleen?",
    help: { all: "Mikä ala tahansa. Nimeä se asia, josta pidät — älä pelkkää brändiä." },
    ex: {
      physical:
        "Patagonian korjaussivut. Ne saavat korjaamisen näyttämään vakavammalta valinnalta, ei halvemmalta.",
      digital:
        "Monzo. Numerot ovat isoja ja kieli pientä, mikä on päinvastoin kuin jokaisessa muussa pankissa.",
      service:
        "Aesop. Pakkaus ei kerro juuri mitään, ja silti haluat sen. Eivät pullot vaan pidättyvyys.",
    },
  },
};
