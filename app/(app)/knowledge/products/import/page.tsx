"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBrand } from "@/lib/useBrand";
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey, Vars } from "@/lib/i18n/index.ts";

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

const KIND_LABEL: Record<Kind, StringKey> = {
  physical: "import.kindPhysical", services: "import.kindService", saas: "import.kindSaas", digital: "import.kindDigital",
};
/**
 * Brand tokens, not Tailwind's default scales.
 *
 * `saas` had to move: inbox 7a names `violet`, which shadows Tailwind's own
 * violet-50..950 and would have left that pill with no colour at all — the
 * same silent failure the amber pills had. The other two moved with it
 * rather than leaving one row of this table on a different palette.
 */
const KIND_COLOR: Record<Kind, string> = {
  physical: "bg-blue-wash text-blue-ink border-blue-line",
  services: "bg-green-wash text-green-ink border-green-line",
  saas: "bg-lavender text-violet-ink border-lav-line",
  digital: "bg-amber-wash text-amber border-amber",
};
const KIND_OPTIONS: { kind: Kind; icon: string; label: StringKey; desc: StringKey }[] = [
  { kind: "physical", icon: "PHY", label: "import.optPhysical", desc: "import.optPhysicalDesc" },
  { kind: "services", icon: "SRV", label: "import.kindService", desc: "import.optServiceDesc" },
  { kind: "saas", icon: "SAS", label: "import.optSaas", desc: "import.optSaasDesc" },
  { kind: "digital", icon: "DIG", label: "import.optDigital", desc: "import.optDigitalDesc" },
];
/* Stored in catalog_products.price_model as the English, so the value stays
   English and only the option text translates. */
const PRICE_MODELS = ["Per project", "Per hour", "Retainer / monthly", "Custom quote"];
const PRICE_MODEL_KEY: Record<string, StringKey> = {
  "Per project": "import.modelPerProject", "Per hour": "import.modelPerHour",
  "Retainer / monthly": "import.modelRetainer", "Custom quote": "import.modelCustomQuote",
};

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

