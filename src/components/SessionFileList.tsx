'use client'

import React, { useState, useEffect } from 'react'
import { File, Download } from 'lucide-react'

interface SessionFileListProps {
  sessionId: string
  subFolder?: 'uploads' | 'processed'
  title?: string
}

/**
 * Component to display files in a session folder
 * Shows files that have been uploaded locally to the session directory
 */
const SessionFileList: React.FC<SessionFileListProps> = ({ 
  sessionId, 
  subFolder = 'uploads', 
  title = 'Local Files' 
}) => {
  const [files, setFiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load files from session folder
  useEffect(() => {
    if (!sessionId) return

    const loadFiles = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ 
          sessionId, 
          action: 'list',
          ...(subFolder && { subFolder })
        })

        const response = await fetch(`/api/sessions/folder?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to load files')
        }

        const data = await response.json()
        setFiles(data.files || [])
      } catch (err) {
        console.error('Failed to load session files:', err)
        setError(err instanceof Error ? err.message : 'Failed to load files')
      } finally {
        setIsLoading(false)
      }
    }

    loadFiles()
  }, [sessionId, subFolder])

  // Format file size (placeholder - would need actual file sizes from API)
  const formatFileSize = (fileName: string): string => {
    // This is a placeholder - in a real implementation, you'd get file sizes from the API
    return 'Unknown size'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
        <div className="text-center py-4">
          <div className="text-gray-500">Loading files...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
        <div className="text-center py-4">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        {title} ({files.length})
      </h3>
      
      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <File className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>No files uploaded yet</p>
          <p className="text-sm">Files uploaded via the dropzone will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((fileName, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">{fileName}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(fileName)}</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  // TODO: Implement file download/view functionality
                  console.log('Download file:', fileName)
                }}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-md transition-colors"
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {files.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Files are stored in: temp/{sessionId}/{subFolder}/
          </p>
        </div>
      )}
    </div>
  )
}

export default SessionFileList 