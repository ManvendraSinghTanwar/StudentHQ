import { NextRequest, NextResponse } from 'next/server'
import { mockDashboardData } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    // Simulate fetching dashboard data
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      data: mockDashboardData,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
