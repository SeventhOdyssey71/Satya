import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    // Get the target URL from query parameters
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('target')
    
    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target parameter' }, { status: 400 })
    }

    // Get the request body
    const body = await request.arrayBuffer()
    
    // Get headers to forward
    const headers = new Headers()
    const contentType = request.headers.get('content-type')
    if (contentType) {
      headers.set('Content-Type', contentType)
    }

    // Make the proxied request to Walrus
    const response = await fetch(decodeURIComponent(targetUrl), {
      method: 'PUT',
      headers,
      body,
    })

    // Get response data
    const responseData = await response.arrayBuffer()
    
    // Forward the response
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Walrus proxy upload error:', error)
    return NextResponse.json(
      { error: 'Proxy upload failed', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}