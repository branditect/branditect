'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useBrand } from '@/lib/useBrand'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SectionKey = 'logos' | 'typography' | 'colors' | 'imgstyle' | 'packages'

interface PaletteColor { name: string; hex: string; role: string; aa: boolean; aaa: boolean }
interface LogoVariant   { bg: string; tc: string; dotC: string; label: string }
interface TypeRow       { role: string; size: string; wt: string; tr: string; usage: string; sample: string }
interface PackageItem   { name: string; desc: string; icon: string; includes: string[]; size: string }
interface ColorRule     { label: string; dots: string[]; rule: string }

interface BrandData {
  meta:       { name: string; tagline: string }
  logos:      { variants: LogoVariant[]; restrictions: string[] }
  typography: { scale: TypeRow[]; dos: string[]; donts: string[] }
  colors:     { palette: PaletteColor[]; rules: ColorRule[] }
  imgstyle:   { philosophy: string; approved: string[]; prohibited: string[] }
  packages:   { items: PackageItem[] }
}

interface ChatMsg { type: 'bot' | 'user'; text: string }

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const SECTION_LABELS: Record<SectionKey, string> = {
  logos:      'Logos',
  typography: 'Typography',
  colors:     'Colors',
  imgstyle:   'Image style',
  packages:   'Packages',
}

const EP_HINTS: Record<SectionKey, string> = {
  logos:      'e.g. "Add a stacked logo variant for embroidery use" or upload a logo screenshot',
  typography: 'e.g. "Switch display font to 400 weight" or upload a type specimen',
  colors:     'e.g. "Add warm amber #D4830A as a secondary accent"',
  imgstyle:   'e.g. "We also shoot close-ups of water droplets on absorbent materials"',
  packages:   'e.g. "Add a retail shelf label template to the Print master package"',
}

