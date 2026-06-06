import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const agentType = formData.get('agentType') as string || 'router'

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Return mock result based on agent type
    const resultTypes = ['assignment', 'notes', 'receipt', 'job', 'menu']
    const randomType = resultTypes[Math.floor(Math.random() * resultTypes.length)]

    const mockResults: Record<string, any> = {
      assignment: {
        type: 'assignment',
        title: 'Assignment Analysis',
        deadline: '2 days',
        studyPlan: ['Review content', 'Practice problems', 'Mock test'],
      },
      notes: {
        type: 'notes',
        title: 'Study Notes Summary',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
      },
      receipt: {
        type: 'receipt',
        merchant: 'Local Store',
        amount: '$25.50',
        category: 'Books',
      },
      job: {
        type: 'job',
        position: 'Software Engineer Intern',
        company: 'Tech Corp',
        matchPercentage: 85,
      },
      menu: {
        type: 'menu',
        meal: 'Tandoori Chicken',
        calories: 450,
      },
    }

    const result = mockResults[randomType]

    // Store result in database
    const { data: storedResult, error: dbError } = await supabase
      .from('processing_results')
      .insert({
        user_id: user.id,
        result_type: result.type,
        result_data: result,
        agent_type: agentType,
        status: 'completed',
      })
      .select()

    if (dbError) {
      console.error('Database error:', dbError)
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
