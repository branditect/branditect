'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/lib/useBrand'

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface BrandTheme {
  darkColor: string
  accentColor: string
  lightColor: string
  fontFamily: string
}

interface LogoSlot {
  id: string
  label: string
  desc: string
  darkBg: boolean
}

interface BrandData {
  meta: { name: string; tagline: string }
  theme: BrandTheme
  logos: {
    intro: string
    wordmarkNote: string
    clearspace: string
    minimumSize: string
    restrictions: string[]
    uploads: Record<string, string | null>
    analyses: Record<string, string>
  }
  typography: {
    intro: string
    displayFont: string
    bodyFont: string
    scale: { role: string; size: string; wt: string; tr: string; usage: string; sample: string }[]
    dos: string[]
    donts: string[]
  }
  colors: {
    intro: string
    palette: { name: string; hex: string; role: string; aa: boolean; aaa: boolean }[]
    secondary: { name: string; hex: string; role: string }[]
    rules: { label: string; dots: string[]; rule: string }[]
  }
  buttons: { cornerRadius: number; note: string }
  imgstyle: { intro: string; approved: string[]; prohibited: string[] }
  graphics: { note: string }
  packaging: { note: string }
  social: { note: string; templateLink: string }
}

interface BrandImage {
  id: string | number
  url: string
  storage_path: string
  category: string
  title: string
  meta: Record<string, string> | null
}

/* ─── Logo slots ─────────────────────────────────────────────────────────────── */

const LOGO_SLOTS: LogoSlot[] = [
  { id: 'brandmark',   label: 'Brandmark',        desc: 'Symbol / icon only',          darkBg: true  },
  { id: 'wordmark',    label: 'Wordmark',          desc: 'Logotype / text only',        darkBg: false },
  { id: 'combination', label: 'Combination mark',  desc: 'Symbol + wordmark together',  darkBg: false },
  { id: 'darkbg',      label: 'Dark background',   desc: 'White/reversed on dark',      darkBg: true  },
  { id: 'lightbg',     label: 'Light background',  desc: 'Primary on white',            darkBg: false },
  { id: 'mono',        label: 'Monochrome',         desc: 'Single colour / emboss',      darkBg: false },
]

/* ─── Nav ────────────────────────────────────────────────────────────────────── */

const NAV_GROUPS = [
  { group: 'Brand identity', items: [
    { id: 'logos',    label: 'Logos' },
    { id: 'type',     label: 'Typography' },
    { id: 'colors',   label: 'Colors' },
    { id: 'imgstyle', label: 'Image style' },
  ]},
  { group: 'Design system', items: [
    { id: 'buttons',  label: 'Button styles' },
    { id: 'graphics', label: 'Graphic elements' },
    { id: 'icons',    label: 'Icons' },
  ]},
  { group: 'Products', items: [
    { id: 'packaging', label: 'Package style' },
  ]},
  { group: 'Channels', items: [
    { id: 'social', label: 'Social media' },
  ]},
]

const ALL_LABELS: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap(g => g.items).map(i => [i.id, i.label])
)

/* ─── Asset gallery — module-level component ─────────────────────────────────── */

interface AssetGalleryProps {
  items: { id?: string | number; url: string }[]
  columns?: number
  onUpload: (files: FileList | null) => void
  onRemove: (id: string | number | undefined) => void
  uploading?: boolean
}

