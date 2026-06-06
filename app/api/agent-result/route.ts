import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

type AgentResultPayload = {
  studentId?: string
  userId?: string
  uploadId?: string | null
  resultType?: string
  resultData?: unknown
  agentType?: string
  status?: string
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.STUDENTHQ_SECRET
    const providedSecret = request.headers.get('x-studenthq-secret')

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'Server secret is not configured' },
        { status: 500 },
      )
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase service role key is not configured' },
        { status: 503 },
      )
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const payload = (await request.json()) as AgentResultPayload
    const studentId = payload.studentId ?? payload.userId

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 },
      )
    }

    const resultData = payload.resultData ?? payload
    const resultType = payload.resultType ?? 'general'
    const agentType = payload.agentType ?? 'n8n'

    const { data, error } = await supabase
      .from('processing_results')
      .insert({
        user_id: studentId,
        upload_id: payload.uploadId ?? null,
        result_type: resultType,
        result_data: resultData,
        agent_type: agentType,
        status: payload.status ?? 'completed',
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, result: data })
  } catch (error) {
    console.error('Failed to store agent result:', error)
    return NextResponse.json(
      { error: 'Failed to store agent result' },
      { status: 500 },
    )
  }
}