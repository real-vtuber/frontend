'use client'

import React from 'react'

interface StartAndStopMeetingButtonProps {
  onStart?: () => void
  onStop?: () => void
  isLive?: boolean
  disabled?: boolean
}

/**
 * Start and Stop Meeting Button Component
 * Updated to support D-ID Avatar live session controls
 */
const StartAndStopMeetingButton: React.FC<StartAndStopMeetingButtonProps> = ({
  onStart,
  onStop,
  isLive = false,
  disabled = false
}) => {
  const handleClick = () => {
    if (disabled) return
    
    if (isLive) {
      onStop?.()
    } else {
      onStart?.()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
        isLive
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLive ? (
        <>
          <span>⏹️</span>
          <span>Stop Live Session</span>
        </>
      ) : (
        <>
          <span>▶️</span>
          <span>Start Live Session</span>
        </>
      )}
    </button>
  )
}

export default StartAndStopMeetingButton
