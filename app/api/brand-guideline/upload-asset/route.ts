import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function detectLogoType(base64: string, mediaType: string): Promise<{ logoType: string; description: string }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', data: base64 },
            },
            {
              type: 'text',
              text: 'Analyze this logo image. Return ONLY a JSON object with two fields: "logoType" (one of: "wordmark", "lettermark", "logomark", "combination mark", "emblem") and "description" (one sentence describing the logo style). No markdown, no explanation.',
            },
          ],
        },
      ],
    })
    const text = response.content.filter(c => c.type === 'text').map(c => (c as Anthropic.TextBlock).text).join('')
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
    return JSON.parse(clean)
  } catch {
    return { logoType: 'combination mark', description: 'Brand logo' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const brandId = formData.get('brandId') as string
    const category = (formData.get('category') as string) || 'logo'
    const title = (formData.get('title') as string) || ''

    if (!file || !brandId) {
      return NextResponse.json({ success: false, error: 'Missing file or brandId' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${brandId}/${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    let meta: Record<string, string> = {}
    if (category === 'logo') {
      const base64 = buffer.toString('base64')
      const detected = await detectLogoType(base64, file.type)
      meta = detected
    }

    const { data: imageRow, error: dbError } = await supabase
      .from('brand_images')
      .insert({
        brand_id: brandId,
        url: publicUrl,
        storage_path: fileName,
        category,
        title: title || file.name,
        meta,
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, image: imageRow })
  } catch (err) {
    console.error('[upload-asset]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
