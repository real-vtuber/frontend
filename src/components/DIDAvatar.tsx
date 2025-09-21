'use client'

import React, { useState, useEffect, useRef } from 'react'
import { DIDLiveSession, initializeDIDAvatar, startAvatarPresentation, stopAvatarPresentation, parseScriptForDID, estimatePresentationDuration } from '../lib/did'

interface DIDAvatarProps {
  sessionId: string
  script?: string
  isAdmin?: boolean
  onStatusChange?: (status: string) => void
}

/**
 * D-ID Avatar Component
 * Displays live avatar for script presentation
 */
const DIDAvatar: React.FC<DIDAvatarProps> = ({ 
  sessionId, 
  script, 
  isAdmin = false, 
  onStatusChange 
}) => {
  const [avatarSession, setAvatarSession] = useState<DIDLiveSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentScript, setCurrentScript] = useState<string>('')
  const [presentationDuration, setPresentationDuration] = useState<number>(0)
  const [isPresenting, setIsPresenting] = useState(false)
  const [presentationProgress, setPresentationProgress] = useState<number>(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize avatar when component mounts
  useEffect(() => {
    if (sessionId && !avatarSession) {
      initializeAvatar()
    }
  }, [sessionId])

  // Update script when prop changes
  useEffect(() => {
    if (script && script !== currentScript) {
      setCurrentScript(script)
      const duration = estimatePresentationDuration(parseScriptForDID(script))
      setPresentationDuration(duration)
    }
  }, [script])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const initializeAvatar = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const config = {
        agentId: 'demo_agent_id_67890', // Hardcoded for demo
        script: script || 'Welcome to our live session. Please wait while we prepare the presentation.',
        voice: 'en-US-Standard-A',
        language: 'en-US',
        quality: 'high' as const
      }
      
      const session = await initializeDIDAvatar(config)
      setAvatarSession(session)
      onStatusChange?.(session.status)
      
    } catch (err) {
      console.error('Failed to initialize avatar:', err)
      setError('Failed to initialize avatar. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartPresentation = async () => {
    if (!avatarSession || !currentScript) return
    
    setIsLoading(true)
    try {
      const success = await startAvatarPresentation(avatarSession, currentScript)
      if (success) {
        setIsPresenting(true)
        setPresentationProgress(0)
        onStatusChange?.(avatarSession.status)
        
        // Start progress simulation
        startProgressSimulation()
        
        // Simulate presentation duration
        setTimeout(() => {
          handleStopPresentation()
        }, presentationDuration * 60 * 1000) // Convert minutes to milliseconds
      }
    } catch (err) {
      console.error('Failed to start presentation:', err)
      setError('Failed to start presentation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopPresentation = async () => {
    if (!avatarSession) return
    
    try {
      const success = await stopAvatarPresentation(avatarSession)
      if (success) {
        setIsPresenting(false)
        setPresentationProgress(0)
        onStatusChange?.(avatarSession.status)
        
        // Stop progress simulation
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
      }
    } catch (err) {
      console.error('Failed to stop presentation:', err)
    }
  }

  const startProgressSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
    
    const totalDuration = presentationDuration * 60 * 1000 // Convert to milliseconds
    const updateInterval = 1000 // Update every second
    const progressIncrement = (updateInterval / totalDuration) * 100
    
    progressIntervalRef.current = setInterval(() => {
      setPresentationProgress(prev => {
        const newProgress = prev + progressIncrement
        if (newProgress >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
          }
          return 100
        }
        return newProgress
      })
    }, updateInterval)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100'
      case 'speaking': return 'text-blue-600 bg-blue-100'
      case 'idle': return 'text-yellow-600 bg-yellow-100'
      case 'disconnected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connecting': return 'Connecting...'
      case 'connected': return 'Connected'
      case 'speaking': return 'Speaking'
      case 'idle': return 'Idle'
      case 'disconnected': return 'Disconnected'
      default: return 'Unknown'
    }
  }

  if (isLoading && !avatarSession) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing D-ID Avatar...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to D-ID service...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={initializeAvatar}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Avatar Video Area */}
      <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-gray-200 overflow-hidden">
        {/* Demo Avatar Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-4xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">D-ID Avatar</h3>
            <p className="text-gray-600">Live AI Presentation</p>
            {isPresenting && (
              <div className="mt-4">
                <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${presentationProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round(presentationProgress)}% Complete
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Status Indicator */}
        {avatarSession && (
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(avatarSession.status)}`}>
              {getStatusText(avatarSession.status)}
            </span>
          </div>
        )}
        
        {/* Demo Video Overlay */}
        {isPresenting && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-pulse text-2xl mb-2">🎬</div>
              <p>Live Presentation in Progress</p>
              <p className="text-sm opacity-75">Duration: {presentationDuration} minutes</p>
              <div className="mt-4 w-48 bg-gray-600 rounded-full h-2 mx-auto">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${presentationProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isAdmin && avatarSession && (
        <div className="flex items-center justify-center space-x-4">
          {!isPresenting ? (
            <button
              onClick={handleStartPresentation}
              disabled={isLoading || !currentScript}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <span>▶️</span>
                  <span>Start Presentation</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStopPresentation}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <span>⏹️</span>
              <span>Stop Presentation</span>
            </button>
          )}
        </div>
      )}

      {/* Script Preview */}
      {currentScript && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Script Preview</h4>
          <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
            {currentScript.substring(0, 300)}
            {currentScript.length > 300 && '...'}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Duration: {presentationDuration} minutes | Words: {currentScript.split(' ').length}
          </div>
        </div>
      )}

      {/* Demo Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Demo Mode:</strong> This is a simulated D-ID Avatar presentation. 
          In production, this would connect to the real D-ID API with your configured keys.
        </p>
      </div>
    </div>
  )
}

export default DIDAvatar
