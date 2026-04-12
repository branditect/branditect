import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alzqwhkkntfritasizzx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const file = formData.get('file') as File | null
    const brandId = formData.get('brandId') as string
    const uploadType = formData.get('uploadType') as string
    const extractColors = formData.get('extractColors') === 'true'

    if (!file || !brandId || !uploadType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${brandId}/brand-assets/${uploadType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, buffer, { upsert: true, contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    // Save logo to brand_logos table
    if (uploadType.startsWith('logo_')) {
      const slot = uploadType.replace('logo_', '')
      const { error } = await supabase.from('brand_logos').upsert(
        { brand_id: brandId, slot, file_url: publicUrl, file_name: file.name },
        { onConflict: 'brand_id,slot' }
      )
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      // If primary logo, also update brands.logo_url so sidebar/topbar show it
      if (slot === 'primary') {
        await supabase.from('brands').update({ logo_url: publicUrl }).eq('brand_id', brandId)
      }
      return NextResponse.json({ success: true, url: publicUrl })
    }

    // Extract colors from screenshot using Claude vision
    if (extractColors && uploadType === 'color_screenshot') {
      try {
        const base64 = buffer.toString('base64')
        const mime = file.type as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } },
              {
                type: 'text',
                text: `Look at this brand color palette image and extract all colors. Return ONLY a JSON array (no markdown):
[
  { "hex": "#hexcode", "name": "Color name" }
]
Extract every color swatch you can see with its exact hex code. If you see labels or hex codes written next to swatches, use those exactly.`
              }
            ]
          }]
        })

        const txt = response.content.map(c => c.type === 'text' ? c.text : '').join('')
        const clean = txt.replace(/```json|```/g, '').trim()
        const extractedColors = JSON.parse(clean)

        // Save colors to brand_book_colors
        for (const color of extractedColors) {
          await supabase.from('brand_book_colors').insert({
            brand_id: brandId, hex: color.hex, name: color.name
          })
        }

        return NextResponse.json({ success: true, url: publicUrl, colors: extractedColors })
      } catch {
        return NextResponse.json({ success: true, url: publicUrl, colors: [] })
      }
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('[brand-assets/upload POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { brandId, slot } = await req.json()

  const { error } = await supabase
    .from('brand_logos')
    .delete()
    .eq('brand_id', brandId)
    .eq('slot', slot)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
