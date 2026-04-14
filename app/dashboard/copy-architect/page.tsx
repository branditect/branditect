'use client'

import { useState, useMemo, useCallback } from 'react'
import { COPY_CONFIG } from '@/lib/copy-architect-config'
import { useBrand } from '@/lib/useBrand'

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface CopyOption { id: string; type: string; text: string; rationale: string }
interface CopySection { label: string; options: CopyOption[] }
interface CopyResult { sections: CopySection[]; qualityChecks: string[]; placeholders: string[]; toneMatch: string }

/* ── Simplified nav categories ──────────────────────────────────────────────── */

const NAV_ITEMS = [
  {
    key: 'social', label: 'Social',
    title: 'Social post',
    subtitle: 'Hook-first. Platform-optimised. Brand-checked before it leaves.',
    dropdownLabel: 'Platform',
    dropdownOptions: ['Instagram caption', 'LinkedIn post', 'X / Twitter post', 'TikTok caption & hook', 'Facebook post'],
    topicLabel: "What's the post about?",
    topicPlaceholder: 'Topic, angle, hook idea, product, campaign... anything that gives direction.',
    configCat: 'social',
    subMap: { 'Instagram caption': 'instagram', 'LinkedIn post': 'linkedin', 'X / Twitter post': 'x', 'TikTok caption & hook': 'tiktok', 'Facebook post': 'facebook' } as Record<string, string>,
  },
  {
    key: 'other', label: 'Other',
    title: 'Other copy',
    subtitle: 'Describe what you need and we will write it.',
    dropdownLabel: '',
    dropdownOptions: [],
    topicLabel: "Describe what you are looking to write",
    topicPlaceholder: 'e.g. An ad for Meta about our new product launch, a bio for our CEO, a press release about our partnership, video hook ideas for TikTok...',
    configCat: 'other',
    subMap: {} as Record<string, string>,
  },
  {
    key: 'email', label: 'Email',
    title: 'Email',
    subtitle: 'Subject lines that get opened. Body copy that converts.',
    dropdownLabel: 'Type',
    dropdownOptions: ['Newsletter', 'Proposal', 'Cold outreach', 'Other'],
    topicLabel: "What's this email about?",
    topicPlaceholder: 'The message, offer, or announcement this email delivers.',
    configCat: 'email',
    subMap: { 'Newsletter': 'newsletter_email', 'Proposal': 'proposal', 'Cold outreach': 'cold_outreach', 'Other': 'transactional' } as Record<string, string>,
  },
  {
    key: 'product', label: 'Product Info',
    title: 'Product copy',
    subtitle: 'Descriptions, features, pricing — written to sell.',
    dropdownLabel: 'Type',
    dropdownOptions: ['Product description', 'Feature list', 'Pricing page', 'Comparison page'],
    topicLabel: "What product or service?",
    topicPlaceholder: 'The product, service, or offer you need copy for.',
    configCat: 'product',
    subMap: { 'Product description': 'product_desc', 'Feature list': 'feature_list', 'Pricing page': 'pricing', 'Comparison page': 'comparison' } as Record<string, string>,
  },
  {
    key: 'seo', label: 'SEO Content',
    title: 'SEO content',
    subtitle: 'Keyword-optimised. Search-intent matched. Rank-ready.',
    dropdownLabel: 'Type',
    dropdownOptions: ['SEO blog post', 'SEO product page', 'SEO landing page', 'Meta tags generator', 'Content cluster plan'],
    topicLabel: "Primary keyword or topic",
    topicPlaceholder: 'The keyword you want to rank for, or the topic you want to cover.',
    configCat: 'seo',
    subMap: { 'SEO blog post': 'blogpost', 'SEO product page': 'productpage', 'SEO landing page': 'landingseo', 'Meta tags generator': 'metatags', 'Content cluster plan': 'pillarcluster' } as Record<string, string>,
  },
  {
    key: 'presentation', label: 'Presentation',
    title: 'Presentation',
    subtitle: 'Slide decks, pitch scripts, and talking points.',
    dropdownLabel: 'Type',
    dropdownOptions: ['Pitch deck', 'Sales deck', 'Internal presentation', 'Keynote script'],
    topicLabel: "What's the presentation about?",
    topicPlaceholder: 'The topic, audience, and goal of this presentation.',
    configCat: 'presentation',
    subMap: { 'Pitch deck': 'pitch_deck', 'Sales deck': 'sales_deck', 'Internal presentation': 'internal', 'Keynote script': 'keynote' } as Record<string, string>,
  },
]

