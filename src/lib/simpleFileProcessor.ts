import { promises as fs } from 'fs'
import path from 'path'

/**
 * Simple file processing service for testing
 * Supports text files only initially
 */

export interface DocumentChunk {
  id: string
  content: string
  metadata: {
    fileName: string
    fileType: string
    chunkIndex: number
    totalChunks: number
    sessionId: string
    sourceFile: string
    wordCount: number
    createdAt: string
  }
}

export interface ProcessedDocument {
  fileName: string
  fileType: string
  originalSize: number
  chunks: DocumentChunk[]
  totalChunks: number
  processedAt: string
  sessionId: string
}

/**
 * Parse text file
 */
async function parseTextFile(filePath: string): Promise<{ text: string }> {
  try {
    const text = await fs.readFile(filePath, 'utf-8')
    return { text }
  } catch (error) {
    console.error('Failed to parse text file:', error)
    throw new Error(`Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse file based on its type (simple version)
 */
async function parseFile(filePath: string, fileType: string): Promise<{ text: string; pages?: number }> {
  const extension = path.extname(filePath).toLowerCase()
  
  switch (extension) {
    case '.txt':
    case '.md':
    case '.csv':
      return await parseTextFile(filePath)
    case '.pdf':
      // For now, return a placeholder for PDF files
      return { 
        text: `[PDF file: ${path.basename(filePath)} - PDF processing temporarily disabled for testing]`,
        pages: 1
      }
    default:
      // Try to parse as text for other formats
      try {
        return await parseTextFile(filePath)
      } catch {
        throw new Error(`Unsupported file type: ${extension}`)
      }
  }
}

/**
 * Split text into chunks with overlap
 */
function chunkText(
  text: string, 
  chunkSize: number = 1000, 
  overlap: number = 200
): string[] {
  if (text.length <= chunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length)
    
    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastSentence = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('\n', end)
      const breakPoint = Math.max(lastSentence, lastNewline)
      
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1
      }
    }
    
    const chunk = text.slice(start, end).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    
    start = Math.max(end - overlap, start + 1)
  }

  return chunks
}

/**
 * Process a single file: parse, chunk, and prepare for embedding
 */
export async function processFile(
  sessionId: string,
  fileName: string,
  uploadsPath: string,
  processedPath: string
): Promise<ProcessedDocument> {
  try {
    const filePath = path.join(uploadsPath, fileName)
    const fileStats = await fs.stat(filePath)
    const fileType = path.extname(fileName).toLowerCase()

    console.log(`Processing file: ${fileName}`)

    // Parse the file
    const { text, pages } = await parseFile(filePath, fileType)

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in file')
    }

    // Chunk the text
    const textChunks = chunkText(text, 1000, 200)
    
    // Create document chunks with metadata
    const chunks: DocumentChunk[] = textChunks.map((content, index) => ({
      id: `${sessionId}_${fileName}_chunk_${index}`,
      content: content.trim(),
      metadata: {
        fileName,
        fileType,
        chunkIndex: index,
        totalChunks: textChunks.length,
        sessionId,
        sourceFile: fileName,
        wordCount: content.trim().split(/\s+/).length,
        createdAt: new Date().toISOString()
      }
    }))

    // Create processed document
    const processedDoc: ProcessedDocument = {
      fileName,
      fileType,
      originalSize: fileStats.size,
      chunks,
      totalChunks: chunks.length,
      processedAt: new Date().toISOString(),
      sessionId
    }

    // Save processed document metadata
    const processedFilePath = path.join(processedPath, `${fileName}.json`)
    await fs.writeFile(processedFilePath, JSON.stringify(processedDoc, null, 2))

    // Save individual chunks
    const chunksDir = path.join(processedPath, 'chunks')
    await fs.mkdir(chunksDir, { recursive: true })
    
    for (const chunk of chunks) {
      const chunkFilePath = path.join(chunksDir, `${chunk.id}.json`)
      await fs.writeFile(chunkFilePath, JSON.stringify(chunk, null, 2))
    }

    console.log(`✅ Processed ${fileName}: ${chunks.length} chunks created`)
    return processedDoc

  } catch (error) {
    console.error(`Failed to process file ${fileName}:`, error)
    throw error
  }
}

/**
 * Process all files in a session's uploads folder
 */
export async function processSessionFiles(
  sessionId: string,
  uploadsPath: string,
  processedPath: string
): Promise<ProcessedDocument[]> {
  try {
    // Ensure processed directory exists
    await fs.mkdir(processedPath, { recursive: true })

    // Get all files in uploads folder
    const files = await fs.readdir(uploadsPath)
    const processedDocs: ProcessedDocument[] = []

    console.log(`Found ${files.length} files to process in ${uploadsPath}`)

    for (const fileName of files) {
      try {
        const processedDoc = await processFile(sessionId, fileName, uploadsPath, processedPath)
        processedDocs.push(processedDoc)
      } catch (error) {
        console.error(`Failed to process ${fileName}:`, error)
        // Continue with other files
      }
    }

    console.log(`✅ Processed ${processedDocs.length} files for session ${sessionId}`)
    return processedDocs

  } catch (error) {
    console.error(`Failed to process session files:`, error)
    throw error
  }
}

/**
 * List all processed documents in a session
 */
export async function listProcessedDocuments(
  processedPath: string
): Promise<ProcessedDocument[]> {
  try {
    const files = await fs.readdir(processedPath)
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('chunks'))
    
    const documents: ProcessedDocument[] = []
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(processedPath, file)
        const data = await fs.readFile(filePath, 'utf-8')
        documents.push(JSON.parse(data))
      } catch (error) {
        console.error(`Failed to load processed document ${file}:`, error)
      }
    }
    
    return documents
  } catch {
    return []
  }
} 