'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useBrand } from '@/lib/useBrand'

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface ContentPillar { name: string; description: string; example_topics: string[]; mix_type: string }
interface Platform { name: string; cadence: string; best_times: string; primary_formats: string[]; content_mix: { educational: number; entertaining: number; promotional: number; community: number }; kpis: { follower_growth: string; engagement_rate: string; primary_metric: string } }
interface ContentIdea { platform: string; format: string; idea: string; pillar: string }
interface ActionDay { day: number; task: string; type: string }
interface Strategy {
  brand_summary: string
  content_pillars: ContentPillar[]
  platforms: Platform[]
  engagement_playbook: { comment_strategy: string; dm_workflow: string; ugc: string; community_ritual: string }
  growth_tactics: { hashtags: string; collaborations: string; paid_boost: string; cross_promotion: string }
  content_ideas: ContentIdea[]
  action_plan: ActionDay[]
  inspirational_brands: string[]
}

/* ── Questions ──────────────────────────────────────────────────────────────── */

const QS = [
  { id: 'goals', step: 'Goals', q: 'What are your top 1-3 business goals for organic social media?', hint: 'e.g. Build brand awareness, drive sign-ups, grow a creator community.', type: 'textarea' as const, ph: 'e.g. Increase brand awareness among 18-30 year olds, drive sign-ups, build community...' },
  { id: 'audience', step: 'Audience', q: 'Describe your ideal customer in detail.', hint: 'Age, interests, pain points, platforms they use.', type: 'textarea' as const, ph: 'e.g. 20-32 year olds passionate about streaming, frustrated by generic phone plans...' },
  { id: 'voice', step: 'Voice', q: 'What is your brand\'s social media personality?', hint: 'Select all that apply.', type: 'chips' as const, opts: ['Bold & Direct', 'Friendly & Witty', 'Inspiring', 'Playful & Fun', 'Professional', 'Raw & Authentic', 'Premium', 'Community-Led', 'Edgy', 'Warm & Supportive'] },
  { id: 'pillars', step: 'Themes', q: 'What themes should your brand be known for?', hint: 'List 3-5 topics your audience cares about.', type: 'textarea' as const, ph: 'e.g. Streaming culture, creator economy, mobile tips, community spotlights...' },
  { id: 'competitors', step: 'Competitors', q: 'Name 2-3 competitors. What do you like or dislike about their social?', hint: 'Spotting gaps helps find angles where your brand stands out.', type: 'textarea' as const, ph: 'e.g. Brand X has strong product content but feels cold. We want warmer and more specific...' },
  { id: 'current', step: 'Current', q: 'What does your current social media presence look like?', hint: 'Handles, follower counts, posting frequency. Starting fresh? Say so.', type: 'textarea' as const, ph: 'e.g. @brand on Instagram with 1.2K followers, posting 2x/week. No TikTok yet...' },
  { id: 'resources', step: 'Resources', q: 'What is your capacity for social content?', hint: 'Be realistic - we build a strategy that fits your bandwidth.', type: 'chips' as const, opts: ['Solo founder', '1-2 person team', 'Small team (3-5)', 'Dedicated social team', 'Agency support', '2-3 hrs/week', '5-10 hrs/week', '15+ hrs/week'] },
  { id: 'platforms', step: 'Platforms', q: 'Which platforms should this strategy cover?', hint: 'Select all that are relevant.', type: 'platforms' as const, opts: ['Instagram', 'TikTok', 'LinkedIn', 'Twitter/X', 'YouTube', 'Facebook'] },
]

