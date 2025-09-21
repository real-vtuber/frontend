'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Zap, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface ProcessedFile {
  fileName: string
  fileType: string
  totalChunks: number
  originalSize: number
  processedAt: string
}

interface ProcessedFilesListProps {
  sessionId: string
}

/**
 * Component to display processed files and trigger processing
 * Shows files that have been parsed, chunked, and embedded in Pinecone
 */
const ProcessedFilesList: React.FC<ProcessedFilesListProps> = ({ sessionId }) => {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>('')

  // Load processed files
  const loadProcessedFiles = async () => {
    if (!sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/process?sessionId=${sessionId}&action=list`)
      
      if (!response.ok) {
        throw new Error('Failed to load processed files')
      }

      const data = await response.json()
      setProcessedFiles(data.documents || [])
    } catch (err) {
      console.error('Failed to load processed files:', err)
      setError(err instanceof Error ? err.message : 'Failed to load processed files')
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger file processing
  const processFiles = async () => {
    if (!sessionId || isProcessing) return

    setIsProcessing(true)
    setError(null)
    setProcessingStatus('Starting file processing...')

    try {
      setProcessingStatus('Parsing and chunking files...')
      
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          action: 'process_all'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Processing failed')
      }

      const result = await response.json()
      
      if (result.success) {
        setProcessingStatus(`✅ Successfully processed ${result.processedFiles} files and embedded ${result.embeddedChunks} chunks in Pinecone`)
        
        // Reload the processed files list
        setTimeout(() => {
          loadProcessedFiles()
          setProcessingStatus('')
        }, 2000)
      } else {
        throw new Error(result.error || 'Processing failed')
      }

    } catch (err) {
      console.error('Processing failed:', err)
      setError(err instanceof Error ? err.message : 'Processing failed')
      setProcessingStatus('')
    } finally {
      setIsProcessing(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  useEffect(() => {
    loadProcessedFiles()
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Processed Files</h3>
        <div className="text-center py-4">
          <Loader className="animate-spin h-6 w-6 mx-auto text-blue-500" />
          <div className="text-gray-500 mt-2">Loading processed files...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Processed Files ({processedFiles.length})
        </h3>
        
        <button
          onClick={processFiles}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            isProcessing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader className="animate-spin h-4 w-4" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Process Files
            </>
          )}
        </button>
      </div>

      {/* Processing Status */}
      {processingStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Loader className="animate-spin h-4 w-4 text-blue-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm text-blue-700">{processingStatus}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Files List */}
      {processedFiles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>No files processed yet</p>
          <p className="text-sm">Upload files and click "Process Files" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-md">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.fileName}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{file.totalChunks} chunks</span>
                    <span>{formatFileSize(file.originalSize)}</span>
                    <span>Processed: {formatDate(file.processedAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Embedded</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      {processedFiles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Total chunks: {processedFiles.reduce((sum, file) => sum + file.totalChunks, 0)}
            </span>
            <span>
              Stored in Pinecone namespace: {sessionId}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProcessedFilesList 