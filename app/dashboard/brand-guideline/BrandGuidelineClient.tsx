'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/lib/useBrand'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SectionKey = 'logos' | 'typography' | 'colors' | 'imgstyle' | 'buttons' | 'graphics' | 'icons' | 'packages' | 'social'

interface PaletteColor { name: string; hex: string; role: string; aa: boolean; aaa: boolean }
interface LogoVariant   { bg: string; tc: string; dotC: string; label: string }
interface TypeRow       { role: string; size: string; wt: string; tr: string; usage: string; sample: string }
interface PackageItem   { name: string; desc: string; icon: string; includes: string[]; size: string }
interface ColorRule     { label: string; dots: string[]; rule: string }
interface ButtonStyle   { label: string; bg: string; tc: string; border: string; radius: string; usage: string }

interface BrandData {
  meta:       { name: string; tagline: string }
  logos:      { variants: LogoVariant[]; restrictions: string[] }
  typography: { scale: TypeRow[]; dos: string[]; donts: string[] }
  colors:     { palette: PaletteColor[]; rules: ColorRule[] }
  imgstyle:   { philosophy: string; approved: string[]; prohibited: string[] }
  buttons:    { styles: ButtonStyle[]; notes: string[] }
  graphics:   { description: string; items: { label: string; url?: string }[] }
  icons:      { style: string; items: { label: string; url?: string }[] }
  packages:   { items: PackageItem[] }
  social:     { canvaUrl: string; guidelines: string[]; sizes: { platform: string; size: string }[] }
}

interface BrandImage {
  id: string
  url: string
  storage_path: string
  category: string
  title: string
  meta: Record<string, string> | null
}

interface BrandTextData {
  logoDescription?: string
  typographyIntro?: string
  colorPhilosophy?: string
  imageryPhilosophy?: string
  buttonPhilosophy?: string
  graphicElementsIntro?: string
  iconsIntro?: string
  packagingIntro?: string
  socialIntro?: string
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const SECTION_LABELS: Record<SectionKey, string> = {
  logos:      'Logos',
  typography: 'Typography',
  colors:     'Color palette',
  imgstyle:   'Image style',
  buttons:    'Button styles',
  graphics:   'Graphic elements',
  icons:      'Icons',
  packages:   'Package style',
  social:     'Social media',
}

const NAV_ITEMS: { id: SectionKey; label: string }[] = [
  { id: 'logos',      label: 'Logos' },
  { id: 'typography', label: 'Typography' },
  { id: 'colors',     label: 'Color palette' },
  { id: 'imgstyle',   label: 'Image style' },
  { id: 'buttons',    label: 'Button styles' },
  { id: 'graphics',   label: 'Graphic elements' },
  { id: 'icons',      label: 'Icons' },
  { id: 'packages',   label: 'Package style' },
  { id: 'social',     label: 'Social media' },
]

const EP_HINTS: Record<SectionKey, string> = {
  logos:      'e.g. "Add a stacked logo variant for embroidery use"',
  typography: 'e.g. "Switch display font to 400 weight"',
  colors:     'e.g. "Add warm amber #D4830A as a secondary accent"',
  imgstyle:   'e.g. "We also shoot close-ups of water droplets on materials"',
  buttons:    'e.g. "Add a ghost button variant with dashed border"',
  graphics:   'e.g. "Add a halftone dot pattern as a background texture"',
  icons:      'e.g. "Switch to outlined 1.5px stroke style"',
  packages:   'e.g. "Add a retail shelf label template"',
  social:     'e.g. "Add Instagram Story 9:16 format guidelines"',
}

/* ------------------------------------------------------------------ */
/* Initial data builder                                                */
/* ------------------------------------------------------------------ */

function buildInitialBrandData(
  brandName: string,
  colors: { name: string; hex: string; role: string }[]
): BrandData {
  const displayColors: PaletteColor[] = colors.length > 0
    ? colors.slice(0, 4).map(c => ({ ...c, aa: true, aaa: false }))
    : [
        { name: 'Deep Navy',   hex: '#141c26', role: 'Primary backgrounds, headlines', aa: true, aaa: true  },
        { name: 'Steel Blue',  hex: '#3a6ea5', role: 'Accent, interactive elements',   aa: true, aaa: false },
        { name: 'Off-white',   hex: '#f7f6f4', role: 'Light backgrounds, cards',       aa: true, aaa: true  },
        { name: 'Field Green', hex: '#6b8a6e', role: 'Environmental, secondary',       aa: true, aaa: false },
      ]

  return {
    meta: { name: brandName || 'Brand', tagline: 'Your brand tagline' },
    logos: {
      variants: [
        { bg: '#141c26', tc: 'white',   dotC: 'rgba(255,255,255,0.6)', label: 'Primary — dark backgrounds'   },
        { bg: '#f7f6f4', tc: '#141c26', dotC: '#141c26',               label: 'Reversed — light backgrounds' },
        { bg: '#e8ecf0', tc: '#141c26', dotC: '#141c26',               label: 'On grey — approved'           },
        { bg: '#3a6ea5', tc: 'white',   dotC: 'rgba(255,255,255,0.7)', label: 'On brand colour'              },
      ],
      restrictions: [
        'Do not stretch or distort the logo proportions',
        'Use white version on dark backgrounds — never the dark logo',
        'Do not recolour or apply gradients',
        'Always use master artwork — never recreate manually',
      ],
    },
    typography: {
      scale: [
        { role: 'Display',   size: '48px', wt: '300', tr: '−0.03em', usage: 'Hero, homepage',    sample: 'Powerful brand story' },
        { role: 'Heading 1', size: '32px', wt: '400', tr: '−0.02em', usage: 'Section titles',    sample: 'Clear Communication' },
        { role: 'Heading 2', size: '24px', wt: '500', tr: '−0.01em', usage: 'Cards, features',   sample: 'Consistent Visual Language' },
        { role: 'Body',      size: '16px', wt: '400', tr: '0',        usage: 'Paragraphs',        sample: 'Effective and consistent across all touchpoints.' },
        { role: 'Label',     size: '11px', wt: '600', tr: '0.1em',   usage: 'Tags, categories',  sample: 'BRAND IDENTITY SYSTEM' },
      ],
      dos:   ['Use consistent type hierarchy across all touchpoints', 'Pair display weight with body text'],
      donts: ['Use more than 2 type families', 'Stretch or condense letterforms'],
    },
    colors: {
      palette: displayColors,
      rules: [
        { label: 'Primary on white', dots: [displayColors[0]?.hex || '#141c26', '#ffffff'], rule: 'Use primary on white for maximum contrast' },
        { label: 'Accent on primary', dots: [displayColors[1]?.hex || '#3a6ea5', displayColors[0]?.hex || '#141c26'], rule: 'Layer accent on primary for emphasis' },
      ],
    },
    imgstyle: {
      philosophy: 'Clean, purposeful photography that reflects the brand\'s values.',
      approved: ['Product-focused shots on neutral backgrounds', 'Lifestyle imagery with natural light', 'Detail close-ups showing quality and craftsmanship'],
      prohibited: ['Heavy filters or artificial colour grading', 'Stock photo clichés', 'Cluttered or off-brand backgrounds'],
    },
    buttons: {
      styles: [
        { label: 'Primary',   bg: displayColors[0]?.hex || '#141c26', tc: '#ffffff', border: 'none', radius: '6px', usage: 'Main CTAs' },
        { label: 'Secondary', bg: 'transparent', tc: displayColors[0]?.hex || '#141c26', border: `1.5px solid ${displayColors[0]?.hex || '#141c26'}`, radius: '6px', usage: 'Secondary actions' },
        { label: 'Accent',    bg: displayColors[1]?.hex || '#3a6ea5', tc: '#ffffff', border: 'none', radius: '6px', usage: 'Highlighted actions' },
      ],
      notes: ['Minimum touch target 44×44px on mobile', 'Always include hover and disabled states'],
    },
    graphics: {
      description: 'Geometric graphic elements that extend the brand visual language.',
      items: [],
    },
    icons: {
      style: 'Outlined, 1.5px stroke, 24×24px base grid, rounded line caps.',
      items: [],
    },
    packages: {
      items: [
        { name: 'Brand Starter', desc: 'Core identity files for digital use', icon: '◇', includes: ['Logo files (SVG, PNG, PDF)', 'Color palette', 'Typography guide'], size: '12 MB' },
        { name: 'Print Master',  desc: 'Production-ready print artwork',      icon: '▣', includes: ['CMYK logo files', 'Business card templates', 'Letterhead'],        size: '45 MB' },
      ],
    },
    social: {
      canvaUrl: '',
      guidelines: [
        'Always use approved brand colors and fonts',
        'Maintain consistent visual hierarchy across posts',
        'Use the logo with minimum clear space equal to the cap height',
      ],
      sizes: [
        { platform: 'Instagram Post',   size: '1080 × 1080 px' },
        { platform: 'Instagram Story',  size: '1080 × 1920 px' },
        { platform: 'LinkedIn Post',    size: '1200 × 627 px'  },
        { platform: 'Facebook Cover',   size: '820 × 312 px'   },
        { platform: 'Twitter/X Header', size: '1500 × 500 px'  },
      ],
    },
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function BrandGuidelineClient() {
  const { brand, brandName, brandId } = useBrand()

  const [cur, setCur] = useState<SectionKey>('logos')
  const [bd, setBd] = useState<BrandData | null>(null)
  const [brandImages, setBrandImages] = useState<BrandImage[]>([])
  const [brandText, setBrandText] = useState<BrandTextData>({})
  const [loadingText, setLoadingText] = useState(false)

  // Edit panel
  const [editOpen, setEditOpen] = useState(false)
  const [editSection, setEditSection] = useState<SectionKey>('logos')
  const [editInstr, setEditInstr] = useState('')
  const [editImg, setEditImg] = useState<{ base64: string; type: string } | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const editFileRef = useRef<HTMLInputElement>(null)

  // Upload modal (guideline PDF)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadLoading, setUploadLoading] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  // Asset uploader
  const [assetUploading, setAssetUploading] = useState<string | null>(null)
  const logoUploadRef = useRef<HTMLInputElement>(null)
  const graphicUploadRef = useRef<HTMLInputElement>(null)
  const iconUploadRef = useRef<HTMLInputElement>(null)
  const packageUploadRef = useRef<HTMLInputElement>(null)
  const socialUploadRef = useRef<HTMLInputElement>(null)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Init brand data
  useEffect(() => {
    if (brand && !bd) {
      const colors = (brand.colors as { name: string; hex: string; role: string }[] | null) || []
      setBd(buildInitialBrandData(brandName || 'Brand', colors))
    }
    if (brand && bd && bd.meta.name !== brandName && brandName) {
      setBd(prev => prev ? { ...prev, meta: { ...prev.meta, name: brandName } } : prev)
    }
  }, [brand, brandName, bd])

  // Fetch brand images
  const fetchBrandImages = useCallback(async () => {
    if (!brandId) return
    const { data } = await supabase.from('brand_images').select('*').eq('brand_id', brandId)
    if (data) setBrandImages(data as BrandImage[])
  }, [brandId])

  useEffect(() => {
    if (brandId) fetchBrandImages()
  }, [brandId, fetchBrandImages])

  // Fetch brand text
  useEffect(() => {
    if (!brandId || loadingText || Object.keys(brandText).length > 0) return
    setLoadingText(true)
    fetch('/api/brand-guideline/brand-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    })
      .then(r => r.json())
      .then(r => {
        if (r.success && r.data) setBrandText(r.data)
      })
      .catch(() => {})
      .finally(() => setLoadingText(false))
  }, [brandId, brandText, loadingText])

  const logoImages   = brandImages.filter(i => i.category === 'logo')
  const graphicImages = brandImages.filter(i => i.category === 'graphic')
  const iconImages   = brandImages.filter(i => i.category === 'icon')
  const packageImages = brandImages.filter(i => i.category === 'packaging')
  const socialImages = brandImages.filter(i => i.category === 'social')

  /* ---- Asset upload ---- */
  async function handleAssetUpload(file: File, category: string) {
    if (!brandId) return
    setAssetUploading(category)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('brandId', brandId)
    fd.append('category', category)
    fd.append('title', file.name)
    try {
      const r = await fetch('/api/brand-guideline/upload-asset', { method: 'POST', body: fd })
      const j = await r.json()
      if (j.success) {
        await fetchBrandImages()
        showToast('Asset uploaded')
      } else {
        showToast('Upload failed: ' + j.error)
      }
    } catch {
      showToast('Upload error')
    } finally {
      setAssetUploading(null)
    }
  }

  async function deleteAsset(img: BrandImage) {
    if (!window.confirm('Delete this asset?')) return
    await supabase.storage.from('brand-assets').remove([img.storage_path])
    await supabase.from('brand_images').delete().eq('id', img.id)
    await fetchBrandImages()
    showToast('Asset removed')
  }

  /* ---- Edit section ---- */
  function openEdit(section: SectionKey) {
    setEditSection(section)
    setEditInstr('')
    setEditImg(null)
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!bd) return
    setEditLoading(true)
    try {
      const r = await fetch('/api/brand-guideline/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionLabel: SECTION_LABELS[editSection],
          currentData: bd[editSection],
          instruction: editInstr,
          imageBase64: editImg?.base64 || null,
          imageType: editImg?.type || null,
          brandName: bd.meta.name,
          brandTagline: bd.meta.tagline,
        }),
      })
      const j = await r.json()
      if (j.success) {
        setBd(prev => prev ? { ...prev, [editSection]: j.data } : prev)
        setEditOpen(false)
        showToast('Section updated')
      } else {
        showToast('Edit failed: ' + j.error)
      }
    } catch {
      showToast('Edit error')
    } finally {
      setEditLoading(false)
    }
  }

  /* ---- Upload guideline PDF ---- */
  async function handleGuidelineUpload() {
    if (!uploadFiles.length) return
    setUploadLoading(true)
    try {
      const images: { data: string; type: string }[] = []
      for (const f of uploadFiles) {
        const bytes = await f.arrayBuffer()
        const b64 = Buffer.from(bytes).toString('base64')
        images.push({ data: b64, type: f.type })
      }
      const r = await fetch('/api/brand-guideline/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })
      const j = await r.json()
      if (j.success && j.data) {
        setBd(prev => prev ? { ...prev, ...j.data, meta: prev.meta } : prev)
        setUploadOpen(false)
        setUploadFiles([])
        showToast('Guideline imported')
      } else {
        showToast('Import failed')
      }
    } catch {
      showToast('Import error')
    } finally {
      setUploadLoading(false)
    }
  }

  /* ---- Shared UI helpers ---- */
  function SectionHeader({ id, title }: { id: SectionKey; title: string }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, color: '#111', margin: 0 }}>{title}</h2>
        <button
          onClick={() => openEdit(id)}
          style={{ fontSize: 12, color: '#888', background: 'none', border: '1px solid #e5e5e5', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}
        >
          Edit
        </button>
      </div>
    )
  }

  function ImageGallery({
    images,
    category,
    uploadRef: ref,
    emptyLabel,
  }: {
    images: BrandImage[]
    category: string
    uploadRef: React.RefObject<HTMLInputElement>
    emptyLabel: string
  }) {
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {images.map(img => (
            <div key={img.id} style={{ position: 'relative', width: 120, border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden', background: '#fafafa' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.title || ''} style={{ width: '100%', height: 90, objectFit: 'contain', padding: 8, display: 'block' }} />
              <div style={{ padding: '4px 8px', borderTop: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: 10, color: '#555', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{img.title}</div>
                {img.meta?.logoType && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{img.meta.logoType}</div>}
              </div>
              <button
                onClick={() => deleteAsset(img)}
                style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, border: 'none', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, cursor: 'pointer', lineHeight: '18px', textAlign: 'center', padding: 0 }}
              >×</button>
            </div>
          ))}
          <button
            onClick={() => ref.current?.click()}
            disabled={assetUploading === category}
            style={{ width: 120, height: 120, border: '1.5px dashed #d0d0d0', borderRadius: 8, background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#999', fontSize: 11 }}
          >
            {assetUploading === category ? (
              <span style={{ fontSize: 11, color: '#aaa' }}>Uploading…</span>
            ) : (
              <>
                <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
                <span>{emptyLabel}</span>
              </>
            )}
          </button>
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleAssetUpload(f, category)
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  /* ---- Section renderers ---- */
  if (!bd) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
        Loading brand guidelines…
      </div>
    )
  }

  function renderLogos() {
    return (
      <div>
        <SectionHeader id="logos" title="Logos" />
        {brandText.logoDescription && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 28, maxWidth: 640 }}>{brandText.logoDescription}</p>
        )}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Logo files</h3>
          <ImageGallery images={logoImages} category="logo" uploadRef={logoUploadRef} emptyLabel="Add logo" />
        </div>
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Colour variants</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {bd!.logos.variants.map((v, i) => (
              <div key={i} style={{ width: 200, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e5e5' }}>
                <div style={{ background: v.bg, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: v.dotC }} />
                    <span style={{ color: v.tc, fontSize: 14, fontWeight: 500, letterSpacing: 2 }}>{bd!.meta.name.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: '#fff' }}>
                  <div style={{ fontSize: 11, color: '#666' }}>{v.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Usage rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bd!.logos.restrictions.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: '#444' }}>
                <span style={{ color: '#e06c00', fontWeight: 600, flexShrink: 0 }}>—</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderTypography() {
    return (
      <div>
        <SectionHeader id="typography" title="Typography" />
        {brandText.typographyIntro && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 28, maxWidth: 640 }}>{brandText.typographyIntro}</p>
        )}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Type scale</h3>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 60px 50px 80px 1fr', gap: 0, background: '#f5f5f5', borderBottom: '1px solid #e8e8e8', padding: '8px 16px' }}>
              {['Role', 'Size', 'Weight', 'Tracking', 'Sample'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
              ))}
            </div>
            {bd!.typography.scale.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 60px 50px 80px 1fr', gap: 0, padding: '12px 16px', borderBottom: i < bd!.typography.scale.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>{row.role}</div>
                <div style={{ fontSize: 11, color: '#777', fontFamily: 'monospace' }}>{row.size}</div>
                <div style={{ fontSize: 11, color: '#777', fontFamily: 'monospace' }}>{row.wt}</div>
                <div style={{ fontSize: 11, color: '#777', fontFamily: 'monospace' }}>{row.tr}</div>
                <div style={{ fontSize: parseInt(row.size) > 32 ? 22 : parseInt(row.size) > 24 ? 18 : parseInt(row.size) > 16 ? 15 : 13, fontWeight: parseInt(row.wt) || 400, color: '#222', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{row.sample}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {([['Do', bd!.typography.dos, '#0a7a4c'], ['Don\'t', bd!.typography.donts, '#c0392b']] as [string, string[], string][]).map(([label, list, color]) => (
            <div key={label} style={{ background: '#fafafa', borderRadius: 10, padding: 16, border: '1px solid #efefef' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              {list.map((item, i) => (
                <div key={i} style={{ fontSize: 12.5, color: '#555', marginBottom: 6, display: 'flex', gap: 8 }}>
                  <span style={{ color, flexShrink: 0 }}>{label === 'Do' ? '✓' : '✕'}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderColors() {
    return (
      <div>
        <SectionHeader id="colors" title="Color palette" />
        {brandText.colorPhilosophy && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 28, maxWidth: 640 }}>{brandText.colorPhilosophy}</p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          {bd!.colors.palette.map((c, i) => (
            <div key={i} style={{ width: 180, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e5e5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ background: c.hex, height: 90 }} />
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#222', marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', marginBottom: 6 }}>{c.hex}</div>
                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>{c.role}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {c.aa  && <span style={{ fontSize: 9, background: '#e8f5ef', color: '#0a7a4c', borderRadius: 4, padding: '2px 5px', fontWeight: 600 }}>AA</span>}
                  {c.aaa && <span style={{ fontSize: 9, background: '#dff0e8', color: '#0a6640', borderRadius: 4, padding: '2px 5px', fontWeight: 600 }}>AAA</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {bd!.colors.rules.length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Usage rules</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bd!.colors.rules.map((rule, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: '#fafafa', borderRadius: 8, border: '1px solid #efefef' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {rule.dots.map((d, j) => (
                      <div key={j} style={{ width: 20, height: 20, borderRadius: '50%', background: d, border: '1px solid rgba(0,0,0,0.08)' }} />
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 2 }}>{rule.label}</div>
                    <div style={{ fontSize: 12.5, color: '#444' }}>{rule.rule}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderImgStyle() {
    return (
      <div>
        <SectionHeader id="imgstyle" title="Image style" />
        {brandText.imageryPhilosophy && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 24, maxWidth: 640 }}>{brandText.imageryPhilosophy}</p>
        )}
        {!brandText.imageryPhilosophy && bd!.imgstyle.philosophy && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 24, maxWidth: 640 }}>{bd!.imgstyle.philosophy}</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {([['Approved', bd!.imgstyle.approved, '#0a7a4c', '✓'], ['Prohibited', bd!.imgstyle.prohibited, '#c0392b', '✕']] as [string, string[], string, string][]).map(([label, list, color, icon]) => (
            <div key={label} style={{ background: '#fafafa', borderRadius: 10, padding: 16, border: '1px solid #efefef' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              {list.map((item, i) => (
                <div key={i} style={{ fontSize: 12.5, color: '#555', marginBottom: 6, display: 'flex', gap: 8 }}>
                  <span style={{ color, flexShrink: 0 }}>{icon}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderButtons() {
    return (
      <div>
        <SectionHeader id="buttons" title="Button styles" />
        {brandText.buttonPhilosophy && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 24, maxWidth: 640 }}>{brandText.buttonPhilosophy}</p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          {bd!.buttons.styles.map((s, i) => (
            <div key={i} style={{ background: '#fafafa', borderRadius: 10, padding: 16, border: '1px solid #efefef', minWidth: 180 }}>
              <div style={{ marginBottom: 12 }}>
                <button style={{ background: s.bg, color: s.tc, border: s.border, borderRadius: s.radius, padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'default' }}>
                  {s.label}
                </button>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>bg: <span style={{ fontFamily: 'monospace' }}>{s.bg}</span></div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>color: <span style={{ fontFamily: 'monospace' }}>{s.tc}</span></div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>radius: <span style={{ fontFamily: 'monospace' }}>{s.radius}</span></div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{s.usage}</div>
            </div>
          ))}
        </div>
        {bd!.buttons.notes.length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Notes</h3>
            {bd!.buttons.notes.map((n, i) => (
              <div key={i} style={{ fontSize: 12.5, color: '#555', marginBottom: 6, display: 'flex', gap: 8 }}>
                <span style={{ color: '#e06c00', fontWeight: 600 }}>—</span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderGraphics() {
    return (
      <div>
        <SectionHeader id="graphics" title="Graphic elements" />
        {brandText.graphicElementsIntro && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 24, maxWidth: 640 }}>{brandText.graphicElementsIntro}</p>
        )}
        {!brandText.graphicElementsIntro && bd!.graphics.description && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 24, maxWidth: 640 }}>{bd!.graphics.description}</p>
        )}
        <ImageGallery images={graphicImages} category="graphic" uploadRef={graphicUploadRef} emptyLabel="Add graphic" />
      </div>
    )
  }

  function renderIcons() {
    return (
      <div>
        <SectionHeader id="icons" title="Icons" />
        {brandText.iconsIntro && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 16, maxWidth: 640 }}>{brandText.iconsIntro}</p>
        )}
        {!brandText.iconsIntro && bd!.icons.style && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 16, maxWidth: 640 }}>{bd!.icons.style}</p>
        )}
        <ImageGallery images={iconImages} category="icon" uploadRef={iconUploadRef} emptyLabel="Add icon" />
      </div>
    )
  }

  function renderPackages() {
    return (
      <div>
        <SectionHeader id="packages" title="Package style" />
        {brandText.packagingIntro && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 24, maxWidth: 640 }}>{brandText.packagingIntro}</p>
        )}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Packaging images</h3>
          <ImageGallery images={packageImages} category="packaging" uploadRef={packageUploadRef} emptyLabel="Add image" />
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Packages</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {bd!.packages.items.map((pkg, i) => (
              <div key={i} style={{ background: '#fafafa', borderRadius: 10, padding: 18, border: '1px solid #efefef', minWidth: 200, flex: '0 0 auto' }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{pkg.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#222', marginBottom: 4 }}>{pkg.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 1.5 }}>{pkg.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pkg.includes.map((inc, j) => (
                    <div key={j} style={{ fontSize: 11.5, color: '#555', display: 'flex', gap: 6 }}>
                      <span style={{ color: '#0a7a4c' }}>✓</span>
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{pkg.size}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderSocial() {
    return (
      <div>
        <SectionHeader id="social" title="Social media" />
        {brandText.socialIntro && (
          <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 24, maxWidth: 640 }}>{brandText.socialIntro}</p>
        )}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Template assets</h3>
          <ImageGallery images={socialImages} category="social" uploadRef={socialUploadRef} emptyLabel="Add template" />
        </div>
        {bd!.social.canvaUrl && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: '#f5f7ff', borderRadius: 8, border: '1px solid #d0d8ff' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Canva template kit</div>
            <a href={bd!.social.canvaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#3a55e0', wordBreak: 'break-all' }}>{bd!.social.canvaUrl}</a>
          </div>
        )}
        {!bd!.social.canvaUrl && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #efefef' }}>
            <div style={{ fontSize: 12, color: '#aaa' }}>No Canva template link set. Edit this section to add one.</div>
          </div>
        )}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Size guide</h3>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
            {bd!.social.sizes.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < bd!.social.sizes.length - 1 ? '1px solid #f0f0f0' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <div style={{ fontSize: 13, color: '#444' }}>{s.platform}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{s.size}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Guidelines</h3>
          {bd!.social.guidelines.map((g, i) => (
            <div key={i} style={{ fontSize: 12.5, color: '#555', marginBottom: 8, display: 'flex', gap: 8 }}>
              <span style={{ color: '#e06c00', fontWeight: 600 }}>—</span>
              <span>{g}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const sectionMap: Record<SectionKey, () => React.ReactElement> = {
    logos:      renderLogos,
    typography: renderTypography,
    colors:     renderColors,
    imgstyle:   renderImgStyle,
    buttons:    renderButtons,
    graphics:   renderGraphics,
    icons:      renderIcons,
    packages:   renderPackages,
    social:     renderSocial,
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#ffffff', position: 'relative' }}>

      {/* Left nav */}
      <div style={{ width: 200, borderRight: '1px solid #ebebeb', flexShrink: 0, overflowY: 'auto', padding: '20px 0' }}>
        <div style={{ padding: '0 14px 12px', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Visual Guideline
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setCur(item.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: 13,
              background: cur === item.id ? '#fff5ee' : 'transparent',
              color: cur === item.id ? '#e06c00' : '#555',
              fontWeight: cur === item.id ? 600 : 400,
              borderTop: 'none', borderRight: 'none', borderBottom: 'none',
              borderLeft: cur === item.id ? '2.5px solid #e06c00' : '2.5px solid transparent',
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
        <div style={{ margin: '16px 14px 0', paddingTop: 16, borderTop: '1px solid #ebebeb' }}>
          <button
            onClick={() => setUploadOpen(true)}
            style={{ width: '100%', padding: '8px 10px', background: '#f5f5f5', border: '1px solid #e5e5e5', borderRadius: 7, fontSize: 11.5, color: '#666', cursor: 'pointer', textAlign: 'center' }}
          >
            Import guideline PDF
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 36 }}>
        {sectionMap[cur]()}
      </div>

      {/* Edit panel overlay */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <div style={{ width: 400, height: '100%', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Edit — {SECTION_LABELS[editSection]}</div>
              <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Instruction</div>
                <textarea
                  value={editInstr}
                  onChange={e => setEditInstr(e.target.value)}
                  placeholder={EP_HINTS[editSection]}
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, color: '#333', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reference image (optional)</div>
                {editImg ? (
                  <div style={{ position: 'relative', border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`data:${editImg.type};base64,${editImg.base64}`} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', display: 'block' }} />
                    <button onClick={() => setEditImg(null)} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, border: 'none', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>×</button>
                  </div>
                ) : (
                  <button onClick={() => editFileRef.current?.click()} style={{ width: '100%', padding: '22px', border: '1.5px dashed #d0d0d0', borderRadius: 8, background: '#fafafa', cursor: 'pointer', color: '#aaa', fontSize: 12 }}>
                    + Upload image
                  </button>
                )}
                <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const bytes = await f.arrayBuffer()
                  const b64 = Buffer.from(bytes).toString('base64')
                  setEditImg({ base64: b64, type: f.type })
                  e.target.value = ''
                }} />
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #ebebeb' }}>
              <button
                onClick={handleEdit}
                disabled={editLoading || (!editInstr && !editImg)}
                style={{ width: '100%', padding: '11px', background: editLoading || (!editInstr && !editImg) ? '#f0f0f0' : '#111', color: editLoading || (!editInstr && !editImg) ? '#aaa' : '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: editLoading || (!editInstr && !editImg) ? 'not-allowed' : 'pointer' }}
              >
                {editLoading ? 'Updating…' : 'Apply changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload guideline modal */}
      {uploadOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#111', marginBottom: 16 }}>Import brand guideline</div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>Upload screenshots or images of your existing brand guideline and AI will extract the data automatically.</p>
            <div
              onClick={() => uploadRef.current?.click()}
              style={{ border: '2px dashed #e0e0e0', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', marginBottom: 16 }}
            >
              {uploadFiles.length > 0 ? (
                <div>
                  {uploadFiles.map((f, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{f.name}</div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#aaa', fontSize: 13 }}>Click to select images (PNG, JPG)</div>
              )}
            </div>
            <input ref={uploadRef} type="file" multiple accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={e => {
              setUploadFiles(Array.from(e.target.files || []))
              e.target.value = ''
            }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setUploadOpen(false); setUploadFiles([]) }} style={{ flex: 1, padding: '10px', background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#555' }}>Cancel</button>
              <button onClick={handleGuidelineUpload} disabled={!uploadFiles.length || uploadLoading} style={{ flex: 2, padding: '10px', background: !uploadFiles.length || uploadLoading ? '#f0f0f0' : '#111', color: !uploadFiles.length || uploadLoading ? '#aaa' : '#fff', border: 'none', borderRadius: 8, cursor: !uploadFiles.length || uploadLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                {uploadLoading ? 'Extracting…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, zIndex: 100, pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