const NAV_ITEMS: { id: SectionKey; label: string }[] = [
  { id: 'logos',      label: 'Logos' },
  { id: 'typography', label: 'Typography' },
  { id: 'colors',     label: 'Colors' },
  { id: 'imgstyle',   label: 'Image style' },
  { id: 'packages',   label: 'Packages' },
]

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
        { name: 'Deep Navy',   hex: '#141c26', role: 'Primary backgrounds, headlines',     aa: true, aaa: true  },
        { name: 'Steel Blue',  hex: '#3a6ea5', role: 'Accent, interactive elements',       aa: true, aaa: false },
        { name: 'Off-white',   hex: '#f7f6f4', role: 'Light backgrounds, cards',           aa: true, aaa: true  },
        { name: 'Field Green', hex: '#6b8a6e', role: 'Environmental, secondary',           aa: true, aaa: false },
      ]

  return {
    meta: { name: brandName || 'Brand', tagline: 'Protective science for life' },
    logos: {
      variants: [
        { bg: '#141c26', tc: 'white',   dotC: 'rgba(255,255,255,0.6)', label: 'Primary — dark backgrounds'   },
        { bg: '#f7f6f4', tc: '#141c26', dotC: '#141c26',               label: 'Reversed — light backgrounds' },
        { bg: '#e8ecf0', tc: '#141c26', dotC: '#141c26',               label: 'On grey — approved'            },
        { bg: '#3a6ea5', tc: 'white',   dotC: 'rgba(255,255,255,0.7)', label: 'On steel blue — approved'      },
      ],
      restrictions: [
        'Do not stretch or distort the logo proportions',
        'Use white version on coloured or dark backgrounds — never the dark logo',
        'Do not recolour or apply gradients',
        'Do not add outlines, shadows or effects',
        'Always use master artwork — never recreate manually',
      ],
    },
    typography: {
      scale: [
        { role: 'Display',   size: '48px', wt: '300', tr: '−0.03em', usage: 'Hero, homepage',    sample: 'Protective science'             },
        { role: 'Heading 1', size: '32px', wt: '400', tr: '−0.02em', usage: 'Section titles',    sample: 'Reliable Spill Control'          },
        { role: 'Heading 2', size: '24px', wt: '500', tr: '−0.01em', usage: 'Cards, features',   sample: 'Engineered Absorbent Materials'  },
        { role: 'Body',      size: '16px', wt: '400', tr: '0',        usage: 'Paragraphs',        sample: 'Fast and effective containment for liquid spills in critical environments.' },
        { role: 'Label',     size: '11px', wt: '600', tr: '0.1em',   usage: 'Tags, categories',  sample: 'Environmental Safety & Compliance' },
      ],
      dos:   [
        'Use DM Sans as the primary font across all materials',
        'Use light weight (300) for display headlines',
        'Sentence case always — never title case for body',
      ],
      donts: [
        'Never use 700/900 weight on headlines',
        'Do not mix more than two weights per layout',
        'Do not use all-caps for body text',
      ],
    },
    colors: {
      palette: displayColors,
      rules: [
        { label: 'Primary',      dots: [displayColors[0]?.hex || '#141c26', displayColors[2]?.hex || '#f7f6f4'], rule: 'Primary color on light background. Default for all materials.' },
        { label: 'Dark surfaces', dots: [displayColors[2]?.hex || '#f7f6f4', displayColors[1]?.hex || '#3a6ea5', displayColors[0]?.hex || '#141c26'], rule: 'White type with accent on dark. Use for hero sections.' },
        { label: 'Never combine', dots: [displayColors[1]?.hex || '#3a6ea5', displayColors[3]?.hex || '#6b8a6e'], rule: 'Do not pair these two accent colors — they conflict.' },
      ],
    },
    imgstyle: {
      philosophy: 'Photography reflects precision, control and professional credibility. Lighting is clean and balanced, with cool, neutral tones. Imagery focuses on real environments, materials and surfaces where performance matters.',
      approved: [
        'Clean, balanced lighting — no harsh flash or dramatic shadows',
        'Cool, neutral tones aligned to the brand palette',
        'Real environments and sites where the product performs',
        'Tight, confident compositions with clear subject focus',
        'Professionals shown at work — not staged or over-styled',
      ],
      prohibited: [
        'Stock photos of smiling people in clean offices',
        'Warm, golden-hour or lifestyle photography tones',
        'Animals or images unrelated to industrial use',
        'Heavy retouching, artificial filters or visual effects',
        'Generic nature imagery with no brand relevance',
      ],
    },
    packages: {
      items: [
        { name: 'Logo package', icon: 'L', desc: 'All variants in every format',          size: '2.4 MB', includes: ['SVG master files (all variants)', 'PNG transparent (all sizes)', 'PDF print-ready', 'EPS for large format']                  },
        { name: 'Digital kit',  icon: 'D', desc: 'Web and screen-optimised assets',       size: '8.1 MB', includes: ['Favicons (all sizes)', 'Social headers & avatars', 'Email signature templates', 'Digital colour values (HEX, RGB)']          },
        { name: 'Print master', icon: 'P', desc: 'Print-ready files with CMYK specs',     size: '14.6 MB', includes: ['CMYK palette specification', 'Logo EPS for offset print', 'Brand guideline PDF v1.0', 'Typeface specimen sheets']             },
        { name: 'Social media', icon: 'S', desc: 'Templates for every platform',          size: '6.2 MB', includes: ['Instagram: post + story', 'LinkedIn: post + cover', 'Twitter/X header', 'Facebook cover']                                    },
      ],
    },
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function BrandGuidelineClient() {
  const router = useRouter()
  const { brandName } = useBrand()

  const [bd, setBd] = useState<BrandData>(() => buildInitialBrandData('Brand', []))
  const [curSection, setCurSection] = useState<SectionKey>('logos')
  const [editOpen, setEditOpen]   = useState(false)
  const [chatOpen, setChatOpen]   = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [editInstruction, setEditInstruction] = useState('')
  const [editImg, setEditImg]                 = useState<{ base64: string; type: string; preview: string } | null>(null)
  const [editLoading, setEditLoading]         = useState(false)

  const [guidelineImgs, setGuidelineImgs]   = useState<{ data: string; type: string; preview: string }[]>([])
  const [extractLoading, setExtractLoading] = useState(false)

  const [chatMsgs, setChatMsgs]   = useState<ChatMsg[]>([{ type: 'bot', text: 'Hi — ask me anything about this brand. Colors, logo usage, typography rules, what images to avoid...' }])
  const [chatInput, setChatInput] = useState('')

  const [toast, setToast]           = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const editFileRef  = useRef<HTMLInputElement>(null)
  const modalFileRef = useRef<HTMLInputElement>(null)
  const chatIdx      = useRef(0)

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
    })
  }, [router])

  // Update brand name when hook loads
  useEffect(() => {
    if (brandName) {
      setBd(prev => ({ ...prev, meta: { ...prev.meta, name: brandName } }))
    }
  }, [brandName])

  const chatResponses: string[] = [
    `Primary colour is ${bd.colors.palette[0]?.hex || '#141c26'} — use it on white or off-white surfaces only.`,
    'Typography: Display uses 300 weight, headlines use 400. Never use 700 — speak with calm authority.',
    'Photography must show real environments and professionals at work. No studio smiles.',
    'Logo: always use master artwork. Never recreate, stretch, recolour or add effects.',
    `${bd.colors.palette[1]?.name || 'Accent colour'} is an accent only — not a primary background for large areas.`,
    'Clearspace around the logo equals the logo height on all sides.',
  ]

  function showToast(msg: string) {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2600)
  }

  function goSection(id: SectionKey) {
    setCurSection(id)
    setEditOpen(false)
    setEditInstruction('')
    setEditImg(null)
  }

  function handleEditImg(files: FileList | null) {
    if (!files?.[0]) return
    const f = files[0]
    const r = new FileReader()
    r.onload = (e) => {
      const result = e.target?.result as string
      setEditImg({ base64: result.split(',')[1], type: f.type, preview: result })
    }
    r.readAsDataURL(f)
  }

  function handleGuidelineImgs(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(f => {
      const r = new FileReader()
      r.onload = (e) => {
        const result = e.target?.result as string
        setGuidelineImgs(prev => [...prev, { data: result.split(',')[1], type: f.type, preview: result }])
      }
      r.readAsDataURL(f)
    })
  }

  async function applyEdit() {
    if (!editInstruction && !editImg) { showToast('Add instructions or upload a reference image'); return }
    setEditLoading(true)
    try {
      const res = await fetch('/api/brand-guideline/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section:       curSection,
          sectionLabel:  SECTION_LABELS[curSection],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentData:   bd[curSection] as any,
          instruction:   editInstruction,
          imageBase64:   editImg?.base64 || null,
          imageType:     editImg?.type || null,
          brandName:     bd.meta.name,
          brandTagline:  bd.meta.tagline,
        }),
      })
      const json = await res.json() as { success: boolean; data?: Record<string, unknown> }
      if (json.success && json.data) {
        setBd(prev => ({
          ...prev,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [curSection]: { ...(prev[curSection] as any), ...(json.data as any) },
        }))
        setEditOpen(false)
        setEditInstruction('')
        setEditImg(null)
        showToast('Section updated ✓')
      } else {
        showToast('Could not parse — try rephrasing')
      }
    } catch {
      showToast('API error — check connection')
    }
    setEditLoading(false)
  }

  async function extractGuideline() {
    if (guidelineImgs.length === 0) return
    setExtractLoading(true)
    try {
      const res = await fetch('/api/brand-guideline/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: guidelineImgs.map(i => ({ data: i.data, type: i.type })) }),
      })
      const json = await res.json() as { success: boolean; data?: Partial<BrandData> }
      if (json.success && json.data) {
        setBd(prev => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = json.data as any
          return {
            ...prev,
            ...(d.meta       ? { meta:       { ...prev.meta,       ...d.meta       } } : {}),
            ...(d.logos      ? { logos:      { ...prev.logos,      ...d.logos      } } : {}),
            ...(d.typography ? { typography: { ...prev.typography, ...d.typography } } : {}),
            ...(d.colors     ? { colors:     { ...prev.colors,     ...d.colors     } } : {}),
            ...(d.imgstyle   ? { imgstyle:   { ...prev.imgstyle,   ...d.imgstyle   } } : {}),
            ...(d.packages   ? { packages:   { ...prev.packages,   ...d.packages   } } : {}),
          }
        })
        setModalOpen(false)
        setGuidelineImgs([])
        showToast('Brand data extracted ✓')
      } else {
        showToast('Could not parse — try clearer screenshots')
      }
    } catch {
      showToast('API error')
    }
    setExtractLoading(false)
  }

  function sendChat() {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMsgs(prev => [...prev, { type: 'user', text: msg }])
    setTimeout(() => {
      setChatMsgs(prev => [...prev, { type: 'bot', text: chatResponses[chatIdx.current % chatResponses.length] }])
      chatIdx.current++
    }, 700)
  }

  /* ---------------------------------------------------------------- */
  /* Section renderers                                                 */
  /* ---------------------------------------------------------------- */

  const nm = bd.meta.name

  function renderLogos() {
    return (
      <div>
        {/* Header */}
        <div style={{ background: '#1e2a38', padding: '44px 42px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 10 }}>Brand identity / Logos</div>
          <div style={{ fontSize: 36, fontWeight: 300, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{nm} logo system</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, maxWidth: 400, marginTop: 12 }}>
            The {nm} logo embodies precision and control. Always use master artwork — never recreate or modify.
          </div>
        </div>

        {/* Section label */}
        <div style={{ padding: '24px 42px 0' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Colour versions <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
          </div>
        </div>

        {/* Logo variants grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#dde2ea' }}>
          {bd.logos.variants.map((v, i) => (
            <div key={i} style={{ background: v.bg, padding: '26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,4px)', gap: 2 }}>
                  {Array(12).fill(0).map((_, j) => (
                    <span key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: (j === 7 || j === 10 || j === 11) ? 'transparent' : v.dotC, display: 'block' }} />
                  ))}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: v.tc }}>{nm.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${v.tc === 'white' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
                <span style={{ fontSize: 11, color: v.tc, opacity: 0.6 }}>{v.label}</span>
                <span style={{ fontSize: 10, color: v.tc, opacity: 0.5, cursor: 'pointer' }}>↓ SVG · PNG · PDF</span>
              </div>
            </div>
          ))}
        </div>

        {/* Restrictions */}
        <div style={{ padding: '24px 42px 0' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Prohibited use <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '0 42px 28px' }}>
          {bd.logos.restrictions.slice(0, 3).map((r, i) => (
            <div key={i} style={{ border: '1px solid #dde2ea', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: 64, background: '#f7f6f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#6b7a8d', padding: 12, textAlign: 'center' }}>
                {(['Stretched', 'Wrong bg', 'Recoloured'] as const)[i]}
              </div>
              <div style={{ padding: '9px 11px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>✗ Don&apos;t</div>
                <div style={{ fontSize: 10, color: '#6b7a8d', lineHeight: 1.5 }}>{r}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderTypography() {
    const szMap: Record<string, string> = { '48px': '32px', '32px': '22px', '24px': '18px', '16px': '14px', '11px': '11px' }
    return (
      <div>
        <div style={{ background: '#1e2a38', padding: '44px 42px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 10 }}>Brand identity / Typography</div>
          <div style={{ fontSize: 36, fontWeight: 300, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Our typography</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, maxWidth: 400, marginTop: 12 }}>Reflects clarity, precision and functional professionalism. Clean, modern and highly legible.</div>
        </div>

        {/* Type scale */}
        <div style={{ padding: '28px 42px', borderBottom: '1px solid #dde2ea' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Type scale <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
          </div>
          {bd.typography.scale.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 18, padding: '14px 0', borderBottom: i < bd.typography.scale.length - 1 ? '1px solid #dde2ea' : 'none' }}>
              <div style={{ width: 142, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#0d1117' }}>{row.role}</div>
                <div style={{ fontSize: 10, color: '#6b7a8d', marginTop: 2, fontFamily: 'monospace' }}>{row.size} / {row.wt} / {row.tr}</div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: szMap[row.size] || '13px', fontWeight: parseInt(row.wt), letterSpacing: row.tr, color: i === 3 ? '#6b7a8d' : '#0d1117', lineHeight: 1.2, textTransform: row.tr === '0.1em' ? 'uppercase' : 'none' as React.CSSProperties['textTransform'] }}>
                  {row.sample}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#6b7a8d', width: 100, textAlign: 'right', flexShrink: 0 }}>{row.usage}</div>
            </div>
          ))}
        </div>

        {/* Context preview */}
        <div style={{ padding: '24px 42px', background: '#f7f6f4', borderBottom: '1px solid #dde2ea' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Hierarchy in context <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
          </div>
          <div style={{ background: 'white', border: '1px solid #dde2ea', borderRadius: 8, padding: 26, maxWidth: 520 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 7 }}>{bd.typography.scale[4]?.sample || 'Label'}</div>
            <div style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', color: '#0d1117', marginBottom: 9, lineHeight: 1.2 }}>{bd.typography.scale[1]?.sample || 'Heading'}</div>
            <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.7, marginBottom: 14 }}>{bd.typography.scale[3]?.sample || 'Body text.'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '7px 16px', background: '#141c26', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Primary CTA</div>
              <div style={{ padding: '7px 16px', border: '1.5px solid #141c26', color: '#141c26', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Secondary</div>
            </div>
          </div>
        </div>

        {/* Do / Don't */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '24px 42px' }}>
          <div style={{ border: '1px solid #dde2ea', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />Do this
            </div>
            {bd.typography.dos.map((d, i) => (
              <div key={i} style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 5, display: 'flex', gap: 6 }}>
                <span style={{ color: '#3a6ea5', flexShrink: 0 }}>—</span>{d}
              </div>
            ))}
          </div>
          <div style={{ border: '1px solid #dde2ea', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />Not this
            </div>
            {bd.typography.donts.map((d, i) => (
              <div key={i} style={{ fontSize: 12, color: '#6b7a8d', marginBottom: 5, display: 'flex', gap: 6 }}>
                <span style={{ color: '#dc2626', flexShrink: 0 }}>—</span>{d}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderColors() {
    return (
      <div>
        <div style={{ background: '#1e2a38', padding: '44px 42px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 10 }}>Brand identity / Colors</div>
          <div style={{ fontSize: 36, fontWeight: 300, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Colour system</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, maxWidth: 400, marginTop: 12 }}>Our palette reflects professionalism and environmental responsibility. Authority, precision and calm confidence in every shade.</div>
        </div>

        <div style={{ padding: '24px 42px 0' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Master palette <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${bd.colors.palette.length}, 1fr)`, margin: '0 42px', border: '1px solid #dde2ea', borderRadius: 10, overflow: 'hidden' }}>
          {bd.colors.palette.map((c, i) => (
            <div key={i}>
              <div style={{ height: 72, background: c.hex }} />
              <div style={{ padding: '11px 13px', borderTop: '1px solid #dde2ea' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1117' }}>{c.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7a8d', marginTop: 2 }}>{c.hex}</div>
                <div style={{ fontSize: 10, color: '#6b7a8d', marginTop: 3 }}>{c.role}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, fontWeight: 600, background: c.aa ? '#dcfce7' : '#fee2e2', color: c.aa ? '#15803d' : '#b91c1c' }}>AA {c.aa ? '✓' : '✗'}</span>
                  <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, fontWeight: 600, background: c.aaa ? '#dcfce7' : '#fee2e2', color: c.aaa ? '#15803d' : '#b91c1c' }}>AAA {c.aaa ? '✓' : '✗'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px 42px 12px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Usage rules <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '0 42px 28px' }}>
          {bd.colors.rules.map((r, i) => (
            <div key={i} style={{ border: '1px solid #dde2ea', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>{r.label}</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                {r.dots.map((d, j) => (
                  <div key={j} style={{ width: 20, height: 20, borderRadius: '50%', background: d, border: d === '#f7f6f4' ? '1px solid #dde2ea' : 'none' }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#0d1117', lineHeight: 1.6 }}>{r.rule}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderImgstyle() {
    const bgs = [
      'linear-gradient(135deg,#1e3a4f,#2d5a7a)',
      'linear-gradient(160deg,#c0d0e0,#e0eaf2)',
      'linear-gradient(135deg,#1a2332,#344060)',
      'linear-gradient(160deg,#b5c8d8,#d0e0ea)',
    ]
    const lbls = [
      'Close-up · materials & surfaces',
      'Light aerial · controlled conditions',
      'Portrait · professional at work',
      'Industrial site · structural context',
    ]
    return (
      <div>
        <div style={{ background: '#1e2a38', padding: '44px 42px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 10 }}>Brand identity / Image style</div>
          <div style={{ fontSize: 36, fontWeight: 300, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Photography</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, maxWidth: 400, marginTop: 12 }}>{bd.imgstyle.philosophy}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#dde2ea' }}>
          {bgs.map((bg, i) => (
            <div key={i} style={{ height: 188, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', background: bg }}>
              <div style={{ padding: '10px 13px', fontSize: 10, color: 'white', fontWeight: 500, background: 'linear-gradient(transparent,rgba(0,0,0,0.6))', width: '100%' }}>{lbls[i]}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px 42px 0' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Style rules <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 42px 28px' }}>
          <div style={{ border: '1px solid #dde2ea', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />Approved style
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, padding: 0, margin: 0 }}>
              {bd.imgstyle.approved.map((a, i) => (
                <li key={i} style={{ fontSize: 11, color: '#6b7a8d', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#3a6ea5', flexShrink: 0 }}>—</span>{a}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ border: '1px solid #dde2ea', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />Never use
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, padding: 0, margin: 0 }}>
              {bd.imgstyle.prohibited.map((p, i) => (
                <li key={i} style={{ fontSize: 11, color: '#6b7a8d', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#dc2626', flexShrink: 0 }}>—</span>{p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  function renderPackages() {
    return (
      <div>
        <div style={{ background: '#f7f6f4', padding: '44px 42px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 10 }}>Brand assets / Packages</div>
          <div style={{ fontSize: 36, fontWeight: 300, color: '#0d1117', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Brand packages</div>
          <div style={{ fontSize: 13, color: '#6b7a8d', lineHeight: 1.75, maxWidth: 400, marginTop: 12 }}>Pre-assembled asset kits for every channel. Always start from a master package — never assemble manually from different sources.</div>
        </div>

        <div style={{ padding: '24px 42px 0' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7a8d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            Available packages <div style={{ flex: 1, height: 1, background: '#dde2ea' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 42px 28px' }}>
          {bd.packages.items.map((pk, i) => (
            <div key={i} style={{ border: '1px solid #dde2ea', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '18px 18px 14px', background: '#f7f6f4', borderBottom: '1px solid #dde2ea' }}>
                <div style={{ width: 34, height: 34, borderRadius: 7, background: '#141c26', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{pk.icon}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1117' }}>{pk.name}</div>
                <div style={{ fontSize: 11, color: '#6b7a8d', marginTop: 3 }}>{pk.desc}</div>
              </div>
              <div style={{ padding: '12px 18px', background: 'white' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                  {pk.includes.map((inc, j) => (
                    <li key={j} style={{ fontSize: 11, color: '#6b7a8d', display: 'flex', gap: 5 }}>
                      <span style={{ color: '#3a6ea5' }}>·</span>{inc}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#6b7a8d', fontFamily: 'monospace' }}>{pk.size}</span>
                  <button style={{ fontSize: 11, padding: '5px 12px', borderRadius: 5, background: '#141c26', color: 'white', border: 'none', cursor: 'pointer' }}>↓ Download</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const sectionRenderers: Record<SectionKey, () => React.ReactElement> = {
    logos:      renderLogos,
    typography: renderTypography,
    colors:     renderColors,
    imgstyle:   renderImgstyle,
    packages:   renderPackages,
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'DM Sans', sans-serif", background: 'white', position: 'relative', overflow: 'hidden' }}>

      {/* LEFT NAV */}
      <div style={{ width: 210, background: '#141c26', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Brand header */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,4px)', gap: 2, marginBottom: 8 }}>
            {Array(12).fill(0).map((_, i) => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'block' }} />)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'white', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{bd.meta.name}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>Brand guideline v1.0</div>
        </div>

        <div style={{ padding: '14px 18px 4px', fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Brand identity</div>

        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => goSection(item.id)}
            style={{
              padding: '8px 18px',
              fontSize: 12,
              color: curSection === item.id ? 'white' : 'rgba(255,255,255,0.48)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              borderLeft: curSection === item.id ? '2px solid #5a8ec5' : '2px solid transparent',
              background: curSection === item.id ? 'rgba(58,110,165,0.14)' : 'transparent',
              fontWeight: curSection === item.id ? 500 : 400,
              width: '100%',
              textAlign: 'left',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          >
            {item.label}
          </button>
        ))}

        <div style={{ marginTop: 'auto', padding: '14px 18px', fontSize: 9, color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.07)', lineHeight: 1.6 }}>
          {bd.meta.tagline}
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* TOPBAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 22px', borderBottom: '1px solid #dde2ea', flexShrink: 0, background: 'white', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7a8d' }}>
            {bd.meta.name} › <span style={{ color: '#0d1117', fontWeight: 500 }}>{SECTION_LABELS[curSection]}</span>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={() => setModalOpen(true)} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, border: '1px solid #6b7a8d', background: 'white', color: '#6b7a8d', cursor: 'pointer', fontFamily: 'inherit' }}>
              ↑ Upload guideline
            </button>
            <button onClick={() => setEditOpen(true)} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, border: '1px solid #3a6ea5', background: 'white', color: '#3a6ea5', cursor: 'pointer', fontFamily: 'inherit' }}>
              Edit section
            </button>
            <button style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, border: 'none', background: '#141c26', color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
              Share ↗
            </button>
          </div>
        </div>

        {/* SECTION CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sectionRenderers[curSection]()}
        </div>

        {/* EDIT PANEL (slide-in) */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, background: 'white', borderLeft: '1px solid #dde2ea', display: 'flex', flexDirection: 'column', transform: editOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.24s ease', zIndex: 55, boxShadow: '-6px 0 24px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '15px 18px', borderBottom: '1px solid #dde2ea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#0d1117' }}>Edit: {SECTION_LABELS[curSection]}</span>
            <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7a8d', lineHeight: 1 }}>×</button>
          </div>

          {editLoading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 }}>
              <div style={{ width: 28, height: 28, border: '2px solid #dde2ea', borderTopColor: '#141c26', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
              <div style={{ fontSize: 12, color: '#6b7a8d', textAlign: 'center', lineHeight: 1.6 }}>Reading your reference and updating the section...</div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7a8d', marginBottom: 5 }}>What would you like to change?</div>
                  <textarea
                    value={editInstruction}
                    onChange={e => setEditInstruction(e.target.value)}
                    placeholder={EP_HINTS[curSection]}
                    style={{ width: '100%', height: 96, padding: '10px 12px', border: '1px solid #dde2ea', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: '#0d1117', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7a8d', marginBottom: 5 }}>Reference image (optional)</div>
                  <div
                    onClick={() => editFileRef.current?.click()}
                    style={{ border: '1.5px dashed #dde2ea', borderRadius: 8, padding: 18, textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 12, color: '#6b7a8d' }}>Drop screenshot or design reference</div>
                    <div style={{ fontSize: 11, color: '#3a6ea5', marginTop: 3 }}>browse files — PNG, JPG</div>
                  </div>
                  <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleEditImg(e.target.files)} />
                  {editImg && (
                    <div style={{ marginTop: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editImg.preview} alt="" style={{ width: '100%', borderRadius: 6, border: '1px solid #dde2ea' }} />
                      <span onClick={() => setEditImg(null)} style={{ fontSize: 10, color: '#dc2626', cursor: 'pointer', marginTop: 4, display: 'inline-block' }}>Remove ×</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: '14px 18px', borderTop: '1px solid #dde2ea', display: 'flex', gap: 8 }}>
                <button onClick={() => setEditOpen(false)} style={{ flex: 1, padding: 9, border: '1px solid #dde2ea', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={applyEdit} style={{ flex: 2, padding: 9, border: 'none', borderRadius: 6, background: '#141c26', color: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Apply with AI →</button>
              </div>
            </>
          )}
        </div>

        {/* GUIDELINE UPLOAD MODAL */}
        {modalOpen && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: 12, width: 460, maxHeight: '80%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #dde2ea', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0d1117' }}>Upload brand guideline</span>
                <button onClick={() => { setModalOpen(false); setGuidelineImgs([]) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7a8d' }}>×</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  onClick={() => modalFileRef.current?.click()}
                  style={{ border: '2px dashed #dde2ea', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  <div style={{ fontSize: 13, color: '#0d1117', marginBottom: 4 }}>Upload screenshots of your brand guideline</div>
                  <div style={{ fontSize: 11, color: '#6b7a8d' }}>PNG, JPG — upload multiple pages. Claude reads them all.</div>
                </div>
                <input ref={modalFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleGuidelineImgs(e.target.files)} />

                {guidelineImgs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {guidelineImgs.map((img, i) => (
                      <div key={i} style={{ width: 76, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid #dde2ea', position: 'relative', flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => setGuidelineImgs(prev => prev.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 11, color: '#6b7a8d', lineHeight: 1.6, background: '#f7f6f4', padding: '10px 14px', borderRadius: 6 }}>
                  Claude reads all uploaded pages and extracts colors, typography, logo rules and image style automatically. You can edit any section afterwards.
                </div>
              </div>

              <div style={{ padding: '14px 22px', borderTop: '1px solid #dde2ea', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                {extractLoading && <div style={{ fontSize: 12, color: '#6b7a8d' }}>Reading guideline...</div>}
                <button onClick={() => { setModalOpen(false); setGuidelineImgs([]) }} style={{ padding: '8px 14px', border: '1px solid #dde2ea', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Cancel</button>
                <button
                  onClick={extractGuideline}
                  disabled={guidelineImgs.length === 0 || extractLoading}
                  style={{ padding: '8px 18px', border: 'none', borderRadius: 6, background: '#141c26', color: 'white', cursor: guidelineImgs.length === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'inherit', opacity: guidelineImgs.length === 0 ? 0.5 : 1 }}
                >
                  {extractLoading ? 'Extracting...' : 'Extract brand data'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT FAB */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{ position: 'absolute', bottom: 18, right: 18, width: 42, height: 42, borderRadius: '50%', background: '#141c26', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1C4.6 1 1 4.1 1 8c0 1.8.7 3.4 1.9 4.6L2 16l3.6-1.2C6.7 15.6 7.8 16 9 16c4.4 0 8-3.1 8-7s-3.6-8-8-8z" fill="white" />
          </svg>
        </button>

        {/* CHAT WINDOW */}
        {chatOpen && (
          <div style={{ position: 'absolute', bottom: 68, right: 18, width: 282, background: 'white', border: '1px solid #dde2ea', borderRadius: 12, boxShadow: '0 6px 28px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', zIndex: 60, overflow: 'hidden', maxHeight: 350 }}>
            <div style={{ padding: '11px 14px', background: '#141c26', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'white', flex: 1 }}>Brand AI</span>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ maxWidth: '90%', fontSize: 12, lineHeight: 1.55, padding: '8px 10px', background: m.type === 'bot' ? '#f7f6f4' : '#141c26', color: m.type === 'bot' ? '#0d1117' : 'white', alignSelf: m.type === 'bot' ? 'flex-start' : 'flex-end', borderRadius: m.type === 'bot' ? '10px 10px 10px 2px' : '10px 10px 2px 10px' }}>
                  {m.text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '9px 10px', borderTop: '1px solid #dde2ea' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask the brand..."
                style={{ flex: 1, fontSize: 11, padding: '6px 9px', border: '1px solid #dde2ea', borderRadius: 6, outline: 'none', fontFamily: 'inherit', color: '#0d1117' }}
              />
              <button onClick={sendChat} style={{ padding: '6px 10px', background: '#141c26', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>↑</button>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toastVisible && (
          <div style={{ position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)', background: '#141c26', color: 'white', fontSize: 11, padding: '7px 16px', borderRadius: 20, zIndex: 95, whiteSpace: 'nowrap' }}>
            {toast}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
