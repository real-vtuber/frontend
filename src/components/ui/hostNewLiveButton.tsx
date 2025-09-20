import React from 'react'

interface HostNewLiveButtonProps {
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

/**
 * Reusable button component for hosting new live sessions
 * Provides consistent styling and behavior across the application
 */
const HostNewLiveButton: React.FC<HostNewLiveButtonProps> = ({
  onClick,
  className = '',
  children = 'Host a new live'
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Default behavior - navigate to add new live session page
      window.location.href = '/add-new-live-session'
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`px-8 py-3 bg-white border-2 border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 shadow-sm ${className}`}
    >
      {children}
    </button>
  )
}

export default HostNewLiveButton
