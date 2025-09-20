import { LiveSession, LiveSessionHistory, CreateLiveSessionRequest, LiveSessionStats } from '../types/liveSession'
import { generateUniqueSessionId, getSessionFolderPath, sessionFolderAPI } from '../utils/sessionUtils'

/**
 * Live Session Service
 * Handles all live session related API operations with session folder management
 * TODO: Replace mock data with actual API calls
 */

// Mock data - replace with actual API calls
const mockSessions: LiveSession[] = [
  {
    id: '1',
    title: 'Workshop Session 1',
    description: 'AI Digital Human Workshop',
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
    duration: 150, // 2h 30m
    status: 'completed',
    hostId: 'admin1',
    participantCount: 25
  },
  {
    id: '2',
    title: 'Training Session',
    description: 'Advanced AI Training',
    createdAt: new Date('2024-12-14'),
    updatedAt: new Date('2024-12-14'),
    duration: 105, // 1h 45m
    status: 'completed',
    hostId: 'admin1',
    participantCount: 18
  }
]

const mockHistory: LiveSessionHistory[] = [
  { id: '1', sessionId: '1', date: new Date('2024-12-15'), timeUsed: 150, status: 'completed' },
  { id: '2', sessionId: '2', date: new Date('2024-12-14'), timeUsed: 105, status: 'completed' },
  { id: '3', sessionId: '3', date: new Date('2024-12-13'), timeUsed: 195, status: 'completed' },
  { id: '4', sessionId: '4', date: new Date('2024-12-12'), timeUsed: 120, status: 'completed' },
  { id: '5', sessionId: '5', date: new Date('2024-12-11'), timeUsed: 90, status: 'interrupted' }
]

export const liveSessionService = {
  /**
   * Get all live sessions
   */
  async getAllSessions(): Promise<LiveSession[]> {
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSessions), 500)
    })
  },

  /**
   * Get live session by ID
   */
  async getSessionById(id: string): Promise<LiveSession | null> {
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const session = mockSessions.find(s => s.id === id)
        resolve(session || null)
      }, 300)
    })
  },

  /**
   * Create new live session with unique ID and folder creation
   */
  async createSession(request: CreateLiveSessionRequest): Promise<LiveSession> {
    try {
      // Generate unique session ID
      const sessionId = generateUniqueSessionId()
      
      // Create session folder via API
      const folderResult = await sessionFolderAPI.createFolder(sessionId)
      if (!folderResult.success) {
        throw new Error(folderResult.error || 'Failed to create session folder')
      }
      
      const newSession: LiveSession = {
        id: sessionId,
        title: request.title,
        description: request.description,
        imageUrl: request.imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        hostId: 'admin1', // TODO: Get from auth context
        participantCount: 0
      }
      
      mockSessions.push(newSession)
      
      // TODO: Replace with actual API call
      return new Promise((resolve) => {
        setTimeout(() => resolve(newSession), 500)
      })
    } catch (error) {
      console.error('Failed to create session:', error)
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Get live session history
   */
  async getSessionHistory(): Promise<LiveSessionHistory[]> {
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockHistory), 300)
    })
  },

  /**
   * Get live session statistics
   */
  async getSessionStats(): Promise<LiveSessionStats> {
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      const totalSessions = mockHistory.length
      const totalTimeUsed = mockHistory.reduce((sum, h) => sum + h.timeUsed, 0)
      const averageSessionTime = totalTimeUsed / totalSessions
      const lastSessionDate = mockHistory.length > 0 ? mockHistory[0].date : undefined

      setTimeout(() => resolve({
        totalSessions,
        totalTimeUsed,
        averageSessionTime,
        lastSessionDate
      }), 300)
    })
  },

  /**
   * Update live session status
   */
  async updateSessionStatus(id: string, status: LiveSession['status']): Promise<LiveSession | null> {
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      const sessionIndex = mockSessions.findIndex(s => s.id === id)
      if (sessionIndex !== -1) {
        mockSessions[sessionIndex].status = status
        mockSessions[sessionIndex].updatedAt = new Date()
        setTimeout(() => resolve(mockSessions[sessionIndex]), 300)
      } else {
        setTimeout(() => resolve(null), 300)
      }
    })
  },

  /**
   * Start a live session - changes status to active and ensures folder exists
   */
  async startSession(sessionId: string): Promise<LiveSession | null> {
    try {
      // Ensure session folder exists
      const folderCheck = await sessionFolderAPI.checkFolder(sessionId)
      if (!folderCheck.exists) {
        const createResult = await sessionFolderAPI.createFolder(sessionId)
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create session folder')
        }
      }
      
      // Update session status to active
      const updatedSession = await this.updateSessionStatus(sessionId, 'active')
      
      if (updatedSession) {
        console.log(`Session ${sessionId} started successfully`)
        console.log(`Session folder: ${getSessionFolderPath(sessionId)}`)
      }
      
      return updatedSession
    } catch (error) {
      console.error(`Failed to start session ${sessionId}:`, error)
      throw new Error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * End a live session - changes status to completed
   */
  async endSession(sessionId: string): Promise<LiveSession | null> {
    try {
      const updatedSession = await this.updateSessionStatus(sessionId, 'completed')
      
      if (updatedSession) {
        console.log(`Session ${sessionId} ended successfully`)
      }
      
      return updatedSession
    } catch (error) {
      console.error(`Failed to end session ${sessionId}:`, error)
      throw new Error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Get session folder path
   */
  getSessionFolderPath(sessionId: string): string {
    return getSessionFolderPath(sessionId)
  },

  /**
   * Check if session folder exists
   */
  async checkSessionFolder(sessionId: string): Promise<boolean> {
    const result = await sessionFolderAPI.checkFolder(sessionId)
    return result.exists
  },

  /**
   * Clean up session folder (typically called when session is cancelled or completed)
   */
  async cleanupSession(sessionId: string): Promise<void> {
    try {
      const result = await sessionFolderAPI.cleanupFolder(sessionId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to cleanup session folder')
      }
      console.log(`Session ${sessionId} folder cleaned up`)
    } catch (error) {
      console.error(`Failed to cleanup session ${sessionId}:`, error)
      throw new Error(`Failed to cleanup session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * List files in session folder
   */
  async listSessionFiles(sessionId: string, subFolder?: 'uploads' | 'processed'): Promise<string[]> {
    try {
      const result = await sessionFolderAPI.listFiles(sessionId, subFolder)
      return result.files
    } catch (error) {
      console.error(`Failed to list session files for ${sessionId}:`, error)
      return []
    }
  }
} 