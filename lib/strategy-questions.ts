/**
 * The strategy questionnaire — the single definition of it.
 *
 * Brand Readiness needs the question count to decide whether the
 * questionnaire is complete. Importing the array rather than hardcoding a
 * number means adding a question can never silently make a 90%-done
 * questionnaire read as finished.
 *
 * EVERY QUESTION FEEDS A FIELD THE DOCUMENT RENDERS. `feeds` names it. The old
 * set had no source at all for principles, boundaries, focus, personality,
 * attributes or pillar proof, which is why sections 07, 08 and 09 came out
 * empty however well the model wrote. A question that feeds nothing is a
 * question that wastes the founder's time; a field with no question behind it
 * is a section the model has to invent or leave blank.
 *
 * THE STORAGE KEY IS `id`, NOT THE TEXT. It used to be `${section}|${question}`,
 * so editing a typo in a question orphaned every answer already saved under the
 * old wording. Ids are short, permanent and never shown. Reword freely.
 */

export interface QuestionDef {
  /** Permanent. The storage key. Never change one, never reuse one. */
  id: string;
  section: string;
  question: string;
  placeholder: string;
  /** Which part of BrandStrategy this answer builds. Documentation, and the
   *  test that proves no section is left without a source. */
  feeds: string;
}

export const QUESTIONS: QuestionDef[] = [
  // ── Your business ────────────────────────────────────────────────────────
  { id: "biz-what", section: "Your business",
    question: "What do you sell?",
    placeholder: "One sentence, the way you would say it to a neighbour.",
    feeds: "core.whatWeDo, positioning.weAre" },
  { id: "biz-why", section: "Your business",
    question: "Why did you start it?",
    placeholder: "What actually happened. Not a mission statement.",
    feeds: "core.whyWeExist" },
  { id: "biz-promise", section: "Your business",
    question: "What do customers get from you every single time?",
    placeholder: "The thing you always deliver, even on a bad week.",
    feeds: "core.promise" },

  // ── Your customers ───────────────────────────────────────────────────────
  { id: "cust-who", section: "Your customers",
    question: "Describe your best customer. Who are they?",
    placeholder: "One real person you have sold to. Age, job, situation.",
    feeds: "audience[].name/age/role/detail, positioning.forWhom" },
  { id: "cust-want", section: "Your customers",
    question: "What are they trying to get done, and what gets in the way?",
    placeholder: "What they want, then what makes it hard.",
    feeds: "audience[].wants/frustratedBy, analysis.problemLadder" },
  { id: "cust-not", section: "Your customers",
    question: "Who is this not for?",
    placeholder: "Be specific. It sharpens everything else.",
    feeds: "positioning.notFor" },

  // ── Your competition ─────────────────────────────────────────────────────
  { id: "comp-who", section: "Your competition",
    question: "If someone does not buy from you, where do they go instead?",
    placeholder: "Name two or three. Include \"does it themselves\" if that is the truth.",
    feeds: "competitors[].name, positioning.unlike" },
  { id: "comp-weak", section: "Your competition",
    question: "What do those alternatives get wrong?",
    placeholder: "What customers actually complain about, in their words.",
    feeds: "competitors[].description, analysis.marketMap" },
  { id: "comp-price", section: "Your competition",
    question: "Compared to them, are you cheaper, about the same, or more expensive?",
    placeholder: "And in one line, why that is right for you.",
    feeds: "competitors[].price/map" },

  // ── What makes you different ─────────────────────────────────────────────
  { id: "diff-what", section: "What makes you different",
    question: "What do you do that they cannot easily copy?",
    placeholder: "One thing, plainly. If a competitor could say it too, it does not count.",
    feeds: "positioning.difference, pillars[].title/body" },
  { id: "diff-proof", section: "What makes you different",
    question: "What proof do you have?",
    placeholder: "Numbers, tests, years, certificates, guarantees. Not adjectives.",
    feeds: "pillars[].proof, positioning.because" },
  { id: "diff-never", section: "What makes you different",
    question: "What would you never do, even if it cost you the sale?",
    placeholder: "Your actual line.",
    feeds: "boundaries.neverCompromise" },

  // ── How you sound and behave ─────────────────────────────────────────────
  { id: "tone-words", section: "How you sound",
    question: "Pick three words for your brand.",
    placeholder: "Not what you wish it were. What it is today.",
    feeds: "pyramid.attributes" },
  { id: "tone-feel", section: "How you sound",
    question: "How should someone feel after dealing with you?",
    placeholder: "One or two feelings, honestly.",
    feeds: "pyramid.essence/benefits" },
  { id: "tone-lang", section: "How you sound",
    question: "Which words do you always use, and which do you avoid?",
    placeholder: "Use: ...\nAvoid: ...",
    feeds: "boundaries.wordsUsed/wordsAvoided" },
  { id: "tone-always", section: "How you sound",
    question: "What do you always do for a customer, no matter what?",
    placeholder: "The habits people would notice.",
    feeds: "boundaries.always, principles[]" },
  { id: "tone-style", section: "How you sound",
    question: "How would you describe the way you write?",
    placeholder: "Short and direct? Warm and chatty? Careful and formal? Funny?\nAnd is there anyone whose writing you would happily be compared to?",
    feeds: "voice.description, pyramid.personality" },

  // ── Where you are going ──────────────────────────────────────────────────
  { id: "next-goal", section: "Where you are going",
    question: "What is the one thing the next twelve months are for?",
    placeholder: "One goal, not five.",
    feeds: "focus.goal" },
  { id: "next-steps", section: "Where you are going",
    question: "What has to happen to get there?",
    placeholder: "Two or three things, and roughly when.",
    feeds: "focus.priorities" },
  { id: "next-tagline", section: "Where you are going",
    question: "Do you already have a tagline or slogan you want to keep?",
    placeholder: "Leave blank if not. If you have one, we build around it.",
    feeds: "messages.tagline" },
];

export const SECTIONS = Array.from(new Set(QUESTIONS.map((q) => q.section)));

/**
 * The key an answer is stored under in `brand_strategies.answers`.
 *
 * The id, not the text. Rewording a question used to orphan every answer
 * already saved under the old wording, silently, with no error anywhere.
 */
export const questionKey = (q: QuestionDef) => q.id;

/** True only when every question has a non-empty answer. */
export function isQuestionnaireComplete(answers: Record<string, string> | null | undefined): boolean {
  if (!answers) return false;
  return QUESTIONS.every((q) => answers[questionKey(q)]?.trim());
}
