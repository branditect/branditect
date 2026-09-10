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
    "Saved in this browser for now. It will follow your account once language settings go live.",

  "guardrails.title": "Guardrails Studio obeys",
  "guardrails.whichProduct": "Which product",
  "guardrails.pickProduct": "Pick a product",
  "guardrails.saved": "Saved ✓",
  "calc.applyToProduct": "Apply to product",
  "calc.quickCalculation": "Quick calculation — no product",

  // ── Onboarding ▸ industries ───────────────────────────────────────────────
  "industry.tech": "Tech & SaaS",
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
} as const;

export type StringKey = keyof typeof en;
