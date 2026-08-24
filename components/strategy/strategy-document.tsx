"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SECTIONS, completeness, derivePyramid, firstIncompleteSection,
  generateSummary, primarySegment, type BrandStrategy, type SectionDef,
} from "@/lib/strategy";
import { I, Ico } from "./icons";
import s from "./strategy.module.css";

/**
 * The strategy as a document that happens to be editable — not a form.
 * Structure and copy follow branditect-ui/spec/strategy.md.
 */

function SecHead({ def, onEdit }: { def: SectionDef; onEdit: (id: string) => void }) {
  return (
    <div className={s.sechead}>
      <span className={s.secno}>{def.no}</span>
      <h2>{def.title}</h2>
      <span className={s.why}>{def.why}</span>
      <button type="button" className={s.edit} onClick={() => onEdit(def.id)}>
        <Ico d={I.pen} size={13} /> Edit
      </button>
    </div>
  );
}

/** A section with nothing in it shows a prompt, never a blank card. */
function Empty({ what, example }: { what: string; example: string }) {
  return (
    <div className={s.empty}>
      <div className="t">{what}</div>
      <div className="v">For example: {example}</div>
    </div>
  );
}

function Section({ def, onEdit, children }: { def: SectionDef; onEdit: (id: string) => void; children: React.ReactNode }) {
  return (
    <section className={s.sec}>
      <SecHead def={def} onEdit={onEdit} />
      {children}
    </section>
  );
}

const STAGE_LABEL: Record<string, string> = {
  discovery: "Discovery", consideration: "Consideration",
  decision: "Decision", retention: "Retention",
};

