import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { serviceClient as supabase } from "@/lib/supabase-admin";
import { resolveBrand } from "@/lib/api-auth";
import { meter, BudgetRefused, requestLocale, type MeterOptions } from "@/lib/metering";
import { estimateCents, anthropicCostCents, promptChars } from "@/lib/usage-cost";

export const maxDuration = 60

// maxRetries: 0 — meter() owns the one retry (hq-accounts.md criterion 7).
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 })

// Haiku, not Sonnet: naming a logo's type is a five-way label. Compared on
// 2026-09-25 against the six logos in brand_logos, Haiku 4.5 gave the same
// answer as Sonnet 5 every time, at a fifth to a third of the cost. The two
// other simple jobs tried — palette hex codes and catalogue parsing — stay on
// Sonnet: Haiku misread hex values and dropped sizes from product names.
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 200

const FALLBACK = { logoType: 'combination mark', description: 'Brand logo' }

/**
 * Metered like every paid call. A refusal skips the analysis and keeps the
 * upload: storing a logo costs no model call, and the fallback is what a
 * failed analysis already returned.
 */
async function detectLogoType(
  base64: string,
  mediaType: string,
  metering: Pick<MeterOptions, 'brandId' | 'userId' | 'locale'>,
): Promise<{ logoType: string; description: string }> {
  try {
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: MODEL,
      // Sonnet 5 runs adaptive thinking when `thinking` is omitted, and
      // max_tokens caps thinking + text together — these calls would
      // truncate. None of them need reasoning tokens.
      thinking: { type: 'disabled' },
      max_tokens: MAX_TOKENS,
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
              text: 'Analyze this logo. Return ONLY JSON: {"logoType":"wordmark|lettermark|logomark|combination mark|emblem","description":"one sentence"}. No markdown.',
            },
          ],
        },
      ],
    }
    const response = await meter(
      {
        route: 'brand-guideline/upload-asset',
        ...metering,
        estimateCents: estimateCents({ model: MODEL, inputChars: promptChars(params.messages), images: 1, maxOutputTokens: MAX_TOKENS }),
      },
      async () => {
        const m = await anthropic.messages.create(params)
        return {
          value: m,
          model: MODEL,
          costCents: anthropicCostCents(MODEL, m.usage),
          inputTokens: m.usage.input_tokens,
          outputTokens: m.usage.output_tokens,
        }
      },
    )
    const text = response.content.filter(c => c.type === 'text').map(c => (c as Anthropic.TextBlock).text).join('')
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    if (err instanceof BudgetRefused) console.warn('[upload-asset] logo analysis skipped:', err.message)
    return FALLBACK
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const auth = await resolveBrand(req, formData.get('brandId') as string | null)
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
    const brandId = auth.brandId
    const category = (formData.get('category') as string) || 'logo'
    const imageType = (formData.get('imageType') as string) || ''
    const analyze = formData.get('analyze') === 'true'

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

    let analysis: Record<string, string> = {}
    if (category === 'logo' && analyze) {
      analysis = await detectLogoType(buffer.toString('base64'), file.type, {
        brandId,
        userId: auth.userId,
        locale: requestLocale(req),
      })
    }

    const meta: Record<string, string> = { ...analysis }
    if (imageType) meta.slot = imageType

    const { data: imageRow, error: dbError } = await supabase
      .from('brand_images')
      .insert({
        brand_id: brandId,
        url: publicUrl,
        storage_path: fileName,
        category,
        title: file.name,
        meta,
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id: imageRow.id,
      url: publicUrl,
      analysis: analysis as { logoType?: string; description?: string },
    })
  } catch (err) {
    console.error('[upload-asset POST]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, brandId: requested } = await req.json() as { id: string | number; brandId: string }
    const auth = await resolveBrand(req, requested)
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })
    const brandId = auth.brandId
    if (!id || !brandId) return NextResponse.json({ success: false, error: 'Missing id or brandId' }, { status: 400 })

    const { data: row } = await supabase
      .from('brand_images')
      .select('storage_path')
      .eq('id', id)
      .eq('brand_id', brandId)
      .single()

    if (row?.storage_path) {
      await supabase.storage.from('brand-assets').remove([row.storage_path])
    }

    await supabase.from('brand_images').delete().eq('id', id).eq('brand_id', brandId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[upload-asset DELETE]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
