"use client";

/**
 * Studio ▸ Create images — rebuilt from branditect-ui/spec/create-images.md.
 *
 * The old page had three controls that did not do what they appeared to. Those
 * are fixed in the route (f82ded3); this is the panel that drives it.
 *
 * Renders inside app/(app)/layout.tsx — the sidebar and the AI Chat rail stay,
 * and the 1240px wrap is the space between them.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { liveOnly } from "@/lib/product-delete";
import { useBrand } from "@/lib/useBrand";
import Icon from "@/components/icon";
import ChatRail from "@/components/chat-rail";
import {
  briefBlocker, briefReady, defaultKind, defaultWhere, productIdFor, refsAfterKindChange,
  FORMATS, type Format, type Kind, type Where,
} from "@/lib/image-brief";
import s from "@/components/studio/create-images.module.css";

type RefSource = "knowledge" | "product" | "upload";

interface Reference {
  id: string;
  name: string;
  /** Displayable. For an upload this is an object URL. */
  url: string;
  source: RefSource;
  file?: File;
}

interface Product { id: string; name: string; category: string | null; image_url: string | null; deleted_at?: string | null }
interface LibraryImage { id: string; file_url: string; file_name: string }

type Shot =
  | { id: string; state: "working"; format: Format; refs: Reference[]; where: Where }
  | { id: string; state: "done"; format: Format; refs: Reference[]; where: Where;
      src: string; base64: string; mimeType: string; saved: boolean; subject: string; productId: string | null }
  | { id: string; state: "failed"; format: Format; refs: Reference[]; where: Where; reason: string };

const WHERE_OPTIONS: { id: Where; label: string; detail: string; icon: "target" | "box" | "cloud"; tone: string }[] = [
  { id: "studio", label: "Studio", detail: "Plain background", icon: "target", tone: "bg-grad-more" },
  { id: "indoors", label: "Indoors", detail: "A room, a shop", icon: "box", tone: "bg-grad-numbers" },
  { id: "outdoors", label: "Outdoors", detail: "Outside, daylight", icon: "cloud", tone: "bg-grad-assets" },
];

const RATIO_BOX: Record<Format, { w: number; h: number }> = {
  "1:1": { w: 22, h: 22 }, "4:5": { w: 18, h: 22 }, "9:16": { w: 13, h: 23 }, "16:9": { w: 28, h: 16 },
};

const MAX_REFS = 3;

function aspectPadding(format: Format): string {
  const [w, h] = format.split(":").map(Number);
  return `${(h / w) * 100}%`;
}

/** Downscaled before upload — the whole payload has to fit a serverless body limit. */
function resizeToBase64(blob: Blob, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h / w) * maxSize; w = maxSize; }
      else if (h > maxSize) { w = (w / h) * maxSize; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.onerror = (e) => { URL.revokeObjectURL(objectUrl); reject(e); };
    img.src = objectUrl;
  });
}

async function referenceToBase64(ref: Reference): Promise<string> {
  if (ref.file) return resizeToBase64(ref.file);
  const res = await fetch(ref.url);
  return resizeToBase64(await res.blob());
}

