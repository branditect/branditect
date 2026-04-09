'use client'

import { useState, useEffect } from 'react'
import { useBrand } from '@/lib/useBrand'

/* ── Types ──────────────────────────────────────────────────────────────────── */

type SectionType = 'headline' | 'text' | 'image' | 'products' | 'notes'

interface Section {
  id: string
  type: SectionType
  value: string
  label?: string
  imgName?: string
  imgBg?: string
  imgCol?: string
  products?: { key: string; name: string; price: string; letter: string; bg: string; col: string }[]
}

interface LikedCopy { id: number; title: string; content: string; created_at: string }
interface SavedDraft { id: number; title: string; content: string; created_at: string }
interface CatalogProduct { id: string; name: string; price_rrp: number | null; currency: string; description: string; type: string }

/* ── Colors ─────────────────────────────────────────────────────────────────── */

const C = {
  or: '#E16C00', orl: '#FFF0E6',
  bd: '#C8C9CC', bdl: '#E2E3E6',
  blk: '#1A1A1A', sec: '#555555', mu: '#888888',
  bg: '#FAFAFA', wh: '#fff', payne: '#315A72',
}

/* ── Sample image assets ────────────────────────────────────────────────────── */

const IMG_LIBRARY = [
  { name: 'hero-banner-v2.jpg', bg: '#F5C4B3', col: '#C44A22', short: 'hero' },
  { name: 'email-hero-dark.png', bg: '#B5D4F4', col: '#185FA5', short: 'email' },
  { name: 'ig-story-v1.png', bg: '#C0DD97', col: '#3B6D11', short: 'story' },
  { name: 'streamerx-badge.png', bg: '#F4C0D1', col: '#993556', short: 'badge' },
  { name: 'product-shot.jpg', bg: '#FAC775', col: '#854F0B', short: 'product' },
  { name: 'team-photo.jpg', bg: '#D3D1C7', col: '#555', short: 'team' },
  { name: 'logo-dark.svg', bg: C.payne, col: '#87C5EA', short: 'logo' },
  { name: 'icon-mark.svg', bg: '#EBF5FC', col: C.payne, short: 'icon' },
]

/* ── Templates ──────────────────────────────────────────────────────────────── */

const TEMPLATES = [
  { key: 'newsletter', title: 'Email newsletter', badge: 'Newsletter', desc: 'Hero image, headline, body, CTA. Paste into Klaviyo.', pills: ['Image', 'Headline', 'Text', 'Products'], from: '#F5C4B3', to: '#FBF0ED',
    sections: [
      { type: 'headline' as SectionType, value: 'Your monthly bill just became your biggest flex.' },
      { type: 'text' as SectionType, value: 'Support your favourite streamer — no extra cost, no extra effort. This April, every subscriber gets a free monthly sub to the creator of their choice.' },
      { type: 'image' as SectionType, value: '', imgName: 'hero-banner-v2.jpg', imgBg: '#F5C4B3', imgCol: '#C44A22' },
      { type: 'products' as SectionType, value: '' },
    ]},
  { key: 'landing', title: 'Campaign landing page', badge: 'Landing page', desc: 'Hero, headline, copy, products, CTA. Hand off as HTML.', pills: ['Image', 'Headline', 'Products'], from: '#B5D4F4', to: '#E6F1FB',
    sections: [
      { type: 'image' as SectionType, value: '', imgName: 'hero-banner-v2.jpg', imgBg: '#F5C4B3', imgCol: '#C44A22' },
      { type: 'headline' as SectionType, value: 'The only phone plan that supports your favourite creator.' },
      { type: 'text' as SectionType, value: 'Every month, your bill gives back. Pick a streamer, and we send them a sub — automatically, with your plan.' },
      { type: 'products' as SectionType, value: '' },
    ]},
  { key: 'ad', title: 'Ad copy brief', badge: 'Ad brief', desc: 'Primary text, headline options, CTA. For Meta or TikTok.', pills: ['Headline', 'Text', 'Notes'], from: '#C0DD97', to: '#EAF3DE',
    sections: [
      { type: 'headline' as SectionType, value: 'Primary text' },
      { type: 'text' as SectionType, value: 'Your phone bill just got an upgrade. Every month, a free sub to your favourite streamer. No extra cost. Just switch.' },
      { type: 'headline' as SectionType, value: 'Headline options' },
      { type: 'text' as SectionType, value: 'A) Your bill. Your crew.\nB) Always on. Never behind.\nC) Switch and support your streamer.' },
      { type: 'notes' as SectionType, value: '' },
    ]},
  { key: 'social', title: 'Social post', badge: 'Social post', desc: 'Visual and caption. Share for approval before posting.', pills: ['Image', 'Text'], from: '#FAC775', to: '#FAEEDA',
    sections: [
      { type: 'image' as SectionType, value: '', imgName: 'ig-story-v1.png', imgBg: '#C0DD97', imgCol: '#3B6D11' },
      { type: 'text' as SectionType, value: 'Something bigger is coming for creators.\n\nWe started with Twitch. Next is everywhere.\n\nStay tuned.' },
    ]},
  { key: 'product', title: 'Product banner', badge: 'Product banner', desc: 'Image, product card, short copy. For email or social.', pills: ['Image', 'Products', 'Text'], from: '#F4C0D1', to: '#FBEAF0',
    sections: [
      { type: 'image' as SectionType, value: '', imgName: 'product-shot.jpg', imgBg: '#FAC775', imgCol: '#854F0B' },
      { type: 'products' as SectionType, value: '' },
      { type: 'text' as SectionType, value: 'Unlimited calls and data. Plus a free monthly sub to the creator you choose.' },
    ]},
]

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

