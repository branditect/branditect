"use client";

import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type BusinessType = "physical" | "services" | "saas" | "digital";

interface PhysicalProduct {
  kind: "physical";
  id: string;
  name: string;
  category: string;
  description: string;
  rrp: string;
  wholesalePrice: string;
  cogs: string;
  sku: string;
  deliveryTime: string;
  capacityPerMonth: string;
}

interface ServiceProduct {
  kind: "services";
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  priceModel: string;
  deliveryTime: string;
  capacityPerMonth: string;
  idealClient: string;
  inclusions: string;
}

interface SaasProduct {
  kind: "saas";
  id: string;
  name: string;
  monthlyPrice: string;
  description: string;
  inclusions: string;
  flagship: boolean;
  hero: boolean;
}

interface DigitalProduct {
  kind: "digital";
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  deliveryFormat: string;
}

type Product = PhysicalProduct | ServiceProduct | SaasProduct | DigitalProduct;

interface FinancialRules {
  marginFloor: string;
  maxDiscount: string;
  cacCeiling: string;
  currency: string;
  purchaseChannel: string;
  purchaseFrequency: string;
  crossSellNotes: string;
  messagingAvoid: string;
  messagingInclude: string;
  billingCycles: string;
  annualDiscount: string;
  freeTrialDays: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BUSINESS_TYPE_CARDS: {
  type: BusinessType;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    type: "physical",
    icon: "📦",
    title: "Physical Products",
    description:
      "Tangible goods — manufactured, sourced, or handmade. Shipped to customers.",
  },
  {
    type: "services",
    icon: "💼",
    title: "Services",
    description:
      "Professional services, consulting, coaching, agency work. Time or project-based.",
  },
  {
    type: "saas",
    icon: "💻",
    title: "SaaS / Subscriptions",
    description:
      "Software, digital subscriptions, membership platforms. Recurring revenue.",
  },
  {
    type: "digital",
    icon: "✦",
    title: "Digital Products",
    description:
      "Downloads, courses, templates, digital assets. One-time purchase.",
  },
];

const STEP_TITLES = [
  "Business Type",
  "Products & Services",
  "Financial Rules",
  "Review & Confirm",
];

const CURRENCIES = ["EUR", "USD", "GBP", "SEK", "NOK", "DKK"];

const PRICE_MODELS = [
  "Per project",
  "Per hour",
  "Retainer / monthly",
  "Custom quote",
];

const TYPE_LABEL: Record<BusinessType, string> = {
  physical: "Physical",
  services: "Service",
  saas: "SaaS",
  digital: "Digital",
};

