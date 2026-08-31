/**
 * The plan ladder, in one place.
 *
 * The public pricing page reads this and nothing else, so a price can never be
 * changed in the markup and forgotten in the comparison table two sections
 * below it.
 *
 * SOURCE OF TRUTH, AND A CONFLICT TO SETTLE.
 * branditect-ui/spec/pricing.md is titled "Pricing, a recommendation" and its
 * ladder proposes 44.90 and 59.90 with 550 and 800 credits. The reference page
 * this was built from, and the brief that commissioned it, both carry 29.90
 * and 45.90 with 350 and 600 credits, described as real and current. These are
 * the current numbers. Adopting the recommendation is a one-line change here.
 */

export interface Plan {
  id: "free" | "pro" | "proplus" | "enterprise";
  name: string;
  who: string;
  /** Shown as-is. Null for the plan that is priced on a call. */
  monthly: string | null;
  /** The monthly figure when billed for a year. */
  yearlyMonthly: string | null;
  /** What the yearly invoice says. */
  yearlyTotal: string | null;
  vatLine: string;
  credits: string;
  creditsLabel: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: string[];
}

export const VAT_RATE = "25.5%";

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    who: "Build the brain. Keep it as long as you like.",
    monthly: "€0",
    yearlyMonthly: "€0",
    yearlyTotal: null,
    vatLine: "No card required",
    credits: "100 credits",
    creditsLabel: "One time, no expiry",
    cta: "Start free",
    href: "/signup",
    features: [
      "Brand truth. Strategy, positioning, tone of voice, visual identity",
      "Product truth. Every product, its specs and the claims you can prove",
      "Commercial truth. Landed cost, margin, floor price, discount limits",
      "Every file you upload read and indexed, free",
      "Brand Readiness, so you know what is still missing",
      "1 brand, 200 MB. Yours to read, always",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    who: "For a founder running one brand properly.",
    monthly: "€29.90",
    yearlyMonthly: "€24.92",
    yearlyTotal: "€299",
    vatLine: `Incl. VAT ${VAT_RATE}`,
    credits: "350 credits",
    creditsLabel: "Every month",
    cta: "Start free, upgrade later",
    href: "/signup",
    featured: true,
    features: [
      "The whole brain, now working for you",
      "Copy that cites your own product facts and shows where each number came from",
      "Offers and discounts checked against your floor price before you see them",
      "Images shot in your own light, from your own references",
      "Ask your brain anything. It has read everything you gave it",
      "Your brand kit link for freelancers and printers",
      "1 brand, 1 seat, 5 GB",
    ],
  },
  {
    id: "proplus",
    name: "Pro Plus",
    who: "For agencies and anyone running more than one brand.",
    monthly: "€45.90",
    yearlyMonthly: "€38.25",
    yearlyTotal: "€459",
    vatLine: `Incl. VAT ${VAT_RATE}`,
    credits: "600 credits",
    creditsLabel: "Every month",
    cta: "Start free, upgrade later",
    href: "/signup",
    features: [
      "Everything in Pro, plus",
      "3 brands, each with its own truth. They never bleed into each other",
      "3 seats, so your team writes from the same brain",
      "20 GB",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    who: "For brand portfolios and larger teams.",
    monthly: null,
    yearlyMonthly: null,
    yearlyTotal: null,
    vatLine: "Priced on what you need",
    credits: "Agreed",
    creditsLabel: "Set with you",
    cta: "Contact us",
    href: "mailto:hello@branditect.io",
    features: [
      "Unlimited brands and seats",
      "Single sign-on",
      "Custom data agreement",
      "A named contact, not a queue",
      "We set the brain up with you",
    ],
  },
];

/** The comparison table, so it can never disagree with the cards above it. */
export const COMPARISON: { label: string; values: Record<Plan["id"], string> }[] = [
  { label: "Price, incl. VAT, monthly", values: { free: "€0", pro: "€29.90", proplus: "€45.90", enterprise: "Contact us" } },
  { label: "Credits", values: { free: "100 once", pro: "350/mo", proplus: "600/mo", enterprise: "Agreed" } },
  { label: "Brands", values: { free: "1", pro: "1", proplus: "3", enterprise: "Unlimited" } },
  { label: "Seats", values: { free: "1", pro: "1", proplus: "3", enterprise: "Agreed" } },
  { label: "Storage", values: { free: "200 MB", pro: "5 GB", proplus: "20 GB", enterprise: "Agreed" } },
  { label: "Brand kit share link", values: { free: "No", pro: "Yes", proplus: "Yes", enterprise: "Yes" } },
  { label: "Support", values: { free: "Docs", pro: "Email", proplus: "Email, priority", enterprise: "Named contact" } },
];

/** What a credit buys. One number, quoted in two places on the page. */
export const CREDIT_COSTS = [
  { action: "One image", cost: "5 credits" },
  { action: "One set of three copy drafts", cost: "2 credits" },
  { action: "One question to your brand brain", cost: "1 credit" },
  { action: "Reading and indexing any file you upload", cost: "Free" },
];

export const TOP_UP = "€9 for 200 extra credits";
