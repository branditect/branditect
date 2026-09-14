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
  "home.prompt1": "What should I post about this week?",
  "home.prompt2": "What's the deepest discount I can run?",
  "home.prompt3": "What's missing from my brand?",

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
} as const;

export type StringKey = keyof typeof en;
