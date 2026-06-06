import { NextRequest, NextResponse } from 'next/server'

import { createRequestClient, resolveStudentId } from '@/lib/supabase/request'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createRequestClient()
    const studentId = await resolveStudentId(request, supabase, body.studentId)

    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = {
      ...body,
      user_id: studentId,
    }

    delete updates.studentId

    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', studentId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 },
    )
  }
}