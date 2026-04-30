'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useBrand } from '@/lib/useBrand'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ContextSummary {
  brandName: string | null
  hasStrategy: boolean
  hasTone: boolean
  archetype: string | null
  voiceDescription: string | null
  personasCount: number
  productsCount: number
  topProducts: string[]
  competitorsCount: number
}

interface SocialStrategyRecord {
  id: string
  brand_id: string
  channels: string[]
  primary_goal: string | null
  secondary_goal: string | null
  capacity_volume: string | null
  production_setup: string | null
  reference_accounts: string[]
  anti_patterns: string[]
  status: string
}

type Phase = 'loading' | 'entry' | 'questions' | 'generating' | 'active'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CHANNELS = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'X', 'Threads', 'Facebook', 'Pinterest']
const GOALS = ['Awareness', 'Community', 'Authority', 'Leads', 'Sales', 'Recruiting']
const VOLUMES = ['3', '5', '7–10', '12–15', '20+']
const SETUPS = ['Just me', 'Me + freelancer', 'Internal team', 'Agency', 'Branditect produces it']
const ANTI_CHIPS = [
  'thirsty/desperate',
  'corporate/sterile',
  'trend-chasing',
  'preachy',
  'self-congratulating',
  'memey-for-the-sake-of-memes',
]

