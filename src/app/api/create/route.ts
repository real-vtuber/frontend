// app/api/avatar/create/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, script } = await request.json();
    
    if (!sessionId || !script) {
      return NextResponse.json(
        { error: 'Session ID and script are required' },
        { status: 400 }
      );
    }

    // D-ID API call based on documentation
    const response = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${process.env.DID_CLIENT_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: 'https://example.com/avatar-image.jpg', // Use default avatar
        script: {
          type: 'text',
          input: script
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`D-ID API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ 
      video_url: data.result_url,
      talk_id: data.id 
    });

  } catch (error) {
    console.error('D-ID Avatar creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create avatar' },
      { status: 500 }
    );
  }
}