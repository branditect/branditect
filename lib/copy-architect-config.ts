export interface CopyField {
  id: string;
  label: string;
  type: 'input' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  full?: boolean;
  req?: boolean;
}

export interface SubTypeConfig {
  icon: string;
  title: string;
  desc: string;
  fields: CopyField[];
  deliverable: string;
}

export interface CategoryConfig {
  label: string;
  icon: string;
  subs: Record<string, SubTypeConfig>;
}

export const COPY_CONFIG: Record<string, CategoryConfig> = {
  social: {
    label: 'Social',
    icon: '\u25FB',
    subs: {
      instagram: {
        icon: '\u25FB',
        title: 'Instagram Caption',
        desc: 'Hook-first captions \u2014 line 1 visible before \u201Cmore\u201D, story in body, specific CTA at end.',
        fields: [
          { id: 'topic', label: "What\u2019s this post about?", type: 'textarea', placeholder: 'e.g. StreamerX launch, creator support mission', full: true, req: true },
          { id: 'goal', label: 'Post goal', type: 'select', options: ['Brand awareness', 'Engagement', 'Conversion', 'Retention'] },
          { id: 'angle', label: 'Angle / hook direction', type: 'input', placeholder: 'e.g. Call out carriers that do nothing' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any specific claims, offers, or things to include' }
        ],
        deliverable: 'Deliver: 1 chosen full caption + 2 hook-line alternatives + 2 CTA alternatives. Include 3-5 relevant hashtags.'
      },
      linkedin: {
        icon: '\u25FB',
        title: 'LinkedIn Post',
        desc: 'Professional but not boring. Hook in first line, value in body, soft CTA.',
        fields: [
          { id: 'topic', label: 'Topic / announcement', type: 'textarea', placeholder: 'What are you posting about?', full: true, req: true },
          { id: 'goal', label: 'Post goal', type: 'select', options: ['Thought leadership', 'Company news', 'Hiring', 'Product launch', 'Engagement'] },
          { id: 'tone', label: 'Tone override', type: 'select', options: ['Default brand tone', 'More formal', 'More casual', 'Urgent'] },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Key points to include' }
        ],
        deliverable: 'Deliver: 1 full LinkedIn post (150-250 words) + 2 alternative opening hooks + 1 alternative CTA.'
      },
      x: {
        icon: '\u25FB',
        title: 'X / Twitter Post',
        desc: 'Punchy, memorable, shareable. Under 280 chars for single tweets.',
        fields: [
          { id: 'topic', label: 'What to say', type: 'textarea', placeholder: 'The message or announcement', full: true, req: true },
          { id: 'format', label: 'Format', type: 'select', options: ['Single tweet', 'Thread (3-5 tweets)', 'Quote tweet', 'Reply'] },
          { id: 'notes', label: 'Notes', type: 'input', placeholder: 'Hashtags, mentions, links to include' }
        ],
        deliverable: 'Deliver: 3 tweet options. If thread format, deliver a 4-tweet thread. Include char count for each.'
      },
      tiktok: {
        icon: '\u25FB',
        title: 'TikTok Caption & Hook',
        desc: 'Scroll-stopping hook + caption. Native to the platform.',
        fields: [
          { id: 'topic', label: 'Video concept', type: 'textarea', placeholder: 'What is the video about?', full: true, req: true },
          { id: 'style', label: 'Content style', type: 'select', options: ['Educational', 'Behind the scenes', 'Trend / meme', 'Product showcase', 'Story time'] },
          { id: 'notes', label: 'Notes', type: 'input', placeholder: 'Trending sounds, hashtags, or references' }
        ],
        deliverable: 'Deliver: 3 scroll-stopping hook options (first 3 seconds text) + 1 full caption with hashtags.'
      },
      facebook: {
        icon: '\u25FB',
        title: 'Facebook Post',
        desc: 'Community-focused, shareable, optimized for engagement.',
        fields: [
          { id: 'topic', label: 'Post topic', type: 'textarea', placeholder: 'What are you sharing?', full: true, req: true },
          { id: 'goal', label: 'Goal', type: 'select', options: ['Engagement', 'Traffic', 'Community building', 'Announcement'] },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional context' }
        ],
        deliverable: 'Deliver: 1 full post + 2 alternative opening lines. Optimize for shareability.'
      }
    }
  },
  email: {
    label: 'Email',
    icon: '\u25C7',
    subs: {
      welcome: {
        icon: '\u25C7',
        title: 'Welcome Email',
        desc: 'First impression. Set expectations, deliver value, start the relationship.',
        fields: [
          { id: 'product', label: 'Product / service they signed up for', type: 'input', placeholder: 'e.g. Vetra Mobile starter plan', full: true, req: true },
          { id: 'nextStep', label: 'What should they do next?', type: 'input', placeholder: 'e.g. Choose their creator, set up profile' },
          { id: 'offer', label: 'Welcome offer (if any)', type: 'input', placeholder: 'e.g. First month free, bonus features' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Brand voice notes, specific things to mention' }
        ],
        deliverable: 'Deliver: 3 subject line options + full email body with clear sections (greeting, value prop, next step, sign-off).'
      },
      promotional: {
        icon: '\u25C7',
        title: 'Promotional Email',
        desc: 'Drive action. Clear offer, urgency, compelling reason to click.',
        fields: [
          { id: 'offer', label: 'What are you promoting?', type: 'textarea', placeholder: 'The offer, discount, or announcement', full: true, req: true },
          { id: 'audience', label: 'Audience segment', type: 'input', placeholder: 'e.g. Active subscribers, churned users, new leads' },
          { id: 'urgency', label: 'Urgency / deadline', type: 'input', placeholder: 'e.g. Ends Friday, Limited spots, Launch day only' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'CTA destination, specific claims' }
        ],
        deliverable: 'Deliver: 3 subject lines + 2 preview text options + full email body with headline, body, CTA button text.'
      },
      nurture: {
        icon: '\u25C7',
        title: 'Nurture Email',
        desc: 'Build trust over time. Educational, helpful, relationship-building.',
        fields: [
          { id: 'topic', label: 'Topic / value to share', type: 'textarea', placeholder: 'What insight, tip, or story are you sharing?', full: true, req: true },
          { id: 'position', label: 'Position in sequence', type: 'select', options: ['Email 1 (introduction)', 'Email 2-3 (building trust)', 'Email 4-5 (deepening)', 'Final (conversion)'] },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Link to include, story to reference' }
        ],
        deliverable: 'Deliver: 2 subject lines + full email body. Tone should be warm and advisory, not salesy.'
      },
      reengagement: {
        icon: '\u25C7',
        title: 'Re-engagement Email',
        desc: 'Win back inactive users. Remind them why they signed up.',
        fields: [
          { id: 'segment', label: 'Who are you re-engaging?', type: 'input', placeholder: 'e.g. Users inactive 30+ days', full: true, req: true },
          { id: 'incentive', label: 'Incentive (if any)', type: 'input', placeholder: 'e.g. 20% off, free month, exclusive access' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Reason they may have left, what changed' }
        ],
        deliverable: 'Deliver: 3 subject lines (curiosity-driven) + full email body with empathy opening, value reminder, and clear CTA.'
      },
      transactional: {
        icon: '\u25C7',
        title: 'Transactional Email',
        desc: 'Order confirmations, receipts, shipping updates \u2014 still on-brand.',
        fields: [
          { id: 'type', label: 'Transaction type', type: 'select', options: ['Order confirmation', 'Shipping notification', 'Payment receipt', 'Account update', 'Password reset'], req: true },
          { id: 'details', label: 'Key details to include', type: 'textarea', placeholder: 'Order number format, delivery timeline, etc.', full: true },
          { id: 'notes', label: 'Notes', type: 'input', placeholder: 'Cross-sell opportunity, support link' }
        ],
        deliverable: 'Deliver: Subject line + full email body. Functional but still in brand voice. Include placeholder tokens like [ORDER_NUMBER].'
      }
    }
  },
  website: {
    label: 'Website',
    icon: '\u25CE',
    subs: {
      homepage: {
        icon: '\u25CE',
        title: 'Homepage Copy',
        desc: 'Hero headline, subheadline, and key sections. The front door of your brand.',
        fields: [
          { id: 'goal', label: 'Primary goal of the homepage', type: 'select', options: ['Drive signups', 'Explain the product', 'Build trust', 'Drive demo requests'], req: true },
          { id: 'sections', label: 'Sections needed', type: 'textarea', placeholder: 'e.g. Hero, How it works, Features, Social proof, CTA', full: true },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Key messages, stats to include' }
        ],
        deliverable: 'Deliver: 3 hero headline options + 1 subheadline per hero + copy for each requested section.'
      },
      landing: {
        icon: '\u25CE',
        title: 'Landing Page',
        desc: 'Single-purpose page. One CTA, one goal, maximum conversion.',
        fields: [
          { id: 'goal', label: 'Page goal', type: 'input', placeholder: 'e.g. Get email signups for StreamerX launch', full: true, req: true },
          { id: 'offer', label: 'What are you offering?', type: 'textarea', placeholder: 'The value proposition for this specific page' },
          { id: 'audience', label: 'Target audience for this page', type: 'input', placeholder: 'e.g. Twitch viewers who saw the creator ad' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Urgency, social proof, objections to address' }
        ],
        deliverable: 'Deliver: Hero headline + subheadline + 3 benefit blocks + objection handler + CTA button text + CTA supporting text.'
      },
      pricing: {
        icon: '\u25CE',
        title: 'Pricing Page',
        desc: 'Clear plans, compelling value framing, reduce friction.',
        fields: [
          { id: 'plans', label: 'Describe your plans / tiers', type: 'textarea', placeholder: 'Plan names, prices, key features of each', full: true, req: true },
          { id: 'recommended', label: 'Which plan to highlight?', type: 'input', placeholder: 'e.g. Pro plan' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'FAQ questions, comparison points, annual discount' }
        ],
        deliverable: 'Deliver: Page headline + plan descriptions + feature comparison copy + 3 FAQ answers + CTA text per plan.'
      },
      about: {
        icon: '\u25CE',
        title: 'About Page',
        desc: 'Your story, your mission, your team. Build trust and connection.',
        fields: [
          { id: 'story', label: 'Brand / founding story', type: 'textarea', placeholder: 'How and why the company started', full: true, req: true },
          { id: 'mission', label: 'Mission statement', type: 'input', placeholder: 'Your one-line mission' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Team size, values, milestones to mention' }
        ],
        deliverable: 'Deliver: Page headline + mission section + origin story (2-3 paragraphs) + values section + team intro copy.'
      },
      feature: {
        icon: '\u25CE',
        title: 'Feature Page',
        desc: 'Deep dive on a single feature. Benefits over specs.',
        fields: [
          { id: 'feature', label: 'Feature name and what it does', type: 'textarea', placeholder: 'Describe the feature in detail', full: true, req: true },
          { id: 'audience', label: 'Who benefits most?', type: 'input', placeholder: 'The specific user this feature helps' },
          { id: 'competitor', label: 'How competitors handle this', type: 'input', placeholder: 'What alternatives exist and why yours is better' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Stats, testimonials, use cases' }
        ],
        deliverable: 'Deliver: Hero headline + subheadline + 3 benefit blocks (benefit title + description) + use case example + CTA.'
      }
    }
  },
  newsletter: {
    label: 'Newsletter',
    icon: '\u25A4',
    subs: {
      full: {
        icon: '\u25A4',
        title: 'Full Newsletter',
        desc: 'Complete newsletter \u2014 intro, body sections, CTA. Ready to send.',
        fields: [
          { id: 'topic', label: 'Main topic / theme', type: 'textarea', placeholder: 'What is this newsletter about?', full: true, req: true },
          { id: 'audience', label: 'Audience segment', type: 'input', placeholder: 'e.g. All subscribers, premium users, new signups' },
          { id: 'cta', label: 'Primary CTA', type: 'input', placeholder: 'What should readers do after reading?' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Links, announcements, tone notes' }
        ],
        deliverable: 'Deliver: 3 subject lines + preview text + full newsletter with intro, 2-3 body sections, and closing CTA.'
      },
      intro: {
        icon: '\u25A4',
        title: 'Newsletter Intro',
        desc: 'The opening section that hooks them in. Sets the tone for everything below.',
        fields: [
          { id: 'topic', label: 'Newsletter topic', type: 'input', placeholder: 'What is this issue about?', full: true, req: true },
          { id: 'hook', label: 'Hook direction', type: 'input', placeholder: 'e.g. Start with a provocative question, open with a stat' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Context, previous issue reference' }
        ],
        deliverable: 'Deliver: 3 intro paragraph options (50-80 words each). Each should hook differently.'
      },
      cta: {
        icon: '\u25A4',
        title: 'Newsletter CTA Block',
        desc: 'The closing section that drives action. Clear, compelling, specific.',
        fields: [
          { id: 'action', label: 'What should they do?', type: 'input', placeholder: 'e.g. Sign up, visit page, reply, share', full: true, req: true },
          { id: 'incentive', label: 'Why should they act?', type: 'input', placeholder: 'The benefit or urgency' },
          { id: 'notes', label: 'Notes', type: 'input', placeholder: 'Link destination, deadline' }
        ],
        deliverable: 'Deliver: 3 CTA block options. Each includes a headline, 1-2 sentences, and button text.'
      },
      subjects: {
        icon: '\u25A4',
        title: 'Subject Lines',
        desc: 'Get the open. 6-10 words, curiosity or value, no clickbait.',
        fields: [
          { id: 'topic', label: 'Newsletter topic', type: 'input', placeholder: 'What is the newsletter about?', full: true, req: true },
          { id: 'tone', label: 'Tone for this send', type: 'select', options: ['Default brand tone', 'Urgent', 'Curious', 'Direct', 'Playful'] },
          { id: 'notes', label: 'Notes', type: 'input', placeholder: 'Personalization, emoji preference' }
        ],
        deliverable: 'Deliver: 8 subject line options with character count. Group into: curiosity (3), value (3), urgency (2).'
      }
    }
  },
  product: {
    label: 'Product Info',
    icon: '\u25B3',
    subs: {
      description: {
        icon: '\u25B3',
        title: 'Product Description',
        desc: 'Sell the transformation, not the features. Benefits first.',
        fields: [
          { id: 'product', label: 'Product name and what it does', type: 'textarea', placeholder: 'Describe the product', full: true, req: true },
          { id: 'audience', label: 'Target buyer', type: 'input', placeholder: 'Who is this for?' },
          { id: 'length', label: 'Length', type: 'select', options: ['Short (50 words)', 'Medium (100 words)', 'Long (200+ words)'] },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Key differentiators, price point, comparison' }
        ],
        deliverable: 'Deliver: 3 product description options at the requested length. Each takes a different angle.'
      },
      features: {
        icon: '\u25B3',
        title: 'Features & Benefits',
        desc: 'Turn feature lists into benefit-driven copy that sells.',
        fields: [
          { id: 'features', label: 'List your features', type: 'textarea', placeholder: 'One per line \u2014 we will turn each into benefit copy', full: true, req: true },
          { id: 'audience', label: 'Target audience', type: 'input', placeholder: 'Who cares about these features?' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Competitor comparison, proof points' }
        ],
        deliverable: 'Deliver: Each feature rewritten as a benefit headline + 1-2 sentence explanation. Format as a list.'
      },
      faq: {
        icon: '\u25B3',
        title: 'FAQ Copy',
        desc: 'Answer objections before they become deal-breakers.',
        fields: [
          { id: 'questions', label: 'Questions to answer (or topic area)', type: 'textarea', placeholder: 'List specific questions, or describe the topic area and we will generate common ones', full: true, req: true },
          { id: 'tone', label: 'Tone', type: 'select', options: ['Default brand tone', 'More formal', 'Conversational', 'Technical'] },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Sensitive topics, legal disclaimers needed' }
        ],
        deliverable: 'Deliver: 6-8 FAQ pairs (question + answer). Each answer should be 2-3 sentences, on-brand.'
      },
      tagline: {
        icon: '\u25B3',
        title: 'Tagline / Slogan',
        desc: 'Memorable, ownable, repeatable. The line they remember.',
        fields: [
          { id: 'product', label: 'Product or brand to create a tagline for', type: 'input', placeholder: 'e.g. Vetra Mobile, StreamerX partnership', full: true, req: true },
          { id: 'vibe', label: 'Desired vibe', type: 'select', options: ['Bold and confident', 'Warm and inviting', 'Edgy and disruptive', 'Simple and clear', 'Playful and fun'] },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Words to include/avoid, competitor taglines to differentiate from' }
        ],
        deliverable: 'Deliver: 8 tagline options. For each: the tagline + 1 sentence rationale for why it works.'
      }
    }
  },
  presentation: {
    label: 'Presentation',
    icon: '\u25A3',
    subs: {
      sales: {
        icon: '\u25A3',
        title: 'Sales Deck Copy',
        desc: 'Slide-by-slide copy for your pitch. Problem \u2192 solution \u2192 proof \u2192 ask.',
        fields: [
          { id: 'audience', label: 'Who are you pitching to?', type: 'input', placeholder: 'e.g. Enterprise IT buyers, retail partners', full: true, req: true },
          { id: 'slides', label: 'Number of slides', type: 'select', options: ['5-7 (short)', '10-12 (standard)', '15+ (detailed)'] },
          { id: 'ask', label: 'What is the ask?', type: 'input', placeholder: 'e.g. Schedule a demo, sign the contract, start a pilot' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Key stats, case studies, objections to preempt' }
        ],
        deliverable: 'Deliver: Slide-by-slide copy. Each slide: headline + 2-3 bullet points or a short paragraph. Include speaker notes.'
      },
      investor: {
        icon: '\u25A3',
        title: 'Investor Pitch',
        desc: 'Fundraising narrative. Problem, solution, market, traction, ask.',
        fields: [
          { id: 'stage', label: 'Funding stage', type: 'select', options: ['Pre-seed', 'Seed', 'Series A', 'Series B+'], req: true },
          { id: 'ask', label: 'How much are you raising?', type: 'input', placeholder: 'e.g. \u20AC2M seed round' },
          { id: 'traction', label: 'Key traction metrics', type: 'textarea', placeholder: 'MRR, users, growth rate, partnerships', full: true },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Market size, competitive advantage, use of funds' }
        ],
        deliverable: 'Deliver: 10-slide pitch deck copy. Each slide: headline + body copy. Cover: problem, solution, market, product, business model, traction, team, competition, financials, ask.'
      },
      onboarding: {
        icon: '\u25A3',
        title: 'Onboarding Deck',
        desc: 'Welcome new customers or team members. Set expectations.',
        fields: [
          { id: 'audience', label: 'Who is being onboarded?', type: 'select', options: ['New customers', 'New employees', 'New partners'], req: true },
          { id: 'steps', label: 'Key onboarding steps', type: 'textarea', placeholder: 'What do they need to do / know?', full: true },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Timeline, key contacts, resources' }
        ],
        deliverable: 'Deliver: 8-slide onboarding deck copy. Welcome, what to expect, key steps, resources, support, next actions.'
      },
      proposal: {
        icon: '\u25A3',
        title: 'Proposal / One-Pager',
        desc: 'Concise sell document. Problem, solution, why us, next step.',
        fields: [
          { id: 'client', label: 'Client / prospect name', type: 'input', placeholder: 'Who is this for?', req: true },
          { id: 'problem', label: 'Their problem', type: 'textarea', placeholder: 'What challenge are you solving for them?', full: true },
          { id: 'solution', label: 'Your proposed solution', type: 'textarea', placeholder: 'What you will deliver' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Budget, timeline, deliverables' }
        ],
        deliverable: 'Deliver: One-page proposal copy. Sections: problem statement, proposed solution, why us, deliverables, timeline, next step.'
      }
    }
  },
  other: {
    label: 'Other',
    icon: '\u2726',
    subs: {
      ad: {
        icon: '\u2726',
        title: 'Ad Copy',
        desc: 'Paid ads across platforms. Short, punchy, conversion-focused.',
        fields: [
          { id: 'platform', label: 'Platform', type: 'select', options: ['Google Search', 'Google Display', 'Meta (FB/IG)', 'LinkedIn Ads', 'TikTok Ads', 'YouTube'], req: true },
          { id: 'goal', label: 'Campaign goal', type: 'select', options: ['Awareness', 'Traffic', 'Leads', 'Sales', 'App installs'] },
          { id: 'offer', label: 'What are you promoting?', type: 'textarea', placeholder: 'The product, offer, or message', full: true, req: true },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Target audience, budget context, landing page' }
        ],
        deliverable: 'Deliver: 3 ad variations. Each with headline(s), body copy, and CTA. Respect platform character limits.'
      },
      videohooks: {
        icon: '\u2726',
        title: 'Video Hooks',
        desc: 'First 3-5 seconds. Stop the scroll. Make them watch.',
        fields: [
          { id: 'topic', label: 'Video topic', type: 'textarea', placeholder: 'What is the video about?', full: true, req: true },
          { id: 'platform', label: 'Platform', type: 'select', options: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'YouTube long-form', 'LinkedIn video'] },
          { id: 'notes', label: 'Notes', type: 'input', placeholder: 'Target audience, style reference' }
        ],
        deliverable: 'Deliver: 6 hook options. Each is 1-2 sentences designed to stop scrolling in the first 3 seconds.'
      },
      bio: {
        icon: '\u2726',
        title: 'Bio / Profile',
        desc: 'Platform bios, about sections, profile descriptions.',
        fields: [
          { id: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'LinkedIn (personal)', 'LinkedIn (company)', 'X / Twitter', 'TikTok', 'Website about'], req: true },
          { id: 'person', label: 'Who is this bio for?', type: 'input', placeholder: 'e.g. Brand account, CEO, team member', full: true },
          { id: 'notes', label: 'Key things to mention', type: 'textarea', placeholder: 'Credentials, achievements, personality traits' }
        ],
        deliverable: 'Deliver: 3 bio options at different lengths (short, medium, long). Respect platform character limits.'
      },
      press: {
        icon: '\u2726',
        title: 'Press Release',
        desc: 'Newsworthy announcement in standard press format.',
        fields: [
          { id: 'news', label: 'What is the announcement?', type: 'textarea', placeholder: 'The news \u2014 be specific about what, when, why', full: true, req: true },
          { id: 'quote', label: 'Who should be quoted?', type: 'input', placeholder: 'e.g. CEO name and title' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Embargo date, media contact, boilerplate' }
        ],
        deliverable: 'Deliver: Full press release with headline, dateline, lead paragraph, body, quote, boilerplate, and media contact placeholder.'
      },
      sms: {
        icon: '\u2726',
        title: 'SMS / Push Notification',
        desc: 'Ultra-short. Every character counts. Clear action.',
        fields: [
          { id: 'message', label: 'What to communicate', type: 'input', placeholder: 'The core message', full: true, req: true },
          { id: 'type', label: 'Type', type: 'select', options: ['Promotional', 'Transactional', 'Reminder', 'Alert'] },
          { id: 'notes', label: 'Notes', type: 'input', placeholder: 'Link to include, personalization tokens' }
        ],
        deliverable: 'Deliver: 5 SMS/push options. Each under 160 characters. Include char count.'
      }
    }
  },
  seo: {
    label: 'SEO Content',
    icon: '\u2606',
    subs: {
      blogpost: {
        icon: '\u2606',
        title: 'SEO Blog Post',
        desc: 'Keyword-optimized blog article with proper heading structure, internal linking suggestions, and meta tags.',
        fields: [
          { id: 'keyword', label: 'Primary keyword / topic', type: 'input', placeholder: 'e.g. best project management tools 2026', full: true, req: true },
          { id: 'secondary', label: 'Secondary keywords (comma-separated)', type: 'input', placeholder: 'e.g. task management, team productivity, remote work tools', full: true },
          { id: 'intent', label: 'Search intent', type: 'select', options: ['Informational (how-to, guide)', 'Commercial (comparison, best-of)', 'Transactional (buy, pricing)', 'Navigational (brand-specific)'], req: true },
          { id: 'length', label: 'Target length', type: 'select', options: ['Short (600-800 words)', 'Medium (1000-1500 words)', 'Long-form (2000+ words)'] },
          { id: 'audience', label: 'Target audience', type: 'input', placeholder: 'e.g. SaaS founders, first-time buyers, marketing managers' },
          { id: 'angle', label: 'Unique angle or hook', type: 'textarea', placeholder: 'What makes your take different? Any data, experience, or contrarian view?' },
          { id: 'cta', label: 'Call-to-action goal', type: 'select', options: ['Sign up / free trial', 'Read more content', 'Book a demo', 'Buy product', 'Subscribe to newsletter', 'No CTA'] },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Competing articles to beat, internal pages to link to, things to avoid' }
        ],
        deliverable: 'Deliver a complete SEO blog post with:\n1. SEO title tag (under 60 chars) with primary keyword near the start\n2. Meta description (under 155 chars) with keyword and a compelling hook\n3. H1 headline (can differ from title tag)\n4. Full article body with H2 and H3 subheadings, each incorporating secondary keywords naturally\n5. Keyword density guidance: primary keyword appears 3-5 times naturally in the body\n6. One \"Featured Snippet\" formatted answer box (a clear, concise 40-60 word answer to the implied question)\n7. 3 internal linking suggestions with anchor text recommendations\n8. Closing CTA paragraph\n\nWrite in the brand voice. Avoid keyword stuffing — the copy should read naturally. Front-load value in every section. Use short paragraphs (2-3 sentences max).'
      },
      productpage: {
        icon: '\u2606',
        title: 'SEO Product Page',
        desc: 'Keyword-rich product description optimized for search and conversion.',
        fields: [
          { id: 'product', label: 'Product name', type: 'input', placeholder: 'e.g. Vetra Starter Plan', req: true },
          { id: 'keyword', label: 'Primary keyword', type: 'input', placeholder: 'e.g. affordable mobile plan Finland', full: true, req: true },
          { id: 'secondary', label: 'Secondary keywords', type: 'input', placeholder: 'e.g. cheap phone plan, mobile subscription, data plan', full: true },
          { id: 'features', label: 'Key features / benefits', type: 'textarea', placeholder: 'List the main features, pricing, differentiators', full: true, req: true },
          { id: 'competitors', label: 'Competitors to differentiate from', type: 'input', placeholder: 'e.g. Elisa, DNA, Telia' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Price, availability, special offers, FAQs to address' }
        ],
        deliverable: 'Deliver a complete SEO product page with:\n1. SEO title tag (under 60 chars)\n2. Meta description (under 155 chars)\n3. H1 product headline\n4. Opening hook paragraph (2-3 sentences, includes primary keyword)\n5. Features section with H2 heading and bullet points\n6. Benefits section with H2 — focus on outcomes, not specs\n7. \"Why choose [product] over alternatives\" comparison section (H2)\n8. FAQ section with 4-5 questions in H3 format (optimized for People Also Ask)\n9. CTA section\n10. Schema markup suggestion for Product structured data\n\nKeyword placement: primary keyword in title, H1, first paragraph, one H2, and naturally 2-3 times in body. Secondary keywords in H2s and body.'
      },
      landingseo: {
        icon: '\u2606',
        title: 'SEO Landing Page',
        desc: 'Search-optimized landing page copy with heading hierarchy and conversion focus.',
        fields: [
          { id: 'keyword', label: 'Primary keyword', type: 'input', placeholder: 'e.g. creator monetization platform', full: true, req: true },
          { id: 'secondary', label: 'Secondary keywords', type: 'input', placeholder: 'e.g. streamer support, creator economy, fan subscription', full: true },
          { id: 'offer', label: 'What are you offering?', type: 'textarea', placeholder: 'The product, service, or value proposition', full: true, req: true },
          { id: 'audience', label: 'Target audience', type: 'input', placeholder: 'Who should find this page?' },
          { id: 'goal', label: 'Conversion goal', type: 'select', options: ['Sign up', 'Book demo', 'Start free trial', 'Download', 'Buy now', 'Learn more'], req: true },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Social proof, stats, testimonials to include' }
        ],
        deliverable: 'Deliver a complete SEO landing page with:\n1. SEO title tag (under 60 chars)\n2. Meta description (under 155 chars)\n3. H1 headline with primary keyword\n4. Hero subheadline (1-2 sentences)\n5. 3 benefit blocks, each with H2 heading incorporating a secondary keyword\n6. Social proof section (testimonial placeholder, stat callouts)\n7. Features list with keyword-rich descriptions\n8. FAQ section (4 questions in H3, targeting People Also Ask)\n9. Final CTA section with urgency\n10. Internal linking suggestions\n\nOptimize for both search rankings and conversion. The page should rank for the primary keyword while guiding visitors toward the CTA.'
      },
      metatags: {
        icon: '\u2606',
        title: 'Meta Tags Generator',
        desc: 'SEO title tags and meta descriptions for any page. Optimized for click-through rate.',
        fields: [
          { id: 'page', label: 'What page is this for?', type: 'input', placeholder: 'e.g. Homepage, About, Pricing, Blog: How to...', full: true, req: true },
          { id: 'keyword', label: 'Primary keyword', type: 'input', placeholder: 'e.g. mobile virtual network operator', full: true, req: true },
          { id: 'usp', label: 'Unique selling point', type: 'input', placeholder: 'What makes this page worth clicking?', full: true },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Brand name to include, competitors, tone preferences' }
        ],
        deliverable: 'Deliver 5 options, each containing:\n1. Title tag (under 60 characters, primary keyword near start, brand name at end)\n2. Meta description (under 155 characters, includes keyword, has a clear value prop and implicit CTA)\n3. Character count for both\n4. Brief rationale explaining the SEO and CTR strategy\n\nAlso deliver:\n- Open Graph title suggestion\n- Open Graph description suggestion\n- Canonical URL recommendation\n- Primary H1 suggestion for the page'
      },
      pillarcluster: {
        icon: '\u2606',
        title: 'Content Cluster Plan',
        desc: 'Plan a pillar page + supporting cluster articles for topical authority.',
        fields: [
          { id: 'topic', label: 'Core topic / pillar keyword', type: 'input', placeholder: 'e.g. creator economy, mobile gaming, sustainable fashion', full: true, req: true },
          { id: 'brand', label: 'How does your brand relate to this topic?', type: 'textarea', placeholder: 'Your expertise, products, or angle on this topic', full: true, req: true },
          { id: 'audience', label: 'Target audience', type: 'input', placeholder: 'Who are you building authority with?' },
          { id: 'existing', label: 'Existing content (if any)', type: 'textarea', placeholder: 'List URLs or titles of content you already have on this topic' },
          { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Competitors dominating this topic, content gaps you see' }
        ],
        deliverable: 'Deliver a complete content cluster plan:\n\n1. PILLAR PAGE:\n- Suggested title and URL slug\n- Target keyword and search volume estimate (low/medium/high)\n- Outline with H2 sections (8-12 sections)\n- Word count recommendation\n- Internal linking strategy\n\n2. CLUSTER ARTICLES (8-12 articles):\nFor each article deliver:\n- Title\n- Target keyword\n- Search intent (informational/commercial/transactional)\n- Estimated difficulty (low/medium/high)\n- Brief 2-sentence description\n- How it links back to the pillar page\n\n3. CONTENT CALENDAR:\n- Suggested publishing order (pillar first, then clusters by priority)\n- Recommended frequency\n\n4. QUICK WINS:\n- 3 articles to write first based on low competition + high relevance'
      }
    }
  }
};