const QUESTIONS = [
  {
    key: 'channels' as const,
    field: 'channels',
    eyebrow: 'Q1 · Channels',
    title: 'Which platforms are you committing to for the next 90 days?',
    why: 'Strategy is platform-shaped. No TikTok scripts if you\'re not on TikTok.',
  },
  {
    key: 'goal' as const,
    field: 'primary_goal',
    eyebrow: 'Q2 · Primary goal',
    title: 'What is social actually doing for the business right now?',
    why: 'The same brand produces very different content if the goal shifts. Awareness content ≠ sales content.',
  },
  {
    key: 'capacity' as const,
    field: 'capacity_volume',
    eyebrow: 'Q3 · Realistic capacity',
    title: 'How much can you actually produce per week — and who\'s behind it?',
    why: 'Quality decay is the #1 reason social strategies fail. We won\'t propose 15 reels a week if one person on a laptop is making them.',
  },
  {
    key: 'refs' as const,
    field: 'reference_accounts',
    eyebrow: 'Q4 · Reference accounts',
    title: 'Name 3–5 accounts whose social you admire — in your space or adjacent.',
    why: 'Branditect studies their cadence, format mix, and topic patterns. Not to copy, to benchmark what good looks like in this category.',
  },
  {
    key: 'anti' as const,
    field: 'anti_patterns',
    eyebrow: 'Q5 · Anti-brand',
    title: 'What do you NOT want to look or sound like on social?',
    why: 'Knowing what to avoid is half of staying on-brand. This becomes a negative constraint the AI checks every social output against, forever.',
  },
] as const

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SocialStrategyPage() {
  const { brandId, brandName, loading: brandLoading } = useBrand()

  const [phase, setPhase] = useState<Phase>('loading')
  const [record, setRecord] = useState<SocialStrategyRecord | null>(null)
  const [context, setContext] = useState<ContextSummary | null>(null)
  const [qIdx, setQIdx] = useState(0)

  // Per-question working state
  const [channels, setChannels] = useState<string[]>([])
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [secondaryGoal, setSecondaryGoal] = useState('')
  const [volume, setVolume] = useState('')
  const [setup, setSetup] = useState('')
  const [refsText, setRefsText] = useState('')
  const [antiText, setAntiText] = useState('')
  const [antiChips, setAntiChips] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  /* ---- Initial load ---- */

  useEffect(() => {
    if (brandLoading) return
    if (!brandId || brandId === 'default') {
      setPhase('entry')
      return
    }

    fetch(`/api/social-strategy?brandId=${brandId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.context) setContext(res.context)
        if (res.record) {
          const r = res.record as SocialStrategyRecord
          setRecord(r)
          setChannels(r.channels || [])
          setPrimaryGoal(r.primary_goal || '')
          setSecondaryGoal(r.secondary_goal || '')
          setVolume(r.capacity_volume || '')
          setSetup(r.production_setup || '')
          setRefsText((r.reference_accounts || []).join('\n'))
          setAntiText('')
          setAntiChips(r.anti_patterns || [])
          if (r.status === 'active') {
            setPhase('active')
          } else {
            // Resume at the first un-answered question
            const idx = firstMissing(r)
            setQIdx(idx)
            setPhase(idx === -1 ? 'entry' : 'questions')
          }
        } else {
          setPhase('entry')
        }
      })
      .catch(() => setPhase('entry'))
  }, [brandId, brandLoading])

  function firstMissing(r: SocialStrategyRecord): number {
    if (!r.channels?.length) return 0
    if (!r.primary_goal) return 1
    if (!r.capacity_volume || !r.production_setup) return 2
    if (!r.reference_accounts?.length) return 3
    if (!r.anti_patterns?.length) return 4
    return -1
  }

  /* ---- Helpers ---- */

  const startStrategy = useCallback(async () => {
    if (!brandId) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/social-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', brandId }),
      })
      const json = await res.json()
      if (json.id) {
        setRecord({
          id: json.id,
          brand_id: brandId,
          channels: [],
          primary_goal: null,
          secondary_goal: null,
          capacity_volume: null,
          production_setup: null,
          reference_accounts: [],
          anti_patterns: [],
          status: 'in_progress',
        })
        setQIdx(0)
        setPhase('questions')
      } else {
        setError(json.error || 'Failed to start')
      }
    } catch {
      setError('Failed to start')
    } finally {
      setBusy(false)
    }
  }, [brandId])

  const saveField = useCallback(
    async (field: string, value: string | string[] | null) => {
      if (!record) return
      const res = await fetch('/api/social-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', id: record.id, field, value }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
    },
    [record]
  )

  const goNext = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      // Persist current question's value
      if (qIdx === 0) {
        if (channels.length === 0) {
          setError('Pick at least one platform.')
          setBusy(false)
          return
        }
        await saveField('channels', channels)
      } else if (qIdx === 1) {
        if (!primaryGoal) {
          setError('Pick a primary goal.')
          setBusy(false)
          return
        }
        await saveField('primary_goal', primaryGoal)
        await saveField('secondary_goal', secondaryGoal || null)
      } else if (qIdx === 2) {
        if (!volume || !setup) {
          setError('Both volume and production setup are required.')
          setBusy(false)
          return
        }
        // Pushback: 20+/week with "Just me"
        if (volume === '20+' && setup === 'Just me') {
          const ok = window.confirm(
            "20+ posts a week with one person almost always means quality decay within 4 weeks. We'd rather propose 10–12 with a stronger format mix. Keep 20+?"
          )
          if (!ok) {
            setVolume('12–15')
          }
        }
        await saveField('capacity_volume', volume === '20+' && setup === 'Just me' ? '12–15' : volume)
        await saveField('production_setup', setup)
      } else if (qIdx === 3) {
        const accounts = refsText
          .split(/\n|,/)
          .map((s) => s.trim().replace(/^@/, ''))
          .filter(Boolean)
        if (accounts.length < 3) {
          setError('Give us at least 3 accounts.')
          setBusy(false)
          return
        }
        if (accounts.length > 5) {
          setError('Cap is 5 accounts — pick your sharpest.')
          setBusy(false)
          return
        }
        await saveField('reference_accounts', accounts)
      } else if (qIdx === 4) {
        const free = antiText
          .split(/\n|,/)
          .map((s) => s.trim())
          .filter(Boolean)
        const all = Array.from(new Set([...antiChips, ...free]))
        if (all.length === 0) {
          setError('Tell us at least one anti-pattern — even just one chip.')
          setBusy(false)
          return
        }
        await saveField('anti_patterns', all)
      }

      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(qIdx + 1)
      } else {
        // Q5 finished → kick off (stub) generation
        setPhase('generating')
        await fetch('/api/social-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate', id: record!.id }),
        })
        // Step 2 will replace this with the real reveal screen.
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }, [qIdx, channels, primaryGoal, secondaryGoal, volume, setup, refsText, antiText, antiChips, saveField, record])

  const goBack = () => {
    setError('')
    if (qIdx > 0) setQIdx(qIdx - 1)
    else setPhase('entry')
  }

  /* ---- Render: loading ---- */

  if (phase === 'loading' || brandLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  /* ---- Render: active ---- */

  if (phase === 'active') {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12">
        <Link href="/dashboard" className="text-sm text-muted hover:text-brand-orange transition-colors">
          &larr; Back to Dashboard
        </Link>
        <div className="mt-8 inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFF2EE] text-[#ec5c36]">
          Social strategy active · synced with brand
        </div>
        <h1 className="text-[2.4rem] font-semibold text-ink mt-4 mb-2 leading-tight">
          {brandName}&apos;s social strategy
        </h1>
        <p className="text-[0.88rem] text-muted leading-relaxed mb-6">
          Step 2 ships the rendered Strategy Doc here — content pillars, platform style guides,
          30-day calendar, anti-pattern card. Your answers are saved.
        </p>
        <button
          onClick={() => {
            setPhase('questions')
            setQIdx(0)
          }}
          className="border border-outline-variant/15 rounded-[7px] px-3.5 py-2 text-[0.76rem] font-medium text-dark hover:border-brand-orange hover:text-brand-orange transition-colors"
        >
          Edit answers
        </button>
      </div>
    )
  }

  /* ---- Render: generating ---- */

  if (phase === 'generating') {
    return (
      <div className="flex flex-col h-full items-center justify-center px-8">
        <div className="max-w-xl text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF2EE] text-[#ec5c36] mb-6">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-ink mb-3">
            Branditect already knows your brand. Now it&apos;s deciding what you should post.
          </h2>
          <p className="text-sm text-muted mb-8">
            Reading your brand strategy → studying your reference accounts → cross-referencing your goals →
            building your pillars → drafting examples.
          </p>
          <p className="text-xs font-mono uppercase tracking-wider text-muted">
            Synthesis layer ships in step 2 — your answers are saved.
          </p>
          <button
            onClick={() => setPhase('active')}
            className="mt-8 px-5 py-2 rounded-lg border border-outline-variant/15 text-sm font-medium text-dark hover:bg-surface-container-low transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  /* ---- Render: entry ---- */

  if (phase === 'entry') {
    return (
      <div className="max-w-3xl mx-auto px-8 py-10">
        <Link href="/dashboard" className="text-sm text-muted hover:text-brand-orange transition-colors">
          &larr; Back to Dashboard
        </Link>

        <div className="mt-8">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted mb-3">
            Social Strategy Architect
          </div>
          <h1 className="text-[2.4rem] font-semibold text-ink leading-tight mb-3">
            Build your social media strategy in 5 questions.
          </h1>
          <p className="text-[0.95rem] text-muted leading-relaxed max-w-[640px] mb-8">
            Brand strategy answers <em>who we are</em>. BrandTone answers <em>how we sound</em>. This
            answers <em>what we post on Wednesday</em>. Branditect already knows most of it — we
            just need 5 things to fill the gaps.
          </p>
        </div>

        {/* What we already know */}
        <div className="border border-outline-variant/15 rounded-2xl p-6 mb-8 bg-surface-container-lowest">
          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted mb-4">
            What we&apos;re pulling from your library
          </div>
          <ul className="space-y-2.5">
            <ContextRow ok={!!context?.hasStrategy} label="Brand Strategy" detail={context?.archetype ? `archetype: ${context.archetype}` : context?.hasStrategy ? 'positioning, audience, competitors' : 'not set up yet'} />
            <ContextRow ok={!!context?.hasTone} label="Tone of Voice" detail={context?.voiceDescription ? truncate(context.voiceDescription, 80) : context?.hasTone ? 'voice rules, vocab' : 'not set up yet'} />
            <ContextRow ok={(context?.personasCount ?? 0) > 0} label="Audience personas" detail={context?.personasCount ? `${context.personasCount} personas` : 'no personas yet'} />
            <ContextRow ok={(context?.productsCount ?? 0) > 0} label="Product catalog" detail={context?.topProducts.length ? context.topProducts.slice(0, 3).join(', ') : 'no products yet'} />
            <ContextRow ok={(context?.competitorsCount ?? 0) > 0} label="Competitive frame" detail={context?.competitorsCount ? `${context.competitorsCount} competitors` : 'no competitors mapped'} />
          </ul>
          {(!context?.hasStrategy || !context?.hasTone) && (
            <p className="text-[0.78rem] text-muted mt-4 pt-4 border-t border-outline-variant/15">
              You can still proceed — but pillars and example posts get sharper once Brand Strategy and Tone of Voice are filled in.
            </p>
          )}
        </div>

        {/* Preview of the 5 questions */}
        <div className="mb-10">
          <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted mb-4">
            What we&apos;ll ask you
          </div>
          <ol className="space-y-2 list-decimal list-inside text-[0.88rem] text-dark">
            <li>Channels you&apos;re committing to for 90 days</li>
            <li>Primary goal social is doing for the business</li>
            <li>Realistic capacity — volume + who&apos;s behind it</li>
            <li>3–5 reference accounts to benchmark</li>
            <li>The anti-brand — what you don&apos;t want to look like</li>
          </ol>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={startStrategy}
          disabled={busy}
          className="px-6 py-3 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Starting…' : record ? 'Resume' : 'Begin'}
          <span className="ml-2">&rarr;</span>
        </button>
      </div>
    )
  }

  /* ---- Render: questions ---- */

  const q = QUESTIONS[qIdx]
  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <Link href="/dashboard" className="text-sm text-muted hover:text-brand-orange transition-colors">
        &larr; Back to Dashboard
      </Link>

      {/* Progress dots */}
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

      <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#ec5c36] mb-3">
        {q.eyebrow}
      </div>
      <h2 className="text-[1.7rem] font-semibold text-ink leading-tight mb-3">{q.title}</h2>
      <p className="text-[0.85rem] text-muted leading-relaxed mb-8 max-w-[600px]">
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted/70 mr-2">Why we ask</span>
        {q.why}
      </p>

      {/* Q1 — Channels */}
      {qIdx === 0 && (
        <div className="grid grid-cols-2 gap-2 mb-8">
          {CHANNELS.map((c) => {
            const on = channels.includes(c)
            return (
              <button
                key={c}
                onClick={() => setChannels((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                className={`px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
                  on
                    ? 'bg-[#FFF2EE] border-[#ec5c36] text-[#ec5c36] font-semibold'
                    : 'bg-white border-outline-variant/15 text-dark hover:border-[#ec5c36]/40'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      )}

      {/* Q2 — Goal */}
      {qIdx === 1 && (
        <div className="space-y-6 mb-8">
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted mb-2">
              Primary goal (pick one)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GOALS.map((g) => {
                const on = primaryGoal === g
                return (
                  <button
                    key={g}
                    onClick={() => setPrimaryGoal(g)}
                    className={`px-4 py-3 rounded-lg border text-sm transition-colors ${
                      on
                        ? 'bg-[#FFF2EE] border-[#ec5c36] text-[#ec5c36] font-semibold'
                        : 'bg-white border-outline-variant/15 text-dark hover:border-[#ec5c36]/40'
                    }`}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted mb-2">
              Secondary goal (optional)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GOALS.filter((g) => g !== primaryGoal).map((g) => {
                const on = secondaryGoal === g
                return (
                  <button
                    key={g}
                    onClick={() => setSecondaryGoal(on ? '' : g)}
                    className={`px-4 py-3 rounded-lg border text-sm transition-colors ${
                      on
                        ? 'bg-[#EBF5FC] border-[#87C5EA] text-[#315A72] font-semibold'
                        : 'bg-white border-outline-variant/15 text-dark hover:border-[#87C5EA]/60'
                    }`}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Q3 — Capacity */}
      {qIdx === 2 && (
        <div className="space-y-6 mb-8">
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted mb-2">
              Volume per week
            </div>
            <div className="flex flex-wrap gap-2">
              {VOLUMES.map((v) => {
                const on = volume === v
                return (
                  <button
                    key={v}
                    onClick={() => setVolume(v)}
                    className={`px-4 py-3 rounded-lg border text-sm transition-colors ${
                      on
                        ? 'bg-[#FFF2EE] border-[#ec5c36] text-[#ec5c36] font-semibold'
                        : 'bg-white border-outline-variant/15 text-dark hover:border-[#ec5c36]/40'
                    }`}
                  >
                    {v} posts
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted mb-2">
              Production setup
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SETUPS.map((s) => {
                const on = setup === s
                return (
                  <button
                    key={s}
                    onClick={() => setSetup(s)}
                    className={`px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
                      on
                        ? 'bg-[#FFF2EE] border-[#ec5c36] text-[#ec5c36] font-semibold'
                        : 'bg-white border-outline-variant/15 text-dark hover:border-[#ec5c36]/40'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Q4 — References */}
      {qIdx === 3 && (
        <div className="mb-8">
          <textarea
            value={refsText}
            onChange={(e) => setRefsText(e.target.value)}
            rows={6}
            placeholder={'@example_one\n@example_two\n@example_three'}
            className="w-full rounded-xl border border-outline-variant/15 bg-white px-4 py-3 text-sm text-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none font-mono"
          />
          <p className="text-[0.75rem] text-muted mt-2">One per line. 3 minimum, 5 maximum.</p>
        </div>
      )}

      {/* Q5 — Anti-brand */}
      {qIdx === 4 && (
        <div className="space-y-5 mb-8">
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted mb-2">
              Common pitfalls (pick any)
            </div>
            <div className="flex flex-wrap gap-2">
              {ANTI_CHIPS.map((c) => {
                const on = antiChips.includes(c)
                return (
                  <button
                    key={c}
                    onClick={() =>
                      setAntiChips((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))
                    }
                    className={`px-3 py-1.5 rounded-full border text-[0.78rem] transition-colors ${
                      on
                        ? 'bg-[#FFF2EE] border-[#ec5c36] text-[#ec5c36] font-semibold'
                        : 'bg-white border-outline-variant/15 text-dark hover:border-[#ec5c36]/40'
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted mb-2">
              Anything else? (one per line)
            </div>
            <textarea
              value={antiText}
              onChange={(e) => setAntiText(e.target.value)}
              rows={4}
              placeholder={'fake-vulnerable founder posts\nLinkedIn-bait listicles'}
              className="w-full rounded-xl border border-outline-variant/15 bg-white px-4 py-3 text-sm text-dark placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange/40 resize-none"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goBack}
          disabled={busy}
          className="px-4 py-2 rounded-lg border border-outline-variant/15 text-sm font-medium text-dark hover:bg-surface-container-low disabled:opacity-50 transition-colors"
        >
          &larr; Back
        </button>
        <button
          onClick={goNext}
          disabled={busy}
          className="px-6 py-3 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-colors"
        >
          {qIdx === QUESTIONS.length - 1 ? 'Generate strategy' : 'Continue'} <span className="ml-1">&rarr;</span>
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                      */
/* ------------------------------------------------------------------ */

function ContextRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2.5 text-[0.85rem] text-dark">
        <span
          className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-[#ec5c36]' : 'bg-outline-variant/40'}`}
        />
        {label}
      </span>
      <span className="text-[0.78rem] text-muted truncate max-w-[60%] text-right">{detail}</span>
    </li>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
