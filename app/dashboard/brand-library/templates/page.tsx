'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/lib/useBrand'

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Platform = 'canva' | 'slides' | 'other'

interface Template {
  id: string
  brand_id: string
  name: string
  platform: Platform
  url: string
  thumbnail_url: string | null
  thumbnail_path: string | null
  created_at: string
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const PLATFORM_LABEL: Record<Platform, string> = { canva: 'Canva', slides: 'Google Slides', other: 'Other' }
const PLATFORM_STYLE: Record<Platform, React.CSSProperties> = {
  canva:  { background: '#F0EAFE', color: '#7B2EE8' },
  slides: { background: '#E8F0FE', color: '#1A73E8' },
  other:  { background: '#F5F4F2', color: '#6B6760' },
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function TemplatesPage() {
  const { brandId } = useBrand()

  const [templates, setTemplates]   = useState<Template[]>([])
  const [loading, setLoading]       = useState(true)

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false)
  const [modalName, setModalName]   = useState('')
  const [modalPlat, setModalPlat]   = useState<Platform>('canva')
  const [modalUrl, setModalUrl]     = useState('')
  const [saving, setSaving]         = useState(false)

  // Per-card edit state
  const [editNames, setEditNames]   = useState<Record<string, string>>({})
  const [editUrls, setEditUrls]     = useState<Record<string, string>>({})
  const [thumbUploading, setThumbUploading] = useState<Record<string, boolean>>({})

  const modalNameRef = useRef<HTMLInputElement>(null)

  /* ── Fetch ──────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!brandId) return
    supabase
      .from('brand_templates')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setTemplates(data as Template[])
          const names: Record<string, string> = {}
          const urls: Record<string, string> = {}
          ;(data as Template[]).forEach(t => { names[t.id] = t.name; urls[t.id] = t.url })
          setEditNames(names); setEditUrls(urls)
        }
        setLoading(false)
      })
  }, [brandId])

  /* ── Thumbnail upload ───────────────────────────────────────────────────── */

  async function uploadThumbnail(templateId: string, file: File) {
    if (!brandId) return
    setThumbUploading(p => ({ ...p, [templateId]: true }))
    const ext = file.name.split('.').pop() || 'png'
    const path = `${brandId}/templates/${templateId}.${ext}`
    const bytes = await file.arrayBuffer()
    await supabase.storage.from('brand-assets').remove([path]).catch(() => {})
    const { error } = await supabase.storage.from('brand-assets').upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
      const thumbUrl = urlData.publicUrl + `?t=${Date.now()}`
      await fetch('/api/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId, field: 'thumbnail_url', value: urlData.publicUrl }),
      })
      await fetch('/api/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId, field: 'thumbnail_path', value: path }),
      })
      setTemplates(p => p.map(t => t.id === templateId ? { ...t, thumbnail_url: thumbUrl } : t))
    }
    setThumbUploading(p => ({ ...p, [templateId]: false }))
  }

  /* ── Save name / URL edits ──────────────────────────────────────────────── */

  async function saveField(templateId: string, field: 'name' | 'url', value: string) {
    const res = await fetch('/api/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: templateId, field, value }),
    })
    const json = await res.json()
    if (json.success) {
      setTemplates(p => p.map(t => t.id === templateId ? { ...t, [field]: value } : t))
    }
  }

  /* ── Connect (save URL) ─────────────────────────────────────────────────── */

  async function connectTemplate(templateId: string) {
    const url = editUrls[templateId]?.trim()
    if (!url) return
    await saveField(templateId, 'url', url)
  }

  /* ── Delete ──────────────────────────────────────────────────────────────── */

  async function deleteTemplate(template: Template) {
    await fetch('/api/templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: template.id, thumbnail_path: template.thumbnail_path }),
    })
    setTemplates(p => p.filter(t => t.id !== template.id))
  }

  /* ── Add new ─────────────────────────────────────────────────────────────── */

  async function saveNewTemplate() {
    if (!modalName.trim() || !brandId) return
    setSaving(true)
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_id: brandId, name: modalName.trim(), platform: modalPlat, url: modalUrl.trim() }),
    })
    const json = await res.json()
    if (json.success && json.data) {
      const t = json.data as Template
      setTemplates(p => [...p, t])
      setEditNames(p => ({ ...p, [t.id]: t.name }))
      setEditUrls(p => ({ ...p, [t.id]: t.url }))
      setModalOpen(false); setModalName(''); setModalUrl(''); setModalPlat('canva')
    }
    setSaving(false)
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>
        Loading templates…
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px 32px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0D0D0D', marginBottom: 5 }}>Templates</h1>
          <p style={{ fontSize: 13.5, color: '#6B6760', lineHeight: 1.55, maxWidth: 500 }}>
            Link your brand templates here. Branditect suggests them when you are creating new content.
          </p>
        </div>
        <button
          onClick={() => { setModalOpen(true); setTimeout(() => modalNameRef.current?.focus(), 50) }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8562A', color: 'white', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
          Add template
        </button>
      </div>

      {/* Template list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 780 }}>
        {templates.map(t => {
          const isConnected = !!t.url
          const currentUrl = editUrls[t.id] ?? t.url
          return (
            <div
              key={t.id}
              style={{ background: 'white', border: `1px solid ${isConnected ? '#E8562A' : '#EDEBE8'}`, borderLeft: isConnected ? '3px solid #E8562A' : '1px solid #EDEBE8', borderRadius: 10, padding: '13px 15px', display: 'grid', gridTemplateColumns: '64px 1fr auto', alignItems: 'start', gap: 14 }}
            >
              {/* Thumbnail */}
              <label
                style={{ width: 64, height: 64, borderRadius: 7, background: '#F5F4F2', border: '1.5px dashed #D9D6D0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0 }}
              >
                {thumbUploading[t.id] ? (
                  <div style={{ width: 18, height: 18, border: '2px solid #D9D6D0', borderTopColor: '#E8562A', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                ) : t.thumbnail_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={t.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B0ACA4" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="1.5"/><circle cx="5.5" cy="7" r="1.5"/><path d="M1 11l3.5-3.5 3 3 2.5-2.5L15 11"/></svg>
                    <span style={{ fontSize: 9, color: '#B0ACA4', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>Add image</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadThumbnail(t.id, f); e.target.value = '' }}
                />
              </label>

              {/* Info */}
              <div style={{ minWidth: 0 }}>
                {/* Name */}
                <input
                  type="text"
                  value={editNames[t.id] ?? t.name}
                  onChange={e => setEditNames(p => ({ ...p, [t.id]: e.target.value }))}
                  onBlur={e => { if (e.target.value.trim() !== t.name) saveField(t.id, 'name', e.target.value.trim()) }}
                  style={{ fontSize: 13.5, fontWeight: 500, color: '#0D0D0D', background: 'transparent', border: 'none', borderBottom: '1.5px solid transparent', outline: 'none', padding: '1px 2px', width: '100%', marginBottom: 7, fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = '#E8562A' }}
                />

                {/* Tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 20, ...PLATFORM_STYLE[t.platform] }}>
                    {PLATFORM_LABEL[t.platform]}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: '#6B6760' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#34C759' : '#D9D6D0', display: 'inline-block' }} />
                    {isConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                {/* URL row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="text"
                    value={currentUrl || ''}
                    onChange={e => setEditUrls(p => ({ ...p, [t.id]: e.target.value }))}
                    placeholder="Paste template link…"
                    style={{ flex: 1, fontSize: 12, fontFamily: 'inherit', color: '#3A3835', background: '#F5F4F2', border: '1px solid #EDEBE8', borderRadius: 6, padding: '6px 10px', outline: 'none', minWidth: 0, transition: 'border-color 0.15s' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#E8562A'; (e.target as HTMLInputElement).style.background = 'white' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#EDEBE8'; (e.target as HTMLInputElement).style.background = '#F5F4F2'; if ((e.target.value.trim() || '') !== (t.url || '')) saveField(t.id, 'url', e.target.value.trim()) }}
                  />
                  {isConnected ? (
                    <>
                      <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', padding: '6px 11px', borderRadius: 6, background: '#E9F7EE', color: '#1A7A40', border: '1px solid #B8E6C8', cursor: 'default', flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3,8 7,12 13,4"/></svg>
                        Saved
                      </button>
                      <a href={t.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B6760', background: 'transparent', border: '1px solid #EDEBE8', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9"/><polyline points="10,2 14,2 14,6"/><line x1="14" y1="2" x2="8" y2="8"/></svg>
                        Open
                      </a>
                    </>
                  ) : (
                    <button
                      onClick={() => connectTemplate(t.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', padding: '6px 12px', borderRadius: 6, background: '#E8562A', color: 'white', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Delete */}
              <div style={{ paddingTop: 2 }}>
                <button
                  onClick={() => deleteTemplate(t)}
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: '#B0ACA4' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FDE8E8'; (e.currentTarget as HTMLButtonElement).style.color = '#C0392B' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#B0ACA4' }}
                  title="Remove"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,4 13,4"/><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><rect x="4" y="4" width="8" height="10" rx="1"/><line x1="6" y1="7" x2="6" y2="11"/><line x1="10" y1="7" x2="10" y2="11"/></svg>
                </button>
              </div>
            </div>
          )
        })}

        {/* Add card */}
        <button
          onClick={() => { setModalOpen(true); setTimeout(() => modalNameRef.current?.focus(), 50) }}
          style={{ background: 'transparent', border: '1.5px dashed #D9D6D0', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', fontFamily: 'inherit' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8562A'; (e.currentTarget as HTMLButtonElement).style.background = '#FBE9E2' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D9D6D0'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 7, background: '#EDEBE8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6B6760" strokeWidth="1.5"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
          </div>
          <span style={{ fontSize: 13, color: '#6B6760' }}>Add another template</span>
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div style={{ background: 'white', borderRadius: 14, width: 460, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0D0D0D', marginBottom: 4 }}>Add template</h2>
            <p style={{ fontSize: 13, color: '#6B6760', marginBottom: 22, lineHeight: 1.55 }}>
              Name it however makes sense for your workflow — like &ldquo;Post — Product Launch — Square&rdquo;.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3835', marginBottom: 6, display: 'block' }}>Name</label>
              <input
                ref={modalNameRef}
                type="text"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNewTemplate()}
                placeholder="e.g. Post — Product Launch — Square"
                style={{ width: '100%', fontSize: 13, fontFamily: 'inherit', background: '#F5F4F2', border: '1px solid #EDEBE8', borderRadius: 6, padding: '9px 12px', outline: 'none' }}
              />
              <div style={{ fontSize: 11, color: '#B0ACA4', marginTop: 4 }}>Use dashes to separate type, campaign, and format.</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3835', marginBottom: 6, display: 'block' }}>Platform</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['canva', 'slides', 'other'] as Platform[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setModalPlat(p)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 10px', border: `1px solid ${modalPlat === p ? '#E8562A' : '#EDEBE8'}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: modalPlat === p ? '#FBE9E2' : 'white', color: modalPlat === p ? '#E8562A' : '#3A3835', transition: 'all 0.12s' }}
                  >
                    {PLATFORM_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3835', marginBottom: 6, display: 'block' }}>Template link</label>
              <input
                type="url"
                value={modalUrl}
                onChange={e => setModalUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNewTemplate()}
                placeholder="https://canva.link/… or docs.google.com/…"
                style={{ width: '100%', fontSize: 13, fontFamily: 'inherit', background: '#F5F4F2', border: '1px solid #EDEBE8', borderRadius: 6, padding: '9px 12px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#6B6760', border: '1px solid #D9D6D0', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={saveNewTemplate}
                disabled={!modalName.trim() || saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: !modalName.trim() || saving ? '#F5F4F2' : '#E8562A', color: !modalName.trim() || saving ? '#B0ACA4' : 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: !modalName.trim() || saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {saving ? 'Adding…' : 'Add template'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
