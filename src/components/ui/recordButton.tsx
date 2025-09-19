import React from 'react'
import { Circle } from 'lucide-react'

/**
 * Record button component
 * Displays a record button for starting/stopping recording
 */
const RecordButton = () => {
  return (
    <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 transition-colors duration-200 font-medium text-gray-700">
      Record
    </button>
  )
}

export default RecordButton