let _sid = 0
function sid() { return `s${++_sid}` }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function DraftPadPage() {
  const { brandId } = useBrand()

  const [sections, setSections] = useState<Section[]>([])
  const [draftTitle, setDraftTitle] = useState('')
  const [typeBadge, setTypeBadge] = useState('')

  // Left panel
  const [likedCopy, setLikedCopy] = useState<LikedCopy[]>([])

  // Right panel
  const [rsTab, setRsTab] = useState<'tpl' | 'saved'>('tpl')
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([])

  // Product picker
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
  const [productPickerFor, setProductPickerFor] = useState<string | null>(null)
  const [selectedProductKeys, setSelectedProductKeys] = useState<Set<string>>(new Set())

  // Image picker
  const [imgPickerFor, setImgPickerFor] = useState<string | null>(null)

  // Send modal
  const [sendModalOpen, setSendModalOpen] = useState(false)

  // Toast
  const [toast, setToast] = useState(''); const [toastVisible, setToastVisible] = useState(false)
  const [saveInfo, setSaveInfo] = useState('Not saved yet')

  function showToast(msg: string) { setToast(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 2200) }

  // ── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!brandId || brandId === 'default') return
    // Load liked copy (favorites)
    fetch(`/api/mission-board/notes?brandId=${brandId}`)
      .then(r => r.json())
      .then(d => {
        const all = d.data || []
        setLikedCopy(all.filter((n: LikedCopy & { is_favorite?: boolean }) => n.is_favorite))
        setSavedDrafts(all.filter((n: SavedDraft & { is_draft?: boolean }) => n.is_draft))
      })
      .catch(() => {})
    // Load catalog products
    fetch(`/api/catalog?brand_id=${brandId}`)
      .then(r => r.json())
      .then(d => setCatalogProducts(d.products || []))
      .catch(() => {})
  }, [brandId])

  // ── Section operations ──────────────────────────────────────────────────

  function addSection(type: SectionType, prefill?: string, label?: string) {
    const newId = sid()
    const s: Section = { id: newId, type, value: prefill || '', label }
    if (type === 'products') s.products = []
    setSections(prev => [...prev, s])
    // Auto-open picker for image and product sections
    if (type === 'image') setTimeout(() => setImgPickerFor(newId), 50)
    if (type === 'products') setTimeout(() => setProductPickerFor(newId), 50)
  }

  function updateSection(id: string, field: string, value: unknown) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s.id !== id))
  }

  function dropLiked(copy: LikedCopy) {
    addSection('text', copy.content, copy.title)
    showToast(`"${copy.title || 'Copy'}" dropped into draft`)
  }

  // ── Image picker ────────────────────────────────────────────────────────

  function pickImage(sectionId: string, img: typeof IMG_LIBRARY[0]) {
    updateSection(sectionId, 'imgName', img.name)
    updateSection(sectionId, 'imgBg', img.bg)
    updateSection(sectionId, 'imgCol', img.col)
    setImgPickerFor(null)
    showToast('Image added')
  }

  function clearImage(sectionId: string) {
    updateSection(sectionId, 'imgName', undefined)
    updateSection(sectionId, 'imgBg', undefined)
    updateSection(sectionId, 'imgCol', undefined)
  }

  // ── Product picker ──────────────────────────────────────────────────────

  function toggleProductSelect(key: string) {
    setSelectedProductKeys(prev => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else if (n.size < 3) n.add(key)
      else { showToast('Max 3 products'); return prev }
      return n
    })
  }

  function confirmProducts(sectionId: string) {
    const selected = catalogProducts.filter(p => selectedProductKeys.has(p.id)).map(p => ({
      key: p.id, name: p.name, price: p.price_rrp ? `${p.currency || 'EUR'} ${p.price_rrp}` : '', letter: p.name[0]?.toUpperCase() || 'P', bg: '#EBF5FC', col: C.payne,
    }))
    updateSection(sectionId, 'products', selected)
    setProductPickerFor(null)
    setSelectedProductKeys(new Set())
    if (selected.length) showToast('Products added to draft')
  }

  // ── Template loading ────────────────────────────────────────────────────

  function loadTemplate(tpl: typeof TEMPLATES[0]) {
    setDraftTitle(tpl.title)
    setTypeBadge(tpl.badge)
    setSections(tpl.sections.map(s => ({ ...s, id: sid(), products: s.type === 'products' ? [] : undefined })))
    showToast('Template loaded — make it yours')
  }

  // ── Save draft ──────────────────────────────────────────────────────────

  async function saveDraft() {
    const title = draftTitle || 'Untitled draft'
    const content = sections.map(s => {
      if (s.type === 'headline') return `## ${s.value}`
      if (s.type === 'text') return s.value
      if (s.type === 'image') return `[Image: ${s.imgName || 'none'}]`
      if (s.type === 'products') return (s.products || []).map(p => `[Product: ${p.name} ${p.price}]`).join('\n')
      if (s.type === 'notes') return `[Note: ${s.value}]`
      return ''
    }).join('\n\n')

    const res = await fetch('/api/mission-board/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, content, title, isDraft: true }),
    })
    const json = await res.json()
    if (json.data) { setSavedDrafts(prev => [json.data, ...prev]); setSaveInfo('Saved just now'); setRsTab('saved'); showToast('Saved to drafts') }
  }

  // ── Styles ──────────────────────────────────────────────────────────────

  const secRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as React.CSSProperties
  const secLabel = { fontSize: 10, fontWeight: 500, color: C.mu, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }
  const secRemove = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#CCC', fontFamily: "'DM Sans', sans-serif" }
  const sBtn = { fontSize: 11, padding: '6px 12px', borderRadius: 7, border: `0.5px solid ${C.bdl}`, background: C.wh, color: C.sec, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }
  const sBtnPrimary = { ...sBtn, background: C.blk, color: 'white', borderColor: C.blk }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 210px', flex: 1, overflow: 'hidden', background: C.wh }}>

        {/* ═══ LEFT: Recent Likes ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', background: C.bg, borderRight: `0.5px solid ${C.bd}`, minHeight: 0 }}>
          <div style={{ padding: '16px 14px 12px', borderBottom: `0.5px solid ${C.bd}`, flexShrink: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: C.blk, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ color: '#E8A020' }}>*</span> Recent likes
            </div>
            <div style={{ fontSize: 10.5, color: C.mu, lineHeight: 1.5 }}>Starred in Copy Architect. Click to drop into your draft.</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {likedCopy.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <p style={{ fontSize: 11, color: C.mu, lineHeight: 1.6 }}>No starred copy yet. Star outputs in the Copy Architect and they appear here.</p>
              </div>
            ) : likedCopy.map(lc => (
              <div key={lc.id} onClick={() => dropLiked(lc)} style={{ background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 9, padding: '10px 11px', marginBottom: 7, cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: C.or, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  {lc.title || 'Starred copy'} <span style={{ color: C.mu, fontWeight: 400 }}>{timeAgo(lc.created_at)}</span>
                </div>
                <div style={{ fontSize: 11, color: C.sec, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>{lc.content}</div>
                <div style={{ fontSize: 9.5, color: C.or, fontWeight: 500, marginTop: 6, opacity: 0.7 }}>+ Drop into draft</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CENTER: Canvas ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: `0.5px solid ${C.bd}` }}>
          <div style={{ padding: '13px 20px 12px', borderBottom: `0.5px solid ${C.bd}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: C.wh }}>
            <input style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C.blk }} value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Name this draft..." />
            {typeBadge && <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: C.orl, color: '#C45C00', flexShrink: 0 }}>{typeBadge}</span>}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
            {sections.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 32 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.orl, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 16, color: C.or }}>P</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.blk, marginBottom: 6 }}>Your draft starts here</h3>
                <p style={{ fontSize: 11.5, color: C.mu, lineHeight: 1.65, maxWidth: 220 }}>Pick a template on the right, or add sections below.</p>
              </div>
            )}

            {sections.map(section => (
              <div key={section.id} style={{ marginBottom: 10 }}>
                <div style={secRow}>
                  <span style={secLabel}>{section.label || section.type}</span>
                  <button style={secRemove} onClick={() => removeSection(section.id)}>Remove</button>
                </div>

                {/* Headline */}
                {section.type === 'headline' && (
                  <input value={section.value} onChange={e => updateSection(section.id, 'value', e.target.value)} placeholder="Write your headline..." style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600, color: C.blk, border: 'none', outline: 'none', background: 'transparent', width: '100%', padding: '4px 0', borderBottom: '1.5px solid transparent' }} onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = C.bdl }} onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = 'transparent' }} />
                )}

                {/* Text */}
                {section.type === 'text' && (
                  <textarea value={section.value} onChange={e => updateSection(section.id, 'value', e.target.value)} placeholder="Write your copy..." rows={4} style={{ fontSize: 13, color: C.sec, border: 'none', outline: 'none', background: 'transparent', width: '100%', resize: 'none', lineHeight: 1.8, padding: '4px 0', fontFamily: "'DM Sans', sans-serif", minHeight: 56, boxSizing: 'border-box' }} />
                )}

                {/* Image */}
                {section.type === 'image' && (
                  <div>
                    {section.imgName ? (
                      <div style={{ border: `0.5px solid ${C.bd}`, borderRadius: 10, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, background: section.imgBg, color: section.imgCol }}>IMG</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.blk, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{section.imgName}</div>
                            <div style={{ fontSize: 10, color: C.mu, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>brand-assets/{section.imgName}</div>
                          </div>
                        </div>
                        <button onClick={() => clearImage(section.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CCC', fontSize: 16, padding: 0 }}>&times;</button>
                      </div>
                    ) : (
                      <div onClick={() => setImgPickerFor(imgPickerFor === section.id ? null : section.id)} style={{ border: `0.5px dashed ${C.bdl}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="2" stroke={C.mu} strokeWidth="1.3"/><path d="M1 11l4-5 3.5 4.5 2.5-3L15 11" stroke={C.mu} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          <div><div style={{ fontSize: 12, fontWeight: 500, color: C.blk, marginBottom: 1 }}>Add image</div><div style={{ fontSize: 10.5, color: C.mu }}>Choose from asset library</div></div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 500, color: C.or }}>Browse</span>
                      </div>
                    )}
                    {imgPickerFor === section.id && (
                      <div style={{ background: C.bg, border: `0.5px solid ${C.bd}`, borderRadius: 10, padding: 12, marginTop: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: C.mu, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Asset library</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                          {IMG_LIBRARY.map(img => (
                            <div key={img.name} onClick={() => pickImage(section.id, img)} style={{ height: 50, borderRadius: 6, border: `0.5px solid ${C.bd}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, position: 'relative', overflow: 'hidden', background: img.bg, color: img.col, transition: 'all 0.15s' }}>
                              {img.short}
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: 7.5, padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Products */}
                {section.type === 'products' && (
                  <div>
                    {(section.products || []).map((p, i) => (
                      <div key={i} style={{ background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 9, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, background: p.bg, color: p.col }}>{p.letter}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: C.blk }}>{p.name}</div>
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.or, flexShrink: 0 }}>{p.price}</span>
                        <button onClick={() => updateSection(section.id, 'products', (section.products || []).filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CCC', fontSize: 16 }}>&times;</button>
                      </div>
                    ))}
                    <button onClick={() => { setProductPickerFor(productPickerFor === section.id ? null : section.id); setSelectedProductKeys(new Set()) }} style={{ ...sBtn, fontSize: 10.5, padding: '5px 10px' }}>+ Add product from catalogue</button>
                    {productPickerFor === section.id && catalogProducts.length > 0 && (
                      <div style={{ background: C.bg, border: `0.5px solid ${C.bd}`, borderRadius: 10, padding: 12, marginTop: 6 }}>
                        {catalogProducts.slice(0, 6).map(p => {
                          const isOn = selectedProductKeys.has(p.id)
                          return (
                            <div key={p.id} onClick={() => toggleProductSelect(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', border: `0.5px solid ${isOn ? C.or : C.bd}`, borderRadius: 8, cursor: 'pointer', background: isOn ? C.orl : C.wh, marginBottom: 5, transition: 'all 0.15s' }}>
                              <div style={{ width: 30, height: 30, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0, background: '#EBF5FC', color: C.payne }}>{p.name[0]}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: C.blk }}>{p.name}</div>
                                <div style={{ fontSize: 10, color: C.mu, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.type}</div>
                              </div>
                              {p.price_rrp && <span style={{ fontSize: 12, fontWeight: 600, color: C.or, flexShrink: 0 }}>{p.currency} {p.price_rrp}</span>}
                              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${isOn ? '#2A7A4B' : '#CCC'}`, background: isOn ? '#2A7A4B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', flexShrink: 0 }}>{isOn ? 'v' : ''}</div>
                            </div>
                          )
                        })}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button onClick={() => setProductPickerFor(null)} style={sBtn}>Cancel</button>
                          <button onClick={() => confirmProducts(section.id)} style={sBtnPrimary}>Add to draft</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {section.type === 'notes' && (
                  <div style={{ background: C.bg, border: `0.5px solid ${C.bd}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FAC775', flexShrink: 0 }} />
                      <span style={{ fontSize: 10.5, fontWeight: 500, color: C.mu }}>Only visible to your team — not published</span>
                    </div>
                    <textarea value={section.value} onChange={e => updateSection(section.id, 'value', e.target.value)} placeholder="Add a note for your team..." rows={3} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: C.blk, fontFamily: "'DM Sans', sans-serif", resize: 'none', lineHeight: 1.7, minHeight: 60, boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>
            ))}

            {/* Add section bar */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '14px 0 4px', borderTop: sections.length > 0 ? `0.5px solid ${C.bd}` : 'none', marginTop: sections.length > 0 ? 6 : 0 }}>
              <span style={{ fontSize: 10, color: C.mu, width: '100%', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Add section</span>
              {[
                { type: 'headline' as SectionType, label: 'Headline' },
                { type: 'text' as SectionType, label: 'Text' },
                { type: 'image' as SectionType, label: 'Image' },
                { type: 'products' as SectionType, label: 'Products' },
                { type: 'notes' as SectionType, label: 'Notes' },
              ].map(item => (
                <button key={item.type} onClick={() => addSection(item.type)} style={{ fontSize: 11, padding: '6px 12px', border: `0.5px dashed ${C.bdl}`, borderRadius: 7, background: 'transparent', color: C.mu, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas bar */}
          <div style={{ padding: '11px 20px', borderTop: `0.5px solid ${C.bd}`, display: 'flex', gap: 6, alignItems: 'center', background: C.bg, flexShrink: 0 }}>
            <button onClick={saveDraft} style={sBtn}>Save to drafts</button>
            <button onClick={() => showToast('Link copied')} style={sBtn}>Share link</button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: C.mu }}>{saveInfo}</span>
            <button onClick={() => setSendModalOpen(true)} style={sBtnPrimary}>Send to team</button>
          </div>
        </div>

        {/* ═══ RIGHT: Templates + Saved ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', background: C.bg, minHeight: 0 }}>
          <div style={{ padding: '16px 14px 12px', borderBottom: `0.5px solid ${C.bd}`, flexShrink: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: C.blk, marginBottom: 4 }}>Start from a template</div>
            <div style={{ fontSize: 10.5, color: C.mu, lineHeight: 1.5 }}>Pick a format, then fill it with your assets.</div>
          </div>
          <div style={{ display: 'flex', borderBottom: `0.5px solid ${C.bd}`, flexShrink: 0 }}>
            {(['tpl', 'saved'] as const).map(t => (
              <button key={t} onClick={() => setRsTab(t)} style={{ flex: 1, padding: '7px 4px', fontSize: 10, fontWeight: 500, textAlign: 'center', cursor: 'pointer', color: rsTab === t ? C.or : C.mu, borderBottom: rsTab === t ? `2px solid ${C.or}` : '2px solid transparent', background: 'none', border: 'none', borderTop: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                {t === 'tpl' ? 'Templates' : 'Saved'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {rsTab === 'tpl' && TEMPLATES.map(tpl => (
              <div key={tpl.key} onClick={() => loadTemplate(tpl)} style={{ background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 9, marginBottom: 8, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ height: 44, background: `linear-gradient(135deg, ${tpl.from}, ${tpl.to})`, position: 'relative', display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                  <span style={{ fontSize: 8.5, fontWeight: 500, color: 'white', background: 'rgba(0,0,0,0.32)', padding: '2px 6px', borderRadius: 3, marginLeft: 8 }}>{tpl.badge}</span>
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: C.blk, marginBottom: 3 }}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: C.mu, lineHeight: 1.5 }}>{tpl.desc}</div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
                    {tpl.pills.map((p, i) => <span key={i} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, background: '#F2F2F0', color: C.mu, fontWeight: 500 }}>{p}</span>)}
                  </div>
                </div>
              </div>
            ))}
            {rsTab === 'saved' && (
              savedDrafts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: C.mu, fontSize: 11 }}>No saved drafts yet</div>
              ) : savedDrafts.map(d => (
                <div key={d.id} style={{ background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 8, marginBottom: 7, overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: C.blk, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title || 'Untitled'}</div>
                    <div style={{ fontSize: 10, color: C.mu }}>{timeAgo(d.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Send modal */}
      {sendModalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setSendModalOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.wh, borderRadius: 12, padding: 22, width: 310 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Send to team</div>
            <div style={{ fontSize: 11.5, color: C.mu, marginBottom: 16 }}>They will get a view link and notification.</div>
            <textarea placeholder="Add a note for your team..." rows={3} style={{ width: '100%', padding: '8px 10px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", border: `0.5px solid ${C.bdl}`, borderRadius: 7, resize: 'none', outline: 'none', color: C.blk, marginBottom: 14, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => setSendModalOpen(false)} style={sBtn}>Cancel</button>
              <button onClick={() => { setSendModalOpen(false); showToast('Draft sent — team notified') }} style={sBtnPrimary}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastVisible && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.blk, color: 'white', fontSize: 12, padding: '9px 18px', borderRadius: 8, zIndex: 200, whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: "'DM Sans', sans-serif" }}>{toast}</div>
      )}
    </div>
  )
}
