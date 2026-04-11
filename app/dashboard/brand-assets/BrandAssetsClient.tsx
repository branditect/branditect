'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/lib/useBrand'

type PDFJSLib = typeof import('pdfjs-dist')
let pdfjsLib: PDFJSLib | null = null

async function getPdfjs(): Promise<PDFJSLib> {
  if (pdfjsLib) return pdfjsLib
  pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  return pdfjsLib
}

interface GuidelinePage { url: string; name: string }

interface Logo { id?: number; slot: string; file_url: string; file_name?: string }
interface BrandColor { id: number; hex: string; name: string }
interface BrandFont { id?: number; name: string; role?: string; google_font_url?: string; specimen?: string }

const LOGO_SLOTS = [
  { id: 'primary', label: 'Primary logo',            desc: 'Main logo — light backgrounds',  bg: '#ffffff', border: '1px dashed #dde2ea' },
  { id: 'dark',    label: 'Dark background version',  desc: 'White/reversed on dark',         bg: '#141c26', border: 'none' },
  { id: 'icon',    label: 'Icon / mark only',         desc: 'Symbol without wordmark',        bg: '#f7f6f4', border: '1px dashed #dde2ea' },
  { id: 'white',   label: 'White version',            desc: 'For coloured backgrounds',       bg: '#3a6ea5', border: 'none' },
]

const GOOGLE_FONT_SUGGESTIONS = ['DM Sans', 'Inter', 'Plus Jakarta Sans', 'Syne', 'Space Grotesk', 'Manrope', 'Outfit', 'Satoshi']

