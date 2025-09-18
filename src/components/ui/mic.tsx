import React from 'react'
import { Mic as MicIcon, MicOff } from 'lucide-react'

/**
 * Microphone control component for toggling audio on/off
 * Used in the live session interface
 */
const Mic = () => {
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
      aria-label={`Microphone ${isEnabled ? 'on' : 'off'}`}
    >
      {isEnabled ? <MicIcon size={20} /> : <MicOff size={20} />}
    </button>
  )
}

export default Mic