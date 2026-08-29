"use client";

/**
 * Visual brand identity — rebuilt from branditect-ui/spec/visual-identity.md.
 *
 * The five tabs (logos | colors | typography | brandbook | package) are gone.
 * Tabs made sense when each was a list; they stop making sense when the answer
 * to "which file do I use" lives in a different tab from the files.
 *
 * Renders inside app/(app)/layout.tsx — the sidebar stays, the AI Chat rail
 * stays, and the 1240px wrap is the space between them.
 *
 * Download is the only action on an asset. The kit link in §8 is the one way
 * anything leaves this system, and it is not built yet, so there is no second
 * action and no per-asset URL to copy.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";
import Icon from "@/components/icon";
import ChatRail from "@/components/chat-rail";
import { contrastOnWhite, readableInkOn } from "@/lib/contrast";
import { SLOTS, USE_CASES, canonicalSlot, formatOf } from "@/lib/logo-slots";
import s from "@/components/visual-identity/visual-identity.module.css";

/* ------------------------------------------------------------------ */
/*  Rows. Optional fields are the columns supabase/visual-identity.sql */
/*  adds — the page works before and after that migration runs.        */
/* ------------------------------------------------------------------ */

interface LogoRow {
  id: string | number;
  slot: string | null;
  file_url: string | null;
  file_name: string | null;
  format?: string | null;
}
interface ColorRow {
  id: string | number;
  hex: string | null;
  name: string | null;
  role?: string | null;
  grouping?: string | null;
  css_value?: string | null;
}
interface FontRow {
  id: string | number;
  name: string | null;
  role: string | null;
  google_font_url: string | null;
  file_url: string | null;
  weights_in_use?: number[] | null;
}
interface TemplateRow {
  id: string;
  name: string | null;
  platform: string | null;
  url: string | null;
  thumbnail_url: string | null;
}
interface VisualRow {
  guideline_url: string | null;
  updated_at: string | null;
  version?: string | null;
  assets_updated_at?: string | null;
}

const WEIGHT_LADDER = [300, 400, 500, 600, 700, 800];
const PANGRAM = "Sphinx of black quartz, judge my vow";

/** "INSTAGRAM POST 1:1" → "1:1". No ratio column exists, and a wrong badge is
 *  worse than none. */
function ratioOf(name: string | null): string | null {
  const m = (name ?? "").match(/(\d{1,2}\s*:\s*\d{1,2})/);
  return m ? m[1].replace(/\s+/g, "") : null;
}

function familyFor(font: FontRow): string {
  return `"${(font.name ?? "").replace(/"/g, "")}", system-ui, sans-serif`;
}