export default function BrandAssetsClient() {
  const { brandId, brandName, loading: brandLoading } = useBrand()

  const [activeTab, setActiveTab] = useState<'guidelines' | 'logos' | 'colors' | 'typography'>('guidelines')
  const [logos, setLogos] = useState<Record<string, Logo>>({})
  const [colors, setColors] = useState<BrandColor[]>([])
  const [fonts, setFonts] = useState<BrandFont[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [toast, setToast] = useState(''); const [toastVisible, setToastVisible] = useState(false)
  const [addColorOpen, setAddColorOpen] = useState(false)
  const [newHex, setNewHex] = useState(''); const [newName, setNewName] = useState('')
  const [addFontOpen, setAddFontOpen] = useState(false)
  const [newFontName, setNewFontName] = useState(''); const [newFontRole, setNewFontRole] = useState('body')
  const [colorExtractLoading, setColorExtractLoading] = useState(false)
  const colorScreenshotRef = useRef<HTMLInputElement>(null)
  const logoFileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const guidelineRef = useRef<HTMLInputElement>(null)
  const [guidelinePages, setGuidelinePages] = useState<GuidelinePage[]>([])
  const [guidelineProgress, setGuidelineProgress] = useState('')

  // ── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (brandLoading || brandId === 'default') return

    async function load() {
      const [logosRes, colorsRes, fontsRes] = await Promise.all([
        supabase.from('brand_logos').select('*').eq('brand_id', brandId),
        supabase.from('brand_book_colors').select('*').eq('brand_id', brandId).order('created_at'),
        supabase.from('brand_fonts').select('*').eq('brand_id', brandId),
      ])

      const logoMap: Record<string, Logo> = {}
      ;(logosRes.data || []).forEach((l: Logo) => { logoMap[l.slot] = l })
      setLogos(logoMap)
      setColors(colorsRes.data || [])
      setFonts(fontsRes.data || [])

      // Load Google Fonts for existing fonts
      ;(fontsRes.data || []).forEach((f: BrandFont) => {
        if (f.google_font_url) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = f.google_font_url
          document.head.appendChild(link)
        }
      })

      setDataLoading(false)
    }
    load()
  }, [brandId, brandLoading])

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex).catch(() => {})
    showToast(`Copied ${hex}`)
  }

  // ── Logo upload ──────────────────────────────────────────────────────────

  async function uploadLogo(slot: string, files: FileList | null) {
    if (!files?.[0]) return
    setUploading(slot)
    const fd = new FormData()
    fd.append('file', files[0])
    fd.append('brandId', brandId)
    fd.append('uploadType', `logo_${slot}`)
    try {
      const res = await fetch('/api/brand-assets/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        setLogos(prev => ({ ...prev, [slot]: { slot, file_url: json.url, file_name: files[0].name } }))
        showToast('Logo uploaded')
      }
    } catch { showToast('Upload failed') }
    setUploading(null)
  }

  async function deleteLogo(slot: string) {
    setLogos(prev => { const n = { ...prev }; delete n[slot]; return n })
    await fetch('/api/brand-assets/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, slot }),
    })
  }

  // ── Color extract from screenshot ────────────────────────────────────────

  async function extractColorsFromScreenshot(files: FileList | null) {
    if (!files?.[0]) return
    setColorExtractLoading(true)
    const fd = new FormData()
    fd.append('file', files[0])
    fd.append('brandId', brandId)
    fd.append('uploadType', 'color_screenshot')
    fd.append('extractColors', 'true')
    try {
      const res = await fetch('/api/brand-assets/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.colors?.length) {
        const newColors = json.colors.filter((c: BrandColor) =>
          !colors.find(existing => existing.hex.toLowerCase() === c.hex.toLowerCase())
        )
        setColors(prev => [...prev, ...newColors.map((c: BrandColor, i: number) => ({ ...c, id: Date.now() + i }))])
        showToast(`${json.colors.length} colors extracted`)
      } else {
        showToast('No colors found — try a clearer screenshot')
      }
    } catch { showToast('Extraction failed') }
    setColorExtractLoading(false)
  }

  // ── Add color manually ───────────────────────────────────────────────────

  async function addColor() {
    if (!newHex.trim()) return
    const hex = newHex.startsWith('#') ? newHex.trim() : '#' + newHex.trim()
    const name = newName.trim() || 'Brand color'
    const newColor: BrandColor = { id: Date.now(), hex, name }
    setColors(prev => [...prev, newColor])
    setNewHex(''); setNewName(''); setAddColorOpen(false)
    await fetch('/api/brand-book/color', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, hex, name }),
    })
    showToast('Color added')
  }

  async function deleteColor(id: number) {
    setColors(prev => prev.filter(c => c.id !== id))
    await fetch('/api/brand-book/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, table: 'brand_book_colors', brandId }),
    })
  }

  // ── Add font ─────────────────────────────────────────────────────────────

  async function addFont() {
    if (!newFontName.trim()) return
    const googleUrl = `https://fonts.googleapis.com/css2?family=${newFontName.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
    const font: BrandFont = { id: Date.now(), name: newFontName.trim(), role: newFontRole, google_font_url: googleUrl, specimen: 'The quick brown fox jumps over the lazy dog' }
    setFonts(prev => [...prev, font])
    setNewFontName(''); setAddFontOpen(false)

    // Load font in browser
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = googleUrl
    document.head.appendChild(link)

    try {
      const res = await fetch('/api/brand-assets/font', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, name: newFontName.trim(), role: newFontRole, google_font_url: googleUrl }),
      })
      const json = await res.json()
      if (json.id) {
        setFonts(prev => prev.map(f => f.id === font.id ? { ...f, id: json.id } : f))
      }
    } catch {}
    showToast('Font added')
  }

  async function deleteFont(id?: number) {
    if (!id) return
    setFonts(prev => prev.filter(f => f.id !== id))
    await fetch('/api/brand-assets/font', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  // ── Guideline PDF upload — converts pages to images ────────────────────

  async function uploadGuideline(files: FileList | null) {
    if (!files?.[0]) return
    const file = files[0]
    setUploading('guideline')

    let pageFiles: File[] = []

    if (file.type === 'application/pdf') {
      // Convert PDF pages to PNG images
      try {
        const pdfjs = await getPdfjs()
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

        for (let i = 1; i <= pdf.numPages; i++) {
          setGuidelineProgress(`Processing page ${i} / ${pdf.numPages}...`)
          const page = await pdf.getPage(i)
          const scale = 2
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')!
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (page as any).render({ canvasContext: ctx, viewport }).promise
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob(b => resolve(b!), 'image/png')
          )
          pageFiles.push(new File([blob], `${file.name}-page-${i}.png`, { type: 'image/png' }))
        }
      } catch {
        showToast('Failed to process PDF')
        setUploading(null)
        setGuidelineProgress('')
        return
      }
    } else {
      // Single image upload
      pageFiles = [file]
    }

    // Upload each page
    const uploaded: GuidelinePage[] = []
    for (let i = 0; i < pageFiles.length; i++) {
      setGuidelineProgress(`Uploading page ${i + 1} / ${pageFiles.length}...`)
      const f = pageFiles[i]
      const fd = new FormData()
      fd.append('file', f)
      fd.append('brandId', brandId)
      fd.append('uploadType', 'guideline')
      try {
        const res = await fetch('/api/brand-assets/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.success) {
          uploaded.push({ url: json.url, name: f.name })
        }
      } catch {}
    }

    setGuidelinePages(prev => [...prev, ...uploaded])
    setUploading(null)
    setGuidelineProgress('')
    if (uploaded.length) showToast(`${uploaded.length} page${uploaded.length > 1 ? 's' : ''} uploaded`)
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'guidelines', label: 'Brand guidelines' },
    { id: 'logos',      label: 'Logos' },
    { id: 'colors',     label: 'Color palette' },
    { id: 'typography', label: 'Typography' },
  ]

  if (brandLoading || dataLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#999', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        Loading brand assets...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-primary, #fff)', fontFamily: "'DM Sans', var(--font-sans, sans-serif)" }}>

      {/* Header */}
      <div style={{ padding: '28px 48px 0', borderBottom: '0.5px solid var(--color-border-tertiary, #e5e5e5)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Link href="/dashboard/brand-book" style={{ fontSize: 12, color: 'var(--color-text-secondary, #999)', textDecoration: 'none' }}>&larr; Brand book</Link>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 500, color: 'var(--color-text-primary, #1a1a1a)', margin: 0 }}>{brandName} brand library</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary, #999)', margin: '6px 0 0', lineHeight: 1.6 }}>Upload your brand assets and define your visual identity — everything Branditect needs to produce on-brand output.</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 20px', border: 'none', background: 'transparent', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: activeTab === tab.id ? '#E16C00' : 'var(--color-text-secondary, #999)', cursor: 'pointer', fontFamily: 'inherit', borderBottom: activeTab === tab.id ? '2px solid #E16C00' : '2px solid transparent', transition: 'all 0.13s' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '36px 48px', maxWidth: 1000 }}>

        {/* ── LOGOS TAB ── */}
        {activeTab === 'logos' && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary, #999)', fontWeight: 500, marginBottom: 14 }}>Logo uploads</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary, #999)', marginBottom: 24, lineHeight: 1.7 }}>Upload your logo in all variants. Drag and drop files or click to browse. Accepted formats: PNG, SVG, PDF, EPS.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {LOGO_SLOTS.map(slot => {
                const uploaded = logos[slot.id]
                const isUploading = uploading === slot.id
                return (
                  <div key={slot.id}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary, #999)', fontWeight: 500, marginBottom: 8 }}>{slot.label}</div>
                    <label
                      htmlFor={`logo-${slot.id}`}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, borderRadius: 12, background: slot.bg, border: slot.border, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                    >
                      {uploaded ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={uploaded.file_url} alt={slot.label} style={{ maxHeight: '70%', maxWidth: '80%', objectFit: 'contain' }} />
                          <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 5 }}>
                            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 3, background: 'rgba(0,0,0,0.4)', color: 'white', cursor: 'pointer' }}>Replace</span>
                            <span onClick={e => { e.preventDefault(); deleteLogo(slot.id) }} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 3, background: 'rgba(0,0,0,0.4)', color: 'white', cursor: 'pointer' }}>Remove</span>
                          </div>
                        </>
                      ) : isUploading ? (
                        <div style={{ fontSize: 12, color: slot.id === 'dark' || slot.id === 'white' ? 'rgba(255,255,255,0.5)' : 'var(--color-text-secondary, #999)' }}>Uploading...</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4v14M8 9l6-5 6 5M4 22h20" stroke={slot.id === 'dark' || slot.id === 'white' ? 'rgba(255,255,255,0.4)' : '#aaa'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span style={{ fontSize: 11, color: slot.id === 'dark' || slot.id === 'white' ? 'rgba(255,255,255,0.4)' : 'var(--color-text-secondary, #999)' }}>PNG, SVG, or PDF</span>
                        </div>
                      )}
                      <input id={`logo-${slot.id}`} ref={el => { logoFileRefs.current[slot.id] = el }} type="file" accept="image/*,.svg,.pdf,.eps" style={{ display: 'none' }} onChange={e => uploadLogo(slot.id, e.target.files)} />
                    </label>
                    {uploaded && (
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)' }}>{uploaded.file_name}</span>
                        <a href={uploaded.file_url} download={uploaded.file_name} style={{ fontSize: 11, color: '#E16C00', textDecoration: 'none' }}>&darr; Download</a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── COLORS TAB ── */}
        {activeTab === 'colors' && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary, #999)', fontWeight: 500, marginBottom: 14 }}>Color palette</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary, #999)', marginBottom: 20, lineHeight: 1.7 }}>Upload a screenshot of your brand colors page to auto-extract, or add colors manually.</p>

            {/* Screenshot upload zone */}
            <div
              onClick={() => colorScreenshotRef.current?.click()}
              style={{ border: '1.5px dashed var(--color-border-secondary, #ddd)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', marginBottom: 28, background: 'var(--color-background-secondary, #fafafa)' }}
            >
              {colorExtractLoading ? (
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary, #999)' }}>Extracting colors with AI...</div>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block' }}><rect x="3" y="3" width="18" height="18" rx="2" stroke="var(--color-text-secondary, #999)" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" fill="var(--color-text-secondary, #999)"/><path d="M3 15l5-4 4 4 3-3 6 6" stroke="var(--color-text-secondary, #999)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #999)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Drop screenshot to extract colors</div>
                </>
              )}
              <input ref={colorScreenshotRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => extractColorsFromScreenshot(e.target.files)} />
            </div>

            {/* Color swatches */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
              {colors.map(c => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 110 }}>
                  <div
                    onClick={() => copyHex(c.hex)}
                    style={{ width: 110, height: 110, borderRadius: 12, background: c.hex, border: '0.5px solid rgba(0,0,0,0.08)', cursor: 'pointer', position: 'relative' }}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); deleteColor(c.id) }}
                      style={{ position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                    >&times;</button>
                  </div>
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary, #1a1a1a)', fontFamily: 'var(--font-mono, monospace)', marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', fontFamily: 'var(--font-mono, monospace)' }}>{c.hex}</div>
                  </div>
                </div>
              ))}

              {/* Add color button */}
              <div
                onClick={() => setAddColorOpen(p => !p)}
                style={{ width: 110, height: 110, borderRadius: 12, border: '1.5px dashed var(--color-border-secondary, #ddd)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: 'var(--color-text-secondary, #999)' }}
              >+</div>
            </div>

            {/* Add color form */}
            {addColorOpen && (
              <div style={{ border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', borderRadius: 12, padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, background: 'var(--color-background-secondary, #fafafa)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', marginBottom: 5 }}>Hex code</div>
                  <input value={newHex} onChange={e => setNewHex(e.target.value)} placeholder="#E16C00" onKeyDown={e => e.key === 'Enter' && addColor()} style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary, #ddd)', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono, monospace)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', marginBottom: 5 }}>Color name</div>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Brand Orange" onKeyDown={e => e.key === 'Enter' && addColor()} style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary, #ddd)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={addColor} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#E16C00', color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Add color</button>
                <button onClick={() => setAddColorOpen(false)} style={{ padding: '7px 12px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* ── TYPOGRAPHY TAB ── */}
        {activeTab === 'typography' && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary, #999)', fontWeight: 500, marginBottom: 14 }}>Typography</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary, #999)', marginBottom: 24, lineHeight: 1.7 }}>Add your brand fonts. Search Google Fonts by name or upload a custom font file.</p>

            {fonts.map(font => (
              <div key={font.id} style={{ border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', borderRadius: 12, padding: '20px 24px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 20, background: 'var(--color-background-primary, #fff)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--color-background-secondary, #fafafa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 28, fontFamily: `'${font.name}', sans-serif`, fontWeight: 400, color: 'var(--color-text-primary, #1a1a1a)', lineHeight: 1 }}>Aa</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary, #1a1a1a)', marginBottom: 3 }}>{font.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', marginBottom: 8 }}>
                    {font.role === 'heading' ? 'Heading font' : font.role === 'body' ? 'Body copy, UI text' : 'Accent font'}
                    {font.google_font_url && ' \u00B7 Google Fonts'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary, #999)', fontFamily: `'${font.name}', sans-serif` }}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {font.google_font_url && (
                    <a href={font.google_font_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '5px 10px', borderRadius: 5, border: '0.5px solid var(--color-border-secondary, #ddd)', color: 'var(--color-text-secondary, #999)', textDecoration: 'none' }}>Open &nearr;</a>
                  )}
                  <button onClick={() => deleteFont(font.id)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 5, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', color: 'var(--color-text-secondary, #999)', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                </div>
              </div>
            ))}

            {/* Add font */}
            {addFontOpen ? (
              <div style={{ border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', borderRadius: 12, padding: '16px 20px', marginBottom: 12, background: 'var(--color-background-secondary, #fafafa)' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', marginBottom: 5 }}>Font name (Google Fonts)</div>
                    <input
                      value={newFontName}
                      onChange={e => setNewFontName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addFont()}
                      placeholder="e.g. DM Sans"
                      list="font-suggestions"
                      style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary, #ddd)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <datalist id="font-suggestions">
                      {GOOGLE_FONT_SUGGESTIONS.map(f => <option key={f} value={f} />)}
                    </datalist>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', marginBottom: 5 }}>Role</div>
                    <select value={newFontRole} onChange={e => setNewFontRole(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary, #ddd)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                      <option value="heading">Heading</option>
                      <option value="body">Body</option>
                      <option value="accent">Accent</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addFont} style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#E16C00', color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Add font</button>
                  <button onClick={() => setAddFontOpen(false)} style={{ padding: '7px 14px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddFontOpen(true)}
                style={{ width: 160, padding: 10, borderRadius: 8, border: '1.5px dashed var(--color-border-secondary, #ddd)', background: 'transparent', color: 'var(--color-text-secondary, #999)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
              >
                + Add font
              </button>
            )}
          </div>
        )}

        {/* ── GUIDELINES TAB ── */}
        {activeTab === 'guidelines' && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary, #999)', fontWeight: 500, marginBottom: 14 }}>Brand guidelines</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary, #999)', marginBottom: 20, lineHeight: 1.7 }}>Upload your brand guidelines PDF. Pages are rendered so you can scroll through them and extract assets.</p>

            {/* Upload zone — always visible */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <button
                onClick={() => guidelineRef.current?.click()}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#E16C00', color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {uploading === 'guideline' ? (guidelineProgress || 'Processing...') : guidelinePages.length > 0 ? 'Upload more pages' : 'Upload PDF'}
              </button>
              {guidelinePages.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary, #999)', alignSelf: 'center' }}>{guidelinePages.length} page{guidelinePages.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <input ref={guidelineRef} type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={e => { uploadGuideline(e.target.files); e.target.value = '' }} />

            {/* Asset shortcut buttons */}
            {guidelinePages.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #999)', alignSelf: 'center', marginRight: 4 }}>Get assets:</div>
                {[
                  { id: 'colors' as const, label: 'Color palette' },
                  { id: 'typography' as const, label: 'Typography' },
                  { id: 'logos' as const, label: 'Logos' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'var(--color-background-primary, #fff)', color: 'var(--color-text-primary, #1a1a1a)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {item.label} &rarr;
                  </button>
                ))}
              </div>
            )}

            {/* Scrollable page viewer */}
            {guidelinePages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {guidelinePages.map((page, i) => (
                  <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={page.url} alt={`Page ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{i + 1}</div>
                  </div>
                ))}
              </div>
            ) : !uploading && (
              <div
                onClick={() => guidelineRef.current?.click()}
                style={{ border: '1.5px dashed var(--color-border-secondary, #ddd)', borderRadius: 12, padding: 48, textAlign: 'center', cursor: 'pointer', background: 'var(--color-background-secondary, #fafafa)' }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}><path d="M16 4v16M8 10l8-6 8 6M4 26h24" stroke="var(--color-text-secondary, #999)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary, #1a1a1a)', marginBottom: 6 }}>Upload brand guidelines PDF</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #999)' }}>PDF or image files — pages will be rendered for browsing</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toastVisible && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-text-primary, #1a1a1a)', color: 'var(--color-background-primary, #fff)', fontSize: 12, padding: '8px 18px', borderRadius: 20, zIndex: 99, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
