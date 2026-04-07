import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const file = formData.get('file') as File
  const brandId = formData.get('brandId') as string
  const uploadType = formData.get('uploadType') as string
  const pageNumber = formData.get('pageNumber') as string | null

  if (!file || !brandId || !uploadType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const fileName = `${brandId}/brand-book/${uploadType}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('brand-assets')
    .upload(fileName, file, { upsert: false, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('brand-assets')
    .getPublicUrl(fileName)

  const publicUrl = urlData.publicUrl

  if (uploadType === 'page') {
    const { data, error } = await supabase
      .from('brand_book_pages')
      .insert({
        brand_id: brandId,
        page_number: pageNumber ? parseInt(pageNumber) : 999,
        file_url: publicUrl,
        file_name: file.name,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id, url: publicUrl })
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
}
