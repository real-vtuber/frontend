import React from 'react'
import { Subtitles } from 'lucide-react'

/**
 * Subtitle toggle button component
 * Displays a subtitle/closed caption button for enabling/disabling subtitles
 */
const Subtitle = () => {
  return (
    <button className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 transition-colors duration-200">
      <Subtitles className="w-6 h-6 text-gray-700" />
    </button>
  )
}

export default Subtitle