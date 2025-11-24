import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the target URL from query parameters
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('target')
    
    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target parameter' }, { status: 400 })
    }

    // Make the proxied request to Walrus
    const response = await fetch(decodeURIComponent(targetUrl), {
      method: 'GET',
    })

    // Get response data
    const responseData = await response.arrayBuffer()
    
    // Forward the response
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Walrus proxy download error:', error)
    return NextResponse.json(
      { error: 'Proxy download failed', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}