"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBrand } from "@/lib/useBrand";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PhysicalProduct {
  kind: "physical"; id: string; name: string; category: string;
  description: string; rrp: string; wholesalePrice: string; cogs: string;
  sku: string; deliveryTime: string; capacityPerMonth: string;
}
interface ServiceProduct {
  kind: "services"; id: string; name: string; category: string;
  description: string; price: string; priceModel: string; deliveryTime: string;
  capacityPerMonth: string; idealClient: string; inclusions: string;
}
interface SaasProduct {
  kind: "saas"; id: string; name: string; monthlyPrice: string;
  description: string; inclusions: string; flagship: boolean; hero: boolean;
}
interface DigitalProduct {
  kind: "digital"; id: string; name: string; category: string;
  description: string; price: string; deliveryFormat: string;
}
type Product = PhysicalProduct | ServiceProduct | SaasProduct | DigitalProduct;
type Kind = Product["kind"];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const KIND_LABEL: Record<Kind, string> = {
  physical: "Physical", services: "Service", saas: "SaaS", digital: "Digital",
};
const KIND_COLOR: Record<Kind, string> = {
  physical: "bg-blue-50 text-blue-700 border-blue-200",
  services: "bg-emerald-50 text-emerald-700 border-emerald-200",
  saas: "bg-violet-50 text-violet-700 border-violet-200",
  digital: "bg-amber-50 text-amber-700 border-amber-200",
};
const KIND_OPTIONS: { kind: Kind; icon: string; label: string; desc: string }[] = [
  { kind: "physical", icon: "PHY", label: "Physical Product", desc: "Tangible goods, shipped to customers" },
  { kind: "services", icon: "SRV", label: "Service", desc: "Consulting, coaching, agency work" },
  { kind: "saas", icon: "SAS", label: "SaaS / Subscription", desc: "Software or recurring digital service" },
  { kind: "digital", icon: "DIG", label: "Digital Product", desc: "Downloads, courses, templates" },
];
const PRICE_MODELS = ["Per project", "Per hour", "Retainer / monthly", "Custom quote"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function uid() { return Math.random().toString(36).slice(2, 10); }

function blankProduct(kind: Kind): Product {
  switch (kind) {
    case "physical": return { kind, id: uid(), name: "", category: "", description: "", rrp: "", wholesalePrice: "", cogs: "", sku: "", deliveryTime: "", capacityPerMonth: "" };
    case "services": return { kind, id: uid(), name: "", category: "", description: "", price: "", priceModel: "Per project", deliveryTime: "", capacityPerMonth: "", idealClient: "", inclusions: "" };
    case "saas": return { kind, id: uid(), name: "", monthlyPrice: "", description: "", inclusions: "", flagship: false, hero: false };
    case "digital": return { kind, id: uid(), name: "", category: "", description: "", price: "", deliveryFormat: "" };
  }
}

function getPrice(p: Product): string {
  switch (p.kind) {
    case "physical": return p.rrp ? `€${p.rrp}` : "—";
    case "services": return p.price ? `€${p.price}` : "—";
    case "saas": return p.monthlyPrice ? `€${p.monthlyPrice}/mo` : "—";
    case "digital": return p.price ? `€${p.price}` : "—";
  }
}

function productToDb(p: Product, brandId: string, i: number) {
  const base = { brand_id: brandId, name: p.name, sort_order: i, is_active: true, is_hero: false, is_flagship: false, flag_margin: true };
  const csv = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
  switch (p.kind) {
    case "physical": return { ...base, type: "physical", category: p.category || null, description: p.description || null, price_rrp: p.rrp ? parseFloat(p.rrp) : null, price_wholesale: p.wholesalePrice ? parseFloat(p.wholesalePrice) : null, price_cogs: p.cogs ? parseFloat(p.cogs) : null, sku: p.sku || null, delivery_time: p.deliveryTime || null, capacity_per_month: p.capacityPerMonth || null };
    case "services": return { ...base, type: "service", category: p.category || null, description: p.description || null, price_rrp: p.price ? parseFloat(p.price) : null, price_model: p.priceModel || null, delivery_time: p.deliveryTime || null, capacity_per_month: p.capacityPerMonth || null, ideal_client: csv(p.idealClient), inclusions: csv(p.inclusions) };
    case "saas": return { ...base, type: "saas_tier", description: p.description || null, price_monthly: p.monthlyPrice ? parseFloat(p.monthlyPrice) : null, inclusions: csv(p.inclusions), is_hero: p.hero, is_flagship: p.flagship };
    case "digital": return { ...base, type: "digital", category: p.category || null, description: p.description || null, price_rrp: p.price ? parseFloat(p.price) : null, delivery_time: p.deliveryFormat || null };
  }
}

function dbToProduct(r: Record<string, unknown>): Product | null {
  const id = (r.id as string) || uid();
  switch (r.type as string) {
    case "physical": return { kind: "physical", id, name: (r.name as string) || "", category: (r.category as string) || "", description: (r.description as string) || "", rrp: r.price_rrp != null ? String(r.price_rrp) : "", wholesalePrice: r.price_wholesale != null ? String(r.price_wholesale) : "", cogs: r.price_cogs != null ? String(r.price_cogs) : "", sku: (r.sku as string) || "", deliveryTime: (r.delivery_time as string) || "", capacityPerMonth: (r.capacity_per_month as string) || "" };
    case "service": return { kind: "services", id, name: (r.name as string) || "", category: (r.category as string) || "", description: (r.description as string) || "", price: r.price_rrp != null ? String(r.price_rrp) : "", priceModel: (r.price_model as string) || "Per project", deliveryTime: (r.delivery_time as string) || "", capacityPerMonth: (r.capacity_per_month as string) || "", idealClient: Array.isArray(r.ideal_client) ? (r.ideal_client as string[]).join(", ") : "", inclusions: Array.isArray(r.inclusions) ? (r.inclusions as string[]).join(", ") : "" };
    case "saas_tier": return { kind: "saas", id, name: (r.name as string) || "", monthlyPrice: r.price_monthly != null ? String(r.price_monthly) : "", description: (r.description as string) || "", inclusions: Array.isArray(r.inclusions) ? (r.inclusions as string[]).join(", ") : "", flagship: !!r.is_flagship, hero: !!r.is_hero };
    case "digital": return { kind: "digital", id, name: (r.name as string) || "", category: (r.category as string) || "", description: (r.description as string) || "", price: r.price_rrp != null ? String(r.price_rrp) : "", deliveryFormat: (r.delivery_time as string) || "" };
    default: return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Input helper                                                       */
/* ------------------------------------------------------------------ */

const inp = "w-full rounded-lg border border-light bg-white px-3 py-2 text-sm text-ink focus:border-brand-orange focus:outline-none";
const lbl = "block text-xs font-medium text-mid mb-1";

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input className={inp} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <textarea className={inp + " resize-none"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product form fields by kind                                        */
/* ------------------------------------------------------------------ */

function ProductFormFields({ product, onChange }: { product: Product; onChange: (p: Product) => void }) {
  const set = (fields: Partial<Product>) => onChange({ ...product, ...fields } as Product);
  switch (product.kind) {
    case "physical": return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Product name *" value={product.name} onChange={v => set({ name: v })} placeholder="e.g. Face Serum 30ml" /></div>
        <Field label="Category" value={product.category} onChange={v => set({ category: v })} placeholder="e.g. Skincare" />
        <Field label="SKU" value={product.sku} onChange={v => set({ sku: v })} placeholder="e.g. SKU-001" />
        <div className="col-span-2"><TextArea label="Description" value={product.description} onChange={v => set({ description: v })} placeholder="What is this product?" rows={2} /></div>
        <Field label="RRP (€)" value={product.rrp} onChange={v => set({ rrp: v })} placeholder="29.99" type="number" />
        <Field label="Wholesale price (€)" value={product.wholesalePrice} onChange={v => set({ wholesalePrice: v })} placeholder="15.00" type="number" />
        <Field label="COGS (€)" value={product.cogs} onChange={v => set({ cogs: v })} placeholder="8.00" type="number" />
        <Field label="Delivery time" value={product.deliveryTime} onChange={v => set({ deliveryTime: v })} placeholder="3–5 days" />
        <div className="col-span-2"><Field label="Capacity per month" value={product.capacityPerMonth} onChange={v => set({ capacityPerMonth: v })} placeholder="e.g. 500 units" /></div>
      </div>
    );
    case "services": return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Service name *" value={product.name} onChange={v => set({ name: v })} placeholder="e.g. Brand Strategy Session" /></div>
        <Field label="Category" value={product.category} onChange={v => set({ category: v })} placeholder="e.g. Consulting" />
        <Field label="Price (€)" value={product.price} onChange={v => set({ price: v })} placeholder="500" type="number" />
        <div className="col-span-2">
          <label className={lbl}>Price model</label>
          <select className={inp} value={product.priceModel} onChange={e => set({ priceModel: e.target.value })}>
            {PRICE_MODELS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="col-span-2"><TextArea label="Description" value={product.description} onChange={v => set({ description: v })} placeholder="What is included in this service?" rows={2} /></div>
        <Field label="Ideal client" value={product.idealClient} onChange={v => set({ idealClient: v })} placeholder="e.g. Early-stage startups" />
        <Field label="Delivery time" value={product.deliveryTime} onChange={v => set({ deliveryTime: v })} placeholder="e.g. 2 weeks" />
        <div className="col-span-2"><Field label="What's included (comma-separated)" value={product.inclusions} onChange={v => set({ inclusions: v })} placeholder="Strategy doc, 2 revision rounds, Q&A call" /></div>
        <div className="col-span-2"><Field label="Capacity per month" value={product.capacityPerMonth} onChange={v => set({ capacityPerMonth: v })} placeholder="e.g. 4 clients" /></div>
      </div>
    );
    case "saas": return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Plan name *" value={product.name} onChange={v => set({ name: v })} placeholder="e.g. Pro Plan" /></div>
        <Field label="Monthly price (€)" value={product.monthlyPrice} onChange={v => set({ monthlyPrice: v })} placeholder="49" type="number" />
        <div className="col-span-2"><TextArea label="Description" value={product.description} onChange={v => set({ description: v })} placeholder="What does this plan include?" rows={2} /></div>
        <div className="col-span-2"><Field label="What's included (comma-separated)" value={product.inclusions} onChange={v => set({ inclusions: v })} placeholder="Unlimited projects, Analytics, API access" /></div>
        <label className="col-span-2 flex items-center gap-3 cursor-pointer">
          <button type="button" onClick={() => set({ flagship: !product.flagship })} className={`w-9 h-5 rounded-full transition-colors ${product.flagship ? "bg-brand-orange" : "bg-light"}`}>
            <span className={`block h-4 w-4 rounded-full bg-white shadow ml-0.5 transition-transform ${product.flagship ? "translate-x-4" : ""}`} />
          </button>
          <span className="text-sm text-ink">Mark as flagship plan</span>
        </label>
      </div>
    );
    case "digital": return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Product name *" value={product.name} onChange={v => set({ name: v })} placeholder="e.g. Brand Identity Template Pack" /></div>
        <Field label="Category" value={product.category} onChange={v => set({ category: v })} placeholder="e.g. Templates" />
        <Field label="Price (€)" value={product.price} onChange={v => set({ price: v })} placeholder="29" type="number" />
        <div className="col-span-2"><TextArea label="Description" value={product.description} onChange={v => set({ description: v })} placeholder="What does the customer get?" rows={2} /></div>
        <div className="col-span-2"><Field label="Delivery format" value={product.deliveryFormat} onChange={v => set({ deliveryFormat: v })} placeholder="e.g. PDF + Figma file" /></div>
      </div>
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Add / Edit modal                                                   */
/* ------------------------------------------------------------------ */

function ProductModal({ initial, onSave, onClose }: { initial: Product | null; onSave: (p: Product) => void; onClose: () => void }) {
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "services");
  const [product, setProduct] = useState<Product>(initial ?? blankProduct("services"));
  const [pickingKind, setPickingKind] = useState(!initial);

  useEffect(() => {
    if (!initial) setProduct(blankProduct(kind));
  }, [kind, initial]);

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-light">
          <h2 className="font-semibold text-ink text-[0.95rem]">{isEdit ? "Edit product" : "Add product"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none">×</button>
        </div>

        <div className="px-6 py-5">
          {/* Kind picker — only shown when adding new */}
          {!isEdit && (
            <div className="mb-5">
              <label className={lbl + " mb-2"}>Product type</label>
              <div className="grid grid-cols-2 gap-2">
                {KIND_OPTIONS.map(o => (
                  <button key={o.kind} type="button" onClick={() => { setKind(o.kind); setPickingKind(false); }}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${kind === o.kind ? "border-brand-orange bg-brand-orange-pale" : "border-light hover:border-brand-orange/40"}`}>
                    <span className="text-xl mt-0.5 shrink-0">{o.icon}</span>
                    <div>
                      <div className={`text-xs font-semibold ${kind === o.kind ? "text-brand-orange" : "text-ink"}`}>{o.label}</div>
                      <div className="text-[0.65rem] text-muted leading-tight mt-0.5">{o.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!pickingKind && (
            <ProductFormFields product={product} onChange={setProduct} />
          )}
        </div>

        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-light text-mid text-sm hover:border-brand-orange hover:text-brand-orange transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (product.name.trim()) onSave(product); }}
            disabled={!product.name.trim() || pickingKind}
            className="flex-1 py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover disabled:opacity-40 transition-colors"
          >
            {isEdit ? "Save changes" : "Add to catalogue"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Import modal                                                       */
/* ------------------------------------------------------------------ */

function ImportModal({ onAdd, onClose }: { onAdd: (products: Product[]) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Product[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExtract() {
    setExtracting(true);
    setError("");
    setPreview(null);
    try {
      let res: Response;
      if (tab === "file" && file) {
        const form = new FormData();
        form.append("file", file);
        res = await fetch("/api/catalog/parse", { method: "POST", body: form });
      } else {
        res = await fetch("/api/catalog/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Extraction failed"); return; }
      const products = (json.products as Product[]).map(p => ({ ...p, id: uid() }));
      setPreview(products);
      setSelected(new Set(products.map(p => p.id)));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setExtracting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  const canExtract = tab === "text" ? text.trim().length > 10 : !!file;
  const selectedProducts = preview?.filter(p => selected.has(p.id)) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-light">
          <div>
            <h2 className="font-semibold text-ink text-[0.95rem]">Import products with AI</h2>
            <p className="text-xs text-muted mt-0.5">Paste product info or upload a PDF — AI extracts each item automatically</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none ml-4 shrink-0">×</button>
        </div>

        <div className="px-6 py-5">
          {!preview ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 bg-pale rounded-lg p-1 mb-4">
                {(["text", "file"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
                    {t === "text" ? "Paste text" : "Upload PDF"}
                  </button>
                ))}
              </div>

              {tab === "text" ? (
                <textarea
                  className={inp + " resize-none w-full"}
                  rows={10}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={"Paste your product list, price list, service menu, or any text describing your products/services here...\n\nExample:\nBrand Strategy Workshop — €1,500\nA full-day workshop to define your brand positioning and messaging framework.\n\nSocial Media Retainer — €800/month\nMonthly management of 2 social channels including content creation and scheduling."}
                />
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-light rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-brand-orange hover:bg-brand-orange-pale/30 transition-all"
                >
                  <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                  <span className="text-3xl mb-3">{file ? "📄" : "⬆"}</span>
                  {file ? (
                    <p className="text-sm font-medium text-ink">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-ink mb-1">Drop a PDF or image here</p>
                      <p className="text-xs text-muted">Price lists, service menus, product catalogues</p>
                    </>
                  )}
                </div>
              )}

              {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

              <button
                onClick={handleExtract}
                disabled={!canExtract || extracting}
                className="mt-4 w-full py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {extracting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Extracting products...
                  </>
                ) : "Extract products with AI"}
              </button>
            </>
          ) : (
            <>
              {/* Preview extracted products */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-ink">{preview.length} product{preview.length !== 1 ? "s" : ""} found — select which to add</p>
                <button onClick={() => setPreview(null)} className="text-xs text-muted hover:text-ink">← Back</button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {preview.map(p => (
                  <div key={p.id} onClick={() => toggleSelect(p.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selected.has(p.id) ? "border-brand-orange bg-brand-orange-pale/40" : "border-light hover:border-light"}`}>
                    <div className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${selected.has(p.id) ? "bg-brand-orange border-brand-orange" : "border-light"}`}>
                      {selected.has(p.id) && <span className="text-white text-[0.6rem] leading-none">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-ink">{p.name || "Unnamed"}</span>
                        <span className={`text-[0.6rem] font-mono px-1.5 py-0.5 rounded border ${KIND_COLOR[p.kind]}`}>{KIND_LABEL[p.kind]}</span>
                        <span className="text-xs text-brand-orange font-medium">{getPrice(p)}</span>
                      </div>
                      {p.description && <p className="text-xs text-muted mt-0.5 line-clamp-2">{p.description}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-light text-mid text-sm hover:border-brand-orange hover:text-brand-orange transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => { onAdd(selectedProducts); onClose(); }}
                  disabled={selectedProducts.length === 0}
                  className="flex-1 py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover disabled:opacity-40 transition-colors"
                >
                  Add {selectedProducts.length > 0 ? selectedProducts.length : ""} to catalogue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product card                                                       */
/* ------------------------------------------------------------------ */

function ProductCard({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white border border-light rounded-xl p-5 flex flex-col gap-3 hover:border-brand-orange/30 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[0.6rem] font-mono font-medium px-1.5 py-0.5 rounded border ${KIND_COLOR[product.kind]}`}>
              {KIND_LABEL[product.kind]}
            </span>
            {product.kind === "saas" && product.flagship && (
              <span className="text-[0.6rem] font-mono px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">Flagship</span>
            )}
          </div>
          <h3 className="font-semibold text-ink text-[0.95rem] leading-snug">{product.name || "Unnamed product"}</h3>
        </div>
        <span className="text-brand-orange font-semibold text-sm shrink-0">{getPrice(product)}</span>
      </div>

      {product.description && (
        <p className="text-xs text-muted leading-relaxed line-clamp-3">{product.description}</p>
      )}

      {"category" in product && product.category && (
        <span className="text-[0.65rem] text-mid font-mono">{product.category}</span>
      )}

      <div className="flex gap-2 mt-auto pt-2 border-t border-light opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="flex-1 text-xs text-mid hover:text-brand-orange py-1.5 rounded-lg border border-light hover:border-brand-orange-mid transition-colors">
          Edit
        </button>
        <button onClick={onDelete} className="flex-1 text-xs text-mid hover:text-red-500 py-1.5 rounded-lg border border-light hover:border-red-200 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function CatalogPage() {
  const { brandId, brandName, loading: brandLoading } = useBrand();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Load on mount
  useEffect(() => {
    if (brandLoading || brandId === "default") return;
    fetch(`/api/catalog?brand_id=${brandId}`)
      .then(r => r.json())
      .then(json => {
        if (json.products?.length) {
          setProducts(json.products.map(dbToProduct).filter(Boolean) as Product[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandId, brandLoading]);

  const saveCatalog = useCallback(async (list: Product[]) => {
    if (brandId === "default") return;
    setSaving(true);
    const kinds = Array.from(new Set(list.map(p => p.kind)));
    const businessTypes = kinds.map(k => k === "services" ? "service" : k === "saas" ? "saas_tier" : k);
    try {
      await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          businessTypes,
          products: list.map((p, i) => productToDb(p, brandId, i)),
          financialRules: null,
        }),
      });
    } catch (err) {
      console.error("Catalog save error:", err);
    } finally {
      setSaving(false);
    }
  }, [brandId]);

  async function handleAdd(p: Product) {
    const updated = [...products, p];
    setProducts(updated);
    setShowAdd(false);
    await saveCatalog(updated);
  }

  async function handleEdit(p: Product) {
    const updated = products.map(x => x.id === p.id ? p : x);
    setProducts(updated);
    setEditProduct(null);
    await saveCatalog(updated);
  }

  async function handleDelete(id: string) {
    const updated = products.filter(x => x.id !== id);
    setProducts(updated);
    await saveCatalog(updated);
  }

  async function handleImportAdd(imported: Product[]) {
    const updated = [...products, ...imported];
    setProducts(updated);
    await saveCatalog(updated);
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-light flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-[1.75rem] text-ink tracking-tight mb-1">Products & Services</h1>
          <p className="text-[0.78rem] text-muted">
            {brandName}&apos;s full product catalogue
            {saving && <span className="ml-2 text-brand-orange">Saving...</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-light text-mid text-[0.8rem] font-medium hover:border-brand-orange hover:text-brand-orange transition-colors"
          >
            <span>↑</span> Import from text / PDF
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-orange text-white text-[0.8rem] font-semibold hover:bg-brand-orange-hover transition-colors"
          >
            <span>+</span> Add product
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted text-sm">Loading catalogue...</div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="text-5xl mb-4">🗂</div>
            <h2 className="font-semibold text-xl text-ink mb-2">No products yet</h2>
            <p className="text-muted text-sm max-w-sm mb-8">Add your products and services manually, or paste in a price list and let AI extract them for you.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover transition-colors">
                + Add product
              </button>
              <button onClick={() => setShowImport(true)} className="px-5 py-2.5 rounded-lg border border-light text-mid text-sm font-medium hover:border-brand-orange hover:text-brand-orange transition-colors">
                Import from text / PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => setEditProduct(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
            {/* Add new card */}
            <button
              onClick={() => setShowAdd(true)}
              className="border-2 border-dashed border-light rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-brand-orange hover:bg-brand-orange-pale/20 transition-all min-h-[160px] text-muted hover:text-brand-orange"
            >
              <span className="text-2xl">+</span>
              <span className="text-sm font-medium">Add product</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && <ProductModal initial={null} onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {editProduct && <ProductModal initial={editProduct} onSave={handleEdit} onClose={() => setEditProduct(null)} />}
      {showImport && <ImportModal onAdd={handleImportAdd} onClose={() => setShowImport(false)} />}
    </div>
  );
}
