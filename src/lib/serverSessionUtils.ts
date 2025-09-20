import { promises as fs } from 'fs'
import path from 'path'

/**
 * Server-side session utility functions for folder management
 * These functions can only be used in server-side code (API routes, server components)
 */

/**
 * Create session folder in temp directory
 * @param sessionId - The session ID to create folder for
 * @param basePath - Base path for temp directory (defaults to frontend/temp)
 */
export async function createSessionFolder(
  sessionId: string, 
  basePath: string = path.join(process.cwd(), 'temp')
): Promise<string> {
  try {
    const sessionFolderPath = path.join(basePath, sessionId)
    
    // Create the temp directory if it doesn't exist
    await fs.mkdir(basePath, { recursive: true })
    
    // Create the session-specific folder
    await fs.mkdir(sessionFolderPath, { recursive: true })
    
    // Create initial subdirectories for organization
    await fs.mkdir(path.join(sessionFolderPath, 'uploads'), { recursive: true })
    await fs.mkdir(path.join(sessionFolderPath, 'processed'), { recursive: true })
    
    console.log(`Session folder created: ${sessionFolderPath}`)
    return sessionFolderPath
  } catch (error) {
    console.error(`Failed to create session folder for ${sessionId}:`, error)
    throw new Error(`Failed to create session folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if session folder exists
 * @param sessionId - The session ID to check
 * @param basePath - Base path for temp directory
 */
export async function sessionFolderExists(
  sessionId: string, 
  basePath: string = path.join(process.cwd(), 'temp')
): Promise<boolean> {
  try {
    const sessionFolderPath = path.join(basePath, sessionId)
    await fs.access(sessionFolderPath)
    return true
  } catch {
    return false
  }
}

/**
 * Get session folder path
 * @param sessionId - The session ID
 * @param basePath - Base path for temp directory
 */
export function getSessionFolderPath(
  sessionId: string, 
  basePath: string = path.join(process.cwd(), 'temp')
): string {
  return path.join(basePath, sessionId)
}

/**
 * Clean up session folder (remove all files and folder)
 * @param sessionId - The session ID to clean up
 * @param basePath - Base path for temp directory
 */
export async function cleanupSessionFolder(
  sessionId: string, 
  basePath: string = path.join(process.cwd(), 'temp')
): Promise<void> {
  try {
    const sessionFolderPath = path.join(basePath, sessionId)
    
    if (await sessionFolderExists(sessionId, basePath)) {
      await fs.rm(sessionFolderPath, { recursive: true, force: true })
      console.log(`Session folder cleaned up: ${sessionFolderPath}`)
    }
  } catch (error) {
    console.error(`Failed to cleanup session folder for ${sessionId}:`, error)
    throw new Error(`Failed to cleanup session folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List files in session folder
 * @param sessionId - The session ID
 * @param subFolder - Optional subfolder ('uploads' or 'processed')
 * @param basePath - Base path for temp directory
 */
export async function listSessionFiles(
  sessionId: string, 
  subFolder?: 'uploads' | 'processed',
  basePath: string = path.join(process.cwd(), 'temp')
): Promise<string[]> {
  try {
    const sessionFolderPath = subFolder 
      ? path.join(basePath, sessionId, subFolder)
      : path.join(basePath, sessionId)
    
    if (!(await sessionFolderExists(sessionId, basePath))) {
      return []
    }
    
    const files = await fs.readdir(sessionFolderPath)
    return files
  } catch (error) {
    console.error(`Failed to list session files for ${sessionId}:`, error)
    return []
  }
} 