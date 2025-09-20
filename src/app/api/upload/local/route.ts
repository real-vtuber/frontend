import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getSessionFolderPath } from '../../../../lib/serverSessionUtils'

/**
 * Local File Upload API
 * Saves uploaded files to session-specific temp folders
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sessionId = formData.get('sessionId') as string
    const subFolder = formData.get('subFolder') as string || 'uploads'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get session folder path
    const sessionFolderPath = getSessionFolderPath(sessionId)
    const uploadPath = path.join(sessionFolderPath, subFolder)
    
    // Ensure the upload directory exists
    await fs.mkdir(uploadPath, { recursive: true })

    // Create file path with original filename
    const fileName = file.name
    const filePath = path.join(uploadPath, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await fs.writeFile(filePath, buffer)

    console.log(`✅ File saved locally: ${filePath}`)

    return NextResponse.json({
      success: true,
      fileName,
      filePath: path.relative(process.cwd(), filePath),
      sessionId,
      subFolder,
      size: buffer.length,
      message: 'File saved successfully to local session folder'
    })

  } catch (error) {
    console.error('Local upload error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save file locally' 
      },
      { status: 500 }
    )
  }
} 