import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function createRequestClient() {
  return await createClient()
}

export async function resolveStudentId(
  request: NextRequest,
  supabase: SupabaseClient,
  candidateStudentId?: string | null,
) {
  const studentId =
    candidateStudentId ?? request.nextUrl.searchParams.get('studentId') ?? request.headers.get('x-student-id')

  if (studentId) {
    return studentId
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}