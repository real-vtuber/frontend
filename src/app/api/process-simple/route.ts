import { NextRequest, NextResponse } from 'next/server'
import { getSessionFolderPath } from '../../../lib/serverSessionUtils'
import { processSessionFiles, processFile, listProcessedDocuments } from '../../../lib/simpleFileProcessor'
import path from 'path'

/**
 * Simple File Processing API (without Pinecone)
 * For testing the basic parsing and chunking functionality
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, fileName, action = 'process_all' } = body

    console.log('Processing request:', { sessionId, fileName, action })

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get session folder paths
    const sessionFolderPath = getSessionFolderPath(sessionId)
    const uploadsPath = path.join(sessionFolderPath, 'uploads')
    const processedPath = path.join(sessionFolderPath, 'processed')

    console.log(`Processing files for session: ${sessionId}`)
    console.log(`Uploads path: ${uploadsPath}`)
    console.log(`Processed path: ${processedPath}`)

    let processedDocs

    if (action === 'process_single' && fileName) {
      // Process single file
      processedDocs = [await processFile(sessionId, fileName, uploadsPath, processedPath)]
    } else {
      // Process all files in uploads folder
      processedDocs = await processSessionFiles(sessionId, uploadsPath, processedPath)
    }

    if (processedDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files to process',
        processedFiles: 0,
        processedChunks: 0
      })
    }

    const totalChunks = processedDocs.reduce((sum, doc) => sum + doc.totalChunks, 0)

    console.log(`✅ Successfully processed ${processedDocs.length} files and created ${totalChunks} chunks`)

    return NextResponse.json({
      success: true,
      message: 'Files processed successfully (without embedding)',
      processedFiles: processedDocs.length,
      processedChunks: totalChunks,
      documents: processedDocs.map(doc => ({
        fileName: doc.fileName,
        fileType: doc.fileType,
        totalChunks: doc.totalChunks,
        processedAt: doc.processedAt
      }))
    })

  } catch (error) {
    console.error('Simple file processing error:', error)
    
    // Ensure we always return JSON even for critical errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process files',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action') || 'list'

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const sessionFolderPath = getSessionFolderPath(sessionId)
    const processedPath = path.join(sessionFolderPath, 'processed')

    if (action === 'list') {
      // List all processed documents
      const documents = await listProcessedDocuments(processedPath)

      return NextResponse.json({
        success: true,
        sessionId,
        documents: documents.map(doc => ({
          fileName: doc.fileName,
          fileType: doc.fileType,
          totalChunks: doc.totalChunks,
          originalSize: doc.originalSize,
          processedAt: doc.processedAt
        }))
      })
    }

    if (action === 'status') {
      // Get processing status
      const processedDocs = await listProcessedDocuments(processedPath)
      
      return NextResponse.json({
        success: true,
        sessionId,
        totalProcessed: processedDocs.length,
        totalChunks: processedDocs.reduce((sum, doc) => sum + doc.totalChunks, 0),
        lastProcessed: processedDocs.length > 0 
          ? Math.max(...processedDocs.map(doc => new Date(doc.processedAt).getTime()))
          : null
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "list" or "status"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Get simple processing info error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get processing information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 