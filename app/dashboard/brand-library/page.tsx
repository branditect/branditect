'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/lib/useBrand'

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface Logo { id?: number; slot: string; file_url: string; file_name?: string }
interface BrandColor { id: number; hex: string; name: string }
interface BrandFont { id?: number; name: string; role?: string; google_font_url?: string }
interface Page { id: number; page_number: number; file_url: string; file_name?: string; file_type?: string }

/* ── Constants ──────────────────────────────────────────────────────────────── */

const LOGO_SLOTS = [
  { id: 'primary', label: 'Primary logo',            bg: '#ffffff', textCol: '#C8C9CC', border: '1.5px dashed #E2E3E6' },
  { id: 'dark',    label: 'Dark background version',  bg: '#315A72', textCol: 'rgba(255,255,255,0.35)', border: 'none' },
  { id: 'icon',    label: 'Icon / mark only',         bg: '#FAFAFA', textCol: '#C8C9CC', border: '1.5px dashed #E2E3E6' },
  { id: 'white',   label: 'White version',            bg: '#87C5EA', textCol: 'rgba(255,255,255,0.4)', border: 'none' },
]

const FONT_SUGGESTIONS = ['DM Sans', 'Inter', 'Plus Jakarta Sans', 'Syne', 'Space Grotesk', 'Manrope', 'Outfit', 'Cormorant Garamond', 'Playfair Display']

type Tab = 'logos' | 'colors' | 'typography' | 'brandbook' | 'package'

const TABS: { id: Tab; label: string }[] = [
  { id: 'logos',      label: 'Logos' },
  { id: 'colors',     label: 'Color palette' },
  { id: 'typography', label: 'Typography' },
  { id: 'brandbook',  label: 'Brand guidelines' },
  { id: 'package',    label: 'Asset package' },
]

