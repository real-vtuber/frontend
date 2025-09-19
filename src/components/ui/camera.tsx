import React from 'react'
import { Camera as CameraIcon } from 'lucide-react'

/**
 * Camera toggle button component
 * Displays a camera icon button for enabling/disabling camera
 */
const Camera = () => {
  return (
    <button className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 transition-colors duration-200">
      <CameraIcon className="w-6 h-6 text-gray-700" />
    </button>
  )
}

export default Camera   