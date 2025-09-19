import React from 'react'
import LiveAvatarRoom from '../components/LiveAvatarRoom'
import DropZone from '../components/DropZone'

/**
 * LiveSession page component (First wireframe)
 * Layout: AI live human avatar room on left, knowledge base dropzone on right
 */
const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex gap-4 p-4">
      {/* Left Side - AI live human avatar room */}
      <div className="flex-1">
        <LiveAvatarRoom />
      </div>

      {/* Right Side - Knowledge base dropzone */}
      <div className="w-80">
        <DropZone />
      </div>
    </div>
  )
}

export default Dashboard