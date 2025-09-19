import React from 'react'
import StartAndStopMeetingButton from './ui/startAndStopMeetingButton'
import RecordButton from './ui/recordButton'

/**
 * LiveAvatarRoom component
 * Displays the AI live human avatar with meeting controls
 * Used in the Dashboard page showing the avatar and control buttons
 */
const LiveAvatarRoom = () => {
  return (
    <div className="w-full h-full bg-white border border-gray-300 rounded-lg flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">AI live human avatar room</h3>
      </div>

      {/* Empty Room Area */}
      <div className="flex-1 bg-gray-50"></div>

      {/* Control Buttons */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4">
          <StartAndStopMeetingButton />
          <RecordButton />
        </div>
      </div>
    </div>
  )
}

export default LiveAvatarRoom   