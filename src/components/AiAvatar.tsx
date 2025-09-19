import React from 'react'

/**
 * AiAvatar component
 * Displays the AI live human avatar circle
 */
const AiAvatar = () => {
  return (
    <div className="w-50 h-50 bg-white border-4 border-gray-800 rounded-full flex items-center justify-center shadow-lg">
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-800">AI live</div>
        <div className="text-sm font-semibold text-gray-800">human</div>
      </div>
    </div>
  )
}

export default AiAvatar