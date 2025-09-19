import React from 'react'
import WorkshopPresentation from '../components/WorkshopPresentation'
import ChatBox from '../components/ChatBox'
import UserControl from '../components/UserControl'

/**
 * LiveSession page component
 * Live session layout with workshop presentation, chatbox, and user controls
 * Layout follows the wireframe: workshop presentation on left, chat on right, controls at bottom
 */
const LiveSession = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Left Side - Workshop Presentation */}
        <div className="flex-1">
          <WorkshopPresentation />
        </div>

        {/* Right Side - ChatBox */}
        <div className="w-80">
          <ChatBox />
        </div>
      </div>

      {/* Bottom - User Controls */}
      <UserControl />
    </div>
  )
}

export default LiveSession