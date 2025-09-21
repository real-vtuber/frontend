'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createDIDLiveSession, getDIDSessionStatus, endDIDLiveSession, DIDLiveSession, DIDAvatarConfig } from '../lib/did'

interface DIDAvatarPlayerProps {
  sessionId: string
  script: string
  isLive: boolean
  onSessionStart?: (session: DIDLiveSession) => void
  onSessionEnd?: () => void
  onError?: (error: string) => void
}

/**
 * D-ID Avatar Player Component
 * Displays live avatar video stream and controls
 */
const DIDAvatarPlayer: React.FC<DIDAvatarPlayerProps> = ({
  sessionId,
  script,
  isLive,
  onSessionStart,
  onSessionEnd,
  onError
}) => {
  const [avatarSession, setAvatarSession] = useState<DIDLiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Start D-ID live session
  const startAvatarSession = async () => {
    if (!script.trim()) {
      const errorMsg = 'No script available for avatar presentation'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🎭 Starting D-ID avatar session...')
      
      const config: DIDAvatarConfig = {
        agentId: process.env.NEXT_PUBLIC_DID_AGENT_ID || 'demo-agent-id',
        script: script,
        voice: 'en-US-AriaNeural',
        language: 'en'
      }

      const response = await createDIDLiveSession(config)
      
      if (response.success && response.data) {
        const session = response.data as DIDLiveSession
        setAvatarSession(session)
        onSessionStart?.(session)
        
        console.log('✅ D-ID avatar session started')
        console.log('  Session ID:', session.id)
        console.log('  Stream URL:', session.streamUrl)
        
        // Start status checking
        startStatusCheck(session.id)
      } else {
        throw new Error(response.error || 'Failed to start avatar session')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start avatar session'
      console.error('❌ Avatar session error:', errorMsg)
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // End D-ID live session
  const endAvatarSession = async () => {
    if (!avatarSession) return

    try {
      console.log('🛑 Ending D-ID avatar session...')
      
      const response = await endDIDLiveSession(avatarSession.id)
      
      if (response.success) {
        console.log('✅ D-ID avatar session ended')
        setAvatarSession(null)
        onSessionEnd?.()
      } else {
        console.warn('⚠️ Failed to properly end avatar session:', response.error)
      }
    } catch (err) {
      console.error('❌ Error ending avatar session:', err)
    } finally {
      // Clear status check interval
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
        statusCheckInterval.current = null
      }
    }
  }

  // Check session status periodically
  const startStatusCheck = (sessionId: string) => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current)
    }

    statusCheckInterval.current = setInterval(async () => {
      try {
        const response = await getDIDSessionStatus(sessionId)
        
        if (response.success && response.data) {
          const session = response.data as DIDLiveSession
          setAvatarSession(session)
          
          if (session.status === 'ended' || session.status === 'error') {
            console.log('🛑 Avatar session ended:', session.status)
            endAvatarSession()
          }
        }
      } catch (err) {
        console.error('❌ Status check error:', err)
      }
    }, 5000) // Check every 5 seconds
  }

  // Handle live state changes
  useEffect(() => {
    if (isLive && !avatarSession && !isLoading) {
      startAvatarSession()
    } else if (!isLive && avatarSession) {
      endAvatarSession()
    }
  }, [isLive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }
      if (avatarSession) {
        endAvatarSession()
      }
    }
  }, [])

  // Handle video element
  useEffect(() => {
    if (videoRef.current && avatarSession?.streamUrl) {
      videoRef.current.src = avatarSession.streamUrl
      videoRef.current.play().catch(err => {
        console.warn('⚠️ Video autoplay failed:', err)
      })
    }
  }, [avatarSession?.streamUrl])

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
      {/* Video Container */}
      <div className="relative w-full h-full">
        {avatarSession?.streamUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            controls={false}
            poster="/api/placeholder/800/600"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            <div className="text-center text-white">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Starting Avatar...</p>
                  <p className="text-sm opacity-75">Preparing live presentation</p>
                </>
              ) : error ? (
                <>
                  <div className="text-red-400 text-6xl mb-4">⚠️</div>
                  <p className="text-lg font-medium text-red-400">Avatar Error</p>
                  <p className="text-sm opacity-75">{error}</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">��</div>
                  <p className="text-lg font-medium">Avatar Ready</p>
                  <p className="text-sm opacity-75">Click "Start Live" to begin</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay Controls */}
      {avatarSession && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-3 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">LIVE</span>
          </div>
          <p className="text-xs opacity-75 mt-1">Session: {avatarSession.id.slice(-8)}</p>
        </div>
      )}

      {/* Script Preview */}
      {script && !avatarSession && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 rounded-lg p-3 text-white">
          <p className="text-sm font-medium mb-2">📝 Script Preview:</p>
          <p className="text-xs opacity-90 line-clamp-3">
            {script.substring(0, 150)}...
          </p>
        </div>
      )}
    </div>
  )
}

export default DIDAvatarPlayer