const GEN_STEPS = ['Defining content pillars', 'Setting platform cadences', 'Mapping content mix', 'Building engagement playbook', 'Crafting growth tactics + KPIs', 'Writing 14-day action plan']
const NAV_SECTIONS = ['Pillars', 'Platforms', 'Formats', 'Playbook', 'Growth', 'KPIs', '14-Day Plan', 'Ideas']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TYPE_COLORS: Record<string, string> = { setup: '#EFF6FF', content: '#F0FDF4', engage: '#FFFBEB', review: '#FAF5FF' }
const TYPE_TEXT: Record<string, string> = { setup: '#1D4ED8', content: '#15803D', engage: '#92400E', review: '#6B21A8' }

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function SocialStrategyPage() {
  const { brandId } = useBrand()

  // Phase state
  const [phase, setPhase] = useState<'questions' | 'generating' | 'strategy'>('questions')

  // Question state
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [chipSelections, setChipSelections] = useState<string[]>([])

  // Gen state
  const [genStep, setGenStep] = useState(0)

  // Strategy state
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [activeSection, setActiveSection] = useState(0)
  const [refreshingIdeas, setRefreshingIdeas] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)

  // ── Load existing strategy on mount ─────────────────────────────────

  useEffect(() => {
    if (!brandId || brandId === 'default') { setLoadingExisting(false); return }
    fetch(`/api/social-strategy?brandId=${brandId}`)
      .then(r => r.json())
      .then(res => {
        if (res.data?.generated_strategy) {
          try {
            const parsed = typeof res.data.generated_strategy === 'string'
              ? JSON.parse(res.data.generated_strategy)
              : res.data.generated_strategy
            setStrategy(parsed)
            setPhase('strategy')
            // Restore answers if available
            if (res.data.answers) {
              try {
                const savedAnswers = typeof res.data.answers === 'string'
                  ? JSON.parse(res.data.answers)
                  : res.data.answers
                setAnswers(savedAnswers)
              } catch {}
            }
          } catch {}
        }
        setLoadingExisting(false)
      })
      .catch(() => setLoadingExisting(false))
  }, [brandId])

  // ── Question logic ────────────────────────────────────────────────────

  const currentQ = QS[qIdx]

  function saveCurrentAnswer() {
    if (currentQ.type === 'textarea') {
      // Already saved via onChange
    } else if (currentQ.type === 'chips' || currentQ.type === 'platforms') {
      setAnswers(prev => ({ ...prev, [currentQ.id]: [...chipSelections] }))
    }
  }

  function nextQ() {
    saveCurrentAnswer()
    if (qIdx < QS.length - 1) {
      setQIdx(qIdx + 1)
      const nextQuestion = QS[qIdx + 1]
      if (nextQuestion.type === 'chips' || nextQuestion.type === 'platforms') {
        setChipSelections((answers[nextQuestion.id] as string[]) || [])
      }
    } else {
      startGeneration()
    }
  }

  function prevQ() {
    if (qIdx > 0) {
      saveCurrentAnswer()
      setQIdx(qIdx - 1)
      const prevQuestion = QS[qIdx - 1]
      if (prevQuestion.type === 'chips' || prevQuestion.type === 'platforms') {
        setChipSelections((answers[prevQuestion.id] as string[]) || [])
      }
    }
  }

  function toggleChip(val: string) {
    setChipSelections(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  // ── Generation ────────────────────────────────────────────────────────

  const startGeneration = useCallback(async () => {
    setPhase('generating')
    setGenStep(0)

    // Animate steps
    const stepInterval = setInterval(() => {
      setGenStep(prev => {
        if (prev < GEN_STEPS.length - 1) return prev + 1
        clearInterval(stepInterval)
        return prev
      })
    }, 1600)

    try {
      const res = await fetch('/api/social-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, brandId }),
      })
      const data = await res.json()
      clearInterval(stepInterval)
      if (data.error) throw new Error(data.error)
      setTimeout(() => { setStrategy(data); setPhase('strategy') }, 2000)
    } catch {
      clearInterval(stepInterval)
      // Use fallback strategy
      setTimeout(() => { setStrategy(fallbackStrategy()); setPhase('strategy') }, 2000)
    }
  }, [answers, brandId])

  // ── Refresh ideas ─────────────────────────────────────────────────────

  async function refreshIdeas() {
    if (!strategy) return
    setRefreshingIdeas(true)
    try {
      const res = await fetch('/api/social-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, brandId }),
      })
      const data = await res.json()
      if (data.content_ideas) {
        setStrategy(prev => prev ? { ...prev, content_ideas: data.content_ideas } : prev)
      }
    } catch {}
    setRefreshingIdeas(false)
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100%', background: '#fcfcff', fontFamily: "var(--font-manrope), 'Manrope', sans-serif" }}>

      {loadingExisting && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 54px)' }}>
          <div style={{ width: 24, height: 24, border: '2px solid #ec5c36', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        </div>
      )}

      {/* ═══ PHASE 1: QUESTIONS ═══ */}
      {!loadingExisting && phase === 'questions' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 54px)', padding: 32 }}>
          <div style={{ maxWidth: 580, width: '100%' }}>
            {/* Intro */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ec5c36', marginBottom: 8 }}>Brand Strategy / Social Media</div>
              <h1 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 800, color: '#1a1c1e', marginBottom: 8 }}>Social Media Strategy</h1>
              <p style={{ fontSize: 14, color: '#44474e', lineHeight: 1.6 }}>Answer 8 questions and Branditect will build a complete, platform-specific social strategy.</p>
            </div>

            {/* Card */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '40px 44px 36px', boxShadow: '0 6px 28px rgba(0,0,0,0.08)', border: '1px solid rgba(225,191,182,0.15)' }}>
              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <div style={{ flex: 1, height: 3, background: '#e1e2e8', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#ec5c36', borderRadius: 2, width: `${((qIdx + 1) / QS.length) * 100}%`, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8d7169', whiteSpace: 'nowrap' }}>{qIdx + 1} of {QS.length}</span>
              </div>

              {/* Step chip */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#ffdbd1', color: '#ec5c36', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20, marginBottom: 14 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ec5c36', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{qIdx + 1}</div>
                {currentQ.step}
              </div>

              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: '#1a1c1e', lineHeight: 1.3, marginBottom: 7 }}>{currentQ.q}</h2>
              <p style={{ fontSize: 13, color: '#8d7169', lineHeight: 1.6, marginBottom: 24 }}>{currentQ.hint}</p>

              {/* Input */}
              {currentQ.type === 'textarea' && (
                <textarea
                  value={(answers[currentQ.id] as string) || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  placeholder={currentQ.ph}
                  rows={4}
                  style={{ width: '100%', background: '#f3f6fc', border: '2px solid transparent', borderRadius: 12, padding: '13px 15px', fontSize: 14, color: '#1a1c1e', outline: 'none', resize: 'none', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = 'rgba(236,92,54,0.3)' }}
                  onBlur={e => { e.target.style.background = '#f3f6fc'; e.target.style.borderColor = 'transparent' }}
                />
              )}

              {currentQ.type === 'chips' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {currentQ.opts?.map(opt => {
                    const sel = chipSelections.includes(opt)
                    return (
                      <button key={opt} onClick={() => toggleChip(opt)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 12px', border: `2px solid ${sel ? '#ec5c36' : '#e1e2e8'}`, borderRadius: 10, background: sel ? '#ffdbd1' : '#fff', fontSize: 13, fontWeight: 500, color: sel ? '#ec5c36' : '#44474e', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.13s' }}>
                        <div style={{ width: 16, height: 16, border: `2px solid ${sel ? '#ec5c36' : '#e1e2e8'}`, borderRadius: 4, background: sel ? '#ec5c36' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: '#fff', fontWeight: 700 }}>{sel ? 'v' : ''}</div>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

              {currentQ.type === 'platforms' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {currentQ.opts?.map(name => {
                    const sel = chipSelections.includes(name)
                    return (
                      <button key={name} onClick={() => toggleChip(name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '14px 8px', border: `2px solid ${sel ? '#ec5c36' : '#e1e2e8'}`, borderRadius: 12, background: sel ? '#ffdbd1' : '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.13s' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: sel ? '#ec5c36' : '#44474e' }}>{name}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
                <button onClick={prevQ} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#8d7169', cursor: 'pointer', fontFamily: 'inherit', opacity: qIdx === 0 ? 0 : 1, pointerEvents: qIdx === 0 ? 'none' : 'auto' }}>Back</button>
                <button onClick={nextQ} style={{ background: '#ec5c36', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, padding: '12px 26px', borderRadius: 10, cursor: 'pointer', fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 14px rgba(236,92,54,0.3)', transition: 'all 0.15s' }}>
                  {qIdx === QS.length - 1 ? 'Build My Strategy' : 'Continue'} &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PHASE 2: GENERATING ═══ */}
      {!loadingExisting && phase === 'generating' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 54px)', padding: 32 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '52px 44px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 6px 28px rgba(0,0,0,0.08)' }}>
            {/* Spinner */}
            <div style={{ width: 60, height: 60, margin: '0 auto 24px', position: 'relative' }}>
              <div style={{ width: 60, height: 60, border: '2.5px solid #ffdbd1', borderTopColor: '#ec5c36', borderRightColor: '#ec5c36', borderRadius: '50%', animation: 'spin 0.9s linear infinite', position: 'absolute' }} />
              <div style={{ width: 10, height: 10, background: '#ec5c36', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: '#1a1c1e', marginBottom: 8 }}>Building your strategy...</h2>
            <p style={{ fontSize: 13, color: '#8d7169', lineHeight: 1.6, marginBottom: 28 }}>Crafting a platform-specific social media strategy tailored to your goals.</p>
            <div style={{ textAlign: 'left' }}>
              {GEN_STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', fontSize: 13, color: i <= genStep ? (i < genStep ? '#1a1c1e' : '#ec5c36') : '#e1bfb6', fontWeight: i === genStep ? 600 : 400, borderBottom: i < GEN_STEPS.length - 1 ? '1px solid #f3f6fc' : 'none', transition: 'all 0.3s' }}>
                  <span style={{ width: 20, textAlign: 'center', fontSize: 14 }}>{i < genStep ? 'v' : i === genStep ? '>' : '-'}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PHASE 3: STRATEGY DASHBOARD ═══ */}
      {!loadingExisting && phase === 'strategy' && strategy && (
        <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <Link href="/dashboard/brand-strategy" style={{ fontSize: 12, color: '#8d7169', textDecoration: 'none', marginBottom: 8, display: 'block' }}>Back to Brand Strategy</Link>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ec5c36', marginBottom: 6 }}>Brand Strategy / Social Media</div>
            <h1 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, color: '#1a1c1e', marginBottom: 5, letterSpacing: '-0.02em' }}>Social Media Strategy</h1>
            <p style={{ fontSize: 14, color: '#44474e' }}>{strategy.brand_summary}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={() => { setPhase('questions'); setQIdx(0) }} style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.3)', fontSize: 12, fontWeight: 600, color: '#44474e', padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Edit answers</button>
              <button onClick={refreshIdeas} disabled={refreshingIdeas} style={{ background: '#ec5c36', border: 'none', fontSize: 12, fontWeight: 700, color: '#fff', padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', opacity: refreshingIdeas ? 0.5 : 1 }}>
                {refreshingIdeas ? 'Refreshing...' : 'New content ideas'}
              </button>
            </div>
          </div>

          {/* Section nav */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid #e1e2e8', marginBottom: 32, overflowX: 'auto' }}>
            {NAV_SECTIONS.map((s, i) => (
              <button key={s} onClick={() => setActiveSection(i)} style={{ padding: '10px 15px', fontSize: 12, fontWeight: 600, color: activeSection === i ? '#ec5c36' : '#8d7169', cursor: 'pointer', borderBottom: `2px solid ${activeSection === i ? '#ec5c36' : 'transparent'}`, marginBottom: -1.5, whiteSpace: 'nowrap', background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: activeSection === i ? '#ec5c36' : 'transparent', fontFamily: 'inherit', transition: 'all 0.13s' }}>
                {s}
              </button>
            ))}
          </div>

          {/* ① Content Pillars */}
          {activeSection === 0 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: '#1a1c1e', marginBottom: 14 }}>Content Pillars</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {strategy.content_pillars.map((p, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 16, padding: 20, transition: 'all 0.2s' }}>
                    <div style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#1a1c1e', marginBottom: 5 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#44474e', lineHeight: 1.5, marginBottom: 12 }}>{p.description}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {p.example_topics.map((t, j) => (
                        <span key={j} style={{ fontSize: 10, fontWeight: 500, background: '#f3f6fc', color: '#44474e', padding: '2px 8px', borderRadius: 20 }}>{t}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, textTransform: 'capitalize', background: p.mix_type === 'educational' ? '#EFF6FF' : p.mix_type === 'entertaining' ? '#FFFBEB' : p.mix_type === 'promotional' ? '#ffdbd1' : '#F0FDF4', color: p.mix_type === 'educational' ? '#1D4ED8' : p.mix_type === 'entertaining' ? '#92400E' : p.mix_type === 'promotional' ? '#ec5c36' : '#15803D' }}>{p.mix_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ② Platforms */}
          {activeSection === 1 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: '#1a1c1e', marginBottom: 14 }}>Platform Strategy</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {strategy.platforms.map((p, i) => {
                  const m = p.content_mix
                  return (
                    <div key={i} style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 16, overflow: 'hidden' }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f6fc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1c1e' }}>{p.name}</span>
                        <span style={{ background: '#ffdbd1', color: '#ec5c36', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>{p.cadence}</span>
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                          <span style={{ color: '#8d7169' }}>Best times</span>
                          <span style={{ fontWeight: 600, color: '#1a1c1e', fontSize: 11 }}>{p.best_times}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                          <span style={{ color: '#8d7169' }}>Top formats</span>
                          <span style={{ fontWeight: 600, color: '#1a1c1e', fontSize: 11 }}>{p.primary_formats.slice(0, 2).join(' / ')}</span>
                        </div>
                        <div style={{ marginTop: 11, paddingTop: 11, borderTop: '1px solid #f3f6fc' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#e1bfb6', marginBottom: 7 }}>Content Mix</div>
                          <div style={{ display: 'flex', gap: 2, height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 7 }}>
                            <div style={{ flex: m.educational, background: '#3B82F6', height: '100%' }} />
                            <div style={{ flex: m.entertaining, background: '#F59E0B', height: '100%' }} />
                            <div style={{ flex: m.promotional, background: '#ec5c36', height: '100%' }} />
                            <div style={{ flex: m.community, background: '#22C55E', height: '100%' }} />
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            {[['Edu', m.educational, '#3B82F6'], ['Ent', m.entertaining, '#F59E0B'], ['Promo', m.promotional, '#ec5c36'], ['Comm', m.community, '#22C55E']].map(([label, pct, col]) => (
                              <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8d7169' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: col as string }} />
                                {pct}% {label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ③ Formats */}
          {activeSection === 2 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: '#1a1c1e', marginBottom: 14 }}>Content Format Matrix</h2>
              <p style={{ fontSize: 13, color: '#8d7169', marginBottom: 16 }}>Which formats work best on each platform you selected.</p>
              <div style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 16, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#8d7169', textAlign: 'left', background: '#f3f6fc', borderBottom: '1px solid #e1e2e8' }}>Format</th>
                      {strategy.platforms.map(p => (
                        <th key={p.name} style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#8d7169', textAlign: 'left', background: '#f3f6fc', borderBottom: '1px solid #e1e2e8' }}>{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['Short Video', 'Carousel', 'Static Image', 'Stories', 'Live Stream', 'Text/Thread', 'Polls'].map(format => (
                      <tr key={format}>
                        <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#1a1c1e', borderBottom: '1px solid #f3f6fc' }}>{format}</td>
                        {strategy.platforms.map(p => {
                          const score = p.primary_formats.some(f => f.toLowerCase().includes(format.toLowerCase().split(' ')[0].toLowerCase())) ? 3 : Math.floor(Math.random() * 2) + 1
                          return (
                            <td key={p.name} style={{ padding: '10px 16px', borderBottom: '1px solid #f3f6fc' }}>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {[0, 1, 2].map(i => (
                                  <div key={i} style={{ width: 13, height: 13, borderRadius: 2, background: i < score ? '#ec5c36' : '#e1e2e8' }} />
                                ))}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ④ Playbook */}
          {activeSection === 3 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: '#1a1c1e', marginBottom: 14 }}>Engagement Playbook</h2>
              <div style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 16, padding: 22 }}>
                <h4 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: '#1a1c1e', marginBottom: 16 }}>Daily engagement rules</h4>
                {[
                  { label: 'Comment Strategy', val: strategy.engagement_playbook.comment_strategy },
                  { label: 'DM Workflow', val: strategy.engagement_playbook.dm_workflow },
                  { label: 'UGC Encouragement', val: strategy.engagement_playbook.ugc },
                  { label: 'Community Ritual', val: strategy.engagement_playbook.community_ritual },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11, padding: '12px 0', borderBottom: i < 3 ? '1px solid #f3f6fc' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e1bfb6', marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: '#44474e', lineHeight: 1.5 }}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ⑤ Growth */}
          {activeSection === 4 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: '#1a1c1e', marginBottom: 14 }}>Growth Tactics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { t: 'Hashtag Strategy', v: strategy.growth_tactics.hashtags },
                  { t: 'Collaborations', v: strategy.growth_tactics.collaborations },
                  { t: 'Paid Boost Criteria', v: strategy.growth_tactics.paid_boost },
                  { t: 'Cross-Promotion', v: strategy.growth_tactics.cross_promotion },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1c1e', marginBottom: 5 }}>{item.t}</div>
                    <div style={{ fontSize: 12, color: '#44474e', lineHeight: 1.5 }}>{item.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ⑥ KPIs */}
          {activeSection === 5 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: '#1a1c1e', marginBottom: 14 }}>KPIs per Platform</h2>
              <div style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 16, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Platform', 'Follower Growth', 'Engagement Rate', 'Primary Metric'].map(h => (
                        <th key={h} style={{ padding: '11px 18px', fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8d7169', textAlign: 'left', background: '#f3f6fc', borderBottom: '1px solid #e1e2e8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {strategy.platforms.map((p, i) => (
                      <tr key={i}>
                        <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, color: '#1a1c1e', borderBottom: '1px solid #f3f6fc' }}>{p.name}</td>
                        <td style={{ padding: '12px 18px', fontSize: 12, borderBottom: '1px solid #f3f6fc' }}><span style={{ background: '#f3f6fc', padding: '3px 9px', borderRadius: 20, fontWeight: 600, color: '#44474e', fontSize: 11 }}>{p.kpis.follower_growth}</span></td>
                        <td style={{ padding: '12px 18px', fontSize: 12, borderBottom: '1px solid #f3f6fc' }}><span style={{ background: '#f3f6fc', padding: '3px 9px', borderRadius: 20, fontWeight: 600, color: '#44474e', fontSize: 11 }}>{p.kpis.engagement_rate}</span></td>
                        <td style={{ padding: '12px 18px', fontSize: 12, color: '#8d7169', borderBottom: '1px solid #f3f6fc' }}>{p.kpis.primary_metric}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ⑦ 14-Day Plan */}
          {activeSection === 6 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: '#1a1c1e', marginBottom: 14 }}>14-Day Quick-Start Plan</h2>
              {[0, 1].map(week => (
                <div key={week}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#e1bfb6', marginBottom: 8, marginTop: week > 0 ? 20 : 0 }}>Week {week + 1}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                    {strategy.action_plan.slice(week * 7, week * 7 + 7).map((day, i) => (
                      <div key={day.day} style={{ background: i >= 5 ? '#f3f6fc' : '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 10, padding: 11, minHeight: 90 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#e1bfb6', marginBottom: 7 }}>{DAY_NAMES[i]}</div>
                        <div style={{ fontSize: 11, color: '#44474e', lineHeight: 1.4, marginBottom: 7 }}>{day.task}</div>
                        <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.04em', background: TYPE_COLORS[day.type] || '#f3f6fc', color: TYPE_TEXT[day.type] || '#44474e' }}>{day.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ⑧ Content Ideas */}
          {activeSection === 7 && (
            <div>
              <h2 style={{ fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: '#1a1c1e', marginBottom: 14 }}>Content Ideas This Week</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {strategy.content_ideas.slice(0, 4).map((idea, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 16, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: '#f3f6fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, color: '#44474e' }}>{idea.platform.slice(0, 2)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 3, background: '#ffdbd1', color: '#ec5c36', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{idea.format}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: '#f3f6fc', color: '#44474e' }}>{idea.pillar}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1c1e', lineHeight: 1.4 }}>{idea.idea}</div>
                    </div>
                  </div>
                ))}
              </div>
              {strategy.inspirational_brands.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid rgba(225,191,182,0.15)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#e1bfb6', flexShrink: 0 }}>Follow for inspo</span>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {strategy.inspirational_brands.map((b, i) => (
                      <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '4px 11px', borderRadius: 20, border: '1px solid #e1e2e8', color: '#44474e' }}>{b}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/* ── Fallback strategy ──────────────────────────────────────────────────────── */

function fallbackStrategy(): Strategy {
  return {
    brand_summary: "Turn your brand's story into a community-first growth engine by owning the conversations your audience is already having.",
    content_pillars: [
      { name: "Brand Story", description: "Behind-the-brand moments that build authentic connection", example_topics: ["Founder journey", "Team culture", "Why we exist"], mix_type: "community" },
      { name: "Education", description: "Value-packed content positioning your brand as the expert", example_topics: ["How-to guides", "Industry insights", "Myth busting"], mix_type: "educational" },
      { name: "Product World", description: "Creative ways to showcase what you offer", example_topics: ["Demo videos", "Use cases", "Results"], mix_type: "promotional" },
      { name: "Community", description: "UGC and content celebrating your people", example_topics: ["Customer features", "Polls", "Spotlights"], mix_type: "community" },
    ],
    platforms: [
      { name: "Instagram", cadence: "5x/week", best_times: "Tue/Thu 11am & 6pm", primary_formats: ["Reels", "Carousels", "Stories"], content_mix: { educational: 30, entertaining: 30, promotional: 20, community: 20 }, kpis: { follower_growth: "5%/mo", engagement_rate: "3-6%", primary_metric: "Reach + Saves" } },
      { name: "TikTok", cadence: "7x/week", best_times: "Mon/Wed/Fri 7-9pm", primary_formats: ["Short Video", "Trending Audio", "Duets"], content_mix: { educational: 20, entertaining: 50, promotional: 10, community: 20 }, kpis: { follower_growth: "10%/mo", engagement_rate: "8-15%", primary_metric: "Views + Shares" } },
      { name: "LinkedIn", cadence: "3x/week", best_times: "Tue/Thu 8am & 12pm", primary_formats: ["Carousels", "Text Posts", "Articles"], content_mix: { educational: 50, entertaining: 15, promotional: 20, community: 15 }, kpis: { follower_growth: "3%/mo", engagement_rate: "4-7%", primary_metric: "Impressions" } },
    ],
    engagement_playbook: {
      comment_strategy: "Reply to every comment within 2 hours. Ask a follow-up question to extend the thread.",
      dm_workflow: "Respond to all DMs within 24hrs. Pin 3-5 saved replies for FAQs.",
      ugc: "Ask for UGC in 1 in 5 posts. Create a branded hashtag. Feature the best each month.",
      community_ritual: "Weekly Monday question post. Monthly community challenge tied to your core pillar.",
    },
    growth_tactics: {
      hashtags: "Use 5-8 niche hashtags (10K-500K range) per post. Rotate monthly.",
      collaborations: "Partner with 2-3 complementary brands per quarter for collabs.",
      paid_boost: "Boost any post with 5%+ organic engagement in first 3 hours.",
      cross_promotion: "Repurpose every video natively across all platforms.",
    },
    content_ideas: [
      { platform: "Instagram", format: "Reel", idea: "30-second day-in-the-life showing your product solving a real problem. No script, just raw.", pillar: "Brand Story" },
      { platform: "TikTok", format: "Video", idea: "Stitch a popular creator with your unique brand take on the topic.", pillar: "Education" },
      { platform: "LinkedIn", format: "Carousel", idea: "5 trends reshaping your industry in 2026 and what it means.", pillar: "Education" },
      { platform: "Instagram", format: "Story Poll", idea: "Which would you choose? A/B poll comparing two product features.", pillar: "Community" },
    ],
    action_plan: [
      { day: 1, task: "Audit all social bios. Update with consistent voice and CTA links.", type: "setup" },
      { day: 2, task: "Film 3 short clips: brand story, product demo, team intro.", type: "content" },
      { day: 3, task: "Engage with 10 accounts in your target niche. No generic comments.", type: "engage" },
      { day: 4, task: "Post first Reel: Brand origin story.", type: "content" },
      { day: 5, task: "Post educational carousel on your core topic.", type: "content" },
      { day: 6, task: "Reply to all comments. Follow 20 relevant creators.", type: "engage" },
      { day: 7, task: "Review Week 1 metrics. Note top performer.", type: "review" },
      { day: 8, task: "Batch-create next 5 posts. Schedule Week 2.", type: "setup" },
      { day: 9, task: "Post trending content using a trending sound.", type: "content" },
      { day: 10, task: "Share a customer win or UGC repost.", type: "content" },
      { day: 11, task: "Story poll + reply to every DM + 10 niche comments.", type: "engage" },
      { day: 12, task: "Product showcase: real-world use, not marketing.", type: "content" },
      { day: 13, task: "Cross-promote best post across all platforms.", type: "content" },
      { day: 14, task: "Week 2 review: compare metrics, set 30-day goals.", type: "review" },
    ],
    inspirational_brands: ["Gymshark", "Notion", "Duolingo", "Patagonia", "Oatly"],
  }
}
