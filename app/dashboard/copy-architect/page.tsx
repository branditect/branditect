'use client'

import { useState, useMemo, useCallback } from 'react'
import { COPY_CONFIG } from '@/lib/copy-architect-config'
import type { SubTypeConfig } from '@/lib/copy-architect-config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CopyOption {
  id: string
  type: string
  text: string
  rationale: string
}

interface CopySection {
  label: string
  options: CopyOption[]
}

interface CopyResult {
  sections: CopySection[]
  qualityChecks: string[]
  placeholders: string[]
  toneMatch: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = {
  name: 'Vetra Mobile',
  tone: ['Direct', 'Irreverent', 'Insider', 'Anti-corporate'],
  positioning: 'The only phone carrier that turns your monthly bill into creator support.',
  tagline: 'Always on. Never behind.',
  strategy: 'Loaded',
}

const CAT_ICONS: Record<string, string> = {
  social: '◻',
  email: '◇',
  website: '◎',
  newsletter: '▤',
  product: '△',
  presentation: '▣',
  other: '✦',
}

const catKeys = Object.keys(COPY_CONFIG)

const OPTION_LABELS = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E']

// ─── Component ────────────────────────────────────────────────────────────────

export default function CopyArchitectPage() {
  const [activeCat, setActiveCat] = useState(catKeys[0])
  const [activeSub, setActiveSub] = useState(Object.keys(COPY_CONFIG[catKeys[0]].subs)[0])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<CopyResult | null>(null)
  const [activeTab, setActiveTab] = useState<'copy' | 'quality' | 'placeholders'>('copy')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [primaryPicks, setPrimaryPicks] = useState<Record<number, number>>({})
  const [error, setError] = useState('')

  const catConfig = COPY_CONFIG[activeCat]
  const subConfig: SubTypeConfig = catConfig.subs[activeSub]

  const canGenerate = useMemo(() => {
    return subConfig.fields
      .filter(f => f.req)
      .every(f => formValues[f.id]?.trim())
  }, [subConfig, formValues])

  const handleCatClick = useCallback((catKey: string) => {
    if (activeCat === catKey) return
    setActiveCat(catKey)
    const firstSub = Object.keys(COPY_CONFIG[catKey].subs)[0]
    setActiveSub(firstSub)
    setFormValues({})
    setResult(null)
    setError('')
    setPrimaryPicks({})
    setActiveTab('copy')
  }, [activeCat])

  const handleSubClick = useCallback((subKey: string) => {
    setActiveSub(subKey)
    setFormValues({})
    setResult(null)
    setError('')
    setPrimaryPicks({})
    setActiveTab('copy')
  }, [])

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }))
  }, [])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setError('')
    setResult(null)
    setPrimaryPicks({})
    setActiveTab('copy')

    try {
      const res = await fetch('/api/copy-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCat,
          subType: activeSub,
          fields: formValues,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generation failed')
        return
      }

      setResult(data)

      // Set first option in each section as primary
      const picks: Record<number, number> = {}
      data.sections?.forEach((_: CopySection, i: number) => {
        picks[i] = 0
      })
      setPrimaryPicks(picks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setGenerating(false)
    }
  }, [activeCat, activeSub, formValues])

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      /* clipboard not available */
    }
  }, [])

  const handleCopyAllSection = useCallback(async (section: CopySection, sectionIdx: number) => {
    const allText = section.options.map(o => o.text).join('\n\n')
    try {
      await navigator.clipboard.writeText(allText)
      setCopiedId(`section-${sectionIdx}`)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      /* clipboard not available */
    }
  }, [])

  const handleCopySelected = useCallback(async () => {
    if (!result) return
    const selectedTexts = result.sections
      .map((section, i) => {
        const pickIdx = primaryPicks[i] ?? 0
        const option = section.options[pickIdx]
        return option ? `--- ${section.label} ---\n${option.text}` : null
      })
      .filter(Boolean)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(selectedTexts)
      setCopiedId('__selected__')
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      /* clipboard not available */
    }
  }, [result, primaryPicks])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full">
      {/* ── Left Sidebar ── */}
      <aside className="w-60 bg-white border-r border-light shrink-0 flex flex-col">
        {/* Scrollable top section */}
        <div className="flex-1 overflow-y-auto p-3 pt-4">
          <p className="font-mono text-[0.65rem] text-muted uppercase tracking-wider mb-3 px-1">
            What are you writing?
          </p>

          <nav className="space-y-0.5">
            {catKeys.map(catKey => {
              const cat = COPY_CONFIG[catKey]
              const isActive = activeCat === catKey
              const subKeys = Object.keys(cat.subs)

              return (
                <div key={catKey}>
                  <button
                    onClick={() => handleCatClick(catKey)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[0.8rem] transition-colors ${
                      isActive
                        ? 'bg-brand-orange-pale text-brand-orange font-medium'
                        : 'text-mid hover:bg-pale hover:text-ink'
                    }`}
                  >
                    <span
                      className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        isActive ? 'bg-brand-orange-mid' : 'bg-pale'
                      }`}
                    >
                      {CAT_ICONS[catKey] || cat.icon}
                    </span>
                    <span className="flex-1 truncate">{cat.label}</span>
                    <span
                      className={`text-[0.6rem] transition-transform duration-200 ${
                        isActive ? 'rotate-90' : ''
                      }`}
                    >
                      ▶
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{ maxHeight: isActive ? `${subKeys.length * 36}px` : '0px' }}
                  >
                    {subKeys.map(subKey => {
                      const sub = cat.subs[subKey]
                      const isSubActive = activeSub === subKey && isActive
                      return (
                        <button
                          key={subKey}
                          onClick={() => handleSubClick(subKey)}
                          className={`w-full flex items-center gap-2 pl-[50px] pr-2 py-1.5 text-left text-[0.78rem] transition-colors ${
                            isSubActive
                              ? 'text-brand-orange font-medium'
                              : 'text-muted hover:text-ink'
                          }`}
                        >
                          <span
                            className={`w-[6px] h-[6px] rounded-full shrink-0 ${
                              isSubActive ? 'bg-brand-orange' : 'bg-light'
                            }`}
                          />
                          <span className="truncate">{sub.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* ── Brand strip ── */}
        <div className="mt-auto border-t border-light p-3.5 space-y-1.5">
          <p className="font-semibold text-[0.82rem] text-ink">{BRAND.name}</p>
          <div className="flex flex-wrap gap-1">
            {BRAND.tone.map(t => (
              <span
                key={t}
                className="inline-block bg-brand-orange-pale border border-brand-orange-mid text-brand-orange text-[0.65rem] px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="text-[0.68rem] text-muted leading-relaxed">{BRAND.positioning}</p>
          <p className="text-[0.68rem] text-muted italic">{BRAND.tagline}</p>
          <p className="text-[0.68rem] text-muted">Strategy: {BRAND.strategy}</p>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 bg-pale overflow-y-auto p-6 space-y-5">
        {/* Context strip */}
        <div className="bg-white border border-light rounded-[10px] p-3 px-4 flex gap-7 flex-wrap items-center">
          <span className="flex items-center gap-2 text-[0.82rem] font-medium text-ink">
            <span className="w-2 h-2 rounded-full bg-brand-orange" />
            {BRAND.name}
          </span>
          <span className="flex items-center gap-1.5 text-[0.78rem] text-mid">
            <span className="text-muted text-[0.7rem]">Tone</span>
            <span className="flex gap-1">
              {BRAND.tone.map(t => (
                <span
                  key={t}
                  className="bg-brand-orange-pale border border-brand-orange-mid text-brand-orange text-[0.65rem] px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </span>
          </span>
          <span className="text-[0.78rem] text-muted">{BRAND.positioning}</span>
          <span className="flex items-center gap-1.5 text-[0.78rem] text-mid">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Strategy: {BRAND.strategy}
          </span>
        </div>

        {/* Form card */}
        <div className="bg-white border border-light rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-[18px] px-[22px] border-b border-light">
            <div className="flex items-start gap-3">
              <span className="w-[40px] h-[40px] rounded-[10px] bg-brand-orange-pale flex items-center justify-center text-lg shrink-0">
                {subConfig.icon}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[0.65rem] text-muted uppercase tracking-wider">
                  <span className="text-muted">{catConfig.label}</span>
                  <span className="mx-1.5">›</span>
                  <span className="text-brand-orange">{subConfig.title}</span>
                </p>
                <h1 className="text-[1rem] font-semibold text-ink mt-0.5">{subConfig.title}</h1>
                <p className="text-[0.78rem] text-muted mt-0.5">{subConfig.desc}</p>
              </div>
            </div>
          </div>

          {/* Fields or Loading */}
          {generating ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-[40px] h-[40px] rounded-full border-[3px] border-brand-orange-pale border-t-brand-orange animate-spin" />
              <p className="text-[0.82rem] text-muted text-center max-w-sm">
                Reading brand strategy, tone of voice, and Business Pulse...
              </p>
              <div className="flex flex-col gap-2 mt-2">
                <span className="flex items-center gap-2 text-[0.78rem]">
                  <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[0.6rem]">✓</span>
                  <span className="text-green-700">Brand context loaded</span>
                </span>
                <span className="flex items-center gap-2 text-[0.78rem]">
                  <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[0.6rem]">✓</span>
                  <span className="text-green-700">Tone locked</span>
                </span>
                <span className="flex items-center gap-2 text-[0.78rem]">
                  <span className="w-4 h-4 rounded-full bg-brand-orange-pale text-brand-orange flex items-center justify-center text-[0.6rem]">●</span>
                  <span className="text-brand-orange">Writing copy...</span>
                </span>
                <span className="flex items-center gap-2 text-[0.78rem]">
                  <span className="w-4 h-4 rounded-full bg-pale text-muted flex items-center justify-center text-[0.6rem]">○</span>
                  <span className="text-muted">Quality check</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-5 px-[22px]">
              <div className="grid grid-cols-2 gap-3.5">
                {subConfig.fields.map(field => (
                  <div key={field.id} className={field.full ? 'col-span-2' : ''}>
                    <label className="block text-[0.78rem] font-medium text-ink mb-1.5">
                      {field.label}
                      {field.req && <span className="text-brand-orange ml-0.5">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        value={formValues[field.id] || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-md bg-pale border border-light px-3 py-2 text-[0.82rem] text-ink placeholder:text-muted/50 min-h-[82px] resize-y focus:outline-none focus:border-brand-orange focus:bg-white focus:ring focus:ring-brand-orange/10 transition-colors"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formValues[field.id] || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        className="w-full rounded-md bg-pale border border-light px-3 py-2 text-[0.82rem] text-ink appearance-none cursor-pointer focus:outline-none focus:border-brand-orange focus:bg-white focus:ring focus:ring-brand-orange/10 transition-colors"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formValues[field.id] || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-md bg-pale border border-light px-3 py-2 text-[0.82rem] text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand-orange focus:bg-white focus:ring focus:ring-brand-orange/10 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="px-[22px] py-3.5 border-t border-light bg-pale flex items-center justify-between">
            <p className="text-[0.75rem] text-muted">
              {subConfig.fields.filter(f => f.req).length} required field{subConfig.fields.filter(f => f.req).length !== 1 ? 's' : ''} — brand context auto-loaded
            </p>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className={`rounded-[10px] px-5 py-2.5 font-semibold text-[0.82rem] flex items-center gap-2 transition-all ${
                canGenerate && !generating
                  ? 'bg-brand-orange text-white hover:bg-brand-orange-hover active:scale-[0.98]'
                  : 'bg-light text-muted cursor-not-allowed'
              }`}
            >
              <span>✦</span>
              Generate copy
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-[0.82rem] text-red-700">
            {error}
          </div>
        )}

        {/* Output card */}
        {result && (
          <div className="bg-white border border-light rounded-xl overflow-hidden">
            {/* Output header */}
            <div className="px-[22px] py-3.5 border-b border-light flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[1rem] font-semibold text-ink">Generated Copy</h2>
                <span className="bg-green-50 text-green-700 border border-green-200 text-[0.68rem] font-semibold px-2.5 py-0.5 rounded-full">
                  On-brand ✓
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-3.5 py-1.5 rounded-[8px] text-[0.78rem] font-medium text-mid border border-light hover:border-brand-orange hover:text-brand-orange transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleCopySelected}
                  className="px-3.5 py-1.5 rounded-[8px] text-[0.78rem] font-medium text-mid border border-light hover:border-brand-orange hover:text-brand-orange transition-colors"
                >
                  {copiedId === '__selected__' ? 'Copied!' : 'Copy selected'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-light px-[22px]">
              {[
                { key: 'copy' as const, label: 'Copy output' },
                { key: 'quality' as const, label: 'Quality checks' },
                { key: 'placeholders' as const, label: 'Placeholders' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-[0.82rem] font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'text-brand-orange border-brand-orange'
                      : 'text-muted border-transparent hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'copy' && (
              <div className="p-[22px] space-y-5">
                {result.sections.map((section, sIdx) => (
                  <div key={sIdx}>
                    {sIdx > 0 && <hr className="border-light mb-5" />}
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-mono text-[0.7rem] text-muted uppercase tracking-wider">
                        {section.label}
                      </h3>
                      <span className="bg-pale text-muted rounded-full px-2 text-[0.68rem]">
                        {section.options.length}
                      </span>
                      <button
                        onClick={() => handleCopyAllSection(section, sIdx)}
                        className="ml-auto text-[0.72rem] text-muted hover:text-brand-orange transition-colors"
                      >
                        {copiedId === `section-${sIdx}` ? 'Copied!' : 'Copy all'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {section.options.map((option, oIdx) => {
                        const isPrimary = (primaryPicks[sIdx] ?? 0) === oIdx
                        return (
                          <div
                            key={option.id}
                            className={`rounded-xl border p-4 transition-colors ${
                              isPrimary
                                ? 'border-brand-orange bg-brand-orange-pale'
                                : 'border-light'
                            }`}
                          >
                            {/* Head row */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isPrimary ? (
                                  <span className="text-[0.72rem] font-semibold text-brand-orange">★ Recommended</span>
                                ) : (
                                  <span className="text-[0.72rem] font-medium text-mid">{OPTION_LABELS[oIdx] || `Option ${oIdx + 1}`}</span>
                                )}
                                <span className="bg-pale text-muted text-[0.65rem] px-2 py-0.5 rounded-full border border-light">
                                  {option.type}
                                </span>
                              </div>
                            </div>

                            {/* Copy text */}
                            <p className="text-[0.82rem] leading-[1.68] whitespace-pre-wrap text-ink">
                              {option.text}
                            </p>

                            {/* Rationale */}
                            {option.rationale && (
                              <p className="mt-2 italic text-[0.75rem] text-muted">
                                {option.rationale}
                              </p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-light/60">
                              {isPrimary ? (
                                <span className="text-[0.72rem] font-medium text-brand-orange">★ Selected</span>
                              ) : (
                                <button
                                  onClick={() => setPrimaryPicks(prev => ({ ...prev, [sIdx]: oIdx }))}
                                  className="text-[0.72rem] font-medium text-mid hover:text-brand-orange transition-colors"
                                >
                                  ☆ Use this
                                </button>
                              )}
                              <span className="text-[0.68rem] text-muted ml-auto">
                                {option.text.length} chars
                              </span>
                              <button
                                onClick={() => handleCopy(option.text, option.id)}
                                className="text-[0.72rem] font-medium text-mid border border-light rounded-md px-2.5 py-1 hover:border-brand-orange hover:text-brand-orange transition-colors"
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
              </div>
            )}

            {activeTab === 'quality' && (
              <div className="p-[22px]">
                {result.qualityChecks?.length > 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</span>
                      <h3 className="text-[0.88rem] font-semibold text-green-800">All quality checks passed</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.qualityChecks.map((check, i) => (
                        <span
                          key={i}
                          className="bg-green-50 text-green-700 border border-green-200 text-[0.75rem] px-3 py-1 rounded-full"
                        >
                          ✓ {check}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[0.82rem] text-muted">No quality checks available.</p>
                )}
              </div>
            )}

            {activeTab === 'placeholders' && (
              <div className="p-[22px] space-y-3">
                {result.placeholders?.length > 0 ? (
                  result.placeholders.map((ph, i) => (
                    <div
                      key={i}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[0.7rem] shrink-0 mt-0.5">!</span>
                      <div>
                        <p className="text-[0.82rem] font-medium text-amber-800">{ph}</p>
                        <p className="text-[0.75rem] text-amber-600 mt-0.5">Replace this placeholder with actual content before publishing.</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[0.82rem] text-muted">No placeholders found — copy is ready to use.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
