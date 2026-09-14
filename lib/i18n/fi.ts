// Interface strings, Finnish.
//
// Written, not machine-translated. The decisions below are deliberate; if a
// line reads wrong to a Finnish speaker, change it — but change it knowing
// what it was doing.
//
// REGISTER. Singular "sinä" throughout, written form, never spoken form
// ("sinä", not "sä"). Finnish B2B software that addresses one founder as "te"
// reads like a tax form; spoken form in a paid tool reads like a toy. The one
// exception is where the sentence is about the company rather than the person.
//
// NO CONTRACTIONS EXIST IN FINNISH, so the English rubric's `contractions`
// field is undefined here rather than false. The lever that carries the same
// meaning — distance between writer and reader — is written versus spoken form,
// and that choice is made above.
//
// LENGTH. Finnish agglutinates: "Tilauksesi lähti tänä aamuna" is four words
// where English needs seven. Every line here is shorter in word count than its
// English source and says the same thing. Do NOT check these against the
// English `sentence_words_avg` bands — see spec/finnish.md.
//
// AVOIDED, as machine-written tells: ratkaisu, innovatiivinen, saumaton,
// hyödyntää, kokonaisvaltainen, ainutlaatuinen.
//
// TERMS FIXED ONCE, used everywhere:
//   Knowledge      → Tieto
//   Brand          → Brändi
//   Tone of voice  → Äänensävy
//   Visual identity→ Visuaalit
//   Numbers        → Laskurit      (they are calculators, not figures)
//   AI Chat        → Chat
//   Plan (billing) → Tilaus
//   Workspace      → Työtila
//   Studio, Andy, Pro, Branditect, Demo → left as they are. They are names.

import type { StringKey } from "./en";

