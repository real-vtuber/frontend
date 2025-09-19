import React from 'react'
import { Presentation } from 'lucide-react'
import AiAvatar from './AiAvatar'

/**
 * WorkshopPresentation component
 * Displays the main workshop presentation area with AI live human avatar
 * Used in the Dashboard page as the main content area
 */
const WorkshopPresentation = () => {
  return (
    <div className="w-full h-full bg-white border border-gray-300 rounded-lg flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Workshop presentation</h3>
      </div>

      {/* Main Presentation Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 relative">
        {/* AI Avatar Circle - positioned in bottom right corner as shown in wireframe */}
        <div className="absolute bottom-6 right-6">
          <AiAvatar />
        </div>

        {/* Presentation Content Area */}
        <div className="flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Presentation className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Workshop presentation content will appear here</p>
            <p className="text-sm mt-2">Start a meeting to begin the presentation</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkshopPresentation  