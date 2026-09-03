// Generated content table — 20 questions x 3 tracks.
// Source: questionnaires-all-tracks.md, onboarding-core-questions.md, placeholder-matrix.md
//
// No question is added, removed or reworded by track. Only helper text,
// placeholders and voice-tile order vary — so a fourth track costs one
// column here, not a new build. Keep it that way.

export type Track = "physical" | "digital" | "service";
export type SectionId = "why" | "sell" | "who" | "show";
export type QuestionKind = "text" | "voice" | "antivoice";

/** A value that is either the same for every track, or one per track. */
export type PerTrack<T> = { all: T } | Record<Track, T>;

export function forTrack<T>(v: PerTrack<T> | T, track: Track): T {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, T>;
    if ("all" in o) return o.all;
    if (track in o) return o[track];
  }
  return v as T;
}

export interface Question {
  n: number;                       // 1-20, stable. Never renumber.
  section: SectionId;
  kind: QuestionKind;
  required?: boolean;              // Q6, Q11, Q13, Q18 — the gate
  q: PerTrack<string> | string;
  help: PerTrack<string>;
  ex: Record<Track, string>;       // the worked example, shown in the guide rail
  note?: string;                   // why this question earns its place
}

export interface SectionDef { id: SectionId; title: string; range: [number, number] }

export const SECTIONS: SectionDef[] = [
  {
    "id": "why",
    "title": "Why you exist",
    "range": [
      1,
      5
    ]
  },
  {
    "id": "sell",
    "title": "What you sell",
    "range": [
      6,
      10
    ]
  },
  {
    "id": "who",
    "title": "Who it's for",
    "range": [
      11,
      15
    ]
  },
  {
    "id": "show",
    "title": "How you show up",
    "range": [
      16,
      20
    ]
  }
];

/** Required to unlock the workspace. Profile + these four. */
export const GATE: number[] = [6, 11, 13, 18];

export const QUESTIONS: Question[] = [
  {
    "n": 1,
    "section": "why",
    "kind": "text",
    "q": "What made you start this?",
    "help": {
      "all": "The moment, not the mission statement. What actually happened?"
    },
    "ex": {
      "physical": "I worked in an outdoor shop for four years and watched people bin 200 euro boots because the sole had worn through. The uppers were fine.",
      "digital": "I freelanced for five years and every Sunday night I wrote the same awkward email asking someone to pay me.",
      "service": "I worked for a big contract cleaner. We had cafés on fortnightly contracts getting service maybe once a quarter, and nobody was checking."
    }
  },
  {
    "n": 2,
    "section": "why",
    "kind": "text",
    "q": "What is broken about how people solve this today?",
    "help": {
      "physical": "Think about the products they buy now, not the market.",
      "digital": "Think about the tools they use now, not the market.",
      "service": "Think about who they hire now, not the market."
    },
    "ex": {
      "physical": "Boots are built to be replaced, not repaired, and the cobblers who used to fix them have mostly closed.",
      "digital": "Freelancers do not chase, because it feels rude. So they absorb three weeks of delay and call it normal.",
      "service": "Contracts are written so nobody can tell what they actually got. Small venues are the first to be deprioritised."
    }
  },
  {
    "n": 3,
    "section": "why",
    "kind": "text",
    "q": "If this works exactly how you want in three years, what does it look like?",
    "help": {
      "all": "Concrete. Revenue, team, reach, whatever it is you actually want."
    },
    "ex": {
      "physical": "Kits for the 40 most common boot models, sold through the outdoor shops themselves, still four of us.",
      "digital": "10,000 freelancers using it, still no sales team, and average payment time under 30 days across the whole base.",
      "service": "Every independent café inside the ring road, six vans, and I stop cleaning windows myself."
    }
  },
  {
    "n": 4,
    "section": "why",
    "kind": "text",
    "q": "What is the part of this you would still do for free?",
    "help": {
      "all": "Not why you do it. Which specific part do you enjoy enough that the money is beside the point?"
    },
    "ex": {
      "physical": "The photos people send of a boot they were about to throw out, back on a trail.",
      "digital": "Reading the messages where someone got paid for a job they had already written off.",
      "service": "The first hour, before anyone is awake, when the whole street is mine."
    }
  },
  {
    "n": 5,
    "section": "why",
    "kind": "text",
    "q": "What will you never do, even if it costs you a sale?",
    "help": {
      "all": "Your actual line. The thing you would turn down money over."
    },
    "ex": {
      "physical": "Never sell a kit for a boot we know cannot be repaired properly. We publish that list.",
      "digital": "Never send a chase email the freelancer has not seen and approved.",
      "service": "Never bill for a visit that did not happen. Every visit gets a timestamped photo."
    }
  },
  {
    "n": 6,
    "section": "sell",
    "kind": "text",
    "required": true,
    "q": "What is it, in one sentence a stranger would understand?",
    "help": {
      "all": "No category jargon. Say it the way you would to a neighbour."
    },
    "note": "The highest-leverage answer in the whole questionnaire. Everything Studio writes starts here.",
    "ex": {
      "physical": "Resoling kits that let you fix your own walking boots instead of replacing them.",
      "digital": "An app that chases your late invoices so you do not have to.",
      "service": "Window cleaning for shops and cafés in central Helsinki."
    }
  },
  {
    "n": 7,
    "section": "sell",
    "kind": "text",
    "q": "What do you do differently from everyone else in your space?",
    "help": {
      "all": "One thing, plainly. If it is also true of your competitors, it does not count."
    },
    "ex": {
      "physical": "We publish the list of boots our kits will not work on, including ones we would make money selling for.",
      "digital": "The chase email is written in the freelancer's own voice, and it escalates on a schedule they set.",
      "service": "Every visit ends with a timestamped photo in your inbox, so you never wonder whether we came."
    }
  },
  {
    "n": 8,
    "section": "sell",
    "kind": "text",
    "q": "Why should someone believe you?",
    "help": {
      "physical": "Materials, testing, certifications, warranty, where it is made.",
      "digital": "Uptime, security, results data, who built it.",
      "service": "Licensing, insurance, years doing it, who actually turns up."
    },
    "note": "Two voices — Calm and Expert — need real proof here. A number, a certification or a test.",
    "ex": {
      "physical": "Kits tested to 800 kilometres on trail. Fits 40 boot models. A step-by-step video for every one, filmed in real time with the mistakes left in.",
      "digital": "2,400 users. Average time to payment down from 47 days to 31. Read-only bank access, we never touch your money.",
      "service": "2 million euro public liability. Purified water fed pole to 12 metres. Before 7am so trading is untouched. From 45 euro a visit."
    }
  },
  {
    "n": 9,
    "section": "sell",
    "kind": "text",
    "q": "If someone does not buy from you, what do they do instead?",
    "help": {
      "physical": "Include \"nothing\" and \"keeps using the broken one\". Those are usually the real competition.",
      "digital": "Include \"nothing\" and \"does it manually\". Those are usually the real competition.",
      "service": "Include \"nothing\" and \"does it herself\". Those are usually the real competition."
    },
    "ex": {
      "physical": "Buys new boots, or keeps wearing worn soles until they slip on wet rock.",
      "digital": "Keeps writing the emails himself on Sunday nights, or gives up and waits.",
      "service": "Signs with a big contract cleaner, or does it herself on a Sunday with a squeegee."
    }
  },
  {
    "n": 10,
    "section": "sell",
    "kind": "text",
    "q": "What do people complain about with the alternatives?",
    "help": {
      "all": "What have you actually heard someone say? Their words, not yours."
    },
    "note": "Every phrase you capture here is usable verbatim in copy. This is the customer language bank.",
    "ex": {
      "physical": "Cobblers cost more than new boots. Nobody does this any more. I did not know it was possible.",
      "digital": "It feels aggressive. I do not want to annoy a client I need. The templates all sound like a debt collector.",
      "service": "They came once and never again. I could not get anyone on the phone. The contract was a year long."
    }
  },
  {
    "n": 11,
    "section": "who",
    "kind": "text",
    "required": true,
    "q": "Describe your best customer. Who are they, and what is going on in their life?",
    "help": {
      "all": "One person, not a segment. Picture someone you have actually sold to."
    },
    "ex": {
      "physical": "Man, 45, owns one good pair of boots he has had eight years, fixes his own bike, actively annoyed by throwaway gear.",
      "digital": "Solo designer, 12 clients, invoices on 30 days, gets paid at 55, has never once sent a second reminder.",
      "service": "Café owner, one or two sites, opens at seven, notices the glass on Monday when the light hits it."
    }
  },
  {
    "n": 12,
    "section": "who",
    "kind": "text",
    "q": "What is the moment they realise they need you?",
    "help": {
      "physical": "The trigger. Usually something failed, wore out, or ran out.",
      "digital": "The trigger. Usually a specific frustration hitting its limit.",
      "service": "The trigger. Usually they saw the problem in front of a customer."
    },
    "ex": {
      "physical": "He turns the boot over before a trip and the tread is gone.",
      "digital": "It is the 20th, rent is due, and 4,000 euro is sitting in invoices that went out six weeks ago.",
      "service": "A customer photographs her flat white and she can see the smears in the background."
    }
  },
  {
    "n": 13,
    "section": "who",
    "kind": "text",
    "required": true,
    "q": "What is different for them after?",
    "help": {
      "all": "Concretely. What can they do, or stop doing?"
    },
    "ex": {
      "physical": "He keeps the boots that are already broken in, and spends 30 euro instead of 220.",
      "digital": "She stops thinking about it. Money arrives without a single awkward email from her.",
      "service": "The windows get done every two weeks without her booking anything or being there."
    }
  },
  {
    "n": 14,
    "section": "who",
    "kind": "text",
    "q": "What do they worry about before buying?",
    "help": {
      "physical": "Will it fit, will it work, can they send it back. And price.",
      "digital": "Their data, getting locked in, how long it takes to learn. And price.",
      "service": "Will you turn up, are they tied in, do they have to be there. And price."
    },
    "ex": {
      "physical": "That he will ruin the boots. That the repair will not hold on the first wet descent.",
      "digital": "That it will send something tone-deaf to a client she has spent three years keeping.",
      "service": "That she will be locked into a year. That they will come twice and disappear."
    }
  },
  {
    "n": 15,
    "section": "who",
    "kind": "text",
    "q": "Who is this not for?",
    "help": {
      "all": "Be specific. Saying it out loud sharpens everything above."
    },
    "ex": {
      "physical": "People who want it done for them. People whose boots are already delaminating at the upper.",
      "digital": "Agencies with a finance person. Anyone whose clients already pay on time.",
      "service": "Offices and apartment blocks. Anywhere outside the tram network."
    }
  },
  {
    "n": 16,
    "section": "show",
    "kind": "text",
    "q": "Three words for your brand.",
    "help": {
      "all": "Not aspirational. What is true today?"
    },
    "ex": {
      "physical": "Repairable. Honest. Unfussy.",
      "digital": "Calm. Precise. On your side.",
      "service": "Reliable. Invisible. Early."
    }
  },
  {
    "n": 17,
    "section": "show",
    "kind": "text",
    "q": {
      "physical": "If your brand were a person at a party, how would they behave?",
      "digital": "If your brand were a person at a conference, how would they behave?",
      "service": "If your brand were a person standing in a customer's kitchen, how would they behave?"
    },
    "help": {
      "physical": "Holding court, listening, introducing people, or fixing the music?",
      "digital": "On stage, working the room, hiding at the coffee, or answering questions properly in the corridor?",
      "service": "Chatty, in and out, explaining everything, or just quietly getting on with it?"
    },
    "ex": {
      "physical": "Not the loudest. Ends up in the kitchen explaining how something works to two people who actually want to know.",
      "digital": "Skips the keynote. Answers your question properly in the corridor and does not pitch you.",
      "service": "Takes their shoes off at the door, does the job, does not need a conversation about it."
    }
  },
  {
    "n": 18,
    "section": "show",
    "kind": "voice",
    "required": true,
    "q": "Which of these sounds like you?",
    "help": {
      "all": "Pick a voice, then read your own hero written three ways. Nothing auto-advances."
    },
    "ex": {
      "physical": "",
      "digital": "",
      "service": ""
    }
  },
  {
    "n": 19,
    "section": "show",
    "kind": "antivoice",
    "q": "So: never like this?",
    "help": {
      "all": "Built from the tiles you did not pick. One tap to confirm, and Studio will avoid these registers."
    },
    "ex": {
      "physical": "",
      "digital": "",
      "service": ""
    }
  },
  {
    "n": 20,
    "section": "show",
    "kind": "text",
    "q": "Which brands do you like the look of, and what specifically about them?",
    "help": {
      "all": "Any industry. Name the thing you like, not just the brand."
    },
    "note": "\"What specifically\" is the whole question. \"I like Aesop\" is unusable. \"The restraint\" is a brief.",
    "ex": {
      "physical": "Patagonia's repair pages. They make fixing something look like the more serious choice, not the cheaper one.",
      "digital": "Monzo. The numbers are big and the language is small, which is the opposite of every other bank.",
      "service": "Aesop. The packaging tells you almost nothing and you still want it. Not the bottles, the restraint."
    }
  }
];