export default function StrategyDocument({
  strategy, onEdit, onExport, onRegenerate,
}: {
  strategy: BrandStrategy;
  onEdit: (sectionId: string) => void;
  onExport: () => void;
  onRegenerate: () => void;
}) {
  const [activeSeg, setActiveSeg] = useState(0);
  const c = completeness(strategy);
  const pyr = derivePyramid(strategy);
  const summary = generateSummary(strategy);
  const firstGap = firstIncompleteSection(strategy);
  const seg = strategy.audience[activeSeg] ?? primarySegment(strategy);
  const sec = (id: string) => SECTIONS.find((x) => x.id === id)!;

  const updated = strategy.updatedAt
    ? new Date(strategy.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Not saved yet";

  return (
    <div className={s.wrap}>
      {/* ============ HERO ============ */}
      <section className={s.hero}>
        <span className={s.arc} aria-hidden="true" />
        <div>
          <div className={s.kicker}>Brand strategy</div>
          {/* The difference statement headlines, not the page title — it is what
              a new team member needs and what the AI cites most. */}
          <h1 className={s.heroHeadline}>
            {strategy.positioning.difference || "Your positioning line goes here"}
          </h1>
          {strategy.core.promise && <div className={s.heroLine}>{strategy.core.promise}</div>}
          {strategy.core.whyWeExist && <p className={s.heroSub}>{strategy.core.whyWeExist}</p>}

          <div className={s.metarow}>
            <span className={s.chip}><Ico d={I.clock} size={12} /> Updated {updated}</span>
            {/* Counts sections. Never a percentage, and unrelated to Brand Readiness. */}
            <span className={s.chip}><Ico d={I.check} size={12} /> {c.label}</span>
            <span className={s.chip}><Ico d={I.brain} size={12} /> Feeding 4 tools</span>
          </div>

          <div className={s.hbtns}>
            <button type="button" className={s.hbtn} onClick={() => onEdit(firstGap?.id ?? "core")}>
              <Ico d={I.pen} size={15} />
              {firstGap ? `Finish ${firstGap.title}` : "Edit strategy"}
            </button>
            <button type="button" className={`${s.hbtn} ${s.ghost}`} onClick={onExport}>
              <Ico d={I.dl} size={15} /> Export
            </button>
          </div>
        </div>

        {/* The narrowing is the argument: many attributes, one idea. */}
        <div>
          <div className={s.pyr}>
            <div className={`${s.tier} ${s.t1}`}>
              <div className="t">Essence</div>
              <div className="v">{pyr.essence || "—"}</div>
            </div>
            <div className={`${s.tier} ${s.t2}`}>
              <div className="t">Personality</div>
              <div className="v">{pyr.personality.join(" · ") || "—"}</div>
            </div>
            <div className={`${s.tier} ${s.t3}`}>
              <div className="t">Benefits</div>
              <div className="v">{pyr.benefits || "—"}</div>
            </div>
            <div className={`${s.tier} ${s.t4}`}>
              <div className="t">Attributes</div>
              <div className="v">{pyr.attributes.join(" · ") || "—"}</div>
            </div>
          </div>
          <div className={s.pyrcap}>Derived from your positioning and proof points</div>
        </div>
      </section>

      {/* ============ SUMMARY ============ */}
      {summary.length > 0 && (
        <section className={s.summary}>
          <div className={s.summaryLab}>
            <Ico d={I.spark} size={14} /> The whole strategy, in a paragraph
            <button type="button" onClick={onRegenerate}>
              <Ico d={I.spark} size={12} /> Regenerate
            </button>
          </div>
          <p>{summary.map((p, i) => (p.strong ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>))}</p>
          <div className={s.summaryFoot}>
            <Ico d={I.brain} size={13} />
            Generated from the sections below and never stored, so it cannot go stale.
          </div>
        </section>
      )}

      {/* ============ 01 CORE ============ */}
      <Section def={sec("core")} onEdit={onEdit}>
        <div className={`${s.panel} ${s.core}`}>
          <div className={s.grid2}>
            {([["Who we are", strategy.core.whoWeAre, I.user],
               ["What we do", strategy.core.whatWeDo, I.bolt],
               ["Why we exist", strategy.core.whyWeExist, I.heart],
               ["Our promise", strategy.core.promise, I.shield]] as const).map(([k, v, icon]) => (
              <div key={k} className={s.quad}>
                <span className={s.qico}><Ico d={icon} size={21} /></span>
                <div>
                  <div className="t">{k}</div>
                  <div className="v">{v || "Not answered yet"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ============ 02 POSITIONING ============ */}
      <Section def={sec("positioning")} onEdit={onEdit}>
        <div className={`${s.panel} ${s.pos}`}>
          <div className={s.grid4}>
            {([["We are", strategy.positioning.weAre], ["For", strategy.positioning.forWhom],
               ["Unlike", strategy.positioning.unlike], ["Because", strategy.positioning.because]] as const).map(([k, v]) => (
              <div key={k} className={s.pcol}>
                <div className="k">{k}</div>
                <div className="v">{v || "—"}</div>
              </div>
            ))}
          </div>
          <div className={s.diff}>
            <div>
              <div className="k">What makes us different</div>
              <div className="v">{strategy.positioning.difference || "Not defined yet"}</div>
            </div>
          </div>
          {/* Without an exclusion this is a description, not a position. */}
          <div className={s.notfor}>
            <Ico d={I.ban} size={16} />
            <div>
              <div className="k">Not for</div>
              <div className="v">
                {strategy.positioning.notFor ||
                  "Nobody excluded yet — a positioning that excludes nobody will drift the first time someone chases a cheaper segment."}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ============ 03 AUDIENCE ============ */}
      <Section def={sec("audience")} onEdit={onEdit}>
        <div className={s.panel}>
          {strategy.audience.length === 0 ? (
            <Empty what="No segments yet" example="Sarah, 34, salon owner — wants results without retraining her team" />
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
                  + Add segment
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
                        {seg.isPrimary && " · Primary"}
                      </div>
                    </div>
                  </div>
                  <div className={s.wf}>
                    <div>
                      <div className="k">They want</div>
                      <div className="v">{seg.wants || "—"}</div>
                    </div>
                    <div>
                      <div className={`k ${s.kb}`}>Frustrated by</div>
                      <div className="v">{seg.frustratedBy || "—"}</div>
                    </div>
                  </div>
                  {seg.channels.length > 0 && (
                    <div className={s.tags}>
                      {seg.channels.map((ch, i) => (
                        <span key={ch.label + i} className={`${s.tag} ${ch.stage ? "" : s.tagO}`}>
                          {ch.label}{ch.stage ? ` · ${STAGE_LABEL[ch.stage]}` : " · unassigned"}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </Section>

      {/* ============ 04 COMPETITORS ============ */}
      <Section def={sec("competitors")} onEdit={onEdit}>
        <div className={s.panel}>
          {strategy.competitors.length === 0 ? (
            <Empty what="No competitors listed" example="Dyson — €399, premium engineering. Your own price belongs in this list too." />
          ) : (
            <>
              <div className={s.comp}>
                {strategy.competitors.map((k, i) => (
                  <div key={k.name + i} className={`${s.crow} ${k.isUs ? s.crowUs : ""}`}>
                    <div className={s.crowNm}>{k.name}</div>
                    <div className={s.crowD}>{k.description}</div>
                    <div className={s.crowPr}>{k.price || "—"}</div>
                  </div>
                ))}
              </div>
              <div className={s.map}>
                <span className={`${s.ax} ${s.axv}`} /><span className={`${s.ax} ${s.axh}`} />
                <span className={`${s.lb} ${s.lt}`}>Professional</span>
                <span className={`${s.lb} ${s.lbm}`}>Consumer</span>
                <span className={`${s.lb} ${s.ll}`}>Accessible</span>
                <span className={`${s.lb} ${s.lr}`}>Premium</span>
                {strategy.competitors.map((k, i) => (
                  <span key={k.name + i}
                    className={`${s.dot} ${k.isUs ? s.dotUs : ""}`}
                    style={{ left: `${k.map.x}%`, top: `${100 - k.map.y}%` }}>
                    {!k.isUs && <i style={{ background: "currentColor" }} />}{k.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ============ 05 PILLARS ============ */}
      <Section def={sec("pillars")} onEdit={onEdit}>
        {strategy.pillars.length === 0 ? (
          <div className={s.panel}>
            <Empty what="No pillars yet" example="Plasma ion — 110,000 RPM, measured heat. A fact, not an adjective." />
          </div>
        ) : (
          <div className={s.grid3}>
            {strategy.pillars.map((p, i) => (
              <div key={p.title + i} className={`${s.panel} ${s.pil}`}>
                <span className={s.pico}><Ico d={I.spark} size={19} /></span>
                <div className="t">{p.title}</div>
                <div className="v">{p.body}</div>
                <div className={s.proof}>
                  <div className={s.proofk}>Proof</div>
                  {p.proof ? (
                    <div className={s.proofv}><Ico d={I.check} size={13} />{p.proof}</div>
                  ) : (
                    /* Surfaced, not hidden — copy from adjectives reads like everyone else's. */
                    <div className={`${s.proofv} ${s.proofMissing}`}>
                      <Ico d={I.ban} size={13} />No proof yet — add a fact with a number in it
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ============ 06 MESSAGES ============ */}
      <Section def={sec("messages")} onEdit={onEdit}>
        <div className={s.panel}>
          {strategy.messages.tagline
            ? <div className={s.tagline}>{strategy.messages.tagline}</div>
            : <Empty what="No tagline yet" example="Precision, styled." />}
          {strategy.messages.supporting.map((m, i) => (
            <div key={i} className={s.msg}>
              {m.text}
              <span className={`${s.msgWho} ${m.stage ? "" : s.msgUnstaged}`}>
                {m.stage ? STAGE_LABEL[m.stage] : "No stage"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ 07 PRINCIPLES ============ */}
      <Section def={sec("principles")} onEdit={onEdit}>
        <div className={s.panel}>
          {strategy.principles.length === 0 ? (
            <Empty what="No principles yet" example="Show the work — we explain the engineering rather than asserting quality." />
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
      </Section>

      {/* ============ 08 BOUNDARIES ============ */}
      <Section def={sec("boundaries")} onEdit={onEdit}>
        <div className={`${s.panel} ${s.bnd}`}>
          <div className={s.grid2}>
            <div className={`${s.bcol} ${s.bcolNo}`}>
              <div className="k"><Ico d={I.x} size={14} /> We never</div>
              {strategy.boundaries.never.length === 0 ? (
                <ul><li><span>—</span>Nothing named yet. A model avoids a named mistake far better than it infers taste.</li></ul>
              ) : (
                <ul>{strategy.boundaries.never.map((n, i) => (
                  <li key={i}><span>✕</span><span style={{ fontWeight: 500 }}>{n.rule}
                    {n.reason && <span className={s.reason}> — because {n.reason}</span>}</span></li>
                ))}</ul>
              )}
            </div>
            <div className={`${s.bcol} ${s.bcolYes}`}>
              <div className="k"><Ico d={I.check} size={14} /> We always</div>
              {strategy.boundaries.always.length === 0 ? (
                <ul><li><span>—</span>Nothing named yet.</li></ul>
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
      </Section>

      {/* ============ 09 FOCUS ============ */}
      <Section def={sec("focus")} onEdit={onEdit}>
        <div className={s.panel}>
          {strategy.focus.goal ? (
            <div className={s.goal}>
              <span className={s.gico}><Ico d={I.flag} size={22} /></span>
              <div>
                <div className="k">Brand goal</div>
                <div className="v">{strategy.focus.goal}</div>
              </div>
            </div>
          ) : (
            <Empty what="No goal set" example="Become the default recommendation in professional salons by 2027." />
          )}
          {strategy.focus.priorities.map((p, i) => (
            <div key={p.label + i} className={s.pri}>
              <span className={s.ck}><Ico d={I.check} size={11} /></span>
              {p.label}
              <span className={s.priM}>{p.when}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ WHERE THIS GOES NEXT ============ */}
      <section className={s.sec}>
        <div className={s.sechead}><h2>Where this goes next</h2></div>
        <div className={s.next}>
          {([["Tone of voice", "How this strategy sounds", "/brand/tone-of-voice", s.n1, I.chat],
             ["Visual identity", "How it looks", "/brand/visual-identity", s.n2, I.img],
             ["Products", "What it is applied to", "/knowledge/products", s.n3, I.bag]] as const).map(
            ([t, v, href, cls, icon]) => (
              <Link key={href} href={href} className={s.ncard}>
                <span className={`${s.nico} ${cls}`}><Ico d={icon} size={19} /></span>
                <div>
                  <div className="t">{t}</div>
                  <div className="v">{v}</div>
                </div>
                <span className="ar"><Ico d={I.arr} size={16} /></span>
              </Link>
            ))}
        </div>

        <div className={s.usedby}>
          <span className={s.usedbyIc}><Ico d={I.brain} size={19} /></span>
          <div>
            <div className="t">Where Branditect uses this</div>
            <div className="v">
              Studio ▸ Write cites your proof points and obeys the boundaries. Create images reads
              the positioning. AI Chat answers from all of it. The more of this page is filled in,
              the less generic everything it produces becomes.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