export const fi: Record<StringKey, string> = {
  // ── Navigointi ────────────────────────────────────────────────────────────
  "nav.home": "Etusivu",
  "nav.brand": "Brändi",
  "nav.brand.strategy": "Strategia",
  "nav.brand.tone": "Äänensävy",
  "nav.brand.visual": "Visuaalit",
  "nav.brand.channels": "Kanavat",
  "nav.knowledge": "Tieto",
  "nav.knowledge.products": "Tuotteet",
  "nav.knowledge.documents": "Dokumentit",
  "nav.knowledge.images": "Kuvat",
  "nav.knowledge.presentations": "Esitykset",
  "nav.knowledge.links": "Linkit",
  "nav.studio": "Studio",
  "nav.studio.write": "Kirjoita",
  "nav.studio.createImages": "Luo kuvia",
  "nav.studio.notes": "Muistiinpanot",
  "nav.numbers": "Laskurit",
  "nav.chat": "Chat",

  // ── Yleiset ───────────────────────────────────────────────────────────────
  "common.cancel": "Peruuta",
  "common.download": "Lataa",
  "common.edit": "Muokkaa",
  "common.close": "Sulje",
  "common.delete": "Poista",
  "common.dismiss": "Piilota",
  "common.continue": "Jatka",
  "common.continueArrow": "Jatka →",
  "common.skip": "Ohita",
  "common.skipForNow": "Ohita toistaiseksi",
  "common.regenerate": "Luo uudelleen",
  "common.copy": "Kopioi",
  "common.add": "Lisää",
  "common.import": "Tuo",
  "common.retry": "Yritä uudelleen",
  "common.tryAgain": "Yritä uudelleen",
  "common.again": "Uudelleen",
  "common.saved": "Tallennettu",
  "common.loading": "Ladataan…",
  "common.processing": "Käsitellään…",
  "common.wentWrong": "Jokin meni pieleen",
  "common.search": "Haku",
  "common.send": "Lähetä",
  "common.never": "Ei koskaan",
  "common.type": "Tyyppi",
  "common.category": "Luokka",
  "common.cost": "Kustannus",
  "common.description": "Kuvaus",
  "common.length": "Pituus",
  "common.required": "Pakollinen",
  "common.done": "Valmis",
  "common.perMonth": "Kuukaudessa",
  "common.onePerLine": "Yksi per rivi",
  "common.logIn": "Kirjaudu sisään",

  // ── Etusivu ───────────────────────────────────────────────────────────────
  "home.studio": "Studio",
  "home.createWithBrand": "Luo brändilläsi",
  "home.search": "Haku",
  "home.notifications": "Ilmoitukset",

  // ── Virheet ───────────────────────────────────────────────────────────────
  "error.title": "Jokin meni pieleen",
  "error.tryAgain": "Yritä uudelleen",

  // ── Chat ──────────────────────────────────────────────────────────────────
  "chat.title": "Chat",
  "chatRail.fullScreen": "Koko näyttö",
  "chatRail.reading": "Lukee brändiäsi",
  "chatRail.placeholder": "Kysy brändistäsi…",
  "chatRail.ask": "Kysy brändistäsi",
  "chatRail.send": "Lähetä",

  // ── Andy ──────────────────────────────────────────────────────────────────
  "andy.name": "Andy",
  "andy.noConversations": "Ei aiempia keskusteluja",
  "andy.readsFrom": "Lukee brändisi tiedoista",
  "andy.savedNotes": "Tallennetut muistiinpanot",
  "andy.starToSave": "Tähditä mikä tahansa vastaus, niin se tallentuu tänne",
  "andy.placeholder": "Kysy Andylta mitä vain…",

  // ── Sivupalkki, tili, tilaus ──────────────────────────────────────────────
  "sidebar.pro": "Pro",
  "sidebar.viewPlan": "Näytä tilaus",
  "sidebar.primary": "Ensisijainen",
  "settings.yourPlan": "Tilauksesi",
  "accountMenu.promise": "Lupaus",
  "accountMenu.soon": "Pian",
  "sidebar.workspace": "Työtila",
  "accountMenu.profile": "Profiili",
  "accountMenu.settings": "Asetukset",
  "accountMenu.help": "Ohje",
  "accountMenu.logOut": "Kirjaudu ulos",
  "accountMenu.signingOut": "Kirjaudutaan ulos…",

  // ── Toiminta ──────────────────────────────────────────────────────────────
  "activity.title": "Viimeisin toiminta",
  "activity.viewAll": "Näytä kaikki",
  "activity.empty":
    "Ei vielä mitään. Kaikki mitä lisäät osioihin Brändi, Tieto tai Studio näkyy täällä.",

  // ── Valmius ───────────────────────────────────────────────────────────────
  "readiness.yourData": "Omat tietosi",
  "readiness.brandReadiness": "Brändin valmius",
  "readiness.brandKnowledge": "Brändin tieto",
  "readiness.explore": "Selaa tietoja →",

  // ── Mitä seuraavaksi ──────────────────────────────────────────────────────
  "whatsNext.title": "Mitä seuraavaksi",
  "whatsNext.done": "Valmis",
  "whatsNext.addMore": "Lisää niitä",
  "whatsNext.exploreMore": "Katso lisää toimintoja",
  "whatsNext.eachCheckWorth": "Jokainen ruksi on arvoltaan",

  // ── Tervetuloa ────────────────────────────────────────────────────────────
  "welcome.title": "Tervetuloa työtilaasi",
  "welcome.subtitle": "Brändisi aivot ovat valmiina opetettaviksi.",
  "welcome.gettingStarted": "Näin pääset alkuun",
  "welcome.enter": "Siirry työtilaan",
  "welcome.exploreFirst": "Katso ensin ympärillesi",
  "welcome.dontShowAgain": "Älä näytä tätä enää",

  // ── Aloitusnauha ──────────────────────────────────────────────────────────
  "onboardingStrip.continue": "Jatka strategiaasi",
  "onboardingStrip.dismiss": "Piilota",

  // ── Kirjautuminen ─────────────────────────────────────────────────────────
  "auth.email": "Sähköposti",
  "auth.emailPlaceholder": "nimi@yritys.fi",
  "auth.haveAccount": "Onko sinulla jo tili?",
  "auth.logIn": "Kirjaudu sisään",
  "auth.noAccount": "Eikö sinulla ole tiliä?",
  "auth.createOne": "Luo tili",
  "auth.demo": "Demo",
  // Three lines that land as one sentence on the sign-in page. Finnish keeps
  // the contrast by ending on the name, exactly as the English does.
  "auth.showcaseLine1": "Heillä on markkinointitiimi.",
  "auth.showcaseLine2": "Sinulla on",
  "auth.showcaseBrand": "Branditect.",
  "signup.checkEmail": "Tarkista sähköpostisi",
  "signup.goToSignIn": "Siirry kirjautumaan",

  // ── Käyttöönotto (perustiedot) ────────────────────────────────────────────
  "onboarding.basics.title": "Brändin perustiedot",
  "onboarding.basics.intro": "Kerro brändistäsi vähän, niin päästään alkuun.",
  "onboarding.basics.nameLabel": "Mikä brändisi nimi on?",
  "onboarding.basics.namePlaceholder": "esim. Acme Oy",
  "onboarding.basics.websiteLabel": "Verkkosivun osoite",
  "onboarding.basics.websitePlaceholder": "https://...",
  "onboarding.basics.industryLabel": "Toimiala",
  "onboarding.logos.title": "Lataa brändisi logot",
  "onboarding.logos.intro": "Lisää logoversiot. Voit lisätä lisää myöhemmin.",
  "onboarding.colors.title": "Brändivärit",
  "onboarding.colors.intro": "Lisää brändivärisi. Voit päivittää näitä myöhemmin.",
  "onboarding.colors.empty": "Värejä ei ole vielä lisätty.",
  "onboarding.colors.color": "Väri",
  "onboarding.colors.nameLabel": "Värin nimi",
  "onboarding.colors.namePlaceholder": "esim. Pääoranssi, Tummansininen",
  "onboarding.strategy.title": "Miten haluat rakentaa brändistrategiasi?",
  "onboarding.strategy.intro": "Valitse yksi vaihtoehto. Voit vaihtaa myöhemmin.",
  "onboarding.strategy.pastePlaceholder": "Liitä brändistrategiasi tähän…",
  "onboarding.done.title": "Brändisi työtila on luotu.",
  "onboarding.done.open": "Avaa työtilani →",

  // ── Aloitus (kyselyn kehys) ───────────────────────────────────────────────
  "start.beforeYouBegin": "Ennen kuin aloitat",
  "start.teachUs": "Opetetaan Branditectille brändisi.",
  "start.skippedNotice": "Ohitit tämän. Jos vastaat nyt, se poistuu listalta.",
  "start.savesAsYouType": "Tallentuu sitä mukaa kun kirjoitat.",
  "start.answerNeeded": "Jatkaminen vaatii vastauksen.",
  "start.answerPlaceholder": "Kirjoita se niin kuin sanoisit sen ääneen…",
  "start.howToAnswer": "Miten vastata",
  "start.exampleAnswer": "Esimerkkivastaus",
  "start.yourProgress": "Edistymisesi",
  "start.answersSaved": "Vastauksesi on tallennettu. Voit jatkaa milloin vain.",
  "start.resume.title": "Jatketaan siitä mihin jäit",
  "start.resume.body":
    "Tallennettu tilillesi, ei tähän selaimeen. Kirjaudu millä laitteella tahansa, ja se on siellä.",
  "start.resume.openWorkspace": "Avaa mieluummin työtilani",

  // ── Tieto ▸ Dokumentit ────────────────────────────────────────────────────
  "docs.vaultTitle": "Brändin tiedot",
  "docs.vaultIntro":
    "Lataa brändin dokumentit. Tekoäly käyttää sisältöä luodessaan vain näitä tietoja.",
  "docs.aiOnlyRule": "Tekoälyn sääntö:",
  "docs.loadingVault": "Ladataan tietoja…",
  "docs.indexed": "Indeksoitu",
  "docs.error": "Virhe",
  "docs.documentsIndexed": "Indeksoidut dokumentit",
  "docs.pagesProcessed": "Käsitellyt sivut",
  "docs.vaultStatus": "Tietojen tila",
  "docs.acceptedFiles": "PDF, JPEG, PNG, PPTX, DOCX, XLSX — enintään 50 Mt",
  "docs.writeText": "Kirjoita tekstiä",
  "docs.pasteOrType": "Liitä tai kirjoita muistiinpanoja",
  "docs.addTextToVault": "Lisää teksti tietoihin",
  "docs.title": "Otsikko",
  "docs.whatIsThis": "Mikä tämä on?",
  "docs.content": "Sisältö",
  "docs.deleteDocument": "Poista dokumentti",
  "docs.titlePlaceholder": "esim. Tuotelanseerauksen muistiinpanot, Hinnoittelun yleiskuva…",
  "docs.typeHelp": "Studio lukee tämän päättääkseen, milloin siteerata sitä.",
  "docs.contentPlaceholder":
    "Liitä tai kirjoita brändisi tiedot tähän — tuotetiedot, hinnat, yritystiedot, puheenaiheet…",

  // ── Tieto ▸ Dokumentit ▸ latauksen kysymykset ─────────────────────────────
  "ask.whatAreThese": "Mitä nämä tiedostot ovat?",
  "ask.description": "Kuvaus",
  "ask.documentType": "Dokumentin tyyppi",
  "ask.typeHelp": "Studio lukee tämän päättääkseen, milloin siteerata tiedostoa.",
  "ask.titleFromFilename": "Täytetty tiedostonimestä. Muuta, jos se on väärin.",
  "ask.notUsedInContent": "Ei käytetä luodussa sisällössä.",
  "ask.notDescribed": "Ei vielä kuvattu",
  "ask.someFilesDiffer": "osa tiedostoista eroaa",
  "ask.descriptionPlaceholder":
    "Käyttöturvallisuustiedote 500 ml pullolle, TÜV-testattu tammikuussa 2026",

  // ── Tieto ▸ Kuvat, Esitykset ──────────────────────────────────────────────
  "assets.title": "Brändimateriaalit",
  "presentations.title": "Esitykset",

  // ── Tieto ▸ Linkit (pohjat) ───────────────────────────────────────────────
  "templates.title": "Pohjat",
  "templates.loading": "Ladataan pohjia…",
  "templates.intro":
    "Linkitä brändipohjasi tähän. Branditect ehdottaa niitä, kun luot uutta sisältöä.",
  "templates.add": "Lisää pohja",
  "templates.addAnother": "Lisää toinen pohja",
  "templates.addImage": "Lisää kuva",
  "templates.open": "Avaa",
  "templates.remove": "Poista",
  "templates.name": "Nimi",
  "templates.nameHelp":
    "Nimeä se niin kuin työskentelysi kannalta on järkevää — esimerkiksi ”Julkaisu — Tuotelanseeraus — Neliö”.",
  "templates.namePlaceholder": "esim. Julkaisu — Tuotelanseeraus — Neliö",
  "templates.dashHelp": "Erota tyyppi, kampanja ja formaatti ajatusviivoilla.",
  "templates.platform": "Alusta",
  "templates.link": "Pohjan linkki",
  "templates.linkPlaceholder": "Liitä pohjan linkki…",
  "templates.linkExample": "https://canva.link/… tai docs.google.com/…",
  "templates.notesPlaceholder":
    "Lisää muistiinpanoja pohjista — nimeämiskäytännöt, milloin mitäkin käytetään, linkit designjärjestelmiin…",

  // ── Tieto ▸ Tuotteet ──────────────────────────────────────────────────────
  "products.intro": "Kaikki, mistä Branditect voi kirjoittaa, minkä se hinnoittelee ja kuvaa.",
  "products.loading": "Ladataan tuotteita…",
  "products.none": "Ei vielä tuotteita",
  "products.noneHelp":
    "Lisää tuotteesi ja palvelusi käsin, tai liitä hinnasto ja anna tekoälyn poimia ne puolestasi.",
  "products.add": "Lisää tuote",
  "products.search": "Etsi tuotteita",
  "products.searchPlaceholder": "Etsi tuotteita…",
  "products.searchBySku": "Etsi tuotteita nimellä tai SKU:lla",
  "products.clearSearch": "Tyhjennä haku",
  "products.stock": "Varasto",
  "products.openDetail": "Avaa tiedot",
  "products.noCost": "Kustannusta ei ole kirjattu, joten katetta ei voi laskea",
  "products.pagination": "Sivutus",
  "products.prevPage": "Edellinen sivu",
  "products.nextPage": "Seuraava sivu",
  "products.openedFromSuggestion": "Avattu ehdotuksesta kohteessa",
  "products.keepIt": "Pidä se",
  "products.undo": "Kumoa",

  // ── Tieto ▸ Tuotteet ▸ tuonti ─────────────────────────────────────────────
  "import.title": "Tuo tuotteet tekoälyllä",
  "import.intro": "Liitä tuotetiedot tai lataa PDF — tekoäly poimii jokaisen rivin automaattisesti",
  "import.drop": "Pudota PDF tai kuva tähän",
  "import.dropHelp": "Hinnastot, palveluvalikoimat, tuoteluettelot",
  "import.extracting": "Poimitaan tuotteita…",
  "import.saving": "Tallennetaan…",
  "import.loadingCatalogue": "Ladataan luetteloa…",
  "import.fromTextOrPdf": "Tuo tekstistä tai PDF:stä",
  "import.productsAndServices": "Tuotteet ja palvelut",
  "import.priceModel": "Hinnoittelumalli",
  "import.productType": "Tuotetyyppi",
  "import.flagship": "Lippulaiva",
  "import.markFlagship": "Merkitse lippulaivaksi",
  "import.exProductName": "esim. Kasvoseerumi 30 ml",
  "import.exProductCategory": "esim. Ihonhoito",
  "import.exSku": "esim. SKU-001",
  "import.whatIsProduct": "Mikä tämä tuote on?",
  "import.exLeadTime": "3–5 päivää",
  "import.exUnits": "esim. 500 kpl",
  "import.exServiceName": "esim. Brändistrategiasessio",
  "import.exServiceCategory": "esim. Konsultointi",
  "import.whatIsIncludedService": "Mitä tämä palvelu sisältää?",
  "import.exServiceAudience": "esim. Alkuvaiheen startupit",
  "import.exDuration": "esim. 2 viikkoa",
  "import.exDeliverables": "Strategiadokumentti, 2 korjauskierrosta, kysymyspuhelu",
  "import.exCapacity": "esim. 4 asiakasta",
  "import.exPlanName": "esim. Pro-tilaus",
  "import.whatIsIncludedPlan": "Mitä tämä tilaus sisältää?",
  "import.exPlanFeatures": "Rajattomasti projekteja, analytiikka, API-pääsy",
  "import.exDigitalName": "esim. Brändi-ilmeen pohjapaketti",
  "import.exDigitalCategory": "esim. Pohjat",
  "import.whatDoesCustomerGet": "Mitä asiakas saa?",
  "import.exDigitalFormat": "esim. PDF + Figma-tiedosto",

  // ── Tiedostot ja kuvat ────────────────────────────────────────────────────
  // "Lähetetään", not "Ladataan": Finnish "ladata" covers both directions, and
  // an upload that says the same word as a download tells you nothing.
  "files.uploading": "Lähetetään…",
  "files.drop": "Pudota tiedostot tähän tai valitse selaamalla",
  "files.editTags": "Muokkaa tunnisteita",
  "files.tagsHelp": "Erota pilkuilla. esim. kampanja, pääkuva, streamerx",
  "files.tagsPlaceholder": "tunniste1, tunniste2, tunniste3",
  "files.save": "Tallenna",
  "files.copyUrl": "Kopioi osoite",
  "files.searchPlaceholder": "Etsi nimellä tai tunnisteella…",

  "images.upload": "Lähetä kuvia",
  "images.drop": "Pudota kuvat tähän tai valitse selaamalla",
  "images.accepted": "JPG, PNG, WEBP · Enintään 10 Mt · Voit lähettää useita kerralla",
  "images.applyToAll": "Käytä kaikkiin",
  "images.cancelAll": "Peruuta kaikki",
  "images.format": "Formaatti",
  "images.campaign": "Kampanja",
  "images.campaignName": "Kampanjan nimi",
  "images.tags": "Tunnisteet",
  "images.allCategories": "Kaikki luokat",
  "images.allFormats": "Kaikki formaatit",
  "images.allProducts": "Kaikki tuotteet",
  "images.untagged": "Ei tunnisteita",
  "images.tagToProduct": "Liitä tuotteeseen",
  "images.onTheseProducts": "Näissä tuotteissa",
  "images.searchPlaceholder": "Etsi tunnisteita, nimiä, kampanjoita…",
  "images.filterByProduct": "Suodata tuotteen mukaan",
  "images.clearSelection": "Tyhjennä valinta",
  "images.removesLinkOnly": "Poistaa liitoksen, ei tiedostoa.",

  // ── Tuotekortti ▸ kuvan valinta ───────────────────────────────────────────
  "picker.chooseImage": "Valitse tuotekuva",
  "picker.intro":
    "Kuvakirjastostasi. Tätä kuvaa kuvien luonti käyttää referenssinä.",
  "picker.loading": "Ladataan kuviasi…",
  "picker.empty": "Kirjastossasi ei ole vielä kuvia",
  "picker.goToImages": "Siirry Kuviin",
  "picker.clear": "Tyhjennä",
  "picker.removeImage": "Poista kuva",
  "picker.manageInKnowledge": "Hallinnoi kuvia Tieto-osiossa →",
  "picker.search": "Etsi kuvia",
  "picker.searchPlaceholder": "Etsi kuvia…",

  // ── Tuotekortti ▸ media ───────────────────────────────────────────────────
  "media.imagesAndVideo": "Kuvat ja video",
  "media.noImages": "Ei vielä kuvia.",
  "media.noImagesHelp": "Luo niitä Studiossa tai liitä olemassa olevia Tieto-osiosta.",
  "media.primary": "Ensisijainen",
  "media.documents": "Dokumentit",
  "media.noDocuments": "Ei vielä dokumentteja.",
  "media.noDocumentsHelp":
    "Liitä käyttöturvallisuustiedote, spesifikaatio tai sertifikaatti kohdasta Tieto ▸ Dokumentit.",
  "media.tagToAnother": "Liitä tämä kuva toiseen tuotteeseen",

  // ── Tuotekortti ▸ hinnoittelu ─────────────────────────────────────────────
  "pricing.linesOnProduct": "Tämän tuotteen rivit",
  "pricing.linesHelp":
    "Rivin sulkeminen piilottaa sen, eikä se enää kysy. Kirjoittamasi luku säilyy.",
  "pricing.netPrice": "Nettohinta",
  "pricing.addIt": "Lisää se",
  "pricing.notes": "Muistiinpanot",
  "pricing.pricingNotes": "Hinnoittelun muistiinpanot",
  "pricing.numbersLink": "Laskurit ▸ Hinnoittelu ja tarjoukset",
  "pricing.whatIsItCalled": "Mikä sen nimi on?",
  "pricing.lineName": "Rivin nimi",
  "pricing.lineValue": "Rivin arvo",
  "pricing.notesPlaceholder":
    "älä koskaan tarjoa verkkokaupassa alle 26,00 — se alittaa omien jälleenmyyjiemme hinnat",

  // ── Tuotekortti ▸ tiedot ──────────────────────────────────────────────────
  "product.tagsHelp":
    "Tunnisteet ohjaavat sävyä ja näkökulmaa, kun Studio kirjoittaa. Erota ne pilkuilla.",
  "product.tagsExample": "Ammattilaisille, ionisoiva",
  "product.status": "Tila",
  "product.notSet": "Ei asetettu",
  "product.outOfStockNote": "Studio välttää tämän mainostamista, kun sitä ei ole varastossa.",
  "product.imagePickedFrom": "Valittu kuvakirjastostasi kohdassa Tieto ▸ Kuvat",
  "product.revert": "Palauta",
  "product.sections": "Tuotetietojen osiot",
  "product.information": "Tuotetiedot",
  "product.availability": "Saatavuus",
  "product.image": "Tuotekuva",
  "product.changes": "Muutokset",
  "specs.loading": "Ladataan spesifikaatioita…",
  "specs.help": "Studio kirjoittaa tämän pohjalta. Faktoja, ei adjektiiveja — ne se keksii itse.",
  "specs.example": "Imukyky",

  // ── Brändi ▸ Visuaalit ────────────────────────────────────────────────────
  "visual.breadcrumb": "Brändi · Visuaalit",
  "visual.title": "Brändin visuaalit",
  "visual.intro": "Ota mitä tarvitset — sinun ei tarvitse kysyä keneltäkään.",
  "visual.noBrand": "Ei vielä brändiä.",
  "visual.noBrandHelp":
    "Logosi, värisi ja kirjasimesi näkyvät täällä, kun brändi on luotu.",
  "visual.yourLogo": "Logosi",
  "visual.logos": "Logot",
  "visual.noLogos": "Ei vielä logoja.",
  "visual.files": "Tiedostot",
  "visual.allFiles": "Kaikki tiedostot",
  "visual.current": "Nykyinen",
  "visual.startHere": "Aloita tästä",
  "visual.whichOne": "Mitä näistä käytän?",
  "visual.colour": "Väri",
  "visual.noColours": "Ei vielä värejä.",
  "visual.typefaces": "Kirjasimet",
  "visual.noTypefaces": "Ei vielä kirjasimia.",
  "visual.typefacesHelp":
    "Jokainen näyte on ladottu oikealla kirjasimella. Kopioi CSS, niin sinunkin on.",
  "visual.typefacesEmpty": "Lisää se otsikoihin ja se kaikkeen muuhun.",
  "visual.copyCss": "Kopioi CSS",
  "visual.templates": "Pohjat",
  "visual.templatesHelp": "Koot ja asetukset ovat valmiina. Avaa yksi ja vaihda sanat.",
  "visual.howToHold": "Miten sitä käytetään",
  "visual.clearSpace": "Suoja-alue",
  "visual.clearSpaceHelp":
    "Jätä merkin korkeuden verran tyhjää joka puolelle. Mikään ei ylitä sitä — ei teksti, ei reuna, ei toinen logo.",
  "visual.minSize": "Vähimmäiskoko",
  "visual.minSizeHelp": "Näitä pienempänä käytä pelkkää merkkiä.",
  "visual.guidelines": "Ohjeisto",
  "visual.fullGuidelines": "Koko ohjeisto",
  "visual.readHere": "Lue täältä",

  // ── Brändi ▸ Visuaalit ▸ lähetykset ───────────────────────────────────────
  "vupload.logo": "Lähetä logo",
  "vupload.whichVersion": "Mikä versio tämä on?",
  "vupload.logoHelp": "SVG tai PNG. Jos paikassa on jo tiedosto, lähetys korvaa sen.",
  "vupload.addColour": "Lisää väri",
  "vupload.addOneColour": "Lisää yksi väri",
  "vupload.fromScreenshot": "Poimi ne kuvakaappauksesta",
  "vupload.hex": "Heksa-arvo",
  "vupload.colourName": "Värin nimi",
  // Primary, Ink and Wash are the design token names, not English words to
  // translate. Renaming them here would break the link to the tokens.
  "vupload.colourRole": "Mihin se on — Primary, Ink, Wash",
  "vupload.addTypeface": "Lisää kirjasin",
  "vupload.googleFont": "Google-fontti nimellä",
  "vupload.typefaceName": "Kirjasimen nimi",

  // ── Brändi ▸ Äänensävy ────────────────────────────────────────────────────
  "tone.title": "Brändin äänensävy",
  "tone.setUp": "Määritä brändisi äänensävy",
  "tone.chooseHow": "Valitse, miten haluat määrittää brändisi äänen.",
  "tone.pasteSamples": "Liitä tekstinäytteitä",
  "tone.pasteSamplesHelp":
    "Liitä esimerkkejä brändisi teksteistä, niin poimimme sävyn automaattisesti.",
  "tone.pasteSamplesIntro": "Liitä esimerkkejä brändisi teksteistä alle. Mitä enemmän, sen parempi.",
  "tone.pastePlaceholder": "Liitä verkkosivutekstisi, sähköpostisi, somejulkaisusi, iskulauseesi…",
  "tone.fromStrategy": "Hae brändistrategiasta",
  "tone.fromStrategyHelp": "Käytä tallennettua brändistrategiaasi sävyohjeiden pohjana.",
  "tone.manual": "Rakenna käsin",
  "tone.manualHelp": "Määritä sävyn jokainen puoli vaihe vaiheelta.",
  "tone.expression": "BRÄNDISI ILMAISU",
  "tone.pillars": "SÄVYN PILARIT",
  "tone.doAndDont": "TEE JA ÄLÄ TEE",
  "tone.dont": "Älä",
  "tone.vocabulary": "BRÄNDIN SANASTO",
  "tone.alwaysUse": "Käytä aina",
  "tone.neverUse": "Älä koskaan käytä",
  "tone.touchpoints": "KANAVAKOHTAAMISET",
  "tone.checklist": "PIKATARKISTUS",
  "tone.expressionLabel": "Ilmaisun nimi",
  "tone.expressionText": "Ilmaisun teksti",
  "tone.bullets": "Luettelokohdat (yksi per rivi)",
  "tone.alwaysUseField": "Käytä aina (pilkulla erotettuna)",
  "tone.neverUseField": "Älä koskaan käytä (pilkulla erotettuna)",
  "tone.wrongExample": "Väärä esimerkki",
  "tone.rightExample": "Oikea esimerkki",
  "tone.oneItemPerLine": "Yksi kohta per rivi",
  "tone.pillarName": "Pilarin nimi",
  "tone.describeSound": "Kuvaile, miltä brändisi kuulostaa…",
  // These two are examples of words to use and to avoid, so they are localised
  // rather than translated: the Finnish "never use" list is the Finnish
  // machine-written tells, not a rendering of the English ones. See
  // spec/finnish.md — nobody has compiled that list properly yet, and these
  // four are the obvious starting candidates.
  "tone.alwaysExample": "rehellinen, kumppani, konkreettinen, …",
  "tone.neverExample": "innovatiivinen, saumaton, hyödyntää, kokonaisvaltainen, …",
  "tone.channelName": "Kanavan nimi",
  "tone.badge": "Merkki",
  "tone.exampleName": "esim. Rohkea ja suora",

  // ── Brändi ▸ Strategia ────────────────────────────────────────────────────
  "strategy.none": "Ei vielä strategiaa.",
  "strategy.startQuestionnaire": "Aloita kysely",
  "strategy.whatDoYouOffer": "Mitä brändisi tarjoaa?",
  "strategy.trackHelp": "Tämä auttaa meitä sovittamaan strategiakehyksen.",
  "strategy.trackProducts": "Fyysiset tai digitaaliset tuotteet",
  "strategy.trackProductsHelp": "Verkkokauppa, SaaS, sovellukset, fyysiset tuotteet",
  "strategy.trackServices": "Palvelut",
  "strategy.trackServicesHelp": "Konsultointi, toimisto, freelance, asiantuntijapalvelut",
  "strategy.sections": "Osiot",
  "strategy.generateNow": "Luo strategia nyt",
  "strategy.back": "Takaisin",
  "strategy.crafting": "Rakennetaan brändistrategiaasi",
  "strategy.backToQuestions": "Palaa kysymyksiin",
  "strategy.editAnswers": "Muokkaa vastauksia",
  "strategy.downloadMd": "Lataa .md",

  // ── Brändi ▸ Strategiadokumentti ──────────────────────────────────────────
  "sdoc.title": "Brändistrategia",
  "sdoc.feeding": "Syöttää 4 työkalua",
  "sdoc.export": "Vie",
  "sdoc.derived": "Johdettu asemoinnistasi ja todisteistasi",
  "sdoc.inAParagraph": "Koko strategia yhdessä kappaleessa",
  "sdoc.neverStored":
    "Luodaan alla olevista osioista eikä tallenneta, joten se ei voi vanhentua.",
  "sdoc.different": "Mikä erottaa meidät",
  "sdoc.notFor": "Ei näille",
  "sdoc.theyWant": "He haluavat",
  "sdoc.frustratedBy": "Turhautuvat",
  "sdoc.professional": "Ammattimainen",
  "sdoc.consumer": "Kuluttaja",
  "sdoc.accessible": "Helposti lähestyttävä",
  "sdoc.premium": "Premium",
  "sdoc.proof": "Todisteet",
  "sdoc.noProof": "Ei vielä todisteita — lisää fakta, jossa on numero",
  "sdoc.weNever": "Emme koskaan",
  "sdoc.weAlways": "Teemme aina",
  "sdoc.nothingNamed": "Mitään ei ole vielä nimetty.",
  "sdoc.nothingNamedHelp":
    "Mitään ei ole vielä nimetty. Malli välttää nimetyn virheen paljon paremmin kuin päättelee maun.",
  "sdoc.brandGoal": "Brändin tavoite",
  "sdoc.whereNext": "Mihin tämä menee seuraavaksi",
  "sdoc.whereUsed": "Missä Branditect käyttää tätä",

  // ── Brändi ▸ Kanavat ──────────────────────────────────────────────────────
  "channels.active": "Somestrategia käytössä · synkronoitu brändin kanssa",
  "channels.editAnswers": "Muokkaa vastauksia",
  "channels.intro":
    "Branditect tuntee jo brändisi. Nyt se päättää, mitä sinun kannattaa julkaista.",
  "channels.step2Note": "Yhdistelykerros tulee vaiheessa 2 — vastauksesi on tallennettu.",
  "channels.architect": "Somestrategian arkkitehti",
  "channels.fiveQuestions": "Rakenna somestrategiasi viidellä kysymyksellä.",
  "channels.strategyAnswers": "Brändistrategian vastaukset",
  "channels.pullingFrom": "Mitä haemme kirjastostasi",
  "channels.willAsk": "Mitä kysymme sinulta",
  "channels.commitment": "Kanavat, joihin sitoudut 90 päiväksi",
  "channels.primaryGoalIntro": "Somen päätavoite liiketoiminnalle",
  "channels.capacityIntro": "Realistinen kapasiteetti — määrä ja tekijät",
  "channels.antiBrand": "Antibrändi — miltä et halua näyttää",
  "channels.whyWeAsk": "Miksi kysymme",
  "channels.primaryGoal": "Päätavoite (valitse yksi)",
  "channels.secondaryGoal": "Toissijainen tavoite (valinnainen)",
  "channels.volumePerWeek": "Määrä viikossa",
  "channels.productionSetup": "Tuotantotapa",
  "channels.threeToFive": "Yksi per rivi. Vähintään 3, enintään 5.",
  "channels.pitfalls": "Yleiset sudenkuopat (valitse mitä vain)",
  "channels.anythingElse": "Muuta? (yksi per rivi)",

  // ── Laskurit ──────────────────────────────────────────────────────────────
  "numbers.title": "Laskurit",
  "numbers.whatItDoes": "Mitä Laskurit tekee",
  "numbers.studioObeys": "Studio kirjoittaa näiden rajojen sisällä.",
  "numbers.noProducts": "Ei vielä tuotteita — laskurit toimivat silti.",
  "numbers.productsPriced": "Hinnoitellut tuotteet",
  "numbers.lowestMargin": "Pienin kate",
  "numbers.seeAll": "Katso kaikki luvut →",
  "numbers.setOnce": "Aseta kerran",
  "numbers.whatYouSell": "Mitä myyt",
  "numbers.howYouCharge": "Miten veloitat",
  "numbers.howYouSell": "Miten myyt",
  "numbers.whereYouSell": "Missä myyt",
  "numbers.calculators": "Laskurit",
  "numbers.perSale": "Per kauppa",
  "numbers.sandbox": "Hiekkalaatikko",
  "numbers.variableCosts": "Kulut, jotka muuttuvat määrän mukana.",
  "numbers.whatYoullNeed": "Mitä tarvitset",
  "numbers.openCalculator": "Avaa laskuri",
  "numbers.bestContribution": "Paras myyntikate per kauppa",
  "numbers.revenue": "Liikevaihto",

  "numbers.runningCosts": "Juoksevat kulut",
  "numbers.runningCostsAndBreakEven": "Juoksevat kulut ja kriittinen piste",
  "numbers.runningCostsHelp": "Mitä maksat, myit sitten yhden tai tuhat.",
  "numbers.breakEvenHelp": "Mitä sinun on myytävä kuussa, jotta valot pysyvät päällä.",
  "numbers.monthlyTotals": "Mitä tarvitset — kuukausisummat, ei kuitteja",
  "numbers.yourMonthlyCosts": "Kuukausikulusi",
  "numbers.total": "Yhteensä",
  "numbers.expectedVolume": "Odotettu määrä",
  "numbers.whatThatMeans": "Mitä se tarkoittaa",
  "numbers.againstWhichProduct": "Mitä tuotetta vasten",
  "numbers.selectProduct": "Valitse tuote…",
  "numbers.contributionPerSale": "Myyntikate per kauppa",
  "numbers.breakEven": "Kriittinen piste",
  "numbers.enterCosts": "Syötä juoksevat kulusi vasemmalle.",
  "numbers.neverAtThisPrice": "Ei koskaan tällä hinnalla",
  "numbers.opensProductCard":
    "Avaa tuotekortin. Mitään ei tallenneta ennen kuin painat siellä tallenna.",
  "numbers.overheadDeliberately": "Yleiskulut ovat tarkoituksella",

  // Kokonaishankintahinta, not "laskeutunut kustannus": the Finnish trade term
  // is the price with every cost of getting it here included.
  "numbers.landedCost": "Kokonaishankintahinta",
  "numbers.yourCostLines": "Kulurivisi",
  "numbers.pricingAndMargin": "Hinnoittelu ja kate",
  "numbers.eitherEnd": "Laske kummasta päästä tahansa",
  "numbers.direction": "Suunta",
  "numbers.offers": "Tarjoukset ja alennukset",
  "numbers.maxDiscount": "Enimmäisalennus",
  "numbers.offerConsidering": "Tarjous, jota harkitset",
  "numbers.recurring": "Toistuva liikevaihto",
  "numbers.subscriptionNumbers": "Tilauslukusi",

  // ── Asetukset ▸ Kieli ─────────────────────────────────────────────────────
  // Lisätty kielivalitsimen yhteydessä. Kuusi avainta, joita sanastossa ei ollut.
  "settings.breadcrumb": "Asetukset",
  "settings.title": "Asetukset",
  "settings.language": "Kieli",
  "settings.languageIntro":
    "Käyttöliittymän kieli ja Studion kirjoituskieli ovat kaksi eri valintaa.",
  "settings.interfaceLanguage": "Käyttöliittymän kieli",
  "settings.interfaceLanguageHelp":
    "Painikkeiden, selitteiden ja ohjetekstien kieli.",
  "settings.languageSavedLocally":
    "Tallennettu vain tähän selaimeen. Tällä tilillä ei ole vielä brändiä, johon valinnan voisi tallentaa.",
  "settings.deleteSection": "Tilin poistaminen",
  "settings.deleteAccount": "Poista tili",
  "settings.deleteAccountHelp":
    "Brändisi, kaikki Tieto-osion sisältö, kaikki Studion tekemä ja kirjautumisesi. Tätä ei voi perua eikä palauttaa varmuuskopiosta.",
  "settings.deleteWhatGoes":
    "Tämä poistaa jokaisen tähän brändiin kuuluvan rivin ja tiedoston ja sen jälkeen itse tilin. Toimintoa ei voi peruuttaa.",
  "settings.deleteTypeName": "Vahvista kirjoittamalla {name}.",
  "settings.deleteTypeNameLabel": "Brändin nimi",
  "settings.deleteForever": "Poista kaikki",
  "settings.deleting": "Poistetaan…",
  "settings.deleteFailed": "Mitään ei poistettu. Yritä uudelleen.",

  "settings.hero.brandChip": "{brand}",
  "settings.you": "Sinä",
  "settings.youSub": "Nimi näkyy etusivun tervehdyksessä.",
  "settings.name": "Nimi",
  "settings.email": "Sähköposti",
  "settings.emailFixed": "Sähköposti on toistaiseksi kiinteä. Kirjoita meille, niin vaihdamme sen.",
  "settings.save": "Tallenna",
  "settings.saved": "Tallennettu",
  "settings.saving": "Tallennetaan…",
  "settings.saveFailed": "Mitään ei tallennettu. Yritä uudelleen.",
  "settings.brand": "Brändi",
  "settings.brandSub": "Kysyttiin käyttöönotossa. Täältä voit korjata ne.",
  "settings.brandName": "Brändin nimi",
  "settings.website": "Verkkosivu",
  "settings.websiteInvalid": "Tämä ei näytä verkko-osoitteelta.",
  "settings.industry": "Toimiala",
  "settings.forYou": "Sinulle",
  "settings.forCustomers": "Asiakkaillesi",
  "settings.outputLanguage": "Studion kirjoituskieli",
  "settings.outputLanguageHelp":
    "Kieli, jolla Studio kirjoittaa — se, mitä asiakkaasi lukevat.",
  "settings.account": "Tili",
  "settings.accountSub": "Kirjautuminen ja tilin poisto.",
  "settings.signOut": "Kirjaudu ulos",
  "settings.signingOut": "Kirjaudutaan ulos…",
  "settings.comingUp": "Tulossa",
  "settings.soonPlan": "Tilaus",
  "settings.soonPlanDesc": "Tilauksesi ja mitä siihen kuuluu",
  "settings.soonCredits": "Krediittien käyttö",
  "settings.soonCreditsDesc": "Kuinka paljon tämän kuun kiintiöstä on käytetty",
  "settings.soonTeam": "Tiimi",
  "settings.soonTeamDesc": "Kutsu ihmisiä ja jaa yksi brändi",
  "settings.soonNotifications": "Ilmoitukset",
  "settings.soonNotificationsDesc": "Mistä lähetämme sinulle sähköpostia",
  "settings.soonBilling": "Laskutus",
  "settings.soonBillingDesc": "Laskut ja maksutapa",

  "guardrails.title": "Rajat, joita Studio noudattaa",
  "guardrails.whichProduct": "Mikä tuote",
  "guardrails.pickProduct": "Valitse tuote",
  "guardrails.saved": "Tallennettu ✓",
  "calc.applyToProduct": "Käytä tuotteeseen",
  "calc.quickCalculation": "Pikalaskelma — ei tuotetta",

  // ── Käyttöönotto ▸ toimialat ──────────────────────────────────────────────
  "industry.tech": "Teknologia ja SaaS",
  "industry.ecommerce": "Verkkokauppa",
  "industry.health": "Terveys ja hyvinvointi",
  "industry.food": "Ruoka ja juoma",
  "industry.services": "Asiantuntijapalvelut",
  "industry.fashion": "Muoti ja kauneus",
  "industry.education": "Koulutus",
  "industry.realEstate": "Kiinteistöt",
  "industry.other": "Muu",

  // ── Käyttöönotto ▸ logopaikat ja värit ────────────────────────────────────
  "logoSlot.primary": "Päälogo",
  "logoSlot.dark": "Tummalle taustalle",
  "logoSlot.mark": "Vain ikoni tai merkki",
  "logoSlot.white": "Valkoinen versio",
  "colourRole.secondary": "Toissijainen",
  "colourRole.accent": "Korostus",

  // ── Käyttöönotto ▸ strategiavaihtoehdot ───────────────────────────────────
  "onboarding.strategy.questionnaire": "Vastaa brändikyselyyn",
  "onboarding.strategy.paste": "Liitä olemassa oleva strategia",
  "onboarding.strategy.pasteHelp":
    "Onko sinulla jo brändistrategia? Liitä se, niin jäsennämme sen.",
  "onboarding.strategy.upload": "Lataa PDF",
  "onboarding.strategy.uploadHelp": "Lataa brändiohjeistosi tai strategiadokumenttisi.",
  "onboarding.strategy.later": "Voit tehdä tämän myöhemminkin Brändikirjastosta.",

  // ── Käyttöönotto ▸ vaiheet ────────────────────────────────────────────────
  "onboarding.step.basics": "Nimi, verkkosivu ja toimiala",
  "onboarding.step.logo": "Logojen lataus",
  "onboarding.step.visuals": "Brändisi visuaalit",
  "onboarding.step.palette": "Väripalettisi",
  "onboarding.step.strategy": "Brändistrategia",
  "onboarding.step.positioning": "Miten asemoit brändisi",
  "onboarding.step.allDone": "Valmista",
  "onboarding.step.workspaceReady": "Työtilasi on valmis",
  "onboarding.back": "← Takaisin",
  "onboarding.skipArrow": "Ohita toistaiseksi →",
  "onboarding.notAuthenticated": "Ei kirjautunut",
  "onboarding.saveFailed": "Brändin tallennuksessa meni jokin pieleen. Yritä uudelleen.",

  // ── Käyttöönotto ▸ moduulikortit viimeisessä vaiheessa ────────────────────
  "module.dashboard": "Työpöytä",
  "module.dashboardDesc": "Brändisi komentokeskus yhdellä silmäyksellä.",
  "module.create": "Luo",
  "module.createDesc": "Luo brändinmukaista sisältöä sekunneissa.",
  "module.brandLibrary": "Brändikirjasto",
  "module.brandLibraryDesc": "Ääni, visuaalit ja strategia yhdessä paikassa.",
  "module.assetLibrary": "Materiaalikirjasto",
  "module.assetLibraryDesc": "Kaikki logosi, kuvasi ja tiedostosi järjestyksessä.",
  "module.imageArchitect": "Kuva-arkkitehti",
  "module.imageArchitectDesc": "Tekoälyllä luodut kuvat brändillesi.",
  "module.businessTools": "Liiketoiminnan työkalut",
  "module.businessToolsDesc": "Hinnoittelun, talouden ja toiminnan tuki.",

  // ── Kanavat ▸ tavoitteet ja kapasiteetti ──────────────────────────────────
  // Platform names — Instagram, TikTok, LinkedIn and the rest — are proper
  // nouns and are not in this file at all. Do not add them.
  "goal.awareness": "Tunnettuus",
  "goal.community": "Yhteisö",
  // "Asiantuntijuus", not "auktoriteetti": in Finnish the loanword carries
  // command rather than the standing that comes from knowing your field.
  "goal.authority": "Asiantuntijuus",
  "goal.leads": "Liidit",
  "goal.sales": "Myynti",
  "goal.recruiting": "Rekrytointi",
  "setup.justMe": "Vain minä",
  "setup.meFreelancer": "Minä ja freelancer",
  "setup.internalTeam": "Oma tiimi",
  "setup.agency": "Toimisto",
  "setup.branditect": "Branditect tuottaa sen",

  // ── Kanavat ▸ viisi kysymystä ─────────────────────────────────────────────
  "channels.q1": "Mihin alustoihin sitoudut seuraavaksi 90 päiväksi?",
  "channels.q1Why":
    "Strategia on alustan muotoinen. Ei TikTok-käsikirjoituksia, jos et ole TikTokissa.",
  "channels.q2": "Mitä some oikeasti tekee liiketoiminnalle juuri nyt?",
  "channels.q2Why":
    "Sama brändi tuottaa hyvin erilaista sisältöä, jos tavoite muuttuu. Tunnettuussisältö ≠ myyntisisältö.",
  "channels.q3": "Kuinka paljon pystyt oikeasti tuottamaan viikossa — ja kuka sen tekee?",
  "channels.q3Why":
    "Laadun rapautuminen on yleisin syy somestrategioiden epäonnistumiseen. Emme ehdota 15 reeliä viikossa, jos niitä tekee yksi ihminen läppärillä.",
  "channels.q4": "Nimeä 3–5 tiliä, joiden somea ihailet — omalta alaltasi tai sen läheltä.",
  "channels.q4Why":
    "Branditect tutkii niiden julkaisutahtia, formaattien jakaumaa ja aiheita. Ei kopioidakseen vaan nähdäkseen, miltä hyvä näyttää tässä kategoriassa.",
  "channels.q5": "Miltä et halua näyttää tai kuulostaa somessa?",
  "channels.q5Why":
    "Sen tietäminen mitä välttää on puolet brändissä pysymisestä. Tästä tulee kielto, jota vasten tekoäly tarkistaa jokaisen somejulkaisun, pysyvästi.",
  "channels.antiExample": "teennäisen haavoittuvat perustajapostaukset\nLinkedIn-syötiksi tehdyt listajutut",

  // ── Kanavat ▸ tarkistukset ────────────────────────────────────────────────
  "channels.errStart": "Aloitus epäonnistui",
  "channels.errPlatform": "Valitse vähintään yksi alusta.",
  "channels.errGoal": "Valitse päätavoite.",
  "channels.errCapacity": "Sekä määrä että tuotantotapa vaaditaan.",
  "channels.errMinAccounts": "Anna vähintään 3 tiliä.",
  "channels.errMaxAccounts": "Enintään 5 tiliä — valitse terävimmät.",
  "channels.errAntiPattern": "Kerro vähintään yksi vältettävä asia — yksikin riittää.",
  "channels.errSave": "Tallennus epäonnistui",

  // ── Kanavat ▸ tila ja eteneminen ──────────────────────────────────────────
  "channels.step2Ships":
    "Vaiheessa 2 tähän tulee valmis strategiadokumentti — sisältöpilarit, alustakohtaiset tyylioppaat, 30 päivän kalenteri ja vältettävien kortti. Vastauksesi on tallennettu.",
  "channels.working":
    "Luetaan brändistrategiasi → tutkitaan viitetilisi → ristiinluetaan tavoitteesi → rakennetaan pilarit → luonnostellaan esimerkit.",
  "channels.brandStrategy": "Brändistrategia",
  "channels.toneOfVoice": "Äänensävy",
  "channels.notSetUp": "ei vielä määritetty",
  "channels.voiceRules": "äänisäännöt, sanasto",
  "channels.proceedAnyway":
    "Voit jatkaa silti — mutta pilarit ja esimerkkijulkaisut terävöityvät, kun brändistrategia ja äänensävy on täytetty.",
  "channels.starting": "Aloitetaan…",
  "channels.resume": "Jatka",
  "channels.begin": "Aloita",
  "channels.generate": "Luo strategia",

  // ONE KEY, NOT FIVE, AND THIS IS THE POINT.
  //
  // The screen built this sentence by concatenating fragments around inline
  // emphasis: "…answers" + "who we are" + ". BrandTone answers" + "how we
  // sound" + … Each fragment was a separate string in the scan.
  //
  // That cannot be translated. Finnish puts the case ending where English puts
  // a preposition, and the verb lands in a different place, so the joins fall
  // in the wrong positions and the emphasis lands on the wrong words. It reads
  // as broken Finnish, not as a translation that needs polishing.
  //
  // Whoever wires this must render it as one string. If the emphasis matters,
  // mark it inside the string and parse it out — never by splitting the
  // sentence at the seams the English happens to have.
  "channels.whatThisAnswers":
    "Brändistrategia vastaa siihen, keitä olemme. BrandTone vastaa siihen, miltä kuulostamme. Tämä vastaa siihen, mitä julkaisemme keskiviikkona. Branditect tietää suurimman osan jo — tarvitsemme vain viisi asiaa aukkojen täyttämiseen.",

  // ══ MARKKINOINTISIVUSTO ══
  //
  // This is persuasion, not labelling, and it is translated as such. Several
  // lines are deliberately NOT literal — a marketing line that survives
  // word-for-word translation was usually not doing much work in English
  // either. Where a line is reshaped, the reason is on the line above it.
  //
  // Register is the same as the app: written form, singular "sinä". A Finnish
  // landing page that addresses one founder as "te" sounds like a bank.

  // ── Navigaatio ja yhteiset ────────────────────────────────────────────────
  "site.nav.howItWorks": "Miten se toimii",
  "site.nav.pricing": "Hinnoittelu",
  "site.nav.about": "Tietoa",
  "site.nav.logIn": "Kirjaudu sisään",
  "site.startFree": "Aloita ilmaiseksi",
  "site.mostPopular": "Suosituin",
  "site.threeTruths": "Brändin totuus · Tuotteen totuus · Kaupallinen totuus",
  // "Aivot" is plural-only in Finnish, so the singular "a brain" cannot carry
  // over. "Kaupalliset aivot" is the form a Finn would actually say.
  "site.notAGenerator": "Ei tekstigeneraattori. Kaupalliset aivot.",
  "site.commercialBrain": "Kaupalliset aivot",
  "site.checkEmail": "Tarkista sähköpostisi",
  "site.goToSignIn": "Siirry kirjautumaan",

  // ── Etusivu ───────────────────────────────────────────────────────────────
  "site.home.metaTitle": "Branditect · Brändisi kaupalliset aivot",
  "site.home.h1a": "Sinä pyörität yritystä.",
  "site.home.h1b": "Me teemme työn.",
  // "lives in your head … put it instead" does not survive literally: Finnish
  // has no neat equivalent of "instead" in this position. The contrast is kept
  // by ending on where it goes rather than on the word.
  "site.home.sub": "Koko yrityksesi on pääsi sisällä. Branditect on paikka, jonne se kuuluu.",
  "site.home.cta": "Aloita rakentaminen Branditectillä ilmaiseksi jo tänään.",
  "site.home.noCard": "Ei korttia. Brändisi aivot jäävät sinulle.",
  "site.home.askIt": "Kysy siltä",
  "site.home.itAnswers": "Se vastaa",
  "site.home.secHome": "Etusivu.",
  "site.home.secProducts": "Tuotteet.",
  "site.home.secStudio": "Studio.",
  "site.home.yourStrategy": "Strategiasi.",
  "site.home.yourProductKnowledge": "Tuotetietosi.",
  "site.home.yourTrueNumbers": "Oikeat lukusi.",
  "site.home.q25": "Vastaat 25 kysymykseen. Ei ”mikä on missiosi”. Miksi aloitit, kuka olet",
  "site.home.step1": "Kerro mikä brändi on",
  "site.home.step1Body":
    "Kaksikymmentä kysymystä rakentaa strategiasi ja äänensävysi. Viisi niistä avaa työtilan. Loput saavat odottaa.",
  "site.home.step2": "Anna sille se, minkä tiedät",
  "site.home.step2Body":
    "Tuotteet, dokumentit, kuvat ja linkit. Kaikki lataamasi luetaan ja indeksoidaan, eikä se osa maksa koskaan krediittiä.",
  "site.home.step3": "Saat työtä takaisin",
  "site.home.step3Body":
    "Tekstiä sinun äänelläsi ja sinun faktoihisi nojaten, kuvia sinun valossasi, ja tarjouksia jotka kunnioittavat alarajaasi.",
  "site.home.gaps": "Isot brändit paikkaavat nuo aukot ihmisillä.",
  "site.home.gapsPunch": "Heillä on markkinointitiimi. Sinulla on Branditect.",
  "site.home.readWhole": "Lue koko juttu",
  "site.home.getStartedFree": "Aloita ilmaiseksi!",
  // "no countdown" → "ei kelloa": a countdown clock is the image, and Finnish
  // "ei ajastinta" reads like a kitchen timer.
  "site.home.freeTerms":
    "Sata krediittiä, ei korttia, ei kelloa. Maksa vasta kun haluat sen tekevän töitä puolestasi.",
  "site.home.everyPlan": "Kaikki tilaukset rinnakkain, ja mitä yhdellä krediitillä saa",

  // ── Hinnoittelu ───────────────────────────────────────────────────────────
  "site.pricing.metaTitle": "Hinnoittelu · Branditect",
  "site.pricing.freeToBuild": "Rakentaminen on ilmaista.",
  "site.pricing.monthly": "Kuukausittain",
  "site.pricing.yearly": "Vuosittain",
  "site.pricing.whatIsCredit": "Mikä on krediitti?",
  "site.pricing.action": "Toiminto",
  "site.pricing.cost": "Hinta",
  "site.pricing.topUp": "Jos ne loppuvat kesken kuun, voit lisätä",
  "site.pricing.sideBySide": "Kaikki rinnakkain",
  "site.pricing.buildFree": "Rakenna aivot ilmaiseksi.",
  "site.pricing.readWhatItDoes": "Lue mitä se tekee",

  // ── Tietoa ────────────────────────────────────────────────────────────────
  "site.about.metaTitle": "Tietoa · Branditect",
  "site.about.whatThisIs": "Mistä on kyse",
  "site.about.threeQuestions":
    "Kolme kysymystä, joihin jokaisen brändin on vastattava. Vastaa niihin kerran.",
  "site.about.threeTruthsBody":
    "Kolmenlaista totuutta yhdessä paikassa, ja jokainen niistä on kaiken muun käytettävissä.",

  "site.about.brandTruth": "Brändin totuus",
  "site.about.brandTruthBody":
    "Strategiasi, asemointisi, äänensävysi ja visuaalinen ilmeesi, kirjattuna kerran ja käytössä kaikessa, mitä teet sen jälkeen.",
  "site.about.productTruth": "Tuotteen totuus",
  "site.about.productTruthBody":
    "Jokainen tuote, sen tiedot ja ne väitteet, jotka pystyt todistamaan. Jos jotain lukua ei ole siellä, mikään ei kirjoita sitä.",
  "site.about.commercialTruth": "Kaupallinen totuus",
  "site.about.commercialTruthBody":
    "Kokonaishankintahinta, oikea kate, alaraja ja suurin alennus, jonka annat. Se osa, joka ratkaisee, kannattiko työ.",

  "site.about.howItWorks": "Miten se toimii",
  "site.about.defineFeedMake": "Määritä, syötä, tee.",
  "site.about.define": "Määritä",
  "site.about.feed": "Syötä",
  "site.about.make": "Tee",

  "site.about.fourDecisions": "Neljä päätöstä, joista emme tingi.",
  "site.about.fourDecisionsBody":
    "Nämä ovat niitä, joita olisi helppo pehmentää ja kallista menettää.",
  "site.about.closedBook": "Suljettu kirja",
  "site.about.closedBookBody":
    "Se kirjoittaa siitä, minkä annoit sille, eikä mistään muusta. Pyydä tuotetta, jota siellä ei ole, ja se sanoo niin sen sijaan että keksisi sellaisen.",
  "site.about.sourcedClaims": "Väitteillä on lähde",
  "site.about.sourcedClaimsBody":
    "Jokainen kova fakta luonnoksessa kantaa mukanaan lähteensä. Ilmoittamaton luku on juuri se virhe, jonka estämiseksi tämä koko järjestelmä on olemassa.",
  "site.about.marginAwareness": "Kate tiedossa",
  "site.about.marginAwarenessBody":
    "Tarjoukset ja alennukset tarkistetaan alarajaasi vasten ennen kuin näet ne, joten mikään ei ehdota hintaa, jolla häviät rahaa.",
  "site.about.staysYours": "Brändisi pysyy sinun",
  "site.about.staysYoursBody":
    "Tiedostosi, strategiasi ja lukusi kuuluvat sinulle. Järjestelmästä lähtee ulos vain yhtä reittiä, ja sinä lähetät sen tietoisesti.",

  "site.about.whoItIsFor": "Kenelle se on.",
  "site.about.forYouIf": "Sinulle, jos",
  "site.about.for1": "Myyt jotain tiettyä ja tiedät, mitä se sinulle maksaa",
  "site.about.for2": "Brändipäätöksesi ovat pääsi sisällä tai yhdessä vanhassa esityksessä",
  "site.about.for3": "Kirjoitat tekstit itse ja olet kyllästynyt selittämään brändin joka kerta",
  "site.about.for4": "Olet polttanut näppisi työkaluun, joka keksi tuotteelle ominaisuuden",
  "site.about.for5":
    "Pyörität yhtä brändiä kunnolla, tai muutamaa jotka eivät saa sekoittua keskenään",
  "site.about.notForYouIf": "Ei sinulle, jos",
  "site.about.not1": "Haluat sisältöä paljon etkä välitä, mistä faktat tulivat",
  "site.about.not2": "Sinulla ei ole vielä tuotteita eikä mitään, mistä olla rehellinen",
  "site.about.not3": "Tarvitset design-työkalun. Tämä päättää mitä sanotaan, ei miltä se näyttää",
  "site.about.not4": "Haluat chatbotin ilman määrittelyä. Ne viisi kysymystä ovat koko idea",
  "site.about.not5":
    "Tarvitset laskutusta, alv-ilmoituksia tai kirjanpitoa. Laskurit on katteesta, ei kirjanpidosta",

  "site.about.theCompany": "Yritys",
  "site.about.builtInFinland": "Rakennettu Suomessa.",
  "site.about.whereItRuns": "Missä se pyörii",
  "site.about.whereItRunsBody":
    "Tietosi säilytetään EU:n infrastruktuurissa, ja käsittelemme niitä GDPR:n mukaisesti antamasi aineiston käsittelijänä.",
  "site.about.whoOwnsIt": "Kuka omistaa",
  "site.about.whoOwnsItBody":
    "Tiedostosi, strategiasi ja kaikki tekemäsi pysyvät sinun. Sulje tili, ja saat ne mukaasi.",
  "site.about.reachUs": "Mistä meidät tavoittaa",
  "site.about.answerThree": "Vastaa kolmeen kysymykseen.",
  "site.about.seePlans": "Katso tilaukset",

  "site.about.altStudio":
    "Branditectin Studio-rivi: kortit tekstien kirjoittamiseen, kuvien luomiseen, lukujen laskemiseen ja brändimateriaalien käyttöön.",
  "site.about.altNumbers":
    "Branditectin Laskurit-osio, jossa on kolme laskuria kokonaishankintahinnan, katteen ja alarajan laskemiseen.",

  // ══ SIVUSTO, toinen kierros ══
  //
  // NO EM DASHES ANYWHERE BELOW. The public site bans them and the first round
  // put one into site.about.brandTruthBody. Finnish does not need one: a comma
  // or a full stop carries the same break, and ajatusviiva is the same
  // machine-written tell in Finnish that the em dash is in English.

  // ── Kolme katkennutta ─────────────────────────────────────────────────────
  "site.home.q25full":
    "Vastaat 25 kysymykseen. Ei ”mikä on missiosi”. Miksi aloitit, kenelle oikeasti teet, mitä et koskaan väitä edes kaupan hinnalla. Branditect kääntää vastaukset strategian perustaksi: asemointi, kohderyhmä, ääni, antiääni ja väitesääntösi.",
  "site.pricing.topUpFull":
    "Jos ne loppuvat kesken kuun, voit lisätä {topUp} yhdellä klikkauksella tai odottaa seuraavaa kuuta. Mitään ei poisteta eikä mikään lakkaa toimimasta. Brändiaivosi pysyvät luettavissa kummassakin tapauksessa.",
  // Finnish reverses the English order: the owner comes first, the noun last.
  // So the <br/> in the heading belongs after "Brändisi", not in the middle of
  // the phrase where the English breaks it.
  "site.pricing.h1": "Brändisi kaupalliset aivot.",

  // ── Etusivu: hero ja luottamus ────────────────────────────────────────────
  "site.home.lede":
    "Kaupalliset aivot tuote- ja verkkokauppabrändeille. Se pitää strategiasi, tuotetotuutesi ja katteesi yhdessä, joten kaikki mitä julkaiset on brändin mukaista, paikkansapitävää ja kannattavaa. Se kirjoittaa tekstisi tuntien jokaisen tuotteesi, äänensävysi ja tyylisi. Ja tekee kuvasi siinä samalla. Se on kuin",
  "site.home.trust1": "Ilmainen ikuisesti",
  "site.home.trust2": "Ei korttia aloittamiseen",
  "site.home.trust3": "100 krediittiä kaiken kokeiluun",
  "site.home.trust4": "Tietosi pysyvät EU:ssa",

  // ── Etusivu: roolit ───────────────────────────────────────────────────────
  "site.home.role1": "Strategi, joka päättää mitä brändi edustaa ja mitä se ei koskaan sano",
  "site.home.role2": "Tuotepäällikkö, joka hallitsee jokaisen tuotteen, yksityiskohdan ja hinnan",
  // "the same way twice" is the joke, and it survives: kahdesti samalla tavalla.
  "site.home.role3": "Copywriter, joka osaa kirjoittaa sen kahdesti samalla tavalla",
  "site.home.role4": "Suunnittelija ja valokuvaaja, jotka tekevät kuvat ennen kuin kukaan ehtii pyytää",
  "site.home.role5":
    "Joku joka pitää kirjastoa: jokainen tuotekuva, video ja logo, joka formaatissa ja rajauksessa",
  "site.home.role6":
    "Yhteinen levyasema, jota yhden ihmisen pitäisi ylläpitää täysipäiväisesti, eikä yleensä ylläpidä",

  // ── Etusivu: kolme korttia ────────────────────────────────────────────────
  "site.home.card1Ask": "Kenelle tämä oikeasti on, ja miten heille pitäisi puhua?",
  "site.home.card1Answer":
    "Asiakassegmenttisi yhtenä kappaleena, jonka voisit antaa freelancerille, se laukaisija joka saa heidät ostamaan, valitsemasi ääni, ja ne neljä väitettä jotka omat sääntösi estävät. Kaikki tämän jälkeen tuotettu noudattaa sitä, ja siitä kaksi seuraavaa korttia kertovat.",
  "site.home.card2Ask":
    "Kirjoita julkaisu ja tuoteluettelon teksti tuotteille SKU 12 ja SKU 14, ja etsi kaikki niihin liitetyt kuvat.",
  "site.home.card2Answer":
    "Molemmat formaatit, sinun äänelläsi, kirjoitettuna sille segmentille jonka määritit ensimmäisessä kortissa. Kolme todennettua myyntiargumenttia ja dokumentti, josta kukin on peräisin. Kaksi väitettä estettynä todisteiden puutteesta. Yksitoista kuvaa kahdelle tuotteelle, ja niistä viisi merkittynä vähittäismyyntiin hyväksytyiksi.",
  "site.home.card3Ask": "Voinko antaa tästä tuotteesta 25 prosentin alennuksen?",
  "site.home.card3Answer":
    "Et nykyisellä kustannuksella. Alarajasi on 21 prosenttia, ja se muuttui kun pakkaus kallistui maaliskuussa. Kirjoitetaanko kampanja 21 prosenttiin?",

  // ── Alatunniste ───────────────────────────────────────────────────────────
  "site.footer.contact": "Yhteystiedot",
  "site.footer.madeIn": "Tehty Suomessa",

  // ── Tilaukset ─────────────────────────────────────────────────────────────
  "plan.free.name": "Ilmainen",
  "plan.free.who": "Rakenna aivot. Pidä ne niin kauan kuin haluat.",
  "plan.free.vatLine": "Ei korttia",
  "plan.free.credits": "100 krediittiä",
  "plan.free.creditsLabel": "Kertaluonteinen, ei vanhene",
  "plan.free.f1": "Brändin totuus. Strategia, asemointi, äänensävy, visuaalinen ilme",
  "plan.free.f2": "Tuotteen totuus. Jokainen tuote, sen tiedot ja väitteet jotka pystyt todistamaan",
  "plan.free.f3": "Kaupallinen totuus. Kokonaishankintahinta, kate, alaraja, alennusrajat",
  "plan.free.f4": "Jokainen lataamasi tiedosto luettuna ja indeksoituna, ilmaiseksi",
  "plan.free.f5": "Brändin valmius, jotta tiedät mitä vielä puuttuu",
  "plan.free.f6": "1 brändi, 200 Mt. Aina sinun luettavissasi",

  "plan.pro.who": "Yrittäjälle, joka pyörittää yhtä brändiä kunnolla.",
  "plan.pro.credits": "350 krediittiä",
  "plan.everyMonth": "Joka kuukausi",
  "plan.pro.cta": "Aloita ilmaiseksi, päivitä myöhemmin",
  "plan.pro.f1": "Koko aivot, nyt sinun töissäsi",
  "plan.pro.f2": "Tekstiä joka nojaa omiin tuotetietoihisi ja näyttää mistä jokainen luku tuli",
  "plan.pro.f3": "Tarjoukset ja alennukset tarkistettuna alarajaasi vasten ennen kuin näet ne",
  "plan.pro.f4": "Kuvia sinun valossasi, omista referensseistäsi",
  "plan.pro.f5": "Kysy aivoilta mitä vain. Ne ovat lukeneet kaiken minkä annoit",
  "plan.pro.f6": "Brändipakettisi linkki freelancereille ja painoille",
  "plan.pro.f7": "1 brändi, 1 käyttäjä, 5 Gt",

  "plan.proplus.who": "Toimistoille ja kaikille, jotka pyörittävät useampaa kuin yhtä brändiä.",
  "plan.proplus.credits": "600 krediittiä",

  "plan.ent.who": "Brändiportfolioille ja isommille tiimeille.",
  "plan.ent.vatLine": "Hinta sen mukaan mitä tarvitset",
  "plan.ent.credits": "Sovitaan",
  "plan.ent.creditsLabel": "Sovitaan kanssasi",
  "plan.ent.cta": "Ota yhteyttä",
  "plan.ent.f1": "Rajattomasti brändejä ja käyttäjiä",
  "plan.ent.f2": "Kertakirjautuminen",
  "plan.ent.f3": "Räätälöity tietosopimus",
  "plan.ent.f4": "Nimetty yhteyshenkilö, ei jonoa",
  "plan.ent.f5": "Rakennamme aivot yhdessä kanssasi",

  // ── Vertailutaulukko ──────────────────────────────────────────────────────
  "cmp.price": "Hinta sis. alv, kuukaudessa",
  "cmp.credits": "Krediitit",
  "cmp.brands": "Brändit",
  "cmp.seats": "Käyttäjät",
  "cmp.storage": "Tallennustila",
  "cmp.kitLink": "Brändipaketin jakolinkki",
  "cmp.support": "Tuki",
  "cmp.onceOnly": "100 kerran",
  "cmp.perMonth350": "350/kk",
  "cmp.perMonth600": "600/kk",
  "cmp.agreed": "Sovitaan",
  "cmp.unlimited": "Rajaton",
  "cmp.yes": "Kyllä",
  "cmp.no": "Ei",
  "cmp.docs": "Ohjeet",
  "cmp.email": "Sähköposti",
  "cmp.emailPriority": "Sähköposti, etusija",
  "cmp.namedContact": "Nimetty yhteyshenkilö",

  // ── Mitä krediitillä saa ──────────────────────────────────────────────────
  "credit.image": "Yksi kuva",
  "credit.image.cost": "5 krediittiä",
  "credit.copy": "Kolmen tekstiluonnoksen sarja",
  "credit.copy.cost": "2 krediittiä",
  "credit.question": "Yksi kysymys brändiaivoillesi",
  "credit.question.cost": "1 krediitti",
  "credit.indexing": "Minkä tahansa lataamasi tiedoston lukeminen ja indeksointi",
  "credit.indexing.cost": "Ilmaista",
  // Finnish puts the unit after the number and uses a space before the symbol.
  "credit.topUp": "9 € 200 lisäkrediitistä",

  // ══ SIVUSTO, kolmas kierros ══ No em dashes. Placeholders kept verbatim.

  // ── Tietoa: leipäteksti ───────────────────────────────────────────────────
  "site.about.opening":
    "Mitä me edustamme. Mitä tarkalleen myymme. Mitä meillä on varaa veloittaa. Vastaukset ovat jo olemassa, hautautuneina esitykseen jota kukaan ei avaa, sähköpostilaatikkoon josta kukaan ei hae ja taulukkoon jota yksi ihminen ylläpitää. Branditectissä ne ovat yhdessä paikassa.",
  "site.about.homeCaption":
    "Yksi näkymä, joka tietää kuinka paljon brändistäsi on kirjattu ylös ja mitä vielä puuttuu. Se kertoo diagnoosin, ei kehua.",
  "site.about.asteriskCaption":
    "Katso tähteä katesarakkeessa. Se on järjestelmän tapa kertoa, että luku on arvio koska kokonaishankintahinta puuttuu. Mieluummin se myöntää sen kuin liioittelee katettasi hiljaa.",
  "site.about.threeVerbs":
    "Kolme verbiä järjestyksessä. Jokainen näkymä kuuluu tasan yhteen niistä, eikä mitään sellaista jota ei voi sijoittaa yhteenkään rakenneta.",
  "site.about.defineBody":
    "Kaksikymmentä kysymystä rakentaa strategiasi, äänensävysi ja visuaalisen ilmeesi. Viisi niistä riittää avaamaan työtilan. Loput saavat odottaa.",
  "site.about.feedBody":
    "Tuotteet, dokumentit, kuvat, linkit. Kaikki lataamasi luetaan ja indeksoidaan, eikä se osa maksa koskaan krediittiä.",
  "site.about.makeBody":
    "Kaikki Studiossa lukee samoja aivoja. Millään täällä ei ole omaa erillistä käsitystä siitä, mikä brändisi on.",
  // "five points" is percentage points, and Finnish has to say which:
  // "prosenttiyksikköä", never "prosenttia". Getting this wrong turns a real
  // number into a different real number.
  "site.about.marginMath":
    "Katteet lasketaan verottomina ja kokonaishankintahintaa vasten, ei koskaan tehdashintaa bruttohintaa vasten. Ero on noin viisi prosenttiyksikköä, ja se on ero tuotteen välillä jonka luulet olevan kannattava ja sellaisen joka on.",
  "site.about.secondColumn":
    "Toinen sarake ei ole vaatimattomuutta. Se on se, mikä tekee ensimmäisestä uskottavan, ja se säästää meiltä molemmilta yhden keskustelun.",
  "site.about.oneInbox": "Yksi postilaatikko, jota lukevat ne jotka tämän rakentavat.",
  "site.about.fourMinutes":
    "Noin neljä minuuttia niihin viiteen, joilla on väliä. Sata krediittiä, ei korttia, eikä mikään vanhene.",
  "site.about.altHome":
    "Branditectin etusivu brändille nimeltä Ruffle Studio: brändin valmius neljine tarkistuksineen, luvut aivojen lukemista tiedostoista ja Studion työkalut alla.",
  "site.about.altProducts":
    "Ruffle Studion Tuotteet-näkymä, jossa jokainen tuote kustannuksineen, hintoineen ja oikeine katteineen, ja yksi kateluku merkittynä tähdellä.",

  // ── Tietoa: metatiedot ja OG ──────────────────────────────────────────────
  "site.about.metaDesc":
    "Branditect on yksi paikka, joka tietää brändistrategiasi, tuotteesi ja katteesi, ja tekee niistä asioita. Rakennettu Suomessa, EU:n infrastruktuurissa.",
  "site.about.ogSub":
    "Yksi paikka, joka tietää strategiasi, tuotteesi ja katteesi, ja tekee niistä asioita.",
  "site.about.ogTag": "Mikä se on, mitä se ei tee, ja kenelle se on.",

  // ── Etusivu: metatiedot ja OG ─────────────────────────────────────────────
  "site.home.metaDesc":
    "Yksi paikka, joka pitää strategiasi, tuotetotuutesi ja katteesi, joten kaikki mitä julkaiset on brändin mukaista, paikkansapitävää ja kannattavaa. Rakenna se ilmaiseksi.",
  "site.home.ogSub":
    "Yksi paikka, joka pitää strategiasi, tuotetotuutesi ja katteesi. Rakenna se ilmaiseksi.",
  "site.home.ogTag": "Yksi paikka, joka tietää strategiasi, tuotteesi ja katteesi.",

  // ── Hinnoittelu: metatiedot ja OG ─────────────────────────────────────────
  "site.pricing.metaDesc":
    "Rakenna brändiaivosi ilmaiseksi, sadalla krediitillä ja ilman korttia. Tilaukset alkaen {FROM} kuukaudessa, sis. alv.",
  "site.pricing.ogSub":
    "Rakenna brändiaivosi ilmaiseksi. Tilaukset alkaen {FROM} kuukaudessa, sis. alv.",
  "site.pricing.ogTag": "Rakenna ilmaiseksi. Maksa kun haluat sen tekevän töitä puolestasi.",

  // ── Etusivu ───────────────────────────────────────────────────────────────
  "site.home.ledeFull":
    "Kaupalliset aivot tuote- ja verkkokauppabrändeille. Se pitää strategiasi, tuotetotuutesi ja katteesi yhdessä, joten kaikki mitä julkaiset on brändin mukaista, paikkansapitävää ja kannattavaa. Se kirjoittaa tekstisi tuntien jokaisen tuotteesi, äänensävysi ja tyylisi. Ja tekee kuvasi siinä samalla. Se on kuin sinulla olisi huippuluokan markkinointitiimi takanasi.",
  "site.home.altHome":
    "Branditectin etusivu brändille nimeltä Ruffle Studio: brändin valmiuspisteet neljine tarkistuksineen, luvut aivojen lukemista dokumenteista ja kuvista, ja rivi Studion työkaluja.",
  "site.home.homeCaption":
    "Brändin valmius kertoo mitä vielä puuttuu, ja Studio-rivi on se mitä voit tehdä sillä minkä aivot jo tietävät. Mikään tällä näytöllä ei ole arvaus.",
  "site.home.eachUsable":
    "Jokainen niistä on kaikkien muiden käytettävissä, ja siinä on koko ero brändiaivojen ja dokumenttikansion välillä.",
  "site.home.altProducts":
    "Ruffle Studion Tuotteet-näkymä, jossa jokainen tuote kustannuksineen, hintoineen ja oikeine katteineen, ja yksi kateluku tähdellä merkittynä.",
  "site.home.sameBrain":
    "Kaikki täällä lukee samoja aivoja. Millään ei ole omaa erillistä käsitystä siitä, mikä brändisi on.",
  "site.home.builtBy":
    "Rakentanut tiimi, joka on viettänyt kaksi vuosikymmentä brändien parissa ympäri maailmaa. Tehty Suomessa.",
  "site.home.notInstincts":
    "Isolla brändillä ei ole parempaa vaistoa kuin sinulla. Sillä on strategia ja infrastruktuuri.",
  "site.home.givesYouBoth":
    "Branditect antaa sinulle molemmat, olitpa missä vaiheessa tahansa. Ensimmäinen tuote tai neljässadas. Teet edelleen jokaisen päätöksen. Lakkaat vain tekemästä niitä muistin varassa.",
  "site.home.fourMinutes":
    "Noin neljä minuuttia niihin viiteen, joilla on väliä. Sata krediittiä, ei korttia, eikä mikään vanhene.",

  // ── Hinnoittelusivu ───────────────────────────────────────────────────────
  "site.pricing.lede":
    "Branditect muuttaa hajallaan olevat tiedostosi, päätöksesi ja lukusi yhdeksi tietokerrokseksi, joka tuntee strategiasi, tuotteesi ja katteesi. Rakenna koko juttu ilmaiseksi. Maksa kun haluat sen tekevän töitä puolestasi.",
  "site.pricing.billingPeriod": "Laskutusjakso",
  "site.pricing.twoMonthsFree": "2 kuukautta ilmaiseksi",
  "site.pricing.plans": "Tilaukset",
  "site.pricing.vatYearly": "Sis. alv, laskutetaan {yearlyTotal} vuodessa",
  "site.pricing.vatLine": "Sis. alv {VAT_RATE}",
  "site.pricing.letsTalk": "Jutellaan",
  "site.pricing.creditIs":
    "Yksi yksikkö työtä, jonka aivot tekevät puolestasi. Lataamasi aineiston lukeminen ja indeksointi on aina ilmaista, koska aivot jotka laskuttavat oppimisesta ovat väärän muotoiset.",
  "site.pricing.freeHomeCaption":
    "Tämä on etusivusi ilmaisella tilauksella. Brändin valmius vasemmalla, mitä aivot ovat lukeneet oikealla, ja alla se mitä voit niillä tehdä.",
  "site.pricing.altHome":
    "Branditectin etusivu brändille nimeltä Ruffle Studio: brändin valmiuspisteet neljine tarkistuksineen, luvut aivojen lukemista dokumenteista ja kuvista, ja rivi Studion työkaluja.",
  "site.pricing.readinessIs":
    "Brändin valmius on neljä tarkistusta, kukin neljäsosan arvoinen. Se kertoo mitä puuttuu sen sijaan että onnittelisi sinua, koska pistemäärä jonka voi ennustaa on arvokkaampi kuin sellainen joka näyttää tarkalta.",

  // ── Yhteiset ──────────────────────────────────────────────────────────────
  "site.perMonth": "/kk",
  "site.signUpOrLogIn": "Luo tili tai kirjaudu sisään",
  "site.ogTitle": "Branditect, brändisi kaupalliset aivot",

  // ── Tilaukset: loput ──────────────────────────────────────────────────────
  "plan.everythingInPro": "Kaikki Prosta, ja lisäksi",
  "plan.proplus.f1": "3 brändiä, kullakin oma totuutensa. Ne eivät koskaan sekoitu keskenään",
  "plan.proplus.f2": "3 käyttäjää, jotta tiimisi kirjoittaa samoista aivoista",
  "plan.proplus.f3": "20 Gt",
  "plan.proplus.f4": "Etusijainen tuki",
  // Finnish uses Mt and Gt, not MB and GB. A Finnish page that says "200 MB"
  // reads as untranslated, and it is the kind of thing a reader notices first.
  "plan.storage200mb": "200 Mt",
  "plan.storage5gb": "5 Gt",
  "plan.storage20gb": "20 Gt",

  // ══ SOVELLUS, erä A ══ Etusivu, koko Laskurit-osio, aloitusvirta,
  // muistiinpanot ja tervetulomodaali.

  // ── Etusivu ───────────────────────────────────────────────────────────────
  "home.writeDesc": "Brändin mukaan, strategian mukaan, faktojen mukaan.",
  "home.imagesDesc": "Uusia kuvia tuotteistasi ja tyylistäsi.",
  "home.numbersTitle": "Laske luvut",
  "home.numbersDesc": "Kannattavuus, hinnoittelu ja tarjoukset.",
  "home.visualDesc": "Logosi, värisi ja kirjasimesi.",
  "home.prompt1": "Mistä minun kannattaisi julkaista tällä viikolla?",
  "home.prompt2": "Kuinka suuren alennuksen voin antaa?",
  "home.prompt3": "Mitä brändistäni puuttuu?",

  // ── Laskurit: kenttien nimet ──────────────────────────────────────────────
  "num.productionCost": "Tuotantokustannus",
  "num.freightDuty": "Rahti ja tulli",
  "num.packaging": "Pakkaus",
  "num.shipping": "Toimitus",
  "num.returnsRate": "Palautusprosentti",
  "num.refundRate": "Hyvitysprosentti",
  "num.churnRate": "Poistuma",
  "num.paymentFees": "Maksukulut",
  "num.adCostPerSale": "Mainoskulu per kauppa",
  "num.cartonPallet": "Laatikko tai lava",
  "num.paymentTerms": "Maksuehdot",
  "num.storeCommission": "Kaupan provisio %",
  "num.resellerCommission": "Jälleenmyyjän provisio",
  "num.retailPrice": "Myyntihinta",
  "num.taxRate": "Verokanta",
  "num.costPerUnit": "Yksikkökustannus",
  "num.targetMargin": "Tavoitekate",
  "num.minMargin": "Vähimmäiskate",
  "num.monthlyPrice": "Kuukausihinta",
  "num.costToAcquire": "Hankintakustannus",

  // ── Laskurit: etusivu ─────────────────────────────────────────────────────
  "num.costLede": "Tiedä mitä jokainen kauppa oikeasti maksaa.",
  "num.costSub":
    "Kaikki mitä yhden yksikön toimittaminen asiakkaalle vaatii, ja mitä tapahtuu kun jokin kustannus muuttuu.",
  "num.priceLede": "Löydä hinta, joka antaa haluamasi katteen.",
  "num.priceSub":
    "Aseta tavoitekate ja saat hinnan joka osuu siihen, tai kirjoita hinta ja näe mitä sinulle oikeasti jää verojen ja kulujen jälkeen.",
  "num.offersLede": "Tiedä paljonko voit antaa pois ennen kuin se sattuu.",
  "num.offersSub":
    "Mallinna ne tarjoukset joita oikeasti teet, ja löydä missä kohtaa kukin lakkaa kannattamasta.",
  "num.recurringLede": "Näe mitä asiakas on ajan mittaan arvoinen.",
  "num.recurringSub":
    "MRR, poistuma ja elinkaariarvo, ja kuinka kauan kestää ansaita takaisin se mitä asiakkaan hankkimiseen meni.",
  "num.discountCeiling": "Alennuskatto",
  "num.freeShipThreshold": "Ilmaisen toimituksen raja",
  "num.averageBasket": "Keskiostos",
  "num.noLandedCost": "Kokonaishankintahintaa ei ole vielä kirjattu",
  "num.noPrice": "Hintaa ei ole vielä kirjattu",
  "num.usesPriceHere": "Käyttää tässä asettamaasi hintaa",
  "num.shownBecauseSubscription": "Näkyy koska veloitat tilausmaksua",
  "num.indexLede":
    "Selvitä mitä oikeasti tienaat jokaisesta kaupasta, aseta hinnat jotka osuvat tavoitekatteeseesi, ja rakenna tarjouksia jotka eivät hiljaa maksa sinulle rahaa. Sen jälkeen",
  "num.allCosted": "kaikki kustannettu",
  "num.missingCosts": "{missing} kustannusta puuttuu",
  "num.noCostedProducts": "ei kustannettuja tuotteita",
  "num.addRunningCostsInline": "lisää juoksevat kulut",
  "num.atYourBestMargin": "parhaalla katteellasi",
  "num.physicalGoods": "Fyysiset tuotteet",
  "num.digitalAccess": "Digitaaliset ja käyttöoikeudet",
  "num.subscription": "Tilaus",
  "num.allThatApply": "kaikki jotka pätevät",
  "num.ownSite": "Oma verkkokauppa",
  "num.wholesale": "Tukkumyynti",
  "num.appStore": "Sovelluskauppa",
  "num.overheadExplainer":
    "Vuokra, palkat, ohjelmistot ja markkinointi eivät välitä siitä paljonko myyt. Laske ne yhteen kerran, jaettuna kaikille tuotteille, ja Branditect laskee sen määrän joka kattaa ne sekä oikean alarajahintasi.",
  "num.addRunningCostsNote":
    "Lisää juoksevat kulusi, niin tästä tulee oikea luku. Ilman niitä alaraja on vain puoli alarajaa.",
  "num.noPricedProduct": "Yhdelläkään tuotteella ei ole vielä sekä hintaa että kustannusta.",
  "num.everySaleLoses":
    "Jokainen kauppa on näillä hinnoilla tappiollinen, joten mikään määrä ei kata yleiskuluja. Korjaa ensin hinta tai kustannus.",
  "num.addRunningCosts": "Lisää juoksevat kulut",
  "num.costOfEachSale": "kunkin kaupan kustannus",
  // Finnish accounting has exact terms for these. Using an approximation here
  // would make the figures unrecognisable to anyone who reads a Finnish P&L.
  "num.grossProfit": "myyntikate",
  "num.runningCosts": "juoksevat kulut",
  "num.operatingProfit": "liikevoitto",
  "num.notAdvice":
    "Nämä ovat laskelmia syöttämistäsi luvuista, eivät neuvoja. Tarkista ne omaa kirjanpitoasi vasten ennen kuin muutat hintaa. Verokohtelu ja alustojen maksut vaihtelevat markkinoittain ja voivat siirtää katetta useita prosenttiyksikköjä.",

  // ── Laskurit: kustannus ───────────────────────────────────────────────────
  "num.cost.fromChannels":
    "Nämä rivit tulevat siitä, miten kerroit myyväsi. Korostetut lisättiin kanaviesi perusteella, ja voit muuttaa niitä kohdassa",
  "num.cost.onNumbers": "Laskureissa.",
  "num.cost.sellingDirect": "suoramyynti",
  "num.cost.addedBy": "lisännyt {from}",
  "num.cost.spreadAcross": "Jaettuna",
  "num.cost.unitsInBatch": "yksikölle erässä, jos nämä ovat eräkustannuksia",
  "num.cost.costToServeOne": "Yhden palvelemisen kustannus",
  "num.cost.fillLeft":
    "Täytä rivit vasemmalla. Prosentit eivät ole summassa mukana: ne muuttavat kaupan kustannusta, mutta eivät ole yhteenlaskettavia.",
  "num.cost.entered":
    "{filled}/{costable} kuluriviä täytetty. Tämä on se luku, joka menee tuotekortin kokonaishankintahintaan.",
  "num.cost.landedNotFactory":
    "Kate lasketaan kokonaishankintahinnasta, ei tehdashinnasta. Pelkkä tehdashinta liioittelee katetta noin viidellä prosenttiyksiköllä, ja väärään lukuun rakennettu alennussääntö syö erotuksen jokaisessa kampanjassa.",

  // ── Laskurit: hinnoittelu ─────────────────────────────────────────────────
  "num.price.haveAPrice": "Minulla on hinta",
  "num.price.haveATarget": "Minulla on tavoitekate",
  "num.price.landedHint": "kokonaishankintahinta, ei tehdashinta",
  "num.price.taxHint": "jos tyhjä, myyntihinta tulkitaan verottomaksi",
  "num.price.grossHint": "brutto, se minkä asiakas maksaa",
  "num.price.marginAtPrice": "Kate tällä hinnalla",
  "num.price.enterCostPrice": "Syötä kustannus ja hinta.",
  "num.price.losesMoney": "Tällä hinnalla häviät rahaa jokaisessa kaupassa.",
  "num.price.priceForMargin": "Hinta {tgt} prosentin katteelle",
  "num.price.enterCostTarget": "Syötä kustannus ja tavoitekate.",
  "num.price.netOfTax":
    "Kate lasketaan aina verottomana kokonaishankintahintaa vasten. Bruttohinnan vertaaminen tehdashintaan on imarteleva versio, ja se on väärässä noin viidellä prosenttiyksiköllä.",

  // ── Laskurit: tarjoukset ──────────────────────────────────────────────────
  "num.offers.ceilingNote":
    "Se katto johon päädyt on raja, jonka sisällä Studio kirjoittaa. Se ei lupaa suurempaa alennusta kuin tuote sallii.",
  "num.offers.lineYouWontCross": "raja jota et ylitä",
  "num.offers.discountWanted": "Alennus jonka haluat antaa",
  "num.offers.belowMinimum":
    "Se alittaa {mm} prosentin vähimmäiskatteesi, eikä Studio kirjoittaisi tätä tarjousta.",
  "num.offers.clearsMinimum": "Tämä ylittää vähimmäiskatteesi.",
  "num.offers.deepest": "Suurin alennus jonka voit antaa",
  "num.offers.enterThree": "Syötä hinta, kustannus ja vähimmäiskate.",
  "num.offers.alreadyAtFloor":
    "Hinnalla {currency} tuote on jo {mm} prosentin alarajallaan. Mikä tahansa alennus rikkoo sen.",
  "num.offers.perProduct":
    "Rajat ovat tuotekohtaisia. 6 euron pidike ei voi kantaa 99 euron alarajaa, joten tämä katto kuuluu vain tälle tuotteelle, ei brändille.",

  // ── Laskurit: toistuva ────────────────────────────────────────────────────
  "num.rec.lede":
    "Kertahinnoittelu kysyy mitä kauppa on arvoinen. Toistuva kysyy mitä asiakas on arvoinen, ja kuinka kauan kestää ansaita takaisin se mitä hänen hankkimiseensa meni.",
  "num.rec.revenuePerCustomer": "Liikevaihto per asiakas",
  "num.rec.perMonthNet": "kuukaudessa, verottomana",
  "num.rec.grossMargin": "Myyntikate",
  "num.rec.afterCostToServe": "siitä liikevaihdosta, palvelukustannuksen jälkeen",
  "num.rec.monthlyChurn": "Kuukausipoistuma",
  "num.rec.shareWhoLeave": "osuus joka lähtee kuukaudessa",
  "num.rec.acquisitionHint": "markkinointi ja myynti, per asiakas",
  "num.rec.ltv": "Elinkaariarvo",
  "num.rec.zeroChurn":
    "Nollapoistumalla kukaan ei koskaan lähde, joten elinkaari on ääretön. Se ei ole luku jota kannattaa näyttää.",
  "num.rec.fillFour": "Täytä kaikki neljä kenttää.",
  "num.rec.payback": "Takaisinmaksu",
  "num.rec.noMargin": "Katetta ei ole, joten hankintakustannus ei maksa itseään takaisin.",
  "num.rec.paybackNote":
    "Kuinka kauan kestää ennen kuin asiakas on maksanut takaisin hankintansa. Elinkaariarvo on {ltvToCac}× hankintakustannus.",
  "num.rec.worthLess":
    "Jokainen asiakas on vähemmän arvoinen kuin hänen hankkimisensa maksaa. Nopeampi kasvu pahentaa tätä, ei korjaa: ratkaisu on poistuma, kate tai hankintakustannus, ei määrä.",

  // ── Laskurit: juoksevat kulut ─────────────────────────────────────────────
  "num.run.couldNotSave": "Tallennus ei onnistunut",
  "num.run.monthlyTotals":
    "Kuukausisummat, ei kuitteja. Jaettuna kaikille tuotteille: vuokra ei ole hiustenkuivaajan ominaisuus.",
  "num.run.onePerLine":
    "Yksi luku per rivi. Jätä rivi tyhjäksi jos se ei koske sinua: tyhjä ja nolla tarkoittavat täällä eri asioita.",
  "num.run.save": "Tallenna juoksevat kulut",
  "num.run.onBusiness":
    "Tallennetaan liiketoiminnalle, ei tuotteelle. Mikään täällä ei muuta sitä mitä Studio saa kirjoittaa: rajat ovat kunkin tuotteen kortilla.",
  "num.run.noProductsYet":
    "Ei vielä tuotteita, joten yleiskuluja ei ole millä jakaa. Yllä oleva summa on silti tallennettu ja astuu voimaan heti kun lisäät tuotteen.",
  "num.run.eachSaleLoses":
    "Jokainen kauppa on tappiollinen, joten mikään määrä ei kata yleiskuluja. Korjaa hinta tai kustannus ennen kuin mietit kriittistä pistettä.",
  "num.run.setByMinMargin":
    "Määräytyy {minMarginPct} prosentin vähimmäiskatteestasi. Tällä volyymilla se sitoo tiukemmin kuin yleiskuluehto.",
  "num.run.setByOverhead":
    "Määräytyy yleiskulujen kattamisesta odotetulla volyymilla, mikä sitoo tiukemmin kuin vähimmäiskatteesi. Ilman juoksevia kuluja tämä näyttäisi pienemmältä ja olisi vain puoli alarajaa.",
  "num.run.notFullyLoaded":
    "jaettuna yksiköille. ”Täysin kuormitettu” yksikkökustannus tekee jokaisen tuotteen katteesta riippuvaisen siitä, paljonko kaikkea muuta myytiin. Myyntikate ja kriittinen piste kertovat saman asian liikkumatta aina kun jollain toisella tuotteella on hyvä kuukausi.",

  // ── Laskurin kehys ja rajat ───────────────────────────────────────────────
  "calc.nothingSaved": "Mitään täällä ei tallenneta. Nämä luvut asuvat tuotekortilla, käytä",
  "calc.pressSaveThere": "ja paina siellä tallenna.",
  "calc.pickToApply":
    "Valitse tuote yltä ottaaksesi tämän käyttöön. Ilman tuotetta tämä on pikalaskelma: hyödyllinen kun hinnoittelet jotain jota et ole vielä lisännyt, eikä mitään mene hukkaan jos jäät tänne.",
  "calc.prefillFrom": "Esitäytä lähteestä",
  "calc.noProductsToPrefill":
    "Ei vielä tuotteita, joten esitäytettävää ei ole. Tämä on pikalaskelma, ja se on täysin normaali tapa käyttää sitä: laske luvut ensin, lisää tuote sen jälkeen.",
  "guardrails.didNotSave": "Tallennus ei onnistunut.",
  // The English says pounds. This is a Finnish screen and the currency
  // everywhere else on it is euros, so the example is euros too.
  "guardrails.pickToSet":
    "Valitse tuote asettaaksesi sen rajat. Ne ovat tuotekohtaisia tarkoituksella: kuuden euron pidike ei voi kantaa yhdeksänkymmenenyhdeksän euron alarajaa.",
  "guardrails.floorPrice": "Alarajahinta",
  "guardrails.minMargin": "Vähimmäiskate",
  "guardrails.saveLimits": "Tallenna rajat",

  // ── Muistiinpanot ─────────────────────────────────────────────────────────
  "notes.couldNotLoad": "Muistiinpanojasi ei voitu ladata.",
  "notes.couldNotOpen": "Muistiinpanoa ei voitu avata.",
  "notes.someImagesFailed": "Joitakin kuvia ei voitu ladata.",
  "notes.notSaved": "Ei tallennettu. Muutoksesi ovat yhä näytöllä.",
  "notes.couldNotCreate": "Muistiinpanoa ei voitu luoda.",
  "notes.pdfNotWired": "PDF-lataus tehdään palvelimella, eikä sitä ole vielä kytketty.",
  "notes.nothingElseHere": "Täällä ei ole vielä muuta.",
  "notes.new": "Uusi muistiinpano",
  "notes.empty":
    "Täällä ei ole vielä mitään. Muistiinpano on luonnoslehtiö: kaikki mitä siihen kirjoitat päätyy Chatiin.",
  "notes.noMatch": "Mikään ei vastaa hakua ”{query}”.",
  "notes.untitled": "Nimetön",
  "notes.emptyPreview": "Tyhjä",
  "notes.pickOne": "Valitse muistiinpano tai aloita uusi.",
  "notes.note": "Muistiinpano",
  "notes.title": "Muistiinpanon otsikko",
  "notes.image": "Kuva",
  "notes.caption": "Kuvateksti",
  "notes.imageCaption": "Kuvan teksti",
  "notes.heading": "Otsikko",

  // ── Aloitus: profiilin napautukset ────────────────────────────────────────
  "profile.whatDoYouSell": "Mitä myyt?",
  "profile.physicalProducts": "Fyysisiä tuotteita",
  "profile.digitalProducts": "Digituotteita tai ohjelmistoja",
  "profile.howDoTheyPay": "Miten asiakkaat maksavat?",
  "profile.oneOff": "Kertaostoina",
  "profile.onSubscription": "Tilauksena",
  "profile.whoDoesWork": "Kuka tekee työn?",
  "profile.twoOrThree": "Meitä on kaksi tai kolme",
  "profile.whatLanguage": "Millä kielellä kirjoitamme?",
  "profile.gettingStarted": "Aloitus",
  "profile.getToKnow": "Tutustutaan liiketoimintaasi",
  "profile.fourTaps":
    "Neljä nopeaa napautusta, ei kirjoittamista. Tämä asettaa näkemäsi esimerkit, kielen jolla Studio kirjoittaa, ja profiilin jota Laskurit tarvitsee.",

  // ── Kirjautumislomake ─────────────────────────────────────────────────────
  "auth.createAccount": "Luo tilisi",
  "auth.welcomeBack": "Tervetuloa takaisin 👋",
  "auth.startBuilding": "Ala rakentaa brändisi työtilaa",
  "auth.logInToWorkspace": "Kirjaudu brändisi työtilaan",
  "auth.orContinueEmail": "tai jatka sähköpostilla",
  "auth.password": "Salasana",
  "auth.enterPassword": "Syötä salasanasi",
  "auth.minChars": "Vähintään {MIN_PASSWORD} merkkiä",
  "auth.creatingAccount": "Luodaan tiliä…",
  "auth.signingIn": "Kirjaudutaan…",
  "auth.createAccountBtn": "Luo tili",

  // ── Tervetulomodaali ──────────────────────────────────────────────────────
  "welcome.step1": "Vaihe 1: Brändi",
  "welcome.step1Body": "Vastaa strategiakyselyyn ja määritä äänensävysi.",
  "welcome.step2": "Vaihe 2: Tieto",
  "welcome.step2Body": "Lataa dokumentit, kuvat ja linkit jotka brändisi pitäisi tietää.",
  "welcome.step3": "Vaihe 3: Studio",
  "welcome.step3Body": "Kirjoita tekstejä ja luo kuvia kaikesta minkä juuri syötit.",
  "welcome.step4": "Vaihe 4: Laskurit",
  "welcome.step4Body": "Lisää kustannukset ja hinnat, jotta Studio ei koskaan kirjoita katteidesi yli.",
  "welcome.quote": "”Heillä on markkinointitiimi. Sinulla on Branditect.”",
  "welcome.fourSteps": "4 vaihetta",
};
