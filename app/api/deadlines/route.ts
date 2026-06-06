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
      .from('deadlines')
      .select('*')
      .eq('user_id', studentId)
      .order('due_date', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, deadlines: data ?? [] })
  } catch (error) {
    console.error('Failed to fetch deadlines:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deadlines' },
      { status: 500 },
    )
  }
}