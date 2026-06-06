import { NextRequest, NextResponse } from 'next/server'

type ContentIntent = 'assignment' | 'notes' | 'receipt' | 'job_post' | 'event' | 'mess_menu' | 'general'

const recommendedAgentMap: Record<ContentIntent, string[]> = {
  assignment: ['study', 'schedule'],
  notes: ['study', 'schedule'],
  receipt: ['expense'],
  job_post: ['schedule'],
  event: ['schedule'],
  mess_menu: ['health'],
  general: ['content'],
}

/**
 * Simple keyword-based router for cloud fallback
 * When WebLLM is unavailable, this provides fast classification
 */
function classifyByKeywords(content: string): ContentIntent {
  const lowerContent = content.toLowerCase()

  // Assignment keywords
  if (
    lowerContent.includes('assignment') ||
    lowerContent.includes('due date') ||
    lowerContent.includes('submit') ||
    lowerContent.includes('homework') ||
    lowerContent.includes('exam') ||
    lowerContent.includes('quiz')
  ) {
    return 'assignment'
  }

  // Notes keywords
  if (
    lowerContent.includes('notes') ||
    lowerContent.includes('lecture') ||
    lowerContent.includes('chapter') ||
    lowerContent.includes('definition') ||
    lowerContent.includes('summary')
  ) {
    return 'notes'
  }

  // Receipt keywords
  if (
    lowerContent.includes('receipt') ||
    lowerContent.includes('invoice') ||
    lowerContent.includes('total') ||
    lowerContent.includes('amount') ||
    lowerContent.includes('rupees') ||
    lowerContent.includes('$') ||
    lowerContent.includes('price')
  ) {
    return 'receipt'
  }

  // Job post keywords
  if (
    lowerContent.includes('job') ||
    lowerContent.includes('hiring') ||
    lowerContent.includes('position') ||
    lowerContent.includes('salary') ||
    lowerContent.includes('internship') ||
    lowerContent.includes('apply')
  ) {
    return 'job_post'
  }

  // Event keywords
  if (
    lowerContent.includes('event') ||
    lowerContent.includes('meeting') ||
    lowerContent.includes('schedule') ||
    lowerContent.includes('time') ||
    lowerContent.includes('date') ||
    lowerContent.includes('venue')
  ) {
    return 'event'
  }

  // Menu keywords
  if (
    lowerContent.includes('menu') ||
    lowerContent.includes('food') ||
    lowerContent.includes('meal') ||
    lowerContent.includes('recipe') ||
    lowerContent.includes('calories') ||
    lowerContent.includes('dish')
  ) {
    return 'mess_menu'
  }

  return 'general'
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const intent = classifyByKeywords(content)
    const confidence = 0.6 // Lower confidence for keyword-based classification

    return NextResponse.json({
      intent,
      confidence,
      recommendedAgents: recommendedAgentMap[intent],
    })
  } catch (error) {
    console.error('Router error:', error)
    return NextResponse.json(
      { error: 'Router failed' },
      { status: 500 }
    )
  }
}
