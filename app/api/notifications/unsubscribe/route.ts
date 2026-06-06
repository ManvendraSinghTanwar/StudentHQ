import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const subscriptionEndpoint = body.endpoint

    if (!subscriptionEndpoint) {
      return NextResponse.json(
        { error: 'No subscription endpoint provided' },
        { status: 400 }
      )
    }

    // In production, delete subscription from database
    console.log('Push unsubscription:', subscriptionEndpoint)

    return NextResponse.json({
      success: true,
      message: 'Unsubscription successful',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Unsubscription failed' },
      { status: 500 }
    )
  }
}
