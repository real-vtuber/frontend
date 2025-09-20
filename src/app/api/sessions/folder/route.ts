import { NextRequest, NextResponse } from 'next/server'
import { 
  createSessionFolder, 
  sessionFolderExists, 
  getSessionFolderPath,
  cleanupSessionFolder,
  listSessionFiles
} from '../../../../lib/serverSessionUtils'

/**
 * Session Folder Management API
 * Handles server-side folder operations for sessions
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, action } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    if (action === 'create') {
      // Create session folder
      const folderPath = await createSessionFolder(sessionId)
      
      return NextResponse.json({
        success: true,
        path: folderPath,
        message: `Session folder created for ${sessionId}`
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "create" for POST requests' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Session folder creation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session folder' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action')
    const subFolder = searchParams.get('subFolder') as 'uploads' | 'processed' | null

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    if (action === 'check') {
      // Check if session folder exists
      const exists = await sessionFolderExists(sessionId)
      const path = exists ? getSessionFolderPath(sessionId) : null
      
      return NextResponse.json({
        exists,
        path,
        sessionId
      })
    }

    if (action === 'list') {
      // List files in session folder
      const files = await listSessionFiles(sessionId, subFolder || undefined)
      
      return NextResponse.json({
        files,
        sessionId,
        subFolder: subFolder || 'root'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "check" or "list" for GET requests' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Session folder query error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query session folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Clean up session folder
    await cleanupSessionFolder(sessionId)
    
    return NextResponse.json({
      success: true,
      message: `Session folder cleaned up for ${sessionId}`
    })

  } catch (error) {
    console.error('Session folder cleanup error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup session folder' 
      },
      { status: 500 }
    )
  }
} 