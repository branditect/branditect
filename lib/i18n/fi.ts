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
  "home.prompt1": "Paljonko pakkaus maksaa päätuotteessamme?",
  "home.prompt2": "Mikä on päävärimme tarkka hex-koodi?",
  "home.prompt3": "Anna kolme Instagram-ideaa tälle viikolle",

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

  // ══ SOVELLUS, erä B ══ Studio, Tieto ja tuotekortti.

  // ── Tieto ▸ Dokumentit ────────────────────────────────────────────────────
  "docs.all": "Kaikki",
  "docs.productInfo": "Tuotetiedot",
  "docs.companyInfo": "Yritystiedot",
  "docs.tooBig": "{name} ylittää 50 Mt:n rajan.",
  "docs.uploadFailed": "Lataus epäonnistui",
  "docs.uploadFailedNamed": "Tiedoston {name} lataus epäonnistui: {msg}",
  "docs.needTitle": "Lisää otsikko.",
  "docs.needContent": "Lisää sisältöä.",
  "docs.building": "Rakennetaan…",
  "docs.active": "Aktiivinen",
  "docs.onlyTheseDocs":
    "Branditect käyttää vain näistä dokumenteista löytyvää tietoa. Se ei koskaan keksi tuotenimiä, ominaisuuksia, hintoja tai yritystietoja. Jos tieto ei ole tallessa, se kysyy sen sijaan että arvaisi.",
  "docs.dropFilesOr": "Pudota tiedostot tähän tai",
  "docs.saveToVault": "Tallenna tietoihin →",
  "docs.none": "Ei vielä dokumentteja. Lataa brändisi tiedostot, niin pääset alkuun.",
  "docs.noneInCategory": "Tässä luokassa ei ole dokumentteja.",

  // ── Tieto ▸ Kuvat ─────────────────────────────────────────────────────────
  "assets.intro": "Hallitse kaikkia brändimateriaalejasi yhdessä paikassa.",
  // THE ENGLISH POSSESSIVE CANNOT BE TRANSLATED HERE. "{brandName}'s brand
  // assets" needs the genitive ON THE NAME in Finnish — Deklanin, Sorbifyn,
  // Vetran — and the ending depends on the name's own ending, which no template
  // can know. Gluing "in" onto a variable produces wrong Finnish for most
  // names. So the sentence is rebuilt to put the name in a position that takes
  // no ending at all. Do not "fix" this back to a possessive.
  "assets.introNamed": "Hallitse brändin {brandName} kaikkia materiaaleja yhdessä paikassa.",

  // ── Tieto ▸ Linkit ────────────────────────────────────────────────────────
  "templates.adding": "Lisätään…",

  // ── Studio ▸ Brändikirja ──────────────────────────────────────────────────
  "bb.title": "Brändikirja",
  "bb.upload": "Lataa brändikirja",
  "bb.uploadYours": "Lataa brändikirjasi",
  "bb.fileTypes": "PNG, JPG, PDF, kuvakaappaukset",
  "bb.fileTypesDrag": "PNG, JPG, kuvakaappaukset. Raahaa tai klikkaa.",
  "bb.chooseFiles": "Valitse tiedostot",
  "bb.colorCodes": "Värikoodit",
  "bb.add": "+ Lisää",
  "bb.addPages": "+ Lisää sivuja",
  "bb.autoExtracted": "Poimitaan automaattisesti kun kysyt tekoälyltä väreistä",
  "bb.viewer": "Brändikirjan katselu",
  "bb.reading": "Luetaan brändimateriaaleja…",
  "bb.askPlaceholder": "Kysy brändistä: värit, kirjasimet, logosäännöt…",
  "bb.uploadFirst": "Lataa ensin brändikirja, sitten voit kysyä…",
  "bb.ask": "Kysy",
  "bb.noneYet": "Ei vielä {kind}",

  // ── Studio ▸ Luo kuvia ────────────────────────────────────────────────────
  "ci.lede":
    "Valitse jotain joka jo näyttää oikealta, kerro mitä haluat nähdä, ja saat uuden kuvan samassa valossa.",
  "ci.whatAreYouMaking": "Mitä olet tekemässä?",
  "ci.fromCatalogue": "Jotain luettelostasi",
  "ci.somethingElse": "Jotain muuta",
  "ci.peoplePlacesMoods": "Ihmisiä, paikkoja, tunnelmia",
  "ci.noProducts": "Ei vielä tuotteita. Lisää tuote kohdassa Tieto ▸ Tuotteet, tai valitse Jotain muuta.",
  "ci.whichProduct": "Mikä tuote?",
  "ci.onePhotoAdded": "1 tuotekuva lisätty referenssiksi alle.",
  "ci.noPhotoOnFile": "Tuotekuvaa ei ole tallessa, joten alle ei lisätty mitään.",
  "ci.keptExact":
    "Etiketti, muoto ja väri pidetään täsmällisinä, ja ”tämä tuote” kuvauksessasi tarkoittaa juuri tätä.",
  "ci.pickReferences": "Valitse referenssikuvasi",
  "ci.pickReferencesHelp":
    "Valitse kuvia jotka näyttävät mitä haet. Enintään kolme, ja kaikki luetaan.",
  "ci.from": "Lähde",
  "ci.upload": "Lataa",
  "ci.whereIsIt": "Missä se on?",
  "ci.whereHelp": "Tämä on se ainoa asia jota kuva ei voi kertoa itsestään.",
  "ci.plainBackground": "Yksivärinen tausta",
  "ci.indoors": "Sisällä",
  "ci.outdoors": "Ulkona",
  "ci.outsideDaylight": "Ulkona, päivänvalossa",
  "ci.whatDoYouWant": "Mitä haluat nähdä?",
  "ci.sayItPlainly": "Sano se suoraan, niin kuin sanoisit valokuvaajalle.",
  "ci.oneSentence": "Yksi lause riittää.",
  "ci.shape": "Muoto",
  "ci.anythingElseLong": "Muuta: rekvisiitta, kuvakulma, tila tekstille",
  "ci.anythingElse": "Muuta",
  "ci.exThisProduct": "Tämä tuote hopeanvärisellä taustalla",
  "ci.exNamedProduct": "{name} hopeanvärisellä taustalla",
  "ci.exBottle": "Pullo keittiön tasolla aamuvalossa",
  "ci.whichImages": "Mitkä kuvat",
  "ci.session": "Istunto",
  "ci.nothingMade": "Ei vielä tehty mitään.",
  "ci.nothingMadeHelp":
    "Valitse referenssikuva ja kerro mitä haluat nähdä. Ensimmäinen kestää noin viisitoista sekuntia.",
  "ci.matchingLight": "Sovitetaan valo ja sävyt referensseistäsi…",
  "ci.get": "Hae",
  "ci.nothingSaved": "Mitään ei ole vielä tallennettu.",
  "ci.savedGoTo":
    "Tallennetut kuvat menevät kohteeseen Tieto ▸ Kuvat, ja niitä voi käyttää referensseinä ensi kerralla.",
  "ci.useAsReference": "Käytä referenssinä",
  "ci.pickFromKnowledge": "Valitse Tiedosta",
  "ci.fromKnowledgeImages": "Kohteesta Tieto ▸ Kuvat",
  "ci.noImagesInKnowledge": "Tiedossa ei ole vielä kuvia.",
  "ci.didntWork": "Se ei onnistunut.",
  "ci.notSavedReason": "Ei tallennettu: {message}",
  "ci.savedToKnowledge": "Tallennettu kohteeseen Tieto ▸ Kuvat",
  "ci.notSaved": "Ei tallennettu",

  // ── Studio ▸ Kirjoita ─────────────────────────────────────────────────────
  "wr.short": "Lyhyt",
  "wr.medium": "Keskipitkä",
  "wr.long": "Pitkä",
  "wr.didntWork": "Se ei onnistunut.",
  "wr.lede":
    "Kaksi vastausta ja sinulla on luonnos. Kaikki mitä se kirjoittaa noudattaa strategiaasi, äänensävyäsi ja oikeita tuotetietojasi.",
  "wr.whatAreWeWriting": "Mitä kirjoitamme?",
  "wr.whatPlaceholder": "Mitä kirjoitamme? Tiedote, videokäsikirjoitus…",
  "wr.whatsItAbout": "Mistä se kertoo?",
  "wr.aboutHelp": "Rivi tai kaksi riittää. Kerro mitä tapahtui ja kenelle se on.",
  "wr.tapExample":
    "Napauta esimerkkiä täyttääksesi sen, ja muokkaa sitten. Nämä vaihtuvat valitsemasi formaatin mukaan.",
  "wr.options": "Vaihtoehdot",
  "wr.aboutAProduct": "Tuotteesta",
  "wr.noParticularProduct": "Ei tiettyä tuotetta",
  "wr.drafts": "Luonnokset",
  "wr.howManyDrafts": "Montako luonnosta",
  "wr.writing": "Kirjoitetaan…",
  "wr.writeIt": "Kirjoita se",
  "wr.writesFrom": "Kirjoittaa lähteistä",
  "wr.oneProductRecord": "1 tuotetietue",
  "wr.productRecords": "{products} tuotetietuetta",
  "wr.writeMore": "Kirjoita {count} lisää",
  "wr.pickFormat": "Valitse formaatti ja kerro mistä se kertoo.",
  "wr.didntFinish": "ei valmistunut",
  "wr.copied": "Kopioitu",
  "wr.checkingClaims": "Tarkistetaan jokainen väite tuotetietojasi vasten…",
  "wr.noTone": "Äänensävyä ei ole vielä määritetty, käytetään selkeää ja neutraalia tekstiä.",
  "wr.setOne": "Määritä se →",
  "wr.fact": "Fakta: {claim}, lähde {source}",

  // ── Tuotekortti ▸ media ───────────────────────────────────────────────────
  "media.notAvailable": "Ei saatavilla.",
  "media.couldNotLoad": "Lataus ei onnistunut.",
  "media.couldNotUntag": "Liitoksen poisto ei onnistunut. Kuva on yhä tässä tuotteessa.",
  "media.couldNotTag": "Liittäminen ei onnistunut. Mitään ei lisätty.",
  "media.tagImages": "Liitä kuvia",
  "media.tagImagesHelp": "Liitä kuvia kirjastostasi tai luo niitä Studiossa.",
  "media.createInStudio": "Luo kuvia Studiossa",
  "media.tagToAnotherNamed": "Liitä {file_name} toiseen tuotteeseen",
  "media.documentsLiveIn": "Dokumentit ovat kohdassa",
  "media.knowledgeDocuments": "Tieto ▸ Dokumentit",

  // ── Tuotekortti ▸ hinnoittelu ─────────────────────────────────────────────
  "pricing.netOfTax": "Verottomana, tavaran hankintahintaa vasten.",
  "pricing.contribution": "Myyntikate",
  "pricing.afterCostToSell": "Myös myyntikustannusten jälkeen.",
  "pricing.noTaxRate":
    "Verokantaa ei ole kirjattu, joten molemmat luvut olettavat nollaa. Puuttuva verokanta nollana tulkitsee bruttohinnan nettona ja imartelee katetta.",
  "pricing.addOwnLine": "+ Lisää oma rivi",
  "pricing.studioFollows": "Studio lukee tämän ja noudattaa sitä. {length} merkkiä.",
  "pricing.guardrailsMoved": "Alarajahinta, enimmäisalennus ja vähimmäiskate ovat nyt kohdassa",

  // ── Tuotekortti ▸ paneeli ─────────────────────────────────────────────────
  "product.tabDetails": "Tiedot",
  "product.tabInventory": "Varasto",
  "product.tabMedia": "Media",
  "product.tabHistory": "Historia",
  "product.discardChanges": "Hylätäänkö tallentamattomat muutokset?",
  "product.changeImage": "Vaihda tuotekuva",
  "product.change": "Vaihda",
  "product.untitled": "Nimetön tuote",
  "product.name": "Tuotteen nimi",
  "product.sku": "SKU",
  "product.barcode": "Viivakoodi",
  "product.units": "Yksiköt",
  "product.source": "Lähde",
  "product.stockNote":
    "Varastotieto on täällä yhdestä syystä: jotta Studio ei mainosta jotain mitä et voi toimittaa. Tilauspisteet, toimittajat ja toimitusajat kuuluvat varastojärjestelmääsi, eivät brändiaivoihisi.",
  "product.imageNote": "Kuva tuotelistassa. Alla liitetyt kuvat eivät muuta sitä.",
  "product.noHistory":
    "Muutoksia ei ole vielä kirjattu. Hinta- ja kustannusmuutokset näkyvät täällä tekijöineen. Joku tulee vielä kysymään, milloin hinta muuttui ja miksi.",
  "product.saveChanges": "Tallenna muutokset",

  // ── Tuotekortti ▸ ominaisuudet ────────────────────────────────────────────
  "specs.nameField": "Ominaisuuden {i} nimi",
  "specs.valueField": "Ominaisuuden {i} arvo",
  "specs.exampleValue": "8,4 l/kg",
  "specs.addRow": "+ Lisää ominaisuus",
  "specs.helpStructured":
    "Jäsenneltyjä faktoja, joita Studio voi lainata sanatarkasti: taulukot, vertailut, mainosväitteet. Rivi ilman nimeä hylätään.",
  // ══ SOVELLUS, erä C ══ Visuaalinen ilme, tuonti, kuvakirjasto, kuvavalitsimet.

  // ── Brändi ▸ Visuaalinen ilme ─────────────────────────────────────────────
  "vi.lede1": "Jokainen logo, väri ja kirjasin siinä versiossa, joka on oikeasti käytössä.",
  "vi.lede2":
    "Tiedostot nimeltä ”ensisijainen” ja ”pelkkä symboli” ovat arkistokaappi. Tässä on sama joukko järjestettynä sen kysymyksen mukaan, jonka kanssa ihmiset oikeasti tulevat.",
  "vi.platesFixed":
    "Jokainen levy on kiinni omassa paikassaan, joten näet ennen käyttöä, toimiiko käänteinen tiedosto oikeasti. Lataa se, jonka tarvitset.",
  "vi.uploadThree":
    "Lataa ensisijainen, käänteinen versio ja pelkkä symboli. Nämä kolme kattavat lähes kaiken käytön.",
  "vi.swatchesCopy":
    "Jokainen värilappu kopioituu. Kontrastimerkintä mitataan valkoista vasten piirtohetkellä, joten se ei voi vanhentua. Siinä on ero värin välillä, jolla voi kirjoittaa tekstiä, ja värin, jolla voi vain täyttää muodon.",
  "vi.addTheOnesYouUse":
    "Lisää ne, joita oikeasti käytät. Ensisijainen väri, tekstiväri ja tausta kantavat suurimman osan siitä, mitä Studio tekee. Tai poimi ne suoraan kuvakaappauksesta.",
  "vi.opensIn": "Avautuu palvelussa {platform}",
  "vi.opensInNewTab": "Avautuu uuteen välilehteen",
  "vi.fourThings":
    "Neljä asiaa, jotka menevät useimmin pieleen. Ne ovat täällä eivätkä PDF:n sivulla 34, koska sääntö jota kukaan ei lue ei ole sääntö.",
  "vi.nothingUploaded":
    "Tälle brändille ei ole vielä ladattu mitään. Logot, värit ja kirjasimet ilmestyvät tänne sitä mukaa kun niitä lisätään.",
  // Ei käännös. Pangrammin tehtävä on näyttää kirjaimet, ja englannin pangrammi
  // ei sisällä ä:tä eikä ö:tä, jotka ovat juuri ne merkit joita suomalainen
  // lukija tästä näytteestä katsoo. Tämä on suomen vakiopangrammi: se kattaa
  // koko kotimaisen aakkoston ä ja ö mukaan lukien.
  "vi.pangram": "Albert osti fagotin ja töräytti puhkuvan melodian.",

  // ── Brändi ▸ Visuaalinen ilme ▸ lataukset ─────────────────────────────────
  "vi.uploading": "Ladataan…",
  "vi.chooseFile": "Valitse tiedosto",
  "vi.nameTypefaceFirst": "Nimeä kirjasin ensin",
  "vi.specimenNote":
    "Tämän sivun näyte ladotaan oikealla kirjasimella, joten nimi jota ei löydy Google Fontsista näkyy korvaavana kirjasimena eikä vain hiljaa näytä oikealta.",
  "vi.addTypeface": "Lisää kirjasin",

  // ── Tieto ▸ Tuotteet ▸ tuonti ─────────────────────────────────────────────
  // Hinnat suomalaisittain: 1 500 € ja 800 €/kk, ei €1,500 eikä €800/month.
  // Rivinvaihdot ovat osa merkkijonoa.
  "import.pastePlaceholder":
    "Liitä tähän tuotelistasi, hinnastosi, palveluvalikoimasi tai mikä tahansa teksti, joka kuvaa tuotteitasi tai palveluitasi...\n\nEsimerkki:\nBrändistrategiatyöpaja 1 500 €\nKokopäiväinen työpaja, jossa määritellään brändin asemointi ja viestinnän rakenne.\n\nSome-kanavien jatkuva palvelu 800 €/kk\nKahden sosiaalisen median kanavan kuukausittainen hallinta, sisältää sisällöntuotannon ja julkaisujen ajastuksen.",

  // ── Tieto ▸ Tuotteet ──────────────────────────────────────────────────────
  "products.noneMatch":
    "Katalogissa on {length} tuotetta, eikä yhdelläkään ole tuota nimeä, SKU:ta tai kategoriaa.",

  // ── Tieto ▸ Dokumentit ▸ kysymyspaneeli ───────────────────────────────────
  // Lause katkeaa <strong>-elementin ympäri. Englannin B-puolikas alkaa
  // välilyönnillä, suomen pilkulla: älä lisää {" "}-väliä </strong>:n jälkeen,
  // tai suomeksi tulee "Ei kuvausta , kunnes".
  "ask.skipKeepsA":
    "Ohita säilyttää yllä valitun tyypin ilman kuvausta. Tiedostot joilla ei ole kuvausta odottavat kohdassa",
  "ask.skipKeepsB": ", kunnes lisäät sen.",

  // ── Tieto ▸ Kuvat ▸ kirjasto ──────────────────────────────────────────────
  "images.uploadOne": "Lataa 1 kuva",
  "images.uploadMany": "Lataa {count} kuvaa",
  "images.shownOf": "{shown} / {total} kuvaa",
  "images.removeFromFile": "Poista {name} tiedostosta {file_name}",

  // ── Tuotekortti ▸ kuvavalitsin ────────────────────────────────────────────
  "picker.tagToProduct": "Merkitse kuvia tähän tuotteeseen",
  "picker.tagOne": "Merkitse kuva",
  "picker.tagN": "Merkitse {count} kuvaa",
  "picker.oneWillShow": "Tämä kuva näkyy tuotteen kortilla.",
  "picker.nWillShow": "{count} kuvaa näkyy tuotteen kortilla.",

  // ══ APP, complete pass ══ 2026-09-14. Everything still English on screen
  // when Finnish was selected. THE FINNISH IN THIS BLOCK WAS WRITTEN BY CLAUDE
  // at Saara's request, not by the design side, and wants a review pass.

  // ── Home, the shell, auth and the start flow ──
  "greeting.hello": "Hei",
  "greeting.morning": "Hyvää huomenta",
  "greeting.afternoon": "Hyvää iltapäivää",
  "greeting.evening": "Hyvää iltaa",

  "readiness.check.questionnaire": "Strategiakysely",
  "readiness.check.knowledgeFiles": "Tiedostot Tieto-osiossa",
  "readiness.check.brandImages": "Tuote- ja brändikuvat",
  "readiness.check.brandGuideline": "Brändiohjeisto",
  "readiness.detail.notStarted": "Ei aloitettu",
  "readiness.detail.allAnswered": "Kaikki {total} vastattu",
  "readiness.detail.answeredOf": "{answered}/{total} vastattu",
  "readiness.detail.required": "{count}/{required} vaaditusta",
  "readiness.detail.uploaded": "Ladattu",
  "readiness.detail.notUploaded": "Ei vielä ladattu",
  "readiness.action.start": "Aloita",

  "readiness.band.starting": "Alussa",
  "readiness.band.building": "Rakentumassa",
  "readiness.band.good": "Hyvä",
  "readiness.band.complete": "Valmis",

  "readiness.headline.allDone": "Kaikki tarkistukset on tehty. Brändisi aivot ovat nyt täysin opetetut.",
  "readiness.headline.oneLeft.questionnaireStart":
    "Yksi tarkistus jäljellä: aloita strategiakysely, niin pääset 100 prosenttiin.",
  "readiness.headline.oneLeft.questionnaireContinue":
    "Yksi tarkistus jäljellä: jatka strategiakyselyä, niin pääset 100 prosenttiin.",
  "readiness.headline.oneLeft.knowledgeFiles":
    "Yksi tarkistus jäljellä: lataa tiedostot Tieto-osioon, niin pääset 100 prosenttiin.",
  "readiness.headline.oneLeft.brandImages":
    "Yksi tarkistus jäljellä: lataa tuote- ja brändikuvasi, niin pääset 100 prosenttiin.",
  "readiness.headline.oneLeft.brandGuideline":
    "Yksi tarkistus jäljellä: lataa brändiohjeistosi, niin pääset 100 prosenttiin.",
  "readiness.headline.manyLeft.questionnaire":
    "{remaining} tarkistusta jäljellä. Aloita strategiakyselystä.",
  "readiness.headline.manyLeft.knowledgeFiles":
    "{remaining} tarkistusta jäljellä. Aloita lataamalla tiedostot Tieto-osioon.",
  "readiness.headline.manyLeft.brandImages":
    "{remaining} tarkistusta jäljellä. Aloita tuote- ja brändikuvista.",
  "readiness.headline.manyLeft.brandGuideline":
    "{remaining} tarkistusta jäljellä. Aloita brändiohjeistosta.",

  "readiness.copy.allDone":
    "Kaikki neljä tarkistusta on tehty. Kaikki, mitä Studio tekee, perustuu brändiisi.",
  "readiness.copy.done0": "Yhtäkään {totalCount}:stä tarkistuksesta ei ole vielä tehty.",
  "readiness.copy.done1": "Yksi {totalCount}:stä tarkistuksesta on tehty.",
  "readiness.copy.done2": "Kaksi {totalCount}:stä tarkistuksesta on tehty.",
  "readiness.copy.done3": "Kolme {totalCount}:stä tarkistuksesta on tehty.",
  "readiness.copy.gap.questionnaire":
    "Strategiakysely puuttuu vielä. Kun täytät sen, Branditect oppii loput.",
  "readiness.copy.gap.knowledgeFiles":
    "Tieto-osion tiedostot puuttuvat vielä. Kun lisäät ne, Branditect oppii loput.",
  "readiness.copy.gap.brandImages":
    "Tuote- ja brändikuvat puuttuvat vielä. Kun lisäät ne, Branditect oppii loput.",
  "readiness.copy.gap.brandGuideline":
    "Brändiohjeisto puuttuu vielä. Kun lisäät sen, Branditect oppii loput.",
  "readiness.tile": "BRÄNDISI\nPERUSTA",

  "activity.justNow": "Juuri nyt",
  "activity.minutesAgo": "{mins} min sitten",
  "activity.hoursAgo": "{hours} t sitten",
  "activity.yesterday": "Eilen",
  "activity.daysAgo": "{days} päivää sitten",
  "activity.lastWeek": "Viime viikolla",
  "activity.weeksAgo": "{weeks} viikkoa sitten",

  "chatRail.trained": "OPETETTU",
  "chatRail.readsEverything": "Lukee brändisi, laskurisi ja kaiken, mitä Tieto-osiossa on.",
  "chatRail.filesIndexed": "{count} tiedostoa indeksoitu.",

  "onboardingStrip.progress": "Olet vastannut {answered}/{total} strategiakysymykseen.",
  "onboardingStrip.fiveOpenStudio": "Viisi vastausta avaa Studion.",

  "auth.emptyEmail": "Syötä sähköpostiosoitteesi",
  "auth.emptyBrandName": "Syötä brändisi nimi",
  "auth.badEmail": "Tämä ei näytä sähköpostiosoitteelta",
  "auth.badCredentials": "Sähköposti ja salasana eivät täsmää",
  "auth.shortPassword": "Vähintään 10 merkkiä",
  "auth.alreadyRegistered": "Tällä sähköpostilla on jo tili.",
  "auth.rateLimited": "Liian monta yritystä. Yritä uudelleen 15 minuutin kuluttua.",
  "auth.serverError": "Jokin meni vikaan meidän päässämme. Yritä uudelleen.",
  "auth.timedOut": "Tämä kesti liian kauan. Tarkista yhteytesi ja yritä uudelleen.",
  "auth.resetSent": "Jos tällä sähköpostilla on tili, palautuslinkki on matkalla.",
  "auth.resetExpired": "Linkki on vanhentunut. Pyydä uusi.",
  "auth.confirmSent":
    "Vahvista osoitteesi sähköpostiisi tulleesta viestistä ja kirjaudu sitten sisään. Kyselysi odottaa.",
  "auth.signInInstead": "Kirjaudu sisään",
  "auth.feature.write": "Kirjoita brändin mukaan",
  "auth.feature.imagesDesc": "Uusia visuaaleja tuotteidesi ja tyylisi pohjalta.",
  "auth.feature.numbersDesc": "Kannattavuus, hinnoittelu ja järkevät tarjoukset.",
  "auth.feature.assets": "Brändimateriaalit",
  "auth.feature.assetsDesc": "Logot, värit, ohjeistot ja kaikki muu yhdessä paikassa.",
  "auth.hidePassword": "Piilota salasana",
  "auth.showPassword": "Näytä salasana",
  "auth.ssoDemoNote": "Demoversio. Kirjaudu toistaiseksi sähköpostilla.",
  "auth.continueWith": "Jatka {name}-tilillä",

  "andy.conversation": "Keskustelu",
  "andy.newConversation": "Uusi keskustelu",
  "andy.newShort": "+ Uusi",
  "andy.workspace": "{brandName}-työtila",
  "andy.aiChat": "Branditectin tekoälychat",
  "andy.greeting": "Hei. Miten voin auttaa?",
  "andy.greetingBrand": "Hei, tervetuloa {brandName}-työtilaan. Miten voin auttaa?",
  "andy.saveToNotes": "Tallenna muistiinpanoihin",

  "shell.onboarding.questionnaireDesc":
    "38 strategista kysymystä, joista rakentuu brändisi koko perusta. Vie 15-30 minuuttia.",
  "shell.onboarding.ready": "Branditect brändille {brandName} on valmis.",

  "start.fourSections": "Neljä osiota, kaksikymmentä kysymystä.",
  "start.fiveOpen": "Viisi niistä avaa työtilasi. Loput tarkentavat sitä aina, kun palaat.",
  "start.timeCost":
    "Kysymyksiä on kaksikymmentä, mutta työtilan avaamiseen tarvitaan vain viisi, noin neljä minuuttia. Loput voivat odottaa, ja ne näkyvät Brändin valmiudessa, joten tiedät, mitä vielä puuttuu.",
  "start.pickUp": "Jatka siitä, mihin jäit",
  "start.start": "Aloita",
  "start.wereOnOf20": "Olit kysymyksessä {n}/20. Kaikki kirjoittamasi on tallessa.",
  "start.gate.cleared": "Työtilasi on auki. Loput kysymykset löytyvät Brändin valmiudesta.",
  "start.gate.needs":
    "Studio tarvitsee {total} vastausta, ennen kuin se voi kirjoittaa sinun äänelläsi. Olet vastannut {done}/{total}.",
  "start.questionOf": "Kysymys {n}/{total}",
  "start.stepOf": "Vaihe {index}/4 · {title}",
  "start.requiredNote": "Yksi niistä viidestä vastauksesta, jotka avaavat työtilasi.",
  "start.skippableNote": "Voit ohittaa tämän. Siitä tulee Brändin valmiuden kohta, johon voit palata.",
  "start.finish": "Valmis",
  "start.nextQuestion": "Seuraava kysymys",
  "start.qNote.6": "Koko kyselyn tärkein vastaus. Kaikki, mitä Studio kirjoittaa, lähtee tästä.",
  "start.qNote.8": "Kaksi ääntä, Rauhallinen ja Asiantuntija, tarvitsevat tähän todellisen todisteen. Luvun, sertifikaatin tai testin.",
  "start.qNote.10": "Jokainen tähän tallentamasi ilmaus on käytettävissä teksteissä sellaisenaan. Tämä on asiakkaidesi sanapankki.",
  "start.qNote.20":
    "”Mikä tarkalleen” on koko kysymys. ”Pidän Aesopista” ei auta. ”Pidättyväisyys” on toimeksianto.",
  "start.exemplar.physical": "Esimerkki on kengänkorjaamosta, ei sinun yrityksestäsi. Kopioi rakenne, älä sanoja.",
  "start.exemplar.digital": "Esimerkki on laskumuistutussovelluksesta, ei sinun yrityksestäsi. Kopioi rakenne, älä sanoja.",
  "start.exemplar.service": "Esimerkki on ikkunanpesijältä, ei sinun yrityksestäsi. Kopioi rakenne, älä sanoja.",
  "start.resume.welcomeBack": "Tervetuloa takaisin",
  "start.resume.nothingLost": "Mitään ei kadonnut.",
  "start.resume.finding": "Etsitään kohtaa, johon jäit…",
  "start.resume.answeredOf": "{answered}/{total} vastattu.",
  "start.resume.wereOn": "Olit kysymyksessä {n}/{total}.",
  "start.resume.allSaved":
    "Kaikki kirjoittamasi on tallessa. Ohittamasi kysymykset odottavat Brändin valmiudessa, eivät ole kadonneet.",
  "rail.sectionAnswered": "{answered}/{total} vastattu",
  "rail.sectionQuestions": "{total} kysymystä",
  "start.notSavedRetrying": "Ei tallennettu, yritetään uudelleen",
  "start.finishLater": "Jatka myöhemmin →",

  "planPage.description": "Laskutus, tilaustaso ja uusimispäivä. Ei vielä käytössä, eikä tämä vaikuta työtilaasi.",
  "shell.backToHome": "Takaisin etusivulle",
  "chat.pageDescription":
    "Koko sivun keskustelu brändisi tuntevan avustajan kanssa. Se lukee brändisi, laskurisi ja kaiken, mitä Tieto-osiossa on. Etusivun paneeli toimii jo, tämä isompi näkymä on vielä tulossa.",

  // ── Knowledge and the product card ──
  // ── Dokumentit ────────────────────────────────────────────────────────────
  "documents.browse": "selaa",
  "documents.chars": "{count} merkkiä",
  "documents.pagesShort": "{count} s.",
  "documents.type.safetySheet": "Tuotteen käyttöturvallisuustiedote",
  "documents.type.certificate": "Sertifikaatti tai testiraportti",
  "documents.type.spec": "Tekninen erittely",
  "documents.type.manual": "Käyttöohje",
  "documents.type.priceList": "Hinnasto",
  "documents.type.contract": "Sopimus tai tarjous",
  "documents.type.presentation": "Esitys",
  "documents.type.brandGuideline": "Brändiohjeisto",
  "documents.type.catalogue": "Tuoteluettelo",
  "documents.contractNoteRest": "Tallennetaan ja on sinun haettavissasi, mutta Studio ei koskaan lainaa sitä.",

  // ── Kuvat ja mediavälilehdet ──────────────────────────────────────────────
  "kImages.removeLinkFailed": "Liitoksen poistaminen ei onnistunut.",
  "kImages.readyOne": "{count} kuva valmiina",
  "kImages.readyMany": "{count} kuvaa valmiina",
  "kImages.countOne": "{count} kuva",
  "kImages.countMany": "{count} kuvaa",
  "kImages.emptyLibrary": "Kuvia ei ole vielä lähetetty. Aloita pudottamalla tiedostoja yllä olevaan kenttään.",
  "kImages.noFilterMatch": "Suodattimiasi vastaavia kuvia ei löytynyt.",
  "kImages.copiedCheck": "Kopioitu ✓",
  "kImages.select": "Valitse {name}",
  "kImages.deselect": "Poista valinta: {name}",
  "kImages.cat.social": "some",
  "kImages.cat.event": "tapahtuma",
  "kImages.cat.product": "tuote",
  "kImages.cat.campaign": "kampanja",
  "kImages.cat.brand": "brändi",
  "kImages.cat.aiGenerated": "tekoälyn luoma",
  "kImages.format.square": "neliö",
  "kImages.format.story": "tarina",
  "kImages.format.landscape": "vaaka",
  "kImages.format.portrait": "pysty",
  "kImages.format.other": "muu",

  "mediaTabs.imagesDesc": "Valokuvat, kuvakaappaukset, brändikuvasto",
  "mediaTabs.videos": "Videot",
  "mediaTabs.videosDesc": "Brändivideot, reelsit, mainokset",
  "mediaTabs.videosEmpty": "Videoita ei ole vielä lähetetty. Aloita pudottamalla videotiedostoja yllä olevaan kenttään.",
  "mediaTabs.sounds": "Äänet",
  "mediaTabs.soundsDesc": "Äänilogot, jinglet, podcastit",
  "mediaTabs.soundsEmpty": "Äänitiedostoja ei vielä ole. Lähetä äänilogoja, jinglejä tai podcast-klippejä.",
  "mediaTabs.graphics": "Grafiikat",
  "mediaTabs.graphicsDesc": "Logot, ikonit, kuvitukset, vektorit",
  "mediaTabs.graphicsEmpty": "Grafiikoita ei vielä ole. Lähetä logoja, ikoneita, kuvituksia ja vektoreita.",
  "mediaTabs.web": "Verkkosivu / sovellus",
  "mediaTabs.webDesc": "Kuvakaappaukset, rautalankamallit, käyttöliittymän osat",
  "mediaTabs.webEmpty":
    "Verkkosivun tai sovelluksen materiaaleja ei vielä ole. Lähetä kuvakaappauksia, rautalankamalleja ja käyttöliittymäesimerkkejä.",

  // ── Tiedostokirjasto ja lähetysraportit ───────────────────────────────────
  "files.maxSize": "{acceptLabel} · Enintään {maxSize} Mt",
  "files.noMatch": "Hakuasi vastaavia tiedostoja ei löytynyt",
  "files.upload.thatFile": "Tiedosto",
  "files.upload.tooBig": "{name} ylittää kokorajan, eikä sitä lähetetty.",
  "files.upload.storage": "Tiedostoa {name} ei voitu tallentaa.",
  "files.upload.storageDetail": "Tiedostoa {name} ei voitu tallentaa: {detail}",
  "files.upload.row": "{name} lähetettiin, mutta sitä ei voitu tallentaa kirjastoon.",
  "files.upload.rowDetail": "{name} lähetettiin, mutta sitä ei voitu tallentaa kirjastoon: {detail}",
  "files.upload.lead": "{failed}/{attempted} tiedostoa jäi lähettämättä.",
  "files.upload.sameTooBig": "Ne ylittävät kokorajan, eikä niitä lähetetty.",
  "files.upload.sameStorage": "Niitä ei voitu tallentaa.",
  "files.upload.sameStorageDetail": "Niitä ei voitu tallentaa: {detail}",
  "files.upload.sameRow": "Ne lähetettiin, mutta niitä ei voitu tallentaa kirjastoon.",
  "files.upload.sameRowDetail": "Ne lähetettiin, mutta niitä ei voitu tallentaa kirjastoon: {detail}",

  // ── Dokumenttien kysymyspaneeli ───────────────────────────────────────────
  "ask.uploadingOne": "Lähetetään {count} tiedosto",
  "ask.uploadingMany": "Lähetetään {count} tiedostoa",
  "ask.stillUploading": "Lähetys on vielä kesken. Voit vastata jo nyt, vastaukset tallentuvat, kun tiedostot ovat perillä.",
  "ask.allUploaded": "Kaikki lähetetty.",
  "ask.hideFiles": "Piilota tiedostot",
  "ask.setOneDifferently": "Määritä yksittäinen tiedosto toisin ({count})",
  "ask.typeFor": "Tiedoston {name} tyyppi",
  "ask.sameAsAbove": "Sama kuin yllä",
  "ask.descriptionFor": "Tiedoston {name} kuvaus",
  "ask.uploadingTag": "lähetetään",

  // ── Linkit ja esitykset ───────────────────────────────────────────────────
  "links.connected": "Yhdistetty",
  "links.notConnected": "Ei yhdistetty",
  "presentations.body":
    "Lähettämäsi esitykset indeksoidaan tänne dokumenttiesi rinnalle, jotta Studio voi lainata esitystä samalla tavalla kuin PDF:ää. Esitykset päätyvät toistaiseksi Dokumentteihin. Mitään ei katoa, niitä ei vain vielä eroteta omikseen.",
  "presentations.goToDocuments": "Siirry Dokumentteihin",

  // ── Tuotelista ja tuotekortti ─────────────────────────────────────────────
  "product.saveFailed": "Muutos ei tallentunut. Tuote on yhä täällä.",
  "product.restoreFailed": "Palauttaminen ei onnistunut. Lataa sivu uudelleen ja yritä uudestaan.",
  "product.colProduct": "Tuote",
  "product.colPrice": "Hinta",
  "product.colMargin": "Kate",
  "product.estimatedNote":
    "Arvio: laskettu ilman kokonaishankintahintaa tai veroprosenttia, joten se näyttää todellista korkeammalta. Avaa tuote nähdäksesi, mikä luku puuttuu.",
  "product.emptyBody":
    "Branditect ei voi kirjoittaa tuotteista, joita se ei tunne. Lisää ensimmäinen tuotteesi tai tuo tuoteluettelosi.",
  "product.sortedAsc": "Tuotteet lajiteltuna: {sort}, nouseva",
  "product.sortedDesc": "Tuotteet lajiteltuna: {sort}, laskeva",
  "product.sort.margin": "kate",
  "product.sort.price": "hinta",
  "product.sort.name": "nimi",
  "product.removeName": "Poista {name}",
  "product.showing": "Näytetään {from}-{to} / {total} tuotetta",
  "product.stock.inStock": "Varastossa",
  "product.stock.lowStock": "Vähissä",
  "product.stock.outOfStock": "Loppu varastosta",
  "product.detailLabel": "{name}: tiedot",
  "product.removing": "Poistetaan…",
  "product.removed": "{name} poistettu",
  "product.confirmTitle": "Poistetaanko {name}?",
  "product.confirmBody":
    "Se poistuu tuotelistaltasi ja kaikesta, mitä Studio kirjoittaa. Sen kustannukset, hinnat ja rajat säilytetään {days} päivää, joten voit palauttaa sen.",
  "product.confirmRemove": "Poista se",

  // ── Valitsimet ────────────────────────────────────────────────────────────
  "picker.tagIntro": "Kuvakirjastostasi. Ne näkyvät tämän tuotteen kohdassa Kuvat ja video.",
  "picker.emptyHelp":
    "Tuotekuvat ovat kohdassa Tieto ▸ Kuvat, jotta kuvanluoja voi lukea niitä. Lähetä niitä sinne, niin ne näkyvät täällä.",
  "picker.noMatch": "Hakua ”{query}” vastaavia kuvia ei löytynyt.",
  "picker.tagged": "Merkitty",
  "picker.tagging": "Merkitään…",
  "picker.pickOneOrMore": "Valitse yksi tai useampi",
  "picker.selected": "{count} valittu",
  "picker.openedFromSuggestion": "Avattu ehdotuksesta kohteessa {word}. Mitään ei merkitä, ennen kuin vahvistat.",
  "picker.noProducts": "Ei vielä tuotteita. Lisää ensin tuote kohdassa Tieto ▸ Tuotteet.",
  "picker.tagToName": "Merkitse tuotteeseen {name}",
  "picker.couldNotTag": "Merkitseminen ei onnistunut ({status})",
  "picker.confirmTag": "Merkitse",
  "picker.confirmOneToOne": "Merkitse {images} kuva 1 tuotteeseen",
  "picker.confirmOneToMany": "Merkitse {images} kuva {products} tuotteeseen",
  "picker.confirmManyToOne": "Merkitse {images} kuvaa 1 tuotteeseen",
  "picker.confirmManyToMany": "Merkitse {images} kuvaa {products} tuotteeseen",

  // ── Media-välilehti ───────────────────────────────────────────────────────
  "media.openFile": "Avaa {name}",
  "media.untagFile": "Poista liitos: {name}",
  "media.untagNote": "Poistaa sen tästä tuotteesta. Tiedosto säilyy Tieto-osiossa.",
  "media.docsNotBuiltTail": ". Dokumentin liittämistä tuotteeseen ei ole vielä rakennettu.",
  "media.role.safetySheet": "Käyttöturvallisuustiedote",
  "media.role.spec": "Erittely",
  "media.role.manual": "Käyttöohje",
  "media.role.certificate": "Sertifikaatti",

  // ── Spesifikaatiot ────────────────────────────────────────────────────────
  "specs.fallbackName": "spesifikaatio {n}",

  // ── Hinnoittelu-välilehti ja hintarivit ───────────────────────────────────
  "productPricing.limitsTail": ". Samat rajat, sama valvonta, samassa paikassa kuin muutkin hinnoittelusäännöt.",
  "productPricing.groupIn": "Mitä tulee sisään",
  "productPricing.groupInNote": "Mitä asiakas maksaa, ja siihen sisältyvä vero.",
  "productPricing.groupGoods": "Hankintakustannus",
  "productPricing.groupGoodsNote": "Mitä tuote maksaa sinulle ennen kuin myyt sen.",
  "productPricing.groupSell": "Myyntikustannus",
  "productPricing.groupSellNote": "Mitä myynnin saaminen maksaa, myyntiä kohden.",
  "productPricing.lineRrp": "Suositushinta",
  "productPricing.lineUnit": "Yksikkökustannus",
  "productPricing.lineUnitHint": "Mitä toimittaja veloittaa",
  "productPricing.lineLicence": "Lisenssikustannus",
  "productPricing.lineLabour": "Työ toimeksiantoa kohden",
  "productPricing.lineCac": "Asiakashankinta (CAC)",
  "productPricing.lineCacHint": "Mitä yhden asiakkaan saaminen maksaa",
  "productPricing.lineShip": "Toimitus asiakkaalle",
  "productPricing.lineReturns": "Palautusvaraus",
  "productPricing.linePlatform": "Alustamaksu",

  // ── Tuonti ────────────────────────────────────────────────────────────────
  "import.kindPhysical": "Fyysinen",
  "import.kindService": "Palvelu",
  "import.kindSaas": "SaaS",
  "import.kindDigital": "Digitaalinen",
  "import.optPhysical": "Fyysinen tuote",
  "import.optPhysicalDesc": "Konkreettisia tuotteita, jotka toimitetaan asiakkaille",
  "import.optServiceDesc": "Konsultointia, valmennusta, toimistotyötä",
  "import.optSaas": "SaaS / tilaus",
  "import.optSaasDesc": "Ohjelmisto tai toistuva digitaalinen palvelu",
  "import.optDigital": "Digitaalinen tuote",
  "import.optDigitalDesc": "Ladattavat tiedostot, kurssit, pohjat",
  "import.modelPerProject": "Projektikohtainen",
  "import.modelPerHour": "Tuntihinta",
  "import.modelRetainer": "Kuukausisopimus",
  "import.modelCustomQuote": "Räätälöity tarjous",
  "import.fieldProductName": "Tuotteen nimi *",
  "import.fieldRrp": "Suositushinta (€)",
  "import.fieldWholesale": "Tukkuhinta (€)",
  "import.fieldCogs": "Valmistuskustannus (€)",
  "import.fieldDeliveryTime": "Toimitusaika",
  "import.fieldCapacity": "Kapasiteetti kuukaudessa",
  "import.fieldServiceName": "Palvelun nimi *",
  "import.fieldPrice": "Hinta (€)",
  "import.fieldIdealClient": "Ihanneasiakas",
  "import.fieldIncluded": "Mitä sisältyy (pilkuilla eroteltuna)",
  "import.fieldPlanName": "Tilauksen nimi *",
  "import.fieldMonthlyPrice": "Kuukausihinta (€)",
  "import.fieldDeliveryFormat": "Toimitusmuoto",
  "import.editProduct": "Muokkaa tuotetta",
  "import.addToCatalogue": "Lisää luetteloon",
  "import.addNToCatalogue": "Lisää {count} luetteloon",
  "import.extractionFailed": "Poiminta epäonnistui",
  "import.somethingWrong": "Jokin meni pieleen. Yritä uudelleen.",
  "import.pasteText": "Liitä teksti",
  "import.uploadPdf": "Lähetä PDF",
  "import.extractWithAi": "Poimi tuotteet tekoälyllä",
  "import.foundOne": "Löytyi {count} tuote, valitse lisättävät",
  "import.foundMany": "Löytyi {count} tuotetta, valitse lisättävät",
  "import.unnamed": "Nimetön",
  "import.unnamedProduct": "Nimetön tuote",
  "import.fullCatalogue": "Brändin {brandName} koko tuoteluettelo",
  "import.addProductPlus": "+ Lisää tuote",
  "import.priceEur": "{amount} €",
  "import.priceMonthly": "{amount} €/kk",

  // ── Studio: Write, Create images, Notes ──
  // ── Yhteiset ──────────────────────────────────────────────────────────────

  // ── Kirjoita ──────────────────────────────────────────────────────────────
  "write.optional": "valinnainen",
  "write.writesFrom":
    "Pohjana {sources}. Se ei keksi faktaa, jota niissä ei ole. Jos jotain puuttuu, se sanoo sen eikä arvaa.",
  "write.sourcesOne": "strategiasi, äänensävysi, rajasi ja 1 tuotetieto",
  "write.sourcesMany": "strategiasi, äänensävysi, rajasi ja {count} tuotetietoa",
  "write.draftN": "Luonnos {n}",
  "write.words": "{count} sanaa",
  "write.writingLower": "kirjoitetaan…",
  "write.tone": "Sävy: {tone}",
  "write.thinBrief": "Tarkempi kuvaus tuottaa parempaa tekstiä.",

  // ── Kirjoita: muodot ──────────────────────────────────────────────────────
  "studioWrite.fmt.ad": "Mainosteksti",
  "studioWrite.fmt.instagram": "Instagram-kuvateksti",
  "studioWrite.fmt.linkedin": "LinkedIn-julkaisu",
  "studioWrite.fmt.product": "Tuotekuvaus",
  "studioWrite.fmt.customer": "Asiakasviesti",
  "studioWrite.fmt.other": "Jotain muuta, kerro mitä",

  // ── Kirjoita: esimerkit ───────────────────────────────────────────────────
  "studioWrite.eg.ad1": "Uuden SORBIFY OILin lanseeraus",
  "studioWrite.eg.ad2": "Hinnanmuutos jälleenmyyjille",
  "studioWrite.eg.ad3": "Miksi olemme kategorian johtajaa edullisempia",
  "studioWrite.eg.email1": "Varasto suljettu huollon vuoksi ensi viikolla",
  "studioWrite.eg.email2": "Saatavuusilmoitus niille, jotka kysyivät",
  "studioWrite.eg.email3": "Uusi koko esittelyssä nykyisille asiakkaille",
  "studioWrite.eg.instagram1": "Kulissien takaa: imukykytesti",
  "studioWrite.eg.instagram2": "Ennen ja jälkeen asiakkaan kohteesta",
  "studioWrite.eg.instagram3": "Uuden SORBIFY OILin lanseeraus",
  "studioWrite.eg.linkedin1": "Mitä opimme testatessamme 800 kilometriin asti",
  "studioWrite.eg.linkedin2": "Miksi kerromme avoimesti tuotteista, joista emme voi auttaa",
  "studioWrite.eg.linkedin3": "Uusi rekrytointi tai virstanpylväs",
  "studioWrite.eg.product1": "Täysi kuvaus SORBIFY OILille",
  "studioWrite.eg.product2": "Lyhyt versio jälleenmyyjän tuoteluetteloon",
  "studioWrite.eg.product3": "Tuotesivu valikoiman uudelle koolle",
  "studioWrite.eg.customer1": "Varasto suljettu huollon vuoksi ensi viikolla",
  "studioWrite.eg.customer2": "Vastaus toimitusta koskevaan valitukseen",
  "studioWrite.eg.customer3": "Tilauksen viivästys ja uusi päivämäärä",
  "studioWrite.eg.other1": "Lehdistötiedote uudesta valikoimasta",
  "studioWrite.eg.other2": "Lyhyt käsikirjoitus tuotevideoon",
  "studioWrite.eg.other3": "Vastaus jälleenmyyjälle, joka kysyy ehtoja",

  // ── Luo kuvia ─────────────────────────────────────────────────────────────
  "createImages.savedCount": "{count} tallennettu",
  "createImages.productPicture": "Tuotekuva",
  "createImages.productRef": "{name} · tuote",
  "createImages.removeRef": "Poista {name}",
  "createImages.fromKnowledge": "Kohdasta Tieto",
  "createImages.whereIndoorsDetail": "Huone, kauppa",
  "createImages.egGirl": "Tyttö juoksemassa ulkona keltaisessa mekossa",
  "createImages.egMan": "Mies rakennustyömaalla katsomassa taivaalle",
  "createImages.makeImage": "Tee kuva",
  "createImages.making": "Tehdään…",
  "createImages.addReference": "Lisää referenssi aloittaaksesi",
  "createImages.sayWhat": "Kerro, mitä haluat nähdä",
  "createImages.readyOne": "1 referenssi luettu · noin 15 sekuntia",
  "createImages.readyMany": "{count} referenssiä luettu · noin 15 sekuntia",
  "createImages.thisSession": "Tämä istunto",
  "createImages.keptUnless": "Mitään ei säilytetä, ellet tallenna",
  "createImages.inKnowledgeImages": "Kohdassa Tieto ▸ Kuvat",
  "createImages.refOneWhere": "1 referenssi · {where}",
  "createImages.refsWhere": "{count} referenssiä · {where}",
  "createImages.prompt1": "Mistä tuotteesta puuttuu vielä kuvat?",
  "createImages.prompt2": "Millaista taustaa tuotekuvissamme käytetään?",
  "createImages.prompt3": "Mitä värejä saan käyttää uudessa kuvassa?",

  // ── Muistiinpanot ─────────────────────────────────────────────────────────
  "notes.countOne": "{count} muistiinpano",
  "notes.countMany": "{count} muistiinpanoa",
  "notes.search": "Hae muistiinpanoista",
  "notes.list": "Lista",
  "notes.insertImage": "Lisää kuva",
  "notes.pinned": "Kiinnitetty",
  "notes.downloadPdf": "Lataa PDF:nä",
  "notes.more": "Muuta",
  "notes.halfWidth": "Puolikas leveys",
  "notes.fullWidth": "Täysi leveys",
  "notes.switchWidth": "{current}. Vaihda: {next}",
  "notes.imageDeleted": "Tämä kuva poistettiin kohdasta Tieto. Sen ympärillä oleva teksti on ennallaan.",
  "notes.blockText": "tekstilohko",
  "notes.blockHeading": "otsikkolohko",
  "notes.blockList": "listalohko",
  "notes.blockImage": "kuvalohko",

  // ── Studio: brand guideline, brand book, brand bases ──
  // ── Brändiohjeisto: navigaatio ───────────────────────────────────────────
  "guideline.title": "Brändiohjeisto",
  "guideline.group.identity": "Brändi-identiteetti",
  "guideline.group.designSystem": "Designjärjestelmä",
  "guideline.nav.typography": "Typografia",
  "guideline.nav.colors": "Värit",
  "guideline.nav.imageStyle": "Kuvatyyli",
  "guideline.nav.buttons": "Painiketyylit",
  "guideline.nav.graphics": "Graafiset elementit",
  "guideline.nav.icons": "Kuvakkeet",
  "guideline.nav.packaging": "Pakkaustyyli",
  "guideline.nav.social": "Sosiaalinen media",
  "guideline.loading": "Ladataan brändiohjeistoa…",
  "guideline.uploadGuideline": "↑ Lataa ohjeisto",
  "guideline.editSection": "Muokkaa osiota",
  "guideline.uploadImage": "Lataa kuva",

  // ── Logopaikat ───────────────────────────────────────────────────────────
  // Brandmark is the symbol on its own: "liikemerkki" is the Finnish trade
  // term, and "sanamerkki" is the wordmark.
  "guideline.slot.brandmark": "Liikemerkki",
  "guideline.slot.brandmarkDesc": "Pelkkä symboli tai ikoni",
  "guideline.slot.wordmark": "Sanamerkki",
  "guideline.slot.wordmarkDesc": "Pelkkä logoteksti",
  "guideline.slot.combination": "Yhdistelmämerkki",
  "guideline.slot.combinationDesc": "Symboli ja sanamerkki yhdessä",
  "guideline.slot.darkbg": "Tumma tausta",
  "guideline.slot.darkbgDesc": "Valkoinen käänteisversio tummalla",
  "guideline.slot.lightbg": "Vaalea tausta",
  "guideline.slot.lightbgDesc": "Ensisijainen valkoisella",
  "guideline.slot.mono": "Yksivärinen",
  "guideline.slot.monoDesc": "Yksi väri tai kohopainatus",

  // ── Osioiden otsikot ─────────────────────────────────────────────────────
  // The English tags use an em dash as a separator; the Finnish uses a middle
  // dot, which is what the sidebar breadcrumbs already use (visual.breadcrumb).
  "guideline.tag.logos": "Brändi-identiteetti · Logot",
  // "Logojärjestelmä: {name}" rather than "{name}-logojärjestelmä": a brand
  // name with a space in it would need " -logojärjestelmä" and the hyphen rule
  // cannot be applied to a placeholder.
  "guideline.logoSystem": "Logojärjestelmä: {name}",
  "guideline.logoVersions": "Logoversiot",
  "guideline.logoVersionsHelp":
    "Lataa jokainen logoversio alle. Tekoäly tunnistaa, onko kyseessä sanamerkki, liikemerkki, yhdistelmämerkki vai tunnus.",
  "guideline.replace": "↑ Vaihda",
  "guideline.uploadSlot": "Lataa: {label}",
  "guideline.emptySlot": "tyhjä paikka",
  "guideline.uploaded": "ladattu",
  "guideline.clearspaceRules": "Suoja-alue ja kokosäännöt",
  "guideline.clearspaceRule": "Suoja-alueen sääntö",
  "guideline.prohibitedUse": "Kielletty käyttö",
  "guideline.tag.typography": "Brändi-identiteetti · Typografia",
  "guideline.ourTypography": "Typografiamme",
  "guideline.primaryFont": "Ensisijainen:",
  "guideline.bodyFont": "Leipäteksti:",
  "guideline.sentenceCaseOnly": "Vain virkekirjoitus",
  "guideline.hierarchyRespected": "Hierarkiaa noudatetaan aina",
  "guideline.typeScale": "Kokoasteikko",
  "guideline.doDont": "Tee näin / Älä tee näin",
  "guideline.doThis": "Tee näin",
  "guideline.notThis": "Älä tee näin",
  "guideline.tag.colors": "Brändi-identiteetti · Värit",
  "guideline.colourSystem": "Värijärjestelmä",
  "guideline.primaryPalette": "Ensisijainen paletti",
  "guideline.secondaryPalette": "Toissijainen paletti",
  "guideline.usageRules": "Käyttösäännöt",
  "guideline.tag.imageStyle": "Brändi-identiteetti · Kuvatyyli",
  "guideline.photography": "Valokuvaus",
  "guideline.imageryBand":
    "Kuvasto keskittyy todellisiin ympäristöihin ja aitoon tekemiseen, ei lifestyleen eikä haaveisiin. Jokaisen kuvan pitää tuntua otetulta, ei tuotetulta.",
  "guideline.styleRules": "Tyylisäännöt",
  "guideline.approvedStyle": "Hyväksytty tyyli",
  "guideline.tag.buttons": "Designjärjestelmä · Painiketyylit",
  "guideline.variants": "Variaatiot",
  "guideline.btn.primary": "Ensisijainen",
  "guideline.btn.secondary": "Toissijainen",
  "guideline.btn.accent": "Korostus",
  "guideline.btn.disabled": "Ei käytössä",
  "guideline.cornerRadius": "Kulmapyöristys",
  "guideline.tag.designSystem": "Designjärjestelmä · {title}",
  "guideline.library": "Kirjasto: {title}",
  "guideline.tag.social": "Kanavat · Sosiaalinen media",
  "guideline.canvaTemplate": "Canva-pohja",
  "guideline.canvaPlaceholder": "Liitä Canva-pohjan linkki…",
  "guideline.openInCanva": "Avaa Canvassa ↗",
  "guideline.postGallery": "Julkaisugalleria",

  // ── Muokkauspaneeli ──────────────────────────────────────────────────────
  "guideline.editLabel": "Muokkaa: {label}",
  "guideline.updating": "Päivitetään osiota…",
  "guideline.whatToChange": "Mitä haluaisit muuttaa?",
  "guideline.changePlaceholder":
    "esim. ”Lisää yksivärinen väriversio” tai ”Muuta suoja-alueen sääntö x-korkeuden mukaiseksi versaalikorkeuden sijaan”",
  "guideline.referenceImage": "Viitekuva (valinnainen)",
  "guideline.remove": "Poista ×",
  "guideline.uploadReference": "Lataa viitekuvakaappaus tai luonnos",
  "guideline.applyWithAi": "Toteuta tekoälyllä →",

  // ── Latausikkuna ─────────────────────────────────────────────────────────
  "guideline.uploadModalTitle": "Lataa brändiohjeisto",
  "guideline.uploadScreenshots": "Lataa kuvakaappauksia brändiohjeistosta",
  "guideline.pngOrJpg": "PNG tai JPG, voit ladata useita sivuja.",
  "guideline.claudeReads":
    "Claude lukee kaikki sivut huolellisesti ja poimii värit, fontit, logosäännöt, kuvausohjeet ja kaikkien osioiden tekstit.",
  "guideline.whatGetsExtracted": "Mitä poimitaan:",
  "guideline.extractedList":
    "Brändin värit (käytetään koko ohjeiston teemana), fonttien nimet, logon filosofiateksti, kuvauksen lähestymistapa, värien käyttösäännöt, suoja-alueen säännöt ja kielletyn käytön ohjeet.",
  "guideline.extracting": "Poimitaan…",
  "guideline.extractingDots": "Poimitaan...",
  "guideline.extract": "Poimi brändin tiedot",

  // ── Chat ja ilmoitukset ──────────────────────────────────────────────────
  "guideline.brandAi": "Brändin tekoäly",
  "guideline.askPlaceholder": "Kysy brändistä…",
  "guideline.chatHello": "Kysy minulta mitä tahansa tästä brändistä: logoista, väreistä, typografiasta, käyttösäännöistä...",
  "guideline.toast.logoUploaded": "Logo ladattu ✓",
  "guideline.toast.logoUploadedType": "Logo ladattu: {type} ✓",
  "guideline.toast.uploadFailedReason": "Lataus epäonnistui: {error}",
  "guideline.toast.uploadError": "Latausvirhe",
  "guideline.toast.uploaded": "Ladattu ✓",
  "guideline.toast.updated": "Päivitetty ✓",
  "guideline.toast.couldNotUpdate": "Päivitys ei onnistunut, kokeile muotoilla toisin",
  "guideline.toast.apiError": "API-virhe",
  "guideline.toast.extracted": "Ohjeisto poimittu, teema otettu käyttöön ✓",
  "guideline.toast.couldNotParse": "Tulkinta ei onnistunut, kokeile selkeämpiä kuvakaappauksia",
  "guideline.chat.primaryColor": "Ensisijainen väri on {hex}. Käytä sitä vain vaaleilla taustoilla.",
  "guideline.chat.combinationMark":
    "Käytä yhdistelmämerkkiä kaikessa ensisijaisessa viestinnässä. Pelkkää liikemerkkiä vain, kun asiayhteys on jo selvä.",
  "guideline.chat.typography": "Typografia: suurotsikot painolla {wt}. Älä koskaan käytä otsikoissa painoja 700 tai 900.",
  "guideline.chat.photography":
    "Kuvat: todellisia ympäristöjä, ammattilaisia työssään. Ei kuvapankkihymyjä eikä lämpimiä sävyjä.",
  "guideline.chat.buttons": "Painikkeiden kulmapyöristys on {cornerRadius} px. Ei koskaan täysin pyöreä.",
  "guideline.chat.clearspace":
    "Suoja-alue on sanamerkin koko versaalikorkeus kaikilla neljällä sivulla. Mikään ei tule sille alueelle.",

  // ── Paikkamerkkiohjeisto ─────────────────────────────────────────────────
  // "{brandName}-brändin" rather than "{brandName}:n": the genitive ending of
  // a brand name depends on the name, and the compound does not.
  "guideline.def.logoIntro":
    "{brandName}-logo on brändin tärkein visuaalinen ilmaisu. Se on rakennettu harkituista, jäsennellyistä valinnoista, ja se viestii arvoja, jotka määrittävät {brandName}-brändin: tarkkuutta, auktoriteettia ja luotettavuutta. Merkki ja sanamerkki toimivat yhdessä yhtenäisenä järjestelmänä, ja jokaista osaa suojaavat selkeät säännöt, jotka pitävät ilmeen johdonmukaisena kaikessa käytössä.",
  "guideline.def.wordmarkNote":
    "Koko yhdistelmämerkki on brändin ensisijainen ilmaisu. Pelkkää liikemerkkiä käytetään vain silloin, kun brändi on jo tunnistettavissa asiayhteydestä.",
  "guideline.def.clearspace":
    "Jätä logon jokaiselle neljälle sivulle suoja-alue, joka on yhtä suuri kuin sanamerkin versaalikorkeus. Mikään elementti ei saa tulla tälle alueelle.",
  "guideline.def.minimumSize":
    "Älä koskaan käytä logoa painossa alle 24 mm:n tai digitaalisesti alle 80 pikselin kokoisena.",
  "guideline.def.restriction1": "Älä venytä, vinouta tai vääristä logon mittasuhteita mihinkään suuntaan",
  "guideline.def.restriction2": "Käytä valkoista käänteisversiota kaikilla tummilla tai värillisillä taustoilla",
  "guideline.def.restriction3": "Älä koskaan lisää logoon liukuvärejä, varjoja, ääriviivoja tai tehosteita",
  "guideline.def.restriction4": "Käytä aina hyväksyttyä alkuperäistiedostoa, älä koskaan piirrä logoa uudelleen",
  "guideline.def.restriction5": "Älä koskaan sijoita logoa taustalle, joka heikentää sen luettavuutta",
  "guideline.def.typographyIntro":
    "{brandName}-brändin typografia rakentuu selkeydelle, hierarkialle ja pidättyväisyydelle. Jokaisella painolla ja koolla on käytännön tarkoitus. Järjestelmä toimii yhtä vakuuttavasti digitaalisesti ja painossa.",
  "guideline.def.roleDisplay": "Suurotsikko",
  "guideline.def.roleHeading1": "Otsikko 1",
  "guideline.def.roleHeading2": "Otsikko 2",
  "guideline.def.roleBody": "Leipäteksti",
  "guideline.def.roleLabel": "Nimike",
  "guideline.def.usageDisplay": "Kampanjoiden pääkuvat",
  "guideline.def.usageHeading1": "Sivujen otsikot",
  "guideline.def.usageHeading2": "Osioiden otsikot",
  "guideline.def.usageBody": "Juokseva teksti",
  "guideline.def.usageLabel": "Tunnisteet ja metatiedot",
  "guideline.def.sampleDisplay": "Brändi liikkeessä",
  "guideline.def.sampleHeading1": "Ydinlupauksemme",
  "guideline.def.sampleHeading2": "Tehty vaativiin olosuhteisiin",
  "guideline.def.sampleBody": "Täsmällistä kieltä, selkeää ajattelua. Jokainen sana ansaitsee paikkansa.",
  "guideline.def.sampleLabel": "Kategoria · Viite",
  "guideline.def.do1": "Käytä {fontName}-kirjasinta ainoana pääkirjasimena kaikissa materiaaleissa",
  "guideline.def.do2": "Pidä hierarkia tiukkana: älä ohita tasoja äläkä sekoita kokoasteikon portaita",
  "guideline.def.do3":
    "Käytä aina virkekirjoitusta: älä kirjoita otsikoissa tai leipätekstissä jokaista sanaa isolla alkukirjaimella",
  "guideline.def.dont1": "Älä koskaan käytä painoja 700 tai 900 suurotsikoissa tai otsikkoteksteissä",
  "guideline.def.dont2": "Älä käytä yhdessä taitossa useampaa kuin kahta painoa",
  "guideline.def.dont3": "Älä koskaan kirjoita leipätekstiä versaalein, vain nimikkeitä ja metatietoja",
  "guideline.def.colorsIntro":
    "Väri on yksi {brandName}-identiteetin välittömimmistä ilmaisuista. Paletti on huolella harkittu: jokainen väri ansaitsee paikkansa hoitamalla tietyn viestinnällisen tehtävän. Johdonmukaisesti käytettynä järjestelmä rakentaa välitöntä tunnistettavuutta.",
  "guideline.def.primaryDark": "Ensisijainen tumma",
  "guideline.def.light": "Vaalea",
  "guideline.def.roleBackgrounds": "Taustat ja otsikot",
  "guideline.def.roleCtas": "Toimintakehotteet ja interaktiiviset elementit",
  "guideline.def.roleSurfaces": "Vaaleat taustat ja pinnat",
  "guideline.def.neutral": "Neutraali",
  "guideline.def.roleDividers": "Erottimet, toissijainen teksti",
  "guideline.def.primaryPairing": "Ensisijainen yhdistelmä",
  "guideline.def.darkMode": "Tumma tila",
  "guideline.def.neverCombine": "Älä koskaan yhdistä",
  "guideline.def.white": "valkoinen",
  "guideline.def.accentFallback": "korostus",
  // Colour names are placeholders and cannot take Finnish case endings, so the
  // pairing is written as "text X, background Y" rather than "X on Y".
  "guideline.def.pairingRule": "Teksti {first}, tausta {second}. Oletus kaikille markkinointi- ja digipinnoille.",
  "guideline.def.darkModeRule": "Vaalea teksti ja korostusväri {accent}, tausta {dark}. Käytä pääosioissa.",
  "guideline.def.neverCombineRule":
    "Älä yhdistä korostusväriä ja tukivärejä: niiden visuaaliset painot riitelevät isossa koossa.",
  "guideline.def.buttonsNote":
    "Painikkeissa on 6 pikselin kulmapyöristys: jäsennelty ja varma. Yksi ensisijainen toiminto näkymää kohden. Toissijaiset toiminnot ovat aina reunaviivallisia, eivät koskaan täytettyjä.",
  "guideline.def.imageryIntro":
    "{brandName}-brändin kuvastoa määrittävät pidättyväisyys, rehellisyys ja hallittu sommittelu. Jokaisen kuvan pitää tuntua otetulta, ei tuotetulta: todellisia hetkiä todellisissa ympäristöissä, ammattimaisella tarkkuudella tallennettuna.",
  "guideline.def.approved1": "Puhdas, suunnattu valaistus, ei kovaa salamaa eikä keinotekoista draamaa",
  "guideline.def.approved2": "Viileä, neutraali värilämpötila, joka sopii brändin palettiin",
  "guideline.def.approved3": "Todelliset työympäristöt ja aidot pinnat",
  "guideline.def.approved4": "Tiiviit, varmat sommitelmat ja selkeä kohde",
  "guideline.def.approved5": "Ammattilaiset työssään todellisissa ympäristöissä, lavastamatta",
  "guideline.def.prohibited1": "Kuvapankkikuvat hymyilevistä ihmisistä valoisissa toimistoissa",
  "guideline.def.prohibited2": "Lämpimät kultaisen tunnin sävyt tai lifestyle-henkinen kuvaus",
  "guideline.def.prohibited3": "Kotoisat aiheet tai kaikki, mikä ei liity ammattimaiseen tekemiseen",
  "guideline.def.prohibited4": "Raskas jälkikäsittely, keinotekoinen värimäärittely tai suodatintehosteet",
  "guideline.def.prohibited5": "Yleiset maisemakuvat ilman suoraa yhteyttä brändiin",
  "guideline.def.graphicsNote":
    "Geometriset muodot, ohuet viivat ja järjestelmälliset ruudukkokuviot ovat graafisen kielen ydin.",
  "guideline.def.packagingNote":
    "Tuote-etiketeissä käytetään koko ensisijaista palettia. Logo on siinä hyväksytyssä värivariaatiossa, joka sopii kyseiselle pinnalle.",
  "guideline.def.socialNote":
    "Somesisältö nojaa vahvoihin kuviin ja vähäiseen tekstiin. Brändi näyttää aina rauhalliselta ja harkitulta, ei koskaan reaktiiviselta tai trendejä jahtaavalta.",

  // ── Brändikirja ──────────────────────────────────────────────────────────
  "brandBook.loading": "Ladataan brändikirjaa...",
  "brandBook.pageUploaded": "{count} sivu ladattu",
  "brandBook.pagesUploaded": "{count} sivua ladattu",
  "brandBook.visualAssets": "Brändin visuaaliset materiaalit",
  "brandBook.cat.backgrounds": "Taustat ja liukuvärit",
  "brandBook.cat.icons": "Kuvakkeet",
  "brandBook.cat.graphics": "Grafiikat",
  "brandBook.noLogos": "Ei vielä logoja",
  "brandBook.noBackgrounds": "Ei vielä taustoja tai liukuvärejä",
  "brandBook.noIcons": "Ei vielä kuvakkeita",
  "brandBook.noGraphics": "Ei vielä grafiikoita",
  "brandBook.id.logo": "logo",
  "brandBook.id.background": "tausta",
  "brandBook.id.icon": "kuvake",
  "brandBook.id.graphic": "grafiikka",
  "brandBook.viewBook": "Kirja",
  "brandBook.viewPages": "Sivut",
  "brandBook.pageAlt": "Sivu {n}",
  "brandBook.chatHello":
    "Lataa brändikirjasi, niin vastaan siitä kysymyksiin: väreistä, typografiasta, logosäännöistä ja brändin käytöstä...",
  "brandBook.chatNoPages": "Lataa brändikirjasi sivut, niin voin lukea ne ja vastata tarkasti.",
  "brandBook.chatApiError": "API-virhe, yritä uudelleen.",
  "brandBook.processingPdf": "Käsitellään PDF-sivua {page} / {total}...",
  "brandBook.uploadingPage": "Ladataan sivua {page} / {total}...",
  "brandBook.toast.pdfFailed": "PDF:n käsittely epäonnistui: {name}",
  "brandBook.toast.uploadFailedFor": "Lataus epäonnistui: {name}",
  "brandBook.toast.uploaded": "Ladattu",
  "brandBook.toast.colorSaveFailed": "Värin tallennus epäonnistui",
  "brandBook.toast.copied": "Kopioitu {hex}",
  "brandBook.toast.colorExtracted": "{count} väri poimittu",
  "brandBook.toast.colorsExtracted": "{count} väriä poimittu",

  // ── Brändin perusta ──────────────────────────────────────────────────────
  "bases.title": "Rakenna brändisi perusta",
  "bases.intro":
    "Käy läpi seuraavat vaiheet ja rakenna {brandName}-brändin perusta. Sen varassa toimii kaikki tekoälyn avulla luotu sisältö, joka mukautuu {brandName}-brändin ääneen, strategiaan ja identiteettiin.",
  "bases.strategyDesc": "Määritä {name}-brändin tarkoitus, asemointi, arvot ja kilpailuympäristö",
  "bases.toneDesc": "Määritä, miten {name} viestii. BrandTone™ Architectin tuotos",
  "bases.visualIdentity": "Visuaalinen identiteetti",
  "bases.visualDesc": "Lataa {name}-brändin materiaalit ja visuaaliset ohjeet",
  "bases.businessPulse": "Liiketoiminnan pulssi",
  "bases.pulseDesc": "Tavoitteet, tulevat lanseeraukset, herkät aiheet, talouden säännöt",
  "bases.progress": "Edistyminen",
  "bases.continue": "Jatka käyttöönottoa →",

  // ── Brand and Numbers ──
  "num.hostingInfra": "Hosting ja infra",
  "num.supportTime": "Tukeen käytetty aika",
  "num.billingPeriod": "Laskutusjakso",
  "num.trueCostPerUnit": "Todellinen yksikkökustannus",
  "num.costToServeCustomer": "Yhden asiakkaan palvelukustannus",
  "num.unitsPerMonthShort": "{count} yksikköä / kk",
  "num.customersPerMonthShort": "{count} asiakasta / kk",
  "profileLine.physical": "fyysisiä tuotteita",
  "profileLine.digital": "digituotteita ja käyttöoikeuksia",
  "profileLine.subscription": "tilauksena",
  "profileLine.oneOff": "kertaostoina",
  "profileLine.ownSite": "oma verkkokauppa",
  "profileLine.wholesale": "tukkumyynti",
  "profileLine.appStore": "sovelluskauppa",
  "profileLine.and": "ja",
  "profileLine.sentence": "Myyt {what} {how}, kanavina {where}.",
  "profileLine.sentenceNoChannel": "Myyt {what} {how}. Myyntikanavaa ei ole vielä valittu.",
  "num.run.rent": "Vuokra ja tilat",
  "num.run.salaries": "Palkat",
  "num.run.software": "Ohjelmistot ja työkalut",
  "num.run.marketing": "Markkinointi",
  "num.run.other": "Muut yleiskulut",
  "num.currentlyAt": "{name} nyt {amount}",
  "num.cardsHoldFigures": "Tuotekorttisi sisältävät oikeat luvut.",
  "num.stillNeedCosts": "{missing}/{total} tuotteelta puuttuu vielä kustannukset.",
  "num.never": "ei koskaan",
  "num.perMonthValue": "{value} / kk",
  "num.oneOffCharge": "Kertaosto",
  "num.costLinesPerSale": "Se tarkoittaa {count} kustannusriviä per kauppa.",
  "num.belowThisLose": "Tämän alapuolella häviät rahaa, näytti kate kuinka terveeltä tahansa.",
  "num.atVolumeProfit": "{volume} kappaleen kuukausimyynnillä liikevoitto on {profit}.",
  "num.run.volumeHelpUnits": "Suunnilleen kuinka monta yksikköä myyt kuukaudessa. Tämä on alarajatestin toinen puolisko: ilman sitä alaraja tarkistaa vain katteesi.",
  "num.run.volumeHelpCustomers": "Suunnilleen kuinka monelle asiakkaalle myyt kuukaudessa. Tämä on alarajatestin toinen puolisko: ilman sitä alaraja tarkistaa vain katteesi.",
  "num.run.unitsPerMonth": "yksikköä kuukaudessa",
  "num.run.customersPerMonth": "asiakasta kuukaudessa",
  "num.run.noPriceOrCost": "Tuotteelle {name} ei ole kirjattu hintaa tai kustannusta, joten sen myyntikatetta ei voi laskea. Lisää ne tuotekortille.",
  "num.run.floorPriceFor": "Alarajahinta: {name}",
  "num.run.applyTo": "Käytä tuotteeseen {name} →",
  "num.run.noMinMargin": "Tuotteelle {name} ei ole asetettu vähimmäiskatetta, joten alarajahintaa ei voi laskea. Aseta se tuotekortin Hinnoittelu-välilehdellä.",
  "num.run.overheadNotDivided": "Yleiskuluja {not} tarkoituksella jaeta yksiköille. ”Täysin kuormitettu” yksikkökustannus tekee jokaisen tuotteen katteesta riippuvaisen siitä, paljonko kaikkea muuta myytiin. Myyntikate ja kriittinen piste kertovat saman asian liikkumatta aina kun jollain toisella tuotteella on hyvä kuukausi.",
  "num.run.not": "ei",
  "num.hintGross": "brutto",
  "num.hintLanded": "kokonaishankinta",
  "num.offers.tryResult": "Alennus {pct} %: hinta {price}, katetta jää {margin} %.",
  "num.offers.takesPriceTo": "Hinta laskee tasoon {price}, alimpaan joka jättää vielä {mm} % katetta. Verottomana se on {net}.",
  "num.rec.lifetimeNote": "{months} kuukautta, {profit} myyntikatetta kuukaudessa. Laskettu myyntikatteesta, ei liikevaihdosta: liikevaihto ohittaa sen, mitä asiakkaan palveleminen maksaa.",
  "num.rec.monthsValue": "{months} kuukautta",
  "num.price.usingFactory": "Tuotteelle {name} ei ole kokonaishankintahintaa, joten tähän esitäytettiin tehdashinta. Tulos näyttää liian korkealta, kunnes tulli, rahti ja pakkaus on laskettu mukaan.",
  "num.price.youKeep": "Veroton hinta {net} ({tax} % veroa vähennettynä), miinus kustannus {cost}. Sinulle jää {keep} kauppaa kohden.",
  "num.price.hundredUnreachable": "100 %:n kate vaatii nollakustannuksen, eikä sitä saavuta millään hinnalla.",
  "num.price.grossComparable": "Brutto, joten se on vertailukelpoinen myyntihintaasi. Ilman {tax} %:n veroa se on {net}.",
  "calc.applyTo": "Käytä tuotteeseen {name}",
  "guardrails.floorAbovePrice": "Alaraja on myyntihinnan {price} yläpuolella. Mitään ei voisi myydä sillä hinnalla rikkomatta juuri kirjoittamaasi sääntöä.",
  "guardrails.stayInside": "Tuotteesta {name} kirjoitetut tekstit ja tarjoukset pysyvät näiden rajojen sisällä. Tätä hinnoittelusivu tarkoittaa, kun se sanoo tarjousten tarkistettavan alarajaasi vasten ennen kuin näet ne.",
  "strategyDoc.sec.core": "Brändin ydin",
  "strategyDoc.why.core": "Neljä vastausta, joiden päälle kaikki muu rakentuu",
  "strategyDoc.sec.positioning": "Asemointi",
  "strategyDoc.why.positioning": "Missä olet, ja kenelle et ole",
  "strategyDoc.sec.audience": "Kohderyhmä",
  "strategyDoc.why.audience": "Kuka päättää, ja missä päätös tehdään",
  "strategyDoc.sec.competitors": "Kilpailukenttä",
  "strategyDoc.why.competitors": "Aukko, jossa seisot",
  "strategyDoc.why.pillars": "Kolme väitettä, jokaisen takana fakta",
  "strategyDoc.sec.messages": "Avainviestit",
  "strategyDoc.why.messages": "Mitä sanoa, sovitettuna siihen milloin sen kuulee",
  "strategyDoc.sec.principles": "Brändin periaatteet",
  "strategyDoc.why.principles": "Miten brändi toimii",
  "strategyDoc.sec.boundaries": "Rajat",
  "strategyDoc.why.boundaries": "Osio, joka estää tekoälyä kirjoittamasta väärää",
  "strategyDoc.sec.focus": "Strateginen painopiste",
  "strategyDoc.why.focus": "Mitä varten tämä vuosi oikeasti on",
  "strategyDoc.sumDifferent": "Mikä tekee siitä erilaisen:",
  "strategyDoc.sumNotFor": "Se ei tarkoituksella ole tarkoitettu näille: {notFor}.",
  "strategyDoc.sumPromise": "Lupaus: {promise}.",
  "strategyDoc.sumProof": "Todisteet: {proof}.",
  "strategyDoc.sumBehaves": "Sen periaatteet: {principles}.",
  "strategyDoc.forExample": "Esimerkiksi: {example}",
  "strategyDoc.stage.discovery": "Löytäminen",
  "strategyDoc.stage.consideration": "Harkinta",
  "strategyDoc.stage.decision": "Päätös",
  "strategyDoc.stage.retention": "Pysyvyys",
  "strategyDoc.dateLocale": "fi-FI",
  "strategyDoc.notSavedYet": "Ei vielä tallennettu",
  "strategyDoc.positioningPlaceholder": "Asemointilauseesi tulee tähän",
  "strategyDoc.updated": "Päivitetty {date}",
  "strategyDoc.sectionsComplete": "{filled}/{total} osiota valmiina",
  "strategyDoc.finish": "Viimeistele: {section}",
  "strategyDoc.editStrategy": "Muokkaa strategiaa",
  "strategyDoc.essence": "Ydin",
  "strategyDoc.personality": "Persoonallisuus",
  "strategyDoc.benefits": "Hyödyt",
  "strategyDoc.attributes": "Ominaisuudet",
  "strategyDoc.whoWeAre": "Keitä olemme",
  "strategyDoc.whatWeDo": "Mitä teemme",
  "strategyDoc.whyWeExist": "Miksi olemme olemassa",
  "strategyDoc.ourPromise": "Lupauksemme",
  "strategyDoc.notAnsweredYet": "Ei vielä vastattu",
  "strategyDoc.weAre": "Olemme",
  "strategyDoc.for": "Kenelle",
  "strategyDoc.unlike": "Toisin kuin",
  "strategyDoc.because": "Koska",
  "strategyDoc.notDefinedYet": "Ei vielä määritelty",
  "strategyDoc.nobodyExcluded": "Ketään ei ole vielä rajattu pois. Asemointi, joka ei rajaa ketään, ajelehtii heti kun joku lähtee tavoittelemaan halvempaa segmenttiä.",
  "strategyDoc.noSegments": "Ei vielä segmenttejä",
  "strategyDoc.exSegment": "Sari, 34, salongin omistaja, haluaa tuloksia kouluttamatta tiimiään uudelleen",
  "strategyDoc.addSegment": "+ Lisää segmentti",
  "strategyDoc.primary": "Ensisijainen",
  "strategyDoc.unassigned": "ei vaihetta",
  "strategyDoc.noCompetitors": "Kilpailijoita ei ole listattu",
  "strategyDoc.exCompetitor": "Dyson, 399 €, premium-insinöörityö. Oma hintasi kuuluu myös tähän listaan.",
  "strategyDoc.noPrices": "Hintoja ei vielä ole. Lisää ne, niin oma hintasi asettuu tähän portaikkoon, ja juuri se tekee aukosta olennaisen.",
  "strategyDoc.mapNeedsPositions": "2×2-kartta tarvitsee sijainnin jokaiselle kilpailijalle. Ilman niitä jokainen piste osuu samaan kohtaan, joten yllä oleva portaikko näytetään yksin.",
  "strategyDoc.noPillars": "Ei vielä pilareita",
  "strategyDoc.exPillar": "Plasmaioni: 110 000 kierrosta minuutissa, mitattu lämpö. Fakta, ei adjektiivi.",
  "strategyDoc.noTagline": "Ei vielä iskulausetta",
  "strategyDoc.exTagline": "Tarkkuutta tyylillä.",
  "strategyDoc.noStage": "Ei vaihetta",
  "strategyDoc.noPrinciples": "Ei vielä periaatteita",
  "strategyDoc.exPrinciple": "Näytä työ: selitämme tekniikan sen sijaan, että vain väittäisimme laatua.",
  "strategyDoc.becauseReason": "koska {reason}",
  "strategyDoc.noGoal": "Tavoitetta ei ole asetettu",
  "strategyDoc.exGoal": "Olla ammattisalonkien ensisijainen suositus vuoteen 2027 mennessä.",
  "strategyDoc.howItSounds": "Miltä tämä strategia kuulostaa",
  "strategyDoc.howItLooks": "Miltä se näyttää",
  "strategyDoc.appliedTo": "Mihin sitä sovelletaan",
  "strategyDoc.usedByBody": "Studio ▸ Kirjoita lainaa todisteitasi ja noudattaa rajoja. Luo kuvia lukee asemoinnin. Chat vastaa kaiken tämän pohjalta. Mitä enemmän tästä sivusta on täytetty, sitä vähemmän geneeristä kaikki sen tuottama on.",
  "strategy.stage.positioning": "Asemointikehys",
  "strategy.stage.personas": "Kohderyhmäpersoonat",
  "strategy.stage.messaging": "Viestiarkkitehtuuri",
  "strategy.stage.voice": "Brändin ääni ja sävy",
  "strategy.stage.risks": "Riskit ja mahdollisuudet",
  "strategy.generationFailed": "Luonti epäonnistui",
  "strategy.noResponse": "Luonti epäonnistui: palvelin ei vastannut",
  "strategy.noStrategyReceived": "Strategiaa ei saatu. Yritä uudelleen.",
  "strategy.failedToSave": "Tallennus epäonnistui. Yritä uudelleen.",
  "strategy.backToDashboard": "← Takaisin etusivulle",
  "strategy.builtFromQuestionnaire": "Se rakentuu kyselystä. Kaksikymmentä kysymystä, joista viisi tarvitaan työtilan avaamiseen, noin neljä minuuttia. Tämä sivu täyttyy sitä mukaa kuin vastaat.",
  "strategy.goBack": "← Takaisin",
  "strategy.answeredCount": "{answered}/{total} vastattu",
  "strategy.questionOf": "Kysymys {n}/{total}",
  "strategy.attachImage": "Liitä kuva ({count}/3)",
  "strategy.next": "Seuraava",
  "strategy.generateStrategy": "Luo strategia",
  "strategy.synthesizing": "Kokoan {count} vastausta kattavaksi strategiaksi...",
  "strategy.saveToBranditect": "Tallenna Branditectiin",
  "tone.progress.analysing": "Analysoin kirjoitusnäytteitäsi...",
  "tone.progress.generating": "Luon äänensävyohjeita...",
  "tone.progress.failed": "Luonti epäonnistui. Yritä uudelleen.",
  "tone.progress.loadingStrategy": "Ladataan brändistrategiaasi...",
  "tone.progress.noStrategy": "Tallennettua brändistrategiaa ei vielä ole. Luo se ensin Strategia-osiossa.",
  "tone.progress.oldFormat": "Tallennettu strategiasi ei ole uudessa JSON-muodossa. Luo se uudelleen Strategia-osiossa.",
  "tone.progress.pulling": "Haetaan äänensävyohjeita strategiastasi...",
  "tone.progress.pullFailed": "Haku brändistrategiasta epäonnistui. Yritä uudelleen.",
  "tone.generatingEllipsis": "Luodaan...",
  "tone.generateTone": "Luo äänensävy",
  "tone.brandLibrary": "← Brändikirjasto",
  "tone.expressionPlaceholder": "Ilmaisusi tähän",
  "tone.expressionTextPlaceholder": "Napsauta ja kuvaile brändisi ilmaisua...",
  "tone.noPillars": "Äänensävyn pilareita ei ole vielä määritelty. Lisää ne muokkaamalla.",
  "tone.do": "Tee",
  "tone.noItems": "Ei vielä kohtia",
  "tone.noWords": "Sanoja ei ole määritelty",
  "tone.wrong": "Väärin",
  "tone.right": "Oikein",
  "tone.noTouchpoints": "Kosketuspisteitä ei ole vielä määritelty. Lisää ne muokkaamalla.",
  "tone.editTitle": "Muokkaa: {section}",
  "tone.sec.expression": "Brändin ilmaisu",
  "tone.sec.pillars": "Äänensävyn pilarit",
  "tone.sec.dos": "Tee näin",
  "tone.sec.donts": "Älä tee näin",
  "tone.sec.vocab": "Brändin sanasto",
  "tone.sec.touchpoints": "Kanavien kosketuspisteet",
  "tone.sec.checklist": "Pikatarkistuslista",
  "tone.addPillar": "+ Lisää pilari",
  "tone.dosPlaceholder": "Käytä aktiivia\nOle täsmällinen\n...",
  "tone.dontsPlaceholder": "Älä käytä passiivia\nÄlä ole epämääräinen\n...",
  "tone.addTouchpoint": "+ Lisää kosketuspiste",
  "tone.checklistPlaceholder": "Kuulostaako tämä meiltä?\nSanoisimmeko tämän ääneen?\n...",
  "channels.anti.thirsty": "kerjäävä/epätoivoinen",
  "channels.anti.corporate": "virallinen/steriili",
  "channels.anti.trendChasing": "trendien perässä juokseva",
  "channels.anti.preachy": "saarnaava",
  "channels.anti.selfCongratulating": "itseään kehuva",
  "channels.anti.memey": "meemejä meemien vuoksi",
  "channels.eyebrow1": "K1 · Kanavat",
  "channels.eyebrow2": "K2 · Päätavoite",
  "channels.eyebrow3": "K3 · Realistinen kapasiteetti",
  "channels.eyebrow4": "K4 · Vertailutilit",
  "channels.eyebrow5": "K5 · Antibrändi",
  "channels.pushback": "Yli 20 julkaisua viikossa yhden ihmisen voimin tarkoittaa lähes aina laadun heikkenemistä neljässä viikossa. Ehdotamme mieluummin 10-12 julkaisua vahvemmalla formaattivalikoimalla. Pidetäänkö 20+?",
  "channels.couldNotLoad": "Kanavia ei voitu ladata: {error}",
  "channels.brandSocialStrategy": "Somestrategia: {brand}",
  "channels.refsIntro": "3-5 vertailutiliä",
  "visual.slot.primary.label": "Päälogo",
  "visual.slot.primary.usage": "Oletus. Käytä tätä, ellei ole syytä muuhun.",
  "visual.slot.primary.tag": "Vaalealla",
  "visual.slot.dark.label": "Päälogo, käänteinen",
  "visual.slot.dark.usage": "Tummille taustoille ja valokuvien päälle.",
  "visual.slot.dark.tag": "Tummalla",
  "visual.slot.white.label": "Valkoinen / yksivärinen",
  "visual.slot.white.usage": "Yksi väri. Painoon, brodeeraukseen ja kaikkeen yksivärivedokseen.",
  "visual.slot.white.tag": "Tummalla",
  "visual.slot.icon.label": "Pelkkä tunnus",
  "visual.slot.icon.usage": "Faviconit, sovelluskuvakkeet, avatarit. Alle 24 pikselin kokoisena sanamerkki ei enää ole luettava.",
  "visual.slot.icon.tag": "Läpinäkyvä",
  "visual.use.light.question": "Laitan sen valkoiselle sivulle",
  "visual.use.light.answer": "Päälogo, vaalealla",
  "visual.use.light.note": "SVG näytölle, PNG kaikkeen muuhun",
  "visual.use.dark.question": "Se tulee valokuvan tai tumman taustan päälle",
  "visual.use.dark.answer": "Päälogo, käänteinen",
  "visual.use.dark.note": "Käänteinen, ei koskaan vaaleaa uudelleenväritettynä",
  "visual.use.small.question": "Sen pitää olla pieni: favicon, sovelluskuvake, avatar",
  "visual.use.small.answer": "Pelkkä tunnus",
  "visual.use.small.note": "Alle 24 pikselin kokoisena sanamerkki ei enää ole luettava",
  "uploads.slot.primary": "Päälogo",
  "uploads.slot.primaryHint": "Vaaleille taustoille",
  "uploads.slot.dark": "Käänteinen",
  "uploads.slot.darkHint": "Tummille taustoille",
  "uploads.slot.icon": "Pelkkä tunnus",
  "uploads.slot.iconHint": "Merkki ilman sanamerkkiä",
  "uploads.slot.white": "Valkoinen",
  "uploads.slot.whiteHint": "Värin päällä",
  "uploads.role.heading": "Otsikot",
  "uploads.role.body": "Leipäteksti",
  "uploads.uploadFailedStatus": "Lataus epäonnistui ({status})",
  "uploads.notHex": "Tämä ei ole hex-väri. Kokeile esim. #1a1a1a",
  "uploads.couldNotSaveStatus": "Tallennus ei onnistunut ({status})",
  "uploads.extractionFailedStatus": "Poiminta epäonnistui ({status})",
  "uploads.noColoursFound": "Värejä ei löytynyt. Kokeile selkeämpää kuvakaappausta.",
  "uploads.addColour": "Lisää väri",
  "uploads.or": "tai",
  "visual.contrast.aaa": "AAA valkoisella",
  "visual.contrast.aa": "AA valkoisella",
  "visual.contrast.large": "Vain suurelle tekstille",
  "visual.contrast.surface": "Vain pinnoille",
  "visual.copyFailed": "Kopiointi ei onnistunut. Valitse teksti itse.",
  "visual.updatedLive": "Päivitetty {date} · kaikki täällä on voimassa oleva versio",
  "visual.everythingLive": "Kaikki täällä on voimassa oleva versio",
  "visual.toast.logoUploaded": "Logo ladattu",
  "visual.logoAlt": "{label}: {brand}",
  "visual.file": "Tiedosto",
  "visual.toast.colourAdded": "Väri lisätty",
  "visual.groupCore": "Perusvärit",
  "visual.groupGradients": "Liukuvärit",
  "visual.toast.cssCopied": "CSS kopioitu",
  "visual.toast.valueCopied": "{value} kopioitu",
  "visual.copyHex": "Kopioi HEX",
  "visual.toast.typefaceAdded": "Kirjasintyyppi lisätty",
  "visual.template": "Pohja",
  "visual.dont.stretch": "Älä venytä",
  "visual.dont.stretchSub": "Skaalaa aina molemmat suunnat yhdessä",
  "visual.dont.recolour": "Älä väritä uudelleen",
  "visual.dont.recolourSub": "Brändin värit. Ei mitään muuta.",
  "visual.dont.effects": "Älä lisää efektejä",
  "visual.dont.effectsSub": "Ei varjoja, hehkuja, viisteitä eikä ääriviivoja",
  "visual.dont.background": "Älä taistele taustaa vastaan",
  "visual.dont.backgroundSub": "Levoton kuva? Käytä käänteistä tiedostoa yhtenäisen pinnan päällä.",
  "visual.guideBody": "Kaikki yllä oleva sekä valokuvauslinja, äänensävy, ikonografia ja painatuksen määrittelyt. Lue se kerran ja palaa tälle sivulle arjen tarpeisiin.",
  "visual.pages": "{count} sivua",
  "visual.updatedOn": "Päivitetty {date}",
  "visual.prompt1": "Mikä on oranssimme hex-koodi?",
  "visual.prompt2": "Mikä logo toimii tummalla taustalla?",
  "visual.prompt3": "Mitä kokoa ja paksuutta otsikkomme käyttävät?",

  // ══ AI Chat: copy an answer, keep it as a note ══ 2026-09-16. Finnish mine.
  "chatRail.copyAnswer": "Kopioi vastaus",
  "chatRail.saveAsNote": "Tallenna muistiinpanoksi",
  "chatRail.savedToNotes": "Tallennettu muistiinpanoihin",
  "chatRail.saving": "Tallennetaan…",
  "chatRail.saveFailed": "Tallennus epäonnistui",
  "chatRail.noteFromChat": "AI-chatista",
  "chat.replyFailed": "Jotain meni pieleen.",
  "chat.connectionIssue": "Yhteysongelma. Yritä uudelleen.",

  // ══ BRING YOUR OWN STRATEGY, AND START FRESH ══ 2026-09-16.
  // Finnish by Claude, for review, like the block above.

  // ── Strategy intake: the server side ──
  "intake.documentNotReadYet": "Tätä dokumenttia ei ole vielä luettu. Odota hetki ja yritä uudelleen.",
  "intake.tooShort": "Tekstiä on liian vähän luettavaksi.",
  "intake.unreadable": "Strategiaasi ei saatu luettua tällä kertaa. Yritä uudelleen.",
  "intake.readFailed": "Strategiaasi ei voitu lukea.",
  "intake.nothingToSave": "Tallennettavaa ei ole.",
  "intake.migrationMissing":
    "Strategiataulusta puuttuvat versiosarakkeet. Aja supabase/strategy-sources-and-versions.sql Supabasen SQL-editorissa.",
  "intake.questionnaireNotUpdated":
    "Strategiasi tallennettiin, mutta kyselyä ei päivitetty. Nämä kysymykset voidaan kysyä uudelleen.",

  // ── Strategy intake: the doors, the upload and the review ──
  "intake.door.answer": "Vastaa kysymyksiin",
  "intake.door.answerNote": "Noin 15 minuuttia. Kaikki kysymykset.",
  "intake.door.have": "Minulla on jo strategia",
  "intake.door.haveNote": "Lataa se. Luemme sen ja kysymme vain sen, mikä puuttuu.",
  "intake.door.skip": "Ohita toistaiseksi",
  "intake.door.skipNote": "Suoraan työpöydälle. Palaa milloin haluat.",
  "intake.door.resume": "Jatka siitä mihin jäit",

  "intake.bring.eyebrow": "Tuo omasi",
  "intake.bring.heading": "Luemme sen ja kysymme vain sen, mikä puuttuu.",
  "intake.bring.lede":
    "Strategiaesitys vastaa osaan kysymyksistä, ei kaikkiin. Otamme sen, mikä siinä on, näytämme jokaisen vastauksen ja lauseen josta se tuli, ja jätämme loput kysymyksiksi.",
  "intake.bring.foot":
    "Mitään ei tallenneta ennen kuin olet lukenut löydöksemme. Kohta, johon dokumenttisi ei vastaa, jää kysymykseksi.",
  "intake.bring.title": "Tuo strategia, joka sinulla jo on",
  "intake.bring.uploadTab": "Lataa PDF",
  "intake.bring.pasteTab": "Liitä teksti",
  "intake.bring.chooseFile": "Valitse tiedosto",
  "intake.bring.fileTypes": "PDF, enintään 50 Mt. Se menee myös kohtaan Tieto ▸ Dokumentit.",
  "intake.bring.pastePlaceholder": "Liitä strategiasi tähän. Asemointi, kohderyhmä, mitä myyt, mitä et koskaan väitä…",
  "intake.bring.pasteHelp": "Mitä tahansa olet kirjoittanut ylös. Mitä enemmän, sitä vähemmän kysymyksiä jää.",
  "intake.bring.read": "Lue strategiani",
  "intake.bring.reading": "Luetaan strategiaasi…",
  "intake.bring.readingSlow": "Pitkä esitys vie pari minuuttia. Tämä sivu voi olla auki.",
  "intake.bring.uploadingFile": "Ladataan tiedostoa {name}…",
  "intake.bring.extracting": "Luetaan sivuja…",
  "intake.bring.matching": "Verrataan sitä kysymyksiin…",
  "intake.bring.needText": "Lisää ensin tiedosto tai liitä tekstiä.",
  "intake.bring.tooBig": "{name} on yli 50 Mt. Liitä teksti sen sijaan.",
  "intake.bring.pdfOnly": "Lataa PDF tai liitä teksti sen sijaan.",
  "intake.bring.failed": "Tätä ei voitu lukea: {msg}",
  "intake.bring.noText": "Tuosta tiedostosta ei saatu luettavaa tekstiä. Liitä teksti sen sijaan.",

  "intake.review.eyebrow": "Mitä löysimme",
  "intake.review.heading": "Lue tämä ennen tallennusta.",
  "intake.review.lede":
    "Jokainen alla oleva vastaus tuli dokumentistasi, ja lause josta se tuli on sen vieressä. Muokkaa mitä tahansa, mikä ei pidä paikkaansa. Vastaus jota et lue, on asemointi jota et valinnut.",
  "intake.review.foot": "Mitään ei tallenneta ennen kuin painat alla olevaa painiketta.",
  "intake.review.counter": "Tarkista",
  "intake.review.weRead": "Luimme strategiasi. {answered}/{total} vastattu.",
  "intake.review.foundNone": "Emme löytäneet dokumentista mitään, joka vastaisi kysymyksiin.",
  "intake.review.foundNoneHelp":
    "Näin käy esityksellä, joka on enimmäkseen kuvia. Vastaa kysymyksiin sen sijaan, tai liitä teksti ja yritä uudelleen.",
  "intake.review.fromYourDocument": "Dokumentistasi",
  "intake.review.sourcePage": "sivu {page}",
  "intake.review.sourceQuote": "Dokumentissasi lukee",
  "intake.review.stillToAnswer": "Vielä vastaamatta",
  "intake.review.stillToAnswerCount": "{count} kysymystä, joihin dokumentti ei vastaa",
  "intake.review.stillToAnswerOne": "1 kysymys, johon dokumentti ei vastaa",
  "intake.review.notInDocument": "ei dokumentissa",
  "intake.review.saveAndContinue": "Tallenna nämä ja vastaa loppuihin",
  "intake.review.saveAndFinish": "Tallenna nämä ja avaa työtila",
  "intake.review.saving": "Tallennetaan…",
  "intake.review.saveFailed": "Tallennus epäonnistui: {msg}",
  "intake.review.tryAgain": "Lue toinen dokumentti",
  "intake.review.answerAll": "Vastaa mieluummin kysymyksiin",
  "intake.review.nothingToReview": "Tarkistettavaa ei vielä ole.",
  "intake.review.startOver": "Tuo strategia",
  "intake.review.editAria": "Vastaus kysymykseen {n}",
  "intake.review.timeLeft": "noin {minutes} minuuttia",

  "documents.type.strategy": "Brändistrategia",

  // ── Brand ▸ Strategy: what was read, and starting fresh ──
  "strategyDoc.fromYourDocument": "Dokumentistasi",
  "strategyDoc.readFromDocument": "Luettu lataamastasi strategiasta. Mitään tässä ei ole kirjoitettu puolestasi.",
  "strategyDoc.page": "sivu {page}",
  "strategyDoc.notInDocument": "Ei dokumentissasi",
  "strategyDoc.answerToFill": "Vastaa näihin, niin tämä osio täyttyy:",
  "strategyDoc.answerThese": "Vastaa näihin kysymyksiin",
  "strategyDoc.stillOpen": "Vielä auki:",

  "freshStart.title": "Aloita alusta",
  "freshStart.replaces":
    "Alusta aloittaminen korvaa strategiavastauksesi, luodun strategiasi, äänensävysi ja antiäänesi.",
  "freshStart.doesNotTouch":
    "Se ei koske tuotteisiisi, dokumentteihisi, kuviisi, lukuihisi eikä mihinkään, mitä Studio on jo kirjoittanut puolestasi.",
  "freshStart.staysLive":
    "Nykyinen strategiasi pysyy voimassa kunnes uusi on valmis. Lopeta kesken, eikä mikään ole muuttunut.",
  "freshStart.questionnaire": "Aloita alusta kyselyllä",
  "freshStart.upload": "Korvaa se strategiadokumentilla",
  "freshStart.version": "Versio {version}",
  "freshStart.replacedOn": "korvattu {date}",

  // ── Knowledge ▸ Documents: preview, download, delete ── 2026-09-16, Finnish mine.
  "docs.deleteTitle": "Poistetaanko {name}?",
  "docs.deleteBody":
    "Tiedosto poistuu, ja samalla se mitä aivot siitä lukivat: Studio ja AI-chat eivät voi enää viitata siihen. Tuotteesi, muistiinpanosi ja kuvasi säilyvät ennallaan.",
  "docs.deleteConfirm": "Poista dokumentti",
  "docs.deleteFailed": "Poisto epäonnistui: {message}",
  "docs.deleteBlocked":
    "Mitään ei poistettu. Dokumentti on yhä tallessa, joten kyse on käyttöoikeudesta eikä puuttuvasta tiedostosta.",
  "docs.preview": "Esikatsele",
  "docs.previewOf": "Esikatselu: {name}",
  "docs.previewText": "Mitä aivot lukivat",
  "docs.previewNothing": "Ei vielä näytettävää. Tätä tiedostoa ei ole luettu.",
  "docs.previewUnavailable":
    "Selain ei osaa näyttää tätä tiedostotyyppiä. Lataa se laitteellesi lukeaksesi sen.",
  "docs.downloadFailed": "Tiedoston avaaminen epäonnistui: {message}",
  "docs.close": "Sulje",
  "docs.openInNewTab": "Avaa uuteen välilehteen",

  // ── Andy introduces himself in the rail ── 2026-09-16, Finnish mine.
  "chatRail.andyIntro1":
    "Hei, olen Andy. Kysy minulta mitä vain brändistäsi, tuotteistasi tai luvuistasi.",
  "chatRail.andyIntro2":
    "Haluatko kirjoittaa sisältöä tai jotain pidempää? Studio ▸ Kirjoita hoitaa sen. Minä olen kysymyksiä varten.",
  "chatRail.andyIntro3": "Vastaan vain sinun omasta tiedostasi: {count} tiedostoa indeksoitu.",
  "chatRail.andyIntro4": "Jos vastaus on hyvä, tallenna se suoraan muistiinpanoihisi.",

  // ── Picking images is not saving them ── 2026-09-16, Finnish mine.
  "kImages.nothingSavedYet":
    "Mitään ei tallenneta ennen kuin painat alla olevaa painiketta. Jos poistut sivulta, nämä katoavat.",
  "kImages.leaveWarning":
    "Sinulla on kuvia, joita ei ole vielä ladattu.",
  "import.saveFailed":
    "Ei tallennettu: {message}. Tuotteesi ovat yhä näkyvissä, yritä uudelleen.",
  "import.noBrandYet":
    "Ei tallennettu: työtilasi latautuu vielä. Odota hetki ja yritä uudelleen.",
};
