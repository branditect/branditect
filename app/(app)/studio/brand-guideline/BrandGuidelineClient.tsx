'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/lib/useBrand'
import { authedFetch } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/index.ts";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface BrandTheme {
  darkColor: string
  accentColor: string
  lightColor: string
  fontFamily: string
}

interface LogoSlot {
  id: string
  label: StringKey
  desc: StringKey
  darkBg: boolean
}

type T = ReturnType<typeof useT>

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

// `id` is the slot stored on the uploaded image. Label and description are keys.
const LOGO_SLOTS: LogoSlot[] = [
  { id: 'brandmark',   label: 'guideline.slot.brandmark',   desc: 'guideline.slot.brandmarkDesc',   darkBg: true  },
  { id: 'wordmark',    label: 'guideline.slot.wordmark',    desc: 'guideline.slot.wordmarkDesc',    darkBg: false },
  { id: 'combination', label: 'guideline.slot.combination', desc: 'guideline.slot.combinationDesc', darkBg: false },
  { id: 'darkbg',      label: 'guideline.slot.darkbg',      desc: 'guideline.slot.darkbgDesc',      darkBg: true  },
  { id: 'lightbg',     label: 'guideline.slot.lightbg',     desc: 'guideline.slot.lightbgDesc',     darkBg: false },
  { id: 'mono',        label: 'guideline.slot.mono',        desc: 'guideline.slot.monoDesc',        darkBg: false },
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

// What renders. ALL_LABELS stays English: it is sent to
// /api/brand-guideline/edit as `sectionLabel`, inside the model's instructions.
const NAV_ITEM_KEYS: Record<string, StringKey> = {
  logos: 'visual.logos',
  type: 'guideline.nav.typography',
  colors: 'guideline.nav.colors',
  imgstyle: 'guideline.nav.imageStyle',
  buttons: 'guideline.nav.buttons',
  graphics: 'guideline.nav.graphics',
  icons: 'guideline.nav.icons',
  packaging: 'guideline.nav.packaging',
  social: 'guideline.nav.social',
}
const NAV_GROUP_KEYS: Record<string, StringKey> = {
  'Brand identity': 'guideline.group.identity',
  'Design system': 'guideline.group.designSystem',
  Products: 'nav.knowledge.products',
  Channels: 'nav.brand.channels',
}

/* ─── Asset gallery — module-level component ─────────────────────────────────── */

interface AssetGalleryProps {
  items: { id?: string | number; url: string }[]
  columns?: number
  onUpload: (files: FileList | null) => void
  onRemove: (id: string | number | undefined) => void
  uploading?: boolean
}

function AssetGallery({ items, columns = 3, onUpload, onRemove, uploading }: AssetGalleryProps) {
  const t = useT()
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
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('guideline.uploadImage')}</div>
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

/**
 * The placeholder guideline shown before the brand has one of its own. It is
 * written in code, so it is copy, built in the interface language. Whatever
 * the brand-text route or an extraction returns replaces it section by section.
 */
function buildInitialData(
  brandName: string,
  colors: { name: string; hex: string; role: string }[],
  fontName: string,
  brandImages: BrandImage[],
  t: T,
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
        { name: t('guideline.def.primaryDark'), hex: dark,   role: t('guideline.def.roleBackgrounds'), aa: true, aaa: true  },
        { name: t('colourRole.accent'),      hex: accent, role: t('guideline.def.roleCtas'),        aa: true, aaa: false },
        { name: t('guideline.def.light'),       hex: light,  role: t('guideline.def.roleSurfaces'),    aa: true, aaa: true  },
      ]

  return {
    meta: { name: brandName, tagline: '' },
    theme: { darkColor: dark, accentColor: accent, lightColor: light, fontFamily: fontName },
    logos: {
      intro: t('guideline.def.logoIntro', { brandName }),
      wordmarkNote: t('guideline.def.wordmarkNote'),
      clearspace: t('guideline.def.clearspace'),
      minimumSize: t('guideline.def.minimumSize'),
      restrictions: [
        t('guideline.def.restriction1'),
        t('guideline.def.restriction2'),
        t('guideline.def.restriction3'),
        t('guideline.def.restriction4'),
        t('guideline.def.restriction5'),
      ],
      uploads,
      analyses,
    },
    typography: {
      intro: t('guideline.def.typographyIntro', { brandName }),
      displayFont: fontName,
      bodyFont: fontName,
      scale: [
        { role: t('guideline.def.roleDisplay'),  size: '52px', wt: '300', tr: '−0.03em', usage: t('guideline.def.usageDisplay'),  sample: t('guideline.def.sampleDisplay') },
        { role: t('guideline.def.roleHeading1'), size: '36px', wt: '400', tr: '−0.02em', usage: t('guideline.def.usageHeading1'), sample: t('guideline.def.sampleHeading1') },
        { role: t('guideline.def.roleHeading2'), size: '26px', wt: '500', tr: '−0.01em', usage: t('guideline.def.usageHeading2'), sample: t('guideline.def.sampleHeading2') },
        { role: t('guideline.def.roleBody'),     size: '16px', wt: '400', tr: '0',       usage: t('guideline.def.usageBody'),     sample: t('guideline.def.sampleBody') },
        { role: t('guideline.def.roleLabel'),    size: '11px', wt: '600', tr: '0.1em',   usage: t('guideline.def.usageLabel'),    sample: t('guideline.def.sampleLabel') },
      ],
      dos: [
        t('guideline.def.do1', { fontName }),
        t('guideline.def.do2'),
        t('guideline.def.do3'),
      ],
      donts: [
        t('guideline.def.dont1'),
        t('guideline.def.dont2'),
        t('guideline.def.dont3'),
      ],
    },
    colors: {
      intro: t('guideline.def.colorsIntro', { brandName }),
      palette,
      secondary: colors.length > 5
        ? colors.slice(5).map(c => ({ name: c.name, hex: c.hex, role: c.role }))
        : [{ name: t('guideline.def.neutral'), hex: '#8a8580', role: t('guideline.def.roleDividers') }],
      rules: [
        { label: t('guideline.def.primaryPairing'), dots: [dark, light], rule: t('guideline.def.pairingRule', { first: String(palette[0]?.name), second: palette[2]?.name || t('guideline.def.white') }) },
        { label: t('guideline.def.darkMode'), dots: [light, accent, dark], rule: t('guideline.def.darkModeRule', { accent: palette[1]?.name || t('guideline.def.accentFallback'), dark: String(palette[0]?.name) }) },
        { label: t('guideline.def.neverCombine'), dots: [accent, palette[3]?.hex || '#6b8a6e'], rule: t('guideline.def.neverCombineRule') },
      ],
    },
    buttons: {
      cornerRadius: 6,
      note: t('guideline.def.buttonsNote'),
    },
    imgstyle: {
      intro: t('guideline.def.imageryIntro', { brandName }),
      approved: [
        t('guideline.def.approved1'),
        t('guideline.def.approved2'),
        t('guideline.def.approved3'),
        t('guideline.def.approved4'),
        t('guideline.def.approved5'),
      ],
      prohibited: [
        t('guideline.def.prohibited1'),
        t('guideline.def.prohibited2'),
        t('guideline.def.prohibited3'),
        t('guideline.def.prohibited4'),
        t('guideline.def.prohibited5'),
      ],
    },
    graphics: { note: t('guideline.def.graphicsNote') },
    packaging: { note: t('guideline.def.packagingNote') },
    social: { note: t('guideline.def.socialNote'), templateLink: '' },
  }
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

export default function BrandGuidelineClient() {
  const t = useT()
  const shownLabel = (id: string) => (NAV_ITEM_KEYS[id] ? t(NAV_ITEM_KEYS[id]) : ALL_LABELS[id] || id)
  const shownGroup = (group: string) => (NAV_GROUP_KEYS[group] ? t(NAV_GROUP_KEYS[group]) : group)
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
  const [chatMsgs, setChatMsgs] = useState([{ type: 'bot', text: t('guideline.chatHello') }])
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
    setBd(buildInitialData(brandName, colors, 'Inter', [], t))
  }, [brand, brandName, bd]) // eslint-disable-line react-hooks/exhaustive-deps

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
    authedFetch('/api/brand-guideline/brand-text', {
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
      const res = await authedFetch('/api/brand-guideline/upload-asset', { method: 'POST', body: fd })
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
        showToast(json.analysis?.logoType
          ? t('guideline.toast.logoUploadedType', { type: json.analysis.logoType })
          : t('guideline.toast.logoUploaded'))
      } else showToast(t('guideline.toast.uploadFailedReason', { error: String(json.error) }))
    } catch { showToast(t('guideline.toast.uploadError')) }
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
      const res = await authedFetch('/api/brand-guideline/upload-asset', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        setGalleryAssets(p => ({ ...p, [category]: [...(p[category] || []), { id: json.id, url: json.url }] }))
        showToast(t('guideline.toast.uploaded'))
      }
    } catch { showToast(t('docs.uploadFailed')) }
    setGalleryUploading(p => ({ ...p, [category]: false }))
  }

  async function removeGalleryAsset(category: string, id: string | number | undefined) {
    setGalleryAssets(p => ({ ...p, [category]: (p[category] || []).filter(a => a.id !== id) }))
    if (id && brandId) {
      await authedFetch('/api/brand-guideline/upload-asset', {
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
        setEditOpen(false); showToast(t('guideline.toast.updated'))
      } else showToast(t('guideline.toast.couldNotUpdate'))
    } catch { showToast(t('guideline.toast.apiError')) }
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
        showToast(t('guideline.toast.extracted'))
      } else showToast(t('guideline.toast.couldNotParse'))
    } catch { showToast(t('guideline.toast.apiError')) }
    setExtractLoading(false)
  }

  /* ── Chat ────────────────────────────────────────────────────────────────── */

  const chatFallbacks = bd ? [
    t('guideline.chat.primaryColor', { hex: String(bd.colors.palette[0]?.hex) }),
    t('guideline.chat.combinationMark'),
    t('guideline.chat.typography', { wt: String(bd.typography.scale[0]?.wt) }),
    t('guideline.chat.photography'),
    t('guideline.chat.buttons', { cornerRadius: bd.buttons.cornerRadius }),
    t('guideline.chat.clearspace'),
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
        {t('guideline.loading')}
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
        {t("common.edit")}
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
        <HeroBand tag={t('guideline.tag.logos')} title={t('guideline.logoSystem', { name: bd!.meta.name })} body={bd!.logos.intro} />
        <AccentBand>{bd!.logos.wordmarkNote}</AccentBand>

        <SectionRule label={t('guideline.logoVersions')} sId="logos" />
        <div style={{ padding: '0 56px 28px' }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 620, marginBottom: 20 }}>
            {t('guideline.logoVersionsHelp')}
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
                        <img src={uploadUrl} alt={t(slot.label)} style={{ maxHeight: 64, maxWidth: '80%', objectFit: 'contain' }} />
                        <div
                          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
                        >
                          <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{t('guideline.replace')}</span>
                        </div>
                      </>
                    ) : isUploading ? (
                      <div style={{ width: 24, height: 24, border: `2px solid ${iconColor}`, borderTopColor: slot.darkBg ? 'rgba(255,255,255,0.8)' : '#555', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.6 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M7 9l5-5 5 5M3 20h18" stroke={slot.darkBg ? 'white' : '#6b7a8d'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span style={{ fontSize: 11, color: labelColor }}>{t('guideline.uploadSlot', { label: t(slot.label) })}</span>
                      </div>
                    )}
                    <input id={inputId} type="file" accept="image/*,.svg" style={{ display: 'none' }} onChange={e => { uploadLogo(slot.id, e.target.files); e.target.value = '' }} />
                  </label>
                  <div style={{ padding: '10px 13px', background: 'white' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--bd-text)' }}>{t(slot.label)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t(slot.desc)}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: detectedType ? 'var(--bg-light)' : 'transparent', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', border: detectedType ? 'none' : '1px dashed var(--bd-border)' }}>
                        {detectedType === 'uploaded' ? t('guideline.uploaded') : detectedType || t('guideline.emptySlot')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <SectionRule label={t('guideline.clearspaceRules')} sId="logos" padTop={0} />
        <div style={{ padding: '0 56px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guideline.clearspaceRule' as const, body: bd!.logos.clearspace },
            { titleKey: 'visual.minSize' as const,           body: bd!.logos.minimumSize },
          ].map(({ titleKey, body }) => (
            <div key={titleKey} style={{ border: '1px solid var(--bd-border)', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{t(titleKey)}</div>
              <div style={{ fontSize: 13, color: 'var(--bd-text)', lineHeight: 1.75 }}>{body}</div>
            </div>
          ))}
        </div>

        <SectionRule label={t('guideline.prohibitedUse')} sId="logos" padTop={0} />
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
        <HeroBand tag={t('guideline.tag.typography')} title={t('guideline.ourTypography')} body={bd!.typography.intro} />
        <div style={{ background: 'var(--bg-dark)', padding: '14px 56px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 3, height: 28, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            {t('guideline.primaryFont')} <strong style={{ color: 'white' }}>{bd!.typography.displayFont}</strong>
            {bd!.typography.bodyFont !== bd!.typography.displayFont && (
              <> &nbsp;·&nbsp; {t('guideline.bodyFont')} <strong style={{ color: 'white' }}>{bd!.typography.bodyFont}</strong></>
            )}
            &nbsp;·&nbsp; {t('guideline.sentenceCaseOnly')} &nbsp;·&nbsp; {t('guideline.hierarchyRespected')}
          </div>
        </div>

        <SectionRule label={t('guideline.typeScale')} sId="type" />
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

        <SectionRule label={t('guideline.doDont')} sId="type" padTop={0} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 56px 48px' }}>
          {[{ titleKey: 'guideline.doThis' as const, items: bd!.typography.dos, pass: true }, { titleKey: 'guideline.notThis' as const, items: bd!.typography.donts, pass: false }].map(({ titleKey, items, pass }) => (
            <div key={titleKey} style={{ border: '1px solid var(--bd-border)', borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: pass ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, letterSpacing: '0.05em' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: pass ? '#16a34a' : '#dc2626', display: 'inline-block' }} />{t(titleKey)}
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
        <HeroBand tag={t('guideline.tag.colors')} title={t('guideline.colourSystem')} body={bd!.colors.intro} />

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

        <SectionRule label={t('guideline.primaryPalette')} sId="colors" />
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
            <SectionRule label={t('guideline.secondaryPalette')} sId="colors" padTop={24} />
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

        <SectionRule label={t('guideline.usageRules')} sId="colors" padTop={24} />
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
        <HeroBand tag={t('guideline.tag.imageStyle')} title={t('guideline.photography')} body={bd!.imgstyle.intro} />
        <AccentBand>{t('guideline.imageryBand')}</AccentBand>

        <SectionRule label={t('guideline.styleRules')} sId="imgstyle" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 56px 48px' }}>
          {[{ titleKey: 'guideline.approvedStyle' as const, items: bd!.imgstyle.approved, pass: true }, { titleKey: 'tone.neverUse' as const, items: bd!.imgstyle.prohibited, pass: false }].map(({ titleKey, items, pass }) => (
            <div key={titleKey} style={{ border: '1px solid var(--bd-border)', borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: pass ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, letterSpacing: '0.05em' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: pass ? '#16a34a' : '#dc2626', display: 'inline-block' }} />{t(titleKey)}
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
        <HeroBand tag={t('guideline.tag.buttons')} title={t('guideline.nav.buttons')} body={bd!.buttons.note} dark={false} />
        <SectionRule label={t('guideline.variants')} sId="buttons" />
        <div style={{ padding: '0 56px 28px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          {[
            { id: 'primary',   label: 'guideline.btn.primary' as const,   bg: 'var(--bg-dark)',   tc: 'white',              border: 'none' },
            { id: 'secondary', label: 'guideline.btn.secondary' as const, bg: 'transparent',      tc: 'var(--bd-text)',     border: '1.5px solid var(--bg-dark)' },
            { id: 'accent',    label: 'guideline.btn.accent' as const,    bg: 'var(--bd-accent)', tc: 'white',              border: 'none' },
            { id: 'disabled',  label: 'guideline.btn.disabled' as const,  bg: 'transparent',      tc: 'rgba(0,0,0,0.25)',  border: '1px solid var(--bd-border)' },
          ].map(btn => (
            <button key={btn.id} style={{ padding: '10px 24px', borderRadius: r, fontSize: 14, fontWeight: 500, fontFamily: 'var(--bd-font)', background: btn.bg, color: btn.tc, border: btn.border, cursor: btn.id === 'disabled' ? 'not-allowed' : 'default' }}>
              {t(btn.label)}
            </button>
          ))}
        </div>

        <SectionRule label={t('guideline.cornerRadius')} sId="buttons" padTop={0} />
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

  function renderGallerySection(id: string, body: string) {
    const title = shownLabel(id)
    return (
      <>
        <HeroBand tag={t('guideline.tag.designSystem', { title })} title={title} body={body} dark={false} />
        <SectionRule label={t('guideline.library', { title })} sId={id} />
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
        <HeroBand tag={t('guideline.tag.social')} title={t('guideline.nav.social')} body={bd!.social.note} dark={false} />
        <SectionRule label={t('guideline.canvaTemplate')} sId="social" />
        <div style={{ padding: '0 56px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={templateLink}
            onChange={e => setTemplateLink(e.target.value)}
            placeholder={t('guideline.canvaPlaceholder')}
            style={{ flex: 1, padding: '9px 13px', border: '1px solid var(--bd-border)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: 'var(--bd-text)' }}
          />
          {templateLink ? (
            <a href={templateLink} target="_blank" rel="noreferrer" style={{ padding: '9px 18px', borderRadius: 6, background: 'var(--bg-dark)', color: 'white', fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>{t('guideline.openInCanva')}</a>
          ) : (
            <button disabled style={{ padding: '9px 18px', borderRadius: 6, background: 'var(--bg-dark)', color: 'white', border: 'none', fontSize: 12, opacity: 0.35, cursor: 'not-allowed', fontFamily: 'inherit' }}>{t('guideline.openInCanva')}</button>
          )}
        </div>
        <SectionRule label={t('guideline.postGallery')} sId="social" padTop={0} />
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
      case 'graphics': return renderGallerySection('graphics', bd!.graphics.note)
      case 'icons':    return renderGallerySection('icons', bd!.graphics.note)
      case 'packaging':return renderGallerySection('packaging', bd!.packaging.note)
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
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{t('guideline.title')}</div>
        </div>
        <div style={{ flex: 1 }}>
          {NAV_GROUPS.map(g => (
            <div key={g.group}>
              <div style={{ padding: '14px 18px 4px', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{shownGroup(g.group)}</div>
              {g.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCur(item.id)}
                  style={{ padding: '8px 18px', fontSize: 12, color: cur === item.id ? 'white' : 'rgba(255,255,255,0.42)', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'left', background: cur === item.id ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: cur === item.id ? `2px solid ${bd.theme.accentColor}` : '2px solid transparent', fontWeight: cur === item.id ? 500 : 400, fontFamily: 'inherit', transition: 'all 0.12s' }}
                >
                  {shownLabel(item.id)}
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
            {bd.meta.name} <span style={{ opacity: 0.4 }}>›</span> <strong style={{ color: 'var(--bd-text)', fontWeight: 500 }}>{shownLabel(cur)}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{ fontSize: 11, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--bd-border)', background: 'white', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}
            >{t('guideline.uploadGuideline')}</button>
            <button
              onClick={() => openEdit(cur)}
              style={{ fontSize: 11, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--bg-dark)', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}
            >{t('guideline.editSection')}</button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto' }} key={cur}>
          {renderSection()}
        </div>

        {/* EDIT PANEL */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, background: 'white', borderLeft: '1px solid var(--bd-border)', display: 'flex', flexDirection: 'column', transform: editOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.22s ease', zIndex: 55, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{t('guideline.editLabel', { label: shownLabel(editSection) })}</span>
            <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
          </div>
          {editLoading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--bd-border)', borderTopColor: 'var(--bg-dark)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('guideline.updating')}</div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5 }}>{t('guideline.whatToChange')}</div>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    placeholder={t('guideline.changePlaceholder')}
                    style={{ width: '100%', height: 100, padding: '10px 12px', border: '1px solid var(--bd-border)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5 }}>{t('guideline.referenceImage')}</div>
                  {editImg ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editImg.preview} alt="" style={{ width: '100%', borderRadius: 7, border: '1px solid var(--bd-border)' }} />
                      <button onClick={() => setEditImg(null)} style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: 5, padding: 0, fontFamily: 'inherit' }}>{t('guideline.remove')}</button>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileRef.current?.click()}
                      style={{ border: '1.5px dashed var(--bd-border)', borderRadius: 8, padding: 18, textAlign: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('guideline.uploadReference')}</div>
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
                <button onClick={() => setEditOpen(false)} style={{ flex: 1, padding: 9, border: '1px solid var(--bd-border)', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>{t("common.cancel")}</button>
                <button
                  onClick={applyEdit}
                  disabled={!editText && !editImg}
                  style={{ flex: 2, padding: 9, border: 'none', borderRadius: 6, background: !editText && !editImg ? '#f0f0f0' : 'var(--bg-dark)', color: !editText && !editImg ? '#aaa' : 'white', cursor: !editText && !editImg ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                >
                  {t('guideline.applyWithAi')}
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
                <span style={{ fontSize: 14, fontWeight: 500 }}>{t('guideline.uploadModalTitle')}</span>
                <button onClick={() => { setModalOpen(false); setGuidelineImgs([]) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  onClick={() => modalFileRef.current?.click()}
                  style={{ border: '2px dashed var(--bd-border)', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
                  <div style={{ fontSize: 14, color: 'var(--bd-text)', fontWeight: 500, marginBottom: 5 }}>{t('guideline.uploadScreenshots')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    {t('guideline.pngOrJpg')}<br/>
                    {t('guideline.claudeReads')}
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
                  <strong>{t('guideline.whatGetsExtracted')}</strong> {t('guideline.extractedList')}
                </div>
              </div>
              <div style={{ padding: '14px 22px', borderTop: '1px solid var(--bd-border)', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                {extractLoading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('guideline.extracting')}</span>}
                <button onClick={() => { setModalOpen(false); setGuidelineImgs([]) }} style={{ padding: '8px 16px', border: '1px solid var(--bd-border)', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>{t("common.cancel")}</button>
                <button
                  onClick={extractGuideline}
                  disabled={!guidelineImgs.length || extractLoading}
                  style={{ padding: '8px 22px', border: 'none', borderRadius: 6, background: 'var(--bg-dark)', color: 'white', cursor: !guidelineImgs.length ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'inherit', opacity: !guidelineImgs.length ? 0.4 : 1 }}
                >
                  {extractLoading ? t('guideline.extractingDots') : t('guideline.extract')}
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
              <span style={{ fontSize: 12, fontWeight: 500, color: 'white', flex: 1 }}>{t('guideline.brandAi')}</span>
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
                placeholder={t('guideline.askPlaceholder')}
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
