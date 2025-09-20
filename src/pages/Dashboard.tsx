'use client'

import React, { useState, useEffect } from 'react'
import LiveAvatarRoom from '../components/LiveAvatarRoom'
import DropZone from '../components/DropZone'
import SessionFileList from '../components/SessionFileList'
import ProcessedFilesList from '../components/ProcessedFilesList'
import ScriptGenerator from '../components/ScriptGenerator'
import { liveSessionService } from '../services/liveSessionService'
import { LiveSession } from '../types/liveSession'

interface DashboardProps {
  sessionId?: string
}

/**
 * Dashboard page component with dynamic session support
 * Layout: AI live human avatar room on left, knowledge base dropzone on right
 * Now supports session-specific data when sessionId is provided
 */
const Dashboard: React.FC<DashboardProps> = ({ sessionId }) => {
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(!!sessionId)
  const [error, setError] = useState<string | null>(null)

  // Load session data if sessionId is provided
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false)
      return
    }

    const loadSession = async () => {
      try {
        const session = await liveSessionService.getSessionById(sessionId)
        if (session) {
          setCurrentSession(session)
        } else {
          setError('Session not found')
        }
      } catch (err) {
        console.error('Failed to load session:', err)
        setError('Failed to load session data')
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading session...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Session Header - only show if we have a specific session */}
      {currentSession && (
        <div className="bg-white shadow-sm border-b p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentSession.title}</h1>
              {currentSession.description && (
                <p className="text-gray-600 mt-1">{currentSession.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentSession.status === 'active' ? 'bg-green-100 text-green-800' :
                currentSession.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                currentSession.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentSession.status.charAt(0).toUpperCase() + currentSession.status.slice(1)}
              </span>
              {currentSession.participantCount !== undefined && (
                <span className="text-gray-600">
                  {currentSession.participantCount} participants
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4">
                 {/* Left Side - AI live human avatar room */}
         <div className="flex-1">
           <LiveAvatarRoom />
         </div>

                 {/* Right Side - Knowledge base dropzone and file management */}
        <div className="w-80 space-y-4">
          <DropZone sessionId={currentSession?.id || sessionId} />
          {(currentSession?.id || sessionId) && (
            <>
              <SessionFileList 
                sessionId={currentSession?.id || sessionId!} 
                subFolder="uploads"
                title="Uploaded Files"
              />
                              <ProcessedFilesList 
                  sessionId={currentSession?.id || sessionId!} 
                />
                <ScriptGenerator 
                  sessionId={currentSession?.id || sessionId!} 
                />
              </>
            )}
          </div>
        </div>
      </div>
  )
}

export default Dashboard