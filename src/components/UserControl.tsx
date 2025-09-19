import React from 'react'
import Mic from './ui/mic'
import Camera from './ui/camera'
import Subtitle from './ui/subtitle'

/**
 * UserControl component
 * Contains user control buttons for mic, camera, and subtitle
 * Used at the bottom of both Dashboard and LiveSession pages
 */
const UserControl = () => {
  return (
    <div className="flex items-center justify-center space-x-4 p-4 bg-gray-100 border-t border-gray-200">
      <Mic />
      <Camera />
      <Subtitle />
    </div>
  )
}

export default UserControl