/**
 * Client-side session utility functions for ID generation
 * Server-side folder operations are handled via API routes
 */

/**
 * Generate a unique session ID using timestamp and random string
 * Format: sess_[timestamp]_[random]
 * Example: sess_20241220143052_a7b3c9d2
 */
export function generateUniqueSessionId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
  const randomString = Math.random().toString(36).substring(2, 10)
  return `sess_${timestamp}_${randomString}`
}

/**
 * Generate alternative UUID-style session ID (more standard approach)
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUIDSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Get session folder path (client-side helper)
 * @param sessionId - The session ID
 * @param basePath - Base path for temp directory (defaults to 'temp')
 */
export function getSessionFolderPath(
  sessionId: string, 
  basePath: string = 'temp'
): string {
  return `${basePath}/${sessionId}`
}

/**
 * Client-side API calls for folder management
 */
export const sessionFolderAPI = {
  /**
   * Create session folder via API
   */
  async createFolder(sessionId: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const response = await fetch('/api/sessions/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'create' })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create folder')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to create session folder:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * Check if session folder exists via API
   */
  async checkFolder(sessionId: string): Promise<{ exists: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/sessions/folder?sessionId=${sessionId}&action=check`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check folder')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to check session folder:', error)
      return { 
        exists: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * List session files via API
   */
  async listFiles(sessionId: string, subFolder?: 'uploads' | 'processed'): Promise<{ files: string[]; error?: string }> {
    try {
      const params = new URLSearchParams({ sessionId, action: 'list' })
      if (subFolder) params.append('subFolder', subFolder)
      
      const response = await fetch(`/api/sessions/folder?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to list files')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to list session files:', error)
      return { 
        files: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  /**
   * Clean up session folder via API
   */
  async cleanupFolder(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/sessions/folder', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cleanup folder')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to cleanup session folder:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
} 