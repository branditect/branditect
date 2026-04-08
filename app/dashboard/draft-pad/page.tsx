'use client'

import { useState, useEffect } from 'react'
import { useBrand } from '@/lib/useBrand'

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface Block {
  id: string
  type: 'heading' | 'subheading' | 'text' | 'img' | 'btn' | 'sep' | 'product'
  value: string
  label?: string
  bg?: string
  col?: string
  name?: string
  price?: string
}

interface Draft {
  id: number
  title: string
  content: string
  is_draft: boolean
  created_at: string
}

interface Template {
  key: string
  title: string
  badge: string
  desc: string
  pillBlocks: string[]
  gradientFrom: string
  gradientTo: string
  blocks: Omit<Block, 'id'>[]
}

/* ── Colors ─────────────────────────────────────────────────────────────────── */

const C = {
  or: '#E16C00', orl: '#FFF0E6',
  bd: '#C8C9CC', bg: '#FAFAFA',
  wh: '#fff', blk: '#1A1A1A', mu: '#888888',
  surface: '#FAFAFA', payne: '#315A72',
}

/* ── Sample assets ──────────────────────────────────────────────────────────── */

const IMG_ASSETS = [
  { label: 'hero-banner-v2.jpg', bg: '#F5C4B3', col: '#C44A22', short: 'hero' },
  { label: 'email-hero-dark.png', bg: '#B5D4F4', col: '#185FA5', short: 'email' },
  { label: 'ig-story-v1.png', bg: '#C0DD97', col: '#3B6D11', short: 'story' },
  { label: 'streamerx-badge.png', bg: '#F4C0D1', col: '#993556', short: 'badge' },
  { label: 'product-shot.jpg', bg: '#FAC775', col: '#854F0B', short: 'product' },
  { label: 'team-photo.jpg', bg: '#D3D1C7', col: '#555', short: 'team' },
]

const COPY_SNIPPETS = [
  { label: 'Hero', value: 'Your monthly bill just became your biggest flex.' },
  { label: 'Tagline', value: 'Always on. Never behind.' },
  { label: 'Sub-tagline', value: 'Support your favourite streamer — no extra cost, no extra effort. Just switch.' },
  { label: 'CTA', value: 'Pick your creator' },
]

const LOGO_ASSETS = [
  { label: 'logo-dark.svg', bg: '#315A72', col: '#87C5EA', short: 'Dark' },
  { label: 'logo-light.svg', bg: '#F4F3F1', col: '#1A1A1A', short: 'Light' },
  { label: 'icon-mark.svg', bg: '#C0DD97', col: '#3B6D11', short: 'V' },
  { label: 'icon-orange.svg', bg: '#FFF0E6', col: '#E16C00', short: 'V' },
]

/* ── Templates ──────────────────────────────────────────────────────────────── */

