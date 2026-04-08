import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alzqwhkkntfritasizzx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const file = formData.get('file') as File | null
    const brandId = formData.get('brandId') as string
    const uploadType = formData.get('uploadType') as string
    const pageNumber = formData.get('pageNumber') as string | null

    if (!file || !brandId || !uploadType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${brandId}/brand-book/${uploadType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    const isPdf = ext === 'pdf' || file.type === 'application/pdf'

    if (uploadType === 'page') {
      const row: Record<string, unknown> = {
        brand_id: brandId,
        page_number: pageNumber ? parseInt(pageNumber) : 999,
        file_url: publicUrl,
        file_name: file.name,
      }
      // Add file_type if column exists (won't fail if it doesn't)
      if (isPdf) row.file_type = 'pdf'

      const { data, error } = await supabase
        .from('brand_book_pages')
        .insert(row)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data.id, url: publicUrl, isPdf })
    } else if (uploadType === 'package') {
      // Package upload — just return the URL, no DB insert
      return NextResponse.json({ success: true, url: publicUrl })
    } else {
      const { data, error } = await supabase
        .from('brand_book_assets')
        .insert({
          brand_id: brandId,
          category: uploadType,
          file_url: publicUrl,
          file_name: file.name,
        })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data.id, url: publicUrl })
    }
  } catch (err) {
    console.error('[brand-book/upload POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
