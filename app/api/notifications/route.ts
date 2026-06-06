import { NextRequest, NextResponse } from 'next/server'

import { createRequestClient, resolveStudentId } from '@/lib/supabase/request'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRequestClient()
    const studentId = await resolveStudentId(request, supabase)

    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRequestClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: body.title,
        message: body.message,
        type: body.type,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      notification,
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
