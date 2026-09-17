'use client'

/**
 * Brand ▸ Channels — five questions that produce a week of posts.
 *
 * It used to ask five questions and then say "the synthesis layer ships in
 * step 2": the answers were stored and nothing was ever made from them, so the
 * page could be completed and still leave a founder with nothing to post.
 *
 * The five are now the ones that decide what goes out: which two channels, what
 * social is for, how often you can really post, which content pillars, and who
 * you are talking to. The last two start from the brand strategy rather than
 * from a blank field — a brainstorm that opens on an empty page is the one
 * people abandon — and the strategy is required before any of it, because a
 * plan written without positioning is a plan about nobody.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useBrand } from '@/lib/useBrand'
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";
import {
  CHANNELS, CADENCES, MAX_CHANNELS, channelLabel, weekStart, weekOnWeek, showHook,
  type Pillar, type AudienceProfile, type SocialPlan, type WeekMetrics,
} from "@/lib/social";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ContextSummary {
  hasStrategy: boolean
  hasTone: boolean
  archetype: string | null
  voiceDescription: string | null
}

interface SocialStrategyRecord {
  id: string
  brand_id: string
  channels: string[]
  primary_goal: string | null
  capacity_volume: string | null
  pillars?: Pillar[] | null
  audience?: AudienceProfile[] | null
  plan?: SocialPlan | null
  generated_at?: string | null
  status: string
}

type Phase = 'loading' | 'gate' | 'entry' | 'questions' | 'generating' | 'plan'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

// Saved as the English value and compared as one, so it stays English; only
// what renders is looked up.
const GOALS = ['Awareness', 'Community', 'Authority', 'Leads', 'Sales', 'Recruiting']
const GOAL_LABEL: Record<string, StringKey> = {
  Awareness: 'goal.awareness', Community: 'goal.community', Authority: 'goal.authority',
  Leads: 'goal.leads', Sales: 'goal.sales', Recruiting: 'goal.recruiting',
}

const QUESTIONS = [
  { key: 'channels', eyebrow: 'channels.eyebrow1', title: 'channels.q1', why: 'channels.q1Why' },
  { key: 'goal', eyebrow: 'channels.eyebrow2', title: 'channels.q2', why: 'channels.q2Why' },
  { key: 'cadence', eyebrow: 'channels.eyebrow3', title: 'channels.q3', why: 'channels.q3Why' },
  { key: 'pillars', eyebrow: 'channels.eyebrow4', title: 'channels.q4', why: 'channels.q4Why' },
  { key: 'audience', eyebrow: 'channels.eyebrow5', title: 'channels.q5', why: 'channels.q5Why' },
] as const

const CHIP = 'px-4 py-3 rounded-lg border text-sm text-left transition-colors'
const CHIP_ON = 'bg-[#FFF2EE] border-[#ec5c36] text-[#ec5c36] font-semibold'
const CHIP_OFF = 'bg-white border-outline-variant/15 text-dark hover:border-[#ec5c36]/40'
const FIELD = 'w-full rounded-lg border border-outline-variant/15 bg-white px-3 py-2 text-sm text-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange/40'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SocialStrategyPage() {
  const t = useT()
  const { brandId, brandName, loading: brandLoading } = useBrand()

  const [phase, setPhase] = useState<Phase>('loading')
  const [record, setRecord] = useState<SocialStrategyRecord | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [context, setContext] = useState<ContextSummary | null>(null)
  const [qIdx, setQIdx] = useState(0)

  const [channels, setChannels] = useState<string[]>([])
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [cadence, setCadence] = useState('')
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [audience, setAudience] = useState<AudienceProfile[]>([])
  const [plan, setPlan] = useState<SocialPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const suggested = useRef(false)

  /* ---- Initial load ---- */

  useEffect(() => {
    if (brandLoading) return
    if (!brandId || brandId === 'default') { setPhase('entry'); return }

    let cancelled = false
    async function loadAll() {
      try {
        const res = await authedFetch(`/api/social-strategy?brandId=${brandId}`)
        const recordRes = await res.json().catch(() => ({ error: String(res.status) }))
        if (cancelled) return
        // A failed read is said out loud. It used to be discarded, which
        // rendered the empty state — "you have not started yet" — to a brand
        // whose answers were sitting in the table all along.
        if (recordRes.error) { setLoadError(recordRes.error); setPhase('entry'); return }

        setContext(recordRes.context ?? null)
        const row: SocialStrategyRecord | null = recordRes.record ?? null
        setRecord(row)
        if (row) {
          setChannels(Array.isArray(row.channels) ? row.channels : [])
          setPrimaryGoal(row.primary_goal ?? '')
          setCadence(row.capacity_volume ?? '')
          setPillars(Array.isArray(row.pillars) ? row.pillars : [])
          setAudience(Array.isArray(row.audience) ? row.audience : [])
          setPlan(row.plan ?? null)
        }

        // The strategy comes first, and the page says so rather than letting
        // someone answer five questions for a plan that cannot be written.
        if (recordRes.context && !recordRes.context.hasStrategy) { setPhase('gate'); return }
        setPhase(row?.plan ? 'plan' : 'entry')
      } catch (e) {
        if (!cancelled) { setLoadError(e instanceof Error ? e.message : String(e)); setPhase('entry') }
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [brandId, brandLoading])

  /* ---- Saving ---- */

  const post = useCallback(async (body: Record<string, unknown>) => {
    const res = await authedFetch('/api/social-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, ...body }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.errorKey ? t(json.errorKey as StringKey) : (json.error ?? String(res.status)))
    return json
  }, [brandId, t])

  const saveField = useCallback(async (field: string, value: unknown) => {
    if (!record) return
    await post({ action: 'answer', id: record.id, field, value })
  }, [record, post])

  const startStrategy = useCallback(async () => {
    if (!brandId) return
    setBusy(true); setError('')
    try {
      const json = await post({ action: 'start', brandId })
      setRecord({
        id: json.id, brand_id: brandId, channels: [], primary_goal: null,
        capacity_volume: null, pillars: [], audience: [], status: 'in_progress',
      })
      setQIdx(0)
      setPhase('questions')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('channels.errStart'))
    } finally { setBusy(false) }
  }, [brandId, post, t])

  /**
   * What the strategy already says, fetched once, when the brainstorms open.
   *
   * No model call: every suggestion is a field the founder wrote or approved.
   * It never overwrites — a pillar someone has edited stays edited.
   */
  const fillSuggestions = useCallback(async () => {
    if (suggested.current) return
    suggested.current = true
    try {
      const json = await post({ action: 'suggest' })
      setPillars((prev) => (prev.length ? prev : (json.pillars ?? [])))
      setAudience((prev) => (prev.length ? prev : (json.audience ?? [])))
    } catch {
      // A failed suggestion is not a failed question: the fields still work.
    }
  }, [post])

  useEffect(() => {
    if (phase === 'questions' && qIdx >= 3) fillSuggestions()
  }, [phase, qIdx, fillSuggestions])

  const generate = useCallback(async () => {
    if (!record) return
    setPhase('generating'); setError('')
    try {
      const json = await post({ action: 'generate', id: record.id })
      setPlan(json.plan ?? null)
      setPhase('plan')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('social.planFailed'))
      setPhase('questions')
      setQIdx(QUESTIONS.length - 1)
    }
  }, [record, post, t])

  const next = useCallback(async () => {
    setBusy(true); setError('')
    try {
      if (qIdx === 0) await saveField('channels', channels)
      if (qIdx === 1) await saveField('primary_goal', primaryGoal || null)
      if (qIdx === 2) await saveField('capacity_volume', cadence || null)
      if (qIdx === 3) await saveField('pillars', pillars)
      if (qIdx === 4) { await saveField('audience', audience); await generate(); return }
      setQIdx((i) => i + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('channels.errSave'))
    } finally { setBusy(false) }
  }, [qIdx, channels, primaryGoal, cadence, pillars, audience, saveField, generate, t])

  /* ---- Render ---- */

  if (phase === 'loading' || brandLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const errorBanner = loadError ? (
    <div
      role="alert"
      data-channels-error
      className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[0.85rem] text-red-700"
    >
      {t('channels.couldNotLoad', { error: loadError })}
    </div>
  ) : null

  /* ---- The strategy comes first ---- */

  if (phase === 'gate') {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12">
        <Link href="/home" className="text-sm text-muted hover:text-brand-orange transition-colors">
          {t('strategy.backToDashboard')}
        </Link>
        <h1 className="text-[2.2rem] font-semibold text-ink mt-8 mb-3 leading-tight">
          {t('social.needStrategy')}
        </h1>
        <p className="text-[0.9rem] text-muted leading-relaxed max-w-[60ch]">
          {t('social.needStrategyBody')}
        </p>
        <Link
          href="/brand/strategy"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-colors"
        >
          {t('social.toStrategy')} <span aria-hidden="true">→</span>
        </Link>
        {errorBanner}
      </div>
    )
  }

  /* ---- The plan ---- */

  if (phase === 'plan' && plan) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12">
        <Link href="/home" className="text-sm text-muted hover:text-brand-orange transition-colors">
          {t('strategy.backToDashboard')}
        </Link>

        <div className="mt-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[2.2rem] font-semibold text-ink leading-tight">{t('social.planTitle')}</h1>
            <p className="text-[0.85rem] text-muted mt-1">{t('social.planWhy')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generate}
              disabled={busy}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50 transition-colors"
            >
              {t('social.regenerate')}
            </button>
            <button
              onClick={() => { setPhase('questions'); setQIdx(0) }}
              className="rounded-xl border border-outline-variant/15 px-4 py-2 text-sm font-medium text-dark hover:border-brand-orange hover:text-brand-orange transition-colors"
            >
              {t('social.editAnswers')}
            </button>
          </div>
        </div>

        {plan.summary && (
          <p className="mt-5 text-[0.95rem] leading-relaxed text-dark bg-white rounded-xl border border-outline-variant/15 px-5 py-4">
            {plan.summary}
          </p>
        )}

        {plan.mix.length > 0 && (
          <div className="mt-6">
            <div className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-muted mb-2">{t('social.theMix')}</div>
            <div className="flex flex-wrap gap-2">
              {plan.mix.map((m, i) => (
                <span key={i} className="rounded-full bg-[#FFF2EE] px-3 py-1.5 text-[0.75rem] font-semibold text-[#ec5c36]">
                  {m.pillar}{m.share ? ` · ${m.share}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 space-y-3">
          {plan.week.map((p, i) => (
            <article key={i} className="rounded-xl border border-outline-variant/15 bg-white p-5">
              <div className="flex items-center gap-2 flex-wrap text-[0.7rem] font-mono uppercase tracking-wider text-muted">
                <span className="font-bold text-[#ec5c36]">{p.day}</span>
                <span>· {channelLabel(p.channel)}</span>
                {p.pillar && <span>· {p.pillar}</span>}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(p.copy)
                    setCopied(i)
                    setTimeout(() => setCopied((c) => (c === i ? null : c)), 1800)
                  }}
                  className="ml-auto rounded-lg border border-outline-variant/15 px-2.5 py-1 text-[0.7rem] font-semibold text-dark hover:border-brand-orange hover:text-brand-orange transition-colors"
                >
                  {copied === i ? t('social.copied') : t('social.copyPost')}
                </button>
              </div>
              {p.subject && <h3 className="mt-2 text-[1.05rem] font-semibold text-ink">{p.subject}</h3>}
              {showHook(p.hook, p.copy) && (
                <p className="mt-2 text-sm font-semibold text-dark">
                  <span className="text-[0.65rem] font-mono uppercase tracking-wider text-muted mr-2">{t('social.hook')}</span>
                  {p.hook}
                </p>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dark">{p.copy}</p>
            </article>
          ))}
        </div>

        {plan.avoid.length > 0 && (
          <div className="mt-7 rounded-xl border border-outline-variant/15 bg-white p-5">
            <div className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-muted mb-2">{t('social.avoidThisWeek')}</div>
            <ul className="space-y-1.5">
              {plan.avoid.map((a, i) => (
                <li key={i} className="text-sm text-dark flex gap-2"><span className="text-[#c8402a]">✕</span>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {record?.generated_at && (
          <p className="mt-4 text-[0.7rem] font-mono uppercase tracking-wider text-muted">
            {t('social.generatedOn', { date: new Date(record.generated_at).toLocaleDateString() })}
          </p>
        )}

        <MetricsCard brandId={brandId} channels={channels} />
        {error && <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{error}</div>}
        {errorBanner}
      </div>
    )
  }

  /* ---- Writing the week ---- */

  if (phase === 'generating') {
    return (
      <div className="flex flex-col h-full items-center justify-center px-8">
        <div className="max-w-xl text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF2EE] text-[#ec5c36] mb-6">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-ink mb-3">{t('social.regenerating')}</h2>
          <p className="text-sm text-muted">{t('channels.working')}</p>
        </div>
      </div>
    )
  }

  /* ---- Entry ---- */

  if (phase === 'entry') {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12">
        <Link href="/home" className="text-sm text-muted hover:text-brand-orange transition-colors">
          {t('strategy.backToDashboard')}
        </Link>
        <div className="mt-8 inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFF2EE] text-[#ec5c36]">
          {t('channels.architect')}
        </div>
        <h1 className="text-[2.4rem] font-semibold text-ink mt-4 mb-3 leading-tight">
          {t('channels.brandSocialStrategy', { brand: brandName })}
        </h1>
        <p className="text-[0.9rem] text-muted leading-relaxed max-w-[62ch]">
          {t('channels.fiveQuestions')}
        </p>
        <div className="mt-6 rounded-xl border border-outline-variant/15 bg-white px-5 py-4">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-muted mb-2">
            {t('channels.pullingFrom')}
          </div>
          <ContextRow ok={Boolean(context?.hasStrategy)} label={t('nav.brand.strategy')} detail={context?.archetype ?? ''} />
          <ContextRow ok={Boolean(context?.hasTone)} label={t('nav.brand.tone')} detail={truncate(context?.voiceDescription ?? '', 60)} />
        </div>
        <button
          onClick={startStrategy}
          disabled={busy}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50 transition-colors"
        >
          {record ? t('social.editAnswers') : t('channels.begin')} <span aria-hidden="true">→</span>
        </button>
        {error && <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{error}</div>}
        {errorBanner}
      </div>
    )
  }

  /* ---- The five questions ---- */

  const q = QUESTIONS[qIdx]
  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <Link href="/home" className="text-sm text-muted hover:text-brand-orange transition-colors">
        {t('strategy.backToDashboard')}
      </Link>

      <div className="flex items-center gap-1.5 mt-6 mb-8">
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === qIdx ? 'w-8 bg-brand-orange' : i < qIdx ? 'w-4 bg-brand-orange/40' : 'w-4 bg-outline-variant/30'
            }`}
          />
        ))}
        <span className="ml-3 text-[0.7rem] font-mono uppercase tracking-wider text-muted">
          {qIdx + 1} / {QUESTIONS.length}
        </span>
      </div>

      <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#ec5c36] mb-3">{t(q.eyebrow)}</div>
      <h2 className="text-[1.7rem] font-semibold text-ink leading-tight mb-3">{t(q.title)}</h2>
      <p className="text-[0.85rem] text-muted leading-relaxed mb-8 max-w-[600px]">
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted/70 mr-2">{t('channels.whyWeAsk')}</span>
        {t(q.why)}
      </p>

      {/* Q1 — two channels at most */}
      {qIdx === 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {CHANNELS.map((c) => {
              const on = channels.includes(c.id)
              const full = channels.length >= MAX_CHANNELS && !on
              return (
                <button
                  key={c.id}
                  disabled={full}
                  onClick={() => setChannels((prev) => (on ? prev.filter((x) => x !== c.id) : [...prev, c.id]))}
                  className={`${CHIP} ${on ? CHIP_ON : CHIP_OFF} ${full ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          <p className="text-[0.75rem] font-mono uppercase tracking-wider text-muted mb-8">
            {t('channels.maxTwo', { count: channels.length })}
          </p>
        </>
      )}

      {/* Q2 — what social is for */}
      {qIdx === 1 && (
        <div className="grid grid-cols-2 gap-2 mb-8">
          {GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setPrimaryGoal(g)}
              className={`${CHIP} ${primaryGoal === g ? CHIP_ON : CHIP_OFF}`}
            >
              {t(GOAL_LABEL[g])}
            </button>
          ))}
        </div>
      )}

      {/* Q3 — how often, honestly */}
      {qIdx === 2 && (
        <div className="grid grid-cols-2 gap-2 mb-8">
          {CADENCES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCadence(c.id)}
              className={`${CHIP} ${cadence === c.id ? CHIP_ON : CHIP_OFF}`}
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      )}

      {/* Q4 — the pillars, as a brainstorm */}
      {qIdx === 3 && (
        <PillarEditor pillars={pillars} setPillars={setPillars} />
      )}

      {/* Q5 — the people */}
      {qIdx === 4 && (
        <AudienceEditor audience={audience} setAudience={setAudience} />
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-outline-variant/15 pt-6">
        <button
          onClick={() => (qIdx === 0 ? setPhase('entry') : setQIdx((i) => i - 1))}
          className="rounded-lg border border-outline-variant/15 px-3.5 py-2 text-[0.8rem] font-medium text-dark hover:border-brand-orange hover:text-brand-orange transition-colors"
        >
          ← {t('strategy.back')}
        </button>
        <button
          onClick={next}
          disabled={busy || (qIdx === 0 && channels.length === 0)}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40 transition-colors"
        >
          {qIdx === QUESTIONS.length - 1 ? t('channels.generate') : t('common.continue')}
          <span className="ml-1" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Q4 — content pillars                                               */
/* ------------------------------------------------------------------ */

function PillarEditor({
  pillars, setPillars,
}: { pillars: Pillar[]; setPillars: (fn: (prev: Pillar[]) => Pillar[]) => void }) {
  const t = useT()
  const [name, setName] = useState('')
  const [why, setWhy] = useState('')

  const add = () => {
    if (!name.trim()) return
    setPillars((prev) => [...prev, { name: name.trim(), why: why.trim(), subjects: [], added: true }])
    setName(''); setWhy('')
  }

  return (
    <div className="mb-8">
      {pillars.length > 0 && (
        <div className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-muted mb-3">
          {t('social.pillarsFromStrategy')}
        </div>
      )}
      <div className="space-y-3">
        {pillars.map((p, i) => (
          <div key={i} className="rounded-xl border border-outline-variant/15 bg-white p-4">
            <div className="flex items-start gap-3">
              <input
                className={`${FIELD} font-semibold`}
                value={p.name}
                onChange={(e) => setPillars((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                placeholder={t('social.pillarName')}
              />
              <button
                onClick={() => setPillars((prev) => prev.filter((_, j) => j !== i))}
                className="shrink-0 rounded-lg border border-outline-variant/15 px-2.5 py-2 text-[0.7rem] font-semibold text-muted hover:border-[#c8402a] hover:text-[#c8402a] transition-colors"
              >
                {t('social.remove')}
              </button>
            </div>
            <input
              className={`${FIELD} mt-2`}
              value={p.why}
              onChange={(e) => setPillars((prev) => prev.map((x, j) => (j === i ? { ...x, why: e.target.value } : x)))}
              placeholder={t('social.pillarWhy')}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {(p.subjects ?? []).map((s, j) => (
                <span key={j} className="inline-flex items-center gap-2 rounded-full bg-[#FFF2EE] px-3 py-1.5 text-[0.75rem] font-semibold text-[#ec5c36]">
                  {s}
                  <button
                    aria-label={t('social.remove')}
                    onClick={() => setPillars((prev) => prev.map((x, k) => (k === i ? { ...x, subjects: x.subjects.filter((_, m) => m !== j) } : x)))}
                    className="text-[#ec5c36]/70 hover:text-[#ec5c36]"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <SubjectAdder onAdd={(s) => setPillars((prev) => prev.map((x, k) => (k === i ? { ...x, subjects: [...(x.subjects ?? []), s] } : x)))} />
            </div>
          </div>
        ))}
      </div>

      {pillars.length === 0 && (
        <p className="text-sm text-muted mb-4">{t('social.noPillarsYet')}</p>
      )}

      <div className="mt-4 rounded-xl border border-dashed border-outline-variant/30 p-4">
        <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('social.pillarName')} />
        <input className={`${FIELD} mt-2`} value={why} onChange={(e) => setWhy(e.target.value)} placeholder={t('social.pillarWhy')} />
        <button
          onClick={add}
          disabled={!name.trim()}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-[0.8rem] font-semibold text-white hover:brightness-110 disabled:opacity-40 transition-colors"
        >
          + {t('social.addPillar')}
        </button>
      </div>
    </div>
  )
}

function SubjectAdder({ onAdd }: { onAdd: (subject: string) => void }) {
  const t = useT()
  const [value, setValue] = useState('')
  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        className="rounded-full border border-outline-variant/15 px-3 py-1.5 text-[0.75rem] text-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) { onAdd(value.trim()); setValue('') } }}
        placeholder={t('social.subjectPlaceholder')}
      />
      <button
        onClick={() => { if (value.trim()) { onAdd(value.trim()); setValue('') } }}
        className="rounded-full border border-outline-variant/15 px-2.5 py-1.5 text-[0.75rem] font-semibold text-muted hover:border-brand-orange hover:text-brand-orange transition-colors"
      >
        + {t('social.addSubject')}
      </button>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Q5 — the people                                                    */
/* ------------------------------------------------------------------ */

function AudienceEditor({
  audience, setAudience,
}: { audience: AudienceProfile[]; setAudience: (fn: (prev: AudienceProfile[]) => AudienceProfile[]) => void }) {
  const t = useT()
  const [draft, setDraft] = useState<AudienceProfile>({ name: '', role: '', wants: '', whereTheyAre: '' })

  return (
    <div className="mb-8">
      {audience.length > 0 && (
        <div className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-muted mb-3">
          {t('social.audienceFromStrategy')}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {audience.map((a, i) => (
          <div key={i} className="rounded-xl border border-outline-variant/15 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <input
                className={`${FIELD} font-semibold`}
                value={a.name}
                onChange={(e) => setAudience((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                placeholder={t('social.personName')}
              />
              <button
                onClick={() => setAudience((prev) => prev.filter((_, j) => j !== i))}
                className="shrink-0 rounded-lg border border-outline-variant/15 px-2.5 py-2 text-[0.7rem] font-semibold text-muted hover:border-[#c8402a] hover:text-[#c8402a] transition-colors"
              >
                {t('social.remove')}
              </button>
            </div>
            <input className={`${FIELD} mt-2`} value={a.role} placeholder={t('social.personRole')}
              onChange={(e) => setAudience((prev) => prev.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} />
            <input className={`${FIELD} mt-2`} value={a.wants} placeholder={t('social.personWants')}
              onChange={(e) => setAudience((prev) => prev.map((x, j) => (j === i ? { ...x, wants: e.target.value } : x)))} />
            <input className={`${FIELD} mt-2`} value={a.whereTheyAre} placeholder={t('social.personWhere')}
              onChange={(e) => setAudience((prev) => prev.map((x, j) => (j === i ? { ...x, whereTheyAre: e.target.value } : x)))} />
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-outline-variant/30 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={FIELD} value={draft.name} placeholder={t('social.personName')}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <input className={FIELD} value={draft.role} placeholder={t('social.personRole')}
            onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))} />
          <input className={FIELD} value={draft.wants} placeholder={t('social.personWants')}
            onChange={(e) => setDraft((d) => ({ ...d, wants: e.target.value }))} />
          <input className={FIELD} value={draft.whereTheyAre} placeholder={t('social.personWhere')}
            onChange={(e) => setDraft((d) => ({ ...d, whereTheyAre: e.target.value }))} />
        </div>
        <button
          onClick={() => {
            if (!draft.name.trim() && !draft.role.trim()) return
            setAudience((prev) => [...prev, { ...draft, added: true }])
            setDraft({ name: '', role: '', wants: '', whereTheyAre: '' })
          }}
          disabled={!draft.name.trim() && !draft.role.trim()}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-[0.8rem] font-semibold text-white hover:brightness-110 disabled:opacity-40 transition-colors"
        >
          + {t('social.addPerson')}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  The metrics card                                                   */
/* ------------------------------------------------------------------ */

/**
 * Typed in by hand, and the card says so.
 *
 * Reading these from the platforms means an app registration and a stored
 * token per channel, which is a different piece of work. What is worth
 * watching does not change when the numbers start arriving on their own, so
 * the week filled in now is the week the next phase will compare against.
 */
function MetricsCard({ brandId, channels }: { brandId: string; channels: string[] }) {
  const t = useT()
  const [weeks, setWeeks] = useState<WeekMetrics[]>([])
  const [channel, setChannel] = useState(channels[0] ?? CHANNELS[0].id)
  const [week, setWeek] = useState(() => {
    // Last week, not this one: you report a week that has finished.
    const d = new Date(); d.setDate(d.getDate() - 7)
    return weekStart(d)
  })
  const [form, setForm] = useState({ posts: '', followers: '', reach: '', engagements: '', note: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await authedFetch(`/api/social-metrics?brandId=${brandId}`)
      const json = await res.json().catch(() => ({}))
      if (json.errorKey) { setError(t(json.errorKey as StringKey)); return }
      setWeeks(json.weeks ?? [])
    } catch { /* the card still works; the history is what is missing */ }
  }, [brandId, t])

  useEffect(() => { if (brandId) load() }, [brandId, load])

  const current = weeks.find((w) => w.week_start === week && w.channel === channel) ?? null
  const previousWeek = (() => {
    const d = new Date(`${week}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 7)
    return d.toISOString().slice(0, 10)
  })()
  const previous = weeks.find((w) => w.week_start === previousWeek && w.channel === channel) ?? null
  const change = weekOnWeek(current, previous)

  async function save() {
    setError('')
    try {
      const res = await authedFetch('/api/social-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, week_start: week, channel, ...form }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.errorKey ? t(json.errorKey as StringKey) : (json.error ?? String(res.status))); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const field = (key: keyof typeof form, labelKey: StringKey, delta: number | null) => (
    <label className="block">
      <span className="text-[0.65rem] font-mono uppercase tracking-wider text-muted">
        {t(labelKey)}
        {delta !== null && delta !== 0 && (
          <span className={delta > 0 ? 'ml-2 text-[#1c7a48]' : 'ml-2 text-[#c8402a]'}>
            {delta > 0 ? '+' : ''}{delta} {t('social.vsLastWeek')}
          </span>
        )}
      </span>
      <input
        type="number"
        inputMode="numeric"
        className={`${FIELD} mt-1`}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </label>
  )

  return (
    <section className="mt-10 rounded-xl border border-outline-variant/15 bg-white p-5">
      <h2 className="text-[1.1rem] font-semibold text-ink">{t('social.metricsTitle')}</h2>
      <p className="mt-1 text-[0.8rem] leading-relaxed text-muted max-w-[62ch]">{t('social.metricsWhy')}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-[0.65rem] font-mono uppercase tracking-wider text-muted">{t('social.weekOf', { date: '' })}</span>
          <input type="date" className={`${FIELD} mt-1`} value={week} onChange={(e) => setWeek(e.target.value)} />
        </label>
        <div className="flex gap-2">
          {(channels.length ? channels : CHANNELS.map((c) => c.id)).slice(0, 4).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`rounded-lg border px-3 py-2 text-[0.8rem] font-semibold transition-colors ${
                channel === c ? CHIP_ON : CHIP_OFF
              }`}
            >
              {channelLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {field('posts', 'social.posts', change.posts)}
        {field('followers', 'social.followers', change.followers)}
        {field('reach', 'social.reach', change.reach)}
        {field('engagements', 'social.engagements', change.engagements)}
      </div>

      <input
        className={`${FIELD} mt-3`}
        value={form.note}
        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        placeholder={t('social.metricsNote')}
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-lg bg-primary px-4 py-2 text-[0.8rem] font-semibold text-white hover:brightness-110 transition-colors"
        >
          {t('social.saveWeek')}
        </button>
        {saved && <span className="text-[0.8rem] font-semibold text-[#1c7a48]">{t('social.weekSaved')}</span>}
        {weeks.length === 0 && !saved && <span className="text-[0.8rem] text-muted">{t('social.noWeeksYet')}</span>}
      </div>

      {error && <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{error}</div>}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function ContextRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-[0.82rem]">
      <span className={ok ? 'text-[#1c7a48]' : 'text-muted'}>{ok ? '✓' : '—'}</span>
      <span className="font-semibold text-dark">{label}</span>
      {detail && <span className="text-muted truncate">{detail}</span>}
    </div>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}