function getPrice(p: Product, t: (key: StringKey, vars?: Vars) => string): string {
  switch (p.kind) {
    case "physical": return p.rrp ? t("import.priceEur", { amount: p.rrp }) : "—";
    case "services": return p.price ? t("import.priceEur", { amount: p.price }) : "—";
    case "saas": return p.monthlyPrice ? t("import.priceMonthly", { amount: p.monthlyPrice }) : "—";
    case "digital": return p.price ? t("import.priceEur", { amount: p.price }) : "—";
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
  const t = useT();
  const set = (fields: Partial<Product>) => onChange({ ...product, ...fields } as Product);
  switch (product.kind) {
    case "physical": return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label={t("import.fieldProductName")} value={product.name} onChange={v => set({ name: v })} placeholder={t("import.exProductName")} /></div>
        <Field label={t("common.category")} value={product.category} onChange={v => set({ category: v })} placeholder={t("import.exProductCategory")} />
        <Field label={t("product.sku")} value={product.sku} onChange={v => set({ sku: v })} placeholder={t("import.exSku")} />
        <div className="col-span-2"><TextArea label={t("common.description")} value={product.description} onChange={v => set({ description: v })} placeholder={t("import.whatIsProduct")} rows={2} /></div>
        <Field label={t("import.fieldRrp")} value={product.rrp} onChange={v => set({ rrp: v })} placeholder="29.99" type="number" />
        <Field label={t("import.fieldWholesale")} value={product.wholesalePrice} onChange={v => set({ wholesalePrice: v })} placeholder="15.00" type="number" />
        <Field label={t("import.fieldCogs")} value={product.cogs} onChange={v => set({ cogs: v })} placeholder="8.00" type="number" />
        <Field label={t("import.fieldDeliveryTime")} value={product.deliveryTime} onChange={v => set({ deliveryTime: v })} placeholder={t("import.exLeadTime")} />
        <div className="col-span-2"><Field label={t("import.fieldCapacity")} value={product.capacityPerMonth} onChange={v => set({ capacityPerMonth: v })} placeholder={t("import.exUnits")} /></div>
      </div>
    );
    case "services": return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label={t("import.fieldServiceName")} value={product.name} onChange={v => set({ name: v })} placeholder={t("import.exServiceName")} /></div>
        <Field label={t("common.category")} value={product.category} onChange={v => set({ category: v })} placeholder={t("import.exServiceCategory")} />
        <Field label={t("import.fieldPrice")} value={product.price} onChange={v => set({ price: v })} placeholder="500" type="number" />
        <div className="col-span-2">
          <label className={lbl}>{t("import.priceModel")}</label>
          <select className={inp} value={product.priceModel} onChange={e => set({ priceModel: e.target.value })}>
            {PRICE_MODELS.map(m => <option key={m} value={m}>{t(PRICE_MODEL_KEY[m])}</option>)}
          </select>
        </div>
        <div className="col-span-2"><TextArea label={t("common.description")} value={product.description} onChange={v => set({ description: v })} placeholder={t("import.whatIsIncludedService")} rows={2} /></div>
        <Field label={t("import.fieldIdealClient")} value={product.idealClient} onChange={v => set({ idealClient: v })} placeholder={t("import.exServiceAudience")} />
        <Field label={t("import.fieldDeliveryTime")} value={product.deliveryTime} onChange={v => set({ deliveryTime: v })} placeholder={t("import.exDuration")} />
        <div className="col-span-2"><Field label={t("import.fieldIncluded")} value={product.inclusions} onChange={v => set({ inclusions: v })} placeholder={t("import.exDeliverables")} /></div>
        <div className="col-span-2"><Field label={t("import.fieldCapacity")} value={product.capacityPerMonth} onChange={v => set({ capacityPerMonth: v })} placeholder={t("import.exCapacity")} /></div>
      </div>
    );
    case "saas": return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label={t("import.fieldPlanName")} value={product.name} onChange={v => set({ name: v })} placeholder={t("import.exPlanName")} /></div>
        <Field label={t("import.fieldMonthlyPrice")} value={product.monthlyPrice} onChange={v => set({ monthlyPrice: v })} placeholder="49" type="number" />
        <div className="col-span-2"><TextArea label={t("common.description")} value={product.description} onChange={v => set({ description: v })} placeholder={t("import.whatIsIncludedPlan")} rows={2} /></div>
        <div className="col-span-2"><Field label={t("import.fieldIncluded")} value={product.inclusions} onChange={v => set({ inclusions: v })} placeholder={t("import.exPlanFeatures")} /></div>
        <label className="col-span-2 flex items-center gap-3 cursor-pointer">
          <button type="button" onClick={() => set({ flagship: !product.flagship })} className={`w-9 h-5 rounded-full transition-colors ${product.flagship ? "bg-brand-orange" : "bg-light"}`}>
            <span className={`block h-4 w-4 rounded-full bg-white shadow ml-0.5 transition-transform ${product.flagship ? "translate-x-4" : ""}`} />
          </button>
          <span className="text-sm text-ink">{t("import.markFlagship")}</span>
        </label>
      </div>
    );
    case "digital": return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label={t("import.fieldProductName")} value={product.name} onChange={v => set({ name: v })} placeholder={t("import.exDigitalName")} /></div>
        <Field label={t("common.category")} value={product.category} onChange={v => set({ category: v })} placeholder={t("import.exDigitalCategory")} />
        <Field label={t("import.fieldPrice")} value={product.price} onChange={v => set({ price: v })} placeholder="29" type="number" />
        <div className="col-span-2"><TextArea label={t("common.description")} value={product.description} onChange={v => set({ description: v })} placeholder={t("import.whatDoesCustomerGet")} rows={2} /></div>
        <div className="col-span-2"><Field label={t("import.fieldDeliveryFormat")} value={product.deliveryFormat} onChange={v => set({ deliveryFormat: v })} placeholder={t("import.exDigitalFormat")} /></div>
      </div>
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Add / Edit modal                                                   */
/* ------------------------------------------------------------------ */

