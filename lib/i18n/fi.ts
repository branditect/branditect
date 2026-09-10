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
    "Tallennettu toistaiseksi tähän selaimeen. Siirtyy tilillesi, kun kieliasetukset otetaan käyttöön.",

  "guardrails.title": "Rajat, joita Studio noudattaa",
  "guardrails.whichProduct": "Mikä tuote",
  "guardrails.pickProduct": "Valitse tuote",
  "guardrails.saved": "Tallennettu ✓",
  "calc.applyToProduct": "Käytä tuotteeseen",
  "calc.quickCalculation": "Pikalaskelma — ei tuotetta",

  // ── Käyttöönotto ▸ toimialat ──────────────────────────────────────────────
  "industry.tech": "Teknologia ja SaaS",
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
};
