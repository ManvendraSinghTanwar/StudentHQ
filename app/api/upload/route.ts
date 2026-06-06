import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Simulate file upload
    const buffer = await file.arrayBuffer()
    const fileName = file.name
    const fileSize = buffer.byteLength

    console.log(`File uploaded: ${fileName} (${fileSize} bytes)`)

    // Return mock upload response
    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        size: fileSize,
        url: `/uploads/${fileName}`,
        uploadedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