const OPTION_LABELS = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E']

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function CopyArchitectPage() {
  const { brandId, brandName } = useBrand()
  const tonePills = ['Direct', 'Clear', 'On-brand']

  const [activeNav, setActiveNav] = useState(NAV_ITEMS[0])
  const [dropdown, setDropdown] = useState(NAV_ITEMS[0].dropdownOptions[0])
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<CopyResult | null>(null)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [primaryPicks, setPrimaryPicks] = useState<Record<number, number>>({})
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set())

  function switchNav(item: typeof NAV_ITEMS[0]) {
    setActiveNav(item)
    setDropdown(item.dropdownOptions[0])
    setTopic('')
    setNotes('')
    setResult(null)
    setError('')
    setPrimaryPicks({})
  }

  const canGenerate = useMemo(() => topic.trim().length > 0, [topic])

  async function saveFavorite(text: string, optionId: string, type: string) {
    if (favoritedIds.has(optionId)) return
    setFavoritedIds(prev => new Set(prev).add(optionId))
    await fetch('/api/mission-board/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, content: text, title: `${type} — Copy Architect`, isDraft: false, isFavorite: true }),
    })
  }

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setError('')
    setResult(null)
    setPrimaryPicks({})

    // Map to config — fill all required fields from our simplified inputs
    const configCat = activeNav.configCat
    const subKey = (activeNav.subMap[dropdown]) || Object.keys(COPY_CONFIG[configCat]?.subs || {})[0] || 'ad'
    const subConfig = COPY_CONFIG[configCat]?.subs?.[subKey]

    // Build fields object that satisfies all required fields
    const fields: Record<string, string> = { topic, notes, goal: dropdown }
    if (subConfig) {
      for (const f of subConfig.fields) {
        if (!fields[f.id]) {
          // Map our simplified inputs to whatever the config expects
          if (f.id === 'topic' || f.id === 'message' || f.id === 'news' || f.id === 'offer' || f.id === 'page' || f.id === 'product' || f.id === 'keyword' || f.id === 'person' || f.id === 'video concept') {
            fields[f.id] = topic
          } else if (f.id === 'platform' || f.id === 'format' || f.id === 'type' || f.id === 'goal' || f.id === 'intent' || f.id === 'style') {
            fields[f.id] = dropdown
          } else if (f.id === 'notes' || f.id === 'secondary' || f.id === 'angle' || f.id === 'usp' || f.id === 'features' || f.id === 'audience' || f.id === 'brand') {
            fields[f.id] = notes || topic
          }
        }
      }
    }

    try {
      const res = await fetch('/api/copy-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: configCat,
          subType: subKey,
          fields,
          brand_id: brandId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed'); return }
      setResult(data)
      const picks: Record<number, number> = {}
      data.sections?.forEach((_: CopySection, i: number) => { picks[i] = 0 })
      setPrimaryPicks(picks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setGenerating(false)
    }
  }, [activeNav, dropdown, topic, notes, brandId])

  const handleCopy = useCallback(async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500) } catch {}
  }, [])

  /* ── Render ──────────────────────────────────────────────────────────────── */

  return (
    <div className="flex h-full font-body">

      {/* ── Left Sidebar ── */}
      <aside className="w-56 bg-surface-container-low shrink-0 flex flex-col">
        <div className="flex-1 p-4 pt-6">
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => switchNav(item)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-body transition-all ${
                  activeNav.key === item.key
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-ambient-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-lowest/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Brand context footer */}
        <div className="p-4 pt-0">
          <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-ambient-sm">
            <div className="text-[13px] font-headline font-bold text-on-surface mb-2">{brandName || 'Brand'}</div>
            <div className="flex flex-wrap gap-1.5">
              {tonePills.map(pill => (
                <span key={pill} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Form area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-10">

            {/* Header */}
            <h1 className="font-headline font-bold text-headline-md text-on-surface mb-2">{activeNav.title}</h1>
            <p className="text-body-md text-on-surface-variant mb-10">{activeNav.subtitle}</p>

            {/* Dropdown — hidden for categories with no options */}
            {activeNav.dropdownOptions.length > 0 && (
              <div className="mb-6">
                <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
                  {activeNav.dropdownLabel}
                </label>
                <select
                  value={dropdown}
                  onChange={e => setDropdown(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface text-body-md px-4 py-3 rounded-xl outline-none font-body focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(237,98,53,0.2)]"
                >
                  {activeNav.dropdownOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Topic textarea */}
            <div className="mb-6">
              <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
                {activeNav.topicLabel}
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder={activeNav.topicPlaceholder}
                rows={4}
                className="w-full bg-surface-container-low text-on-surface text-body-md px-4 py-3 rounded-xl outline-none font-body resize-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(237,98,53,0.2)] placeholder:text-outline-variant"
              />
            </div>

            {/* Notes textarea */}
            <div className="mb-8">
              <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Specific claims, offers, or things to include (optional)."
                rows={2}
                className="w-full bg-surface-container-low text-on-surface text-body-md px-4 py-3 rounded-xl outline-none font-body resize-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(237,98,53,0.2)] placeholder:text-outline-variant"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-error-container/10 text-error text-body-sm">
                {error}
              </div>
            )}

            {/* Generating state */}
            {generating && (
              <div className="flex items-center gap-3 mb-8 px-4 py-4 bg-surface-container-low rounded-xl">
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-body-sm text-on-surface-variant">Generating copy...</span>
              </div>
            )}

            {/* Results */}
            {result && !generating && (
              <div className="space-y-8">
                {result.sections.map((section, sIdx) => (
                  <div key={sIdx}>
                    <div className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                      {section.label}
                    </div>
                    <div className="space-y-3">
                      {section.options.map((option, oIdx) => {
                        const isPrimary = primaryPicks[sIdx] === oIdx
                        return (
                          <div
                            key={option.id}
                            className={`bg-surface-container-lowest rounded-xl p-5 transition-all ${
                              isPrimary ? 'shadow-ambient-sm' : ''
                            }`}
                            style={isPrimary ? { boxShadow: 'inset 0 0 0 1.5px #ad3507, 0 2px 20px rgba(45,51,53,0.04)' } : {}}
                          >
                            {/* Head */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {isPrimary ? (
                                  <span className="text-label-sm font-bold text-primary">Selected</span>
                                ) : (
                                  <span className="text-label-sm font-medium text-on-surface-variant">{OPTION_LABELS[oIdx] || `Option ${oIdx + 1}`}</span>
                                )}
                                <span className="text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                                  {option.type}
                                </span>
                              </div>
                            </div>

                            {/* Copy text */}
                            <p className="text-body-md text-on-surface leading-relaxed whitespace-pre-wrap mb-4">
                              {option.text}
                            </p>

                            {option.rationale && (
                              <p className="text-body-sm text-on-surface-variant italic mb-4">
                                {option.rationale}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--surface-container-high)' }}>
                              {!isPrimary && (
                                <button
                                  onClick={() => setPrimaryPicks(prev => ({ ...prev, [sIdx]: oIdx }))}
                                  className="text-label-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
                                >
                                  Use this
                                </button>
                              )}
                              <span className="text-label-sm text-outline ml-auto">
                                {option.text.length} chars
                              </span>
                              <button
                                onClick={() => saveFavorite(option.text, option.id, option.type)}
                                className={`text-label-sm font-medium px-2.5 py-1 rounded-lg transition-colors ${
                                  favoritedIds.has(option.id)
                                    ? 'bg-primary-fixed/15 text-primary'
                                    : 'text-on-surface-variant hover:text-primary'
                                }`}
                              >
                                {favoritedIds.has(option.id) ? 'Saved' : 'Save'}
                              </button>
                              <button
                                onClick={() => handleCopy(option.text, option.id)}
                                className="text-label-sm font-medium text-on-surface-variant hover:text-primary px-2.5 py-1 rounded-lg transition-colors bg-surface-container-high"
                              >
                                {copiedId === option.id ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Quality checks */}
                {result.qualityChecks?.length > 0 && (
                  <div>
                    <div className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Quality checks</div>
                    <div className="bg-surface-container-lowest rounded-xl p-5 space-y-2">
                      {result.qualityChecks.map((check, i) => (
                        <div key={i} className="text-body-sm text-on-surface-variant">{check}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer bar */}
        <div className="px-8 py-3.5 bg-surface-container-lowest flex items-center justify-between shrink-0" style={{ boxShadow: '0 -2px 20px rgba(45,51,53,0.03)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#34a853]" />
            <span className="text-label-sm text-on-surface-variant">Brand context loaded</span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className="signature-gradient text-on-primary font-headline font-bold text-[13px] px-6 py-2.5 rounded-xl disabled:opacity-40 transition-opacity"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}