const TEMPLATES: Template[] = [
  {
    key: 'newsletter', title: 'Email newsletter', badge: 'Newsletter',
    desc: 'Hero image, headline, body copy, and a CTA button. Ready to paste into Klaviyo.',
    pillBlocks: ['Image', 'Heading', 'Text', 'Button'],
    gradientFrom: '#F5C4B3', gradientTo: '#FBF0ED',
    blocks: [
      { type: 'img', value: '', label: 'hero-banner-v2.jpg', bg: '#F5C4B3', col: '#C44A22' },
      { type: 'heading', value: 'Your monthly bill just became your biggest flex.' },
      { type: 'text', value: 'Support your favourite streamer — no extra cost, no extra effort. This April, every subscriber gets a free monthly sub to the creator of their choice.' },
      { type: 'sep', value: '' },
      { type: 'btn', value: 'Pick your creator' },
    ],
  },
  {
    key: 'landing', title: 'Campaign landing page', badge: 'Landing page',
    desc: 'Hero, headline, sub-copy, product block, and a CTA. Hand off to dev as HTML.',
    pillBlocks: ['Image', 'Heading', 'Subheading', 'Product', 'Button'],
    gradientFrom: '#B5D4F4', gradientTo: '#E6F1FB',
    blocks: [
      { type: 'img', value: '', label: 'hero-banner-v2.jpg', bg: '#F5C4B3', col: '#C44A22' },
      { type: 'heading', value: 'The only phone plan that supports your favourite creator.' },
      { type: 'subheading', value: 'Always on. Never behind.' },
      { type: 'text', value: 'Every month, your bill gives back. Pick a streamer, and we send them a sub automatically, with your plan.' },
      { type: 'product', value: '', name: 'Starter Plan', price: '12.99/mo', bg: '#F5C4B3', col: '#C44A22' },
      { type: 'btn', value: 'Get started' },
    ],
  },
  {
    key: 'ad', title: 'Ad copy brief', badge: 'Ad copy',
    desc: 'Primary text, headline options, and a CTA. Works for Meta, TikTok, or Google.',
    pillBlocks: ['Heading', 'Text', 'Divider', 'Text', 'Button'],
    gradientFrom: '#C0DD97', gradientTo: '#EAF3DE',
    blocks: [
      { type: 'heading', value: 'Primary text' },
      { type: 'text', value: 'Your phone bill just got an upgrade. Every month, a free sub to your favourite streamer. No extra cost. No extra steps. Just switch.' },
      { type: 'sep', value: '' },
      { type: 'heading', value: 'Headline options' },
      { type: 'text', value: 'A) Your bill. Your crew.\nB) Always on. Never behind.\nC) Switch and support your streamer.' },
      { type: 'btn', value: 'Switch now' },
    ],
  },
  {
    key: 'social', title: 'Social post', badge: 'Social post',
    desc: 'Visual, a punchy caption, and a CTA link. Draft and share for approval.',
    pillBlocks: ['Image', 'Text', 'Button'],
    gradientFrom: '#FAC775', gradientTo: '#FAEEDA',
    blocks: [
      { type: 'img', value: '', label: 'ig-story-v1.png', bg: '#C0DD97', col: '#3B6D11' },
      { type: 'text', value: 'Something bigger is coming for creators.\n\nWe started with Twitch. Next is everywhere.\n\nStay tuned — and make sure your plan is ready.' },
      { type: 'btn', value: 'Coming soon' },
    ],
  },
  {
    key: 'blank', title: 'Blank canvas', badge: '',
    desc: 'Start from scratch. Add blocks one by one.',
    pillBlocks: [],
    gradientFrom: '#E2E3E6', gradientTo: '#F5F5F5',
    blocks: [],
  },
]

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

