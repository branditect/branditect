// Interface strings, English. The source of truth for what a key means.
//
// Flat, dotted keys on purpose. Nested objects read nicely and then hide a
// missing translation three levels down; a flat map lets one test assert that
// `fi` has exactly the keys `en` has, which is the only check that stops a
// half-translated interface shipping.
//
// RULES
// - `common.*` is for a string used in more than one place. A string used once
//   lives under its own screen, even if it is a single word — "Type" on the
//   media screen and "Type" on the product card can diverge in Finnish and
//   sharing the key would force them together.
// - Never build a sentence by concatenating keys. Word order differs by
//   language, and Finnish puts the case ending where English puts a
//   preposition. Interpolate with {placeholders} instead.
// - The key names the meaning, not the English word. `common.dismiss` is the
//   act of putting a panel away; if the English label changes to "Hide", the
//   key does not move.


export const en = {
  // ── Navigation ────────────────────────────────────────────────────────────
  "nav.home": "Home",
  "nav.brand": "Brand",
  "nav.brand.strategy": "Strategy",
  "nav.brand.tone": "Tone of voice",
  "nav.brand.visual": "Visual identity",
  "nav.brand.channels": "Channels",
  "nav.knowledge": "Knowledge",
  "nav.knowledge.products": "Products",
  "nav.knowledge.documents": "Documents",
  "nav.knowledge.images": "Images",
  "nav.knowledge.presentations": "Presentations",
  "nav.knowledge.links": "Links",
  "nav.studio": "Studio",
  "nav.studio.write": "Write",
  "nav.studio.createImages": "Create images",
  "nav.studio.notes": "Notes",
  "nav.numbers": "Numbers",
  "nav.chat": "AI Chat",

  // ── Common ────────────────────────────────────────────────────────────────
  "common.cancel": "Cancel",
  "common.download": "Download",
  "common.edit": "Edit",
  "common.close": "Close",
  "common.delete": "Delete",
  "common.dismiss": "Dismiss",
  "common.continue": "Continue",
  "common.continueArrow": "Continue →",
  "common.skip": "Skip",
  "common.skipForNow": "Skip for now",
  "common.regenerate": "Regenerate",
  "common.copy": "Copy",
  "common.add": "Add",
  "common.import": "Import",
  "common.retry": "Retry",
  "common.tryAgain": "Try again",
  "common.again": "Again",
  "common.saved": "Saved",
  "common.loading": "Loading…",
  "common.processing": "Processing…",
  "common.wentWrong": "Something went wrong",
  "common.search": "Search",
  "common.send": "Send",
  "common.never": "Never",
  "common.type": "Type",
  "common.category": "Category",
  "common.cost": "Cost",
  "common.description": "Description",
  "common.length": "Length",
  "common.required": "Needed",
  "common.done": "Done",
  "common.perMonth": "Per month",
  "common.onePerLine": "One per line",
  "common.logIn": "Log in",

  // ── Home ──────────────────────────────────────────────────────────────────
  "home.studio": "Studio",
  "home.createWithBrand": "Create with your brand",
  "home.search": "Search",
  "home.notifications": "Notifications",

  // ── Errors ────────────────────────────────────────────────────────────────
  "error.title": "Something went wrong",
  "error.tryAgain": "Try again",

  // ── Chat ──────────────────────────────────────────────────────────────────
  "chat.title": "AI Chat",
  "chatRail.fullScreen": "Full screen",
  "chatRail.reading": "Reading your brand",
  "chatRail.placeholder": "Ask about your brand…",
  "chatRail.ask": "Ask about your brand",
  "chatRail.send": "Send",

  // ── Andy ──────────────────────────────────────────────────────────────────
  "andy.name": "Andy",
  "andy.noConversations": "No past conversations yet",
  "andy.readsFrom": "Reads from your brand vault",
  "andy.savedNotes": "Saved notes",
  "andy.starToSave": "Star any answer to save it here",
  "andy.placeholder": "Ask Andy anything...",

  // ── Sidebar, account, plan ────────────────────────────────────────────────
  "sidebar.pro": "Pro",
  "sidebar.viewPlan": "View plan",
  "sidebar.primary": "Primary",
  "settings.yourPlan": "Your plan",
  "accountMenu.promise": "Promise",
  "accountMenu.soon": "Soon",
  "sidebar.workspace": "Workspace",
  "accountMenu.profile": "Profile",
  "accountMenu.settings": "Settings",
  "accountMenu.help": "Help",
  "accountMenu.logOut": "Log out",
  "accountMenu.signingOut": "Signing out…",

  // ── Activity ──────────────────────────────────────────────────────────────
  "activity.title": "Recent activity",
  "activity.viewAll": "View all",
  "activity.empty":
    "Nothing yet. Anything you add to Brand, Knowledge or Studio shows up here.",

  // ── Readiness ─────────────────────────────────────────────────────────────
  "readiness.yourData": "Your data",
  "readiness.brandReadiness": "Brand Readiness",
  "readiness.brandKnowledge": "Brand Knowledge",
  "readiness.explore": "Explore knowledge →",

  // ── What's next ───────────────────────────────────────────────────────────
  "whatsNext.title": "What's next",
  "whatsNext.done": "Done",
  "whatsNext.addMore": "Add more",
  "whatsNext.exploreMore": "Explore more actions",
  "whatsNext.eachCheckWorth": "Each check is worth",

  // ── Welcome modal ─────────────────────────────────────────────────────────
  "welcome.title": "Welcome to your workspace",
  "welcome.subtitle": "Your brand's brain is ready to be trained.",
  "welcome.gettingStarted": "Getting Started",
  "welcome.enter": "Enter workspace",
  "welcome.exploreFirst": "Explore first",
  "welcome.dontShowAgain": "Don't show this to me anymore",

  // ── Onboarding strip ──────────────────────────────────────────────────────
  "onboardingStrip.continue": "Continue your strategy",
  "onboardingStrip.dismiss": "Dismiss",

  // ── Auth ──────────────────────────────────────────────────────────────────
  "auth.email": "Email",
  "auth.emailPlaceholder": "name@company.com",
  "auth.haveAccount": "Already have an account?",
  "auth.logIn": "Log in",
  "auth.noAccount": "Don't have an account?",
  "auth.createOne": "Create one",
  "auth.demo": "Demo",
  "auth.showcaseLine1": "They have a marketing team.",
  "auth.showcaseLine2": "You have",
  "auth.showcaseBrand": "Branditect.",
  "signup.checkEmail": "Check your email",
  "signup.goToSignIn": "Go to sign in",

  // ── Onboarding (brand basics) ─────────────────────────────────────────────
  "onboarding.basics.title": "Brand Basics",
  "onboarding.basics.intro": "Tell us a little about your brand to get started.",
  "onboarding.basics.nameLabel": "What's your brand called?",
  "onboarding.basics.namePlaceholder": "e.g. Acme Inc.",
  "onboarding.basics.websiteLabel": "Website URL",
  "onboarding.basics.websitePlaceholder": "https://...",
  "onboarding.basics.industryLabel": "Industry",
  "onboarding.logos.title": "Upload your brand logos",
  "onboarding.logos.intro": "Add your logo variants. You can always add more later.",
  "onboarding.colors.title": "Brand Colors",
  "onboarding.colors.intro": "Add your brand colors. You can always update these later.",
  "onboarding.colors.empty": "No colors added yet.",
  "onboarding.colors.color": "Color",
  "onboarding.colors.nameLabel": "Color name",
  "onboarding.colors.namePlaceholder": "e.g. Primary Orange, Dark Navy",
  "onboarding.strategy.title": "How would you like to set up your brand strategy?",
  "onboarding.strategy.intro": "Choose one option below. You can change this later.",
  "onboarding.strategy.pastePlaceholder": "Paste your brand strategy here...",
  "onboarding.done.title": "Your brand workspace has been created.",
  "onboarding.done.open": "Open my workspace →",

  // ── Start (the questionnaire shell) ───────────────────────────────────────
  "start.beforeYouBegin": "Before you begin",
  "start.teachUs": "Let's teach Branditect your brand.",
  "start.skippedNotice":
    "You skipped this one. Answering it now removes it from the list.",
  "start.savesAsYouType": "Saves as you type.",
  "start.answerNeeded": "An answer is needed to continue.",
  "start.answerPlaceholder": "Write it the way you'd say it out loud…",
  "start.howToAnswer": "How to answer",
  "start.exampleAnswer": "Example answer",
  "start.yourProgress": "Your progress",
  "start.answersSaved": "Your answers are saved. Pick up any time.",
  "start.resume.title": "Picking up where you left off",
  "start.resume.body":
    "Saved to your account, not this browser. Sign in anywhere and it's there.",
  "start.resume.openWorkspace": "Open my workspace instead",

  // ── Knowledge ▸ Documents ─────────────────────────────────────────────────
  "docs.vaultTitle": "Brand Knowledge Vault",
  "docs.vaultIntro":
    "Upload brand documents. AI will use only this information when generating content.",
  "docs.aiOnlyRule": "AI-only rule:",
  "docs.loadingVault": "Loading vault…",
  "docs.indexed": "Indexed",
  "docs.error": "Error",
  "docs.documentsIndexed": "Documents indexed",
  "docs.pagesProcessed": "Pages processed",
  "docs.vaultStatus": "Vault status",
  "docs.acceptedFiles": "PDF, JPEG, PNG, PPTX, DOCX, XLSX — max 50 MB",
  "docs.writeText": "Write text",
  "docs.pasteOrType": "Paste or type notes",
  "docs.addTextToVault": "Add text to vault",
  "docs.title": "Title",
  "docs.whatIsThis": "What is this?",
  "docs.content": "Content",
  "docs.deleteDocument": "Delete document",
  "docs.titlePlaceholder": "e.g. Product launch notes, Pricing overview…",
  "docs.typeHelp": "Studio reads this to decide when to cite it.",
  "docs.contentPlaceholder":
    "Paste or write your brand information here — product details, pricing, company info, talking points…",

  // ── Knowledge ▸ Documents ▸ the upload questions ──────────────────────────
  "ask.whatAreThese": "What are these files?",
  "ask.description": "Description",
  "ask.documentType": "Document type",
  "ask.typeHelp": "Studio reads this to decide when to cite the file.",
  "ask.titleFromFilename": "Filled in from the file name. Change it if it is wrong.",
  "ask.notUsedInContent": "Not used in generated content.",
  "ask.notDescribed": "Not described yet",
  "ask.someFilesDiffer": "some files differ",
  "ask.descriptionPlaceholder":
    "Safety data sheet for the 500 ml bottle, TÜV tested Jan 2026",

  // ── Knowledge ▸ Images, Presentations ─────────────────────────────────────
  "assets.title": "Brand Assets",
  "presentations.title": "Presentations",

  // ── Knowledge ▸ Links (templates) ─────────────────────────────────────────
  "templates.title": "Templates",
  "templates.loading": "Loading templates…",
  "templates.intro":
    "Link your brand templates here. Branditect suggests them when you are creating new content.",
  "templates.add": "Add template",
  "templates.addAnother": "Add another template",
  "templates.addImage": "Add image",
  "templates.open": "Open",
  "templates.remove": "Remove",
  "templates.name": "Name",
  "templates.nameHelp":
    "Name it however makes sense for your workflow — like “Post — Product Launch — Square”.",
  "templates.namePlaceholder": "e.g. Post — Product Launch — Square",
  "templates.dashHelp": "Use dashes to separate type, campaign, and format.",
  "templates.platform": "Platform",
  "templates.link": "Template link",
  "templates.linkPlaceholder": "Paste template link…",
  "templates.linkExample": "https://canva.link/… or docs.google.com/…",
  "templates.notesPlaceholder":
    "Add notes about your templates — naming conventions, when to use which, links to design systems...",

  // ── Knowledge ▸ Products ──────────────────────────────────────────────────
  "products.intro": "Everything Branditect can write about, price, and photograph.",
  "products.loading": "Loading products…",
  "products.none": "No products yet",
  "products.noneHelp":
    "Add your products and services manually, or paste in a price list and let AI extract them for you.",
  "products.add": "Add product",
  "products.search": "Search products",
  "products.searchPlaceholder": "Search products…",
  "products.searchBySku": "Search products by name or SKU",
  "products.clearSearch": "Clear search",
  "products.stock": "Stock",
  "products.openDetail": "Open detail",
  "products.noCost": "No cost recorded, so no margin can be calculated",
  "products.pagination": "Pagination",
  "products.prevPage": "Previous page",
  "products.nextPage": "Next page",
  "products.openedFromSuggestion": "Opened from a suggestion on",
  "products.keepIt": "Keep it",
  "products.undo": "Undo",

  // ── Knowledge ▸ Products ▸ import ─────────────────────────────────────────
  "import.title": "Import products with AI",
  "import.intro": "Paste product info or upload a PDF — AI extracts each item automatically",
  "import.drop": "Drop a PDF or image here",
  "import.dropHelp": "Price lists, service menus, product catalogues",
  "import.extracting": "Extracting products...",
  "import.saving": "Saving...",
  "import.loadingCatalogue": "Loading catalogue...",
  "import.fromTextOrPdf": "Import from text / PDF",
  "import.productsAndServices": "Products & Services",
  "import.priceModel": "Price model",
  "import.productType": "Product type",
  "import.flagship": "Flagship",
  "import.markFlagship": "Mark as flagship plan",
  "import.exProductName": "e.g. Face Serum 30ml",
  "import.exProductCategory": "e.g. Skincare",
  "import.exSku": "e.g. SKU-001",
  "import.whatIsProduct": "What is this product?",
  "import.exLeadTime": "3–5 days",
  "import.exUnits": "e.g. 500 units",
  "import.exServiceName": "e.g. Brand Strategy Session",
  "import.exServiceCategory": "e.g. Consulting",
  "import.whatIsIncludedService": "What is included in this service?",
  "import.exServiceAudience": "e.g. Early-stage startups",
  "import.exDuration": "e.g. 2 weeks",
  "import.exDeliverables": "Strategy doc, 2 revision rounds, Q&A call",
  "import.exCapacity": "e.g. 4 clients",
  "import.exPlanName": "e.g. Pro Plan",
  "import.whatIsIncludedPlan": "What does this plan include?",
  "import.exPlanFeatures": "Unlimited projects, Analytics, API access",
  "import.exDigitalName": "e.g. Brand Identity Template Pack",
  "import.exDigitalCategory": "e.g. Templates",
  "import.whatDoesCustomerGet": "What does the customer get?",
  "import.exDigitalFormat": "e.g. PDF + Figma file",

  // ── Files and images ──────────────────────────────────────────────────────
  "files.uploading": "Uploading...",
  "files.drop": "Drop files here or click to browse",
  "files.editTags": "Edit tags",
  "files.tagsHelp": "Comma-separated. e.g. campaign, hero, streamerx",
  "files.tagsPlaceholder": "tag1, tag2, tag3",
  "files.save": "Save",
  "files.copyUrl": "Copy URL",
  "files.searchPlaceholder": "Search by name or tag...",

  "images.upload": "Upload Images",
  "images.drop": "Drop images here or click to browse",
  "images.accepted": "JPG, PNG, WEBP · Max 10MB · Bulk upload supported",
  "images.applyToAll": "Apply to all",
  "images.cancelAll": "Cancel all",
  "images.format": "Format",
  "images.campaign": "Campaign",
  "images.campaignName": "Campaign name",
  "images.tags": "Tags",
  "images.allCategories": "All categories",
  "images.allFormats": "All formats",
  "images.allProducts": "All products",
  "images.untagged": "Untagged",
  "images.tagToProduct": "Tag to a product",
  "images.onTheseProducts": "On these products",
  "images.searchPlaceholder": "Search tags, names, campaigns...",
  "images.filterByProduct": "Filter by product",
  "images.clearSelection": "Clear selection",
  "images.removesLinkOnly": "Removes the link, not the file.",

  // ── Product card ▸ image picker ───────────────────────────────────────────
  "picker.chooseImage": "Choose a product image",
  "picker.intro":
    "From your image library. This is the shot the image creator reads as a reference.",
  "picker.loading": "Loading your images…",
  "picker.empty": "No images in your library yet",
  "picker.goToImages": "Go to Images",
  "picker.clear": "Clear",
  "picker.removeImage": "Remove image",
  "picker.manageInKnowledge": "Manage images in Knowledge →",
  "picker.search": "Search images",
  "picker.searchPlaceholder": "Search images…",

  // ── Product card ▸ media ──────────────────────────────────────────────────
  "media.imagesAndVideo": "Images and video",
  "media.noImages": "No images yet.",
  "media.noImagesHelp": "Generate some in Studio, or tag existing ones from Knowledge.",
  "media.primary": "Primary",
  "media.documents": "Documents",
  "media.noDocuments": "No documents yet.",
  "media.noDocumentsHelp":
    "Tag a safety sheet, a spec or a certificate from Knowledge ▸ Documents.",
  "media.tagToAnother": "Tag this image to another product",

  // ── Product card ▸ pricing ────────────────────────────────────────────────
  "pricing.linesOnProduct": "Lines on this product",
  "pricing.linesHelp":
    "Turning one off hides the row and stops it asking. The number you typed stays put.",
  "pricing.netPrice": "Net price",
  "pricing.addIt": "Add it",
  "pricing.notes": "Notes",
  "pricing.pricingNotes": "Pricing notes",
  "pricing.numbersLink": "Numbers ▸ Pricing & offers",
  "pricing.whatIsItCalled": "What is it called?",
  "pricing.lineName": "Line name",
  "pricing.lineValue": "Line value",
  "pricing.notesPlaceholder":
    "never quote below 26.00 on the webshop, it undercuts our own resellers",

  // ── Product card ▸ detail ─────────────────────────────────────────────────
  "product.tagsHelp":
    "Tags steer tone and angle when Studio writes. Separate them with commas.",
  "product.tagsExample": "Professional, Ionic",
  "product.status": "Status",
  "product.notSet": "Not set",
  "product.outOfStockNote": "Studio will avoid promoting this while it's out of stock.",
  "product.imagePickedFrom": "Picked from your image library in Knowledge ▸ Images",
  "product.revert": "Revert",
  "product.sections": "Product detail sections",
  "product.information": "Product information",
  "product.availability": "Availability",
  "product.image": "Product image",
  "product.changes": "Changes",
  "specs.loading": "Loading specifications…",
  "specs.help": "Studio writes from this. Facts, not adjectives — it will find its own.",
  "specs.example": "Absorbency",

  // ── Brand ▸ Visual identity ───────────────────────────────────────────────
  "visual.breadcrumb": "Brand · Visual identity",
  "visual.title": "Visual brand identity",
  "visual.intro": "Take what you need — you don't have to ask anyone.",
  "visual.noBrand": "No brand yet.",
  "visual.noBrandHelp":
    "Your logos, colours and typefaces appear here once a brand is set up.",
  "visual.yourLogo": "Your logo",
  "visual.logos": "Logos",
  "visual.noLogos": "No logos yet.",
  "visual.files": "Files",
  "visual.allFiles": "All files",
  "visual.current": "Current",
  "visual.startHere": "Start here",
  "visual.whichOne": "Which one do I use?",
  "visual.colour": "Colour",
  "visual.noColours": "No colours yet.",
  "visual.typefaces": "Typefaces",
  "visual.noTypefaces": "No typefaces yet.",
  "visual.typefacesHelp":
    "Each specimen is set in the real typeface. Copy the CSS and it will be too.",
  "visual.typefacesEmpty": "Add the one for headlines and the one for everything else.",
  "visual.copyCss": "Copy CSS",
  "visual.templates": "Templates",
  "visual.templatesHelp": "Sized and set up already. Open one and replace the words.",
  "visual.howToHold": "How to hold it",
  "visual.clearSpace": "Clear space",
  "visual.clearSpaceHelp":
    "Keep the height of the symbol free on every side. Nothing crosses it — no text, no edge, no other logo.",
  "visual.minSize": "Minimum size",
  "visual.minSizeHelp": "Below these, switch to the symbol on its own.",
  "visual.guidelines": "Guidelines",
  "visual.fullGuidelines": "The full guidelines",
  "visual.readHere": "Read here",

  // ── Brand ▸ Visual identity ▸ uploads ─────────────────────────────────────
  "vupload.logo": "Upload a logo",
  "vupload.whichVersion": "Which version is this?",
  "vupload.logoHelp": "SVG or PNG. Uploading to a slot that already has a file replaces it.",
  "vupload.addColour": "Add a colour",
  "vupload.addOneColour": "Add one colour",
  "vupload.fromScreenshot": "Pull them out of a screenshot",
  "vupload.hex": "Hex value",
  "vupload.colourName": "Colour name",
  "vupload.colourRole": "What it is for — Primary, Ink, Wash",
  "vupload.addTypeface": "Add a typeface",
  "vupload.googleFont": "A Google font, by name",
  "vupload.typefaceName": "Typeface name",

  // ── Brand ▸ Tone of voice ─────────────────────────────────────────────────
  "tone.title": "Brand Tone of Voice",
  "tone.setUp": "Set up your brand tone of voice",
  "tone.chooseHow": "Choose how you'd like to define your brand's voice.",
  "tone.pasteSamples": "Paste writing samples",
  "tone.pasteSamplesHelp":
    "Paste examples of your brand writing and we'll extract your tone automatically.",
  "tone.pasteSamplesIntro": "Paste examples of your brand writing below. The more, the better.",
  "tone.pastePlaceholder": "Paste your website copy, emails, social posts, taglines...",
  "tone.fromStrategy": "Pull from brand strategy",
  "tone.fromStrategyHelp": "Use your saved brand strategy to auto-populate tone guidelines.",
  "tone.manual": "Build manually",
  "tone.manualHelp": "Define each aspect of your tone step by step.",
  "tone.expression": "YOUR BRAND EXPRESSION",
  "tone.pillars": "TONE PILLARS",
  "tone.doAndDont": "DO & DON'T",
  "tone.dont": "Don't",
  "tone.vocabulary": "BRAND VOCABULARY",
  "tone.alwaysUse": "Always use",
  "tone.neverUse": "Never use",
  "tone.touchpoints": "CHANNEL TOUCHPOINTS",
  "tone.checklist": "QUICK CHECKLIST",
  "tone.expressionLabel": "Expression label",
  "tone.expressionText": "Expression text",
  "tone.bullets": "Bullets (one per line)",
  "tone.alwaysUseField": "Always use (comma-separated)",
  "tone.neverUseField": "Never use (comma-separated)",
  "tone.wrongExample": "Wrong example",
  "tone.rightExample": "Right example",
  "tone.oneItemPerLine": "One item per line",
  "tone.pillarName": "Pillar name",
  "tone.describeSound": "Describe how your brand sounds...",
  "tone.alwaysExample": "innovative, partner, empower, ...",
  "tone.neverExample": "synergy, leverage, utilize, ...",
  "tone.channelName": "Channel name",
  "tone.badge": "Badge",
  "tone.exampleName": "e.g. Bold & Direct",

  // ── Brand ▸ Strategy ──────────────────────────────────────────────────────
  "strategy.none": "No strategy yet.",
  "strategy.startQuestionnaire": "Start the questionnaire",
  "strategy.whatDoYouOffer": "What does your brand offer?",
  "strategy.trackHelp": "This helps us tailor the strategy framework.",
  "strategy.trackProducts": "Physical or Digital Products",
  "strategy.trackProductsHelp": "E-commerce, SaaS, apps, physical goods",
  "strategy.trackServices": "Services",
  "strategy.trackServicesHelp": "Consulting, agency, freelance, professional services",
  "strategy.sections": "Sections",
  "strategy.generateNow": "Generate Strategy Now",
  "strategy.back": "Back",
  "strategy.crafting": "Crafting your brand strategy",
  "strategy.backToQuestions": "Go back to questions",
  "strategy.editAnswers": "Edit Answers",
  "strategy.downloadMd": "Download .md",

  // ── Brand ▸ Strategy document ─────────────────────────────────────────────
  "sdoc.title": "Brand strategy",
  "sdoc.feeding": "Feeding 4 tools",
  "sdoc.export": "Export",
  "sdoc.derived": "Derived from your positioning and proof points",
  "sdoc.inAParagraph": "The whole strategy, in a paragraph",
  "sdoc.neverStored":
    "Generated from the sections below and never stored, so it cannot go stale.",
  "sdoc.different": "What makes us different",
  "sdoc.notFor": "Not for",
  "sdoc.theyWant": "They want",
  "sdoc.frustratedBy": "Frustrated by",
  "sdoc.professional": "Professional",
  "sdoc.consumer": "Consumer",
  "sdoc.accessible": "Accessible",
  "sdoc.premium": "Premium",
  "sdoc.proof": "Proof",
  "sdoc.noProof": "No proof yet — add a fact with a number in it",
  "sdoc.weNever": "We never",
  "sdoc.weAlways": "We always",
  "sdoc.nothingNamed": "Nothing named yet.",
  "sdoc.nothingNamedHelp":
    "Nothing named yet. A model avoids a named mistake far better than it infers taste.",
  "sdoc.brandGoal": "Brand goal",
  "sdoc.whereNext": "Where this goes next",
  "sdoc.whereUsed": "Where Branditect uses this",

  // ── Brand ▸ Channels ──────────────────────────────────────────────────────
  "channels.active": "Social strategy active · synced with brand",
  "channels.editAnswers": "Edit answers",
  "channels.intro":
    "Branditect already knows your brand. Now it's deciding what you should post.",
  "channels.step2Note": "Synthesis layer ships in step 2 — your answers are saved.",
  "channels.architect": "Social Strategy Architect",
  "channels.fiveQuestions": "Build your social media strategy in 5 questions.",
  "channels.strategyAnswers": "Brand strategy answers",
  "channels.pullingFrom": "What we're pulling from your library",
  "channels.willAsk": "What we'll ask you",
  "channels.commitment": "Channels you're committing to for 90 days",
  "channels.primaryGoalIntro": "Primary goal social is doing for the business",
  "channels.capacityIntro": "Realistic capacity — volume + who's behind it",
  "channels.antiBrand": "The anti-brand — what you don't want to look like",
  "channels.whyWeAsk": "Why we ask",
  "channels.primaryGoal": "Primary goal (pick one)",
  "channels.secondaryGoal": "Secondary goal (optional)",
  "channels.volumePerWeek": "Volume per week",
  "channels.productionSetup": "Production setup",
  "channels.threeToFive": "One per line. 3 minimum, 5 maximum.",
  "channels.pitfalls": "Common pitfalls (pick any)",
  "channels.anythingElse": "Anything else? (one per line)",

  // ── Numbers ───────────────────────────────────────────────────────────────
  "numbers.title": "Numbers",
  "numbers.whatItDoes": "What Numbers does",
  "numbers.studioObeys": "Studio writes inside those limits.",
  "numbers.noProducts": "No products yet — the calculators still work.",
  "numbers.productsPriced": "Products priced",
  "numbers.lowestMargin": "Lowest margin",
  "numbers.seeAll": "See all live numbers →",
  "numbers.setOnce": "Set once",
  "numbers.whatYouSell": "What you sell",
  "numbers.howYouCharge": "How you charge",
  "numbers.howYouSell": "How you sell",
  "numbers.whereYouSell": "Where you sell",
  "numbers.calculators": "Calculators",
  "numbers.perSale": "Per sale",
  "numbers.sandbox": "Sandbox",
  "numbers.variableCosts": "Costs that move with volume.",
  "numbers.whatYoullNeed": "What you'll need",
  "numbers.openCalculator": "Open calculator",
  "numbers.bestContribution": "Best contribution per sale",
  "numbers.revenue": "Revenue",

  "numbers.runningCosts": "Running costs",
  "numbers.runningCostsAndBreakEven": "Running costs & break-even",
  "numbers.runningCostsHelp": "What you pay whether you sell one or a thousand.",
  "numbers.breakEvenHelp": "What you must sell each month to keep the lights on.",
  "numbers.monthlyTotals": "What you'll need — monthly totals, not receipts",
  "numbers.yourMonthlyCosts": "Your monthly costs",
  "numbers.total": "Total",
  "numbers.expectedVolume": "Expected volume",
  "numbers.whatThatMeans": "What that means",
  "numbers.againstWhichProduct": "Against which product",
  "numbers.selectProduct": "Select a product…",
  "numbers.contributionPerSale": "Contribution per sale",
  "numbers.breakEven": "Break-even",
  "numbers.enterCosts": "Enter your running costs on the left.",
  "numbers.neverAtThisPrice": "Never at this price",
  "numbers.opensProductCard":
    "Opens the product card. Nothing is saved until you press save there.",
  "numbers.overheadDeliberately": "Overhead is deliberately",

  "numbers.landedCost": "Landed cost",
  "numbers.yourCostLines": "Your cost lines",
  "numbers.pricingAndMargin": "Pricing & margin",
  "numbers.eitherEnd": "Work it from either end",
  "numbers.direction": "Direction",
  "numbers.offers": "Offers & discounts",
  "numbers.maxDiscount": "Max discount",
  "numbers.offerConsidering": "The offer you're considering",
  "numbers.recurring": "Recurring revenue",
  "numbers.subscriptionNumbers": "Your subscription numbers",

  // ── Settings ▸ Language ───────────────────────────────────────────────────
  // Added while wiring the switch. Six keys the dictionary did not have.
  "settings.breadcrumb": "Settings",
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.languageIntro":
    "The interface and what Studio writes are two separate choices.",
  "settings.interfaceLanguage": "Interface language",
  "settings.interfaceLanguageHelp":
    "The language of buttons, labels and help text.",
  "settings.languageSavedLocally":
    "Saved in this browser only. There is no brand on this account yet to save it to.",
  "settings.deleteSection": "Delete this account",
  "settings.deleteAccount": "Delete account",
  "settings.deleteAccountHelp":
    "Your brand, everything in Knowledge, everything Studio has made, and your sign-in. There is no undo and no backup to restore from.",
  "settings.deleteWhatGoes":
    "This removes every row and every file belonging to this brand, then the account itself. It cannot be reversed.",
  "settings.deleteTypeName": "Type {name} to confirm.",
  "settings.deleteTypeNameLabel": "Brand name",
  "settings.deleteForever": "Delete everything",
  "settings.deleting": "Deleting…",
  "settings.deleteFailed": "Nothing was deleted. Try again.",

  "settings.hero.brandChip": "{brand}",
  "settings.you": "You",
  "settings.youSub": "Your name is what the greeting on Home uses.",
  "settings.name": "Name",
  "settings.email": "Email",
  "settings.emailFixed": "Email is fixed for now. Write to us and we will change it.",
  "settings.save": "Save",
  "settings.saved": "Saved",
  "settings.saving": "Saving…",
  "settings.saveFailed": "Nothing was saved. Try again.",
  "settings.brand": "Brand",
  "settings.brandSub": "Asked during setup. This is where you correct them.",
  "settings.brandName": "Brand name",
  "settings.website": "Website",
  "settings.websiteInvalid": "That does not look like a web address.",
  "settings.industry": "Industry",
  "settings.forYou": "For you",
  "settings.forCustomers": "For your customers",
  "settings.outputLanguage": "What Studio writes",
  "settings.outputLanguageHelp":
    "The language Studio writes in, which is what your customers read.",
  "settings.account": "Account",
  "settings.accountSub": "Signing in, and deleting the account.",
  "settings.signOut": "Sign out",
  "settings.signingOut": "Signing out…",
  "settings.comingUp": "Coming up",
  "settings.soonPlan": "Plan",
  "settings.soonPlanDesc": "Your subscription and what it includes",
  "settings.soonCredits": "Credit use",
  "settings.soonCreditsDesc": "How much of this month's allowance you have used",
  "settings.soonTeam": "Team",
  "settings.soonTeamDesc": "Invite people and share one brand",
  "settings.soonNotifications": "Notifications",
  "settings.soonNotificationsDesc": "What we email you about",
  "settings.soonBilling": "Billing",
  "settings.soonBillingDesc": "Invoices and payment method",

  "guardrails.title": "Guardrails Studio obeys",
  "guardrails.whichProduct": "Which product",
  "guardrails.pickProduct": "Pick a product",
  "guardrails.saved": "Saved ✓",
  "calc.applyToProduct": "Apply to product",
  "calc.quickCalculation": "Quick calculation — no product",

  // ── Onboarding ▸ industries ───────────────────────────────────────────────
  "industry.tech": "Tech & SaaS",
  "industry.ecommerce": "E-commerce",
  "industry.health": "Health & Wellness",
  "industry.food": "Food & Beverage",
  "industry.services": "Professional Services",
  "industry.fashion": "Fashion & Beauty",
  "industry.education": "Education",
  "industry.realEstate": "Real Estate",
  "industry.other": "Other",

  // ── Onboarding ▸ logo slots and colours ───────────────────────────────────
  "logoSlot.primary": "Primary Logo",
  "logoSlot.dark": "Dark Background Version",
  "logoSlot.mark": "Icon / Mark Only",
  "logoSlot.white": "White Version",
  "colourRole.secondary": "Secondary",
  "colourRole.accent": "Accent",

  // ── Onboarding ▸ strategy options ─────────────────────────────────────────
  "onboarding.strategy.questionnaire": "Answer our brand questionnaire",
  "onboarding.strategy.paste": "Paste existing strategy",
  "onboarding.strategy.pasteHelp":
    "Already have a brand strategy? Paste it and we'll structure it.",
  "onboarding.strategy.upload": "Upload a PDF",
  "onboarding.strategy.uploadHelp": "Upload your brand guidelines or strategy document.",
  "onboarding.strategy.later": "You can always set this up later from the Brand Library.",

  // ── Onboarding ▸ steps ────────────────────────────────────────────────────
  "onboarding.step.basics": "Name, website & industry",
  "onboarding.step.logo": "Logo Upload",
  "onboarding.step.visuals": "Your brand visuals",
  "onboarding.step.palette": "Your color palette",
  "onboarding.step.strategy": "Brand Strategy",
  "onboarding.step.positioning": "How you position your brand",
  "onboarding.step.allDone": "All Done",
  "onboarding.step.workspaceReady": "Your workspace is ready",
  "onboarding.back": "← Back",
  "onboarding.skipArrow": "Skip for now →",
  "onboarding.notAuthenticated": "Not authenticated",
  "onboarding.saveFailed": "Something went wrong saving your brand. Please try again.",

  // ── Onboarding ▸ the module cards on the last step ────────────────────────
  "module.dashboard": "Dashboard",
  "module.dashboardDesc": "Your brand command centre at a glance.",
  "module.create": "Create",
  "module.createDesc": "Generate on-brand content in seconds.",
  "module.brandLibrary": "Brand Library",
  "module.brandLibraryDesc": "Voice, visuals, and strategy in one place.",
  "module.assetLibrary": "Asset Library",
  "module.assetLibraryDesc": "All your logos, images, and files organised.",
  "module.imageArchitect": "Image Architect",
  "module.imageArchitectDesc": "AI-powered image generation for your brand.",
  "module.businessTools": "Business Tools",
  "module.businessToolsDesc": "Pricing, finance, and operations support.",

  // ── Channels ▸ platforms, goals, capacity ─────────────────────────────────
  "goal.awareness": "Awareness",
  "goal.community": "Community",
  "goal.authority": "Authority",
  "goal.leads": "Leads",
  "goal.sales": "Sales",
  "goal.recruiting": "Recruiting",
  "setup.justMe": "Just me",
  "setup.meFreelancer": "Me + freelancer",
  "setup.internalTeam": "Internal team",
  "setup.agency": "Agency",
  "setup.branditect": "Branditect produces it",

  // ── Channels ▸ the five questions ─────────────────────────────────────────
  "channels.q1": "Which platforms are you committing to for the next 90 days?",
  "channels.q1Why": "Strategy is platform-shaped. No TikTok scripts if you're not on TikTok.",
  "channels.q2": "What is social actually doing for the business right now?",
  "channels.q2Why":
    "The same brand produces very different content if the goal shifts. Awareness content ≠ sales content.",
  "channels.q3": "How much can you actually produce per week — and who's behind it?",
  "channels.q3Why":
    "Quality decay is the #1 reason social strategies fail. We won't propose 15 reels a week if one person on a laptop is making them.",
  "channels.q4": "Name 3–5 accounts whose social you admire — in your space or adjacent.",
  "channels.q4Why":
    "Branditect studies their cadence, format mix, and topic patterns. Not to copy, to benchmark what good looks like in this category.",
  "channels.q5": "What do you NOT want to look or sound like on social?",
  "channels.q5Why":
    "Knowing what to avoid is half of staying on-brand. This becomes a negative constraint the AI checks every social output against, forever.",
  "channels.antiExample": "fake-vulnerable founder posts\nLinkedIn-bait listicles",

  // ── Channels ▸ validation ─────────────────────────────────────────────────
  "channels.errStart": "Failed to start",
  "channels.errPlatform": "Pick at least one platform.",
  "channels.errGoal": "Pick a primary goal.",
  "channels.errCapacity": "Both volume and production setup are required.",
  "channels.errMinAccounts": "Give us at least 3 accounts.",
  "channels.errMaxAccounts": "Cap is 5 accounts — pick your sharpest.",
  "channels.errAntiPattern": "Tell us at least one anti-pattern — even just one chip.",
  "channels.errSave": "Save failed",

  // ── Channels ▸ status and progress ────────────────────────────────────────
  "channels.step2Ships":
    "Step 2 ships the rendered Strategy Doc here — content pillars, platform style guides, 30-day calendar, anti-pattern card. Your answers are saved.",
  "channels.working":
    "Reading your brand strategy → studying your reference accounts → cross-referencing your goals → building your pillars → drafting examples.",
  "channels.brandStrategy": "Brand Strategy",
  "channels.toneOfVoice": "Tone of Voice",
  "channels.notSetUp": "not set up yet",
  "channels.voiceRules": "voice rules, vocab",
  "channels.proceedAnyway":
    "You can still proceed — but pillars and example posts get sharper once Brand Strategy and Tone of Voice are filled in.",
  "channels.starting": "Starting…",
  "channels.resume": "Resume",
  "channels.begin": "Begin",
  "channels.generate": "Generate strategy",

  // A whole sentence, not fragments. See the note in fi.ts — the screen used to
  // build this by concatenating five pieces around inline emphasis, which does
  // not survive a language whose word order differs.
  "channels.whatThisAnswers":
    "Brand Strategy answers who we are. BrandTone answers how we sound. This answers what we post on Wednesday. Branditect already knows most of it — we just need 5 things to fill the gaps.",

  // ══ MARKETING SITE ══ app/(site) and components/site.
  // Public pages. These are served from real locale routes (/fi, /fi/pricing,
  // /fi/about), never from the bd_locale cookie — one URL must be one language
  // or search indexes whichever it saw first.

  // ── Nav and shared ────────────────────────────────────────────────────────
  "site.nav.howItWorks": "How it works",
  "site.nav.pricing": "Pricing",
  "site.nav.about": "About",
  "site.nav.logIn": "Log in",
  "site.startFree": "Start free",
  "site.mostPopular": "Most popular",
  "site.threeTruths": "Brand truth · Product truth · Commercial truth",
  "site.notAGenerator": "Not a copy generator. A commercial brain.",
  "site.commercialBrain": "The commercial brain",
  "site.checkEmail": "Check your email",
  "site.goToSignIn": "Go to sign in",

  // ── Landing ───────────────────────────────────────────────────────────────
  "site.home.metaTitle": "Branditect · The commercial brain for your brand",
  "site.home.h1a": "You run the business.",
  "site.home.h1b": "We do the work.",
  "site.home.sub": "Your whole business lives in your head. Branditect is where you put it instead.",
  "site.home.cta": "Start building with Branditect for free, today.",
  "site.home.noCard": "No card required. Your brand brain is yours to keep.",
  "site.home.askIt": "Ask it",
  "site.home.itAnswers": "It answers",
  "site.home.secHome": "Home.",
  "site.home.secProducts": "Products.",
  "site.home.secStudio": "Studio.",
  "site.home.yourStrategy": "Your strategy.",
  "site.home.yourProductKnowledge": "Your product knowledge.",
  "site.home.yourTrueNumbers": "Your true numbers.",
  "site.home.q25": "You answer 25 questions. Not “what is your mission”. Why you started, who you are",
  "site.home.step1": "Say what the brand is",
  "site.home.step1Body":
    "Twenty questions build your strategy and your tone of voice. Five of them open the workspace. The rest can wait.",
  "site.home.step2": "Give it what you know",
  "site.home.step2Body":
    "Products, documents, images and links. Everything you upload is read and indexed, and that part never costs a credit.",
  "site.home.step3": "Get work back",
  "site.home.step3Body":
    "Copy in your voice citing your own facts, images shot in your own light, and offers that respect your floor price.",
  "site.home.gaps": "Big brands close those gaps with people.",
  "site.home.gapsPunch": "They have a marketing team. You have Branditect.",
  "site.home.readWhole": "Read the whole thing",
  "site.home.getStartedFree": "Get started for free!",
  "site.home.freeTerms": "A hundred credits, no card, no countdown. Pay when you want it working for you.",
  "site.home.everyPlan": "Every plan side by side, and what a credit buys",

  // ── Pricing ───────────────────────────────────────────────────────────────
  "site.pricing.metaTitle": "Pricing · Branditect",
  "site.pricing.freeToBuild": "Free to build.",
  "site.pricing.monthly": "Monthly",
  "site.pricing.yearly": "Yearly",
  "site.pricing.whatIsCredit": "What is a credit?",
  "site.pricing.action": "Action",
  "site.pricing.cost": "Cost",
  "site.pricing.topUp": "Run out before the month does and you can add",
  "site.pricing.sideBySide": "Everything, side by side",
  "site.pricing.buildFree": "Build the brain for nothing.",
  "site.pricing.readWhatItDoes": "Read what it does",

  // ── About ─────────────────────────────────────────────────────────────────
  "site.about.metaTitle": "About · Branditect",
  "site.about.whatThisIs": "What this is",
  // One sentence, not two keys. See the note in fi.ts.
  "site.about.threeQuestions": "Three questions every brand has to answer. Answer them once.",
  "site.about.threeTruthsBody":
    "Three kinds of truth, held in one place, each one usable by everything else.",

  "site.about.brandTruth": "Brand truth",
  "site.about.brandTruthBody":
    "Your strategy, positioning, tone of voice and visual identity, written down once and used by everything you make afterwards.",
  "site.about.productTruth": "Product truth",
  "site.about.productTruthBody":
    "Every product, its specifications and the claims you can actually prove. If a number is not in there, nothing will write it.",
  "site.about.commercialTruth": "Commercial truth",
  "site.about.commercialTruthBody":
    "Landed cost, real margin, floor price and the most you will discount. The part that decides whether the work was worth doing.",

  "site.about.howItWorks": "How it works",
  "site.about.defineFeedMake": "Define, feed, make.",
  "site.about.define": "Define",
  "site.about.feed": "Feed",
  "site.about.make": "Make",

  "site.about.fourDecisions": "Four decisions we will not trade away.",
  "site.about.fourDecisionsBody":
    "These are the ones that would be easy to soften and expensive to lose.",
  "site.about.closedBook": "Closed book",
  "site.about.closedBookBody":
    "It writes from what you gave it and nothing else. Ask for a product that is not in there and it says so rather than inventing one.",
  "site.about.sourcedClaims": "Sourced claims",
  "site.about.sourcedClaimsBody":
    "Every hard fact in a draft carries the record it came from. An undeclared number is the failure this whole system exists to prevent.",
  "site.about.marginAwareness": "Margin awareness",
  "site.about.marginAwarenessBody":
    "Offers and discounts are checked against your floor price before you see them, so nothing suggests a price that loses you money.",
  "site.about.staysYours": "Your brand stays yours",
  "site.about.staysYoursBody":
    "Your files, your strategy and your numbers belong to you. There is one way anything leaves the system, and you send it deliberately.",

  "site.about.whoItIsFor": "Who it is for.",
  "site.about.forYouIf": "For you if",
  "site.about.for1": "You sell something specific and you know what it costs you",
  "site.about.for2": "Your brand decisions live in your head or in one old deck",
  "site.about.for3": "You write your own copy and you are tired of explaining the brand each time",
  "site.about.for4": "You have been burned by a tool that invented a product feature",
  "site.about.for5": "You run one brand properly, or a few brands that must not bleed into each other",
  "site.about.notForYouIf": "Not for you if",
  "site.about.not1": "You want volume content and do not mind where the facts came from",
  "site.about.not2": "You have no products yet and nothing to be truthful about",
  "site.about.not3": "You need a design tool. This decides what to say, not how to lay it out",
  "site.about.not4": "You want a chatbot with no setup. The five questions are the whole point",
  "site.about.not5": "You need invoicing, VAT returns or accounting. Numbers is about margin, not books",

  "site.about.theCompany": "The company",
  "site.about.builtInFinland": "Built in Finland.",
  "site.about.whereItRuns": "Where it runs",
  "site.about.whereItRunsBody":
    "Your data is held on EU infrastructure, and we handle it under GDPR as the processor of what you put in.",
  "site.about.whoOwnsIt": "Who owns it",
  "site.about.whoOwnsItBody":
    "Your files, your strategy and everything you make stay yours. Close the account and you can take it with you.",
  "site.about.reachUs": "Where to reach us",
  "site.about.answerThree": "Answer the three questions.",
  "site.about.seePlans": "See the plans",

  "site.about.altStudio":
    "The Studio row in Branditect: cards for writing copy, creating images, doing the numbers and reaching your brand assets.",
  "site.about.altNumbers":
    "The Numbers section of Branditect showing three calculators for working out landed cost, margin and a floor price.",

  // ══ SITE, round two ══ The strings my first pass cut at inline tags, plus
  // everything that was never between tags at all.

  // ── The three that were truncated ─────────────────────────────────────────
  // Whole sentences. The first pass stopped at the first `<`, so each of these
  // lost its tail to an <em>, a <b> or a <br/>.
  "site.home.q25full":
    "You answer 25 questions. Not “what is your mission”. Why you started, who you are actually for, what you will never claim even when it costs you a sale. Branditect turns the answers into a strategy foundation: positioning, audience, voice, anti-voice and your claim rules.",
  "site.pricing.topUpFull":
    "Run out before the month does and you can add {topUp} with one click, or wait for the next month. Nothing is deleted and nothing stops working. You keep reading your brand brain either way.",
  "site.pricing.h1": "The commercial brain for your brand.",

  // ── Landing: hero and trust ───────────────────────────────────────────────
  "site.home.lede":
    "The commercial brain for product and ecommerce brands. It holds your strategy, your product truth and your margins together, so everything you publish is on brand, accurate and profitable. It writes your copy understanding each and every one of your products, your tone of voice and style. And makes your images, too. It’s like",
  "site.home.trust1": "Free forever",
  "site.home.trust2": "No card to start",
  "site.home.trust3": "100 credits to try everything",
  "site.home.trust4": "Your data stays in the EU",

  // ── Landing: the roles ────────────────────────────────────────────────────
  "site.home.role1": "A strategist, who decides what the brand stands for and what it will never say",
  "site.home.role2": "A product manager, on top of every product, every detail and every price",
  "site.home.role3": "A copywriter, who can write it the same way twice",
  "site.home.role4": "A designer and a photographer, producing the images before anyone asks for them",
  "site.home.role5": "Someone who holds the library: every product image, video and logo, in every format and crop",
  "site.home.role6": "A shared drive that one person is supposed to maintain full time, and usually does not",

  // ── Landing: the three cards ──────────────────────────────────────────────
  "site.home.card1Ask": "Who is this actually for, and how should I talk to them?",
  "site.home.card1Answer":
    "Your customer segment in a paragraph you could hand to a freelancer, the trigger that makes them buy, the voice you chose, and the four claims your own rules block. Every output after this obeys it, which is what the next two cards are.",
  "site.home.card2Ask":
    "Write a post and a catalogue entry for SKU 12 and SKU 14, and find every image linked to them.",
  "site.home.card2Answer":
    "Both formats, in your voice, written to the segment you defined in card one. Three verified selling points with the document each one came from. Two claims blocked for lack of evidence. Eleven images across the two products, with the five cleared for retail use marked.",
  "site.home.card3Ask": "Can I run 25% off this product?",
  "site.home.card3Answer":
    "Not at your current cost. Your floor is 21%, which changed when packaging went up in March. Want the campaign written to 21%?",

  // ── Footer ────────────────────────────────────────────────────────────────
  "site.footer.contact": "Contact",
  "site.footer.madeIn": "Made in Finland",

  // ── Plans ─────────────────────────────────────────────────────────────────
  "plan.free.name": "Free",
  "plan.free.who": "Build the brain. Keep it as long as you like.",
  "plan.free.vatLine": "No card required",
  "plan.free.credits": "100 credits",
  "plan.free.creditsLabel": "One time, no expiry",
  "plan.free.f1": "Brand truth. Strategy, positioning, tone of voice, visual identity",
  "plan.free.f2": "Product truth. Every product, its specs and the claims you can prove",
  "plan.free.f3": "Commercial truth. Landed cost, margin, floor price, discount limits",
  "plan.free.f4": "Every file you upload read and indexed, free",
  "plan.free.f5": "Brand Readiness, so you know what is still missing",
  "plan.free.f6": "1 brand, 200 MB. Yours to read, always",

  "plan.pro.who": "For a founder running one brand properly.",
  "plan.pro.credits": "350 credits",
  "plan.everyMonth": "Every month",
  "plan.pro.cta": "Start free, upgrade later",
  "plan.pro.f1": "The whole brain, now working for you",
  "plan.pro.f2": "Copy that cites your own product facts and shows where each number came from",
  "plan.pro.f3": "Offers and discounts checked against your floor price before you see them",
  "plan.pro.f4": "Images shot in your own light, from your own references",
  "plan.pro.f5": "Ask your brain anything. It has read everything you gave it",
  "plan.pro.f6": "Your brand kit link for freelancers and printers",
  "plan.pro.f7": "1 brand, 1 seat, 5 GB",

  "plan.proplus.who": "For agencies and anyone running more than one brand.",
  "plan.proplus.credits": "600 credits",

  "plan.ent.who": "For brand portfolios and larger teams.",
  "plan.ent.vatLine": "Priced on what you need",
  "plan.ent.credits": "Agreed",
  "plan.ent.creditsLabel": "Set with you",
  "plan.ent.cta": "Contact us",
  "plan.ent.f1": "Unlimited brands and seats",
  "plan.ent.f2": "Single sign-on",
  "plan.ent.f3": "Custom data agreement",
  "plan.ent.f4": "A named contact, not a queue",
  "plan.ent.f5": "We set the brain up with you",

  // ── Compare table ─────────────────────────────────────────────────────────
  "cmp.price": "Price, incl. VAT, monthly",
  "cmp.credits": "Credits",
  "cmp.brands": "Brands",
  "cmp.seats": "Seats",
  "cmp.storage": "Storage",
  "cmp.kitLink": "Brand kit share link",
  "cmp.support": "Support",
  "cmp.onceOnly": "100 once",
  "cmp.perMonth350": "350/mo",
  "cmp.perMonth600": "600/mo",
  "cmp.agreed": "Agreed",
  "cmp.unlimited": "Unlimited",
  "cmp.yes": "Yes",
  "cmp.no": "No",
  "cmp.docs": "Docs",
  "cmp.email": "Email",
  "cmp.emailPriority": "Email, priority",
  "cmp.namedContact": "Named contact",

  // ── What a credit buys ────────────────────────────────────────────────────
  "credit.image": "One image",
  "credit.image.cost": "5 credits",
  "credit.copy": "One set of three copy drafts",
  "credit.copy.cost": "2 credits",
  "credit.question": "One question to your brand brain",
  "credit.question.cost": "1 credit",
  "credit.indexing": "Reading and indexing any file you upload",
  "credit.indexing.cost": "Free",
  "credit.topUp": "€9 for 200 extra credits",

  // ══ SITE, round three ══ The 67 from spec/i18n-gap-site.md. Whole strings,
  // placeholders preserved. The four dead keys this replaces —
  // site.commercialBrain, site.home.q25, site.pricing.topUp, site.home.lede —
  // should be deleted, not kept alongside these.

  // ── About: the body ───────────────────────────────────────────────────────
  "site.about.opening":
    "What do we stand for. What exactly do we sell. What can we afford to charge. The answers exist already, buried in a slide deck nobody opens, an inbox nobody searches and a spreadsheet one person maintains. Branditect is where they live instead.",
  "site.about.homeCaption":
    "One screen that knows how much of your brand has been written down, and what is still missing. It says the diagnosis rather than the compliment.",
  "site.about.asteriskCaption":
    "Look at the asterisk in the margin column. That is the system telling you a figure is estimated because a landed cost is missing. It would rather admit that than quietly overstate your margin.",
  "site.about.threeVerbs":
    "Three verbs in order. Every screen belongs to exactly one of them, and anything that belongs to none of them is not built.",
  "site.about.defineBody":
    "Twenty questions build your strategy, your tone of voice and your visual identity. Five of them are enough to open the workspace. The rest can wait.",
  "site.about.feedBody":
    "Products, documents, images, links. Everything you upload is read and indexed, and that part never costs a credit.",
  "site.about.makeBody":
    "Everything in Studio reads the same brain. Nothing here has its own separate idea of what your brand is.",
  "site.about.marginMath":
    "Margins are calculated net of tax and against landed cost, never factory cost against a gross price. That difference is about five points, and it is the difference between a product you think is profitable and one that is.",
  "site.about.secondColumn":
    "The second column is not modesty. It is what makes the first one believable, and it saves us both a conversation.",
  "site.about.oneInbox": "One inbox, read by the people who build it.",
  "site.about.fourMinutes":
    "About four minutes for the five that matter. A hundred credits, no card, and nothing expires.",
  "site.about.altHome":
    "The Branditect Home screen for a brand called Ruffle Studio: Brand Readiness with its four checks, counts of the files the brain has read, and the Studio tools underneath.",
  "site.about.altProducts":
    "The Products screen for Ruffle Studio, listing each product with its cost, its price and its real margin, one margin figure marked with an asterisk.",

  // ── About: metadata and OG ────────────────────────────────────────────────
  "site.about.metaDesc":
    "Branditect is one place that knows your brand strategy, your products and your margins, and makes things from them. Built in Finland, on EU infrastructure.",
  "site.about.ogSub":
    "One place that knows your strategy, your products and your margins, and makes things from them.",
  "site.about.ogTag": "What it is, what it will not do, and who it is for.",

  // ── Home: metadata and OG ─────────────────────────────────────────────────
  "site.home.metaDesc":
    "One place that holds your strategy, your product truth and your margins, so everything you publish is on brand, accurate and profitable. Build it free.",
  "site.home.ogSub":
    "One place that holds your strategy, your product truth and your margins. Build it free.",
  "site.home.ogTag": "One place that knows your strategy, your products and your margins.",

  // ── Pricing: metadata and OG ──────────────────────────────────────────────
  "site.pricing.metaDesc":
    "Build your brand brain free, with 100 credits and no card. Plans from {FROM} a month including VAT.",
  "site.pricing.ogSub": "Build your brand brain free. Plans from {FROM} a month including VAT.",
  "site.pricing.ogTag": "Build it free. Pay when you want it working for you.",

  // ── Landing ───────────────────────────────────────────────────────────────
  "site.home.ledeFull":
    "The commercial brain for product and ecommerce brands. It holds your strategy, your product truth and your margins together, so everything you publish is on brand, accurate and profitable. It writes your copy understanding each and every one of your products, your tone of voice and style. And makes your images, too. It’s like having a superstar marketing team behind you.",
  "site.home.altHome":
    "The Branditect home screen for a brand called Ruffle Studio: a Brand Readiness score with its four checks, counts of the documents and images the brain has read, and a row of Studio tools.",
  "site.home.homeCaption":
    "Brand Readiness tells you what is still missing, and the Studio row is what you can make with what the brain already knows. Nothing on this screen is a guess.",
  "site.home.eachUsable":
    "Each one is usable by everything else, which is the whole difference between a brand brain and a folder of documents.",
  "site.home.altProducts":
    "The Products screen for Ruffle Studio, listing each product with its cost, its price and its real margin, with one margin figure marked by an asterisk.",
  "site.home.sameBrain":
    "Everything here reads the same brain. Nothing has its own separate idea of what your brand is.",
  "site.home.builtBy":
    "Built by a team that has spent two decades building brands around the world. Made in Finland.",
  "site.home.notInstincts":
    "What a big brand has is not better instincts than you. It is strategy and infrastructure.",
  "site.home.givesYouBoth":
    "Branditect gives you both, at whatever stage you are at. First product or four hundredth. You still make every decision. You stop making them from memory.",
  "site.home.fourMinutes":
    "About four minutes for the five that matter. A hundred credits, no card, and nothing expires.",

  // ── Pricing page ──────────────────────────────────────────────────────────
  "site.pricing.lede":
    "Branditect turns your scattered files, decisions and numbers into one knowledge layer that knows your strategy, your products and your margins. Build the whole thing for nothing. Pay when you want it working for you.",
  "site.pricing.billingPeriod": "Billing period",
  "site.pricing.twoMonthsFree": "2 months free",
  "site.pricing.plans": "Plans",
  "site.pricing.vatYearly": "Incl. VAT, billed {yearlyTotal} yearly",
  "site.pricing.vatLine": "Incl. VAT {VAT_RATE}",
  "site.pricing.letsTalk": "Let’s talk",
  "site.pricing.creditIs":
    "One unit of work the brain does for you. Reading and indexing whatever you upload is always free, because a brain that charges you to learn is the wrong shape.",
  "site.pricing.freeHomeCaption":
    "This is your Home screen on the free plan. Brand Readiness on the left, what the brain has read on the right, and what you can make with it underneath.",
  "site.pricing.altHome":
    "The Branditect Home screen for a brand called Ruffle Studio: a Brand Readiness score with its four checks, counts of the documents and images the brain has read, and a row of Studio tools.",
  "site.pricing.readinessIs":
    "Brand Readiness is four checks, each worth a quarter. It says what is missing rather than congratulating you, because a score you can predict is worth more than one that looks precise.",

  // ── Shared ────────────────────────────────────────────────────────────────
  "site.perMonth": "/month",
  "site.signUpOrLogIn": "Sign up or log in",
  "site.ogTitle": "Branditect, the commercial brain for your brand",

  // ── Plans: the rest ───────────────────────────────────────────────────────
  "plan.everythingInPro": "Everything in Pro, plus",
  "plan.proplus.f1": "3 brands, each with its own truth. They never bleed into each other",
  "plan.proplus.f2": "3 seats, so your team writes from the same brain",
  "plan.proplus.f3": "20 GB",
  "plan.proplus.f4": "Priority support",
  "plan.storage200mb": "200 MB",
  "plan.storage5gb": "5 GB",
  "plan.storage20gb": "20 GB",

  // ══ APP, batch A ══ Home, all of Numbers, the entry flow, notes and the
  // welcome modal. From spec/i18n-gap.md.
  //
  // NOT INCLUDED, and deliberately: 'DM Sans', sans-serif · 'Space Grotesk',
  // sans-serif · background 0.15s · EUR · English · Suomi. Those are font
  // stacks, a CSS transition, a currency code and two language names that must
  // read the same in both. They are scanner catch, not copy.

  // ── Home: the Studio row and the chat prompts ─────────────────────────────
  "home.writeDesc": "On brand, on strategy, on the facts.",
  "home.imagesDesc": "New images based on your products and style.",
  "home.numbersTitle": "Do the numbers",
  "home.numbersDesc": "Profitability, pricing structure and offers.",
  "home.visualDesc": "Your logos, colors and typefaces.",
  "home.prompt1": "What does packaging cost on our top product?",
  "home.prompt2": "What is the exact hex of our main brand colour?",
  "home.prompt3": "Give me three Instagram ideas for this week",

  // ── Numbers: shared field labels ──────────────────────────────────────────
  "num.productionCost": "Production cost",
  "num.freightDuty": "Freight & duty",
  "num.packaging": "Packaging",
  "num.shipping": "Shipping",
  "num.returnsRate": "Returns rate",
  "num.refundRate": "Refund rate",
  "num.churnRate": "Churn rate",
  "num.paymentFees": "Payment fees",
  "num.adCostPerSale": "Ad cost per sale",
  "num.cartonPallet": "Carton / pallet",
  "num.paymentTerms": "Payment terms",
  "num.storeCommission": "Store commission %",
  "num.resellerCommission": "Reseller commission",
  "num.retailPrice": "Retail price",
  "num.taxRate": "Tax rate",
  "num.costPerUnit": "Cost per unit",
  "num.targetMargin": "Target margin",
  "num.minMargin": "Minimum margin",
  "num.monthlyPrice": "Monthly price",
  "num.costToAcquire": "Cost to acquire",

  // ── Numbers: index ────────────────────────────────────────────────────────
  "num.costLede": "Know what every sale really costs.",
  "num.costSub":
    "Everything it takes to put one unit in a customer's hands, and what happens when a cost moves.",
  "num.priceLede": "Find the price that gives you the margin you want.",
  "num.priceSub":
    "Set a target margin and get the price to hit it, or type a price and see what you'd actually keep after tax and fees.",
  "num.offersLede": "Know what you can give away before it hurts.",
  "num.offersSub": "Model the offers you actually run, and find where each one stops being worth it.",
  "num.recurringLede": "See what a customer is worth over time.",
  "num.recurringSub":
    "MRR, churn and lifetime value, and how long it takes to earn back what you spent acquiring someone.",
  "num.discountCeiling": "Discount ceiling",
  "num.freeShipThreshold": "Free-ship threshold",
  "num.averageBasket": "Average basket",
  "num.noLandedCost": "No landed cost recorded yet",
  "num.noPrice": "No price recorded yet",
  "num.usesPriceHere": "Uses the price you set in here",
  "num.shownBecauseSubscription": "Shown because you charge a subscription",
  "num.indexLede":
    "Work out what you really make on every sale, set prices that hit your target margin, and build offers that don't quietly cost you money. Then",
  "num.allCosted": "all costed",
  "num.missingCosts": "{missing} missing costs",
  "num.noCostedProducts": "no costed products",
  "num.addRunningCostsInline": "add running costs",
  "num.atYourBestMargin": "at your best margin",
  "num.physicalGoods": "Physical goods",
  "num.digitalAccess": "Digital & access",
  "num.subscription": "Subscription",
  "num.allThatApply": "all that apply",
  "num.ownSite": "Own site",
  "num.wholesale": "Wholesale",
  "num.appStore": "App store",
  "num.overheadExplainer":
    "Rent, salaries, software and marketing don't care how much you sell. Add them up once, shared across every product, and Branditect works out the volume that covers them, and what your real floor price is.",
  "num.addRunningCostsNote":
    "Add your running costs and this becomes a real number. Without them the floor price is only half a floor.",
  "num.noPricedProduct": "No product has both a price and a cost yet.",
  "num.everySaleLoses":
    "Every sale loses money at these prices, so no volume covers the overhead. Fix the price or the cost first.",
  "num.addRunningCosts": "Add running costs",
  "num.costOfEachSale": "cost of each sale",
  "num.grossProfit": "gross profit",
  "num.runningCosts": "running costs",
  "num.operatingProfit": "operating profit",
  "num.notAdvice":
    "These are calculations from the figures you enter, not advice. Check them against your own accounts before you change a price. Tax treatment and platform fees vary by market and can move a margin by several points.",

  // ── Numbers: cost ─────────────────────────────────────────────────────────
  "num.cost.fromChannels":
    "These lines come from how you said you sell. Highlighted ones were added by your channels, and you can change them in",
  "num.cost.onNumbers": "on Numbers.",
  "num.cost.sellingDirect": "selling direct",
  "num.cost.addedBy": "added by {from}",
  "num.cost.spreadAcross": "Spread across",
  "num.cost.unitsInBatch": "units in the batch, if these are batch costs",
  "num.cost.costToServeOne": "Cost to serve one",
  "num.cost.fillLeft":
    "Fill in the lines on the left. Rates are excluded from the total: they change what a sale costs, but they aren't a sum.",
  "num.cost.entered":
    "{filled} of {costable} cost lines entered. This is what to put in the product card's landed cost.",
  "num.cost.landedNotFactory":
    "Landed cost, not factory cost, is what margin is computed from. Factory cost alone overstates the margin by about five points, and a discount rule built on the wrong figure eats the difference on every promotion.",

  // ── Numbers: pricing ──────────────────────────────────────────────────────
  "num.price.haveAPrice": "I have a price",
  "num.price.haveATarget": "I have a target margin",
  "num.price.landedHint": "landed, not factory",
  "num.price.taxHint": "left blank, retail is treated as net",
  "num.price.grossHint": "gross, what the customer pays",
  "num.price.marginAtPrice": "Margin at that price",
  "num.price.enterCostPrice": "Enter a cost and a price.",
  "num.price.losesMoney": "You lose money on every sale at this price.",
  "num.price.priceForMargin": "Price for {tgt}% margin",
  "num.price.enterCostTarget": "Enter a cost and a target margin.",
  "num.price.netOfTax":
    "Margin is always net of tax against landed cost. Comparing a gross price to a factory cost is the flattering version, and it is wrong by about five points.",

  // ── Numbers: offers ───────────────────────────────────────────────────────
  "num.offers.ceilingNote":
    "Whatever ceiling you land on becomes the limit Studio writes inside. It will not promise a deeper discount than the product allows.",
  "num.offers.lineYouWontCross": "the line you won't cross",
  "num.offers.discountWanted": "Discount you want to run",
  "num.offers.belowMinimum": "That is below your {mm}% minimum, so Studio would refuse to write this offer.",
  "num.offers.clearsMinimum": "That clears your minimum.",
  "num.offers.deepest": "Deepest discount you can run",
  "num.offers.enterThree": "Enter a price, a cost and a minimum margin.",
  "num.offers.alreadyAtFloor":
    "At {currency} this product is already at its {mm}% floor. Any discount breaks it.",
  "num.offers.perProduct":
    "Guardrails are per product. A €6 clip cannot carry a €99 floor, so this ceiling belongs to this product alone, not to the brand.",

  // ── Numbers: recurring ────────────────────────────────────────────────────
  "num.rec.lede":
    "One-off pricing asks what a sale is worth. Recurring asks what a customer is worth, and how long it takes to earn back what you spent getting them.",
  "num.rec.revenuePerCustomer": "Revenue per customer",
  "num.rec.perMonthNet": "per month, net of tax",
  "num.rec.grossMargin": "Gross margin",
  "num.rec.afterCostToServe": "on that revenue, after cost to serve",
  "num.rec.monthlyChurn": "Monthly churn",
  "num.rec.shareWhoLeave": "share who leave each month",
  "num.rec.acquisitionHint": "marketing and sales, per customer",
  "num.rec.ltv": "Lifetime value",
  "num.rec.zeroChurn":
    "At zero churn nobody ever leaves, so lifetime is infinite, which is not a number worth showing.",
  "num.rec.fillFour": "Fill in all four fields.",
  "num.rec.payback": "Payback",
  "num.rec.noMargin": "There is no margin to pay back the acquisition cost.",
  "num.rec.paybackNote":
    "How long before a customer has repaid what you spent acquiring them. LTV is {ltvToCac}× acquisition cost.",
  "num.rec.worthLess":
    "Each customer is worth less than they cost to acquire. Growing faster makes this worse, not better: the fix is churn, margin or acquisition cost, not volume.",

  // ── Numbers: running costs ────────────────────────────────────────────────
  "num.run.couldNotSave": "Could not save",
  "num.run.monthlyTotals":
    "Monthly totals, not receipts. Shared across every product: rent is not a property of a hair dryer.",
  "num.run.onePerLine":
    "One figure per line. Leave a line blank if it doesn't apply: blank and zero mean different things here.",
  "num.run.save": "Save running costs",
  "num.run.onBusiness":
    "Saved on the business, not on a product. Nothing here changes what Studio is allowed to write: guardrails live on each product card.",
  "num.run.noProductsYet":
    "No products yet, so there is no contribution to divide the overhead by. Your total above is still saved and will apply the moment you add one.",
  "num.run.eachSaleLoses":
    "Each sale loses money, so no volume covers the overhead. Fix the price or the cost before worrying about break-even.",
  "num.run.setByMinMargin":
    "Set by your {minMarginPct}% minimum margin. That test binds above the overhead one at this volume.",
  "num.run.setByOverhead":
    "Set by covering overhead at your expected volume, which binds above your minimum margin. Without running costs this would read lower and be only half a floor.",
  "num.run.notFullyLoaded":
    "divided across units. A “fully loaded” unit cost makes every product's margin depend on how many of everything else sold. Contribution plus break-even says the same thing without moving whenever an unrelated product has a good month.",

  // ── Calculator shell and guardrails ───────────────────────────────────────
  "calc.nothingSaved": "Nothing here is saved. These figures live on the product card, use",
  "calc.pressSaveThere": "and press save there.",
  "calc.pickToApply":
    "Pick a product above to apply this. Without one this is a quick calculation: useful for pricing something you haven't added yet, and nothing is lost by staying here.",
  "calc.prefillFrom": "Prefill from",
  "calc.noProductsToPrefill":
    "No products yet, so there is nothing to prefill from. This is a quick calculation, and that is a normal way to use it: work out the numbers first, add the product after.",
  "guardrails.didNotSave": "That did not save.",
  "guardrails.pickToSet":
    "Pick a product to set its limits. They are per product on purpose: a six euro clip cannot carry a ninety-nine euro floor.",
  "guardrails.floorPrice": "Floor price",
  "guardrails.minMargin": "Min margin",
  "guardrails.saveLimits": "Save limits",

  // ── Notes ─────────────────────────────────────────────────────────────────
  "notes.couldNotLoad": "Could not load your notes.",
  "notes.couldNotOpen": "Could not open that note.",
  "notes.someImagesFailed": "Some images could not be loaded.",
  "notes.notSaved": "Not saved. Your changes are still on screen.",
  "notes.couldNotCreate": "Could not make a note.",
  "notes.pdfNotWired": "Download as PDF is built server-side, and is not wired up yet.",
  "notes.nothingElseHere": "Nothing else lives here yet.",
  "notes.new": "New note",
  "notes.empty":
    "Nothing here yet. A note is a scratchpad: anything you write in one reaches AI Chat.",
  "notes.noMatch": "Nothing matches “{query}”.",
  "notes.untitled": "Untitled",
  "notes.emptyPreview": "Empty",
  "notes.pickOne": "Pick a note, or start one.",
  "notes.note": "Note",
  "notes.title": "Note title",
  "notes.image": "Image",
  "notes.caption": "Caption",
  "notes.imageCaption": "Image caption",
  "notes.heading": "Heading",

  // ── Start: the profile taps ───────────────────────────────────────────────
  "profile.whatDoYouSell": "What do you sell?",
  "profile.physicalProducts": "Physical products",
  "profile.digitalProducts": "Digital products or software",
  "profile.howDoTheyPay": "How do people pay?",
  "profile.oneOff": "One-off purchases",
  "profile.onSubscription": "On subscription",
  "profile.whoDoesWork": "Who is doing the work?",
  "profile.twoOrThree": "Two or three of us",
  "profile.whatLanguage": "What language should we write in?",
  "profile.gettingStarted": "Getting started",
  "profile.getToKnow": "Let’s get to know your business",
  "profile.fourTaps":
    "Four quick taps, no typing. This sets the examples you’ll see, the language Studio writes in, and the profile your Numbers section needs.",

  // ── Auth form ─────────────────────────────────────────────────────────────
  "auth.createAccount": "Create your account",
  "auth.welcomeBack": "Welcome back 👋",
  "auth.startBuilding": "Start building your brand workspace",
  "auth.logInToWorkspace": "Log in to your brand workspace",
  "auth.orContinueEmail": "or continue with email",
  "auth.password": "Password",
  "auth.enterPassword": "Enter your password",
  "auth.minChars": "At least {MIN_PASSWORD} characters",
  "auth.creatingAccount": "Creating account…",
  "auth.signingIn": "Signing in…",
  "auth.createAccountBtn": "Create account",

  // ── Welcome modal ─────────────────────────────────────────────────────────
  "welcome.step1": "Step 1: Brand",
  "welcome.step1Body": "Answer the strategy questionnaire and set your tone of voice.",
  "welcome.step2": "Step 2: Knowledge",
  "welcome.step2Body": "Upload the documents, images and links your brand should know.",
  "welcome.step3": "Step 3: Studio",
  "welcome.step3Body": "Write copy and create images from everything you just fed it.",
  "welcome.step4": "Step 4: Numbers",
  "welcome.step4Body": "Add costs and pricing so Studio never writes past your margins.",
  "welcome.quote": "“They have a marketing team. You have Branditect.”",
  "welcome.fourSteps": "4 steps",

  // ══ APP, batch B ══ Studio (create images, write, brand book), Knowledge
  // (documents, images, links) and the whole product card.
  //
  // NOT KEYED, deliberately: the seven CSS values in knowledge/links
  // ("1px solid #EDEBE8", "spin 0.75s linear infinite", "64px 1fr auto" …), the
  // Tailwind class string in product-drawer, and the product names Canva and
  // Google Slides. Scanner catch, not copy.

  // ── Knowledge ▸ Documents ─────────────────────────────────────────────────
  "docs.all": "All",
  "docs.productInfo": "Product info",
  "docs.companyInfo": "Company info",
  "docs.tooBig": "{name} exceeds the 50 MB limit.",
  "docs.uploadFailed": "Upload failed",
  "docs.uploadFailedNamed": "Failed to upload {name}: {msg}",
  "docs.needTitle": "Please add a title.",
  "docs.needContent": "Please add some content.",
  "docs.building": "Building…",
  "docs.active": "Active",
  "docs.onlyTheseDocs":
    "Branditect will only use information found in these documents. It will never invent product names, features, pricing, or company facts. If information is not in the vault, it will ask rather than guess.",
  "docs.dropFilesOr": "Drop files here or",
  "docs.saveToVault": "Save to vault →",
  "docs.none": "No documents yet. Upload brand files to start building your vault.",
  "docs.noneInCategory": "No documents in this category.",

  // ── Knowledge ▸ Images ────────────────────────────────────────────────────
  "assets.intro": "Access and manage all your brand assets in one place.",
  // Reworded so the brand name is never inflected. See the note in fi.ts: the
  // English possessive has no translatable form when the noun is a variable.
  "assets.introNamed": "Access and manage all brand assets for {brandName} in one place.",

  // ── Knowledge ▸ Links ─────────────────────────────────────────────────────
  "templates.adding": "Adding…",

  // ── Studio ▸ Brand book ───────────────────────────────────────────────────
  "bb.title": "Brand book",
  "bb.upload": "Upload brand book",
  "bb.uploadYours": "Upload your brand book",
  "bb.fileTypes": "PNG, JPG, PDF, screenshots",
  "bb.fileTypesDrag": "PNG, JPG, screenshots — drag & drop or click",
  "bb.chooseFiles": "Choose files",
  "bb.colorCodes": "Color codes",
  "bb.add": "+ Add",
  "bb.addPages": "+ Add pages",
  "bb.autoExtracted": "Auto-extracted when you ask AI about colors",
  "bb.viewer": "Brand book viewer",
  "bb.reading": "Reading the brand materials...",
  "bb.askPlaceholder": "Ask about the brand — colors, fonts, logo rules...",
  "bb.uploadFirst": "Upload brand book first, then ask questions...",
  "bb.ask": "Ask",
  // FIXME (build side): the source reads `No {toLowerCase} yet` — a method name
  // has leaked into the template. It needs the actual noun before it can be
  // translated. Keyed with a placeholder so the Finnish is ready either way.
  "bb.noneYet": "No {kind} yet",

  // ── Studio ▸ Create images ────────────────────────────────────────────────
  "ci.lede":
    "Pick something that already looks right, say what you want to see, and get a new image shot in the same light.",
  "ci.whatAreYouMaking": "What are you making?",
  "ci.fromCatalogue": "Something from your catalogue",
  "ci.somethingElse": "Something else",
  "ci.peoplePlacesMoods": "People, places, moods",
  "ci.noProducts": "No products yet. Add one in Knowledge ▸ Products, or pick Something else.",
  "ci.whichProduct": "Which product?",
  "ci.onePhotoAdded": "1 product photo added as reference below.",
  "ci.noPhotoOnFile": "No product photo on file, so nothing was added below.",
  "ci.keptExact":
    "The label, shape and colour are kept exact, and “this product” in your description means this one.",
  "ci.pickReferences": "Pick your reference pictures",
  "ci.pickReferencesHelp":
    "Choose pictures that show what you are after. Up to three, and all of them are read.",
  "ci.from": "From",
  "ci.upload": "Upload",
  "ci.whereIsIt": "Where is it?",
  "ci.whereHelp": "This is the one thing a picture cannot tell us on its own.",
  "ci.plainBackground": "Plain background",
  "ci.indoors": "Indoors",
  "ci.outdoors": "Outdoors",
  "ci.outsideDaylight": "Outside, daylight",
  "ci.whatDoYouWant": "What do you want to see?",
  "ci.sayItPlainly": "Say it plainly, the way you would to a photographer.",
  "ci.oneSentence": "One sentence is enough.",
  "ci.shape": "Shape",
  "ci.anythingElseLong": "Anything else — props, angle, space for text",
  "ci.anythingElse": "Anything else",
  "ci.exThisProduct": "This product on a silver background",
  "ci.exNamedProduct": "{name} on a silver background",
  "ci.exBottle": "The bottle on a kitchen counter in morning light",
  "ci.whichImages": "Which images",
  "ci.session": "Session",
  "ci.nothingMade": "Nothing made yet.",
  "ci.nothingMadeHelp":
    "Pick a reference picture and say what you want to see. The first one takes about fifteen seconds.",
  "ci.matchingLight": "Matching the light and grade from your references…",
  "ci.get": "Get",
  "ci.nothingSaved": "Nothing saved yet.",
  "ci.savedGoTo":
    "Saved images go to Knowledge ▸ Images, and can be used as references next time.",
  "ci.useAsReference": "Use as reference",
  "ci.pickFromKnowledge": "Pick from Knowledge",
  "ci.fromKnowledgeImages": "From Knowledge ▸ Images",
  "ci.noImagesInKnowledge": "No images in Knowledge yet.",
  "ci.didntWork": "That didn't work.",
  "ci.notSavedReason": "Not saved — {message}",
  "ci.savedToKnowledge": "Saved to Knowledge ▸ Images",
  "ci.notSaved": "Not saved",

  // ── Studio ▸ Write ────────────────────────────────────────────────────────
  "wr.short": "Short",
  "wr.medium": "Medium",
  "wr.long": "Long",
  "wr.didntWork": "That didn't work.",
  "wr.lede":
    "Two answers and you have a draft. Everything it writes obeys your strategy, your tone of voice and your real product facts.",
  "wr.whatAreWeWriting": "What are we writing?",
  "wr.whatPlaceholder": "What are we writing? A press note, a video script…",
  "wr.whatsItAbout": "What’s it about?",
  "wr.aboutHelp": "One or two lines is enough. Say what happened and who it's for.",
  "wr.tapExample": "Tap an example to fill it in, then edit. These change with the format you picked.",
  "wr.options": "Options",
  "wr.aboutAProduct": "About a product",
  "wr.noParticularProduct": "No particular product",
  "wr.drafts": "Drafts",
  "wr.howManyDrafts": "How many drafts",
  "wr.writing": "Writing…",
  "wr.writeIt": "Write it",
  "wr.writesFrom": "Writes from",
  "wr.oneProductRecord": "1 product record",
  "wr.productRecords": "{products} product records",
  "wr.writeMore": "Write {count} more",
  "wr.pickFormat": "Pick a format and say what it’s about.",
  "wr.didntFinish": "didn't finish",
  "wr.copied": "Copied",
  "wr.checkingClaims": "Checking every claim against your product records…",
  "wr.noTone": "No tone of voice yet, using plain, neutral copy.",
  "wr.setOne": "Set one →",
  "wr.fact": "Fact: {claim}, from {source}",

  // ── Product card ▸ media ──────────────────────────────────────────────────
  "media.notAvailable": "Not available.",
  "media.couldNotLoad": "Could not load.",
  "media.couldNotUntag": "Could not untag. It is still on this product.",
  "media.couldNotTag": "Could not tag. Nothing was added.",
  "media.tagImages": "Tag images",
  "media.tagImagesHelp": "Tag images from your library, or generate some in Studio.",
  "media.createInStudio": "Create images in Studio",
  "media.tagToAnotherNamed": "Tag {file_name} to another product",
  "media.documentsLiveIn": "Documents live in",
  "media.knowledgeDocuments": "Knowledge ▸ Documents",

  // ── Product card ▸ pricing ────────────────────────────────────────────────
  "pricing.netOfTax": "Net of tax, against cost of goods.",
  "pricing.contribution": "Contribution",
  "pricing.afterCostToSell": "After cost to sell as well.",
  "pricing.noTaxRate":
    "No tax rate recorded, so both figures assume zero. A missing rate treated as zero reads the gross price as net and flatters the margin.",
  "pricing.addOwnLine": "+ Add your own line",
  "pricing.studioFollows": "Studio reads this and follows it. {length} characters.",
  "pricing.guardrailsMoved": "Floor price, maximum discount and minimum margin now live in",

  // ── Product card ▸ drawer ─────────────────────────────────────────────────
  "product.tabDetails": "Details",
  "product.tabInventory": "Inventory",
  "product.tabMedia": "Media",
  "product.tabHistory": "History",
  "product.discardChanges": "Discard unsaved changes to this product?",
  "product.changeImage": "Change product image",
  "product.change": "Change",
  "product.untitled": "Untitled product",
  "product.name": "Product name",
  "product.sku": "SKU",
  "product.barcode": "Barcode",
  "product.units": "Units",
  "product.source": "Source",
  "product.stockNote":
    "Stock is here for one reason: so Studio won't promote something you can't ship. Reorder points, suppliers and lead times belong in your inventory system, not your brand brain.",
  "product.imageNote": "The shot on the product list. Tagged images below do not change it.",
  "product.noHistory":
    "No changes recorded yet. Price and cost edits will appear here with who made them — someone will eventually need to know when a price changed and why.",
  "product.saveChanges": "Save changes",

  // ── Product card ▸ specs ──────────────────────────────────────────────────
  "specs.nameField": "Specification {i} name",
  "specs.valueField": "Specification {i} value",
  "specs.exampleValue": "8.4 L/kg",
  "specs.addRow": "+ Add specification",
  "specs.helpStructured":
    "Structured facts Studio can quote verbatim — spec tables, comparison blocks, ad claims. A row with no name is discarded.",

  // ══ APP, batch C ══ Visual identity (page + uploads), product import, the
  // image library, the image pickers and the document ask panel.
  //
  // Only files Claude Code has not opened. Everything else in i18n-gap.md today
  // is either its in-flight work or a scanner catch: the Tailwind class string
  // in product-drawer, "analyses: Record", the CSS in knowledge/links, the
  // media-category codes (IMG, SND, GFX) and their file-extension lists, the
  // SSO vendor names, "Branditect", and "Routing" / "Brand setup", which are
  // withTimeout labels that mapThrown replaces before anyone sees them.

  // ── Brand ▸ Visual identity ───────────────────────────────────────────────
  "vi.lede1": "Every logo, colour and typeface, in the versions that are actually current.",
  "vi.lede2":
    "Files named “primary” and “symbol only” are a filing cabinet. This is the same set, sorted by the question people actually arrive with.",
  "vi.platesFixed":
    "Each plate is fixed to its slot, so you can see whether a reversed file actually works before you use it. Download the one you need.",
  "vi.uploadThree":
    "Upload the primary, a reversed version and the symbol on its own — those three cover almost every use.",
  "vi.swatchesCopy":
    "Every swatch copies. The contrast badge is measured against white at render, so it cannot go stale — it is the difference between a colour you can set text in and one you can only fill a shape with.",
  "vi.addTheOnesYouUse":
    "Add the ones you actually use — a primary, an ink and a background will carry most of what Studio makes. Or pull them straight out of a screenshot.",
  "vi.opensIn": "Opens in {platform}",
  "vi.opensInNewTab": "Opens in a new tab",
  "vi.fourThings":
    "The four things that go wrong most often. They live here rather than on page 34 of a PDF, because a rule nobody reads is not a rule.",
  "vi.nothingUploaded":
    "Nothing has been uploaded for this brand yet. Logos, colours and typefaces appear here as they are added.",
  // The specimen line. See the note in fi.ts: this is the one string on the page
  // that cannot be translated word for word, because its job is to show glyphs.
  "vi.pangram": "Sphinx of black quartz, judge my vow",

  // ── Brand ▸ Visual identity ▸ uploads ─────────────────────────────────────
  "vi.uploading": "Uploading…",
  "vi.chooseFile": "Choose a file",
  "vi.nameTypefaceFirst": "Name the typeface first",
  "vi.specimenNote":
    "The specimen on this page is set in the real typeface, so a name that is not on Google Fonts will show as a fallback rather than silently look right.",
  "vi.addTypeface": "Add typeface",

  // ── Knowledge ▸ Products ▸ import ─────────────────────────────────────────
  // Newlines are part of the string: it is a textarea placeholder with a worked
  // example under it. Keep \n\n between the blocks.
  "import.pastePlaceholder":
    "Paste your product list, price list, service menu, or any text describing your products/services here...\n\nExample:\nBrand Strategy Workshop — €1,500\nA full-day workshop to define your brand positioning and messaging framework.\n\nSocial Media Retainer — €800/month\nMonthly management of 2 social channels including content creation and scheduling.",

  // ── Knowledge ▸ Products ──────────────────────────────────────────────────
  "products.noneMatch": "{length} products in the catalogue, none with that name, SKU or category.",

  // ── Knowledge ▸ Documents ▸ ask panel ─────────────────────────────────────
  // One sentence split around <strong>{t("ask.notDescribed")}</strong>. The
  // English half B carries its own leading space; the Finnish half B opens on a
  // comma and must not get a JSX {" "} in front of it. See fi.ts.
  "ask.skipKeepsA": "Skip keeps the type above and no description. Files without one wait under",
  "ask.skipKeepsB": " until you add it.",

  // ── Knowledge ▸ Images ▸ library ──────────────────────────────────────────
  "images.uploadOne": "Upload 1 image",
  "images.uploadMany": "Upload {count} images",
  "images.shownOf": "{shown} of {total} images",
  "images.removeFromFile": "Remove {name} from {file_name}",

  // ── Product card ▸ image picker ───────────────────────────────────────────
  // "Tag images" with no count already exists as media.tagImages. Reused rather
  // than keyed twice: two keys holding the same sentence drift apart.
  "picker.tagToProduct": "Tag images to this product",
  "picker.tagOne": "Tag image",
  "picker.tagN": "Tag {count} images",
  "picker.oneWillShow": "This image will show on the product’s card.",
  "picker.nWillShow": "{count} images will show on the product’s card.",

  // ══ APP, complete pass ══ 2026-09-14. Everything still English on screen
  // when Finnish was selected. THE FINNISH IN THIS BLOCK WAS WRITTEN BY CLAUDE
  // at Saara's request, not by the design side, and wants a review pass.

  // ── Home, the shell, auth and the start flow ──
  // ── Greeting ──────────────────────────────────────────────────────────────
  "greeting.hello": "Hello",
  "greeting.morning": "Good morning",
  "greeting.afternoon": "Good afternoon",
  "greeting.evening": "Good evening",

  // ── Brand Readiness: checks ───────────────────────────────────────────────
  "readiness.check.questionnaire": "Strategy questionnaire",
  "readiness.check.knowledgeFiles": "Files in Knowledge",
  "readiness.check.brandImages": "Product & brand images",
  "readiness.check.brandGuideline": "Brand guideline",
  "readiness.detail.notStarted": "Not started",
  "readiness.detail.allAnswered": "All {total} answered",
  "readiness.detail.answeredOf": "{answered} of {total} answered",
  "readiness.detail.required": "{count} of {required} required",
  "readiness.detail.uploaded": "Uploaded",
  "readiness.detail.notUploaded": "Not uploaded yet",
  "readiness.action.start": "Start",

  // ── Brand Readiness: bands ────────────────────────────────────────────────
  "readiness.band.starting": "Starting",
  "readiness.band.building": "Building",
  "readiness.band.good": "Good",
  "readiness.band.complete": "Complete",

  // ── Brand Readiness: the headline under the greeting ──────────────────────
  // One whole sentence per check and branch. The English used to be built from
  // the lowercased label and action, which no other language can follow.
  "readiness.headline.allDone": "Every check is done. Your brand brain is fully trained.",
  "readiness.headline.oneLeft.questionnaireStart":
    "One check left — start your strategy questionnaire to reach 100%.",
  "readiness.headline.oneLeft.questionnaireContinue":
    "One check left — continue your strategy questionnaire to reach 100%.",
  "readiness.headline.oneLeft.knowledgeFiles":
    "One check left — upload your files in knowledge to reach 100%.",
  "readiness.headline.oneLeft.brandImages":
    "One check left — upload your product & brand images to reach 100%.",
  "readiness.headline.oneLeft.brandGuideline":
    "One check left — upload your brand guideline to reach 100%.",
  "readiness.headline.manyLeft.questionnaire":
    "{remaining} checks left — start with your strategy questionnaire.",
  "readiness.headline.manyLeft.knowledgeFiles":
    "{remaining} checks left — start with your files in knowledge.",
  "readiness.headline.manyLeft.brandImages":
    "{remaining} checks left — start with your product & brand images.",
  "readiness.headline.manyLeft.brandGuideline":
    "{remaining} checks left — start with your brand guideline.",

  // ── Brand Readiness: the line inside the hero ─────────────────────────────
  "readiness.copy.allDone": "All four checks are done. Everything Studio makes is grounded in your brand.",
  "readiness.copy.done0": "Zero of {totalCount} checks done.",
  "readiness.copy.done1": "One of {totalCount} checks done.",
  "readiness.copy.done2": "Two of {totalCount} checks done.",
  "readiness.copy.done3": "Three of {totalCount} checks done.",
  "readiness.copy.gap.questionnaire":
    "Your strategy questionnaire is the gap — closing it is what teaches Branditect the rest.",
  "readiness.copy.gap.knowledgeFiles":
    "Your files in knowledge is the gap — closing it is what teaches Branditect the rest.",
  "readiness.copy.gap.brandImages":
    "Your product & brand images is the gap — closing it is what teaches Branditect the rest.",
  "readiness.copy.gap.brandGuideline":
    "Your brand guideline is the gap — closing it is what teaches Branditect the rest.",
  // The decorative tile on the hero. Lines are split on \n.
  "readiness.tile": "YOUR\nBRAND\nFOUNDATION",

  // ── Recent activity ───────────────────────────────────────────────────────
  "activity.justNow": "Just now",
  "activity.minutesAgo": "{mins}m ago",
  "activity.hoursAgo": "{hours}h ago",
  "activity.yesterday": "Yesterday",
  "activity.daysAgo": "{days} days ago",
  "activity.lastWeek": "Last week",
  "activity.weeksAgo": "{weeks} weeks ago",

  // ── Chat rail ─────────────────────────────────────────────────────────────
  "chatRail.trained": "TRAINED",
  "chatRail.readsEverything": "Reads your Brand, your Numbers and everything in Knowledge.",
  "chatRail.filesIndexed": "{count} files indexed.",

  // ── Onboarding strip on Home ──────────────────────────────────────────────
  "onboardingStrip.progress": "You’re {answered} of {total} into your strategy.",
  "onboardingStrip.fiveOpenStudio": "Five answers open Studio.",

  // ── Auth ──────────────────────────────────────────────────────────────────
  "auth.emptyEmail": "Enter your email",
  "auth.emptyBrandName": "Enter your brand name",
  "auth.badEmail": "That doesn't look like an email address",
  "auth.badCredentials": "That email and password don't match",
  "auth.shortPassword": "At least 10 characters",
  "auth.alreadyRegistered": "That email already has an account.",
  "auth.rateLimited": "Too many attempts. Try again in 15 minutes.",
  "auth.serverError": "Something went wrong at our end. Try again.",
  "auth.timedOut": "That took too long. Check your connection and try again.",
  "auth.resetSent": "If that email has an account, a reset link is on its way.",
  "auth.resetExpired": "That link has expired. Request a new one.",
  "auth.confirmSent":
    "Check your email to confirm your address, then sign in. Your questionnaire is waiting.",
  "auth.signInInstead": "Sign in instead",
  "auth.feature.write": "Write on brand",
  "auth.feature.imagesDesc": "New visuals based on your products and style.",
  "auth.feature.numbersDesc": "Profitability, pricing and offers that make sense.",
  "auth.feature.assets": "Brand assets",
  "auth.feature.assetsDesc": "Logos, colors, guidelines and everything in one place.",
  "auth.hidePassword": "Hide password",
  "auth.showPassword": "Show password",
  "auth.ssoDemoNote": "Demo version. Sign in with email for now.",
  "auth.continueWith": "Continue with {name}",

  // ── Andy panel ────────────────────────────────────────────────────────────
  "andy.conversation": "Conversation",
  "andy.newConversation": "New conversation",
  "andy.newShort": "+ New",
  "andy.workspace": "{brandName} workspace",
  "andy.aiChat": "Branditect AI chat",
  "andy.greeting": "Hi. How can I help?",
  "andy.greetingBrand": "Hi — welcome to the {brandName} workspace. How can I help?",
  "andy.saveToNotes": "Save to notes",

  // ── Old onboarding flow ───────────────────────────────────────────────────
  "shell.onboarding.questionnaireDesc":
    "38 strategic questions that build your complete brand foundation. Takes 15-30 minutes.",
  "shell.onboarding.ready": "Branditect for {brandName} is ready.",

  // ── /start ────────────────────────────────────────────────────────────────
  "start.fourSections": "Four sections, twenty questions.",
  "start.fiveOpen": "Five of them open your workspace. The rest sharpen it whenever you come back.",
  "start.timeCost":
    "Twenty questions, but only five are needed to open your workspace — about four minutes. The rest can wait, and they show up in Brand Readiness so you know what is still missing.",
  "start.pickUp": "Pick up where you left off",
  "start.start": "Start",
  "start.wereOnOf20": "You were on question {n} of 20. Everything you wrote is saved.",
  "start.gate.cleared": "Your workspace is open. The remaining questions are in Brand Readiness.",
  "start.gate.needs":
    "Studio needs {total} answers before it can write in your voice. You're {done} of {total} in.",
  "start.questionOf": "Question {n} of {total}",
  "start.stepOf": "Step {index} of 4 · {title}",
  "start.requiredNote": "One of the five answers that unlocks your workspace.",
  "start.skippableNote": "Skippable — it becomes a Brand Readiness item you can come back to.",
  "start.finish": "Finish",
  "start.nextQuestion": "Next question",
  "start.qNote.6": "The highest-leverage answer in the whole questionnaire. Everything Studio writes starts here.",
  "start.qNote.8": "Two voices — Calm and Expert — need real proof here. A number, a certification or a test.",
  "start.qNote.10": "Every phrase you capture here is usable verbatim in copy. This is the customer language bank.",
  "start.qNote.20":
    "\"What specifically\" is the whole question. \"I like Aesop\" is unusable. \"The restraint\" is a brief.",
  "start.exemplar.physical": "— a boot repair business, not yours. Copy the shape, not the words.",
  "start.exemplar.digital": "— a late-invoice app, not yours. Copy the shape, not the words.",
  "start.exemplar.service": "— a window cleaner, not yours. Copy the shape, not the words.",
  "start.resume.welcomeBack": "Welcome back",
  "start.resume.nothingLost": "Nothing was lost.",
  "start.resume.finding": "Finding your place…",
  "start.resume.answeredOf": "{answered} of {total} answered.",
  "start.resume.wereOn": "You were on question {n} of {total}.",
  "start.resume.allSaved":
    "Everything you have written is saved. The questions you skipped are waiting in Brand Readiness, not lost.",
  "rail.sectionAnswered": "{answered} of {total} answered",
  "rail.sectionQuestions": "{total} questions",
  "start.notSavedRetrying": "Not saved — retrying",
  "start.finishLater": "Finish later →",

  // ── Not built yet ─────────────────────────────────────────────────────────
  "planPage.description": "Billing, plan tier and renewal date. Not wired up yet — your workspace is unaffected.",
  "shell.backToHome": "Back to Home",
  "chat.pageDescription":
    "The full-page conversation with your brand-trained assistant, reading your Brand, your Numbers and everything in Knowledge. The rail on Home is live; this larger view is still to come.",

  // ── Knowledge and the product card ──
  // ── Documents ─────────────────────────────────────────────────────────────
  "documents.browse": "browse",
  "documents.chars": "{count} chars",
  "documents.pagesShort": "{count}p",
  "documents.type.safetySheet": "Product safety sheet",
  "documents.type.certificate": "Certificate or test report",
  "documents.type.spec": "Specification",
  "documents.type.manual": "Manual or instructions",
  "documents.type.priceList": "Price list",
  "documents.type.contract": "Contract or quotation",
  "documents.type.presentation": "Presentation",
  "documents.type.brandGuideline": "Brand guideline",
  "documents.type.catalogue": "Catalogue",
  "documents.contractNoteRest": "Stored, searchable by you, never quoted by Studio.",

  // ── Images and media tabs ─────────────────────────────────────────────────
  "kImages.removeLinkFailed": "Could not remove that link.",
  "kImages.readyOne": "{count} image ready",
  "kImages.readyMany": "{count} images ready",
  "kImages.countOne": "{count} image",
  "kImages.countMany": "{count} images",
  "kImages.emptyLibrary": "No images uploaded yet. Drop some files above to get started.",
  "kImages.noFilterMatch": "No images match your filters.",
  "kImages.copiedCheck": "Copied ✓",
  "kImages.select": "Select {name}",
  "kImages.deselect": "Deselect {name}",
  "kImages.cat.social": "social",
  "kImages.cat.event": "event",
  "kImages.cat.product": "product",
  "kImages.cat.campaign": "campaign",
  "kImages.cat.brand": "brand",
  "kImages.cat.aiGenerated": "ai-generated",
  "kImages.format.square": "square",
  "kImages.format.story": "story",
  "kImages.format.landscape": "landscape",
  "kImages.format.portrait": "portrait",
  "kImages.format.other": "other",

  "mediaTabs.imagesDesc": "Photos, screenshots, brand imagery",
  "mediaTabs.videos": "Videos",
  "mediaTabs.videosDesc": "Brand videos, reels, ads",
  "mediaTabs.videosEmpty": "No videos uploaded yet. Drop video files above to get started.",
  "mediaTabs.sounds": "Sounds",
  "mediaTabs.soundsDesc": "Audio logos, jingles, podcasts",
  "mediaTabs.soundsEmpty": "No audio files yet. Upload audio logos, jingles, or podcast clips.",
  "mediaTabs.graphics": "Graphics",
  "mediaTabs.graphicsDesc": "Logos, icons, illustrations, vectors",
  "mediaTabs.graphicsEmpty": "No graphics yet. Upload logos, icons, illustrations, and vectors.",
  "mediaTabs.web": "Website / App",
  "mediaTabs.webDesc": "Screenshots, wireframes, UI components",
  "mediaTabs.webEmpty": "No website or app assets yet. Upload screenshots, wireframes, and UI references.",

  // ── File library and upload reports ───────────────────────────────────────
  "files.maxSize": "{acceptLabel} · Max {maxSize}MB",
  "files.noMatch": "No files match your search",
  "files.upload.thatFile": "That file",
  "files.upload.tooBig": "{name} is over the size limit and was not uploaded.",
  "files.upload.storage": "{name} could not be stored.",
  "files.upload.storageDetail": "{name} could not be stored: {detail}",
  "files.upload.row": "{name} was uploaded but could not be saved to the library.",
  "files.upload.rowDetail": "{name} was uploaded but could not be saved to the library: {detail}",
  "files.upload.lead": "{failed} of {attempted} files did not upload.",
  "files.upload.sameTooBig": "is over the size limit and was not uploaded.",
  "files.upload.sameStorage": "could not be stored.",
  "files.upload.sameStorageDetail": "could not be stored: {detail}",
  "files.upload.sameRow": "was uploaded but could not be saved to the library.",
  "files.upload.sameRowDetail": "was uploaded but could not be saved to the library: {detail}",

  // ── Document ask panel ────────────────────────────────────────────────────
  "ask.uploadingOne": "Uploading {count} file",
  "ask.uploadingMany": "Uploading {count} files",
  "ask.stillUploading": "Still uploading — you can answer now, it saves when they land.",
  "ask.allUploaded": "All uploaded.",
  "ask.hideFiles": "Hide the files",
  "ask.setOneDifferently": "Set one file differently ({count})",
  "ask.typeFor": "Type for {name}",
  "ask.sameAsAbove": "Same as above",
  "ask.descriptionFor": "Description for {name}",
  "ask.uploadingTag": "uploading",

  // ── Links and presentations ───────────────────────────────────────────────
  "links.connected": "Connected",
  "links.notConnected": "Not connected",
  "presentations.body":
    "Presentations you upload will be indexed here alongside your documents, so Studio can quote a deck the same way it quotes a PDF. Decks currently land in Documents — nothing is lost, they just aren't separated out yet.",
  "presentations.goToDocuments": "Go to Documents",

  // ── Products list and product card ────────────────────────────────────────
  "product.saveFailed": "That did not save. The product is still here.",
  "product.restoreFailed": "Could not put it back. Reload and try again.",
  "product.colProduct": "Product",
  "product.colPrice": "Price",
  "product.colMargin": "Margin",
  "product.estimatedNote":
    "Estimated — computed without a landed cost or tax rate, so it reads high. Open a product to see which figure is missing.",
  "product.emptyBody": "Branditect can't write about products it doesn't know. Add your first, or import your catalogue.",
  "product.sortedAsc": "Products, sorted by {sort} ascending",
  "product.sortedDesc": "Products, sorted by {sort} descending",
  "product.sort.margin": "margin",
  "product.sort.price": "price",
  "product.sort.name": "name",
  "product.removeName": "Remove {name}",
  "product.showing": "Showing {from}–{to} of {total} products",
  "product.stock.inStock": "In stock",
  "product.stock.lowStock": "Low stock",
  "product.stock.outOfStock": "Out of stock",
  "product.detailLabel": "{name} detail",
  "product.removing": "Removing…",
  "product.removed": "{name} removed",
  "product.confirmTitle": "Remove {name}?",
  "product.confirmBody":
    "It comes off your product list and out of everything Studio writes. Its costs, prices and guardrails are kept for {days} days, so you can put it back.",
  "product.confirmRemove": "Remove it",

  // ── Pickers ───────────────────────────────────────────────────────────────
  "picker.tagIntro": "From your image library. They show under Images and video on this product.",
  "picker.emptyHelp":
    "Product shots live in Knowledge ▸ Images so the image creator can read them. Upload some there and they'll appear here.",
  "picker.noMatch": "No images match “{query}”.",
  "picker.tagged": "Tagged",
  "picker.tagging": "Tagging…",
  "picker.pickOneOrMore": "Pick one or more",
  "picker.selected": "{count} selected",
  "picker.openedFromSuggestion": "Opened from a suggestion on {word}. Nothing is tagged until you confirm.",
  "picker.noProducts": "No products yet. Add one in Knowledge ▸ Products first.",
  "picker.tagToName": "Tag to {name}",
  "picker.couldNotTag": "Could not tag ({status})",
  "picker.confirmTag": "Tag",
  "picker.confirmOneToOne": "Tag {images} image to 1 product",
  "picker.confirmOneToMany": "Tag {images} image to {products} products",
  "picker.confirmManyToOne": "Tag {images} images to 1 product",
  "picker.confirmManyToMany": "Tag {images} images to {products} products",

  // ── Media tab ─────────────────────────────────────────────────────────────
  "media.openFile": "Open {name}",
  "media.untagFile": "Untag {name}",
  "media.untagNote": "Removes it from this product. The file stays in Knowledge.",
  "media.docsNotBuiltTail": ". Attaching one to a product is not built yet.",
  "media.role.safetySheet": "Safety sheet",
  "media.role.spec": "Spec",
  "media.role.manual": "Manual",
  "media.role.certificate": "Certificate",

  // ── Specs editor ──────────────────────────────────────────────────────────
  "specs.fallbackName": "specification {n}",

  // ── Pricing tab and pricing lines ─────────────────────────────────────────
  "productPricing.limitsTail": ". Same limits, same enforcement, the room this app keeps pricing rules in.",
  "productPricing.groupIn": "What comes in",
  "productPricing.groupInNote": "What the customer pays, and the tax inside it.",
  "productPricing.groupGoods": "Cost of goods",
  "productPricing.groupGoodsNote": "What the thing costs you before you sell it.",
  "productPricing.groupSell": "Cost to sell",
  "productPricing.groupSellNote": "What it costs to get that sale, per sale.",
  "productPricing.lineRrp": "RRP",
  "productPricing.lineUnit": "Unit cost",
  "productPricing.lineUnitHint": "What the supplier charges",
  "productPricing.lineLicence": "Licence cost",
  "productPricing.lineLabour": "Labour per job",
  "productPricing.lineCac": "CAC",
  "productPricing.lineCacHint": "What one customer costs to win",
  "productPricing.lineShip": "Shipping to customer",
  "productPricing.lineReturns": "Returns allowance",
  "productPricing.linePlatform": "Platform fee",

  // ── Import ────────────────────────────────────────────────────────────────
  "import.kindPhysical": "Physical",
  "import.kindService": "Service",
  "import.kindSaas": "SaaS",
  "import.kindDigital": "Digital",
  "import.optPhysical": "Physical Product",
  "import.optPhysicalDesc": "Tangible goods, shipped to customers",
  "import.optServiceDesc": "Consulting, coaching, agency work",
  "import.optSaas": "SaaS / Subscription",
  "import.optSaasDesc": "Software or recurring digital service",
  "import.optDigital": "Digital Product",
  "import.optDigitalDesc": "Downloads, courses, templates",
  "import.modelPerProject": "Per project",
  "import.modelPerHour": "Per hour",
  "import.modelRetainer": "Retainer / monthly",
  "import.modelCustomQuote": "Custom quote",
  "import.fieldProductName": "Product name *",
  "import.fieldRrp": "RRP (€)",
  "import.fieldWholesale": "Wholesale price (€)",
  "import.fieldCogs": "COGS (€)",
  "import.fieldDeliveryTime": "Delivery time",
  "import.fieldCapacity": "Capacity per month",
  "import.fieldServiceName": "Service name *",
  "import.fieldPrice": "Price (€)",
  "import.fieldIdealClient": "Ideal client",
  "import.fieldIncluded": "What's included (comma-separated)",
  "import.fieldPlanName": "Plan name *",
  "import.fieldMonthlyPrice": "Monthly price (€)",
  "import.fieldDeliveryFormat": "Delivery format",
  "import.editProduct": "Edit product",
  "import.addToCatalogue": "Add to catalogue",
  "import.addNToCatalogue": "Add {count} to catalogue",
  "import.extractionFailed": "Extraction failed",
  "import.somethingWrong": "Something went wrong. Please try again.",
  "import.pasteText": "Paste text",
  "import.uploadPdf": "Upload PDF",
  "import.extractWithAi": "Extract products with AI",
  "import.foundOne": "{count} product found — select which to add",
  "import.foundMany": "{count} products found — select which to add",
  "import.unnamed": "Unnamed",
  "import.unnamedProduct": "Unnamed product",
  "import.fullCatalogue": "{brandName}'s full product catalogue",
  "import.addProductPlus": "+ Add product",
  "import.priceEur": "€{amount}",
  "import.priceMonthly": "€{amount}/mo",

  // ── Studio: Write, Create images, Notes ──
  // ── Shared ────────────────────────────────────────────────────────────────

  // ── Write ─────────────────────────────────────────────────────────────────
  "write.optional": "optional",
  // One sentence with the sources in bold where {sources} sits. Finnish puts
  // "pohjana" first, so the sentence is whole and the bold part is a value.
  "write.writesFrom":
    "Writes from {sources}. It won’t invent a fact that isn’t in there. If something’s missing it says so instead of guessing.",
  "write.sourcesOne": "your strategy, tone of voice, Boundaries and 1 product record",
  "write.sourcesMany": "your strategy, tone of voice, Boundaries and {count} product records",
  "write.draftN": "Draft {n}",
  "write.words": "{count} words",
  "write.writingLower": "writing…",
  "write.tone": "Tone: {tone}",
  "write.thinBrief": "A fuller brief gets better copy.",

  // ── Write: the formats, as shown (lib/studio-write.ts labelKey) ───────────
  "studioWrite.fmt.ad": "Ad copy",
  "studioWrite.fmt.instagram": "Instagram caption",
  "studioWrite.fmt.linkedin": "LinkedIn post",
  "studioWrite.fmt.product": "Product description",
  "studioWrite.fmt.customer": "Customer message",
  "studioWrite.fmt.other": "Something else — tell us what",

  // ── Write: the example briefs, as shown and as filled in ──────────────────
  "studioWrite.eg.ad1": "The new SORBIFY OIL launch",
  "studioWrite.eg.ad2": "A price change, going out to distributors",
  "studioWrite.eg.ad3": "Why we cost less than the category leader",
  "studioWrite.eg.email1": "Warehouse closed for maintenance next week",
  "studioWrite.eg.email2": "A restock notice for people who asked",
  "studioWrite.eg.email3": "Introducing a new size to existing customers",
  "studioWrite.eg.instagram1": "Behind the absorbency test",
  "studioWrite.eg.instagram2": "A before and after from a customer site",
  "studioWrite.eg.instagram3": "The new SORBIFY OIL launch",
  "studioWrite.eg.linkedin1": "What we learned testing to 800 km",
  "studioWrite.eg.linkedin2": "Why we publish the products we can't help",
  "studioWrite.eg.linkedin3": "A hire, or a milestone",
  "studioWrite.eg.product1": "A full description for SORBIFY OIL",
  "studioWrite.eg.product2": "A short version for a distributor's catalogue",
  "studioWrite.eg.product3": "A listing for a new size in the range",
  "studioWrite.eg.customer1": "Warehouse closed for maintenance next week",
  "studioWrite.eg.customer2": "A reply to a delivery complaint",
  "studioWrite.eg.customer3": "An order delay, with the new date",
  "studioWrite.eg.other1": "A press note about the new range",
  "studioWrite.eg.other2": "A short script for a product video",
  "studioWrite.eg.other3": "A reply to a distributor asking for terms",

  // ── Create images ─────────────────────────────────────────────────────────
  "createImages.savedCount": "{count} saved",
  "createImages.productPicture": "A product picture",
  "createImages.productRef": "{name} · product",
  "createImages.removeRef": "Remove {name}",
  // Rendered on two lines, broken after the first word in both languages.
  "createImages.fromKnowledge": "From Knowledge",
  "createImages.whereIndoorsDetail": "A room, a shop",
  "createImages.egGirl": "A girl running outside wearing a yellow dress",
  "createImages.egMan": "A man on a construction site looking up at the sky",
  "createImages.makeImage": "Make the image",
  "createImages.making": "Making it…",
  "createImages.addReference": "Add a reference to start",
  "createImages.sayWhat": "Say what you want to see",
  "createImages.readyOne": "1 reference read · about 15 seconds",
  "createImages.readyMany": "{count} references read · about 15 seconds",
  "createImages.thisSession": "This session",
  "createImages.keptUnless": "Nothing is kept unless you save it",
  "createImages.inKnowledgeImages": "In Knowledge ▸ Images",
  "createImages.refOneWhere": "1 reference · {where}",
  "createImages.refsWhere": "{count} references · {where}",
  "createImages.prompt1": "Which product has no photos yet?",
  "createImages.prompt2": "What background do our product shots use?",
  "createImages.prompt3": "Which colours am I allowed to use in a new image?",

  // ── Notes ─────────────────────────────────────────────────────────────────
  "notes.countOne": "{count} note",
  "notes.countMany": "{count} notes",
  "notes.search": "Search notes",
  "notes.list": "List",
  "notes.insertImage": "Insert an image",
  "notes.pinned": "Pinned",
  "notes.downloadPdf": "Download as PDF",
  "notes.more": "More",
  "notes.halfWidth": "Half width",
  "notes.fullWidth": "Full width",
  "notes.switchWidth": "{current}. Switch to {next}",
  "notes.imageDeleted": "This image was deleted from Knowledge. The text around it is untouched.",
  "notes.blockText": "text block",
  "notes.blockHeading": "heading block",
  "notes.blockList": "list block",
  "notes.blockImage": "image block",

  // ── Studio: brand guideline, brand book, brand bases ──
  // ── Brand guideline: navigation ──────────────────────────────────────────
  "guideline.title": "Brand guideline",
  "guideline.group.identity": "Brand identity",
  "guideline.group.designSystem": "Design system",
  "guideline.nav.typography": "Typography",
  "guideline.nav.colors": "Colors",
  "guideline.nav.imageStyle": "Image style",
  "guideline.nav.buttons": "Button styles",
  "guideline.nav.graphics": "Graphic elements",
  "guideline.nav.icons": "Icons",
  "guideline.nav.packaging": "Package style",
  "guideline.nav.social": "Social media",
  "guideline.loading": "Loading brand guidelines…",
  "guideline.uploadGuideline": "↑ Upload guideline",
  "guideline.editSection": "Edit section",
  "guideline.uploadImage": "Upload image",

  // ── Brand guideline: logo slots ──────────────────────────────────────────
  "guideline.slot.brandmark": "Brandmark",
  "guideline.slot.brandmarkDesc": "Symbol / icon only",
  "guideline.slot.wordmark": "Wordmark",
  "guideline.slot.wordmarkDesc": "Logotype / text only",
  "guideline.slot.combination": "Combination mark",
  "guideline.slot.combinationDesc": "Symbol + wordmark together",
  "guideline.slot.darkbg": "Dark background",
  "guideline.slot.darkbgDesc": "White/reversed on dark",
  "guideline.slot.lightbg": "Light background",
  "guideline.slot.lightbgDesc": "Primary on white",
  "guideline.slot.mono": "Monochrome",
  "guideline.slot.monoDesc": "Single colour / emboss",

  // ── Brand guideline: section headings ────────────────────────────────────
  "guideline.tag.logos": "Brand identity — Logos",
  "guideline.logoSystem": "{name} logo system",
  "guideline.logoVersions": "Logo versions",
  "guideline.logoVersionsHelp":
    "Upload each logo variant below. The AI detects whether each upload is a wordmark, logomark, combination mark or emblem.",
  "guideline.replace": "↑ Replace",
  "guideline.uploadSlot": "Upload {label}",
  "guideline.emptySlot": "empty slot",
  "guideline.uploaded": "uploaded",
  "guideline.clearspaceRules": "Clearspace & size rules",
  "guideline.clearspaceRule": "Clearspace rule",
  "guideline.prohibitedUse": "Prohibited use",
  "guideline.tag.typography": "Brand identity — Typography",
  "guideline.ourTypography": "Our typography",
  "guideline.primaryFont": "Primary:",
  "guideline.bodyFont": "Body:",
  "guideline.sentenceCaseOnly": "Sentence case only",
  "guideline.hierarchyRespected": "Hierarchy always respected",
  "guideline.typeScale": "Type scale",
  "guideline.doDont": "Do / Don't",
  "guideline.doThis": "Do this",
  "guideline.notThis": "Not this",
  "guideline.tag.colors": "Brand identity — Colors",
  "guideline.colourSystem": "Colour system",
  "guideline.primaryPalette": "Primary palette",
  "guideline.secondaryPalette": "Secondary palette",
  "guideline.usageRules": "Usage rules",
  "guideline.tag.imageStyle": "Brand identity — Image style",
  "guideline.photography": "Photography",
  "guideline.imageryBand":
    "Imagery focuses on real environments and authentic performance — not lifestyle, not aspiration. Every image should feel like it was taken, not produced.",
  "guideline.styleRules": "Style rules",
  "guideline.approvedStyle": "Approved style",
  "guideline.tag.buttons": "Design system — Button styles",
  "guideline.variants": "Variants",
  "guideline.btn.primary": "Primary",
  "guideline.btn.secondary": "Secondary",
  "guideline.btn.accent": "Accent",
  "guideline.btn.disabled": "Disabled",
  "guideline.cornerRadius": "Corner radius",
  "guideline.tag.designSystem": "Design system — {title}",
  "guideline.library": "{title} library",
  "guideline.tag.social": "Channels — Social media",
  "guideline.canvaTemplate": "Canva template",
  "guideline.canvaPlaceholder": "Paste Canva template link…",
  "guideline.openInCanva": "Open in Canva ↗",
  "guideline.postGallery": "Post gallery",

  // ── Brand guideline: edit panel ──────────────────────────────────────────
  "guideline.editLabel": "Edit: {label}",
  "guideline.updating": "Updating section…",
  "guideline.whatToChange": "What would you like to change?",
  "guideline.changePlaceholder":
    "e.g. 'Add a monochrome color variant' or 'Update the clearspace rule to x-height instead of cap-height'",
  "guideline.referenceImage": "Reference image (optional)",
  "guideline.remove": "Remove ×",
  "guideline.uploadReference": "Upload reference screenshot or design",
  "guideline.applyWithAi": "Apply with AI →",

  // ── Brand guideline: upload modal ────────────────────────────────────────
  "guideline.uploadModalTitle": "Upload brand guideline",
  "guideline.uploadScreenshots": "Upload brand guideline screenshots",
  "guideline.pngOrJpg": "PNG or JPG — upload multiple pages.",
  "guideline.claudeReads":
    "Claude reads all pages in depth and extracts colors, fonts, logo rules, photography guidelines and all section text.",
  "guideline.whatGetsExtracted": "What gets extracted:",
  "guideline.extractedList":
    "Brand colors (applied as theme to the entire guideline), font names, logo philosophy text, photography approach, color usage rules, clearspace rules, prohibited use guidelines.",
  "guideline.extracting": "Extracting…",
  "guideline.extractingDots": "Extracting...",
  "guideline.extract": "Extract brand data",

  // ── Brand guideline: chat and toasts ─────────────────────────────────────
  "guideline.brandAi": "Brand AI",
  "guideline.askPlaceholder": "Ask the brand…",
  "guideline.chatHello": "Ask me anything about this brand — logos, colors, typography, usage rules...",
  "guideline.toast.logoUploaded": "Logo uploaded ✓",
  "guideline.toast.logoUploadedType": "Logo uploaded — {type} ✓",
  "guideline.toast.uploadFailedReason": "Upload failed: {error}",
  "guideline.toast.uploadError": "Upload error",
  "guideline.toast.uploaded": "Uploaded ✓",
  "guideline.toast.updated": "Updated ✓",
  "guideline.toast.couldNotUpdate": "Could not update — try rephrasing",
  "guideline.toast.apiError": "API error",
  "guideline.toast.extracted": "Guideline extracted — theme applied ✓",
  "guideline.toast.couldNotParse": "Could not parse — try clearer screenshots",
  "guideline.chat.primaryColor": "Primary color is {hex} — use on light backgrounds only.",
  "guideline.chat.combinationMark":
    "Use the combination mark in all primary communications. Brandmark alone only when context is established.",
  "guideline.chat.typography": "Typography: Display at {wt} weight. Never use 700/900 on headlines.",
  "guideline.chat.photography":
    "Photography: real environments, professionals at work. No stock smiles or warm tones.",
  "guideline.chat.buttons": "Button corner radius is {cornerRadius}px. Never fully rounded.",
  "guideline.chat.clearspace":
    "Clearspace = full cap-height of the wordmark on all 4 sides. Nothing enters that zone.",

  // ── Brand guideline: the placeholder guideline, before the brand has one ─
  "guideline.def.logoIntro":
    "The {brandName} logo is the primary visual expression of the brand. Built from deliberate, structured decisions, it communicates the values that define {brandName} — precision, authority and reliability. The mark and wordmark work together as a cohesive system, and each element is protected by clear rules that ensure consistency across every application.",
  "guideline.def.wordmarkNote":
    "The full combination mark is the primary brand expression. The brandmark alone is reserved for applications where the brand context is already established.",
  "guideline.def.clearspace":
    "Maintain clearspace equal to the full cap-height of the wordmark on all four sides. No element may enter this zone.",
  "guideline.def.minimumSize":
    "Never reproduce the logo smaller than 24mm in print or 80px in digital environments.",
  "guideline.def.restriction1": "Do not stretch, skew or distort the logo proportions in any direction",
  "guideline.def.restriction2": "Use the white reversed version on all dark or coloured backgrounds",
  "guideline.def.restriction3": "Never apply gradients, shadows, outlines or effects to the logo",
  "guideline.def.restriction4": "Always use approved master artwork — never recreate from scratch",
  "guideline.def.restriction5": "Never place the logo on backgrounds that compromise legibility",
  "guideline.def.typographyIntro":
    "The {brandName} type system is built on clarity, hierarchy and restraint. Every weight and size decision serves a functional purpose. The system performs across digital and print with equal authority.",
  "guideline.def.roleDisplay": "Display",
  "guideline.def.roleHeading1": "Heading 1",
  "guideline.def.roleHeading2": "Heading 2",
  "guideline.def.roleBody": "Body",
  "guideline.def.roleLabel": "Label",
  "guideline.def.usageDisplay": "Campaign heroes",
  "guideline.def.usageHeading1": "Page titles",
  "guideline.def.usageHeading2": "Section heads",
  "guideline.def.usageBody": "Running text",
  "guideline.def.usageLabel": "Tags & metadata",
  "guideline.def.sampleDisplay": "Brand in motion",
  "guideline.def.sampleHeading1": "Our core proposition",
  "guideline.def.sampleHeading2": "Built for demanding environments",
  "guideline.def.sampleBody": "Precise language, clear thinking. Every word earns its place.",
  "guideline.def.sampleLabel": "Category · Reference",
  "guideline.def.do1": "Use {fontName} as the single primary typeface across all materials",
  "guideline.def.do2": "Maintain strict hierarchy — never skip a level or mix scale steps",
  "guideline.def.do3": "Sentence case throughout — never title case in body or headline copy",
  "guideline.def.dont1": "Never use 700 or 900 weight for display or headline text",
  "guideline.def.dont2": "Do not mix more than two weights within a single layout",
  "guideline.def.dont3": "Never use all-caps for body text — only for labels and metadata",
  "guideline.def.colorsIntro":
    "Color is one of the most immediate expressions of the {brandName} identity. The palette is carefully considered — each color earns its place by serving a specific communicative role. Used consistently, the system builds immediate recognition.",
  "guideline.def.primaryDark": "Primary Dark",
  "guideline.def.light": "Light",
  "guideline.def.roleBackgrounds": "Backgrounds & headlines",
  "guideline.def.roleCtas": "CTAs & interactive elements",
  "guideline.def.roleSurfaces": "Light backgrounds & surfaces",
  "guideline.def.neutral": "Neutral",
  "guideline.def.roleDividers": "Dividers, secondary text",
  "guideline.def.primaryPairing": "Primary pairing",
  "guideline.def.darkMode": "Dark mode",
  "guideline.def.neverCombine": "Never combine",
  "guideline.def.white": "white",
  "guideline.def.accentFallback": "accent",
  "guideline.def.pairingRule": "{first} on {second}. Default for all marketing and digital surfaces.",
  "guideline.def.darkModeRule": "Light with {accent} on {dark}. Use for hero sections.",
  "guideline.def.neverCombineRule":
    "Do not pair accent and supporting colors — their visual weights conflict at scale.",
  "guideline.def.buttonsNote":
    "Buttons use a 6px corner radius — structured and confident. One primary action per view. Secondary actions are always outlined, never filled.",
  "guideline.def.imageryIntro":
    "{brandName} imagery is defined by restraint, honesty and controlled composition. Every image should feel like it was taken, not produced — real moments in real environments, captured with professional precision.",
  "guideline.def.approved1": "Clean, directional lighting — no harsh flash or artificial drama",
  "guideline.def.approved2": "Cool, neutral colour temperature aligned to the brand palette",
  "guideline.def.approved3": "Real working environments and authentic surfaces",
  "guideline.def.approved4": "Tight, confident compositions with a clear subject",
  "guideline.def.approved5": "Professionals at work in real environments, unstaged",
  "guideline.def.prohibited1": "Stock photography of smiling people in bright offices",
  "guideline.def.prohibited2": "Warm, golden-hour tones or lifestyle-adjacent photography",
  "guideline.def.prohibited3": "Anything domestic or wholly unrelated to professional performance",
  "guideline.def.prohibited4": "Heavy post-processing, artificial colour grading or filter effects",
  "guideline.def.prohibited5": "Generic landscape imagery without direct brand relevance",
  "guideline.def.graphicsNote":
    "Geometric forms, fine rule lines and systematic grid patterns are the core graphic language.",
  "guideline.def.packagingNote":
    "Product labels use the full primary palette. The logo appears in the approved colour variant for the surface it sits on.",
  "guideline.def.socialNote":
    "Social content leads with strong imagery and minimal copy. The brand always appears composed and considered — never reactive or trend-chasing.",

  // ── Brand book ───────────────────────────────────────────────────────────
  "brandBook.loading": "Loading brand book...",
  "brandBook.pageUploaded": "{count} page uploaded",
  "brandBook.pagesUploaded": "{count} pages uploaded",
  "brandBook.visualAssets": "Brand visual assets",
  "brandBook.cat.backgrounds": "Backgrounds & gradients",
  "brandBook.cat.icons": "Icons",
  "brandBook.cat.graphics": "Graphics",
  "brandBook.noLogos": "No logos yet",
  "brandBook.noBackgrounds": "No backgrounds & gradients yet",
  "brandBook.noIcons": "No icons yet",
  "brandBook.noGraphics": "No graphics yet",
  "brandBook.id.logo": "logo",
  "brandBook.id.background": "background",
  "brandBook.id.icon": "icon",
  "brandBook.id.graphic": "graphic",
  "brandBook.viewBook": "Book",
  "brandBook.viewPages": "Pages",
  "brandBook.pageAlt": "Page {n}",
  "brandBook.chatHello":
    "Upload your brand book and I can answer questions about it — colors, typography, logo rules, how to use the brand...",
  "brandBook.chatNoPages": "Upload your brand book pages so I can read them and answer accurately.",
  "brandBook.chatApiError": "API error — please try again.",
  "brandBook.processingPdf": "Processing PDF page {page} / {total}...",
  "brandBook.uploadingPage": "Uploading page {page} / {total}...",
  "brandBook.toast.pdfFailed": "Failed to process PDF: {name}",
  "brandBook.toast.uploadFailedFor": "Upload failed for {name}",
  "brandBook.toast.uploaded": "Uploaded",
  "brandBook.toast.colorSaveFailed": "Failed to save color",
  "brandBook.toast.copied": "Copied {hex}",
  "brandBook.toast.colorExtracted": "{count} color extracted",
  "brandBook.toast.colorsExtracted": "{count} colors extracted",

  // ── Brand bases ──────────────────────────────────────────────────────────
  "bases.title": "Build Your Brand Foundation",
  "bases.intro":
    "Complete the following steps to set up {brandName}'s brand foundation. This powers all AI-assisted content creation tailored to {brandName}'s voice, strategy, and identity.",
  "bases.strategyDesc": "Define {name}'s purpose, positioning, values, and competitive landscape",
  "bases.toneDesc": "Establish how {name} communicates — the BrandTone™ Architect output",
  "bases.visualIdentity": "Visual Identity",
  "bases.visualDesc": "Upload {name}'s brand assets and visual guidelines",
  "bases.businessPulse": "Business Pulse",
  "bases.pulseDesc": "Goals, upcoming launches, sensitivities, financial rules",
  "bases.progress": "Progress",
  "bases.continue": "Continue Setup →",

  // ── Brand and Numbers ──
  "num.hostingInfra": "Hosting & infra",
  "num.supportTime": "Support time",
  "num.billingPeriod": "Billing period",
  "num.trueCostPerUnit": "True cost per unit",
  "num.costToServeCustomer": "Cost to serve one customer",
  "num.unitsPerMonthShort": "{count} units / mo",
  "num.customersPerMonthShort": "{count} customers / mo",
  "profileLine.physical": "physical goods",
  "profileLine.digital": "digital products and access",
  "profileLine.subscription": "on subscription",
  "profileLine.oneOff": "as one-off purchases",
  "profileLine.ownSite": "your own site",
  "profileLine.wholesale": "wholesale",
  "profileLine.appStore": "an app store",
  "profileLine.and": "and",
  "profileLine.sentence": "You sell {what} {how} through {where}.",
  "profileLine.sentenceNoChannel": "You sell {what} {how} through nowhere selected yet.",
  "num.run.rent": "Rent & premises",
  "num.run.salaries": "Salaries",
  "num.run.software": "Software & tools",
  "num.run.marketing": "Marketing",
  "num.run.other": "Other overheads",
  "num.currentlyAt": "{name} currently {amount}",
  "num.cardsHoldFigures": "Your product cards hold the real figures.",
  "num.stillNeedCosts": "{missing} of {total} still need costs.",
  "num.never": "never",
  "num.perMonthValue": "{value} / mo",
  "num.oneOffCharge": "One-off",
  "num.costLinesPerSale": "That means {count} cost lines per sale.",
  "num.belowThisLose": "Below this you lose money however healthy the margin looks.",
  "num.atVolumeProfit": "At {volume} a month, operating profit is {profit}.",
  "num.run.volumeHelpUnits": "Roughly how many units you sell in a month. This is the second half of the floor price test — without it the floor only checks your margin.",
  "num.run.volumeHelpCustomers": "Roughly how many customers you sell in a month. This is the second half of the floor price test — without it the floor only checks your margin.",
  "num.run.unitsPerMonth": "units per month",
  "num.run.customersPerMonth": "customers per month",
  "num.run.noPriceOrCost": "{name} has no price or no cost recorded, so its contribution can't be worked out. Add them on the product card.",
  "num.run.floorPriceFor": "Floor price for {name}",
  "num.run.applyTo": "Apply to {name} →",
  "num.run.noMinMargin": "{name} has no minimum margin set, so a floor price can't be worked out. Set one in the product card's Pricing tab.",
  "num.run.overheadNotDivided": "Overhead is deliberately {not} divided across units. A “fully loaded” unit cost makes every product's margin depend on how many of everything else sold. Contribution plus break-even says the same thing without moving whenever an unrelated product has a good month.",
  "num.run.not": "not",
  "num.hintGross": "gross",
  "num.hintLanded": "landed",
  "num.offers.tryResult": "{pct}% off takes it to {price} and leaves {margin}% margin.",
  "num.offers.takesPriceTo": "Takes the price to {price} — the lowest that still leaves {mm}% margin. Net of tax that is {net}.",
  "num.rec.lifetimeNote": "{months} months at {profit} gross profit a month. Computed on gross profit, not revenue — revenue ignores what serving them costs.",
  "num.rec.monthsValue": "{months} months",
  "num.price.usingFactory": "{name} has no landed cost, so this prefilled from factory cost. The result will read high until duty, freight and packaging are included.",
  "num.price.youKeep": "Net price {net} after {tax}% tax, less cost {cost}. You keep {keep} per sale.",
  "num.price.hundredUnreachable": "A 100% margin needs a zero cost — unreachable at any price.",
  "num.price.grossComparable": "Gross, so it's comparable to your retail price. Net of {tax}% tax that is {net}.",
  "calc.applyTo": "Apply to {name}",
  "guardrails.floorAbovePrice": "The floor is above the retail price of {price}. Nothing could be sold at that price without breaking the rule you just wrote.",
  "guardrails.stayInside": "Copy and offers written about {name} stay inside these limits. This is what the pricing page means when it says offers are checked against your floor price before you see them.",
  "strategyDoc.sec.core": "Brand core",
  "strategyDoc.why.core": "The four answers everything else is built on",
  "strategyDoc.sec.positioning": "Positioning",
  "strategyDoc.why.positioning": "Where you sit, and who you are not for",
  "strategyDoc.sec.audience": "Audience",
  "strategyDoc.why.audience": "Who decides, and where they decide it",
  "strategyDoc.sec.competitors": "Competitive landscape",
  "strategyDoc.why.competitors": "The gap you are standing in",
  "strategyDoc.why.pillars": "Three claims, each with a fact behind it",
  "strategyDoc.sec.messages": "Key messages",
  "strategyDoc.why.messages": "What to say, matched to when they hear it",
  "strategyDoc.sec.principles": "Brand principles",
  "strategyDoc.why.principles": "How the brand behaves",
  "strategyDoc.sec.boundaries": "Boundaries",
  "strategyDoc.why.boundaries": "The section that stops the AI writing the wrong thing",
  "strategyDoc.sec.focus": "Strategic focus",
  "strategyDoc.why.focus": "What this year is actually for",
  "strategyDoc.sumDifferent": "What makes it different:",
  "strategyDoc.sumNotFor": "It is deliberately not for {notFor}.",
  "strategyDoc.sumPromise": "The promise is {promise}.",
  "strategyDoc.sumProof": "Proof: {proof}.",
  "strategyDoc.sumBehaves": "It behaves by {principles}.",
  "strategyDoc.forExample": "For example: {example}",
  "strategyDoc.stage.discovery": "Discovery",
  "strategyDoc.stage.consideration": "Consideration",
  "strategyDoc.stage.decision": "Decision",
  "strategyDoc.stage.retention": "Retention",
  "strategyDoc.dateLocale": "en-GB",
  "strategyDoc.notSavedYet": "Not saved yet",
  "strategyDoc.positioningPlaceholder": "Your positioning line goes here",
  "strategyDoc.updated": "Updated {date}",
  "strategyDoc.sectionsComplete": "{filled} of {total} sections complete",
  "strategyDoc.finish": "Finish: {section}",
  "strategyDoc.editStrategy": "Edit strategy",
  "strategyDoc.essence": "Essence",
  "strategyDoc.personality": "Personality",
  "strategyDoc.benefits": "Benefits",
  "strategyDoc.attributes": "Attributes",
  "strategyDoc.whoWeAre": "Who we are",
  "strategyDoc.whatWeDo": "What we do",
  "strategyDoc.whyWeExist": "Why we exist",
  "strategyDoc.ourPromise": "Our promise",
  "strategyDoc.notAnsweredYet": "Not answered yet",
  "strategyDoc.weAre": "We are",
  "strategyDoc.for": "For",
  "strategyDoc.unlike": "Unlike",
  "strategyDoc.because": "Because",
  "strategyDoc.notDefinedYet": "Not defined yet",
  "strategyDoc.nobodyExcluded": "Nobody excluded yet — a positioning that excludes nobody will drift the first time someone chases a cheaper segment.",
  "strategyDoc.noSegments": "No segments yet",
  "strategyDoc.exSegment": "Sarah, 34, salon owner — wants results without retraining her team",
  "strategyDoc.addSegment": "+ Add segment",
  "strategyDoc.primary": "Primary",
  "strategyDoc.unassigned": "unassigned",
  "strategyDoc.noCompetitors": "No competitors listed",
  "strategyDoc.exCompetitor": "Dyson — €399, premium engineering. Your own price belongs in this list too.",
  "strategyDoc.noPrices": "No prices yet. Add them and your own price sits in this ladder, which is what makes the gap the point.",
  "strategyDoc.mapNeedsPositions": "The 2×2 map needs a position per competitor. Without them every point lands in the same place, so the ladder above is shown alone.",
  "strategyDoc.noPillars": "No pillars yet",
  "strategyDoc.exPillar": "Plasma ion — 110,000 RPM, measured heat. A fact, not an adjective.",
  "strategyDoc.noTagline": "No tagline yet",
  "strategyDoc.exTagline": "Precision, styled.",
  "strategyDoc.noStage": "No stage",
  "strategyDoc.noPrinciples": "No principles yet",
  "strategyDoc.exPrinciple": "Show the work — we explain the engineering rather than asserting quality.",
  "strategyDoc.becauseReason": "— because {reason}",
  "strategyDoc.noGoal": "No goal set",
  "strategyDoc.exGoal": "Become the default recommendation in professional salons by 2027.",
  "strategyDoc.howItSounds": "How this strategy sounds",
  "strategyDoc.howItLooks": "How it looks",
  "strategyDoc.appliedTo": "What it is applied to",
  "strategyDoc.usedByBody": "Studio ▸ Write cites your proof points and obeys the boundaries. Create images reads the positioning. AI Chat answers from all of it. The more of this page is filled in, the less generic everything it produces becomes.",
  "strategy.stage.positioning": "Positioning framework",
  "strategy.stage.personas": "Audience personas",
  "strategy.stage.messaging": "Messaging architecture",
  "strategy.stage.voice": "Brand voice & tone",
  "strategy.stage.risks": "Risks & opportunities",
  "strategy.generationFailed": "Generation failed",
  "strategy.noResponse": "Generation failed — no response from server",
  "strategy.noStrategyReceived": "No strategy received. Please try again.",
  "strategy.failedToSave": "Failed to save. Please try again.",
  "strategy.backToDashboard": "← Back to Dashboard",
  "strategy.builtFromQuestionnaire": "It is built from the questionnaire. Twenty questions, five of them needed to open your workspace, about four minutes. This page fills itself in as you answer.",
  "strategy.goBack": "← Go back",
  "strategy.answeredCount": "{answered} / {total} answered",
  "strategy.questionOf": "Question {n} of {total}",
  "strategy.attachImage": "Attach Image ({count}/3)",
  "strategy.next": "Next",
  "strategy.generateStrategy": "Generate Strategy",
  "strategy.synthesizing": "Synthesizing {count} answers into a comprehensive strategy...",
  "strategy.saveToBranditect": "Save to Branditect",
  "tone.progress.analysing": "Analysing your writing samples...",
  "tone.progress.generating": "Generating tone guidelines...",
  "tone.progress.failed": "Generation failed. Please try again.",
  "tone.progress.loadingStrategy": "Loading your brand strategy...",
  "tone.progress.noStrategy": "No saved brand strategy yet. Generate one in Brand Strategy first.",
  "tone.progress.oldFormat": "Your saved strategy isn't in the new JSON format. Re-generate it from Brand Strategy.",
  "tone.progress.pulling": "Pulling tone guidelines from your strategy...",
  "tone.progress.pullFailed": "Failed to pull from brand strategy. Please try again.",
  "tone.generatingEllipsis": "Generating...",
  "tone.generateTone": "Generate tone",
  "tone.brandLibrary": "← Brand Library",
  "tone.expressionPlaceholder": "Your expression here",
  "tone.expressionTextPlaceholder": "Click to describe your brand expression...",
  "tone.noPillars": "No tone pillars defined yet — click edit to add",
  "tone.do": "Do",
  "tone.noItems": "No items yet",
  "tone.noWords": "No words defined",
  "tone.wrong": "Wrong",
  "tone.right": "Right",
  "tone.noTouchpoints": "No touchpoints defined yet — click edit to add",
  "tone.editTitle": "Edit — {section}",
  "tone.sec.expression": "Brand Expression",
  "tone.sec.pillars": "Tone Pillars",
  "tone.sec.dos": "Do's",
  "tone.sec.donts": "Don'ts",
  "tone.sec.vocab": "Brand Vocabulary",
  "tone.sec.touchpoints": "Channel Touchpoints",
  "tone.sec.checklist": "Quick Checklist",
  "tone.addPillar": "+ Add pillar",
  "tone.dosPlaceholder": "Use active voice\nBe specific\n...",
  "tone.dontsPlaceholder": "Don't use passive voice\nDon't be vague\n...",
  "tone.addTouchpoint": "+ Add touchpoint",
  "tone.checklistPlaceholder": "Does it sound like us?\nWould we say this out loud?\n...",
  "channels.anti.thirsty": "thirsty/desperate",
  "channels.anti.corporate": "corporate/sterile",
  "channels.anti.trendChasing": "trend-chasing",
  "channels.anti.preachy": "preachy",
  "channels.anti.selfCongratulating": "self-congratulating",
  "channels.anti.memey": "memey-for-the-sake-of-memes",
  "channels.eyebrow1": "Q1 · Channels",
  "channels.eyebrow2": "Q2 · Primary goal",
  "channels.eyebrow3": "Q3 · Realistic capacity",
  "channels.eyebrow4": "Q4 · Reference accounts",
  "channels.eyebrow5": "Q5 · Anti-brand",
  "channels.pushback": "20+ posts a week with one person almost always means quality decay within 4 weeks. We'd rather propose 10–12 with a stronger format mix. Keep 20+?",
  "channels.couldNotLoad": "Channels could not load: {error}",
  "channels.brandSocialStrategy": "{brand}'s social strategy",
  "channels.refsIntro": "3–5 reference accounts to benchmark",
  "visual.slot.primary.label": "Primary logo",
  "visual.slot.primary.usage": "The default. Use this unless there's a reason not to.",
  "visual.slot.primary.tag": "On light",
  "visual.slot.dark.label": "Primary, reversed",
  "visual.slot.dark.usage": "For dark backgrounds and photography.",
  "visual.slot.dark.tag": "On dark",
  "visual.slot.white.label": "White / mono",
  "visual.slot.white.usage": "One colour. For print, embroidery and anything single-ink.",
  "visual.slot.white.tag": "On dark",
  "visual.slot.icon.label": "Symbol only",
  "visual.slot.icon.usage": "Favicons, app icons, avatars. Under 24px the wordmark stops being readable.",
  "visual.slot.icon.tag": "Transparent",
  "visual.use.light.question": "I'm putting it on a white page",
  "visual.use.light.answer": "Primary, on light",
  "visual.use.light.note": "SVG for screen, PNG for everything else",
  "visual.use.dark.question": "It's going on a photo or a dark background",
  "visual.use.dark.answer": "Primary, reversed",
  "visual.use.dark.note": "Reversed, never the light one recoloured",
  "visual.use.small.question": "It needs to be tiny — favicon, app icon, avatar",
  "visual.use.small.answer": "Symbol only",
  "visual.use.small.note": "Under 24px the wordmark stops being readable",
  "uploads.slot.primary": "Primary",
  "uploads.slot.primaryHint": "On light backgrounds",
  "uploads.slot.dark": "Reversed",
  "uploads.slot.darkHint": "On dark backgrounds",
  "uploads.slot.icon": "Symbol only",
  "uploads.slot.iconHint": "The mark without the wordmark",
  "uploads.slot.white": "White",
  "uploads.slot.whiteHint": "On colour",
  "uploads.role.heading": "Headings",
  "uploads.role.body": "Body",
  "uploads.uploadFailedStatus": "Upload failed ({status})",
  "uploads.notHex": "That is not a hex colour — try #1a1a1a",
  "uploads.couldNotSaveStatus": "Could not save ({status})",
  "uploads.extractionFailedStatus": "Extraction failed ({status})",
  "uploads.noColoursFound": "No colours found — try a clearer screenshot",
  "uploads.addColour": "Add colour",
  "uploads.or": "or",
  "visual.contrast.aaa": "AAA on white",
  "visual.contrast.aa": "AA on white",
  "visual.contrast.large": "Large text only",
  "visual.contrast.surface": "Surface only",
  "visual.copyFailed": "Couldn't copy — select it instead",
  "visual.updatedLive": "Updated {date} · everything here is the live version",
  "visual.everythingLive": "Everything here is the live version",
  "visual.toast.logoUploaded": "Logo uploaded",
  "visual.logoAlt": "{label} for {brand}",
  "visual.file": "File",
  "visual.toast.colourAdded": "Colour added",
  "visual.groupCore": "Core",
  "visual.groupGradients": "Gradients",
  "visual.toast.cssCopied": "CSS copied",
  "visual.toast.valueCopied": "{value} copied",
  "visual.copyHex": "Copy HEX",
  "visual.toast.typefaceAdded": "Typeface added",
  "visual.template": "Template",
  "visual.dont.stretch": "Don't stretch it",
  "visual.dont.stretchSub": "Scale both sides together, always",
  "visual.dont.recolour": "Don't recolour it",
  "visual.dont.recolourSub": "The brand colours. Nothing else.",
  "visual.dont.effects": "Don't add effects",
  "visual.dont.effectsSub": "No shadows, glows, bevels or outlines",
  "visual.dont.background": "Don't fight the background",
  "visual.dont.backgroundSub": "Busy photo? Use the reversed file on a solid block.",
  "visual.guideBody": "Everything above, plus photography direction, tone of voice, iconography and the print specifications. Read it once; come back to this page for the day-to-day.",
  "visual.pages": "{count} pages",
  "visual.updatedOn": "Updated {date}",
  "visual.prompt1": "What is the hex code for our orange?",
  "visual.prompt2": "Which logo works on a dark background?",
  "visual.prompt3": "What size and weight do our headings use?",

  // ══ AI Chat: copy an answer, keep it as a note ══ 2026-09-16. Finnish mine.
  "chatRail.copyAnswer": "Copy answer",
  "chatRail.saveAsNote": "Save as note",
  "chatRail.savedToNotes": "Saved to Notes",
  "chatRail.saving": "Saving…",
  "chatRail.saveFailed": "Could not save",
  "chatRail.noteFromChat": "From AI Chat",
  "chat.replyFailed": "Something went wrong.",
  "chat.connectionIssue": "Connection issue — please try again.",

  // ══ BRING YOUR OWN STRATEGY, AND START FRESH ══ 2026-09-16.
  // Finnish by Claude, for review, like the block above.

  // ── Strategy intake: the server side ──
  "intake.documentNotReadYet": "That document has not been read yet. Give it a moment and try again.",
  "intake.tooShort": "There is not enough text here to read.",
  "intake.unreadable": "Your strategy could not be read this time. Try again.",
  "intake.readFailed": "Your strategy could not be read.",
  "intake.nothingToSave": "There is nothing to save.",
  "intake.migrationMissing":
    "The strategy table is missing its new columns. Open the file supabase/strategy-sources-and-versions.sql in the project, copy everything in it, paste that into the Supabase SQL editor and run it once. Pasting the file name will not work: the editor needs the SQL itself.",
  "intake.questionnaireNotUpdated":
    "Your strategy was saved, but the questionnaire was not updated. Those questions may be asked again.",

  // ── Strategy intake: the doors, the upload and the review ──
  // ── The three doors ───────────────────────────────────────────────────────
  "intake.door.answer": "Answer the questions",
  "intake.door.answerNote": "About 15 minutes. Every question.",
  "intake.door.have": "I already have a strategy",
  "intake.door.haveNote": "Upload it. We read it and ask only what is missing.",
  "intake.door.skip": "Skip for now",
  "intake.door.skipNote": "Straight to the dashboard. Come back whenever.",
  "intake.door.resume": "Pick up where you left off",

  // ── Upload or paste ───────────────────────────────────────────────────────
  "intake.bring.eyebrow": "Bring your own",
  "intake.bring.heading": "We read it, then ask only what is missing.",
  "intake.bring.lede":
    "A strategy deck answers some of the questions and not others. We take what is in it, show you every answer with the sentence it came from, and leave the rest as questions.",
  "intake.bring.foot":
    "Nothing is saved until you have read what we found. A field your document does not answer stays a question.",
  "intake.bring.title": "Bring the strategy you already have",
  "intake.bring.uploadTab": "Upload a PDF",
  "intake.bring.pasteTab": "Paste the text",
  "intake.bring.chooseFile": "Choose a file",
  "intake.bring.fileTypes": "PDF, up to 50 MB. It goes to Knowledge ▸ Documents as well.",
  "intake.bring.pastePlaceholder": "Paste your strategy here. Positioning, audience, what you sell, what you will never claim…",
  "intake.bring.pasteHelp": "Anything you have written down. The more of it, the fewer questions are left.",
  "intake.bring.read": "Read my strategy",
  "intake.bring.reading": "Reading your strategy…",
  "intake.bring.readingSlow": "A long deck takes a couple of minutes. This page can stay open.",
  "intake.bring.uploadingFile": "Uploading {name}…",
  "intake.bring.extracting": "Reading the pages…",
  "intake.bring.matching": "Matching it against the questions…",
  "intake.bring.needText": "Add a file or paste some text first.",
  "intake.bring.tooBig": "{name} is over 50 MB. Paste the text instead.",
  "intake.bring.pdfOnly": "Upload a PDF, or paste the text instead.",
  "intake.bring.failed": "Could not read that: {msg}",
  "intake.bring.noText": "Nothing readable came out of that file. Paste the text instead.",

  // ── Review ────────────────────────────────────────────────────────────────
  "intake.review.eyebrow": "What we found",
  "intake.review.heading": "Read this before it is saved.",
  "intake.review.lede":
    "Every answer below came out of your document, with the sentence it came from. Edit anything that is not right. An answer you never read becomes a positioning you never chose.",
  "intake.review.foot": "Nothing here is saved until you press the button at the bottom.",
  "intake.review.counter": "Review",
  "intake.review.weRead": "We read your strategy. {answered} of {total} answered.",
  "intake.review.foundNone": "We could not match anything in that document to the questions.",
  "intake.review.foundNoneHelp":
    "It happens with a deck that is mostly pictures. Answer the questions instead, or paste the text and try again.",
  "intake.review.fromYourDocument": "From your document",
  "intake.review.sourcePage": "page {page}",
  "intake.review.sourceQuote": "Your document says",
  "intake.review.stillToAnswer": "Still to answer",
  "intake.review.stillToAnswerCount": "{count} questions the document does not answer",
  "intake.review.stillToAnswerOne": "1 question the document does not answer",
  "intake.review.notInDocument": "not in the document",
  "intake.review.saveAndContinue": "Save these and answer the rest",
  "intake.review.saveAndFinish": "Save these and open my workspace",
  "intake.review.saving": "Saving…",
  "intake.review.saveFailed": "Could not save: {msg}",
  "intake.review.tryAgain": "Read a different document",
  "intake.review.answerAll": "Answer the questions instead",
  "intake.review.nothingToReview": "There is nothing to review yet.",
  "intake.review.startOver": "Bring a strategy",
  "intake.review.editAria": "Answer to question {n}",
  "intake.review.timeLeft": "about {minutes} minutes",

  // ── The document type ─────────────────────────────────────────────────────
  "documents.type.strategy": "Brand strategy",

  // ── Brand ▸ Strategy: what was read, and starting fresh ──
  // ── A strategy read out of the founder's own document ──────────────────
  "strategyDoc.fromYourDocument": "From your document",
  "strategyDoc.readFromDocument": "Read from the strategy you uploaded. Nothing here was written for you.",
  "strategyDoc.page": "page {page}",
  "strategyDoc.notInDocument": "Not in your document",
  "strategyDoc.answerToFill": "Answer these and this section fills in:",
  "strategyDoc.answerThese": "Answer these questions",
  "strategyDoc.stillOpen": "Still open:",

  // ── Start fresh ────────────────────────────────────────────────────────
  "freshStart.title": "Start fresh",
  "freshStart.replaces":
    "Starting fresh replaces your strategy answers, your generated strategy, your tone of voice and your anti-voice.",
  "freshStart.doesNotTouch":
    "It does not touch your products, your documents, your images, your numbers, or anything Studio has already written for you.",
  "freshStart.staysLive":
    "Your current strategy stays live until the new one is finished. Stop halfway and nothing has changed.",
  "freshStart.questionnaire": "Start again with the questionnaire",
  "freshStart.upload": "Replace it with a strategy document",
  "freshStart.version": "Version {version}",
  "freshStart.replacedOn": "replaced {date}",

  // ── Knowledge ▸ Documents: preview, download, delete ── 2026-09-16, Finnish mine.
  "docs.deleteTitle": "Delete {name}?",
  "docs.deleteBody":
    "The file goes, and so does what the brain read from it: Studio and AI Chat stop being able to cite it. Your products, notes and images are untouched.",
  "docs.deleteConfirm": "Delete document",
  "docs.deleteFailed": "Could not delete: {message}",
  "docs.deleteBlocked":
    "Nothing was deleted. The document is still there, so this is a permission problem rather than a missing file.",
  "docs.preview": "Preview",
  "docs.previewOf": "Preview of {name}",
  "docs.previewText": "What the brain read",
  "docs.previewNothing": "Nothing to show yet. This file has not been read.",
  "docs.previewUnavailable": "A browser cannot show this file type. Download it to read it.",
  "docs.downloadFailed": "Could not open the file: {message}",
  "docs.close": "Close",
  "docs.openInNewTab": "Open in a new tab",

  // ── Andy introduces himself in the rail ── 2026-09-16, Finnish mine.
  "chatRail.andyIntro1":
    "Hi, I’m Andy. Ask me anything about your brand, your products or your numbers.",
  "chatRail.andyIntro2":
    "Writing content, or anything longer? Studio ▸ Write does that. I am here for the questions.",
  "chatRail.andyIntro3":
    "I answer from your own knowledge and nothing else: {count} files indexed so far.",
  "chatRail.andyIntro4": "Like an answer? Save it straight to your notes.",

  // ── Picking images is not saving them ── 2026-09-16, Finnish mine.
  "kImages.nothingSavedYet":
    "Nothing is saved until you press the button below. Leave this page and these are gone.",
  "kImages.leaveWarning":
    "You have images that have not been uploaded yet.",
  "import.saveFailed":
    "Not saved: {message}. Your products are still on screen; try again.",
  "import.noBrandYet":
    "Not saved: your workspace is still loading. Wait a moment and try again.",

  // ── The questionnaire has to produce a strategy ── 2026-09-16, Finnish mine.
  "strategy.building": "Building your strategy from your answers…",
  "strategy.buildFailed":
    "Your answers are saved, but the strategy could not be built: {message}. Try again from Brand ▸ Strategy.",
  "strategy.nothingToBuild": "There are no answers to build from yet.",
  "strategy.answersWaiting":
    "You have answered {count} of the questions. Nothing has been built from them yet.",
  "strategy.buildFromAnswers": "Build my strategy from my answers",
  "strategy.keepAnswering": "Answer the rest first",
} as const;

export type StringKey = keyof typeof en;
