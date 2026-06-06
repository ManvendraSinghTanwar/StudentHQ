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
      .from('health_logs')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, healthLogs: data ?? [] })
  } catch (error) {
    console.error('Failed to fetch health logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health logs' },
      { status: 500 },
    )
  }
}