/** Voice tile order differs per track. Nothing is hidden, only ordered. */
export const TILE_ORDER: Record<Track, ArchetypeId[]> = {
  "physical": [
    "confident",
    "bold",
    "warm",
    "expert",
    "visionary",
    "calm"
  ],
  "digital": [
    "expert",
    "visionary",
    "warm",
    "confident",
    "calm",
    "bold"
  ],
  "service": [
    "calm",
    "warm",
    "expert",
    "confident",
    "bold",
    "visionary"
  ]
};

export type ArchetypeId = "confident" | "warm" | "bold" | "calm" | "visionary" | "expert";

export interface Archetype {
  name: string;
  line: string;
  think: string;
  /** Calm and Expert both fall apart without a real answer to Q8. */
  needsProof?: boolean;
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  "confident": {
    "name": "Confident & precise",
    "line": "Few words. No hedging. Lets the product speak.",
    "think": "Rhode, Mercedes, Aesop"
  },
  "warm": {
    "name": "Warm & human",
    "line": "Talks like a person who likes you.",
    "think": "Glossier, Innocent, Bloom"
  },
  "bold": {
    "name": "Bold & playful",
    "line": "Breaks the rules your category takes seriously.",
    "think": "Burger King, Oatly, Duolingo"
  },
  "calm": {
    "name": "Calm & reassuring",
    "line": "Plain, careful, no hype. Tells you the risk.",
    "think": "CeraVe, Volvo, Philips",
    "needsProof": true
  },
  "visionary": {
    "name": "Visionary & inspiring",
    "line": "Talks about what becomes possible.",
    "think": "Apple, Nike, Tony's Chocolonely"
  },
  "expert": {
    "name": "Expert & direct",
    "line": "Leads with the number. Proof in every sentence.",
    "think": "Revolut, Stripe, Dyson",
    "needsProof": true
  }
};

/** Shown alongside the chosen voice in step B, so differences read as real. */
export const NEIGHBOURS: Record<ArchetypeId, [ArchetypeId, ArchetypeId]> = {
  "confident": [
    "visionary",
    "calm"
  ],
  "warm": [
    "bold",
    "calm"
  ],
  "bold": [
    "warm",
    "visionary"
  ],
  "calm": [
    "expert",
    "confident"
  ],
  "visionary": [
    "confident",
    "bold"
  ],
  "expert": [
    "calm",
    "confident"
  ]
};

/** The exemplar business behind each track's placeholders. Deliberately not
 *  the founder's likely vertical: close enough to be legible, far enough to be
 *  useless as a template. Named in the UI so nobody copies it verbatim. */
export const EXEMPLAR: Record<Track, string> = {
  "physical": "a boot repair business",
  "digital": "a late-invoice app",
  "service": "a window cleaner"
};

export function questionsInSection(id: SectionId): Question[] {
  return QUESTIONS.filter(q => q.section === id);
}

export function isGateComplete(answers: Record<number, string>, voice: string | null): boolean {
  return GATE.every(n => (n === 18 ? !!voice : !!answers[n]?.trim()));
}
