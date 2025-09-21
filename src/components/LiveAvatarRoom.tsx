'use client'

import React, { useState, useEffect } from 'react'
import StartAndStopMeetingButton from './ui/startAndStopMeetingButton'
import RecordButton from './ui/recordButton'
import DIDAgent from './DIDAgent'

interface LiveAvatarRoomProps {
  sessionId?: string
  isAdmin?: boolean
  currentScript?: string
}

/**
 * LiveAvatarRoom component
 * Displays the AI live human avatar with meeting controls
 * Now uses D-ID Agents for conversational AI avatars
 */
const LiveAvatarRoom: React.FC<LiveAvatarRoomProps> = ({ 
  sessionId, 
  isAdmin = true, // Default to admin for dashboard
  currentScript 
}) => {
  const [isLive, setIsLive] = useState(false)
  const [avatarStatus, setAvatarStatus] = useState<string>('disconnected')

  const handleStartMeeting = () => {
    setIsLive(true)
    console.log('🎬 Starting live session with D-ID Agent')
  }

  const handleStopMeeting = () => {
    setIsLive(false)
    console.log('⏹️ Stopping live session')
  }

  const handleAvatarStatusChange = (status: string) => {
    setAvatarStatus(status)
    console.log('🤖 Agent status changed:', status)
  }

  return (
    <div className="w-full h-full bg-white border border-gray-300 rounded-lg flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">AI Live Avatar Room</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isLive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isLive ? 'LIVE' : 'OFFLINE'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              avatarStatus === 'live' ? 'bg-blue-100 text-blue-800' :
              avatarStatus === 'agent_ready' ? 'bg-green-100 text-green-800' :
              avatarStatus === 'stopped' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {avatarStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Agent Area */}
      <div className="flex-1 p-4">
        {isLive ? (
          <DIDAgent
            sessionId={sessionId || 'demo-session'}
            isAdmin={isAdmin}
            onStatusChange={handleAvatarStatusChange}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-500 text-3xl">🤖</span>
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">D-ID Agent Ready</h4>
              <p className="text-gray-500 text-sm mb-4">
                {isAdmin ? 'Click "Start Meeting" to begin live conversation' : 'Waiting for admin to start session'}
              </p>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>D-ID Agents:</strong> Conversational AI avatars that can have real-time conversations about x402 payment standard
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4">
          <StartAndStopMeetingButton 
            onStart={handleStartMeeting}
            onStop={handleStopMeeting}
            isLive={isLive}
          />
          <RecordButton />
        </div>
        
        {/* Admin Info */}
        {isAdmin && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Admin controls: Start/stop live session, interact with D-ID Agent
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveAvatarRoom
