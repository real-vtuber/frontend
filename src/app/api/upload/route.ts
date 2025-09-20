import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request to your AWS Lambda function
    const response = await fetch(
      "https://ksxnox430i.execute-api.ap-southeast-1.amazonaws.com/real_vtuber/upload",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Lambda request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Failed to get upload URL" },
      { status: 500 }
    );
  }
}