const TYPE_BADGE_COLOR: Record<BusinessType, string> = {
  physical: "bg-blue-50 text-blue-700",
  services: "bg-emerald-50 text-emerald-700",
  saas: "bg-violet-50 text-violet-700",
  digital: "bg-amber-50 text-amber-700",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blankProduct(kind: BusinessType): Product {
  switch (kind) {
    case "physical":
      return {
        kind: "physical",
        id: uid(),
        name: "",
        category: "",
        description: "",
        rrp: "",
        wholesalePrice: "",
        cogs: "",
        sku: "",
        deliveryTime: "",
        capacityPerMonth: "",
      };
    case "services":
      return {
        kind: "services",
        id: uid(),
        name: "",
        category: "",
        description: "",
        price: "",
        priceModel: "Per project",
        deliveryTime: "",
        capacityPerMonth: "",
        idealClient: "",
        inclusions: "",
      };
    case "saas":
      return {
        kind: "saas",
        id: uid(),
        name: "",
        monthlyPrice: "",
        description: "",
        inclusions: "",
        flagship: false,
        hero: false,
      };
    case "digital":
      return {
        kind: "digital",
        id: uid(),
        name: "",
        category: "",
        description: "",
        price: "",
        deliveryFormat: "",
      };
  }
}

function getProductName(p: Product): string {
  return p.name;
}

function getProductPrice(p: Product): string {
  switch (p.kind) {
    case "physical":
      return p.rrp ? `€${p.rrp}` : "—";
    case "services":
      return p.price ? `€${p.price}` : "—";
    case "saas":
      return p.monthlyPrice ? `€${p.monthlyPrice}/mo` : "—";
    case "digital":
      return p.price ? `€${p.price}` : "—";
  }
}

/* ------------------------------------------------------------------ */
/*  Shared UI                                                          */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full rounded-lg border border-light bg-white px-3.5 py-2.5 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange";

const labelCls = "text-sm font-medium text-ink mb-1.5 block";

function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className={labelCls} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-brand-orange" : "bg-light"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between mb-10">
      {STEP_TITLES.map((title, i) => {
        const num = i + 1;
        const isCompleted = num < step;
        const isActive = num === step;

        return (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex items-center gap-2.5">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-brand-orange text-white"
                    : "bg-light text-muted"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-sm whitespace-nowrap ${
                  isActive
                    ? "font-bold text-ink"
                    : isCompleted
                    ? "font-medium text-ink"
                    : "text-muted"
                }`}
              >
                {title}
              </span>
            </div>

            {/* Connecting line */}
            {num < 4 && (
              <div
                className={`flex-1 h-px mx-4 ${
                  isCompleted ? "bg-green-500" : "bg-light"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 1 — Business Type                                           */
/* ------------------------------------------------------------------ */

function Screen1({
  businessTypes,
  toggle,
}: {
  businessTypes: BusinessType[];
  toggle: (t: BusinessType) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">
        What type of business are you?
      </h1>
      <p className="text-mid text-sm mb-8">
        Select all that apply — this determines which product forms you&apos;ll see.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BUSINESS_TYPE_CARDS.map((card) => {
          const selected = businessTypes.includes(card.type);
          return (
            <button
              key={card.type}
              type="button"
              onClick={() => toggle(card.type)}
              className={`text-left bg-white border rounded-xl p-5 transition-colors ${
                selected
                  ? "border-brand-orange bg-brand-orange-pale"
                  : "border-light hover:border-brand-orange-mid"
              }`}
            >
              <span className="text-3xl block mb-3">{card.icon}</span>
              <span className="font-semibold text-ink block mb-1">
                {card.title}
              </span>
              <span className="text-muted text-sm">{card.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Forms                                                      */
/* ------------------------------------------------------------------ */

function PhysicalForm({
  draft,
  onChange,
}: {
  draft: PhysicalProduct;
  onChange: (d: PhysicalProduct) => void;
}) {
  const set = (k: keyof PhysicalProduct, v: string) =>
    onChange({ ...draft, [k]: v });

  return (
    <div className="space-y-4">
      <div>
        <Label>Name *</Label>
        <input
          className={inputCls}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Product name"
        />
      </div>
      <div>
        <Label>Category</Label>
        <input
          className={inputCls}
          value={draft.category}
          onChange={(e) => set("category", e.target.value)}
          placeholder="e.g. Skincare, Electronics"
        />
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          className={inputCls}
          rows={3}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>RRP / Retail Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              €
            </span>
            <input
              className={`${inputCls} pl-7`}
              type="number"
              value={draft.rrp}
              onChange={(e) => set("rrp", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>Wholesale Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              €
            </span>
            <input
              className={`${inputCls} pl-7`}
              type="number"
              value={draft.wholesalePrice}
              onChange={(e) => set("wholesalePrice", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>COGS</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              €
            </span>
            <input
              className={`${inputCls} pl-7`}
              type="number"
              value={draft.cogs}
              onChange={(e) => set("cogs", e.target.value)}
            />
          </div>
        </div>
      </div>
      <div>
        <Label>SKU</Label>
        <input
          className={inputCls}
          value={draft.sku}
          onChange={(e) => set("sku", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Delivery Time</Label>
          <input
            className={inputCls}
            value={draft.deliveryTime}
            onChange={(e) => set("deliveryTime", e.target.value)}
            placeholder="e.g. 3-5 business days"
          />
        </div>
        <div>
          <Label>Capacity / month</Label>
          <input
            className={inputCls}
            value={draft.capacityPerMonth}
            onChange={(e) => set("capacityPerMonth", e.target.value)}
            placeholder="e.g. 500 units"
          />
        </div>
      </div>
    </div>
  );
}

function ServiceForm({
  draft,
  onChange,
}: {
  draft: ServiceProduct;
  onChange: (d: ServiceProduct) => void;
}) {
  const set = (k: keyof ServiceProduct, v: string) =>
    onChange({ ...draft, [k]: v });

  return (
    <div className="space-y-4">
      <div>
        <Label>Service Name *</Label>
        <input
          className={inputCls}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Service name"
        />
      </div>
      <div>
        <Label>Category</Label>
        <input
          className={inputCls}
          value={draft.category}
          onChange={(e) => set("category", e.target.value)}
        />
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          className={inputCls}
          rows={3}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
              €
            </span>
            <input
              className={`${inputCls} pl-7`}
              type="number"
              value={draft.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>Price Model</Label>
          <select
            className={inputCls}
            value={draft.priceModel}
            onChange={(e) => set("priceModel", e.target.value)}
          >
            {PRICE_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Delivery Time</Label>
          <input
            className={inputCls}
            value={draft.deliveryTime}
            onChange={(e) => set("deliveryTime", e.target.value)}
            placeholder="e.g. 2-4 weeks"
          />
        </div>
        <div>
          <Label>Capacity per month</Label>
          <input
            className={inputCls}
            value={draft.capacityPerMonth}
            onChange={(e) => set("capacityPerMonth", e.target.value)}
            placeholder="e.g. 5 clients"
          />
        </div>
      </div>
      <div>
        <Label>Ideal Client</Label>
        <input
          className={inputCls}
          value={draft.idealClient}
          onChange={(e) => set("idealClient", e.target.value)}
          placeholder="Comma-separated"
        />
      </div>
      <div>
        <Label>Inclusions</Label>
        <textarea
          className={inputCls}
          rows={3}
          value={draft.inclusions}
          onChange={(e) => set("inclusions", e.target.value)}
          placeholder="Features included — one per line"
        />
      </div>
    </div>
  );
}

function SaasForm({
  draft,
  onChange,
}: {
  draft: SaasProduct;
  onChange: (d: SaasProduct) => void;
}) {
  const set = (k: keyof SaasProduct, v: string | boolean) =>
    onChange({ ...draft, [k]: v });

  return (
    <div className="space-y-4">
      <div>
        <Label>Tier Name *</Label>
        <input
          className={inputCls}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Starter, Pro, Enterprise"
        />
      </div>
      <div>
        <Label>Monthly Price</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
            €
          </span>
          <input
            className={`${inputCls} pl-7`}
            type="number"
            value={draft.monthlyPrice}
            onChange={(e) => set("monthlyPrice", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          className={inputCls}
          rows={3}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div>
        <Label>Inclusions</Label>
        <textarea
          className={inputCls}
          rows={3}
          value={draft.inclusions}
          onChange={(e) => set("inclusions", e.target.value)}
          placeholder="Features included — one per line"
        />
      </div>
      <div className="space-y-3">
        <Toggle
          checked={draft.flagship}
          onChange={(v) => set("flagship", v)}
          label="Flagship plan"
        />
        <Toggle
          checked={draft.hero}
          onChange={(v) => set("hero", v)}
          label="Hero plan (highlighted on pricing page)"
        />
      </div>
    </div>
  );
}

function DigitalForm({
  draft,
  onChange,
}: {
  draft: DigitalProduct;
  onChange: (d: DigitalProduct) => void;
}) {
  const set = (k: keyof DigitalProduct, v: string) =>
    onChange({ ...draft, [k]: v });

  return (
    <div className="space-y-4">
      <div>
        <Label>Name *</Label>
        <input
          className={inputCls}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Product name"
        />
      </div>
      <div>
        <Label>Category</Label>
        <input
          className={inputCls}
          value={draft.category}
          onChange={(e) => set("category", e.target.value)}
          placeholder="e.g. Course, Template, Ebook"
        />
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          className={inputCls}
          rows={3}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div>
        <Label>Price</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
            €
          </span>
          <input
            className={`${inputCls} pl-7`}
            type="number"
            value={draft.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Delivery Format</Label>
        <input
          className={inputCls}
          value={draft.deliveryFormat}
          onChange={(e) => set("deliveryFormat", e.target.value)}
          placeholder="e.g. PDF download, online access"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 2 — Products & Services                                     */
/* ------------------------------------------------------------------ */

function Screen2({
  businessTypes,
  products,
  setProducts,
}: {
  businessTypes: BusinessType[];
  products: Product[];
  setProducts: (p: Product[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<BusinessType>(businessTypes[0]);
  const [draft, setDraft] = useState<Product | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = products.filter((p) => p.kind === activeTab);

  function saveProduct() {
    if (!draft || !draft.name.trim()) return;
    if (editingId) {
      setProducts(products.map((p) => (p.id === editingId ? draft : p)));
    } else {
      setProducts([...products, draft]);
    }
    setDraft(null);
    setEditingId(null);
  }

  function deleteProduct(id: string) {
    setProducts(products.filter((p) => p.id !== id));
  }

  function editProduct(p: Product) {
    setDraft({ ...p });
    setEditingId(p.id);
  }

  function renderForm() {
    if (!draft) return null;
    return (
      <div className="bg-white border border-light rounded-xl p-5 mt-4">
        {draft.kind === "physical" && (
          <PhysicalForm
            draft={draft as PhysicalProduct}
            onChange={(d) => setDraft(d)}
          />
        )}
        {draft.kind === "services" && (
          <ServiceForm
            draft={draft as ServiceProduct}
            onChange={(d) => setDraft(d)}
          />
        )}
        {draft.kind === "saas" && (
          <SaasForm
            draft={draft as SaasProduct}
            onChange={(d) => setDraft(d)}
          />
        )}
        {draft.kind === "digital" && (
          <DigitalForm
            draft={draft as DigitalProduct}
            onChange={(d) => setDraft(d)}
          />
        )}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={saveProduct}
            disabled={!draft.name.trim()}
            className="bg-brand-orange text-white rounded-lg px-6 py-2.5 font-semibold hover:opacity-90 disabled:opacity-40"
          >
            Save product
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setEditingId(null);
            }}
            className="border border-light text-mid rounded-lg px-6 py-2.5 font-medium hover:border-brand-orange hover:text-brand-orange"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">
        Add your products and services
      </h1>
      <p className="text-mid text-sm mb-8">
        Add each product or service individually. You can always edit later.
      </p>

      {/* Tab bar */}
      {businessTypes.length > 1 && (
        <div className="flex gap-1 border-b border-light mb-6">
          {businessTypes.map((bt) => (
            <button
              key={bt}
              type="button"
              onClick={() => {
                setActiveTab(bt);
                setDraft(null);
                setEditingId(null);
              }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === bt
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {TYPE_LABEL[bt]}
            </button>
          ))}
        </div>
      )}

      {/* Product list */}
      <div className="space-y-3 mb-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-light rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-ink">{getProductName(p)}</span>
              <span className="text-sm text-muted">{getProductPrice(p)}</span>
              <span
                className={`font-mono text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  TYPE_BADGE_COLOR[p.kind]
                }`}
              >
                {TYPE_LABEL[p.kind]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => editProduct(p)}
                className="text-sm text-mid hover:text-brand-orange"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteProduct(p.id)}
                className="text-sm text-mid hover:text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add button or form */}
      {draft ? (
        renderForm()
      ) : (
        <button
          type="button"
          onClick={() => setDraft(blankProduct(activeTab))}
          className="border border-dashed border-light text-mid rounded-lg px-6 py-3 font-medium hover:border-brand-orange hover:text-brand-orange w-full text-sm"
        >
          + Add {TYPE_LABEL[activeTab]}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 3 — Financial Rules                                         */
/* ------------------------------------------------------------------ */

function Screen3({
  businessTypes,
  financialRules,
  setFinancialRules,
}: {
  businessTypes: BusinessType[];
  financialRules: FinancialRules;
  setFinancialRules: (r: FinancialRules) => void;
}) {
  const set = (k: keyof FinancialRules, v: string) =>
    setFinancialRules({ ...financialRules, [k]: v });

  const hasSaas = businessTypes.includes("saas");

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">
        Financial rules &amp; enrichment
      </h1>
      <p className="text-mid text-sm mb-8">
        These rules protect your margins and guide AI-generated outputs.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — Financial Rules */}
        <div className="space-y-4">
          <h2 className="font-semibold text-ink text-base mb-2">
            Financial Rules
          </h2>
          <div>
            <Label>Margin floor %</Label>
            <input
              className={inputCls}
              type="number"
              value={financialRules.marginFloor}
              onChange={(e) => set("marginFloor", e.target.value)}
              placeholder="e.g. 25"
            />
          </div>
          <div>
            <Label>Maximum discount %</Label>
            <input
              className={inputCls}
              type="number"
              value={financialRules.maxDiscount}
              onChange={(e) => set("maxDiscount", e.target.value)}
              placeholder="e.g. 35"
            />
          </div>
          <div>
            <Label>CAC ceiling €</Label>
            <input
              className={inputCls}
              type="number"
              value={financialRules.cacCeiling}
              onChange={(e) => set("cacCeiling", e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
          <div>
            <Label>Currency</Label>
            <select
              className={inputCls}
              value={financialRules.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right — Enrichment */}
        <div className="space-y-4">
          <h2 className="font-semibold text-ink text-base mb-2">Enrichment</h2>
          <div>
            <Label>Purchase channel</Label>
            <input
              className={inputCls}
              value={financialRules.purchaseChannel}
              onChange={(e) => set("purchaseChannel", e.target.value)}
              placeholder="e.g. Website, retail stores, wholesale"
            />
          </div>
          <div>
            <Label>Purchase frequency</Label>
            <input
              className={inputCls}
              value={financialRules.purchaseFrequency}
              onChange={(e) => set("purchaseFrequency", e.target.value)}
              placeholder="e.g. Monthly, quarterly, one-time"
            />
          </div>
          <div>
            <Label>Cross-sell notes</Label>
            <textarea
              className={inputCls}
              rows={2}
              value={financialRules.crossSellNotes}
              onChange={(e) => set("crossSellNotes", e.target.value)}
              placeholder="Which products complement each other?"
            />
          </div>
          <div>
            <Label>Messaging to avoid</Label>
            <textarea
              className={inputCls}
              rows={2}
              value={financialRules.messagingAvoid}
              onChange={(e) => set("messagingAvoid", e.target.value)}
              placeholder="Words or claims to never use in product copy"
            />
          </div>
          <div>
            <Label>Messaging to always include</Label>
            <textarea
              className={inputCls}
              rows={2}
              value={financialRules.messagingInclude}
              onChange={(e) => set("messagingInclude", e.target.value)}
              placeholder="Key claims or proof points"
            />
          </div>
        </div>
      </div>

      {/* SaaS extras */}
      {hasSaas && (
        <div className="mt-8 border-t border-light pt-8">
          <h2 className="font-semibold text-ink text-base mb-4">
            SaaS / Subscription Settings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Billing cycles</Label>
              <input
                className={inputCls}
                value={financialRules.billingCycles}
                onChange={(e) => set("billingCycles", e.target.value)}
                placeholder="e.g. Monthly, Annual"
              />
            </div>
            <div>
              <Label>Annual discount %</Label>
              <input
                className={inputCls}
                type="number"
                value={financialRules.annualDiscount}
                onChange={(e) => set("annualDiscount", e.target.value)}
              />
            </div>
            <div>
              <Label>Free trial days</Label>
              <input
                className={inputCls}
                type="number"
                value={financialRules.freeTrialDays}
                onChange={(e) => set("freeTrialDays", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 4 — Review & Confirm                                        */
/* ------------------------------------------------------------------ */

function Screen4({
  businessTypes,
  products,
  financialRules,
  saving,
  saved,
  onSave,
}: {
  businessTypes: BusinessType[];
  products: Product[];
  financialRules: FinancialRules;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">
        Review your catalog
      </h1>
      <p className="text-mid text-sm mb-8">
        Everything looks good? Confirm to save.
      </p>

      {/* Business Types */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted mb-2 uppercase tracking-wide">
          Business Types
        </h2>
        <div className="flex flex-wrap gap-2">
          {businessTypes.map((bt) => (
            <span
              key={bt}
              className="bg-brand-orange-pale text-brand-orange font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-full"
            >
              {TYPE_LABEL[bt]}
            </span>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted mb-2 uppercase tracking-wide">
          Products &amp; Services
        </h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted italic">No products added yet.</p>
        ) : (
          <div className="bg-white border border-light rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light bg-pale">
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-light last:border-0">
                    <td className="px-4 py-3 text-ink font-medium">
                      {getProductName(p)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          TYPE_BADGE_COLOR[p.kind]
                        }`}
                      >
                        {TYPE_LABEL[p.kind]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-mid">{getProductPrice(p)}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-600 text-xs font-medium">
                        Ready
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Financial Rules Summary */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted mb-2 uppercase tracking-wide">
          Financial Rules
        </h2>
        <div className="bg-white border border-light rounded-xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted block mb-0.5">Margin floor</span>
              <span className="text-ink font-medium">
                {financialRules.marginFloor
                  ? `${financialRules.marginFloor}%`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted block mb-0.5">Max discount</span>
              <span className="text-ink font-medium">
                {financialRules.maxDiscount
                  ? `${financialRules.maxDiscount}%`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted block mb-0.5">CAC ceiling</span>
              <span className="text-ink font-medium">
                {financialRules.cacCeiling
                  ? `€${financialRules.cacCeiling}`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-muted block mb-0.5">Currency</span>
              <span className="text-ink font-medium">
                {financialRules.currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm */}
      {saved ? (
        <div className="flex items-center gap-4">
          <span className="text-green-600 font-semibold">Saved ✓</span>
          <Link
            href="/dashboard/catalog"
            className="text-brand-orange font-medium hover:underline"
          >
            View catalog →
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-brand-orange text-white rounded-lg px-8 py-3 font-semibold text-base hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
        >
          {saving && (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {saving ? "Saving..." : "Confirm & Save"}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CatalogPage() {
  const [step, setStep] = useState(1);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [financialRules, setFinancialRules] = useState<FinancialRules>({
    marginFloor: "",
    maxDiscount: "",
    cacCeiling: "",
    currency: "EUR",
    purchaseChannel: "",
    purchaseFrequency: "",
    crossSellNotes: "",
    messagingAvoid: "",
    messagingInclude: "",
    billingCycles: "",
    annualDiscount: "",
    freeTrialDays: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleBusinessType(t: BusinessType) {
    setBusinessTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessTypes, products, financialRules }),
      });
      setSaved(true);
    } catch {
      // handle error silently for now
    } finally {
      setSaving(false);
    }
  }

  function canContinue(): boolean {
    switch (step) {
      case 1:
        return businessTypes.length > 0;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <ProgressBar step={step} />

      {/* Screen content */}
      {step === 1 && (
        <Screen1 businessTypes={businessTypes} toggle={toggleBusinessType} />
      )}
      {step === 2 && (
        <Screen2
          businessTypes={businessTypes}
          products={products}
          setProducts={setProducts}
        />
      )}
      {step === 3 && (
        <Screen3
          businessTypes={businessTypes}
          financialRules={financialRules}
          setFinancialRules={setFinancialRules}
        />
      )}
      {step === 4 && (
        <Screen4
          businessTypes={businessTypes}
          products={products}
          financialRules={financialRules}
          saving={saving}
          saved={saved}
          onSave={handleSave}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-light">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="border border-light text-mid rounded-lg px-6 py-2.5 font-medium hover:border-brand-orange hover:text-brand-orange"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue()}
            className="bg-brand-orange text-white rounded-lg px-6 py-2.5 font-semibold hover:opacity-90 disabled:opacity-40"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
