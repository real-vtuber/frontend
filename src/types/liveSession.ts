/**
 * Live Session related type definitions
 */

export interface LiveSession {
  id: string
  title: string
  description?: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
  duration?: number // in minutes
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  hostId: string
  participantCount?: number
}

export interface LiveSessionHistory {
  id: string
  sessionId: string
  date: Date
  timeUsed: number // in minutes
  status: 'completed' | 'interrupted'
}

export interface CreateLiveSessionRequest {
  title: string
  description?: string
  imageUrl?: string
}

export interface LiveSessionStats {
  totalSessions: number
  totalTimeUsed: number // in minutes
  averageSessionTime: number // in minutes
  lastSessionDate?: Date
} 