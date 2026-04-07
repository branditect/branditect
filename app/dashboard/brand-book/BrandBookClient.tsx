'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/lib/useBrand'
type PDFJSLib = typeof import('pdfjs-dist')
let pdfjsLib: PDFJSLib | null = null

async function getPdfjs(): Promise<PDFJSLib> {
  if (pdfjsLib) return pdfjsLib
  pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  return pdfjsLib
}

interface Page {
  id: number
  page_number: number
  file_url: string
  file_name?: string
}

interface Asset {
  id: number
  category: string
  file_url: string
  file_name?: string
}

interface Color {
  id: number
  hex: string
  name: string
}

const ASSET_CATEGORIES = [
  { id: 'logo',       label: 'Logos',                   accept: 'image/*,.svg,.eps,.ai' },
  { id: 'background', label: 'Backgrounds & gradients', accept: 'image/*' },
  { id: 'icon',       label: 'Icons',                   accept: 'image/*,.svg' },
  { id: 'graphic',    label: 'Graphics',                accept: 'image/*,.svg' },
]

export default function BrandBookClient() {
  const { brandId, loading: brandLoading } = useBrand()

  const [pages, setPages] = useState<Page[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [curPage, setCurPage] = useState(0)
  const [viewMode, setViewMode] = useState<'book' | 'stack'>('book')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [assetUploading, setAssetUploading] = useState<string | null>(null)
  const [chatMsgs, setChatMsgs] = useState([
    { type: 'bot', text: 'Upload your brand book and I can answer questions about it — colors, typography, logo rules, how to use the brand...' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [addColorOpen, setAddColorOpen] = useState(false)
  const [newColorHex, setNewColorHex] = useState('')
  const [newColorName, setNewColorName] = useState('')

  const mainFileRef = useRef<HTMLInputElement>(null)
  const chatMsgsRef = useRef<HTMLDivElement>(null)
  const assetFileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // ── Load data from Supabase ──────────────────────────────────────────────

  useEffect(() => {
    if (brandLoading || brandId === 'default') return

    async function load() {
      const [pagesRes, assetsRes, colorsRes] = await Promise.all([
        supabase
          .from('brand_book_pages')
          .select('*')
          .eq('brand_id', brandId)
          .order('page_number', { ascending: true }),
        supabase
          .from('brand_book_assets')
          .select('*')
          .eq('brand_id', brandId)
          .order('created_at', { ascending: true }),
        supabase
          .from('brand_book_colors')
          .select('*')
          .eq('brand_id', brandId)
          .order('created_at', { ascending: true }),
      ])

      setPages(pagesRes.data || [])
      setAssets(assetsRes.data || [])
      setColors(colorsRes.data || [])
      setDataLoading(false)
    }
    load()
  }, [brandId, brandLoading])

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  // ── PDF to images ─────────────────────────────────────────────────────────

  async function pdfToImages(file: File): Promise<File[]> {
    const pdfjs = await getPdfjs()
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    const imageFiles: File[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      setUploadProgress(`Processing PDF page ${i} / ${pdf.numPages}...`)
      const page = await pdf.getPage(i)
      const scale = 2 // high-res render
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
      const pageFile = new File([blob], `${file.name}-page-${i}.png`, { type: 'image/png' })
      imageFiles.push(pageFile)
    }

    return imageFiles
  }

  // ── Page upload ──────────────────────────────────────────────────────────

  async function handlePageUpload(files: FileList | null) {
    if (!files || !files.length) return
    setUploading(true)

    // Expand PDFs into individual page images
    const allFiles: File[] = []
    for (const f of Array.from(files)) {
      if (f.type === 'application/pdf') {
        try {
          const pageImages = await pdfToImages(f)
          allFiles.push(...pageImages)
        } catch {
          showToast('Failed to process PDF: ' + f.name)
        }
      } else {
        allFiles.push(f)
      }
    }

    let uploaded = 0
    for (let i = 0; i < allFiles.length; i++) {
      setUploadProgress(`Uploading page ${i + 1} / ${allFiles.length}...`)
      const f = allFiles[i]
      const fd = new FormData()
      fd.append('file', f)
      fd.append('brandId', brandId)
      fd.append('uploadType', 'page')
      fd.append('pageNumber', String(pages.length + i + 1))

      try {
        const res = await fetch('/api/brand-book/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.success) {
          uploaded++
          setPages(prev => [...prev, {
            id: json.id,
            page_number: pages.length + i + 1,
            file_url: json.url,
            file_name: f.name,
          }])
        }
      } catch {
        showToast('Upload failed for ' + f.name)
      }
    }

    setUploading(false)
    setUploadProgress('')
    if (uploaded > 0) showToast(`${uploaded} page${uploaded > 1 ? 's' : ''} uploaded`)
  }

  async function deletePage(id: number) {
    setPages(prev => prev.filter(p => p.id !== id))
    await fetch('/api/brand-book/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, table: 'brand_book_pages', brandId }),
    })
  }

  // ── Asset upload ─────────────────────────────────────────────────────────

  async function handleAssetUpload(category: string, files: FileList | null) {
    if (!files || !files.length) return
    setAssetUploading(category)

    for (const f of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('brandId', brandId)
      fd.append('uploadType', category)

      try {
        const res = await fetch('/api/brand-book/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.success) {
          setAssets(prev => [...prev, { id: json.id, category, file_url: json.url, file_name: f.name }])
        }
      } catch {
        showToast('Upload failed')
      }
    }

    setAssetUploading(null)
    showToast('Uploaded')
  }

  async function deleteAsset(id: number) {
    setAssets(prev => prev.filter(a => a.id !== id))
    await fetch('/api/brand-book/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, table: 'brand_book_assets', brandId }),
    })
  }

  // ── Colors ───────────────────────────────────────────────────────────────

  async function addColor() {
    if (!newColorHex.trim()) return
    const hex = newColorHex.startsWith('#') ? newColorHex : '#' + newColorHex
    const name = newColorName.trim() || 'Brand color'

    const newColor: Color = { id: Date.now(), hex, name }
    setColors(prev => [...prev, newColor])
    setNewColorHex('')
    setNewColorName('')
    setAddColorOpen(false)

    try {
      const res = await fetch('/api/brand-book/color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, hex, name }),
      })
      const json = await res.json()
      if (json.id) {
        setColors(prev => prev.map(c => c.id === newColor.id ? { ...c, id: json.id } : c))
      }
    } catch {
      showToast('Failed to save color')
    }
  }

  async function deleteColor(id: number) {
    setColors(prev => prev.filter(c => c.id !== id))
    await fetch('/api/brand-book/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, table: 'brand_book_colors', brandId }),
    })
  }

  function copyColor(hex: string) {
    navigator.clipboard.writeText(hex).catch(() => {})
    showToast(`Copied ${hex}`)
  }

  // ── AI chat ──────────────────────────────────────────────────────────────

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMsgs(prev => [...prev, { type: 'user', text: msg }])
    setChatLoading(true)

    try {
      const res = await fetch('/api/brand-book/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          pageUrls: pages.slice(0, 8).map(p => p.file_url),
        }),
      })
      const data = await res.json()
      const reply = data.reply || ''

      if (reply) {
        setChatMsgs(prev => [...prev, { type: 'bot', text: reply }])
        // Auto-extract any hex codes mentioned
        const hexMatches = reply.match(/#[0-9a-fA-F]{6}/g)
        if (hexMatches) {
          const newOnes = hexMatches.filter((h: string) => !colors.find(c => c.hex.toLowerCase() === h.toLowerCase()))
          if (newOnes.length) {
            const toAdd = newOnes.map((hex: string) => ({ id: Date.now() + Math.random(), hex, name: 'Extracted' } as Color))
            setColors(prev => [...prev, ...toAdd])
            // Save extracted colors to Supabase
            for (const c of toAdd) {
              fetch('/api/brand-book/color', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandId, hex: c.hex, name: c.name }),
              })
            }
            showToast(`${newOnes.length} color${newOnes.length > 1 ? 's' : ''} extracted`)
          }
        }
      } else {
        setChatMsgs(prev => [...prev, { type: 'bot', text: 'Upload your brand book pages so I can read them and answer accurately.' }])
      }
    } catch {
      setChatMsgs(prev => [...prev, { type: 'bot', text: 'API error — please try again.' }])
    }

    setChatLoading(false)
    setTimeout(() => {
      if (chatMsgsRef.current) chatMsgsRef.current.scrollTop = chatMsgsRef.current.scrollHeight
    }, 50)
  }

  // ── Drag and drop ────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handlePageUpload(e.dataTransfer.files)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, brandId])

  // ── Navigation ───────────────────────────────────────────────────────────

  function prevPage() { if (curPage > 0) setCurPage(curPage - 1) }
  function nextPage() { if (curPage < pages.length - 1) setCurPage(curPage + 1) }

  // ── Styles ───────────────────────────────────────────────────────────────

  const s = {
    wrap: { display: 'flex', height: '100vh', fontFamily: "'DM Sans', var(--font-sans, sans-serif)", background: 'var(--color-background-primary, #fff)', overflow: 'hidden' } as React.CSSProperties,
    sidebar: { width: 248, flexShrink: 0, borderRight: '0.5px solid var(--color-border-tertiary, #e5e5e5)', display: 'flex', flexDirection: 'column', background: 'var(--color-background-secondary, #FAFAFA)', overflowY: 'auto' } as React.CSSProperties,
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-background-primary, #fff)' } as React.CSSProperties,
  }

  if (brandLoading || dataLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#999', fontSize: 13 }}>
        Loading brand book...
      </div>
    )
  }

  return (
    <div style={s.wrap}>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>

        {/* Upload zone */}
        <div style={{ padding: 16, borderBottom: '0.5px solid var(--color-border-tertiary, #e5e5e5)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #1a1a1a)', marginBottom: 12 }}>Brand book</div>
          <div
            onClick={() => mainFileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            style={{ border: `1.5px dashed ${dragOver ? 'var(--color-border-primary, #999)' : 'var(--color-border-secondary, #ddd)'}`, borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--color-background-info, #f0f7ff)' : 'var(--color-background-primary, #fff)', transition: 'all 0.14s' }}
          >
            <div style={{ width: 28, height: 28, background: 'var(--color-background-secondary, #f5f5f5)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 4.5L7 1l3.5 3.5M1 11h12" stroke="var(--color-text-primary, #1a1a1a)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary, #1a1a1a)', marginBottom: 3 }}>
              {uploading ? (uploadProgress || 'Uploading...') : 'Upload brand book'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)' }}>PNG, JPG, PDF, screenshots</div>
          </div>
          <input ref={mainFileRef} type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }} onChange={e => handlePageUpload(e.target.files)} />
          {pages.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', marginTop: 8, textAlign: 'center' }}>
              {pages.length} page{pages.length > 1 ? 's' : ''} uploaded
            </div>
          )}
          <Link
            href="/dashboard/brand-assets"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 10, padding: '8px 12px', borderRadius: 8,
              border: '0.5px solid var(--color-border-secondary, #ddd)',
              background: 'var(--color-background-primary, #fff)',
              color: 'var(--color-text-primary, #1a1a1a)',
              fontSize: 12, fontWeight: 500, textDecoration: 'none', fontFamily: 'inherit',
            }}
          >
            Brand visual assets
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)' }}>&rarr;</span>
          </Link>
        </div>

        {/* Asset sections */}
        <div style={{ flex: 1, padding: 14, overflowY: 'auto' }}>

          {ASSET_CATEGORIES.map(cat => {
            const catAssets = assets.filter(a => a.category === cat.id)
            return (
              <div key={cat.id} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-secondary, #999)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {cat.label}
                  <button
                    onClick={() => assetFileRefs.current[cat.id]?.click()}
                    style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', color: 'var(--color-text-secondary, #999)', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {assetUploading === cat.id ? '...' : '+ Add'}
                  </button>
                </div>
                <input
                  ref={el => { assetFileRefs.current[cat.id] = el }}
                  type="file"
                  accept={cat.accept}
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => handleAssetUpload(cat.id, e.target.files)}
                />

                {catAssets.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', padding: '4px 0', fontStyle: 'italic' }}>
                    No {cat.label.toLowerCase()} yet
                  </div>
                ) : (
                  catAssets.map(asset => (
                    <div key={asset.id} style={{ border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', borderRadius: 8, padding: '8px 10px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--color-background-primary, #fff)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 5, overflow: 'hidden', flexShrink: 0, border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', background: 'var(--color-background-secondary, #f5f5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-primary, #1a1a1a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {asset.file_name?.replace(/\.[^.]+$/, '') || cat.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary, #999)', marginTop: 1 }}>{cat.id}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <a href={asset.file_url} download={asset.file_name} style={{ fontSize: 10, padding: '3px 6px', borderRadius: 3, border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', color: 'var(--color-text-secondary, #999)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>&#8595;</a>
                        <button onClick={() => deleteAsset(asset.id)} style={{ fontSize: 10, padding: '3px 6px', borderRadius: 3, border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', background: 'transparent', color: 'var(--color-text-secondary, #999)', cursor: 'pointer' }}>&times;</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          })}

          {/* Color codes */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary, #999)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Color codes
              <button
                onClick={() => setAddColorOpen(p => !p)}
                style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', color: 'var(--color-text-secondary, #999)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                + Add
              </button>
            </div>

            {addColorOpen && (
              <div style={{ padding: 10, border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', borderRadius: 8, marginBottom: 8, background: 'var(--color-background-primary, #fff)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={newColorHex} onChange={e => setNewColorHex(e.target.value)} placeholder="#E8562A" style={{ padding: '5px 8px', border: '0.5px solid var(--color-border-secondary, #ddd)', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                <input value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Color name" style={{ padding: '5px 8px', border: '0.5px solid var(--color-border-secondary, #ddd)', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={addColor} style={{ flex: 1, padding: '5px 0', borderRadius: 4, border: 'none', background: 'var(--color-text-primary, #1a1a1a)', color: 'var(--color-background-primary, #fff)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                  <button onClick={() => setAddColorOpen(false)} style={{ flex: 1, padding: '5px 0', borderRadius: 4, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                </div>
              </div>
            )}

            {colors.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #999)', fontStyle: 'italic' }}>Auto-extracted when you ask AI about colors</div>
            ) : (
              colors.map(c => (
                <div key={c.id} onClick={() => copyColor(c.hex)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', marginBottom: 5, background: 'var(--color-background-primary, #fff)', cursor: 'pointer' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: c.hex, flexShrink: 0, border: '0.5px solid rgba(0,0,0,0.08)' }} />
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--color-text-primary, #1a1a1a)' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary, #999)', fontFamily: 'var(--font-mono, monospace)' }}>{c.hex}</div>
                  <button onClick={e => { e.stopPropagation(); deleteColor(c.id) }} style={{ fontSize: 10, padding: '1px 4px', border: 'none', background: 'transparent', color: 'var(--color-text-secondary, #999)', cursor: 'pointer' }}>&times;</button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: '0.5px solid var(--color-border-tertiary, #e5e5e5)', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #1a1a1a)' }}>Brand book viewer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {pages.length > 0 && (
              <div style={{ display: 'flex', border: '0.5px solid var(--color-border-secondary, #ddd)', borderRadius: 8, overflow: 'hidden' }}>
                {(['book', 'stack'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{ fontSize: 11, padding: '5px 11px', border: 'none', background: viewMode === mode ? 'var(--color-background-secondary, #f5f5f5)' : 'transparent', color: viewMode === mode ? 'var(--color-text-primary, #1a1a1a)' : 'var(--color-text-secondary, #999)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: viewMode === mode ? 500 : 400 }}>
                    {mode === 'book' ? 'Book' : 'Pages'}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => mainFileRef.current?.click()} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', color: 'var(--color-text-secondary, #999)', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add pages
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {pages.length === 0 ? (
            <div
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#111', cursor: 'pointer' }}
              onClick={() => mainFileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity={0.25}><rect x="4" y="8" width="40" height="32" rx="3" stroke="white" strokeWidth="2"/><path d="M4 18h40M14 8v10" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="24" cy="30" r="5" stroke="white" strokeWidth="2"/></svg>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Upload your brand book</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>PNG, JPG, screenshots — drag & drop or click</div>
              </div>
              <button style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Choose files
              </button>
            </div>
          ) : viewMode === 'book' ? (
            <div style={{ flex: 1, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <div style={{ width: '85%', maxWidth: 700, aspectRatio: '16/9', background: '#000', overflow: 'hidden', position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pages[curPage]?.file_url}
                  alt={`Page ${curPage + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: 'var(--color-background-secondary, #f5f5f5)' }}>
              {pages.map((page, i) => (
                <div
                  key={page.id}
                  onClick={() => { setCurPage(i); setViewMode('book') }}
                  style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', marginBottom: 10, border: '0.5px solid var(--color-border-tertiary, #e5e5e5)', cursor: 'pointer', background: '#111', position: 'relative' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={page.file_url} alt={`Page ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 10, padding: '2px 7px', borderRadius: 3 }}>{i + 1}</div>
                  <button
                    onClick={e => { e.stopPropagation(); deletePage(page.id) }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >&times;</button>
                </div>
              ))}
            </div>
          )}

          {/* Slide nav — book mode only */}
          {pages.length > 0 && viewMode === 'book' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: '0.5px solid var(--color-border-tertiary, #e5e5e5)', background: 'var(--color-background-primary, #fff)', flexShrink: 0 }}>
              <button onClick={prevPage} disabled={curPage === 0} style={{ width: 30, height: 30, borderRadius: 8, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', cursor: curPage === 0 ? 'not-allowed' : 'pointer', opacity: curPage === 0 ? 0.3 : 1, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&larr;</button>

              <div style={{ flex: 1, display: 'flex', gap: 5, overflowX: 'auto' }}>
                {pages.map((page, i) => (
                  <div
                    key={page.id}
                    onClick={() => setCurPage(i)}
                    style={{ width: 54, height: 30, borderRadius: 3, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: i === curPage ? '2px solid var(--color-text-primary, #1a1a1a)' : '0.5px solid var(--color-border-tertiary, #e5e5e5)', background: '#111' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={page.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #999)', flexShrink: 0 }}>{curPage + 1} / {pages.length}</div>
              <button onClick={nextPage} disabled={curPage === pages.length - 1} style={{ width: 30, height: 30, borderRadius: 8, border: '0.5px solid var(--color-border-secondary, #ddd)', background: 'transparent', cursor: curPage === pages.length - 1 ? 'not-allowed' : 'pointer', opacity: curPage === pages.length - 1 ? 0.3 : 1, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&rarr;</button>
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div style={{ borderTop: '0.5px solid var(--color-border-tertiary, #e5e5e5)', flexShrink: 0 }}>
          <div
            ref={chatMsgsRef}
            style={{ maxHeight: 130, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}
          >
            {chatMsgs.map((m, i) => (
              <div key={i} style={{ fontSize: 12, lineHeight: 1.55, padding: '7px 10px', maxWidth: '85%', background: m.type === 'bot' ? 'var(--color-background-secondary, #f5f5f5)' : 'var(--color-text-primary, #1a1a1a)', color: m.type === 'bot' ? 'var(--color-text-primary, #1a1a1a)' : 'var(--color-background-primary, #fff)', alignSelf: m.type === 'user' ? 'flex-end' : 'flex-start', borderRadius: m.type === 'bot' ? '8px 8px 8px 2px' : '8px 8px 2px 8px' }}>
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #999)', fontStyle: 'italic', alignSelf: 'flex-start' }}>Reading the brand materials...</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '10px 16px', alignItems: 'flex-end' }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
              placeholder={pages.length > 0 ? 'Ask about the brand — colors, fonts, logo rules...' : 'Upload brand book first, then ask questions...'}
              style={{ flex: 1, fontSize: 12, padding: '7px 10px', border: '0.5px solid var(--color-border-secondary, #ddd)', borderRadius: 8, background: 'var(--color-background-primary, #fff)', color: 'var(--color-text-primary, #1a1a1a)', resize: 'none', outline: 'none', fontFamily: 'inherit', height: 34, lineHeight: 1.5 }}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{ padding: '7px 16px', background: 'var(--color-text-primary, #1a1a1a)', color: 'var(--color-background-primary, #fff)', border: 'none', borderRadius: 8, cursor: chatLoading ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'inherit', opacity: chatLoading || !chatInput.trim() ? 0.4 : 1, flexShrink: 0 }}
            >
              Ask
            </button>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toastVisible && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-text-primary, #1a1a1a)', color: 'var(--color-background-primary, #fff)', fontSize: 11, padding: '7px 16px', borderRadius: 20, zIndex: 99, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