let blockIdCounter = 0
function uid() { return `b${++blockIdCounter}` }

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function DraftPadPage() {
  const { brandId } = useBrand()

  // Canvas state
  const [blocks, setBlocks] = useState<Block[]>([])
  const [draftTitle, setDraftTitle] = useState('')
  const [typeBadge, setTypeBadge] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  // Sidebar state
  const [assetTab, setAssetTab] = useState<'img' | 'snip' | 'logo'>('img')
  const [assetSearch, setAssetSearch] = useState('')
  const [rsTab, setRsTab] = useState<'tpl' | 'saved'>('tpl')

  // Saved drafts
  const [savedDrafts, setSavedDrafts] = useState<Draft[]>([])
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [saveInfo, setSaveInfo] = useState('Not saved yet')

  // Load saved drafts
  useEffect(() => {
    if (!brandId || brandId === 'default') return
    fetch(`/api/mission-board/notes?brandId=${brandId}`)
      .then(r => r.json())
      .then(d => setSavedDrafts((d.data || []).filter((n: Draft) => n.is_draft)))
      .catch(() => {})
  }, [brandId])

  function showToastMsg(msg: string) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2200)
  }

  // ── Block operations ────────────────────────────────────────────────────

  function addBlock(type: Block['type']) {
    const b: Block = { id: uid(), type, value: '' }
    if (type === 'img') { b.label = 'Drop image or paste URL'; b.bg = '#E2E3E6'; b.col = '#888' }
    if (type === 'product') { b.name = 'Product name'; b.price = '0.00'; b.bg = '#FAC775'; b.col = '#854F0B' }
    setBlocks(prev => [...prev, b])
    setShowMenu(false)
  }

  function updateBlock(id: string, field: string, value: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  // ── Template loading ────────────────────────────────────────────────────

  function loadTemplate(tpl: Template) {
    setDraftTitle(tpl.title)
    setTypeBadge(tpl.badge)
    setBlocks(tpl.blocks.map(b => ({ ...b, id: uid() })))
    setRsTab('tpl')
    showToastMsg('Template loaded — make it yours')
  }

  // ── Save draft ──────────────────────────────────────────────────────────

  async function saveDraft() {
    const title = draftTitle || 'Untitled draft'
    const content = blocks.map(b => {
      if (b.type === 'heading' || b.type === 'subheading') return `## ${b.value}`
      if (b.type === 'text') return b.value
      if (b.type === 'btn') return `[${b.value}]`
      if (b.type === 'img') return `[Image: ${b.label}]`
      if (b.type === 'product') return `[Product: ${b.name} — ${b.price}]`
      return '---'
    }).join('\n\n')

    const res = await fetch('/api/mission-board/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, content, title, isDraft: true }),
    })
    const json = await res.json()
    if (json.data) {
      setSavedDrafts(prev => [json.data, ...prev])
      setSaveInfo('Saved just now')
      setRsTab('saved')
      showToastMsg('Saved to drafts')
    }
  }

  // ── Drop handler ────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const data = e.dataTransfer.getData('text/plain')
    try {
      const parsed = JSON.parse(data)
      if (parsed.type === 'img') {
        setBlocks(prev => [...prev, { id: uid(), type: 'img', value: '', label: parsed.label, bg: parsed.bg, col: parsed.col }])
      } else if (parsed.type === 'snip') {
        setBlocks(prev => [...prev, { id: uid(), type: 'text', value: parsed.value }])
      }
    } catch {}
  }

  function startDrag(e: React.DragEvent, data: object) {
    e.dataTransfer.setData('text/plain', JSON.stringify(data))
    e.dataTransfer.effectAllowed = 'copy'
  }

  // ── Filtered assets ─────────────────────────────────────────────────────

  const q = assetSearch.toLowerCase()
  const filteredImgs = IMG_ASSETS.filter(a => !q || a.label.toLowerCase().includes(q))
  const filteredSnippets = COPY_SNIPPETS.filter(a => !q || a.value.toLowerCase().includes(q))
  const filteredLogos = LOGO_ASSETS.filter(a => !q || a.label.toLowerCase().includes(q))

  // ── Styles ──────────────────────────────────────────────────────────────

  const s = {
    shell: { display: 'grid', gridTemplateColumns: '200px 1fr 220px', flex: 1, overflow: 'hidden', background: C.wh } as React.CSSProperties,
    sbHead: { padding: '14px 14px 10px', borderBottom: `0.5px solid ${C.bd}`, flexShrink: 0 } as React.CSSProperties,
    sbTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: C.blk, marginBottom: 8 },
    sbSearch: { width: '100%', padding: '5px 9px', fontSize: 11, border: `0.5px solid ${C.bd}`, borderRadius: 7, background: C.wh, color: C.blk, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' as const },
    tab: (on: boolean) => ({ flex: 1, padding: '7px 4px', fontSize: 10, fontWeight: 500, textAlign: 'center' as const, cursor: 'pointer', color: on ? C.or : C.mu, borderBottom: on ? `2px solid ${C.or}` : '2px solid transparent', background: 'none', border: 'none', borderTop: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }),
    imgThumb: (bg: string, col: string) => ({ borderRadius: 7, border: `0.5px solid ${C.bd}`, height: 56, cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, overflow: 'hidden', position: 'relative' as const, background: bg, color: col }),
    snippet: { background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 7, padding: '7px 9px', marginBottom: 5, cursor: 'grab', fontSize: 11, color: C.mu, transition: 'border-color 0.15s' },
    addBtn: { width: '100%', marginTop: 6, padding: 7, fontSize: 10.5, fontWeight: 500, border: `0.5px dashed ${C.bd}`, borderRadius: 7, background: 'transparent', color: C.mu, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={s.shell}>

        {/* ═══ LEFT: Asset library ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', background: C.surface, borderRight: `0.5px solid ${C.bd}`, minHeight: 0 }}>
          <div style={s.sbHead}>
            <div style={s.sbTitle}>Asset library</div>
            <input
              style={s.sbSearch}
              placeholder="Search assets..."
              value={assetSearch}
              onChange={e => setAssetSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', borderBottom: `0.5px solid ${C.bd}`, flexShrink: 0 }}>
            {(['img', 'snip', 'logo'] as const).map(t => (
              <button key={t} style={s.tab(assetTab === t)} onClick={() => setAssetTab(t)}>
                {t === 'img' ? 'Images' : t === 'snip' ? 'Copy' : 'Logos'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>

            {assetTab === 'img' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                  {filteredImgs.map(a => (
                    <div key={a.label} style={s.imgThumb(a.bg, a.col)} draggable onDragStart={e => startDrag(e, { type: 'img', label: a.label, bg: a.bg, col: a.col })}>
                      {a.short}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.32)', color: 'white', fontSize: 8, padding: '2px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</div>
                    </div>
                  ))}
                </div>
                <button style={s.addBtn}>+ Add new image</button>
              </>
            )}

            {assetTab === 'snip' && (
              <>
                {filteredSnippets.map((sn, i) => (
                  <div key={i} style={s.snippet} draggable onDragStart={e => startDrag(e, { type: 'snip', value: sn.value })}>
                    <div style={{ fontSize: 9, fontWeight: 500, color: C.or, marginBottom: 2 }}>{sn.label}</div>
                    {sn.value}
                  </div>
                ))}
                <button style={s.addBtn}>+ Add snippet</button>
              </>
            )}

            {assetTab === 'logo' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                  {filteredLogos.map(a => (
                    <div key={a.label} style={s.imgThumb(a.bg, a.col)} draggable onDragStart={e => startDrag(e, { type: 'img', label: a.label, bg: a.bg, col: a.col })}>
                      {a.short}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.32)', color: 'white', fontSize: 8, padding: '2px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</div>
                    </div>
                  ))}
                </div>
                <button style={s.addBtn}>+ Upload logo</button>
              </>
            )}
          </div>
        </div>

        {/* ═══ CENTER: Canvas ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: `0.5px solid ${C.bd}` }}>
          {/* Canvas header */}
          <div style={{ padding: '13px 18px 11px', borderBottom: `0.5px solid ${C.bd}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: C.wh }}>
            <input
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C.blk, minWidth: 0 }}
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              placeholder="Name this draft..."
            />
            {typeBadge && (
              <span style={{ fontSize: 10, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: C.orl, color: '#C45C00', flexShrink: 0 }}>{typeBadge}</span>
            )}
          </div>

          {/* Canvas body */}
          <div
            style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            {blocks.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32, textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.orl, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 18, color: C.or }}>P</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: C.blk, marginBottom: 6 }}>Your draft starts here</h3>
                <p style={{ fontSize: 11.5, color: C.mu, lineHeight: 1.65, maxWidth: 220 }}>Pick a template on the right to get the structure, then fill it with your images, copy, and products.</p>
              </div>
            ) : (
              blocks.map(block => (
                <div key={block.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, position: 'relative' }} className="draft-block">
                  <div style={{ opacity: 0.3, cursor: 'grab', color: C.mu, fontSize: 12, paddingTop: 3, flexShrink: 0, userSelect: 'none' }}>&#x2807;</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {block.type === 'heading' && (
                      <input
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.blk, border: 'none', outline: 'none', background: 'transparent', width: '100%', padding: '3px 0' }}
                        value={block.value}
                        onChange={e => updateBlock(block.id, 'value', e.target.value)}
                        placeholder="Heading..."
                      />
                    )}
                    {block.type === 'subheading' && (
                      <input
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 500, color: C.mu, border: 'none', outline: 'none', background: 'transparent', width: '100%', padding: '3px 0' }}
                        value={block.value}
                        onChange={e => updateBlock(block.id, 'value', e.target.value)}
                        placeholder="Subheading..."
                      />
                    )}
                    {block.type === 'text' && (
                      <textarea
                        style={{ fontSize: 12.5, color: '#555', border: 'none', outline: 'none', background: 'transparent', width: '100%', resize: 'none', lineHeight: 1.75, padding: '3px 0', fontFamily: "'DM Sans', sans-serif", minHeight: 44, boxSizing: 'border-box' }}
                        value={block.value}
                        onChange={e => updateBlock(block.id, 'value', e.target.value)}
                        placeholder="Write something..."
                        rows={3}
                      />
                    )}
                    {block.type === 'img' && (
                      <div style={{ width: '100%', borderRadius: 8, border: `0.5px solid ${C.bd}`, overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, position: 'relative', background: block.bg || '#E2E3E6', color: block.col || '#888' }}>
                          {block.label}
                        </div>
                      </div>
                    )}
                    {block.type === 'btn' && (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => updateBlock(block.id, 'value', e.currentTarget.textContent || '')}
                        style={{ background: C.or, color: 'white', padding: '8px 18px', borderRadius: 20, fontSize: 11.5, fontWeight: 500, display: 'inline-block', cursor: 'text', outline: 'none' }}
                      >
                        {block.value || 'Button'}
                      </div>
                    )}
                    {block.type === 'sep' && (
                      <div style={{ height: 1, background: C.bd, width: '100%', margin: '6px 0' }} />
                    )}
                    {block.type === 'product' && (
                      <div style={{ background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, background: block.bg || '#FAC775', color: block.col || '#854F0B' }}>IMG</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: C.blk, marginBottom: 2 }}>{block.name}</div>
                          <div style={{ fontSize: 11, color: C.mu }}>{block.price}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeBlock(block.id)} style={{ border: 'none', background: 'transparent', color: '#CCC', cursor: 'pointer', fontSize: 14, padding: '2px 4px', flexShrink: 0, opacity: 0.5 }}>&times;</button>
                </div>
              ))
            )}

            {/* Add block button */}
            {blocks.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: 'pointer', position: 'relative' }} onClick={() => setShowMenu(p => !p)}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `0.5px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.mu, flexShrink: 0, background: C.wh, lineHeight: 1 }}>+</div>
                <span style={{ fontSize: 11, color: C.mu }}>Add a block</span>
                {showMenu && (
                  <div style={{ position: 'absolute', left: 26, top: 26, background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 10, padding: 6, zIndex: 20, minWidth: 150, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} onClick={e => e.stopPropagation()}>
                    {[
                      { type: 'heading' as const, icon: 'H', label: 'Heading' },
                      { type: 'text' as const, icon: 'T', label: 'Text' },
                      { type: 'img' as const, icon: 'I', label: 'Image' },
                      { type: 'btn' as const, icon: 'B', label: 'Button' },
                      { type: 'sep' as const, icon: '-', label: 'Divider' },
                      { type: 'product' as const, icon: 'P', label: 'Product' },
                    ].map(item => (
                      <div key={item.type} onClick={() => addBlock(item.type)} style={{ padding: '7px 10px', fontSize: 11.5, color: '#555', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, width: 14, textAlign: 'center', opacity: 0.7 }}>{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Canvas bar */}
          <div style={{ padding: '11px 18px', borderTop: `0.5px solid ${C.bd}`, display: 'flex', gap: 6, alignItems: 'center', background: C.surface, flexShrink: 0 }}>
            <button onClick={saveDraft} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 7, border: `0.5px solid ${C.bd}`, background: C.wh, color: '#555', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Save to drafts</button>
            <button onClick={() => showToastMsg('Link copied')} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 7, border: `0.5px solid ${C.bd}`, background: C.wh, color: '#555', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Share link</button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: C.mu }}>{saveInfo}</span>
            <button onClick={() => showToastMsg('Sent to team for review')} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 7, border: `0.5px solid ${C.blk}`, background: C.blk, color: 'white', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Send to team</button>
          </div>
        </div>

        {/* ═══ RIGHT: Templates + Saved Drafts ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', background: C.surface, minHeight: 0 }}>
          <div style={{ padding: '14px 14px 10px', borderBottom: `0.5px solid ${C.bd}`, flexShrink: 0 }}>
            <div style={s.sbTitle}>Start from a template</div>
            <p style={{ fontSize: 10.5, color: C.mu, lineHeight: 1.55, marginTop: 2 }}>Pick a format to get the layout — then make it yours.</p>
          </div>
          <div style={{ display: 'flex', borderBottom: `0.5px solid ${C.bd}`, flexShrink: 0 }}>
            <button style={s.tab(rsTab === 'tpl')} onClick={() => setRsTab('tpl')}>Templates</button>
            <button style={s.tab(rsTab === 'saved')} onClick={() => setRsTab('saved')}>Saved drafts</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>

            {rsTab === 'tpl' && TEMPLATES.map(tpl => (
              <div key={tpl.key} onClick={() => loadTemplate(tpl)} style={{ background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 9, marginBottom: 8, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ height: 52, background: `linear-gradient(135deg, ${tpl.gradientFrom}, ${tpl.gradientTo})`, display: 'flex', alignItems: 'flex-end', padding: '7px 10px', position: 'relative' }}>
                  <span style={{ fontSize: 8.5, fontWeight: 500, color: 'white', background: 'rgba(0,0,0,0.35)', padding: '2px 6px', borderRadius: 4 }}>{tpl.badge || 'Blank'}</span>
                </div>
                <div style={{ padding: '9px 10px 10px' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11.5, fontWeight: 600, color: C.blk, marginBottom: 3 }}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: C.mu, lineHeight: 1.5 }}>{tpl.desc}</div>
                  {tpl.pillBlocks.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
                      {tpl.pillBlocks.map((p, i) => (
                        <span key={i} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: '#F2F2F0', color: C.mu, fontWeight: 500 }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {rsTab === 'saved' && (
              savedDrafts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: C.mu, fontSize: 11 }}>No saved drafts yet</div>
              ) : savedDrafts.map(draft => (
                <div key={draft.id} style={{ background: C.wh, border: `0.5px solid ${C.bd}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: C.blk, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{draft.title || 'Untitled'}</div>
                    <div style={{ fontSize: 10, color: C.mu, marginBottom: 6 }}>{new Date(draft.created_at).toLocaleDateString()}</div>
                    <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 20, fontWeight: 500, background: '#F2F0EE', color: C.mu }}>Draft</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.blk, color: 'white', fontSize: 12, padding: '9px 18px', borderRadius: 8, zIndex: 100, whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: "'DM Sans', sans-serif" }}>
          {toast}
        </div>
      )}
    </div>
  )
}
