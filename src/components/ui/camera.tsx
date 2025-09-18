import React from 'react'
import { Camera as CameraIcon } from 'lucide-react'

/**
 * Camera control component for toggling video on/off
 * Used in the live session interface
 */
const Camera = () => {
  const [isEnabled, setIsEnabled] = React.useState(false)

  const handleToggle = () => {
    setIsEnabled(!isEnabled)
  }

  return (
    <button
      onClick={handleToggle}
      className={`
        w-12 h-12 rounded-full border-2 border-black
        flex items-center justify-center
        transition-colors duration-200
        ${isEnabled ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-100'}
      `}
      aria-label={`Camera ${isEnabled ? 'on' : 'off'}`}
    >
      <CameraIcon size={20} />
    </button>
  )
}

export default Camera   