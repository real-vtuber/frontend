/**
 * Isolated PDF parser module
 * This module handles PDF parsing separately to avoid module loading conflicts
 */
import { promises as fs } from 'fs'

/**
 * Parse PDF file and extract text content
 * @param filePath Path to the PDF file
 * @returns Promise with extracted text and page count
 */
export async function parsePDFFile(filePath: string): Promise<{ text: string; pages?: number }> {
  try {
    console.log('🔍 Attempting to parse PDF:', filePath)
    
    // Read the PDF file as buffer
    const dataBuffer = await fs.readFile(filePath)
    console.log('📖 PDF file read successfully, size:', dataBuffer.length, 'bytes')
    
    // Dynamic import with proper error handling
    let pdfParse: any
    try {
      // Try to import pdf-parse
      const module = await import('pdf-parse')
      pdfParse = module.default || module
      console.log('✅ PDF-parse module loaded successfully')
    } catch (importError) {
      console.error('❌ Failed to import pdf-parse:', importError)
      
      // Fallback: Try require approach
      try {
        pdfParse = eval('require')('pdf-parse')
        console.log('✅ PDF-parse loaded via require fallback')
      } catch (requireError) {
        console.error('❌ Failed to require pdf-parse:', requireError)
        throw new Error('PDF parsing library is not available')
      }
    }
    
    // Parse the PDF
    console.log('🔄 Parsing PDF content...')
    const pdfData = await pdfParse(dataBuffer, {
      // Add options to improve parsing
      max: 0, // Parse all pages
      version: 'v1.10.100' // Specify version if needed
    })
    
    console.log('✅ PDF parsed successfully:')
    console.log('  - Pages:', pdfData.numpages)
    console.log('  - Text length:', pdfData.text?.length || 0)
    console.log('  - First 200 chars:', pdfData.text?.substring(0, 200) || 'No text extracted')
    
    return {
      text: pdfData.text || '',
      pages: pdfData.numpages || 1
    }
    
  } catch (error) {
    console.error('❌ PDF parsing failed:', error)
    
    // Return meaningful error information
    const fileName = require('path').basename(filePath)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return {
      text: `[PDF Parsing Error: ${fileName}] - ${errorMessage}. The PDF file could not be processed. Please ensure the file is not corrupted and pdf-parse is properly installed.`,
      pages: 1
    }
  }
}

/**
 * Check if PDF parsing is available
 * @returns Promise<boolean>
 */
export async function isPDFParsingAvailable(): Promise<boolean> {
  try {
    const module = await import('pdf-parse')
    return !!(module.default || module)
  } catch {
    try {
      eval('require')('pdf-parse')
      return true
    } catch {
      return false
    }
  }
} 