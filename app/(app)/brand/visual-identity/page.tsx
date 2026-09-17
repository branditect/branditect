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
import {
  AddLogo, AddColour, AddTypeface, EditColour, UploadGuideline, RemoveGuideline,
  ReplaceLogo, DeleteLogo,
} from "@/components/visual-identity/uploads";
import u from "@/components/visual-identity/uploads.module.css";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

const CONTRAST_LABEL: Record<string, StringKey> = {
  AAA: "visual.contrast.aaa", AA: "visual.contrast.aa", large: "visual.contrast.large", surface: "visual.contrast.surface",
};

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
/* The specimen line. A pangram in the interface language, so the specimen
   shows the letters that language actually uses (ä, ö in Finnish). */
const PANGRAM_KEY: StringKey = "vi.pangram";

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

/**
 * The real logo where there is one, a neutral stand-in where there is not.
 * The rules are the point; the artwork only illustrates them.
 */
function Mark({
  url, height = 30, width = 104, className,
}: { url: string | null; height?: number; width?: number; className?: string }) {
  const t = useT();
  if (!url) {
    return <span className={`${s.placeholderMark} ${className ?? ""}`} style={{ height, width }}>{t("visual.yourLogo")}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={className} style={{ height, maxWidth: width, objectFit: "contain" }} />;
}

export default function VisualIdentityPage() {
  const t = useT();
  const { brandId, brandName, loading: brandLoading } = useBrand();

  const [logos, setLogos] = useState<LogoRow[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [fonts, setFonts] = useState<FontRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [visual, setVisual] = useState<VisualRow | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Extracted from the effect so an upload can call it. Everything on this
  // page comes from one read, which is what keeps a section and its count from
  // disagreeing after something is added.
  const reload = useCallback(async (alive: () => boolean = () => true) => {
    if (!brandId || brandId === "default") { setLoading(false); return; }
    {
      // `select("*")` is fine here and only here: this route is authenticated
      // and reads the signed-in brand's own rows. The explicit column allowlist
      // the spec requires belongs to the unauthenticated /k route.
      const [l, c, f, tp, v, p] = await Promise.all([
        supabase.from("brand_logos").select("*").eq("brand_id", brandId).order("created_at"),
        supabase.from("brand_book_colors").select("*").eq("brand_id", brandId).order("created_at"),
        supabase.from("brand_fonts").select("*").eq("brand_id", brandId).order("created_at"),
        supabase.from("brand_templates").select("*").eq("brand_id", brandId).order("created_at"),
        supabase.from("brand_visual").select("*").eq("brand_id", brandId).maybeSingle(),
        supabase.from("brand_book_pages").select("*", { count: "exact", head: true }).eq("brand_id", brandId),
      ]);
      if (!alive()) return;

      setLogos((l.data as LogoRow[]) ?? []);
      setColors((c.data as ColorRow[]) ?? []);
      setFonts((f.data as FontRow[]) ?? []);
      setTemplates((tp.data as TemplateRow[]) ?? []);
      setVisual((v.data as VisualRow) ?? null);
      setPageCount(p.count ?? 0);
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (brandLoading) return;
    let alive = true;
    reload(() => alive);
    return () => { alive = false; };
  }, [brandLoading, reload]);

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
      () => flash(t("visual.copyFailed")),
    );
  }, [flash, t]);

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
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>{t("visual.noBrand")}</h2>
          <p style={{ marginTop: 8 }} className={s.emptyNote}>
            {t("visual.noBrandHelp")}
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
                {t("visual.breadcrumb")}
              </span>
              <h1>{t("visual.title")}</h1>
              <p className={s.lede}>
                {t("vi.lede1")}{" "}
                <b>{t("visual.intro")}</b>
              </p>
            </div>
            <div className={s.glass}>
              <div className={s.stats}>
                <div>
                  {/* A zero reads as empty. An em dash reads as broken. */}
                  <div className={s.statN}>{fileCount}</div>
                  <div className={s.statK}>{t("visual.files")}</div>
                </div>
                <div>
                  <div className={s.statN}>{version}</div>
                  <div className={s.statK}>{t("visual.current")}</div>
                </div>
              </div>
              <div className={s.vrow}>
                <i />
                {updated
                  ? t("visual.updatedLive", { date: new Date(updated).toLocaleDateString(undefined, { day: "numeric", month: "short" }) })
                  : t("visual.everythingLive")}
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
                  <div className={s.eyebrow}>{t("visual.startHere")}</div>
                  <h2 style={{ marginTop: 5 }}>{t("visual.whichOne")}</h2>
                  <p>
                    {t("vi.lede2")}
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
                      <div className={s.ucq}>{t(u.questionKey)}</div>
                      <div className={s.ucans}>
                        <div className={s.ucfile}>{t(u.answerKey)}</div>
                        <div className={s.ucfmt}>{fmts.length ? fmts.join(" · ") : t(u.noteKey)}</div>
                        <span className={s.go}>{t("common.download")}<Icon name="upload" size={12} /></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ══════════ 2 · LOGOS ══════════ */}
          {/* The section always renders. A card with no file is clutter; a
              missing section is a page that gives no hint anything is missing. */}
          <section className={s.sec}>
            <div className={s.shead}>
              <div>
                <h2>{t("visual.logos")}</h2>
                <p>
                  {t("vi.platesFixed")}
                </p>
              </div>
              <div className={u.headActions}>
                <AddLogo brandId={brandId} onDone={() => { reload(); flash(t("visual.toast.logoUploaded")); }} />
              </div>
            </div>

            {bySlot.size === 0 ? (
              <div className={s.empty}>
                <h3>{t("visual.noLogos")}</h3>
                <p>
                  {t("vi.uploadThree")}
                </p>
                <AddLogo
                  brandId={brandId}
                  variant="empty"
                  onDone={() => { reload(); flash(t("visual.toast.logoUploaded")); }}
                />
              </div>
            ) : (
              <>
              <div className={s.logos}>
                {SLOTS.filter((def) => bySlot.has(def.slot)).map((def) => {
                  const files = bySlot.get(def.slot)!;
                  const first = files[0];
                  return (
                    <div key={def.slot} className={s.lc}>
                      <div className={s.lcTop}>
                        <div className={s.lcT}>{t(def.labelKey)}</div>
                        <div className={s.lcU}>{t(def.usageKey)}</div>
                      </div>
                      <div className={`${s.plate} ${s[def.plate]}`}>
                        <span className={s.tag}>{t(def.tagKey)}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={first.file_url!} alt={t("visual.logoAlt", { label: t(def.labelKey), brand: brandName })} />
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
                            {t("common.download")}
                          </button>
                        </div>
                        {/* Replace and delete belong to this plate, so they
                            know their slot and never ask for it. */}
                        <div className={s.plateActs}>
                          <ReplaceLogo
                            brandId={brandId}
                            slot={def.slot}
                            onDone={() => { reload(); flash(t("visual.toast.logoReplaced")); }}
                          />
                          <DeleteLogo
                            brandId={brandId}
                            slot={def.slot}
                            onDone={() => { reload(); flash(t("visual.toast.logoDeleted")); }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {otherFiles.length > 0 && (
                <>
                  <div className={s.cglab} style={{ marginTop: 18 }}>{t("visual.allFiles")}</div>
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
                        {f.file_name ?? f.slot ?? t("visual.file")}
                      </button>
                    ))}
                  </div>
                </>
              )}
              </>
            )}
          </section>

          {/* ══════════ 3 · COLOUR ══════════ */}
          {/* Renders whether or not there are colours. Hiding the section when
              empty removed the only way to add the first one. */}
          {(
            <section className={s.sec}>
              <div className={s.shead}>
                <div>
                  <h2>{t("visual.colour")}</h2>
                  <p>
                    {t("vi.swatchesCopy")}
                  </p>
                </div>
                <div className={u.headActions}>
                  <AddColour brandId={brandId} onDone={() => { reload(); flash(t("visual.toast.colourAdded")); }} />
                </div>
              </div>

              {colors.length === 0 && (
                <div className={s.empty}>
                  <h3>{t("visual.noColours")}</h3>
                  <p>
                    {t("vi.addTheOnesYouUse")}
                  </p>
                  <AddColour
                    brandId={brandId}
                    variant="empty"
                    onDone={() => { reload(); flash(t("visual.toast.colourAdded")); }}
                  />
                </div>
              )}

              {[
                { key: "core", label: "visual.groupCore" as StringKey, rows: core },
                { key: "gradient", label: "visual.groupGradients" as StringKey, rows: gradients },
              ]
                .filter((g) => g.rows.length > 0)
                .map((group) => (
                  <div key={group.key} className={s.cgroup}>
                    <div className={s.cglab}>{t(group.label)}</div>
                    <div className={s.sw}>
                      {group.rows.map((c) => {
                        const isGradient = group.key === "gradient";
                        const value = isGradient ? (c.css_value ?? c.hex ?? "") : (c.hex ?? "");
                        const contrast = isGradient ? null : contrastOnWhite(value);
                        return (
                          <div key={String(c.id)} className={s.swatchWrap}>
                            {/* The pencil sits on the swatch. The swatch itself
                                still copies: that is what it is for. */}
                            {!isGradient && (
                              <span className={s.swatchEdit}>
                                <EditColour
                                  brandId={brandId}
                                  colour={{ id: c.id, hex: c.hex, name: c.name, role: c.role }}
                                  onDone={() => { reload(); flash(t("visual.toast.colourSaved")); }}
                                />
                              </span>
                            )}
                          <button
                            type="button"
                            className={s.swatch}
                            onClick={() => copy(value, isGradient ? t("visual.toast.cssCopied") : t("visual.toast.valueCopied", { value }))}
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
                                {isGradient ? t("visual.copyCss") : t("visual.copyHex")}
                              </span>
                            </span>
                            <span className={s.meta}>
                              <span className={s.nm}>{c.name || t("notes.untitled")}</span>
                              <span className={s.hx}>{value.toUpperCase()}</span>
                              {c.role && <span className={s.roleT}>{c.role}</span>}
                              {contrast && (
                                <span
                                  className={`${s.ok} ${contrast.level === "AAA" || contrast.level === "AA" ? s.pass : s.warn}`}
                                >
                                  {contrast.ratio}:1 · {t(CONTRAST_LABEL[contrast.level])}
                                </span>
                              )}
                            </span>
                          </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </section>
          )}

          {/* ══════════ 4 · TYPEFACES ══════════ */}
          <section className={s.sec}>
            <div className={s.shead}>
              <div>
                <h2>{t("visual.typefaces")}</h2>
                <p>{t("visual.typefacesHelp")}</p>
              </div>
              <div className={u.headActions}>
                <AddTypeface brandId={brandId} onDone={() => { reload(); flash(t("visual.toast.typefaceAdded")); }} />
              </div>
            </div>

            {fonts.length === 0 ? (
              <div className={s.empty}>
                <h3>{t("visual.noTypefaces")}</h3>
                <p>{t("visual.typefacesEmpty")}</p>
                <AddTypeface
                  brandId={brandId}
                  variant="empty"
                  onDone={() => { reload(); flash(t("visual.toast.typefaceAdded")); }}
                />
              </div>
            ) : (
              <div className={s.type}>
                {fonts.map((font, i) => {
                  const inUse = font.weights_in_use ?? [];
                  const snippet = cssSnippetFor(font);
                  return (
                    <div key={String(font.id)} className={s.tc}>
                      <div className={`${s.spec} ${i % 2 === 0 ? s.specA : s.specB}`}>
                        <div className={s.ag} style={{ fontFamily: familyFor(font) }}>Ag</div>
                        <div className={s.pang} style={{ fontFamily: familyFor(font) }}>{t(PANGRAM_KEY)}</div>
                      </div>
                      <div className={s.tbody}>
                        <h3>{font.name || t("notes.untitled")}</h3>
                        {font.role && <div className={s.roleLab}>{font.role}</div>}
                        <div className={s.wts}>
                          {WEIGHT_LADDER.map((w) => (
                            <span key={w} className={`${s.wt} ${inUse.includes(w) ? s.wtOn : ""}`}>{w}</span>
                          ))}
                        </div>
                        <pre className={s.code}>{snippet}</pre>
                        <div className={s.trow}>
                          <button type="button" className={`${s.act} ${s.prime}`} onClick={() => copy(snippet, t("visual.toast.cssCopied"))}>
                            <Icon name="doc" size={12} />
                            {t("visual.copyCss")}
                          </button>
                          {font.file_url && (
                            <button type="button" className={s.act} onClick={() => download(font.file_url, font.name)}>
                              <Icon name="upload" size={12} />
                              {t("common.download")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ══════════ 5 · TEMPLATES ══════════ */}
          {templates.length > 0 && (
            <section className={s.sec}>
              <div className={s.shead}>
                <div>
                  <h2>{t("visual.templates")}</h2>
                  <p>{t("visual.templatesHelp")}</p>
                </div>
              </div>
              <div className={s.tpl}>
                {templates.map((tpl) => {
                  const ratio = ratioOf(tpl.name);
                  return (
                    <a key={tpl.id} href={tpl.url ?? "#"} target="_blank" rel="noopener noreferrer" className={s.tpc}>
                      <span className={s.thumb}>
                        {tpl.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tpl.thumbnail_url} alt="" />
                        ) : (
                          <Icon name="img" size={24} />
                        )}
                        {ratio && <span className={s.ratio}>{ratio}</span>}
                      </span>
                      <span className={s.tb}>
                        <span className={s.tn}>{tpl.name || t("visual.template")}</span>
                        <span className={s.td}>{tpl.platform ? t("vi.opensIn", { platform: tpl.platform }) : t("vi.opensInNewTab")}</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* ══════════ 6 · HOW TO HOLD IT ══════════ */}
          {/* Static content, no schema. It used to be gated on having a logo,
              which made the brand rules disappear for exactly the brands that
              have not set anything up yet — the ones that most need to read
              them. Only the artwork is gated now. */}
          <section className={s.sec}>
            <div className={s.shead}>
              <div>
                <h2>{t("visual.howToHold")}</h2>
                <p>
                  {t("vi.fourThings")}
                </p>
              </div>
            </div>
            <div className={s.rules}>
              <div>
                <div className={s.rbox}>
                  <h4>{t("visual.clearSpace")}</h4>
                  <p>{t("visual.clearSpaceHelp")}</p>
                  <div className={s.clearspace}>
                    <div className={s.csbox}>
                      <Mark url={heroLogo?.file_url ?? null} height={34} width={150} />
                    </div>
                  </div>
                </div>
                <div className={s.rbox} style={{ marginTop: 12 }}>
                  <h4>{t("visual.minSize")}</h4>
                  <p>{t("visual.minSizeHelp")}</p>
                  <div className={s.minsize}>
                    <div className={s.ms}>
                      <Mark url={heroLogo?.file_url ?? null} height={22} width={120} />
                      <span className={s.msLab}>120px / 32mm</span>
                    </div>
                    <div className={s.ms}>
                      <Mark url={(bySlot.get("icon")?.[0] ?? heroLogo)?.file_url ?? null} height={14} width={40} />
                      <span className={s.msLab}>24px / 8mm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className={s.cglab}>{t("common.never")}</div>
                <div className={s.donts}>
                  {([
                    { cls: s.sq, title: "visual.dont.stretch", sub: "visual.dont.stretchSub", busy: false },
                    { cls: s.rc, title: "visual.dont.recolour", sub: "visual.dont.recolourSub", busy: false },
                    { cls: s.sh, title: "visual.dont.effects", sub: "visual.dont.effectsSub", busy: false },
                    { cls: "", title: "visual.dont.background", sub: "visual.dont.backgroundSub", busy: true },
                  ] satisfies { cls: string; title: StringKey; sub: StringKey; busy: boolean }[]).map((d) => (
                    <div key={d.title} className={s.dont}>
                      <div className={`${s.dstage} ${d.busy ? s.busy : ""}`}>
                        <span className={s.x}><Icon name="close" size={9} /></span>
                        <Mark url={heroLogo?.file_url ?? null} className={d.cls || undefined} />
                      </div>
                      <div className={s.cap}>
                        {t(d.title)}
                        <span>{t(d.sub)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ 7 · THE GUIDELINES PDF ══════════ */}
          {visual?.guideline_url && (
            <div className={s.guide}>
              <div className={s.cov}><div className={s.covL}>{t("nav.brand")}<br />{t("visual.guidelines")}</div></div>
              <div className="min-w-0">
                <h3>{t("visual.fullGuidelines")}</h3>
                <p>
                  {t("visual.guideBody")}
                </p>
                <div className={s.gmeta}>
                  {pageCount > 0 && <span className={s.gpill}>{t("visual.pages", { count: pageCount })}</span>}
                  <span className={s.gpill}>{version}</span>
                  {updated && (
                    <span className={s.gpill}>
                      {t("visual.updatedOn", { date: new Date(updated).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) })}
                    </span>
                  )}
                </div>
              </div>
              <div className={s.gacts}>
                <UploadGuideline
                  brandId={brandId}
                  replace
                  onDone={({ colorsAdded }) => {
                    reload();
                    flash(colorsAdded
                      ? t("visual.toast.guidelineColours", { count: colorsAdded })
                      : t("visual.toast.guidelineUploaded"));
                  }}
                />
                <RemoveGuideline
                  brandId={brandId}
                  onDone={() => { reload(); flash(t("visual.toast.guidelineRemoved")); }}
                />
                <a className={s.act} href={visual.guideline_url} target="_blank" rel="noopener noreferrer">
                  <Icon name="doc" size={12} />
                  {t("visual.readHere")}
                </a>
                <button
                  type="button"
                  className={s.act}
                  onClick={() => download(visual.guideline_url, "brand-guidelines.pdf")}
                >
                  <Icon name="upload" size={12} />
                  {t("common.download")}
                </button>
              </div>
            </div>
          )}

          {/* No guideline: the thing Home has been asking for, with somewhere
              to put it. This box used to render only when the column was set,
              and nothing ever set it. */}
          {!loading && !visual?.guideline_url && (
            <div className={s.sec}>
              <div className={s.empty}>
                <h3>{t("vi.noGuideline")}</h3>
                <p>{t("vi.noGuidelineBody")}</p>
                <UploadGuideline
                  brandId={brandId}
                  variant="empty"
                  onDone={({ colorsAdded }) => {
                    reload();
                    flash(colorsAdded
                      ? t("visual.toast.guidelineColours", { count: colorsAdded })
                      : t("visual.toast.guidelineUploaded"));
                  }}
                />
              </div>
            </div>
          )}

          {!loading && logos.length === 0 && colors.length === 0 && fonts.length === 0 && (
            <div className={s.sec}>
              <p className={s.emptyNote}>
                {t("vi.nothingUploaded")}
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
          t("visual.prompt1"),
          t("visual.prompt2"),
          t("visual.prompt3"),
        ]}
      />
    </div>
  );
}