function cssSnippetFor(font: FontRow): string {
  const family = (font.name ?? "").replace(/"/g, "");
  if (font.google_font_url) {
    return `@import url("${font.google_font_url}");\n\nfont-family: "${family}", sans-serif;`;
  }
  if (font.file_url) {
    return `@font-face {\n  font-family: "${family}";\n  src: url("${font.file_url}");\n}\n\nfont-family: "${family}", sans-serif;`;
  }
  return `font-family: "${family}", sans-serif;`;
}

export default function VisualIdentityPage() {
  const { brandId, brandName, loading: brandLoading } = useBrand();

  const [logos, setLogos] = useState<LogoRow[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [fonts, setFonts] = useState<FontRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [visual, setVisual] = useState<VisualRow | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (brandLoading) return;
    if (!brandId || brandId === "default") { setLoading(false); return; }
    let alive = true;

    (async () => {
      // `select("*")` is fine here and only here: this route is authenticated
      // and reads the signed-in brand's own rows. The explicit column allowlist
      // the spec requires belongs to the unauthenticated /k route.
      const [l, c, f, t, v, p] = await Promise.all([
        supabase.from("brand_logos").select("*").eq("brand_id", brandId).order("created_at"),
        supabase.from("brand_book_colors").select("*").eq("brand_id", brandId).order("created_at"),
        supabase.from("brand_fonts").select("*").eq("brand_id", brandId).order("created_at"),
        supabase.from("brand_templates").select("*").eq("brand_id", brandId).order("created_at"),
        supabase.from("brand_visual").select("*").eq("brand_id", brandId).maybeSingle(),
        supabase.from("brand_book_pages").select("*", { count: "exact", head: true }).eq("brand_id", brandId),
      ]);
      if (!alive) return;

      setLogos((l.data as LogoRow[]) ?? []);
      setColors((c.data as ColorRow[]) ?? []);
      setFonts((f.data as FontRow[]) ?? []);
      setTemplates((t.data as TemplateRow[]) ?? []);
      setVisual((v.data as VisualRow) ?? null);
      setPageCount(p.count ?? 0);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [brandId, brandLoading]);

  /* The specimen must render in the actual font. A specimen set in the wrong
     typeface is worse than no specimen. */
  useEffect(() => {
    const added: HTMLElement[] = [];
    for (const font of fonts) {
      if (font.google_font_url) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = font.google_font_url;
        document.head.appendChild(link);
        added.push(link);
      } else if (font.file_url && font.name) {
        const style = document.createElement("style");
        style.textContent = `@font-face{font-family:"${font.name.replace(/"/g, "")}";src:url("${font.file_url}");font-display:swap;}`;
        document.head.appendChild(style);
        added.push(style);
      }
    }
    return () => { added.forEach((el) => el.remove()); };
  }, [fonts]);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1900);
  }, []);

  const copy = useCallback((value: string, message: string) => {
    navigator.clipboard?.writeText(value).then(
      () => flash(message),
      () => flash("Couldn't copy — select it instead"),
    );
  }, [flash]);

  /** Files are on public storage URLs; `download` asks the browser to save. */
  const download = useCallback((url: string | null, fileName: string | null) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? "";
    a.rel = "noopener";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  /* Grouped by slot. A logo with SVG + PNG is two rows sharing a slot. */
  const bySlot = useMemo(() => {
    const map = new Map<string, LogoRow[]>();
    for (const row of logos) {
      const slot = canonicalSlot(row.slot);
      if (!slot || !row.file_url) continue;
      map.set(slot, [...(map.get(slot) ?? []), row]);
    }
    return map;
  }, [logos]);

  const otherFiles = useMemo(
    () => logos.filter((r) => r.file_url && !canonicalSlot(r.slot)),
    [logos],
  );

  const heroLogo = useMemo(
    () => bySlot.get("primary")?.[0] ?? bySlot.get("icon")?.[0] ?? bySlot.get("dark")?.[0] ?? null,
    [bySlot],
  );

  const core = colors.filter((c) => (c.grouping ?? "core") !== "gradient");
  const gradients = colors.filter((c) => (c.grouping ?? "core") === "gradient");

  const fileCount = logos.filter((l) => l.file_url).length;
  const version = visual?.version ?? "v1.0";
  const updated = visual?.assets_updated_at ?? visual?.updated_at ?? null;

  if (!brandLoading && (!brandId || brandId === "default")) {
    return (
      <div className={s.wrap}>
        <div className={s.sec}>
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>No brand yet.</h2>
          <p style={{ marginTop: 8 }} className={s.emptyNote}>
            Your logos, colours and typefaces appear here once a brand is set up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 stack:flex-col">
      <div className="min-w-0 flex-1">
        <div className={s.wrap}>
          {/* ══════════ HERO ══════════ */}
          <div className={s.hero}>
            <span className={s.rings} aria-hidden="true"><i /><i /><i /></span>
            <div>
              <span className={s.badge}>
                <Icon name="spark" size={13} />
                Brand · Visual identity
              </span>
              <h1>Visual brand identity</h1>
              <p className={s.lede}>
                Every logo, colour and typeface, in the versions that are actually current.{" "}
                <b>Take what you need — you don&rsquo;t have to ask anyone.</b>
              </p>
            </div>
            <div className={s.glass}>
              <div className={s.stats}>
                <div>
                  <div className={s.statN}>{loading ? "—" : fileCount}</div>
                  <div className={s.statK}>Files</div>
                </div>
                <div>
                  <div className={s.statN}>{version}</div>
                  <div className={s.statK}>Current</div>
                </div>
              </div>
              <div className={s.vrow}>
                <i />
                {updated
                  ? `Updated ${new Date(updated).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · everything here is the live version`
                  : "Everything here is the live version"}
              </div>
            </div>
          </div>

          {/* ══════════ 1 · WHICH ONE DO I USE ══════════ */}
          {/* A card whose slot has no file is not rendered — never a card that
              answers a question with nothing. */}
          {USE_CASES.some((u) => bySlot.has(u.slot)) && (
            <section className={s.sec}>
              <div className={s.shead}>
                <div>
                  <div className={s.eyebrow}>Start here</div>
                  <h2 style={{ marginTop: 5 }}>Which one do I use?</h2>
                  <p>
                    Files named &ldquo;primary&rdquo; and &ldquo;symbol only&rdquo; are a filing
                    cabinet. This is the same set, sorted by the question people actually arrive with.
                  </p>
                </div>
              </div>
              <div className={s.use}>
                {USE_CASES.filter((u) => bySlot.has(u.slot)).map((u) => {
                  const files = bySlot.get(u.slot)!;
                  const fmts = files.map((f) => formatOf(f.file_name, f.format)).filter(Boolean);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`${s.uc} ${s[u.tone]}`}
                      onClick={() => download(files[0].file_url, files[0].file_name)}
                    >
                      <div className={s.ucq}>{u.question}</div>
                      <div className={s.ucans}>
                        <div className={s.ucfile}>{u.answer}</div>
                        <div className={s.ucfmt}>{fmts.length ? fmts.join(" · ") : u.note}</div>
                        <span className={s.go}>Download<Icon name="upload" size={12} /></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ══════════ 2 · LOGOS ══════════ */}
          {bySlot.size > 0 && (
            <section className={s.sec}>
              <div className={s.shead}>
                <div>
                  <h2>Logos</h2>
                  <p>
                    Each plate is fixed to its slot, so you can see whether a reversed file actually
                    works before you use it. Download the one you need.
                  </p>
                </div>
              </div>
              <div className={s.logos}>
                {SLOTS.filter((def) => bySlot.has(def.slot)).map((def) => {
                  const files = bySlot.get(def.slot)!;
                  const first = files[0];
                  return (
                    <div key={def.slot} className={s.lc}>
                      <div className={s.lcTop}>
                        <div className={s.lcT}>{def.label}</div>
                        <div className={s.lcU}>{def.usage}</div>
                      </div>
                      <div className={`${s.plate} ${s[def.plate]}`}>
                        <span className={s.tag}>{def.tag}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={first.file_url!} alt={`${def.label} for ${brandName}`} />
                      </div>
                      <div className={s.lcBot}>
                        <div className={s.fmts}>
                          {files.map((f) => {
                            const fmt = formatOf(f.file_name, f.format);
                            return fmt ? <span key={String(f.id)} className={s.fmtChip}>{fmt}</span> : null;
                          })}
                        </div>
                        <div className={s.acts}>
                          <button
                            type="button"
                            className={`${s.act} ${s.prime}`}
                            onClick={() => download(first.file_url, first.file_name)}
                          >
                            <Icon name="upload" size={12} />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {otherFiles.length > 0 && (
                <>
                  <div className={s.cglab} style={{ marginTop: 18 }}>All files</div>
                  <div className={s.fmts}>
                    {otherFiles.map((f) => (
                      <button
                        key={String(f.id)}
                        type="button"
                        className={s.act}
                        style={{ width: "auto", padding: "7px 12px" }}
                        onClick={() => download(f.file_url, f.file_name)}
                      >
                        <Icon name="upload" size={12} />
                        {f.file_name ?? f.slot ?? "File"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ══════════ 3 · COLOUR ══════════ */}
          {colors.length > 0 && (
            <section className={s.sec}>
              <div className={s.shead}>
                <div>
                  <h2>Colour</h2>
                  <p>
                    Every swatch copies. The contrast badge is measured against white at render, so
                    it cannot go stale — it is the difference between a colour you can set text in
                    and one you can only fill a shape with.
                  </p>
                </div>
              </div>

              {[
                { key: "core", label: "Core", rows: core },
                { key: "gradient", label: "Gradients", rows: gradients },
              ]
                .filter((g) => g.rows.length > 0)
                .map((group) => (
                  <div key={group.key} className={s.cgroup}>
                    <div className={s.cglab}>{group.label}</div>
                    <div className={s.sw}>
                      {group.rows.map((c) => {
                        const isGradient = group.key === "gradient";
                        const value = isGradient ? (c.css_value ?? c.hex ?? "") : (c.hex ?? "");
                        const contrast = isGradient ? null : contrastOnWhite(value);
                        return (
                          <button
                            key={String(c.id)}
                            type="button"
                            className={s.swatch}
                            onClick={() => copy(value, isGradient ? "CSS copied" : `${value} copied`)}
                          >
                            <span
                              className={s.chip}
                              style={
                                isGradient
                                  ? { backgroundImage: value }
                                  : { backgroundColor: value }
                              }
                            >
                              <span
                                className={s.cta}
                                style={{ color: isGradient ? "#fff" : readableInkOn(value) === "#15151b" ? "#fff" : "#fff" }}
                              >
                                {isGradient ? "Copy CSS" : "Copy HEX"}
                              </span>
                            </span>
                            <span className={s.meta}>
                              <span className={s.nm}>{c.name || "Untitled"}</span>
                              <span className={s.hx}>{value.toUpperCase()}</span>
                              {c.role && <span className={s.roleT}>{c.role}</span>}
                              {contrast && (
                                <span
                                  className={`${s.ok} ${contrast.level === "AAA" || contrast.level === "AA" ? s.pass : s.warn}`}
                                >
                                  {contrast.ratio}:1 · {contrast.label}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </section>
          )}

          {/* ══════════ 4 · TYPEFACES ══════════ */}
          {fonts.length > 0 && (
            <section className={s.sec}>
              <div className={s.shead}>
                <div>
                  <h2>Typefaces</h2>
                  <p>Each specimen is set in the real typeface. Copy the CSS and it will be too.</p>
                </div>
              </div>
              <div className={s.type}>
                {fonts.map((font, i) => {
                  const inUse = font.weights_in_use ?? [];
                  const snippet = cssSnippetFor(font);
                  return (
                    <div key={String(font.id)} className={s.tc}>
                      <div className={`${s.spec} ${i % 2 === 0 ? s.specA : s.specB}`}>
                        <div className={s.ag} style={{ fontFamily: familyFor(font) }}>Ag</div>
                        <div className={s.pang} style={{ fontFamily: familyFor(font) }}>{PANGRAM}</div>
                      </div>
                      <div className={s.tbody}>
                        <h3>{font.name || "Untitled"}</h3>
                        {font.role && <div className={s.roleLab}>{font.role}</div>}
                        <div className={s.wts}>
                          {WEIGHT_LADDER.map((w) => (
                            <span key={w} className={`${s.wt} ${inUse.includes(w) ? s.wtOn : ""}`}>{w}</span>
                          ))}
                        </div>
                        <pre className={s.code}>{snippet}</pre>
                        <div className={s.trow}>
                          <button type="button" className={`${s.act} ${s.prime}`} onClick={() => copy(snippet, "CSS copied")}>
                            <Icon name="doc" size={12} />
                            Copy CSS
                          </button>
                          {font.file_url && (
                            <button type="button" className={s.act} onClick={() => download(font.file_url, font.name)}>
                              <Icon name="upload" size={12} />
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ══════════ 5 · TEMPLATES ══════════ */}
          {templates.length > 0 && (
            <section className={s.sec}>
              <div className={s.shead}>
                <div>
                  <h2>Templates</h2>
                  <p>Sized and set up already. Open one and replace the words.</p>
                </div>
              </div>
              <div className={s.tpl}>
                {templates.map((t) => {
                  const ratio = ratioOf(t.name);
                  return (
                    <a key={t.id} href={t.url ?? "#"} target="_blank" rel="noopener noreferrer" className={s.tpc}>
                      <span className={s.thumb}>
                        {t.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.thumbnail_url} alt="" />
                        ) : (
                          <Icon name="img" size={24} />
                        )}
                        {ratio && <span className={s.ratio}>{ratio}</span>}
                      </span>
                      <span className={s.tb}>
                        <span className={s.tn}>{t.name || "Template"}</span>
                        <span className={s.td}>{t.platform ? `Opens in ${t.platform}` : "Opens in a new tab"}</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* ══════════ 6 · HOW TO HOLD IT ══════════ */}
          {/* Rendered with CSS transforms on the real logo, not stock
              illustrations. These normally live on page 34 of a PDF nobody
              opens; inline, they become enforceable. */}
          {heroLogo?.file_url && (
            <section className={s.sec}>
              <div className={s.shead}>
                <div>
                  <h2>How to hold it</h2>
                  <p>
                    The four things that go wrong most often. They live here rather than on page 34
                    of a PDF, because a rule nobody reads is not a rule.
                  </p>
                </div>
              </div>
              <div className={s.rules}>
                <div>
                  <div className={s.rbox}>
                    <h4>Clear space</h4>
                    <p>Keep the height of the symbol free on every side. Nothing crosses it — no text, no edge, no other logo.</p>
                    <div className={s.clearspace}>
                      <div className={s.csbox}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={heroLogo.file_url} alt="" style={{ maxHeight: 34, maxWidth: 150, objectFit: "contain" }} />
                      </div>
                    </div>
                  </div>
                  <div className={s.rbox} style={{ marginTop: 12 }}>
                    <h4>Minimum size</h4>
                    <p>Below these, switch to the symbol on its own.</p>
                    <div className={s.minsize}>
                      <div className={s.ms}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={heroLogo.file_url} alt="" style={{ height: 22, maxWidth: 120, objectFit: "contain" }} />
                        <span className={s.msLab}>120px / 32mm</span>
                      </div>
                      <div className={s.ms}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={(bySlot.get("icon")?.[0] ?? heroLogo).file_url!} alt="" style={{ height: 14, maxWidth: 40, objectFit: "contain" }} />
                        <span className={s.msLab}>24px / 8mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className={s.cglab}>Never</div>
                  <div className={s.donts}>
                    {[
                      { cls: s.sq, title: "Don't stretch it", sub: "Scale both sides together, always", busy: false },
                      { cls: s.rc, title: "Don't recolour it", sub: "The brand colours. Nothing else.", busy: false },
                      { cls: s.sh, title: "Don't add effects", sub: "No shadows, glows, bevels or outlines", busy: false },
                      { cls: "", title: "Don't fight the background", sub: "Busy photo? Use the reversed file on a solid block.", busy: true },
                    ].map((d) => (
                      <div key={d.title} className={s.dont}>
                        <div className={`${s.dstage} ${d.busy ? s.busy : ""}`}>
                          <span className={s.x}><Icon name="close" size={9} /></span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={heroLogo.file_url!} alt="" className={d.cls || undefined} />
                        </div>
                        <div className={s.cap}>
                          {d.title}
                          <span>{d.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ══════════ 7 · THE GUIDELINES PDF ══════════ */}
          {visual?.guideline_url && (
            <div className={s.guide}>
              <div className={s.cov}><div className={s.covL}>Brand<br />Guidelines</div></div>
              <div className="min-w-0">
                <h3>The full guidelines</h3>
                <p>
                  Everything above, plus photography direction, tone of voice, iconography and the
                  print specifications. Read it once; come back to this page for the day-to-day.
                </p>
                <div className={s.gmeta}>
                  {pageCount > 0 && <span className={s.gpill}>{pageCount} pages</span>}
                  <span className={s.gpill}>{version}</span>
                  {updated && (
                    <span className={s.gpill}>
                      Updated {new Date(updated).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <div className={s.gacts}>
                <a className={s.act} href={visual.guideline_url} target="_blank" rel="noopener noreferrer">
                  <Icon name="doc" size={12} />
                  Read here
                </a>
                <button
                  type="button"
                  className={s.act}
                  onClick={() => download(visual.guideline_url, "brand-guidelines.pdf")}
                >
                  <Icon name="upload" size={12} />
                  Download
                </button>
              </div>
            </div>
          )}

          {!loading && logos.length === 0 && colors.length === 0 && fonts.length === 0 && (
            <div className={s.sec}>
              <p className={s.emptyNote}>
                Nothing has been uploaded for this brand yet. Logos, colours and typefaces appear
                here as they are added.
              </p>
            </div>
          )}

          <div className={`${s.toast} ${toast ? s.toastOn : ""}`} role="status" aria-live="polite">
            {toast}
          </div>
        </div>
      </div>

      {/* The AI Chat rail stays, exactly as on every other page. */}
      <ChatRail
        indexedFileCount={fileCount}
        suggestions={[
          "Which logo should I use on a dark photo?",
          "What is our primary colour?",
          "Which typeface do headings use?",
        ]}
      />
    </div>
  );
}
