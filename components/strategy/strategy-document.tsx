"use client";

import { isFromDocument } from "@/lib/strategy-intake";
import { createContext, useContext, useState } from "react";
import Link from "next/link";
import {
  SECTIONS, EMPTY_STRATEGY, completeness, derivePyramid, firstIncompleteSection,
  generateSummary, primarySegment, oneLine, midSentence, splitHeadline, hasUsableMap,
  anyPrices, ladder, missingQuestionsFor, quotesFor,
  type BrandStrategy, type SectionDef, type StrategyOrigin,
} from "@/lib/strategy";
import { forLocale } from "@/lib/onboarding-locale.ts";
import type { Track } from "@/lib/onboarding-questions.ts";
import { I, Ico } from "./icons";
import s from "./strategy.module.css";
import { useT, useLocale } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

/**
 * The strategy as a document that happens to be editable — not a form.
 * Structure and copy follow branditect-ui/spec/strategy.md.
 */

function SecHead({ def, onEdit }: { def: SectionDef; onEdit: (id: string) => void }) {
  const t = useT();
  return (
    <div className={s.sechead}>
      <span className={s.secno}>{def.no}</span>
      <h2>{t(def.titleKey)}</h2>
      <span className={s.why}>{t(def.whyKey)}</span>
      <button type="button" className={s.edit} onClick={() => onEdit(def.id)}>
        <Ico d={I.pen} size={13} /> {t("common.edit")}
      </button>
    </div>
  );
}

/** A section with nothing in it shows a prompt, never a blank card. */
function Empty({ what, example }: { what: StringKey; example: StringKey }) {
  const t = useT();
  return (
    <div className={s.empty}>
      <div className="t">{t(what)}</div>
      <div className="v">{t("strategyDoc.forExample", { example: t(example) })}</div>
    </div>
  );
}

/**
 * Where this strategy came from, for the whole document.
 *
 * A context rather than a prop threaded through nine call sites: every section
 * needs the same answer, and a prop that has to be passed nine times is a prop
 * that will be forgotten on the tenth.
 */
const OriginContext = createContext<{
  origin: StrategyOrigin | null;
  track: Track;
  strategy: BrandStrategy;
}>({ origin: null, track: "physical", strategy: EMPTY_STRATEGY });

/**
 * The sentences a section was read out of.
 *
 * Shown on the section, not in a footnote. An extracted answer the founder
 * cannot tell from one they wrote becomes a positioning they never chose.
 */
