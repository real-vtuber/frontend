import React from 'react'
import { Mic as MicIcon } from 'lucide-react'

/**
 * Microphone toggle button component
 * Displays a microphone icon button for enabling/disabling microphone
 */
const Mic = () => {
  return (
    <button className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 transition-colors duration-200">
      <MicIcon className="w-6 h-6 text-gray-700" />
    </button>
  )
}

export default Mic