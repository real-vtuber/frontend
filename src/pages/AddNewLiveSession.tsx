'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HostNewLiveButton from '../components/ui/hostNewLiveButton'
import { liveSessionService } from '../services/liveSessionService'
import { LiveSessionHistory } from '../types/liveSession'

/**
 * AddNewLiveSession page component
 * Admin interface for creating new live sessions
 * Layout: Image placeholder on left, history list on right, host button below image
 */
const AddNewLiveSession = () => {
  const router = useRouter()
  const [history, setHistory] = useState<LiveSessionHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Load live session history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const historyData = await liveSessionService.getSessionHistory()
        setHistory(historyData)
      } catch (error) {
        console.error('Failed to load session history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [])

  const handleHostNewLive = async () => {
    setIsCreating(true)
    try {
      // Create new live session
      const newSession = await liveSessionService.createSession({
        title: `Live Session ${new Date().toLocaleDateString()}`,
        description: 'New AI Digital Human Workshop Session'
      })

      // Redirect to the new session's dashboard
      router.push(`/dashboard/${newSession.id}`)
    } catch (error) {
      console.error('Failed to create new live session:', error)
      // TODO: Show error toast/notification
    } finally {
      setIsCreating(false)
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-8">
          {/* Left Side - Image and Host Button */}
          <div className="flex-1 max-w-2xl">
            {/* Image Placeholder */}
            <div className="w-full h-80 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center mb-6">
              <div className="text-center">
                
                <div className="text-6xl font-bold text-gray-400 mb-2">IMG</div>
              </div>
            </div>

            {/* Host New Live Button */}
            <div className="text-center">
              <HostNewLiveButton 
                onClick={handleHostNewLive}
                className={isCreating ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isCreating ? 'Creating Session...' : 'Host a new live'}
              </HostNewLiveButton>
            </div>
          </div>

          {/* Right Side - History */}
          <div className="w-80">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">History</h2>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center text-gray-500 py-4">Loading history...</div>
                ) : history.length > 0 ? (
                  history.map((session, index) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <span className="text-gray-700 font-medium">{formatDate(session.date)}</span>
                      <span className="text-gray-600">{formatDuration(session.timeUsed)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">No session history yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddNewLiveSession