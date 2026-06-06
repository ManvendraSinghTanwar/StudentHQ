import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const subscription = body.subscription

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription provided' },
        { status: 400 }
      )
    }

    // In production, save subscription to database
    console.log('Push subscription received:', subscription)

    return NextResponse.json({
      success: true,
      message: 'Subscription successful',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Subscription failed' },
      { status: 500 }
    )
  }
}