function FromDocument({ def }: { def: SectionDef }) {
  const t = useT();
  const { origin } = useContext(OriginContext);
  const quotes = quotesFor(def.id, origin);
  if (!quotes.length) return null;

  return (
    <div className={s.sourced}>
      <div className="lab">{t("strategyDoc.fromYourDocument")}</div>
      <ul>
        {quotes.map((q) => (
          <li key={q.n}>
            <q>{q.quote}</q>
            {q.page !== null && <span className="pg">{t("strategyDoc.page", { page: q.page })}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * What this section does not have, as questions.
 *
 * NOT an example of what an answer might look like. On a strategy read from a
 * founder's own document, an example beside an empty section is a sentence
 * they did not write sitting where their own words belong, and the whole
 * promise of bringing your own strategy is that nothing was written for you.
 */
function NotAnswered({ def, empty }: { def: SectionDef; empty: boolean }) {
  const t = useT();
  const locale = useLocale();
  const { origin, track } = useContext(OriginContext);
  const missing = missingQuestionsFor(def.id, origin);
  // Only for a strategy read from a document. A questionnaire strategy renders
  // exactly as it always has: its gaps already have the example prompts, and
  // this feature is not an excuse to redesign that screen underneath anyone.
  if (!isFromDocument(origin?.source) || !missing.length) return null;

  return (
    <div className={s.notAnswered}>
      <div className="lab">{empty ? t("strategyDoc.notInDocument") : t("strategyDoc.stillOpen")}</div>
      <p className="int">{t("strategyDoc.answerToFill")}</p>
      <ul>
        {missing.map((n) => {
          const q = forLocale(n, track, locale);
          return q ? <li key={n}>{q.q}</li> : null;
        })}
      </ul>
      <Link href={`/start/q/${missing[0]}`} className="go">{t("strategyDoc.answerThese")} →</Link>
    </div>
  );
}

function Section({ def, onEdit, children }: { def: SectionDef; onEdit: (id: string) => void; children: React.ReactNode }) {
  const { origin, strategy } = useContext(OriginContext);
  // A strategy read from a document shows what the document said and nothing
  // else: where there is no content, the example prompts inside `children`
  // are suppressed and the questions take their place.
  const empty = isFromDocument(origin?.source) && !def.hasAny(strategy);
  return (
    <section className={s.sec}>
      <SecHead def={def} onEdit={onEdit} />
      {!empty && children}
      <FromDocument def={def} />
      <NotAnswered def={def} empty={empty} />
    </section>
  );
}

const STAGE_LABEL: Record<string, StringKey> = {
  discovery: "strategyDoc.stage.discovery", consideration: "strategyDoc.stage.consideration",
  decision: "strategyDoc.stage.decision", retention: "strategyDoc.stage.retention",
};

export default function StrategyDocument({
  strategy, onEdit, onExport, onRegenerate, origin = null, track = "physical", footer,
}: {
  strategy: BrandStrategy;
  onEdit: (sectionId: string) => void;
  onExport: () => void;
  onRegenerate: () => void;
  /** Where this strategy came from. Null renders exactly as it always has. */
  origin?: StrategyOrigin | null;
  track?: Track;
  /** Rendered under the document: Start fresh lives at the foot of the page. */
  footer?: React.ReactNode;
}) {
  const t = useT();
  const [activeSeg, setActiveSeg] = useState(0);
  const c = completeness(strategy);
  const pyr = derivePyramid(strategy);
  const summary = generateSummary(strategy, t);
  const firstGap = firstIncompleteSection(strategy);
  const seg = strategy.audience[activeSeg] ?? primarySegment(strategy);
  const headline = splitHeadline(strategy.positioning.difference);
  const rows = ladder(strategy.competitors);
  const showPrices = anyPrices(strategy.competitors);
  const showMap = hasUsableMap(strategy.competitors);
  const updated = strategy.updatedAt
    ? new Date(strategy.updatedAt).toLocaleDateString(t("strategyDoc.dateLocale"), { day: "numeric", month: "short", year: "numeric" })
    : t("strategyDoc.notSavedYet");

  /**
   * One body per section, looked up by id.
   *
   * The page renders SECTIONS in order rather than nine hand-placed blocks:
   * the number, the title and the why line all come from the list, so a
   * section added there cannot be forgotten here — which is exactly what
   * happened to `voice`, a field of BrandStrategy that rendered nowhere.
   */
  const bodies: Partial<Record<string, React.ReactNode>> = {
    core: (
      <>
        <div className={`${s.panel} ${s.core}`}>
          <div className={s.grid2}>
            {([["strategyDoc.whoWeAre", strategy.core.whoWeAre, I.user],
               ["strategyDoc.whatWeDo", strategy.core.whatWeDo, I.bolt],
               ["strategyDoc.whyWeExist", strategy.core.whyWeExist, I.heart],
               ["strategyDoc.ourPromise", strategy.core.promise, I.shield]] as const).map(([k, v, icon]) => (
              <div key={k} className={s.quad}>
                <span className={s.qico}><Ico d={icon} size={21} /></span>
                <div>
                  <div className="t">{t(k)}</div>
                  <div className="v">{v || t("strategyDoc.notAnsweredYet")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    positioning: (
      <>
        <div className={`${s.panel} ${s.pos}`}>
          <div className={s.grid4}>
            {([["strategyDoc.weAre", strategy.positioning.weAre], ["strategyDoc.for", strategy.positioning.forWhom],
               ["strategyDoc.unlike", strategy.positioning.unlike], ["strategyDoc.because", strategy.positioning.because]] as const).map(([k, v]) => (
              <div key={k} className={s.pcol}>
                <div className="k">{t(k)}</div>
                <div className="v">{v || "—"}</div>
              </div>
            ))}
          </div>
          <div className={s.diff}>
            <div>
              <div className="k">{t("sdoc.different")}</div>
              <div className="v">{strategy.positioning.difference || t("strategyDoc.notDefinedYet")}</div>
            </div>
          </div>
          {/* Without an exclusion this is a description, not a position. */}
          <div className={s.notfor}>
            <Ico d={I.ban} size={16} />
            <div>
              <div className="k">{t("sdoc.notFor")}</div>
              <div className="v">
                {strategy.positioning.notFor ||
                  t("strategyDoc.nobodyExcluded")}
              </div>
            </div>
          </div>
        </div>
      </>
    ),
    audience: (
      <>
        <div className={s.panel}>
          {strategy.audience.length === 0 ? (
            <Empty what="strategyDoc.noSegments" example="strategyDoc.exSegment" />
          ) : (
            <>
              <div className={s.segrow}>
                {strategy.audience.map((a, i) => (
                  <button key={a.name + i} type="button"
                    className={`${s.seg} ${i === activeSeg ? s.segOn : ""}`}
                    onClick={() => setActiveSeg(i)}>
                    {a.name}{a.isPrimary ? " ★" : ""}
                  </button>
                ))}
                <button type="button" className={`${s.seg} ${s.segAdd}`} onClick={() => onEdit("audience")}>
                  {t("strategyDoc.addSegment")}
                </button>
              </div>
              {seg && (
                <>
                  <div className={s.aud}>
                    <span className={s.avat}><Ico d={I.user} size={26} /></span>
                    <div>
                      <div className={s.audNm}>{seg.name}</div>
                      <div className={s.audRo}>
                        {[seg.role, seg.detail].filter(Boolean).join(" · ")}
                        {seg.isPrimary && ` · ${t("strategyDoc.primary")}`}
                      </div>
                    </div>
                  </div>
                  <div className={s.wf}>
                    <div>
                      <div className="k">{t("sdoc.theyWant")}</div>
                      <div className="v">{seg.wants || "—"}</div>
                    </div>
                    <div>
                      <div className={`k ${s.kb}`}>{t("sdoc.frustratedBy")}</div>
                      <div className="v">{seg.frustratedBy || "—"}</div>
                    </div>
                  </div>
                  {seg.channels.length > 0 && (
                    <div className={s.tags}>
                      {seg.channels.map((ch, i) => (
                        <span key={ch.label + i} className={`${s.tag} ${ch.stage ? "" : s.tagO}`}>
                          {ch.label}{ch.stage ? ` · ${t(STAGE_LABEL[ch.stage])}` : ` · ${t("strategyDoc.unassigned")}`}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </>
    ),
    competitors: (
      <>
        <div className={s.panel}>
          {strategy.competitors.length === 0 ? (
            <Empty what="strategyDoc.noCompetitors" example="strategyDoc.exCompetitor" />
          ) : (
            <>
              <div className={s.comp}>
                {rows.map((k, i) => (
                  <div key={k.name + i} className={`${s.crow} ${k.isUs ? s.crowUs : ""}`}>
                    <div className={s.crowNm}>{k.name}</div>
                    <div className={s.crowD}>{k.description}</div>
                    {/* A column of em dashes says nothing. Hidden until a price exists. */}
                    {showPrices && <div className={s.crowPr}>{k.price || "—"}</div>}
                  </div>
                ))}
              </div>
              {!showPrices && (
                <div className={s.emptyNote}>
                  {t("strategyDoc.noPrices")}
                </div>
              )}
              {showMap && <div className={s.map}>
                <span className={`${s.ax} ${s.axv}`} /><span className={`${s.ax} ${s.axh}`} />
                <span className={`${s.lb} ${s.lt}`}>{t("sdoc.professional")}</span>
                <span className={`${s.lb} ${s.lbm}`}>{t("sdoc.consumer")}</span>
                <span className={`${s.lb} ${s.ll}`}>{t("sdoc.accessible")}</span>
                <span className={`${s.lb} ${s.lr}`}>{t("sdoc.premium")}</span>
                {strategy.competitors.map((k, i) => (
                  <span key={k.name + i}
                    className={`${s.dot} ${k.isUs ? s.dotUs : ""}`}
                    style={{ left: `${k.map.x}%`, top: `${100 - k.map.y}%` }}>
                    {!k.isUs && <i style={{ background: "currentColor" }} />}{k.name}
                  </span>
                ))}
              </div>}
              {!showMap && (
                <div className={s.emptyNote}>
                  {t("strategyDoc.mapNeedsPositions")}
                </div>
              )}
            </>
          )}
        </div>
      </>
    ),
    pillars: (
      <>
        {strategy.pillars.length === 0 ? (
          <div className={s.panel}>
            <Empty what="strategyDoc.noPillars" example="strategyDoc.exPillar" />
          </div>
        ) : (
          <div className={s.grid3}>
            {strategy.pillars.map((p, i) => (
              <div key={p.title + i} className={`${s.panel} ${s.pil}`}>
                <span className={s.pico}><Ico d={I.spark} size={19} /></span>
                <div className="t">{p.title}</div>
                <div className="v">{p.body}</div>
                <div className={s.proof}>
                  <div className={s.proofk}>{t("sdoc.proof")}</div>
                  {p.proof ? (
                    <div className={s.proofv}><Ico d={I.check} size={13} />{p.proof}</div>
                  ) : (
                    /* Surfaced, not hidden — copy from adjectives reads like everyone else's. */
                    <div className={`${s.proofv} ${s.proofMissing}`}>
                      <Ico d={I.ban} size={13} />{t("sdoc.noProof")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    ),
    messages: (
      <>
        <div className={s.panel}>
          {strategy.messages.tagline
            ? <div className={s.tagline}>{strategy.messages.tagline}</div>
            : <Empty what="strategyDoc.noTagline" example="strategyDoc.exTagline" />}
          {strategy.messages.supporting.map((m, i) => (
            <div key={i} className={s.msg}>
              {m.text}
              <span className={`${s.msgWho} ${m.stage ? "" : s.msgUnstaged}`}>
                {m.stage ? t(STAGE_LABEL[m.stage]) : t("strategyDoc.noStage")}
              </span>
            </div>
          ))}
        </div>
      </>
    ),
    voice: (
      <>
        <div className={`${s.panel} ${s.bnd}`}>
          {strategy.voice.description
            ? <p className={s.voiceDesc}>{strategy.voice.description}</p>
            : <Empty what="strategyDoc.voice.empty" example="strategyDoc.voice.example" />}
          {(strategy.voice.doSay.length > 0 || strategy.voice.dontSay.length > 0) && (
            <div className={s.grid2}>
              <div className={`${s.bcol} ${s.bcolYes}`}>
                <div className="k"><Ico d={I.check} size={14} /> {t("strategyDoc.voice.doSay")}</div>
                <ul>{strategy.voice.doSay.map((v, i) => (
                  <li key={i}><span>✓</span><span style={{ fontWeight: 500 }}>{v}</span></li>
                ))}</ul>
              </div>
              <div className={`${s.bcol} ${s.bcolNo}`}>
                <div className="k"><Ico d={I.x} size={14} /> {t("strategyDoc.voice.dontSay")}</div>
                <ul>{strategy.voice.dontSay.map((v, i) => (
                  <li key={i}><span>✕</span><span style={{ fontWeight: 500 }}>{v}</span></li>
                ))}</ul>
              </div>
            </div>
          )}
        </div>
      </>
    ),
    principles: (
      <>
        <div className={s.panel}>
          {strategy.principles.length === 0 ? (
            <Empty what="strategyDoc.noPrinciples" example="strategyDoc.exPrinciple" />
          ) : strategy.principles.map((p, i) => (
            <div key={p.title + i} className={s.prin}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="t">{p.title}</div>
                <div className="v">{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    boundaries: (
      <>
        <div className={`${s.panel} ${s.bnd}`}>
          <div className={s.grid2}>
            <div className={`${s.bcol} ${s.bcolNo}`}>
              <div className="k"><Ico d={I.x} size={14} /> {t("sdoc.weNever")}</div>
              {strategy.boundaries.never.length === 0 ? (
                <ul><li><span>—</span>{t("sdoc.nothingNamedHelp")}</li></ul>
              ) : (
                <ul>{strategy.boundaries.never.map((n, i) => (
                  <li key={i}><span>✕</span><span style={{ fontWeight: 500 }}>{n.rule}
                    {n.reason && <span className={s.reason}> {t("strategyDoc.becauseReason", { reason: midSentence(n.reason) })}</span>}</span></li>
                ))}</ul>
              )}
            </div>
            <div className={`${s.bcol} ${s.bcolYes}`}>
              <div className="k"><Ico d={I.check} size={14} /> {t("sdoc.weAlways")}</div>
              {strategy.boundaries.always.length === 0 ? (
                <ul><li><span>—</span>{t("sdoc.nothingNamed")}</li></ul>
              ) : (
                <ul>{strategy.boundaries.always.map((a, i) => (
                  <li key={i}><span>✓</span><span style={{ fontWeight: 500 }}>{a}</span></li>
                ))}</ul>
              )}
            </div>
          </div>
          {(strategy.boundaries.wordsUsed.length > 0 || strategy.boundaries.wordsAvoided.length > 0) && (
            <div className={s.words}>
              {strategy.boundaries.wordsUsed.map((w) => <span key={w} className={`${s.w} ${s.wOk}`}>{w}</span>)}
              {strategy.boundaries.wordsAvoided.map((w) => <span key={w} className={`${s.w} ${s.wNo}`}>{w}</span>)}
            </div>
          )}
        </div>
      </>
    ),
    focus: (
      <>
        <div className={s.panel}>
          {strategy.focus.goal ? (
            <div className={s.goal}>
              <span className={s.gico}><Ico d={I.flag} size={22} /></span>
              <div>
                <div className="k">{t("sdoc.brandGoal")}</div>
                <div className="v">{strategy.focus.goal}</div>
              </div>
            </div>
          ) : (
            <Empty what="strategyDoc.noGoal" example="strategyDoc.exGoal" />
          )}
          {strategy.focus.priorities.map((p, i) => (
            <div key={p.label + i} className={s.pri}>
              <span className={s.ck}><Ico d={I.check} size={11} /></span>
              {p.label}
              <span className={s.priM}>{p.when}</span>
            </div>
          ))}
        </div>
      </>
    ),
  };

  return (
    <OriginContext.Provider value={{ origin, track, strategy }}>
    <div className={s.wrap}>
      {/* Said once at the top, so the whole page is read in the right light:
          this is the founder's own document, not something generated. */}
      {isFromDocument(origin?.source) && (
        <p className={s.readFrom}>{t("strategyDoc.readFromDocument")}</p>
      )}
      {/* ============ HERO ============ */}
      <section className={s.hero}>
        <span className={s.arc} aria-hidden="true" />
        <div>
          <div className={s.kicker}>{t("sdoc.title")}</div>
          {/* The difference statement headlines, not the page title — it is what
              a new team member needs and what the AI cites most. */}
          {/* Capped rather than shrunk — the remainder moves into the sub. */}
          <h1 className={s.heroHeadline}>
            {headline.head || t("strategyDoc.positioningPlaceholder")}
          </h1>
          {strategy.core.promise && <div className={s.heroLine}>{strategy.core.promise}</div>}
          {(headline.rest || strategy.core.whyWeExist) && (
            <p className={s.heroSub}>{headline.rest || strategy.core.whyWeExist}</p>
          )}

          <div className={s.metarow}>
            <span className={s.chip}><Ico d={I.clock} size={12} /> {t("strategyDoc.updated", { date: updated })}</span>
            {/* Counts sections. Never a percentage, and unrelated to Brand Readiness. */}
            <span className={s.chip}><Ico d={I.check} size={12} /> {t("strategyDoc.sectionsComplete", { filled: c.filled, total: c.total })}</span>
            <span className={s.chip}><Ico d={I.brain} size={12} /> {t("sdoc.feeding")}</span>
          </div>

          <div className={s.hbtns}>
            <button type="button" className={s.hbtn} onClick={() => onEdit(firstGap?.id ?? "core")}>
              <Ico d={I.pen} size={15} />
              {firstGap ? t("strategyDoc.finish", { section: t(firstGap.titleKey) }) : t("strategyDoc.editStrategy")}
            </button>
            <button type="button" className={`${s.hbtn} ${s.ghost}`} onClick={onExport}>
              <Ico d={I.dl} size={15} /> {t("sdoc.export")}
            </button>
          </div>
        </div>

        {/* The narrowing is the argument: many attributes, one idea. */}
        <div>
          <div className={s.pyr}>
            {/* Each tier is capped to about one line. The narrowing is the
                argument, and a four-line Benefits block under a two-word
                Essence inverts it. Full text stays available on hover. */}
            {([["strategyDoc.essence", pyr.essence, s.t1, 34],
               ["strategyDoc.personality", pyr.personality.join(" · "), s.t2, 40],
               ["strategyDoc.benefits", pyr.benefits, s.t3, 52],
               ["strategyDoc.attributes", pyr.attributes.join(" · "), s.t4, 64]] as const).map(
              ([label, value, cls, cap]) => (
                <div key={label} className={`${s.tier} ${cls}`}>
                  <div className="t">{t(label)}</div>
                  <div className="v" title={value || undefined}>{value ? oneLine(value, cap) : "—"}</div>
                </div>
              ))}
          </div>
          <div className={s.pyrcap}>{t("sdoc.derived")}</div>
        </div>
      </section>

      {/* ============ SUMMARY ============ */}
      {summary.length > 0 && (
        <section className={s.summary}>
          <div className={s.summaryLab}>
            <Ico d={I.spark} size={14} /> {t("sdoc.inAParagraph")}
            <button type="button" onClick={onRegenerate}>
              <Ico d={I.spark} size={12} /> {t("common.regenerate")}
            </button>
          </div>
          <p>{summary.map((p, i) => (p.strong ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>))}</p>
          <div className={s.summaryFoot}>
            <Ico d={I.brain} size={13} />
            {t("sdoc.neverStored")}
          </div>
        </section>
      )}

      {/* Every section, in the list's order and numbering. */}
      {SECTIONS.map((def) => (
        <Section key={def.id} def={def} onEdit={onEdit}>
          {bodies[def.id]}
        </Section>
      ))}


      {/* The analysis is input for Andy and Studio, not a section of the
          document — except this. A conflict the analysis could not settle from
          the answers is the founder's to decide, and hiding it decides it by
          silence. */}
      {strategy.analysis.unresolved.length > 0 && (
        <section className={s.sec}>
          <div className={s.sechead}>
            <h2>{t("strategyDoc.unresolved")}</h2>
            <span className={s.why}>{t("strategyDoc.unresolvedWhy")}</span>
          </div>
          <div className={`${s.panel} ${s.bnd}`}>
            {strategy.analysis.unresolved.map((u, i) => (
              <div key={i} className={s.prin}>
                <span className="n">?</span>
                <div><div className="v">{u}</div></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ WHERE THIS GOES NEXT ============ */}
      <section className={s.sec}>
        <div className={s.sechead}><h2>{t("sdoc.whereNext")}</h2></div>
        <div className={s.next}>
          {([["nav.brand.tone", "strategyDoc.howItSounds", "/brand/tone-of-voice", s.n1, I.chat],
             ["nav.brand.visual", "strategyDoc.howItLooks", "/brand/visual-identity", s.n2, I.img],
             ["nav.knowledge.products", "strategyDoc.appliedTo", "/knowledge/products", s.n3, I.bag]] as const).map(
            ([titleKey, v, href, cls, icon]) => (
              <Link key={href} href={href} className={s.ncard}>
                <span className={`${s.nico} ${cls}`}><Ico d={icon} size={19} /></span>
                <div>
                  <div className="t">{t(titleKey)}</div>
                  <div className="v">{t(v)}</div>
                </div>
                <span className="ar"><Ico d={I.arr} size={16} /></span>
              </Link>
            ))}
        </div>

        <div className={s.usedby}>
          <span className={s.usedbyIc}><Ico d={I.brain} size={19} /></span>
          <div>
            <div className="t">{t("sdoc.whereUsed")}</div>
            <div className="v">
              {t("strategyDoc.usedByBody")}
            </div>
          </div>
        </div>
      </section>
      {footer}
    </div>
    </OriginContext.Provider>
  );
}
