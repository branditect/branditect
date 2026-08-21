/**
 * The strategy questionnaire — the single definition of it.
 *
 * Brand Readiness needs the question count to decide whether the
 * questionnaire is complete. Importing the array rather than hardcoding a
 * number means adding a question can never silently make a 90%-done
 * questionnaire read as finished.
 */

export interface QuestionDef {
  section: string;
  question: string;
  placeholder: string;
}

export const QUESTIONS: QuestionDef[] = [
  // Founding Vision (4)
  { section: "Founding Vision", question: "What core problem does your brand exist to solve, and what personal experience sparked you to take it on?", placeholder: "The problem + your origin story..." },
  { section: "Founding Vision", question: "If your brand fully succeeds, what does the world look like in 10 years?", placeholder: "Paint the vision..." },
  { section: "Founding Vision", question: "Beyond profit, what is the deeper motivation driving this brand?", placeholder: "What keeps you going on hard days..." },
  { section: "Founding Vision", question: "Are there any existing brand elements you want to KEEP and build the strategy around — taglines, mission statement, values, manifesto lines, naming conventions?", placeholder: "Tagline: ...\nMission: ...\nValues: ...\n(Leave blank if starting fresh)" },

  // Your Offering (4)
  { section: "Your Offering", question: "Describe what you offer in one clear sentence, then complete: 'We are the only ones who...'", placeholder: "Sentence one: ...\nWe are the only ones who..." },
  { section: "Your Offering", question: "What is your single strongest competitive advantage — the one thing nobody can match?", placeholder: "The one thing..." },
  { section: "Your Offering", question: "How does your delivery, product, or experience feel different from competitors?", placeholder: "Describe what feels different..." },
  { section: "Your Offering", question: "What are your non-negotiables — things you will never compromise on?", placeholder: "The lines you will not cross..." },

  // Competitive Landscape (3)
  { section: "Competitive Landscape", question: "Who are your top 3 competitors and what is each one's biggest weakness?", placeholder: "Competitor 1: ...\nCompetitor 2: ...\nCompetitor 3: ..." },
  { section: "Competitive Landscape", question: "What are the most common complaints customers have about your category?", placeholder: "The frustrations people have with existing options..." },
  { section: "Competitive Landscape", question: "How does your brand challenge the norms or conventions of your industry?", placeholder: "Where you break the rules..." },

  // Your Audience (3)
  { section: "Your Audience", question: "Describe your ideal customer in vivid detail — who they are, what they believe, what they care about.", placeholder: "Role, values, lifestyle, beliefs, pain points..." },
  { section: "Your Audience", question: "Describe the before-and-after transformation your customer experiences, including the emotional shift.", placeholder: "Before: ...\nAfter: ...\nEmotional shift: ..." },
  { section: "Your Audience", question: "Who is explicitly NOT your target customer? Who do you exclude?", placeholder: "We are not for people who..." },

  // Brand Identity (3)
  { section: "Brand Identity", question: "Pick three adjectives that describe how your brand should feel, and the emotional response someone should have when they see it.", placeholder: "Three adjectives + the feeling they evoke..." },
  { section: "Brand Identity", question: "How should your visual approach differ from others in your industry, and which 2-3 brands inspire your aesthetic?", placeholder: "While others look ..., we look ...\nInspirations: Brand 1, Brand 2..." },
  { section: "Brand Identity", question: "If your brand were a person at a party, how would they behave and dress?", placeholder: "They would be the one who... wearing..." },

  // Brand Voice (2)
  { section: "Brand Voice", question: "How does your brand communicate (formal, casual, irreverent, authoritative), and what language or references does your community use?", placeholder: "Communication style + community language..." },
  { section: "Brand Voice", question: "Write a sample post in your ideal voice, and list any words or phrases your brand should NEVER use.", placeholder: "Sample post: ...\nNever use: ..." },

  // Validation & Risks (2)
  { section: "Validation & Risks", question: "What evidence do you have that your brand works (testimonials, data, traction), and what metrics beyond revenue define success?", placeholder: "Proof points + success metrics..." },
  { section: "Validation & Risks", question: "What are the primary challenges or risks your brand faces in the next 12 months?", placeholder: "The biggest threats..." },
];

export const SECTIONS = Array.from(new Set(QUESTIONS.map((q) => q.section)));

/** The key an answer is stored under in `brand_strategies.answers`. */
export const questionKey = (q: QuestionDef) => `${q.section}|${q.question}`;

/** True only when every question has a non-empty answer. */
export function isQuestionnaireComplete(answers: Record<string, string> | null | undefined): boolean {
  if (!answers) return false;
  return QUESTIONS.every((q) => answers[questionKey(q)]?.trim());
}
