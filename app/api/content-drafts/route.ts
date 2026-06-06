import { NextRequest, NextResponse } from 'next/server'

import { createRequestClient, resolveStudentId } from '@/lib/supabase/request'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient()
    const studentId = await resolveStudentId(request, supabase)

    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, contentDrafts: data ?? [] })
  } catch (error) {
    console.error('Failed to fetch content drafts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content drafts' },
      { status: 500 },
    )
  }
}