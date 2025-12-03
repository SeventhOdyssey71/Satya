import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for TEE server evaluation
 * Bypasses CORS by making server-side request to production TEE server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to production TEE server
    const teeServerUrl = process.env.NEXT_PUBLIC_TEE_SERVER_URL || 'https://api.satyaprotocol.com';

    console.log(`\n===== TEE PROXY REQUEST =====`);
    console.log(`Target: ${teeServerUrl}/evaluate`);
    console.log(`Request body keys:`, Object.keys(body));
    console.log(`Model data size: ${body.model_data?.length || 0} chars`);
    console.log(`Dataset data size: ${body.dataset_data?.length || 0} chars`);

    const response = await fetch(`${teeServerUrl}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n===== TEE SERVER ERROR =====`);
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Response:`, errorText);
      console.error(`=============================\n`);
      return NextResponse.json(
        { error: `TEE server error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`\n===== TEE RESPONSE SUCCESS =====`);
    console.log(`Response keys:`, Object.keys(data));
    console.log(`=================================\n`);
    return NextResponse.json(data);

  } catch (error) {
    console.error(`\n===== PROXY ERROR =====`);
    console.error(`Error type:`, error?.constructor?.name);
    console.error(`Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`Stack:`, error instanceof Error ? error.stack : 'N/A');
    console.error(`========================\n`);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
