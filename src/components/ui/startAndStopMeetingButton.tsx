"use client"

import React, { useState } from 'react'
import { Play, Square } from 'lucide-react'

/**
 * Start and Stop Meeting button component
 * Toggles between start and stop meeting functionality
 */
const StartAndStopMeetingButton = () => {
  const [isMeetingActive, setIsMeetingActive] = useState(false)

  const handleToggleMeeting = () => {
    setIsMeetingActive(!isMeetingActive)
  }

  return (
    <button 
      onClick={handleToggleMeeting}
      className={`flex items-center justify-center px-6 py-3 rounded-full font-medium text-white transition-colors duration-200 ${
        isMeetingActive 
          ? 'bg-red-500 hover:bg-red-600' 
          : 'bg-green-500 hover:bg-green-600'
      }`}
    >
      {isMeetingActive ? (
        <>
          <Square className="w-5 h-5 mr-2" />
          Stop Meeting
        </>
      ) : (
        <>
          <Play className="w-5 h-5 mr-2" />
          Start Meeting
        </>
      )}
    </button>
  )
}

export default StartAndStopMeetingButton