function AssetGallery({ items, columns = 3, onUpload, onRemove, uploading }: AssetGalleryProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ border: '1px solid var(--bd-border)', borderRadius: 8, overflow: 'hidden', position: 'relative', background: 'var(--bg-light)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'contain', display: 'block', padding: 8 }} />
            <button
              onClick={() => onRemove(item.id)}
              style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </div>
        ))}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: '1.5px dashed var(--bd-border)', borderRadius: 8, aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: 'white' }}
        >
          {uploading ? (
            <div style={{ width: 20, height: 20, border: '2px solid var(--bd-border)', borderTopColor: '#555', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
          ) : (
            <>
              <div style={{ fontSize: 22, color: 'var(--bd-border)' }}>+</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upload image</div>
            </>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { onUpload(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}

/* ─── Build initial data ─────────────────────────────────────────────────────── */

function buildInitialData(
  brandName: string,
  colors: { name: string; hex: string; role: string }[],
  fontName: string,
  brandImages: BrandImage[]
): BrandData {
  const dark    = colors[0]?.hex || '#141c26'
  const accent  = colors[1]?.hex || '#3a6ea5'
  const light   = colors[2]?.hex || '#f7f6f4'

  const uploads: Record<string, string | null> = {}
  const analyses: Record<string, string> = {}
  LOGO_SLOTS.forEach(s => { uploads[s.id] = null })
  brandImages.filter(img => img.category === 'logo').forEach(img => {
    const slot = img.meta?.slot
    if (slot && uploads.hasOwnProperty(slot)) {
      uploads[slot] = img.url
      if (img.meta?.logoType) analyses[slot] = img.meta.logoType
    }
  })

  const palette = colors.length >= 3
    ? colors.slice(0, 5).map(c => ({ ...c, aa: true, aaa: false }))
    : [
        { name: 'Primary Dark',   hex: dark,   role: 'Backgrounds & headlines',       aa: true, aaa: true  },
        { name: 'Accent',         hex: accent, role: 'CTAs & interactive elements',   aa: true, aaa: false },
        { name: 'Light',          hex: light,  role: 'Light backgrounds & surfaces',  aa: true, aaa: true  },
      ]

  return {
    meta: { name: brandName, tagline: '' },
    theme: { darkColor: dark, accentColor: accent, lightColor: light, fontFamily: fontName },
    logos: {
      intro: `The ${brandName} logo is the primary visual expression of the brand. Built from deliberate, structured decisions, it communicates the values that define ${brandName} — precision, authority and reliability. The mark and wordmark work together as a cohesive system, and each element is protected by clear rules that ensure consistency across every application.`,
      wordmarkNote: 'The full combination mark is the primary brand expression. The brandmark alone is reserved for applications where the brand context is already established.',
      clearspace: 'Maintain clearspace equal to the full cap-height of the wordmark on all four sides. No element may enter this zone.',
      minimumSize: 'Never reproduce the logo smaller than 24mm in print or 80px in digital environments.',
      restrictions: [
        'Do not stretch, skew or distort the logo proportions in any direction',
        'Use the white reversed version on all dark or coloured backgrounds',
        'Never apply gradients, shadows, outlines or effects to the logo',
        'Always use approved master artwork — never recreate from scratch',
        'Never place the logo on backgrounds that compromise legibility',
      ],
      uploads,
      analyses,
    },
    typography: {
      intro: `The ${brandName} type system is built on clarity, hierarchy and restraint. Every weight and size decision serves a functional purpose. The system performs across digital and print with equal authority.`,
      displayFont: fontName,
      bodyFont: fontName,
      scale: [
        { role: 'Display',   size: '52px', wt: '300', tr: '−0.03em', usage: 'Campaign heroes',  sample: 'Brand in motion' },
        { role: 'Heading 1', size: '36px', wt: '400', tr: '−0.02em', usage: 'Page titles',      sample: 'Our core proposition' },
        { role: 'Heading 2', size: '26px', wt: '500', tr: '−0.01em', usage: 'Section heads',    sample: 'Built for demanding environments' },
        { role: 'Body',      size: '16px', wt: '400', tr: '0',       usage: 'Running text',     sample: 'Precise language, clear thinking. Every word earns its place.' },
        { role: 'Label',     size: '11px', wt: '600', tr: '0.1em',   usage: 'Tags & metadata',  sample: 'Category · Reference' },
      ],
      dos: [
        `Use ${fontName} as the single primary typeface across all materials`,
        'Maintain strict hierarchy — never skip a level or mix scale steps',
        'Sentence case throughout — never title case in body or headline copy',
      ],
      donts: [
        'Never use 700 or 900 weight for display or headline text',
        'Do not mix more than two weights within a single layout',
        'Never use all-caps for body text — only for labels and metadata',
      ],
    },
    colors: {
      intro: `Color is one of the most immediate expressions of the ${brandName} identity. The palette is carefully considered — each color earns its place by serving a specific communicative role. Used consistently, the system builds immediate recognition.`,
      palette,
      secondary: colors.length > 5
        ? colors.slice(5).map(c => ({ name: c.name, hex: c.hex, role: c.role }))
        : [{ name: 'Neutral', hex: '#8a8580', role: 'Dividers, secondary text' }],
      rules: [
        { label: 'Primary pairing', dots: [dark, light], rule: `${palette[0]?.name} on ${palette[2]?.name || 'white'}. Default for all marketing and digital surfaces.` },
        { label: 'Dark mode', dots: [light, accent, dark], rule: `Light with ${palette[1]?.name || 'accent'} on ${palette[0]?.name}. Use for hero sections.` },
        { label: 'Never combine', dots: [accent, palette[3]?.hex || '#6b8a6e'], rule: 'Do not pair accent and supporting colors — their visual weights conflict at scale.' },
      ],
    },
    buttons: {
      cornerRadius: 6,
      note: 'Buttons use a 6px corner radius — structured and confident. One primary action per view. Secondary actions are always outlined, never filled.',
    },
    imgstyle: {
      intro: `${brandName} imagery is defined by restraint, honesty and controlled composition. Every image should feel like it was taken, not produced — real moments in real environments, captured with professional precision.`,
      approved: [
        'Clean, directional lighting — no harsh flash or artificial drama',
        'Cool, neutral colour temperature aligned to the brand palette',
        'Real working environments and authentic surfaces',
        'Tight, confident compositions with a clear subject',
        'Professionals at work in real environments, unstaged',
      ],
      prohibited: [
        'Stock photography of smiling people in bright offices',
        'Warm, golden-hour tones or lifestyle-adjacent photography',
        'Anything domestic or wholly unrelated to professional performance',
        'Heavy post-processing, artificial colour grading or filter effects',
        'Generic landscape imagery without direct brand relevance',
      ],
    },
    graphics: { note: 'Geometric forms, fine rule lines and systematic grid patterns are the core graphic language.' },
    packaging: { note: 'Product labels use the full primary palette. The logo appears in the approved colour variant for the surface it sits on.' },
    social: { note: 'Social content leads with strong imagery and minimal copy. The brand always appears composed and considered — never reactive or trend-chasing.', templateLink: '' },
  }
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

export default function BrandGuidelineClient() {
  const { brand, brandName, brandId } = useBrand()

  const [bd, setBd] = useState<BrandData | null>(null)
  const [cur, setCur] = useState('logos')

  // Edit panel
  const [editOpen, setEditOpen] = useState(false)
  const [editSection, setEditSection] = useState('logos')
  const [editText, setEditText] = useState('')
  const [editImg, setEditImg] = useState<{ base64: string; type: string; preview: string } | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const editFileRef = useRef<HTMLInputElement>(null)

  // Guideline upload modal
  const [modalOpen, setModalOpen] = useState(false)
  const [guidelineImgs, setGuidelineImgs] = useState<{ data: string; type: string; preview: string }[]>([])
  const [extractLoading, setExtractLoading] = useState(false)
  const modalFileRef = useRef<HTMLInputElement>(null)

  // Logo uploading
  const [logoUploading, setLogoUploading] = useState<Record<string, boolean>>({})

  // Gallery assets
  const [galleryAssets, setGalleryAssets] = useState<Record<string, { id?: string | number; url: string }[]>>({
    graphics: [], icons: [], packaging: [], social: [],
  })
  const [galleryUploading, setGalleryUploading] = useState<Record<string, boolean>>({})

  // Social template link
  const [templateLink, setTemplateLink] = useState('')

  // Chat
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsgs, setChatMsgs] = useState([{ type: 'bot', text: 'Ask me anything about this brand — logos, colors, typography, usage rules...' }])
  const [chatInput, setChatInput] = useState('')
  const chatIdx = useRef(0)

  // Toast
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  function showToast(msg: string) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2800)
  }

  // Build initial data once brand loads
  useEffect(() => {
    if (!brand || !brandName || bd) return
    const colors = (brand.colors as { name: string; hex: string; role: string }[] | null) || []
    setBd(buildInitialData(brandName, colors, 'Inter', []))
  }, [brand, brandName, bd])

  // Fetch brand images & build logo slots
  const fetchImages = useCallback(async () => {
    if (!brandId || !bd) return
    const { data } = await supabase.from('brand_images').select('*').eq('brand_id', brandId)
    if (!data) return
    const imgs = data as BrandImage[]

    // Logo uploads
    const uploads: Record<string, string | null> = {}
    const analyses: Record<string, string> = {}
    LOGO_SLOTS.forEach(s => { uploads[s.id] = null })
    imgs.filter(i => i.category === 'logo').forEach(img => {
      const slot = img.meta?.slot
      if (slot && uploads.hasOwnProperty(slot)) {
        uploads[slot] = img.url
        if (img.meta?.logoType) analyses[slot] = img.meta.logoType
      }
    })

    // Gallery assets
    const galleries: Record<string, { id?: string | number; url: string }[]> = {
      graphics: imgs.filter(i => i.category === 'graphic').map(i => ({ id: i.id, url: i.url })),
      icons:    imgs.filter(i => i.category === 'icon').map(i => ({ id: i.id, url: i.url })),
      packaging:imgs.filter(i => i.category === 'packaging').map(i => ({ id: i.id, url: i.url })),
      social:   imgs.filter(i => i.category === 'social').map(i => ({ id: i.id, url: i.url })),
    }
    setGalleryAssets(galleries)
    setBd(prev => prev ? { ...prev, logos: { ...prev.logos, uploads, analyses } } : prev)
  }, [brandId, bd])

  useEffect(() => {
    if (brandId && bd) fetchImages()
  }, [brandId, bd, fetchImages])

  // Fetch brand text from strategy tables
  useEffect(() => {
    if (!brandId || !bd) return
    fetch('/api/brand-guideline/brand-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    })
      .then(r => r.json())
      .then(json => {
        if (!json.success || !json.data) return
        const d = json.data
        setBd(prev => {
          if (!prev) return prev
          return {
            ...prev,
            meta: { ...prev.meta, tagline: d.tagline || prev.meta.tagline },
            logos: {
              ...prev.logos,
              intro: d.logoPhilosophy || prev.logos.intro,
              wordmarkNote: d.logoWordmarkNote || prev.logos.wordmarkNote,
              clearspace: d.logoClearspace || prev.logos.clearspace,
            },
            typography: { ...prev.typography, intro: d.typographyIntro || prev.typography.intro },
            colors: {
              ...prev.colors,
              intro: d.colorsIntro || prev.colors.intro,
              rules: prev.colors.rules.map((r, i) => {
                const texts = [d.colorPrimaryUsage, d.colorSecondaryUsage, d.colorNeverCombine]
                return texts[i] ? { ...r, rule: texts[i] } : r
              }),
            },
            buttons: { ...prev.buttons, note: d.buttonStyleNote || prev.buttons.note },
            imgstyle: {
              ...prev.imgstyle,
              intro: d.imageStylePhilosophy || prev.imgstyle.intro,
              approved: d.imageStyleApproved?.length ? d.imageStyleApproved : prev.imgstyle.approved,
              prohibited: d.imageStyleProhibited?.length ? d.imageStyleProhibited : prev.imgstyle.prohibited,
            },
            graphics: { note: d.graphicsNote || prev.graphics.note },
            packaging: { note: d.packagingNote || prev.packaging.note },
            social: { ...prev.social, note: d.socialNote || prev.social.note },
          }
        })
      })
      .catch(() => {})
  }, [brandId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Logo upload ─────────────────────────────────────────────────────────── */

  async function uploadLogo(slotId: string, files: FileList | null) {
    if (!files?.[0] || !brandId) return
    setLogoUploading(p => ({ ...p, [slotId]: true }))
    const fd = new FormData()
    fd.append('file', files[0])
    fd.append('brandId', brandId)
    fd.append('category', 'logo')
    fd.append('imageType', slotId)
    fd.append('analyze', 'true')
    try {
      const res = await fetch('/api/brand-guideline/upload-asset', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        setBd(prev => prev ? {
          ...prev,
          logos: {
            ...prev.logos,
            uploads: { ...prev.logos.uploads, [slotId]: json.url },
            analyses: { ...prev.logos.analyses, [slotId]: json.analysis?.logoType || 'uploaded' },
          },
        } : prev)
        showToast(`Logo uploaded${json.analysis?.logoType ? ` — ${json.analysis.logoType}` : ''} ✓`)
      } else showToast('Upload failed: ' + json.error)
    } catch { showToast('Upload error') }
    setLogoUploading(p => ({ ...p, [slotId]: false }))
  }

  /* ── Gallery upload ──────────────────────────────────────────────────────── */

  async function uploadGalleryAsset(category: string, files: FileList | null) {
    if (!files?.[0] || !brandId) return
    setGalleryUploading(p => ({ ...p, [category]: true }))
    const fd = new FormData()
    fd.append('file', files[0])
    fd.append('brandId', brandId)
    fd.append('category', category)
    fd.append('imageType', `${category}-${Date.now()}`)
    try {
      const res = await fetch('/api/brand-guideline/upload-asset', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        setGalleryAssets(p => ({ ...p, [category]: [...(p[category] || []), { id: json.id, url: json.url }] }))
        showToast('Uploaded ✓')
      }
    } catch { showToast('Upload failed') }
    setGalleryUploading(p => ({ ...p, [category]: false }))
  }

  async function removeGalleryAsset(category: string, id: string | number | undefined) {
    setGalleryAssets(p => ({ ...p, [category]: (p[category] || []).filter(a => a.id !== id) }))
    if (id && brandId) {
      await fetch('/api/brand-guideline/upload-asset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, brandId }),
      })
    }
  }

  /* ── AI edit ─────────────────────────────────────────────────────────────── */

  function openEdit(sectionId: string) {
    setEditSection(sectionId); setEditText(''); setEditImg(null); setEditOpen(true)
  }

  async function applyEdit() {
    if (!editText && !editImg || !bd) return
    setEditLoading(true)
    try {
      const sectionData = bd[editSection as keyof BrandData]
      const res = await fetch('/api/brand-guideline/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionLabel: ALL_LABELS[editSection] || editSection,
          currentData: sectionData,
          instruction: editText,
          imageBase64: editImg?.base64 || null,
          imageType: editImg?.type || null,
          brandName: bd.meta.name,
          brandTagline: bd.meta.tagline,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setBd(p => p ? { ...p, [editSection]: { ...(p[editSection as keyof BrandData] as object), ...json.data } } : p)
        if (editSection === 'colors' && json.data.palette?.[0]?.hex) {
          setBd(p => p ? { ...p, theme: { ...p.theme, darkColor: json.data.palette[0].hex } } : p)
        }
        setEditOpen(false); showToast('Updated ✓')
      } else showToast('Could not update — try rephrasing')
    } catch { showToast('API error') }
    setEditLoading(false)
  }

  /* ── Guideline extraction ────────────────────────────────────────────────── */

  function handleGuidelineFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(f => {
      const r = new FileReader()
      r.onload = e => {
        const result = e.target?.result as string
        setGuidelineImgs(p => [...p, { data: result.split(',')[1], type: f.type, preview: result }])
      }
      r.readAsDataURL(f)
    })
  }

  async function extractGuideline() {
    if (!guidelineImgs.length) return
    setExtractLoading(true)
    try {
      const res = await fetch('/api/brand-guideline/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: guidelineImgs.map(i => ({ data: i.data, type: i.type })) }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data
        setBd(prev => {
          if (!prev) return prev
          const next = { ...prev }
          if (d.meta?.darkColor)   next.theme = { ...next.theme, darkColor:   d.meta.darkColor   }
          if (d.meta?.accentColor) next.theme = { ...next.theme, accentColor: d.meta.accentColor }
          if (d.meta?.lightColor)  next.theme = { ...next.theme, lightColor:  d.meta.lightColor  }
          if (d.meta?.name)        next.meta  = { ...next.meta,  name:        d.meta.name        }
          if (d.meta?.tagline)     next.meta  = { ...next.meta,  tagline:     d.meta.tagline     }
          if (d.logos)      next.logos      = { ...prev.logos,      ...d.logos,      uploads: prev.logos.uploads, analyses: prev.logos.analyses }
          if (d.typography) next.typography = { ...prev.typography, ...d.typography }
          if (d.colors)     next.colors     = { ...prev.colors,     ...d.colors     }
          if (d.imgstyle)   next.imgstyle   = { ...prev.imgstyle,   ...d.imgstyle   }
          if (d.buttons)    next.buttons    = { ...prev.buttons,    ...d.buttons    }
          if (d.graphics)   next.graphics   = { ...prev.graphics,   ...d.graphics   }
          if (d.packaging)  next.packaging  = { ...prev.packaging,  ...d.packaging  }
          if (d.social)     next.social     = { ...prev.social,     ...d.social     }
          return next
        })
        setModalOpen(false); setGuidelineImgs([])
        showToast('Guideline extracted — theme applied ✓')
      } else showToast('Could not parse — try clearer screenshots')
    } catch { showToast('API error') }
    setExtractLoading(false)
  }

  /* ── Chat ────────────────────────────────────────────────────────────────── */

  const chatFallbacks = bd ? [
    `Primary color is ${bd.colors.palette[0]?.hex} — use on light backgrounds only.`,
    'Use the combination mark in all primary communications. Brandmark alone only when context is established.',
    `Typography: Display at ${bd.typography.scale[0]?.wt} weight. Never use 700/900 on headlines.`,
    'Photography: real environments, professionals at work. No stock smiles or warm tones.',
    `Button corner radius is ${bd.buttons.cornerRadius}px. Never fully rounded.`,
    'Clearspace = full cap-height of the wordmark on all 4 sides. Nothing enters that zone.',
  ] : []

  function sendChat() {
    if (!chatInput.trim() || !chatFallbacks.length) return
    const msg = chatInput.trim(); setChatInput('')
    setChatMsgs(p => [...p, { type: 'user', text: msg }])
    setTimeout(() => {
      setChatMsgs(p => [...p, { type: 'bot', text: chatFallbacks[chatIdx.current % chatFallbacks.length] }])
      chatIdx.current++
    }, 700)
  }

  /* ─── Loading state ─────────────────────────────────────────────────────── */

  if (!bd) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>
        Loading brand guidelines…
      </div>
    )
  }

  /* ─── CSS vars from brand theme ─────────────────────────────────────────── */

  const themeVars = {
    '--bg-dark':    bd.theme.darkColor,
    '--bd-accent':  bd.theme.accentColor,
    '--bg-light':   bd.theme.lightColor,
    '--bg-mid':     bd.theme.lightColor,
    '--bd-text':    '#0d1117',
    '--text-muted': '#6b7a8d',
    '--bd-border':  '#dde2ea',
    '--bd-font':    `'${bd.theme.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif`,
  } as React.CSSProperties

  /* ─── Shared UI ─────────────────────────────────────────────────────────── */

  function EditBtn({ sectionId }: { sectionId: string }) {
    return (
      <button
        onClick={() => openEdit(sectionId)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 9px', borderRadius: 4, border: '1px solid var(--bd-border)', background: 'white', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7 1.5l1.5 1.5-5 5-2 .5.5-2 5-5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
        Edit
      </button>
    )
  }

  function SectionRule({ label, sId, padTop = 32 }: { label: string; sId: string; padTop?: number }) {
    return (
      <div style={{ padding: `${padTop}px 56px 0` }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          {label}
          <div style={{ flex: 1, height: 1, background: 'var(--bd-border)' }} />
          <EditBtn sectionId={sId} />
        </div>
      </div>
    )
  }

  function HeroBand({ tag, title, body, dark = true }: { tag: string; title: string; body: string; dark?: boolean }) {
    return (
      <div style={{ background: dark ? 'var(--bg-dark)' : 'var(--bg-light)', padding: '56px 56px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)', marginBottom: 14 }}>{tag}</div>
        <div style={{ width: 40, height: 2, background: 'var(--bd-accent)', marginBottom: 18 }} />
        <div style={{ fontSize: 48, fontWeight: 300, color: dark ? 'white' : 'var(--bd-text)', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 22, fontFamily: 'var(--bd-font)' }}>{title}</div>
        <div style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.52)' : 'var(--text-muted)', lineHeight: 1.85, maxWidth: 580 }}>{body}</div>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 200, backgroundImage: dark ? 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,0.06) 28px,rgba(255,255,255,0.06) 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,255,255,0.06) 28px,rgba(255,255,255,0.06) 29px)' : 'none', pointerEvents: 'none' }} />
      </div>
    )
  }

  function AccentBand({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ background: 'var(--bd-accent)', padding: '20px 56px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 3, height: 40, background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        <div style={{ fontSize: 13.5, color: 'white', lineHeight: 1.7, fontStyle: 'italic' }}>{children}</div>
      </div>
    )
  }

  /* ─── Section renders ───────────────────────────────────────────────────── */

  function renderLogos() {
    return (
      <>
        <HeroBand tag={`Brand identity — Logos`} title={`${bd!.meta.name} logo system`} body={bd!.logos.intro} />
        <AccentBand>{bd!.logos.wordmarkNote}</AccentBand>

        <SectionRule label="Logo versions" sId="logos" />
        <div style={{ padding: '0 56px 28px' }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 620, marginBottom: 20 }}>
            Upload each logo variant below. The AI detects whether each upload is a wordmark, logomark, combination mark or emblem.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--bd-border)', border: '1px solid var(--bd-border)', borderRadius: 10, overflow: 'hidden' }}>
            {LOGO_SLOTS.map(slot => {
              const uploadUrl = bd!.logos.uploads[slot.id]
              const detectedType = bd!.logos.analyses[slot.id]
              const isUploading = logoUploading[slot.id]
              const inputId = `logo-input-${slot.id}`
              const bg = slot.darkBg ? 'var(--bg-dark)' : 'white'
              const iconColor = slot.darkBg ? 'rgba(255,255,255,0.3)' : 'var(--bd-border)'
              const labelColor = slot.darkBg ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)'
              return (
                <div key={slot.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor={inputId} style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', cursor: isUploading ? 'wait' : 'pointer', position: 'relative', overflow: 'hidden', minHeight: 140, borderBottom: '1px solid var(--bd-border)' }}>
                    {uploadUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={uploadUrl} alt={slot.label} style={{ maxHeight: 64, maxWidth: '80%', objectFit: 'contain' }} />
                        <div
                          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
                        >
                          <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>↑ Replace</span>
                        </div>
                      </>
                    ) : isUploading ? (
                      <div style={{ width: 24, height: 24, border: `2px solid ${iconColor}`, borderTopColor: slot.darkBg ? 'rgba(255,255,255,0.8)' : '#555', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.6 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M7 9l5-5 5 5M3 20h18" stroke={slot.darkBg ? 'white' : '#6b7a8d'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span style={{ fontSize: 11, color: labelColor }}>Upload {slot.label}</span>
                      </div>
                    )}
                    <input id={inputId} type="file" accept="image/*,.svg" style={{ display: 'none' }} onChange={e => { uploadLogo(slot.id, e.target.files); e.target.value = '' }} />
                  </label>
                  <div style={{ padding: '10px 13px', background: 'white' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--bd-text)' }}>{slot.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{slot.desc}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: detectedType ? 'var(--bg-light)' : 'transparent', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', border: detectedType ? 'none' : '1px dashed var(--bd-border)' }}>
                        {detectedType || 'empty slot'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <SectionRule label="Clearspace & size rules" sId="logos" padTop={0} />
        <div style={{ padding: '0 56px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Clearspace rule', body: bd!.logos.clearspace },
            { title: 'Minimum size',    body: bd!.logos.minimumSize },
          ].map(({ title, body }) => (
            <div key={title} style={{ border: '1px solid var(--bd-border)', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--bd-text)', lineHeight: 1.75 }}>{body}</div>
            </div>
          ))}
        </div>

        <SectionRule label="Prohibited use" sId="logos" padTop={0} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 56px 48px' }}>
          {bd!.logos.restrictions.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', border: '1px solid var(--bd-border)', borderRadius: 7, background: 'white' }}>
              <span style={{ fontSize: 12, color: '#dc2626', flexShrink: 0, fontWeight: 700 }}>✗</span>
              <span style={{ fontSize: 13, color: 'var(--bd-text)', lineHeight: 1.6 }}>{r}</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  function renderTypography() {
    const szMap: Record<string, string> = { '52px': '34px', '36px': '24px', '26px': '18px', '16px': '14px', '11px': '11px' }
    return (
      <>
        <HeroBand tag="Brand identity — Typography" title="Our typography" body={bd!.typography.intro} />
        <div style={{ background: 'var(--bg-dark)', padding: '14px 56px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 3, height: 28, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            Primary: <strong style={{ color: 'white' }}>{bd!.typography.displayFont}</strong>
            {bd!.typography.bodyFont !== bd!.typography.displayFont && (
              <> &nbsp;·&nbsp; Body: <strong style={{ color: 'white' }}>{bd!.typography.bodyFont}</strong></>
            )}
            &nbsp;·&nbsp; Sentence case only &nbsp;·&nbsp; Hierarchy always respected
          </div>
        </div>

        <SectionRule label="Type scale" sId="type" />
        <div style={{ padding: '0 56px 32px' }}>
          {bd!.typography.scale.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '14px 0', borderBottom: i < bd!.typography.scale.length - 1 ? '1px solid var(--bd-border)' : 'none' }}>
              <div style={{ width: 140, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--bd-text)' }}>{row.role}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{row.size} / {row.wt}</div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: szMap[row.size] || '13px', fontWeight: parseInt(row.wt) || 400, letterSpacing: row.tr, color: i === 3 ? 'var(--text-muted)' : 'var(--bd-text)', lineHeight: 1.1, textTransform: row.tr === '0.1em' ? 'uppercase' : 'none', fontFamily: 'var(--bd-font)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.sample}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', width: 110, textAlign: 'right', flexShrink: 0 }}>{row.usage}</div>
            </div>
          ))}
        </div>

        <SectionRule label="Do / Don&apos;t" sId="type" padTop={0} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 56px 48px' }}>
          {[{ title: 'Do this', items: bd!.typography.dos, pass: true }, { title: 'Not this', items: bd!.typography.donts, pass: false }].map(({ title, items, pass }) => (
            <div key={title} style={{ border: '1px solid var(--bd-border)', borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: pass ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, letterSpacing: '0.05em' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: pass ? '#16a34a' : '#dc2626', display: 'inline-block' }} />{title}
              </div>
              {items.map((d, i) => (
                <div key={i} style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 7, display: 'flex', gap: 7, lineHeight: 1.55 }}>
                  <span style={{ color: pass ? 'var(--bd-accent)' : '#dc2626', flexShrink: 0 }}>—</span>{d}
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    )
  }

  function renderColors() {
    return (
      <>
        <HeroBand tag="Brand identity — Colors" title="Colour system" body={bd!.colors.intro} />

        {/* Large interactive color strip */}
        <div style={{ display: 'flex', height: 150 }}>
          {bd!.colors.palette.map((c, i) => (
            <div
              key={i}
              style={{ flex: 1, background: c.hex, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px 14px', cursor: 'pointer', transition: 'flex 0.25s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.flex = '1.8' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.flex = '1' }}
            >
              <div style={{ fontSize: 12, fontWeight: 500, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.5)', marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{c.hex}</div>
            </div>
          ))}
        </div>

        <SectionRule label="Primary palette" sId="colors" />
        <div style={{ margin: '0 56px', border: '1px solid var(--bd-border)', borderRadius: 10, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
          {bd!.colors.palette.map((c, i) => (
            <div key={i} style={{ flex: 1, borderRight: i < bd!.colors.palette.length - 1 ? '1px solid var(--bd-border)' : 'none' }}>
              <div style={{ height: 64, background: c.hex }} />
              <div style={{ padding: '12px 13px', borderTop: '1px solid var(--bd-border)' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--bd-text)' }}>{c.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: 2 }}>{c.hex}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{c.role}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 7 }}>
                  {[{ l: 'AA', p: c.aa }, { l: 'AAA', p: c.aaa }].map(({ l, p }) => (
                    <span key={l} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, fontWeight: 600, background: p ? '#dcfce7' : '#fee2e2', color: p ? '#15803d' : '#b91c1c' }}>{l} {p ? '✓' : '✗'}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {bd!.colors.secondary.length > 0 && (
          <>
            <SectionRule label="Secondary palette" sId="colors" padTop={24} />
            <div style={{ margin: '0 56px 8px', border: '1px solid var(--bd-border)', borderRadius: 10, overflow: 'hidden', display: 'flex' }}>
              {bd!.colors.secondary.map((c, i) => (
                <div key={i} style={{ flex: 1, borderRight: i < bd!.colors.secondary.length - 1 ? '1px solid var(--bd-border)' : 'none' }}>
                  <div style={{ height: 44, background: c.hex }} />
                  <div style={{ padding: '10px 12px', borderTop: '1px solid var(--bd-border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--bd-text)' }}>{c.name}</div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: 2 }}>{c.hex}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{c.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <SectionRule label="Usage rules" sId="colors" padTop={24} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '0 56px 48px' }}>
          {bd!.colors.rules.map((rule, i) => (
            <div key={i} style={{ border: '1px solid var(--bd-border)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{rule.label}</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {rule.dots.map((d, j) => <div key={j} style={{ width: 20, height: 20, borderRadius: '50%', background: d, border: '1px solid rgba(0,0,0,0.06)' }} />)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--bd-text)', lineHeight: 1.65 }}>{rule.rule}</div>
            </div>
          ))}
        </div>
      </>
    )
  }

  function renderImageStyle() {
    return (
      <>
        <HeroBand tag="Brand identity — Image style" title="Photography" body={bd!.imgstyle.intro} />
        <AccentBand>Imagery focuses on real environments and authentic performance — not lifestyle, not aspiration. Every image should feel like it was taken, not produced.</AccentBand>

        <SectionRule label="Style rules" sId="imgstyle" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 56px 48px' }}>
          {[{ title: 'Approved style', items: bd!.imgstyle.approved, pass: true }, { title: 'Never use', items: bd!.imgstyle.prohibited, pass: false }].map(({ title, items, pass }) => (
            <div key={title} style={{ border: '1px solid var(--bd-border)', borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: pass ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, letterSpacing: '0.05em' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: pass ? '#16a34a' : '#dc2626', display: 'inline-block' }} />{title}
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 7, display: 'flex', gap: 7, lineHeight: 1.55 }}>
                  <span style={{ color: pass ? 'var(--bd-accent)' : '#dc2626', flexShrink: 0 }}>—</span>{item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    )
  }

  function renderButtons() {
    const r = bd!.buttons.cornerRadius
    return (
      <>
        <HeroBand tag="Design system — Button styles" title="Button styles" body={bd!.buttons.note} dark={false} />
        <SectionRule label="Variants" sId="buttons" />
        <div style={{ padding: '0 56px 28px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          {[
            { label: 'Primary',   bg: 'var(--bg-dark)',   tc: 'white',              border: 'none' },
            { label: 'Secondary', bg: 'transparent',      tc: 'var(--bd-text)',     border: '1.5px solid var(--bg-dark)' },
            { label: 'Accent',    bg: 'var(--bd-accent)', tc: 'white',              border: 'none' },
            { label: 'Disabled',  bg: 'transparent',      tc: 'rgba(0,0,0,0.25)',  border: '1px solid var(--bd-border)' },
          ].map(btn => (
            <button key={btn.label} style={{ padding: '10px 24px', borderRadius: r, fontSize: 14, fontWeight: 500, fontFamily: 'var(--bd-font)', background: btn.bg, color: btn.tc, border: btn.border, cursor: btn.label === 'Disabled' ? 'not-allowed' : 'default' }}>
              {btn.label}
            </button>
          ))}
        </div>

        <SectionRule label="Corner radius" sId="buttons" padTop={0} />
        <div style={{ padding: '0 56px 48px', display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          {[0, 4, 6, 8, 12, 24].map(rv => (
            <div key={rv} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: rv === r ? 52 : 44, height: rv === r ? 52 : 44, borderRadius: rv, background: rv === r ? 'var(--bg-dark)' : 'var(--bg-light)', border: rv === r ? 'none' : '1px solid var(--bd-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {rv === r && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: rv === r ? 'var(--bg-dark)' : 'var(--text-muted)', fontWeight: rv === r ? 600 : 400 }}>{rv}px</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  function renderGallerySection(id: string, title: string, body: string) {
    return (
      <>
        <HeroBand tag={`Design system — ${title}`} title={title} body={body} dark={false} />
        <SectionRule label={`${title} library`} sId={id} />
        <div style={{ padding: '0 56px 48px' }}>
          <AssetGallery
            items={galleryAssets[id] || []}
            columns={id === 'icons' ? 4 : 3}
            onUpload={files => uploadGalleryAsset(id, files)}
            onRemove={imgId => removeGalleryAsset(id, imgId)}
            uploading={galleryUploading[id]}
          />
        </div>
      </>
    )
  }

  function renderSocial() {
    return (
      <>
        <HeroBand tag="Channels — Social media" title="Social media" body={bd!.social.note} dark={false} />
        <SectionRule label="Canva template" sId="social" />
        <div style={{ padding: '0 56px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={templateLink}
            onChange={e => setTemplateLink(e.target.value)}
            placeholder="Paste Canva template link…"
            style={{ flex: 1, padding: '9px 13px', border: '1px solid var(--bd-border)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: 'var(--bd-text)' }}
          />
          {templateLink ? (
            <a href={templateLink} target="_blank" rel="noreferrer" style={{ padding: '9px 18px', borderRadius: 6, background: 'var(--bg-dark)', color: 'white', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>Open in Canva ↗</a>
          ) : (
            <button disabled style={{ padding: '9px 18px', borderRadius: 6, background: 'var(--bg-dark)', color: 'white', border: 'none', fontSize: 12, opacity: 0.35, cursor: 'not-allowed', fontFamily: 'inherit' }}>Open in Canva ↗</button>
          )}
        </div>
        <SectionRule label="Post gallery" sId="social" padTop={0} />
        <div style={{ padding: '0 56px 48px' }}>
          <AssetGallery
            items={galleryAssets.social || []}
            columns={3}
            onUpload={files => uploadGalleryAsset('social', files)}
            onRemove={id => removeGalleryAsset('social', id)}
            uploading={galleryUploading.social}
          />
        </div>
      </>
    )
  }

  function renderSection() {
    switch (cur) {
      case 'logos':    return renderLogos()
      case 'type':     return renderTypography()
      case 'colors':   return renderColors()
      case 'imgstyle': return renderImageStyle()
      case 'buttons':  return renderButtons()
      case 'graphics': return renderGallerySection('graphics', 'Graphic elements', bd!.graphics.note)
      case 'icons':    return renderGallerySection('icons', 'Icons', bd!.graphics.note)
      case 'packaging':return renderGallerySection('packaging', 'Package style', bd!.packaging.note)
      case 'social':   return renderSocial()
      default:         return renderLogos()
    }
  }

  /* ─── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div style={{ ...themeVars, display: 'flex', height: '100%', fontFamily: 'var(--bd-font)', background: 'white', position: 'relative', overflow: 'hidden' }}>

      {/* LEFT NAV */}
      <nav style={{ width: 210, background: 'var(--bg-dark)', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 4px)', gap: 3, marginBottom: 12 }}>
            {Array(12).fill(0).map((_, i) => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', display: 'block' }} />)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'white', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{bd.meta.name}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Brand guideline</div>
        </div>
        <div style={{ flex: 1 }}>
          {NAV_GROUPS.map(g => (
            <div key={g.group}>
              <div style={{ padding: '14px 18px 4px', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{g.group}</div>
              {g.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCur(item.id)}
                  style={{ padding: '8px 18px', fontSize: 12, color: cur === item.id ? 'white' : 'rgba(255,255,255,0.42)', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'left', background: cur === item.id ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: cur === item.id ? `2px solid ${bd.theme.accentColor}` : '2px solid transparent', fontWeight: cur === item.id ? 500 : 400, fontFamily: 'inherit', transition: 'all 0.12s' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        {bd.meta.tagline && (
          <div style={{ padding: '12px 18px', fontSize: 9, color: 'rgba(255,255,255,0.18)', borderTop: '1px solid rgba(255,255,255,0.07)', lineHeight: 1.6 }}>
            {bd.meta.tagline}
          </div>
        )}
      </nav>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* TOPBAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 28px', borderBottom: '1px solid var(--bd-border)', flexShrink: 0, background: 'white', zIndex: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {bd.meta.name} <span style={{ opacity: 0.4 }}>›</span> <strong style={{ color: 'var(--bd-text)', fontWeight: 500 }}>{ALL_LABELS[cur] || cur}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{ fontSize: 11, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--bd-border)', background: 'white', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}
            >↑ Upload guideline</button>
            <button
              onClick={() => openEdit(cur)}
              style={{ fontSize: 11, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--bg-dark)', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
            >Edit section</button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto' }} key={cur}>
          {renderSection()}
        </div>

        {/* EDIT PANEL */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, background: 'white', borderLeft: '1px solid var(--bd-border)', display: 'flex', flexDirection: 'column', transform: editOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.22s ease', zIndex: 55, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Edit: {ALL_LABELS[editSection] || editSection}</span>
            <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
          </div>
          {editLoading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--bd-border)', borderTopColor: 'var(--bg-dark)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updating section…</div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5 }}>What would you like to change?</div>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    placeholder="e.g. 'Add a monochrome color variant' or 'Update the clearspace rule to x-height instead of cap-height'"
                    style={{ width: '100%', height: 100, padding: '10px 12px', border: '1px solid var(--bd-border)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5 }}>Reference image (optional)</div>
                  {editImg ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editImg.preview} alt="" style={{ width: '100%', borderRadius: 7, border: '1px solid var(--bd-border)' }} />
                      <button onClick={() => setEditImg(null)} style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: 5, padding: 0, fontFamily: 'inherit' }}>Remove ×</button>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileRef.current?.click()}
                      style={{ border: '1.5px dashed var(--bd-border)', borderRadius: 8, padding: 18, textAlign: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upload reference screenshot or design</div>
                      <div style={{ fontSize: 11, color: 'var(--bd-accent)', marginTop: 3 }}>PNG, JPG</div>
                    </div>
                  )}
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return
                      const r = new FileReader()
                      r.onload = ev => {
                        const s = ev.target?.result as string
                        setEditImg({ base64: s.split(',')[1], type: f.type, preview: s })
                      }
                      r.readAsDataURL(f)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>
              <div style={{ padding: '13px 18px', borderTop: '1px solid var(--bd-border)', display: 'flex', gap: 8 }}>
                <button onClick={() => setEditOpen(false)} style={{ flex: 1, padding: 9, border: '1px solid var(--bd-border)', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Cancel</button>
                <button
                  onClick={applyEdit}
                  disabled={!editText && !editImg}
                  style={{ flex: 2, padding: 9, border: 'none', borderRadius: 6, background: !editText && !editImg ? '#f0f0f0' : 'var(--bg-dark)', color: !editText && !editImg ? '#aaa' : 'white', cursor: !editText && !editImg ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                >
                  Apply with AI →
                </button>
              </div>
            </>
          )}
        </div>

        {/* UPLOAD MODAL */}
        {modalOpen && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: 12, width: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '80%' }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--bd-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Upload brand guideline</span>
                <button onClick={() => { setModalOpen(false); setGuidelineImgs([]) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  onClick={() => modalFileRef.current?.click()}
                  style={{ border: '2px dashed var(--bd-border)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
                  <div style={{ fontSize: 14, color: 'var(--bd-text)', fontWeight: 500, marginBottom: 5 }}>Upload brand guideline screenshots</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    PNG or JPG — upload multiple pages.<br/>
                    Claude reads all pages in depth and extracts colors, fonts, logo rules, photography guidelines and all section text.
                  </div>
                </div>
                <input ref={modalFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { handleGuidelineFiles(e.target.files); e.target.value = '' }} />
                {guidelineImgs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {guidelineImgs.map((img, i) => (
                      <div key={i} style={{ width: 76, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--bd-border)', position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => setGuidelineImgs(p => p.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, background: 'var(--bg-light)', padding: '11px 14px', borderRadius: 7 }}>
                  <strong>What gets extracted:</strong> Brand colors (applied as theme to the entire guideline), font names, logo philosophy text, photography approach, color usage rules, clearspace rules, prohibited use guidelines.
                </div>
              </div>
              <div style={{ padding: '14px 22px', borderTop: '1px solid var(--bd-border)', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                {extractLoading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Extracting…</span>}
                <button onClick={() => { setModalOpen(false); setGuidelineImgs([]) }} style={{ padding: '8px 16px', border: '1px solid var(--bd-border)', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
                <button
                  onClick={extractGuideline}
                  disabled={!guidelineImgs.length || extractLoading}
                  style={{ padding: '8px 22px', border: 'none', borderRadius: 6, background: 'var(--bg-dark)', color: 'white', cursor: !guidelineImgs.length ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'inherit', opacity: !guidelineImgs.length ? 0.4 : 1 }}
                >
                  {extractLoading ? 'Extracting...' : 'Extract brand data'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        <button
          onClick={() => setChatOpen(p => !p)}
          style={{ position: 'absolute', bottom: 20, right: 20, width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-dark)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, boxShadow: '0 2px 14px rgba(0,0,0,0.2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.6 1 1 4.1 1 8c0 1.8.7 3.4 1.9 4.6L2 16l3.6-1.2C6.7 15.6 7.8 16 9 16c4.4 0 8-3.1 8-7s-3.6-8-8-8z" fill="white"/></svg>
        </button>
        {chatOpen && (
          <div style={{ position: 'absolute', bottom: 72, right: 20, width: 290, background: 'white', border: '1px solid var(--bd-border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', zIndex: 60, overflow: 'hidden', maxHeight: 340 }}>
            <div style={{ padding: '10px 13px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'white', flex: 1 }}>Brand AI</span>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ maxWidth: '90%', fontSize: 12, lineHeight: 1.55, padding: '8px 10px', background: m.type === 'bot' ? 'var(--bg-light)' : 'var(--bg-dark)', color: m.type === 'bot' ? 'var(--bd-text)' : 'white', alignSelf: m.type === 'bot' ? 'flex-start' : 'flex-end', borderRadius: m.type === 'bot' ? '10px 10px 10px 2px' : '10px 10px 2px 10px' }}>{m.text}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: '1px solid var(--bd-border)' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask the brand…"
                style={{ flex: 1, fontSize: 11, padding: '6px 9px', border: '1px solid var(--bd-border)', borderRadius: 6, outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={sendChat} style={{ padding: '6px 10px', background: 'var(--bg-dark)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>↑</button>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toastVisible && (
          <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-dark)', color: 'white', fontSize: 11, padding: '7px 18px', borderRadius: 20, zIndex: 95, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {toast}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