function ProductModal({ initial, onSave, onClose }: { initial: Product | null; onSave: (p: Product) => void; onClose: () => void }) {
  const t = useT();
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
          <h2 className="font-semibold text-ink text-[0.95rem]">{isEdit ? t("import.editProduct") : t("products.add")}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none">×</button>
        </div>

        <div className="px-6 py-5">
          {/* Kind picker — only shown when adding new */}
          {!isEdit && (
            <div className="mb-5">
              <label className={lbl + " mb-2"}>{t("import.productType")}</label>
              <div className="grid grid-cols-2 gap-2">
                {KIND_OPTIONS.map(o => (
                  <button key={o.kind} type="button" onClick={() => { setKind(o.kind); setPickingKind(false); }}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${kind === o.kind ? "border-brand-orange bg-brand-orange-pale" : "border-light hover:border-brand-orange/40"}`}>
                    <span className="text-xl mt-0.5 shrink-0">{o.icon}</span>
                    <div>
                      <div className={`text-xs font-semibold ${kind === o.kind ? "text-brand-orange" : "text-ink"}`}>{t(o.label)}</div>
                      <div className="text-[0.65rem] text-muted leading-tight mt-0.5">{t(o.desc)}</div>
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
            {t("common.cancel")}
          </button>
          <button
            onClick={() => { if (product.name.trim()) onSave(product); }}
            disabled={!product.name.trim() || pickingKind}
            className="flex-1 py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover disabled:opacity-40 transition-colors"
          >
            {isEdit ? t("product.saveChanges") : t("import.addToCatalogue")}
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
  const t = useT();
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
      if (!res.ok) { setError(json.error || t("import.extractionFailed")); return; }
      const products = (json.products as Product[]).map(p => ({ ...p, id: uid() }));
      setPreview(products);
      setSelected(new Set(products.map(p => p.id)));
    } catch {
      setError(t("import.somethingWrong"));
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
            <h2 className="font-semibold text-ink text-[0.95rem]">{t("import.title")}</h2>
            <p className="text-xs text-muted mt-0.5">{t("import.intro")}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none ml-4 shrink-0">×</button>
        </div>

        <div className="px-6 py-5">
          {!preview ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 bg-pale rounded-lg p-1 mb-4">
                {(["text", "file"] as const).map(mode => (
                  <button key={mode} onClick={() => setTab(mode)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${tab === mode ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
                    {mode === "text" ? t("import.pasteText") : t("import.uploadPdf")}
                  </button>
                ))}
              </div>

              {tab === "text" ? (
                <textarea
                  className={inp + " resize-none w-full"}
                  rows={10}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={t("import.pastePlaceholder")}
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
                      <p className="text-sm font-medium text-ink mb-1">{t("import.drop")}</p>
                      <p className="text-xs text-muted">{t("import.dropHelp")}</p>
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
                    {t("import.extracting")}
                  </>
                ) : t("import.extractWithAi")}
              </button>
            </>
          ) : (
            <>
              {/* Preview extracted products */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-ink">{t(preview.length === 1 ? "import.foundOne" : "import.foundMany", { count: preview.length })}</p>
                <button onClick={() => setPreview(null)} className="text-xs text-muted hover:text-ink">{t("onboarding.back")}</button>
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
                        <span className="font-medium text-sm text-ink">{p.name || t("import.unnamed")}</span>
                        <span className={`text-[0.6rem] font-mono px-1.5 py-0.5 rounded border ${KIND_COLOR[p.kind]}`}>{t(KIND_LABEL[p.kind])}</span>
                        <span className="text-xs text-brand-orange font-medium">{getPrice(p, t)}</span>
                      </div>
                      {p.description && <p className="text-xs text-muted mt-0.5 line-clamp-2">{p.description}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-light text-mid text-sm hover:border-brand-orange hover:text-brand-orange transition-colors">
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => { onAdd(selectedProducts); onClose(); }}
                  disabled={selectedProducts.length === 0}
                  className="flex-1 py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover disabled:opacity-40 transition-colors"
                >
                  {selectedProducts.length > 0
                    ? t("import.addNToCatalogue", { count: selectedProducts.length })
                    : t("import.addToCatalogue")}
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
  const t = useT();
  return (
    <div className="bg-white border border-light rounded-xl p-5 flex flex-col gap-3 hover:border-brand-orange/30 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[0.6rem] font-mono font-medium px-1.5 py-0.5 rounded border ${KIND_COLOR[product.kind]}`}>
              {t(KIND_LABEL[product.kind])}
            </span>
            {product.kind === "saas" && product.flagship && (
              <span className="text-[0.6rem] font-mono px-1.5 py-0.5 rounded border bg-amber-wash text-amber border-amber">{t("import.flagship")}</span>
            )}
          </div>
          <h3 className="font-semibold text-ink text-[0.95rem] leading-snug">{product.name || t("import.unnamedProduct")}</h3>
        </div>
        <span className="text-brand-orange font-semibold text-sm shrink-0">{getPrice(product, t)}</span>
      </div>

      {product.description && (
        <p className="text-xs text-muted leading-relaxed line-clamp-3">{product.description}</p>
      )}

      {"category" in product && product.category && (
        <span className="text-[0.65rem] text-mid font-mono">{product.category}</span>
      )}

      <div className="flex gap-2 mt-auto pt-2 border-t border-light opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="flex-1 text-xs text-mid hover:text-brand-orange py-1.5 rounded-lg border border-light hover:border-brand-orange-mid transition-colors">
          {t("common.edit")}
        </button>
        <button onClick={onDelete} className="flex-1 text-xs text-mid hover:text-red-500 py-1.5 rounded-lg border border-light hover:border-red-200 transition-colors">
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function CatalogPage() {
  const t = useT();
  const { brandId, brandName, loading: brandLoading } = useBrand();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Load on mount
  useEffect(() => {
    if (brandLoading) return;
    // Resolved with no brand row — stop loading rather than leaving the flag
    // set, which the finally below would otherwise never clear.
    if (brandId === "default") {
      setLoading(false);
      return;
    }
    authedFetch(`/api/catalog?brand_id=${brandId}`)
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
    // Was a bare `return`: with no brand resolved yet, adding a product did
    // nothing at all and said nothing, which reads as "products are not
    // saving".
    if (brandId === "default") { setSaveError(t("import.noBrandYet")); return; }
    setSaving(true);
    setSaveError(null);
    const kinds = Array.from(new Set(list.map(p => p.kind)));
    const businessTypes = kinds.map(k => k === "services" ? "service" : k === "saas" ? "saas_tier" : k);
    try {
      const res = await authedFetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          businessTypes,
          products: list.map((p, i) => productToDb(p, brandId, i)),
          financialRules: null,
        }),
      });
      // fetch only rejects on a network failure, so an unchecked call reports
      // a saved catalogue over a 400 or a 403.
      if (!res.ok) {
        let detail = String(res.status);
        try { detail = (await res.json())?.error ?? detail; } catch { /* keep the status */ }
        setSaveError(t("import.saveFailed", { message: detail }));
      }
    } catch (err) {
      setSaveError(t("import.saveFailed", { message: err instanceof Error ? err.message : String(err) }));
    } finally {
      setSaving(false);
    }
  }, [brandId, t]);

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
          <h1 className="font-semibold text-[1.75rem] text-ink tracking-tight mb-1">{t("import.productsAndServices")}</h1>
          <p className="text-[0.78rem] text-muted">
            {t("import.fullCatalogue", { brandName })}
            {saving && <span className="ml-2 text-brand-orange">{t("import.saving")}</span>}
            {saveError && (
              <span className="ml-2 font-semibold text-red-600" role="alert">{saveError}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-light text-mid text-[0.8rem] font-medium hover:border-brand-orange hover:text-brand-orange transition-colors"
          >
            <span>↑</span> {t("import.fromTextOrPdf")}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-orange text-white text-[0.8rem] font-semibold hover:bg-brand-orange-hover transition-colors"
          >
            <span>+</span> {t("products.add")}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted text-sm">{t("import.loadingCatalogue")}</div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="text-5xl mb-4">🗂</div>
            <h2 className="font-semibold text-xl text-ink mb-2">{t("products.none")}</h2>
            <p className="text-muted text-sm max-w-sm mb-8">{t("products.noneHelp")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-hover transition-colors">
                {t("import.addProductPlus")}
              </button>
              <button onClick={() => setShowImport(true)} className="px-5 py-2.5 rounded-lg border border-light text-mid text-sm font-medium hover:border-brand-orange hover:text-brand-orange transition-colors">
                {t("import.fromTextOrPdf")}
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
              <span className="text-sm font-medium">{t("products.add")}</span>
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
