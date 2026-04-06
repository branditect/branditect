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
}

const catKeys = Object.keys(COPY_CONFIG)

// ─── Component ────────────────────────────────────────────────────────────────

export default function CopyArchitectPage() {
  const [activeCat, setActiveCat] = useState(catKeys[0])
  const [activeSub, setActiveSub] = useState(Object.keys(COPY_CONFIG[catKeys[0]].subs)[0])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<CopyResult | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [primaryPicks, setPrimaryPicks] = useState<Record<string, string>>({})

  const catConfig = COPY_CONFIG[activeCat]
  const subConfig: SubTypeConfig = catConfig.subs[activeSub]

  const canGenerate = useMemo(() => {
    return subConfig.fields
      .filter(f => f.req)
      .every(f => formValues[f.id]?.trim())
  }, [subConfig, formValues])

  const handleCatClick = useCallback((catKey: string) => {
    setActiveCat(catKey)
    const firstSub = Object.keys(COPY_CONFIG[catKey].subs)[0]
    setActiveSub(firstSub)
    setFormValues({})
    setResult(null)
    setError('')
    setPrimaryPicks({})
  }, [])

  const handleSubClick = useCallback((subKey: string) => {
    setActiveSub(subKey)
    setFormValues({})
    setResult(null)
    setError('')
    setPrimaryPicks({})
  }, [])

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }))
  }, [])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setError('')
    setResult(null)
    setPrimaryPicks({})

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
      const picks: Record<string, string> = {}
      data.sections?.forEach((section: CopySection) => {
        if (section.options?.[0]) {
          picks[section.label] = section.options[0].id
        }
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

  const handleCopyAll = useCallback(async () => {
    if (!result) return
    const allText = result.sections
      .map(s => `--- ${s.label} ---\n${s.options.map(o => o.text).join('\n\n')}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(allText)
      setCopiedId('__all__')
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      /* clipboard not available */
    }
  }, [result])

  const handleUsePrimary = useCallback((sectionLabel: string, optionId: string) => {
    setPrimaryPicks(prev => ({ ...prev, [sectionLabel]: optionId }))
  }, [])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="w-60 bg-white border-r border-light shrink-0 flex flex-col overflow-y-auto">
        <div className="p-4 pb-2">
          <h2 className="font-display text-sm text-ink tracking-wide">Copy Architect</h2>
        </div>

        <nav className="flex-1 px-2 pb-2">
          {catKeys.map(catKey => {
            const cat = COPY_CONFIG[catKey]
            const isActive = activeCat === catKey
            const subKeys = Object.keys(cat.subs)

            return (
              <div key={catKey}>
                <button
                  onClick={() => handleCatClick(catKey)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-orange-pale text-brand-orange font-medium'
                      : 'text-mid hover:bg-pale hover:text-ink'
                  }`}
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span className="flex-1 font-mono text-xs uppercase tracking-wider">{cat.label}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isActive && (
                  <div className="ml-7 mt-0.5 mb-1 space-y-0.5">
                    {subKeys.map(subKey => {
                      const sub = cat.subs[subKey]
                      const isSubActive = activeSub === subKey
                      return (
                        <button
                          key={subKey}
                          onClick={() => handleSubClick(subKey)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                            isSubActive
                              ? 'text-brand-orange font-medium'
                              : 'text-muted hover:text-ink'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isSubActive ? 'bg-brand-orange' : 'bg-light'
                            }`}
                          />
                          <span className="truncate">{sub.title}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* ── Brand strip ── */}
        <div className="border-t border-light p-3 space-y-2">
          <p className="font-mono text-[10px] text-muted uppercase tracking-wider">Brand</p>
          <p className="text-xs font-medium text-ink">{BRAND.name}</p>
          <div className="flex flex-wrap gap-1">
            {BRAND.tone.map(t => (
              <span
                key={t}
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-orange-pale text-brand-orange"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted leading-relaxed">{BRAND.positioning}</p>
          <p className="text-[10px] text-muted italic">{BRAND.tagline}</p>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 bg-pale overflow-y-auto p-6 space-y-5">
        {/* Context strip */}
        <div className="bg-white rounded-xl border border-light px-5 py-3 flex items-center gap-4">
          <span className="font-display text-sm text-ink">{BRAND.name}</span>
          <span className="text-light">|</span>
          <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
            {BRAND.tone.join(' / ')}
          </span>
          <span className="text-light">|</span>
          <span className="text-xs text-muted">{BRAND.tagline}</span>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-light">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-light">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{subConfig.icon}</span>
              <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                {catConfig.label}
              </span>
              <svg className="w-3 h-3 text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-mono text-[10px] text-brand-orange uppercase tracking-wider">
                {subConfig.title}
              </span>
            </div>
            <h1 className="font-display text-lg text-ink">{subConfig.title}</h1>
            <p className="text-sm text-muted mt-1">{subConfig.desc}</p>
          </div>

          {/* Fields */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-3.5">
              {subConfig.fields.map(field => (
                <div key={field.id} className={field.full ? 'col-span-2' : ''}>
                  <label className="block font-mono text-[11px] text-mid uppercase tracking-wider mb-1.5">
                    {field.label}
                    {field.req && <span className="text-brand-orange ml-0.5">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={formValues[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-3 py-2 border border-light rounded-lg text-sm text-ink font-sans placeholder:text-muted/50 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 resize-none transition-colors"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formValues[field.id] || ''}
                      onChange={e => handleFieldChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg text-sm text-ink font-sans focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-colors bg-white appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239A9A9A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                      }}
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
                      className="w-full px-3 py-2 border border-light rounded-lg text-sm text-ink font-sans placeholder:text-muted/50 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <div className="px-6 py-4 border-t border-light flex items-center justify-between">
            <p className="text-[11px] text-muted font-mono">
              {subConfig.fields.filter(f => f.req).length} required field{subConfig.fields.filter(f => f.req).length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all ${
                canGenerate && !generating
                  ? 'bg-brand-orange hover:bg-brand-orange-hover active:scale-[0.98] shadow-sm'
                  : 'bg-light text-muted cursor-not-allowed'
              }`}
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate copy'
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Output card */}
        {result && (
          <div className="bg-white rounded-xl border border-light">
            {/* Output header */}
            <div className="px-6 pt-5 pb-4 border-b border-light flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-base text-ink">Generated Copy</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  On-brand
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-mid border border-light hover:border-brand-orange hover:text-brand-orange transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-orange hover:bg-brand-orange-hover transition-colors"
                >
                  {copiedId === '__all__' ? 'Copied!' : 'Copy all'}
                </button>
              </div>
            </div>

            {/* Tone match */}
            {result.toneMatch && (
              <div className="px-6 py-3 border-b border-light">
                <p className="text-xs text-muted">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mid mr-2">Tone</span>
                  {result.toneMatch}
                </p>
              </div>
            )}

            {/* Sections */}
            <div className="px-6 py-5 space-y-6">
              {result.sections.map((section) => (
                <div key={section.label}>
                  <h3 className="font-mono text-[11px] text-mid uppercase tracking-wider mb-3">
                    {section.label}
                  </h3>
                  <div className="space-y-3">
                    {section.options.map((option) => {
                      const isPrimary = primaryPicks[section.label] === option.id
                      return (
                        <div
                          key={option.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            isPrimary
                              ? 'border-brand-orange bg-brand-orange-pale/30'
                              : 'border-light hover:border-brand-orange-mid'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {isPrimary && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-brand-orange text-white uppercase">
                                  Pick
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-muted bg-pale uppercase">
                                {option.type}
                              </span>
                              <span className="text-[10px] text-muted font-mono">
                                {option.text.length} chars
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isPrimary && (
                                <button
                                  onClick={() => handleUsePrimary(section.label, option.id)}
                                  className="px-2 py-1 rounded text-[10px] font-medium text-mid border border-light hover:border-brand-orange hover:text-brand-orange transition-colors"
                                >
                                  Use this
                                </button>
                              )}
                              <button
                                onClick={() => handleCopy(option.text, option.id)}
                                className="px-2 py-1 rounded text-[10px] font-medium text-mid border border-light hover:border-brand-orange hover:text-brand-orange transition-colors"
                              >
                                {copiedId === option.id ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed font-sans">
                            {option.text}
                          </p>
                          {option.rationale && (
                            <p className="mt-2 text-[11px] text-muted italic">
                              {option.rationale}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quality checks & placeholders */}
            {(result.qualityChecks?.length > 0 || result.placeholders?.length > 0) && (
              <div className="px-6 py-4 border-t border-light flex items-start gap-8">
                {result.qualityChecks?.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] text-mid uppercase tracking-wider mb-1.5">Quality checks</p>
                    <ul className="space-y-1">
                      {result.qualityChecks.map((check, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-muted">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.placeholders?.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] text-mid uppercase tracking-wider mb-1.5">Placeholders</p>
                    <div className="flex flex-wrap gap-1">
                      {result.placeholders.map((ph, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono text-mid bg-pale">
                          {ph}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
