import { NextRequest, NextResponse } from 'next/server'

function buildIngestUrl() {
  const explicitUrl = process.env.N8N_INGEST_URL
  if (explicitUrl) {
    return explicitUrl
  }

  const baseUrl = process.env.N8N_BASE_URL
  if (!baseUrl) {
    return null
  }

  return new URL('/studenthq/ingest', baseUrl).toString()
}

export async function POST(request: NextRequest) {
  try {
    const ingestUrl = buildIngestUrl()

    if (!ingestUrl) {
      return NextResponse.json(
        { error: 'N8N ingest URL is not configured' },
        { status: 503 },
      )
    }

    const body = await request.json()

    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get('content-type') ?? ''
    const data = contentType.includes('application/json') ? await response.json() : await response.text()

    return NextResponse.json(
      {
        success: response.ok,
        forwardedTo: ingestUrl,
        data,
      },
      { status: response.status },
    )
  } catch (error) {
    console.error('Failed to forward ingest payload:', error)
    return NextResponse.json(
      { error: 'Failed to forward ingest payload' },
      { status: 500 },
    )
  }
}