export default function CreateImagesPage() {
  const { brandId, loading: brandLoading } = useBrand();

  const [kind, setKind] = useState<Kind>("other");
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [refs, setRefs] = useState<Reference[]>([]);
  const [where, setWhere] = useState<Where>("outdoors");
  const [subject, setSubject] = useState("");
  const [format, setFormat] = useState<Format>("1:1");
  const [extra, setExtra] = useState("");
  const [extraOpen, setExtraOpen] = useState(false);

  const [shots, setShots] = useState<Shot[]>([]);
  const [tab, setTab] = useState<"session" | "saved">("session");
  const [savedImages, setSavedImages] = useState<LibraryImage[]>([]);
  const [library, setLibrary] = useState<LibraryImage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const product = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);

  /* ---- brand data ---- */
  useEffect(() => {
    if (brandLoading || !brandId || brandId === "default") return;
    let alive = true;
    (async () => {
      const [p, imgs] = await Promise.all([
        supabase.from("catalog_products").select("id, name, category, image_url, deleted_at").eq("brand_id", brandId).order("sort_order"),
        supabase.from("brand_images").select("id, file_url, file_name").eq("brand_id", brandId)
          .eq("category", "ai-generated").order("uploaded_at", { ascending: false }),
      ]);
      if (!alive) return;
      const rows = liveOnly((p.data as Product[]) ?? []);
      setProducts(rows);
      setSavedImages((imgs.data as LibraryImage[]) ?? []);
      // A brand with a catalogue is usually photographing it.
      setKind(defaultKind(rows.length));
    })();
    return () => { alive = false; };
  }, [brandId, brandLoading]);

  const flash = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1900);
  }, []);

  /* ---- references ---- */
  const addRef = useCallback((next: Reference) => {
    setRefs((prev) => (prev.length >= MAX_REFS || prev.some((r) => r.id === next.id) ? prev : [...prev, next]));
  }, []);

  const removeRef = useCallback((id: string) => {
    setRefs((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /* Selecting a product adds its photo as a reference and marks it. */
  const chooseProduct = useCallback((id: string) => {
    setProductId(id);
    setWhere("studio");
    const p = products.find((x) => x.id === id);
    setRefs((prev) => {
      const mine = prev.filter((r) => r.source !== "product");
      if (!p?.image_url) return mine;
      return [{ id: `product:${p.id}`, name: `${p.name} · product`, url: p.image_url, source: "product" as const },
              ...mine].slice(0, MAX_REFS);
    });
  }, [products]);

  /**
   * Switching to Something else removes the product's photos. Leaving them
   * behind is how you generate a bottle nobody asked for. References the user
   * added themselves stay.
   */
  const chooseKind = useCallback((next: Kind) => {
    setKind(next);
    if (next === "other") {
      setProductId("");
      setRefs((prev) => refsAfterKindChange(prev, next));
      setWhere(defaultWhere(next));
    } else if (products.length && !productId) {
      chooseProduct(products[0].id);
    }
  }, [products, productId, chooseProduct]);

  const openLibrary = useCallback(async () => {
    if (!brandId || brandId === "default") return;
    const { data } = await supabase.from("brand_images").select("id, file_url, file_name")
      .eq("brand_id", brandId).order("uploaded_at", { ascending: false }).limit(60);
    setLibrary((data as LibraryImage[]) ?? []);
  }, [brandId]);

  const onUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addRef({ id: `upload:${Date.now()}`, name: file.name, url: URL.createObjectURL(file), source: "upload", file });
    e.target.value = "";
  }, [addRef]);

  /* ---- generate ---- */
  const blocker = briefBlocker(refs.length, subject);

  const generate = useCallback(async () => {
    if (blocker || busy) return;
    setBusy(true);
    const id = `shot-${Date.now()}`;
    const snapshot = { format, refs: [...refs], where };
    // Newest first, and previous results stay — comparing two attempts is the
    // point. The old page held one result and overwrote it.
    setShots((prev) => [{ id, state: "working", ...snapshot }, ...prev]);

    try {
      const images = await Promise.all(refs.map(async (r) => ({ data: await referenceToBase64(r), mimeType: "image/jpeg" })));
      const res = await fetch("/api/brand/generate-from-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          images,
          brief: { subject: subject.trim(), where, format, productId: productIdFor(kind, productId), extra: extra.trim() || undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        // The brief is untouched on a failure.
        setShots((prev) => prev.map((sh) => sh.id === id
          ? { ...snapshot, id, state: "failed", reason: data.message || "That didn't work." } : sh));
        return;
      }
      setShots((prev) => prev.map((sh) => sh.id === id ? {
        ...snapshot, id, state: "done", saved: false, subject: subject.trim(),
        productId: productIdFor(kind, productId),
        base64: data.imageBase64, mimeType: data.mimeType || "image/png",
        src: `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`,
      } : sh));
    } catch (err) {
      const reason = err instanceof Error ? err.message : "That didn't work.";
      setShots((prev) => prev.map((sh) => sh.id === id ? { ...snapshot, id, state: "failed", reason } : sh));
    } finally {
      setBusy(false);
    }
  }, [blocker, busy, refs, format, where, subject, extra, kind, productId, brandId]);

  /* Saved images become reference material for the next round, which is how a
     brand's look compounds instead of drifting. */
  const save = useCallback(async (shot: Shot) => {
    if (shot.state !== "done" || !brandId || brandId === "default") return;
    try {
      const bytes = Uint8Array.from(atob(shot.base64), (c) => c.charCodeAt(0));
      const fileName = `created-${Date.now()}.png`;
      const path = `${brandId}/${fileName}`;
      const { error: upErr } = await supabase.storage.from("brand-images")
        .upload(path, new Blob([bytes], { type: shot.mimeType }), { upsert: true });
      if (upErr) { flash(`Not saved — ${upErr.message}`); return; }

      const { data: urlData } = supabase.storage.from("brand-images").getPublicUrl(path);
      const { error } = await supabase.from("brand_images").insert({
        brand_id: brandId,
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: bytes.length,
        category: "ai-generated",
        format: shot.format === "1:1" ? "square" : shot.format === "9:16" ? "story" : shot.format === "16:9" ? "landscape" : "portrait",
        campaign_name: "",
        tags: ["created"],
        // The brief, the product and the references it was made from.
        meta: {
          subject: shot.subject, where: shot.where, format: shot.format,
          productId: shot.productId, referenceIds: shot.refs.map((r) => r.id),
        },
      });
      // supabase-js resolves {data, error} and never throws.
      if (error) { flash(`Not saved — ${error.message}`); return; }

      setShots((prev) => prev.map((x) => x.id === shot.id && x.state === "done" ? { ...x, saved: true } : x));
      setSavedImages((prev) => [{ id: path, file_url: urlData.publicUrl, file_name: fileName }, ...prev]);
      flash("Saved to Knowledge ▸ Images");
    } catch (err) {
      flash(err instanceof Error ? `Not saved — ${err.message}` : "Not saved");
    }
  }, [brandId, flash]);

  const download = useCallback((shot: Shot) => {
    if (shot.state !== "done") return;
    const a = document.createElement("a");
    a.href = shot.src;
    a.download = `created-${shot.id}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  }, []);

  const examples = useMemo(() => [
    product ? `${product.name} on a silver background` : "This product on a silver background",
    "A girl running outside wearing a yellow dress",
    "A man on a construction site looking up at the sky",
    "The bottle on a kitchen counter in morning light",
  ], [product]);

  return (
    <div className="flex items-start gap-3 stack:flex-col">
      <div className="min-w-0 flex-1">
        <div className={s.wrap}>
          <div className={s.phead}>
            <div>
              <div className={s.eyebrow}>Studio</div>
              <h1>Create images</h1>
              <p>
                Pick something that already looks right, say what you want to see, and get a new
                image shot in the same light.
              </p>
            </div>
            {savedImages.length > 0 && (
              <span className={s.hcount}><b>{savedImages.length}</b>&nbsp;saved</span>
            )}
          </div>

          <div className={s.panes}>
            {/* ══════════ BRIEF ══════════ */}
            <div className={s.brief}>
              {/* 1 · an explicit either/or */}
              <div className={s.step}>
                <div className={s.slab}><span className={s.snum}>1</span><h3>What are you making?</h3></div>
                <div className={s.kind}>
                  <button type="button" className={`${s.kd} ${kind === "product" ? s.on : ""}`}
                    aria-pressed={kind === "product"} onClick={() => chooseKind("product")}>
                    <Icon name="bag" size={19} />
                    <span className={s.kl}>A product picture</span>
                    <span className={s.kdd}>Something from your catalogue</span>
                  </button>
                  <button type="button" className={`${s.kd} ${kind === "other" ? s.on : ""}`}
                    aria-pressed={kind === "other"} onClick={() => chooseKind("other")}>
                    <Icon name="img" size={19} />
                    <span className={s.kl}>Something else</span>
                    <span className={s.kdd}>People, places, moods</span>
                  </button>
                </div>

                {kind === "product" && (
                  <div className={s.pwrap}>
                    {products.length === 0 ? (
                      <p className={s.pnote}>No products yet. Add one in Knowledge ▸ Products, or pick Something else.</p>
                    ) : (
                      <>
                        <label className={s.psel}>
                          <span className="sr-only">Which product?</span>
                          <select value={productId} onChange={(e) => chooseProduct(e.target.value)} aria-label="Which product?">
                            <option value="">Pick a product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}{p.category ? ` — ${p.category}` : ""}</option>
                            ))}
                          </select>
                          <span className={s.pcar}><Icon name="chevronRight" size={15} /></span>
                        </label>
                        {product && (
                          <p className={s.pnote}>
                            <b>
                              {product.image_url
                                ? "1 product photo added as reference below."
                                : "No product photo on file, so nothing was added below."}
                            </b>{" "}
                            The label, shape and colour are kept exact, and &ldquo;this product&rdquo; in
                            your description means this one.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 2 · references */}
              <div className={s.step}>
                <div className={s.slab}>
                  <span className={s.snum}>2</span><h3>Pick your reference pictures</h3>
                  <span className={s.req}>Needed</span>
                </div>
                <p className={s.shint}>
                  Choose pictures that show what you are after. Up to three, and all of them are read.
                </p>
                <div className={s.refs}>
                  {refs.map((r) => (
                    <div key={r.id} className={`${s.ref} ${r.source === "product" ? s.fromprod : ""}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url} alt={r.name} />
                      <button type="button" className={s.rm} aria-label={`Remove ${r.name}`} onClick={() => removeRef(r.id)}>
                        <Icon name="close" size={9} />
                      </button>
                      <span className={s.tagn}>{r.name}</span>
                    </div>
                  ))}
                  {refs.length < MAX_REFS && (
                    <>
                      <button type="button" className={s.addref} onClick={() => void openLibrary()}>
                        <Icon name="img" size={17} />
                        <span>From<br />Knowledge</span>
                      </button>
                      {refs.length < MAX_REFS - 1 && (
                        <button type="button" className={s.addref} onClick={() => fileRef.current?.click()}>
                          <Icon name="upload" size={17} />
                          <span>Upload</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
              </div>

              {/* 3 · where */}
              <div className={s.step}>
                <div className={s.slab}><span className={s.snum}>3</span><h3>Where is it?</h3></div>
                <p className={s.shint}>This is the one thing a picture cannot tell us on its own.</p>
                <div className={s.wheres}>
                  {WHERE_OPTIONS.map((w) => (
                    <button key={w.id} type="button" className={`${s.wh} ${where === w.id ? s.on : ""}`}
                      aria-pressed={where === w.id} onClick={() => setWhere(w.id)}>
                      <span className={`${s.wi} ${w.tone}`}>
                        <Icon name={w.icon} size={17} />
                      </span>
                      <span className={s.wl}>{w.label}</span>
                      <span className={s.wd}>{w.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 · subject */}
              <div className={s.step}>
                <div className={s.slab}>
                  <span className={s.snum}>4</span><h3>What do you want to see?</h3>
                  <span className={s.req}>Needed</span>
                </div>
                <p className={s.shint}>Say it plainly, the way you would to a photographer.</p>
                <textarea className={s.brf} value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="One sentence is enough." aria-label="What do you want to see?" />
                <div className={s.exs}>
                  {examples.map((e) => (
                    <button key={e} type="button" className={s.ex} onClick={() => setSubject(e)}>{e}</button>
                  ))}
                </div>
              </div>

              {/* 5 · shape */}
              <div className={s.step}>
                <div className={s.slab}><span className={s.snum}>5</span><h3>Shape</h3></div>
                <div className={s.ratios}>
                  {FORMATS.map((f) => (
                    <button key={f} type="button" className={`${s.rt} ${format === f ? s.on : ""}`}
                      aria-pressed={format === f} onClick={() => setFormat(f)}>
                      <span className={s.box} style={{ width: RATIO_BOX[f].w, height: RATIO_BOX[f].h }} />
                      <span className={s.lb}>{f}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className={s.moreBtn} onClick={() => setExtraOpen((v) => !v)}>
                  <Icon name="chevronRight" size={11} />
                  Anything else — props, angle, space for text
                </button>
                {extraOpen && (
                  <textarea className={s.brf} style={{ minHeight: 62, marginTop: 8 }} value={extra}
                    onChange={(e) => setExtra(e.target.value)} aria-label="Anything else" />
                )}
              </div>

              <button type="button" className={s.go} disabled={Boolean(blocker) || busy} onClick={() => void generate()}>
                {busy ? "Making it…" : "Make the image"}
              </button>
              <p className={s.gowhy}>{blocker ?? briefReady(refs.length)}</p>
            </div>

            {/* ══════════ CANVAS ══════════ */}
            <div className={s.canvas}>
              <div className={s.ctop}>
                <div>
                  <h2>{tab === "session" ? "This session" : "Saved"}</h2>
                  <div className={s.csub}>
                    {tab === "session" ? "Nothing is kept unless you save it" : "In Knowledge ▸ Images"}
                  </div>
                </div>
                <div className={s.seg} role="group" aria-label="Which images">
                  <button type="button" className={tab === "session" ? s.on : undefined} onClick={() => setTab("session")}>Session</button>
                  <button type="button" className={tab === "saved" ? s.on : undefined} onClick={() => setTab("saved")}>Saved</button>
                </div>
              </div>

              {tab === "session" ? (
                shots.length === 0 ? (
                  <div className={s.empty}>
                    <span className={s.emptyIc}><Icon name="img" size={26} /></span>
                    <h3>Nothing made yet.</h3>
                    <p>Pick a reference picture and say what you want to see. The first one takes about fifteen seconds.</p>
                  </div>
                ) : (
                  <div className={s.grid}>
                    {shots.map((shot) => (
                      <article key={shot.id} className={`${s.shot} ${shot.state === "failed" ? s.failed : ""}`}>
                        <div className={s.shotImg}>
                          {shot.state === "done" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={shot.src} alt={shot.subject} />
                          ) : (
                            <div className={shot.state === "working" ? s.working : undefined}
                              style={{ paddingTop: aspectPadding(shot.format) }} />
                          )}
                          <span className={s.badge}>{shot.format}</span>
                        </div>
                        <div className={s.shotBody}>
                          <div className={s.prov}>
                            {shot.refs.slice(0, 3).map((r) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={r.id} className={s.th} src={r.url} alt="" />
                            ))}
                            <span>
                              {shot.refs.length} reference{shot.refs.length === 1 ? "" : "s"} · {shot.where}
                            </span>
                          </div>

                          {shot.state === "working" && (
                            <p className={s.wstat}><i />Matching the light and grade from your references…</p>
                          )}
                          {shot.state === "failed" && (
                            <>
                              <p className={s.failMsg}>{shot.reason}</p>
                              <div className={s.acts} style={{ marginTop: 9, gridTemplateColumns: "1fr" }}>
                                <button type="button" className={s.act} disabled={busy} onClick={() => void generate()}>
                                  <Icon name="repeat" size={12} />Retry
                                </button>
                              </div>
                            </>
                          )}
                          {shot.state === "done" && (
                            <div className={s.acts}>
                              <button type="button" className={`${s.act} ${shot.saved ? s.done : s.prime}`}
                                disabled={shot.saved} onClick={() => void save(shot)}>
                                <Icon name={shot.saved ? "check" : "upload"} size={12} />
                                {shot.saved ? "Saved" : "Save"}
                              </button>
                              <button type="button" className={s.act} onClick={() => download(shot)}>
                                <Icon name="upload" size={12} />Get
                              </button>
                              <button type="button" className={s.act} disabled={busy} onClick={() => void generate()}>
                                <Icon name="repeat" size={12} />Again
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : savedImages.length === 0 ? (
                <div className={s.empty}>
                  <span className={s.emptyIc}><Icon name="img" size={26} /></span>
                  <h3>Nothing saved yet.</h3>
                  <p>Saved images go to Knowledge ▸ Images, and can be used as references next time.</p>
                </div>
              ) : (
                <div className={s.grid}>
                  {savedImages.map((img) => (
                    <article key={img.id} className={s.shot}>
                      <div className={s.shotImg}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.file_url} alt={img.file_name} />
                      </div>
                      <div className={s.shotBody}>
                        <div className={s.acts} style={{ gridTemplateColumns: "1fr" }}>
                          <button type="button" className={s.act}
                            onClick={() => addRef({ id: `knowledge:${img.id}`, name: img.file_name, url: img.file_url, source: "knowledge" })}>
                            <Icon name="plus" size={12} />Use as reference
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {library && (
            <div className={s.sheet} role="dialog" aria-label="Pick from Knowledge" onClick={() => setLibrary(null)}>
              <div className={s.sheetBox} onClick={(e) => e.stopPropagation()}>
                <div className={s.sheetTop}>
                  <h3>From Knowledge ▸ Images</h3>
                  <button type="button" className={s.act} style={{ marginLeft: "auto", width: "auto", padding: "7px 12px" }}
                    onClick={() => setLibrary(null)}>
                    <Icon name="close" size={12} />Close
                  </button>
                </div>
                {library.length === 0 ? (
                  <p style={{ padding: "22px 18px" }} className={s.csub}>No images in Knowledge yet.</p>
                ) : (
                  <div className={s.sheetGrid}>
                    {library.map((img) => (
                      <button key={img.id} type="button" className={s.pick}
                        onClick={() => {
                          addRef({ id: `knowledge:${img.id}`, name: img.file_name, url: img.file_url, source: "knowledge" });
                          setLibrary(null);
                        }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.file_url} alt={img.file_name} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`${s.toast} ${toast ? s.toastOn : ""}`} role="status" aria-live="polite">{toast}</div>
        </div>
      </div>

      <ChatRail
        indexedFileCount={savedImages.length}
        suggestions={[
          "What does our photography look like?",
          "Which product should I photograph next?",
          "What colours should a new image use?",
        ]}
      />
    </div>
  );
}