const C = {
  or: '#E16C00', orl: '#FFF0E6', payne: '#315A72', sky: '#87C5EA',
  blk: '#1A1A1A', sec: '#555555', mu: '#888888', bd: '#C8C9CC', bdl: '#E2E3E6',
  bg: '#FAFAFA',
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function VisualIdentityPage() {
  const { brandId, brandName, loading: brandLoading } = useBrand()

  const [tab, setTab] = useState<Tab>('logos')
  const [logos, setLogos] = useState<Record<string, Logo>>({})
  const [colors, setColors] = useState<BrandColor[]>([])
  const [fonts, setFonts] = useState<BrandFont[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // UI state
  const [logoUploading, setLogoUploading] = useState<string | null>(null)
  const [colorExtracting, setColorExtracting] = useState(false)
  const [addColorOpen, setAddColorOpen] = useState(false)
  const [newHex, setNewHex] = useState(''); const [newColorName, setNewColorName] = useState('')
  const [addFontOpen, setAddFontOpen] = useState(false)
  const [newFontName, setNewFontName] = useState(''); const [newFontRole, setNewFontRole] = useState('body')
  const [pageUploading, setPageUploading] = useState(false)
  const [packageUrl, setPackageUrl] = useState<string | null>(null)
  const [packageName, setPackageName] = useState<string | null>(null)
  const [packageUploading, setPackageUploading] = useState(false)
  const [toast, setToast] = useState(''); const [toastVisible, setToastVisible] = useState(false)
  const [curPage, setCurPage] = useState(0)

  // Chat state
  const [chatMsgs, setChatMsgs] = useState([{ type: 'bot', text: 'Upload your brand guidelines and I can answer questions — colors, logo rules, tone, typography...' }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Refs
  const colorScreenshotRef = useRef<HTMLInputElement>(null)
  const pageUploadRef = useRef<HTMLInputElement>(null)
  const packageUploadRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // ── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (brandLoading || brandId === 'default') return
    async function load() {
      const [logosRes, colorsRes, fontsRes, pagesRes] = await Promise.all([
        supabase.from('brand_logos').select('*').eq('brand_id', brandId),
        supabase.from('brand_book_colors').select('*').eq('brand_id', brandId).order('created_at'),
        supabase.from('brand_fonts').select('*').eq('brand_id', brandId),
        supabase.from('brand_book_pages').select('*').eq('brand_id', brandId).order('page_number'),
      ])
      const logoMap: Record<string, Logo> = {}
      ;(logosRes.data || []).forEach((l: Logo) => { logoMap[l.slot] = l })
      setLogos(logoMap)
      setColors(colorsRes.data || [])
      setFonts(fontsRes.data || [])
      setPages(pagesRes.data || [])
      // Load Google Fonts
      ;(fontsRes.data || []).forEach((f: BrandFont) => {
        if (f.google_font_url) {
          const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = f.google_font_url; document.head.appendChild(link)
        }
      })
      setDataLoading(false)
    }
    load()
  }, [brandId, brandLoading])

  function showToast(msg: string) { setToast(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 2600) }

  // ── Logo upload ─────────────────────────────────────────────────────────

  async function uploadLogo(slot: string, files: FileList | null) {
    if (!files?.[0]) return
    setLogoUploading(slot)
    const fd = new FormData(); fd.append('file', files[0]); fd.append('brandId', brandId); fd.append('uploadType', `logo_${slot}`)
    try {
      const res = await fetch('/api/brand-assets/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) { setLogos(p => ({ ...p, [slot]: { slot, file_url: json.url, file_name: files[0].name } })); showToast('Logo uploaded') }
    } catch { showToast('Upload failed') }
    setLogoUploading(null)
  }

  async function deleteLogo(slot: string) {
    setLogos(p => { const n = { ...p }; delete n[slot]; return n })
    await fetch('/api/brand-assets/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandId, slot }) })
  }

  // ── Color extract ───────────────────────────────────────────────────────

  async function extractColors(files: FileList | null) {
    if (!files?.[0]) return
    setColorExtracting(true)
    const fd = new FormData(); fd.append('file', files[0]); fd.append('brandId', brandId); fd.append('uploadType', 'color_screenshot'); fd.append('extractColors', 'true')
    try {
      const res = await fetch('/api/brand-assets/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.colors?.length) {
        const newOnes = json.colors.filter((c: BrandColor) => !colors.find(e => e.hex.toLowerCase() === c.hex.toLowerCase())).map((c: BrandColor, i: number) => ({ ...c, id: Date.now() + i }))
        setColors(p => [...p, ...newOnes]); showToast(`${json.colors.length} colors extracted`)
      } else showToast('No colors found')
    } catch { showToast('Extraction failed') }
    setColorExtracting(false)
  }

  async function addColor() {
    if (!newHex.trim()) return
    const hex = newHex.startsWith('#') ? newHex.trim() : '#' + newHex.trim()
    const name = newColorName.trim() || 'Brand color'
    setColors(p => [...p, { id: Date.now(), hex, name }]); setNewHex(''); setNewColorName(''); setAddColorOpen(false)
    await fetch('/api/brand-book/color', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandId, hex, name }) })
    showToast('Color added')
  }

  async function deleteColor(id: number) {
    setColors(p => p.filter(c => c.id !== id))
    await fetch('/api/brand-book/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, table: 'brand_book_colors', brandId }) })
  }

  // ── Font ────────────────────────────────────────────────────────────────

  async function addFont() {
    if (!newFontName.trim()) return
    const googleUrl = `https://fonts.googleapis.com/css2?family=${newFontName.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`
    setFonts(p => [...p, { id: Date.now(), name: newFontName.trim(), role: newFontRole, google_font_url: googleUrl }])
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = googleUrl; document.head.appendChild(link)
    setNewFontName(''); setAddFontOpen(false)
    await fetch('/api/brand-assets/font', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandId, name: newFontName.trim(), role: newFontRole, google_font_url: googleUrl }) }).catch(() => {})
    showToast('Font added')
  }

  // ── Pages upload ────────────────────────────────────────────────────────

  async function uploadPages(files: FileList | null) {
    if (!files?.length) return
    setPageUploading(true)
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const fd = new FormData(); fd.append('file', f); fd.append('brandId', brandId); fd.append('uploadType', 'page'); fd.append('pageNumber', String(pages.length + i + 1))
      try {
        const res = await fetch('/api/brand-book/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.success) {
          setPages(p => [...p, { id: json.id, page_number: pages.length + i + 1, file_url: json.url, file_name: f.name, file_type: json.isPdf ? 'pdf' : 'image' }])
        }
      } catch {}
    }
    setPageUploading(false); showToast(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`)
  }

  async function deletePage(id: number) {
    setPages(p => p.filter(pg => pg.id !== id))
    await fetch('/api/brand-book/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, table: 'brand_book_pages', brandId }) })
  }

  // ── Package upload ──────────────────────────────────────────────────────

  async function uploadPackage(files: FileList | null) {
    if (!files?.[0]) return
    setPackageUploading(true)
    const fd = new FormData(); fd.append('file', files[0]); fd.append('brandId', brandId); fd.append('uploadType', 'package')
    try {
      const res = await fetch('/api/brand-book/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) { setPackageUrl(json.url); setPackageName(files[0].name); showToast('Package uploaded') }
    } catch { showToast('Upload failed') }
    setPackageUploading(false)
  }

  // ── AI Chat ─────────────────────────────────────────────────────────────

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim(); setChatInput('')
    setChatMsgs(p => [...p, { type: 'user', text: msg }]); setChatLoading(true)
    try {
      const res = await fetch('/api/brand-book/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, pageUrls: pages.filter(p => p.file_type !== 'pdf').slice(0, 8).map(p => p.file_url) }),
      })
      const data = await res.json()
      const reply = data.reply || ''
      if (reply) {
        setChatMsgs(p => [...p, { type: 'bot', text: reply }])
        const hexMatches = reply.match(/#[0-9a-fA-F]{6}/g)
        if (hexMatches) {
          const newOnes = hexMatches.filter((h: string) => !colors.find(c => c.hex.toLowerCase() === h.toLowerCase()))
          if (newOnes.length) {
            setColors(p => [...p, ...newOnes.map((hex: string, i: number) => ({ id: Date.now() + i, hex, name: 'Extracted' }))])
            for (const hex of newOnes) { fetch('/api/brand-book/color', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brandId, hex, name: 'Extracted' }) }) }
          }
        }
      } else { setChatMsgs(p => [...p, { type: 'bot', text: 'Upload brand guideline pages so I can read them.' }]) }
    } catch { setChatMsgs(p => [...p, { type: 'bot', text: 'Error — please try again.' }]) }
    setChatLoading(false)
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
  }

  // ── Loading ─────────────────────────────────────────────────────────────

  if (brandLoading || dataLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.mu, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Loading visual identity...</div>
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100%', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ padding: '32px 48px 0', borderBottom: `0.5px solid ${C.bdl}`, background: 'white' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: C.blk, margin: '0 0 6px' }}>{brandName} — Visual Identity</h1>
          <p style={{ fontSize: 14, color: C.sec, margin: 0, lineHeight: 1.6 }}>Logos, colors, typography, brand guidelines and asset package — all in one place.</p>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: tab === t.id ? 600 : 500, color: tab === t.id ? C.or : C.mu, cursor: 'pointer', fontFamily: 'inherit', borderBottom: tab === t.id ? `2px solid ${C.or}` : '2px solid transparent', transition: 'all 0.13s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '36px 48px', maxWidth: 940 }}>

        {/* ── LOGOS ── */}
        {tab === 'logos' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mu, marginBottom: 6 }}>Logo uploads</div>
            <p style={{ fontSize: 14, color: C.sec, lineHeight: 1.7, marginBottom: 24 }}>Upload your logo in all variants. PNG, SVG, PDF or EPS.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {LOGO_SLOTS.map(slot => {
                const uploaded = logos[slot.id]
                const isUploading = logoUploading === slot.id
                return (
                  <div key={slot.id}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.mu, marginBottom: 7 }}>{slot.label}</div>
                    <label htmlFor={`ls-${slot.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, borderRadius: 10, background: slot.bg, border: slot.border, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                      {uploaded ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={uploaded.file_url} alt={slot.label} style={{ maxHeight: '65%', maxWidth: '75%', objectFit: 'contain' }} />
                          <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: 'rgba(0,0,0,0.4)', color: 'white' }}>Replace</span>
                            <span onClick={e => { e.preventDefault(); deleteLogo(slot.id) }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: 'rgba(0,0,0,0.4)', color: 'white', cursor: 'pointer' }}>Remove</span>
                          </div>
                        </>
                      ) : isUploading ? (
                        <span style={{ fontSize: 12, color: slot.textCol }}>Uploading...</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3v14M6 8l6-5 6 5M2 20h20" stroke={slot.textCol} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span style={{ fontSize: 11, color: slot.textCol }}>PNG, SVG or PDF</span>
                        </div>
                      )}
                      <input id={`ls-${slot.id}`} type="file" accept="image/*,.svg,.pdf,.eps" style={{ display: 'none' }} onChange={e => uploadLogo(slot.id, e.target.files)} />
                    </label>
                    {uploaded && (
                      <div style={{ marginTop: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: C.mu, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{uploaded.file_name}</span>
                        <a href={uploaded.file_url} download={uploaded.file_name} style={{ fontSize: 11, color: C.or, textDecoration: 'none' }}>Download</a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── COLORS ── */}
        {tab === 'colors' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mu, marginBottom: 6 }}>Color palette</div>
            <p style={{ fontSize: 14, color: C.sec, lineHeight: 1.7, marginBottom: 20 }}>Drop a screenshot of your brand colors to auto-extract, or add manually.</p>
            <div onClick={() => colorScreenshotRef.current?.click()} style={{ border: `1.5px dashed ${C.bdl}`, borderRadius: 10, padding: 22, textAlign: 'center', cursor: 'pointer', background: C.bg, marginBottom: 28 }}>
              {colorExtracting ? <div style={{ fontSize: 13, color: C.mu }}>Extracting colors with AI...</div> : <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mu }}>Drop screenshot to extract colors</div>}
              <input ref={colorScreenshotRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => extractColors(e.target.files)} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
              {colors.map(c => (
                <div key={c.id} style={{ width: 110 }}>
                  <div onClick={() => { navigator.clipboard.writeText(c.hex).catch(() => {}); showToast(`Copied ${c.hex}`) }} style={{ width: 110, height: 110, borderRadius: 12, background: c.hex, border: '0.5px solid rgba(0,0,0,0.06)', cursor: 'pointer', position: 'relative' }}>
                    <button onClick={e => { e.stopPropagation(); deleteColor(c.id) }} style={{ position: 'absolute', top: 5, right: 5, width: 17, height: 17, borderRadius: '50%', background: 'rgba(0,0,0,0.28)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.blk, fontFamily: 'monospace', marginTop: 7 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: C.mu, fontFamily: 'monospace' }}>{c.hex}</div>
                </div>
              ))}
              <div onClick={() => setAddColorOpen(p => !p)} style={{ width: 110, height: 110, borderRadius: 12, border: `1.5px dashed ${C.bdl}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: C.bd }}>+</div>
            </div>
            {addColorOpen && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', padding: '14px 18px', borderRadius: 10, background: C.bg, border: `0.5px solid ${C.bdl}` }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.mu, marginBottom: 5 }}>Hex</div><input value={newHex} onChange={e => setNewHex(e.target.value)} onKeyDown={e => e.key === 'Enter' && addColor()} placeholder="#E16C00" style={{ width: '100%', padding: '7px 10px', border: `0.5px solid ${C.bdl}`, borderRadius: 6, fontSize: 12, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.mu, marginBottom: 5 }}>Name</div><input value={newColorName} onChange={e => setNewColorName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addColor()} placeholder="Brand Orange" style={{ width: '100%', padding: '7px 10px', border: `0.5px solid ${C.bdl}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} /></div>
                <button onClick={addColor} style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: C.or, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                <button onClick={() => setAddColorOpen(false)} style={{ padding: '7px 12px', borderRadius: 6, border: `0.5px solid ${C.bdl}`, background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* ── TYPOGRAPHY ── */}
        {tab === 'typography' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mu, marginBottom: 6 }}>Typography</div>
            <p style={{ fontSize: 14, color: C.sec, lineHeight: 1.7, marginBottom: 24 }}>Add your brand fonts by Google Fonts name.</p>
            {fonts.map(font => (
              <div key={font.id} style={{ border: `0.5px solid ${C.bdl}`, borderRadius: 10, padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 24, fontFamily: `'${font.name}', sans-serif`, color: C.blk, lineHeight: 1 }}>Aa</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.blk, marginBottom: 2 }}>{font.name}</div>
                  <div style={{ fontSize: 11, color: C.mu, marginBottom: 7 }}>{font.role === 'heading' ? 'Heading' : font.role === 'body' ? 'Body copy' : 'Accent'} · Google Fonts</div>
                  <div style={{ fontSize: 13, color: C.sec, fontFamily: `'${font.name}', sans-serif` }}>The quick brown fox jumps over the lazy dog</div>
                </div>
                <button onClick={() => setFonts(p => p.filter(f => f.id !== font.id))} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 5, border: `0.5px solid ${C.bdl}`, background: 'transparent', color: C.mu, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
              </div>
            ))}
            {addFontOpen ? (
              <div style={{ border: `0.5px solid ${C.bdl}`, borderRadius: 10, padding: '14px 18px', background: C.bg }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 2 }}><div style={{ fontSize: 11, color: C.mu, marginBottom: 5 }}>Font name</div><input value={newFontName} onChange={e => setNewFontName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFont()} placeholder="e.g. DM Sans" list="fl" style={{ width: '100%', padding: '7px 10px', border: `0.5px solid ${C.bdl}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} /><datalist id="fl">{FONT_SUGGESTIONS.map(f => <option key={f} value={f} />)}</datalist></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.mu, marginBottom: 5 }}>Role</div><select value={newFontRole} onChange={e => setNewFontRole(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `0.5px solid ${C.bdl}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }}><option value="heading">Heading</option><option value="body">Body</option><option value="accent">Accent</option></select></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}><button onClick={addFont} style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: C.or, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Add font</button><button onClick={() => setAddFontOpen(false)} style={{ padding: '7px 12px', borderRadius: 6, border: `0.5px solid ${C.bdl}`, background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button></div>
              </div>
            ) : (
              <button onClick={() => setAddFontOpen(true)} style={{ padding: '9px 0', width: 140, borderRadius: 8, border: `1.5px dashed ${C.bdl}`, background: 'transparent', color: C.mu, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add font</button>
            )}
          </div>
        )}

        {/* ── BRAND GUIDELINES ── */}
        {tab === 'brandbook' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mu, marginBottom: 6 }}>Brand guidelines</div>
            <p style={{ fontSize: 14, color: C.sec, lineHeight: 1.7, marginBottom: 20 }}>Upload your brand book as images or PDF. The AI reads all pages and answers questions.</p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
              <button onClick={() => pageUploadRef.current?.click()} style={{ padding: '8px 18px', borderRadius: 8, border: `0.5px solid ${C.bdl}`, background: 'white', color: C.sec, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                {pageUploading ? 'Uploading...' : 'Upload pages'}
              </button>
              <span style={{ fontSize: 11, color: C.mu }}>PNG, JPG or PDF</span>
              <input ref={pageUploadRef} type="file" accept="image/*,.pdf,application/pdf" multiple style={{ display: 'none' }} onChange={e => uploadPages(e.target.files)} />
            </div>

            {pages.length > 0 ? (
              <div style={{ marginBottom: 24 }}>
                <div style={{ background: '#1a1a1a', borderRadius: 10, overflow: 'hidden', marginBottom: 8, position: 'relative', aspectRatio: '16/9' }}>
                  {pages[curPage]?.file_type === 'pdf' ? (
                    <iframe src={`${pages[curPage].file_url}#toolbar=0`} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pages[curPage]?.file_url} alt={`Page ${curPage + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>{curPage + 1} / {pages.length}</div>
                  {curPage > 0 && <button onClick={() => setCurPage(p => p - 1)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&larr;</button>}
                  {curPage < pages.length - 1 && <button onClick={() => setCurPage(p => p + 1)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&rarr;</button>}
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {pages.map((pg, i) => (
                    <div key={pg.id} onClick={() => setCurPage(i)} style={{ width: 80, height: 45, borderRadius: 5, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: i === curPage ? `2px solid ${C.or}` : '1.5px solid transparent', background: '#1a1a1a', position: 'relative' }}>
                      {pg.file_type === 'pdf'
                        ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>PDF</div>
                        // eslint-disable-next-line @next/next/no-img-element
                        : <img src={pg.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      }
                      <button onClick={e => { e.stopPropagation(); deletePage(pg.id) }} style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div onClick={() => pageUploadRef.current?.click()} style={{ border: `1.5px dashed ${C.bdl}`, borderRadius: 10, aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', background: C.bg, marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: C.mu }}>Upload your brand guidelines</div>
                <div style={{ fontSize: 11, color: C.bd }}>PNG, JPG or PDF</div>
              </div>
            )}

            {/* AI Chat */}
            <div style={{ border: `0.5px solid ${C.bdl}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: C.bg, borderBottom: `0.5px solid ${C.bdl}`, display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: C.blk }}>Ask about the brand guidelines</span>
              </div>
              <div ref={chatRef} style={{ maxHeight: 160, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {chatMsgs.map((m, i) => (
                  <div key={i} style={{ fontSize: 12, lineHeight: 1.55, padding: '7px 10px', maxWidth: '88%', background: m.type === 'bot' ? C.bg : C.payne, color: m.type === 'bot' ? C.blk : 'white', alignSelf: m.type === 'user' ? 'flex-end' : 'flex-start', borderRadius: m.type === 'bot' ? '8px 8px 8px 2px' : '8px 8px 2px 8px' }}>{m.text}</div>
                ))}
                {chatLoading && <div style={{ fontSize: 12, color: C.mu, fontStyle: 'italic' }}>Reading the brand guidelines...</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: `0.5px solid ${C.bdl}` }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="What colors does this brand use?" style={{ flex: 1, fontSize: 12, padding: '7px 10px', border: `0.5px solid ${C.bdl}`, borderRadius: 7, outline: 'none', fontFamily: 'inherit', color: C.blk, boxSizing: 'border-box' }} />
                <button onClick={sendChat} disabled={chatLoading} style={{ padding: '7px 16px', background: C.payne, color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', opacity: chatLoading ? 0.4 : 1 }}>Ask</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ASSET PACKAGE ── */}
        {tab === 'package' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mu, marginBottom: 6 }}>Brand asset package</div>
            <p style={{ fontSize: 14, color: C.sec, lineHeight: 1.7, marginBottom: 20 }}>Upload a zipped brand package for team sharing, or download individual assets.</p>

            {packageUrl ? (
              <div style={{ border: `0.5px solid ${C.bdl}`, borderRadius: 10, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, background: 'white' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.blk }}>{packageName}</div>
                  <div style={{ fontSize: 11, color: C.mu, marginTop: 2 }}>Ready to share with your team</div>
                </div>
                <a href={packageUrl} download={packageName} style={{ fontSize: 12, padding: '6px 16px', borderRadius: 7, background: C.payne, color: 'white', textDecoration: 'none', fontWeight: 500 }}>Download</a>
                <button onClick={() => packageUploadRef.current?.click()} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 7, border: `0.5px solid ${C.bdl}`, background: 'transparent', color: C.mu, cursor: 'pointer', fontFamily: 'inherit' }}>Replace</button>
              </div>
            ) : (
              <div onClick={() => packageUploadRef.current?.click()} style={{ border: `1.5px dashed ${C.bdl}`, borderRadius: 10, padding: '36px 24px', textAlign: 'center', cursor: packageUploading ? 'wait' : 'pointer', background: C.bg, marginBottom: 28 }}>
                {packageUploading ? <div style={{ fontSize: 13, color: C.mu }}>Uploading...</div> : (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.sec, marginBottom: 5 }}>Upload brand package ZIP</div>
                    <div style={{ fontSize: 12, color: C.mu }}>ZIP file containing logos, fonts, guidelines</div>
                  </>
                )}
              </div>
            )}
            <input ref={packageUploadRef} type="file" accept=".zip,.rar,.7z" style={{ display: 'none' }} onChange={e => uploadPackage(e.target.files)} />

            {/* Assets summary */}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mu, marginBottom: 12 }}>Assets in this library</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Logos', count: Object.keys(logos).length, ready: Object.keys(logos).length > 0 },
                { label: 'Colors', count: colors.length, ready: colors.length > 0 },
                { label: 'Fonts', count: fonts.length, ready: fonts.length > 0 },
                { label: 'Brand book', count: pages.length, ready: pages.length > 0 },
              ].map(item => (
                <div key={item.label} style={{ border: `0.5px solid ${C.bdl}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: item.ready ? '#EBF5FC' : C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.ready ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5 5.5-6" stroke={C.payne} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.bd }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.blk }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.mu, marginTop: 1 }}>{item.count} {item.count === 1 ? 'item' : 'items'}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Individual downloads */}
            {(Object.keys(logos).length > 0 || fonts.length > 0) && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.mu, marginBottom: 10 }}>Individual downloads</div>
                {Object.values(logos).map(logo => (
                  <div key={logo.slot} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 7, border: `0.5px solid ${C.bdl}`, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.blk }}>Logo — <span style={{ color: C.mu }}>{logo.slot}</span></span>
                    <a href={logo.file_url} download={logo.file_name} style={{ fontSize: 11, padding: '3px 12px', borderRadius: 4, border: `0.5px solid ${C.bdl}`, color: C.sec, textDecoration: 'none' }}>Download</a>
                  </div>
                ))}
                {fonts.filter(f => f.google_font_url).map(font => (
                  <div key={font.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 7, border: `0.5px solid ${C.bdl}`, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.blk }}>Font — <span style={{ color: C.mu }}>{font.name}</span></span>
                    <a href={`https://fonts.google.com/specimen/${font.name.replace(/ /g, '+')}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '3px 12px', borderRadius: 4, border: `0.5px solid ${C.bdl}`, color: C.sec, textDecoration: 'none' }}>Open</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toastVisible && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.blk, color: 'white', fontSize: 12, padding: '8px 18px', borderRadius: 20, zIndex: 99, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{toast}</div>
      )}
    </div>
  )
}
