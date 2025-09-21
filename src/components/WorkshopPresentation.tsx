'use client'

import React, { useState, useEffect } from 'react'
import { Presentation } from 'lucide-react'
import DIDAgent from './DIDAgent'

/**
 * WorkshopPresentation component
 * Displays the main workshop presentation area with D-ID Agent
 * Used in the LiveSession page for user viewing
 */
const WorkshopPresentation = () => {
  const [isLive, setIsLive] = useState(false)
  const [avatarStatus, setAvatarStatus] = useState<string>('disconnected')

  const handleAvatarStatusChange = (status: string) => {
    setAvatarStatus(status)
    console.log('🤖 Agent status changed:', status)
  }

  return (
    <div className="w-full h-full bg-white border border-gray-300 rounded-lg flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Live Workshop Presentation</h3>
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

      {/* Main Presentation Area */}
      <div className="flex-1 p-4">
        {isLive ? (
          <DIDAgent
            sessionId="demo-live-session"
            isAdmin={false}
            onStatusChange={handleAvatarStatusChange}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center relative">
            {/* Demo Avatar Circle - positioned in bottom right corner */}
            <div className="absolute bottom-6 right-6">
              <div className="w-20 h-20 bg-white border-4 border-gray-800 rounded-full flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-800">AI live</div>
                  <div className="text-sm font-semibold text-gray-800">human</div>
                </div>
              </div>
            </div>

            {/* Presentation Content Area */}
            <div className="flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Presentation className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">Live presentation will appear here</p>
                <p className="text-sm mt-2">Waiting for admin to start the session</p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>D-ID Agents:</strong> This will show a conversational AI avatar that can discuss the x402 payment standard
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkshopPresentation
