"use client"

import React, { useState } from "react"
import { Upload, File, X } from "lucide-react"

// Define file with status
type UploadedFile = {
  id: number
  name: string
  size: string
  status: "pending" | "uploading" | "success" | "error"
}

interface DropZoneProps {
  sessionId?: string
  autoProcess?: boolean
  onUploadComplete?: (fileName: string) => void
}

const DropZone = ({ sessionId = "s1", autoProcess = false, onUploadComplete }: DropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // 🔹 Auto-processing trigger
  const triggerAutoProcessing = async () => {
    if (!autoProcess || !sessionId) return

    try {
      console.log('🔄 Auto-triggering file processing...')
      
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          action: 'process_all'
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Auto-processing completed:', result)
      } else {
        console.warn('⚠️ Auto-processing failed')
      }
    } catch (error) {
      console.error('Auto-processing error:', error)
    }
  }

  // 🔹 Helper to request presigned URL & upload to S3 + local storage
  const uploadFile = async (file: File, fileId: number) => {
    try {
      updateFileStatus(fileId, "uploading")

      // Step 1: ask Next.js API for presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          sessionId,
        }),
      })

      const { uploadUrl, key } = await res.json()

      // Step 2: PUT file to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      })

      if (!uploadRes.ok) throw new Error("S3 upload failed")

      // Step 3: Save file locally in session folder
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', sessionId)
      formData.append('subFolder', 'uploads')

      const localRes = await fetch("/api/upload/local", {
        method: "POST",
        body: formData,
      })

      if (!localRes.ok) {
        console.warn("Local upload failed, but S3 upload succeeded")
      } else {
        const localData = await localRes.json()
        console.log("✅ File saved locally:", localData.filePath)
      }

      updateFileStatus(fileId, "success")
      console.log("✅ Uploaded to S3:", key)
      
      // Trigger callbacks
      onUploadComplete?.(file.name)
      
      // Auto-process if enabled
      if (autoProcess) {
        // Delay slightly to ensure local file is fully written
        setTimeout(() => {
          triggerAutoProcessing()
        }, 1000)
      }
    } catch (err) {
      console.error("Upload error:", err)
      updateFileStatus(fileId, "error")
    }
  }

  const updateFileStatus = (fileId: number, status: UploadedFile["status"]) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status } : f))
    )
  }

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => {
      const fileId = Date.now() + Math.random()
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        status: "pending",
      }
      // Start upload immediately
      uploadFile(file, fileId)
      return newFile
    })

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files))
  }

  const removeFile = (fileId: number) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileId))
  }

  return (
    <div className="w-full h-full bg-white border border-gray-300 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Knowledge Base Dropzone
        </h3>
      </div>

      {/* Drop Zone Area */}
      <div className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 mb-2">
            Drop your knowledge base files here
          </p>
          <p className="text-sm text-gray-500 mb-4">or click to browse</p>

          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.txt,.md"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors duration-200"
          >
            Browse Files
          </label>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Uploaded Files:
            </h4>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <File className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{file.size}</p>
                      <p
                        className={`text-xs ${
                          file.status === "success"
                            ? "text-green-600"
                            : file.status === "error"
                            ? "text-red-600"
                            : file.status === "uploading"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      >
                        {file.status === "pending" && "Waiting..."}
                        {file.status === "uploading" && "Uploading..."}
                        {file.status === "success" && "✅ Uploaded"}
                        {file.status === "error" && "❌ Failed"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DropZone
