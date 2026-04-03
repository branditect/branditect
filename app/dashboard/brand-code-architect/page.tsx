'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedImage {
  base64: string
  mediaType: string
  dataUrl: string
  name: string
}

interface DesignSystem {
  colors: string[]
  typography: string
  styleNotes: string
}

interface GenerateResult {
  designSystem: DesignSystem | null
  html: string
  brandAssetsUsed: boolean
}

type Step = 'idle' | 'loading' | 'done' | 'error'

const LOADING_STEPS = [
  'Analysing screenshots...',
  'Extracting design system...',
  'Building component...',
  'Finalising code...',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 800
      let w = img.width, h = img.height
      if (w > h && w > MAX) { h = (h / w) * MAX; w = MAX }
      else if (h > MAX) { w = (w / h) * MAX; h = MAX }
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mediaType: 'image/jpeg', dataUrl })
    }
    img.onerror = () => reject(new Error('Failed to read file'))
    img.src = URL.createObjectURL(file)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrandCodeArchitectPage() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [featureDesc, setFeatureDesc] = useState('')
  const [existingCode, setExistingCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const loadingTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // ── Image handling ──────────────────────────────────────────────────────────

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const remaining = 3 - images.length
    const toProcess = Array.from(files).slice(0, remaining)

    const newImages = await Promise.all(
      toProcess
        .filter((f) => f.type.startsWith('image/'))
        .map(async (file) => {
          const { base64, mediaType, dataUrl } = await fileToBase64(file)
          return { base64, mediaType, dataUrl, name: file.name } as UploadedImage
        })
    )

    setImages((prev) => [...prev, ...newImages].slice(0, 3))
  }, [images.length])

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // ── Generate ────────────────────────────────────────────────────────────────

  const clearTimers = () => {
    loadingTimers.current.forEach(clearTimeout)
    loadingTimers.current = []
  }

  const handleGenerate = async () => {
    setError('')
    if (!featureDesc.trim()) { setError('Please describe the feature you want to build.'); return }
    if (images.length === 0) { setError('Please upload at least one screenshot.'); return }

    setStep('loading')
    clearTimers()

    const delays = [0, 2000, 5000, 9000]
    delays.forEach((delay, i) => {
      const t = setTimeout(() => setLoadingStep(i), delay)
      loadingTimers.current.push(t)
    })

    try {
      const res = await fetch('/api/brand-code-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map(({ base64, mediaType }) => ({ base64, mediaType })),
          featureDescription: featureDesc,
          existingCode: existingCode || undefined,
        }),
      })

      clearTimers()

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      setResult(data)
      setStep('done')
    } catch (err) {
      clearTimers()
      setError(err instanceof Error ? err.message : 'Unexpected error. Please try again.')
      setStep('error')
    }
  }

  const handleReset = () => {
    setImages([])
    setFeatureDesc('')
    setExistingCode('')
    setShowCode(false)
    setStep('idle')
    setResult(null)
    setError('')
    setCopied(false)
  }

  const handleCopy = () => {
    if (!result?.html) return
    navigator.clipboard.writeText(result.html).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="px-8 pt-7 pb-4 border-b border-light shrink-0">
        <Link href="/dashboard" className="text-muted hover:text-ink text-[0.75rem]">← Dashboard</Link>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="font-display text-[1.5rem] text-ink tracking-tight mb-1">Brand Code Architect</h1>
            <p className="text-[0.78rem] text-muted">
              Upload screenshots, describe a feature — get production-ready, on-brand HTML code.
            </p>
          </div>
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-brand-orange bg-brand-orange-pale border border-brand-orange-mid px-2.5 py-1 rounded">
            Brand → Code
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-5xl">

          {/* ── Input state ── */}
          {(step === 'idle' || step === 'error') && (
            <div className="space-y-5">
              {/* Steps */}
              <div className="grid grid-cols-3 gap-3">
                {['Upload 1–3 screenshots', 'Describe the new feature', 'Get on-brand production code'].map((label, i) => (
                  <div key={i} className="bg-pale border border-light rounded-xl p-4">
                    <div className="font-mono text-[0.55rem] text-brand-orange uppercase tracking-wider mb-1">
                      Step {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="text-[0.78rem] font-medium text-ink">{label}</div>
                  </div>
                ))}
              </div>

              {/* Screenshot upload */}
              <div>
                <label className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted block mb-2">
                  App Screenshots
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-brand-orange bg-brand-orange-pale'
                      : 'border-light hover:border-brand-orange hover:bg-brand-orange-pale/40 bg-pale/40'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                >
                  <svg className="h-8 w-8 text-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <p className="text-[0.82rem] text-muted">
                    <span className="text-brand-orange font-medium">Drop screenshots here</span> or click to upload
                  </p>
                  <p className="font-mono text-[0.55rem] text-muted/60 mt-1">Up to 3 images — PNG, JPG, WebP</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                {images.length > 0 && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.dataUrl} alt={img.name} className="w-24 h-20 object-cover rounded-lg border border-light" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-ink text-white rounded-full text-xs flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feature description */}
              <div>
                <label className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted block mb-2">
                  Feature Description
                </label>
                <textarea
                  value={featureDesc}
                  onChange={(e) => setFeatureDesc(e.target.value)}
                  rows={4}
                  placeholder="e.g. A pricing page with three tier cards — Free, Pro, and Enterprise. Each card shows the price, features list, and a CTA button. Highlight the Pro plan."
                  className="w-full text-[0.82rem] text-ink bg-white border border-light rounded-xl px-4 py-3 resize-y outline-none focus:border-brand-orange placeholder:text-muted/50 leading-relaxed transition-colors"
                />
              </div>

              {/* Existing code — optional */}
              <div>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="flex items-center gap-1.5 font-mono text-[0.62rem] text-brand-orange mb-2"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 2L2 6L4 10M8 2L10 6L8 10" />
                  </svg>
                  {showCode ? 'Hide' : 'Paste existing code (optional)'}
                </button>
                {showCode && (
                  <textarea
                    value={existingCode}
                    onChange={(e) => setExistingCode(e.target.value)}
                    rows={6}
                    placeholder="Paste any existing component code, CSS variables, or Tailwind config..."
                    className="w-full font-mono text-[0.72rem] text-mid bg-pale border border-light rounded-xl px-4 py-3 resize-y outline-none focus:border-brand-orange placeholder:text-muted/50 leading-relaxed transition-colors"
                  />
                )}
              </div>

              {/* Error */}
              {error && (
                <p className="text-[0.78rem] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
              )}

              {/* Generate */}
              <button
                onClick={handleGenerate}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-medium text-[0.88rem] py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Generate On-Brand Component
              </button>
            </div>
          )}

          {/* ── Loading state ── */}
          {step === 'loading' && (
            <div className="flex flex-col items-center py-20">
              <div className="w-10 h-10 border-2 border-light border-t-brand-orange rounded-full animate-spin mb-8" />
              <div className="space-y-2 text-center">
                {LOADING_STEPS.map((label, i) => (
                  <p key={i} className={`text-[0.82rem] transition-colors ${
                    i < loadingStep ? 'text-green-500' : i === loadingStep ? 'text-brand-orange font-medium' : 'text-muted/40'
                  }`}>
                    {i < loadingStep ? '✓ ' : i === loadingStep ? '→ ' : ''}{label}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ── Result state ── */}
          {step === 'done' && result && (
            <div>
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-light">
                <div>
                  <h2 className="font-display text-lg text-ink">Generated Component</h2>
                </div>
                <button
                  onClick={handleReset}
                  className="font-mono text-[0.6rem] text-muted border border-light hover:border-brand-orange hover:text-brand-orange rounded-lg px-3 py-1.5 transition-colors uppercase tracking-wide"
                >
                  Start over
                </button>
              </div>

              {/* Design system */}
              {result.designSystem && (
                <div className="bg-pale border border-light rounded-xl p-4 mb-5">
                  <p className="font-mono text-[0.52rem] uppercase tracking-wider text-muted mb-3">
                    Extracted Design System
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-mono text-[0.5rem] uppercase tracking-wide text-muted mb-2">Colours</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {result.designSystem.colors.map((hex, i) => (
                          <div key={i} className="w-6 h-6 rounded border border-light" style={{ background: hex }} title={hex} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[0.5rem] uppercase tracking-wide text-muted mb-1">Typography</p>
                      <p className="text-[0.72rem] text-mid leading-relaxed">{result.designSystem.typography}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[0.5rem] uppercase tracking-wide text-muted mb-1">Style notes</p>
                      <p className="text-[0.72rem] text-mid leading-relaxed">{result.designSystem.styleNotes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview + Code */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-light rounded-xl overflow-hidden">
                  <div className="flex items-center px-4 py-2.5 bg-pale border-b border-light">
                    <span className="font-mono text-[0.55rem] uppercase tracking-wider text-muted">Visual Preview</span>
                  </div>
                  <iframe
                    srcDoc={result.html}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full border-none bg-white"
                    style={{ height: '520px' }}
                    title="Component preview"
                  />
                </div>

                <div className="border border-light rounded-xl overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-pale border-b border-light">
                    <span className="font-mono text-[0.55rem] uppercase tracking-wider text-muted">HTML Code</span>
                    <button
                      onClick={handleCopy}
                      className={`font-mono text-[0.55rem] px-2.5 py-1 rounded border transition-colors ${
                        copied ? 'text-green-600 border-green-200 bg-green-50' : 'text-brand-orange border-brand-orange-mid hover:bg-brand-orange-pale'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy code'}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-[#0A0A0F] p-4" style={{ maxHeight: '520px' }}>
                    <pre className="font-mono text-[0.7rem] text-[#E5E5E5] leading-relaxed whitespace-pre-wrap break-all">
                      {result.html}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
