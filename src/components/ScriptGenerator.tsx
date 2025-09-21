'use client'

import React, { useState, useEffect } from 'react'
import { Wand2, FileText, Clock, Users, Zap, Download, Eye, Trash2, RefreshCw } from 'lucide-react'

interface GeneratedScript {
  id: string
  topic: string
  content: string
  duration: number
  tone: string
  audience: string
  confidence: number
  generatedAt: string
  status: string
  contextSources: number
}

interface ScriptGeneratorProps {
  sessionId: string
}

/**
 * Script Generator Component
 * Provides interface for generating and managing AI scripts using RAG pipeline
 */
const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ sessionId }) => {
  const [scripts, setScripts] = useState<GeneratedScript[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedScript, setSelectedScript] = useState<GeneratedScript | null>(null)

  // Form state
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(5)
  const [tone, setTone] = useState<'professional' | 'casual' | 'educational' | 'entertaining'>('professional')
  const [audience, setAudience] = useState('general')
  const [variations, setVariations] = useState(1)

  /**
   * Load existing scripts for the session
   */
  const loadScripts = async () => {
    if (!sessionId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/generate-script?sessionId=${sessionId}`)
      const data = await response.json()
      
      if (data.success) {
        setScripts(data.scripts || [])
      } else {
        setError(data.error || 'Failed to load scripts')
      }
    } catch (err) {
      console.error('Failed to load scripts:', err)
      setError('Failed to load scripts')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Generate new script using RAG pipeline
   */
  const generateScript = async (demoMode = false) => {
    if (!topic.trim() || !sessionId) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const endpoint = demoMode ? '/api/generate-script/demo' : '/api/generate-script'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          topic: topic.trim(),
          duration,
          tone,
          audience,
          variations,
          tags: ['ai-generated', 'live-session']
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Add new scripts to the list
        setScripts(prev => [...data.scripts, ...prev])
        
        // Clear form
        setTopic('')
        
        // Show success message
        const mode = demoMode ? ' (DEMO)' : ''
        console.log(`✅ Generated ${data.scripts.length} script(s) successfully${mode}!`)
        
        if (data.warning) {
          setError(`Success: ${data.message}\n\nNote: ${data.warning}`)
        }
      } else {
        setError(data.error || 'Failed to generate script')
        if (data.suggestion) {
          setError(`${data.error}\n\nSuggestion: ${data.suggestion}`)
        }
      }
    } catch (err) {
      console.error('Script generation error:', err)
      setError('Failed to generate script. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * View script details
   */
  const viewScript = async (scriptId: string) => {
    try {
      const response = await fetch(`/api/generate-script?scriptId=${scriptId}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedScript(data.script)
      } else {
        setError('Failed to load script details')
      }
    } catch (err) {
      console.error('Failed to load script:', err)
      setError('Failed to load script details')
    }
  }

  /**
   * Download script as text file
   */
  const downloadScript = (script: GeneratedScript) => {
    const content = `# ${script.topic}\n\n**Generated:** ${new Date(script.generatedAt).toLocaleString()}\n**Duration:** ${script.duration} minutes\n**Tone:** ${script.tone}\n**Audience:** ${script.audience}\n**Confidence:** ${(script.confidence * 100).toFixed(1)}%\n\n---\n\n${script.content}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `script-${script.topic.replace(/\s+/g, '-').toLowerCase()}-${script.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Load scripts on component mount
  useEffect(() => {
    loadScripts()
  }, [sessionId])

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wand2 className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">AI Script Generator</h2>
        </div>
        <button
          onClick={loadScripts}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh scripts"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 whitespace-pre-line">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Script Generation Form */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Script</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Topic Input */}
          <div className="md:col-span-2">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Topic / Subject *
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Introduction to x402 payments, Blockchain technology overview"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isGenerating}
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
              min="1"
              max="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isGenerating}
            />
          </div>

          {/* Tone */}
          <div>
            <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isGenerating}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="educational">Educational</option>
              <option value="entertaining">Entertaining</option>
            </select>
          </div>

          {/* Audience */}
          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., developers, business professionals, students"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isGenerating}
            />
          </div>

          {/* Variations */}
          <div>
            <label htmlFor="variations" className="block text-sm font-medium text-gray-700 mb-2">
              Variations
            </label>
            <input
              type="number"
              id="variations"
              value={variations}
              onChange={(e) => setVariations(Math.max(1, Math.min(3, parseInt(e.target.value) || 1)))}
              min="1"
              max="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <p className="mb-2">
            <strong>Generate Script:</strong> Uses AWS Bedrock Nova AI for production-quality scripts (requires AWS permissions).
          </p>
          <p>
            <strong>Try Demo:</strong> Shows the complete RAG pipeline working with mock script generation (no AWS permissions needed).
          </p>
        </div>

        {/* Generate Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => generateScript(false)}
            disabled={!topic.trim() || isGenerating}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              !topic.trim() || isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Script
              </>
            )}
          </button>
          
          <button
            onClick={() => generateScript(true)}
            disabled={!topic.trim() || isGenerating}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              !topic.trim() || isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title="Generate script using demo mode (no AWS permissions required)"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Demo...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Try Demo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scripts List */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Generated Scripts ({scripts.length})
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading scripts...</p>
          </div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No scripts generated yet.</p>
            <p className="text-sm">Generate your first script using the form above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scripts.map((script) => (
              <div key={script.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{script.topic}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {script.duration}min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {script.tone}
                      </span>
                      <span className={`capitalize px-2 py-1 rounded text-xs ${
                        script.status === 'demo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {script.status === 'demo' ? 'DEMO' : script.status}
                      </span>
                      <span className="text-xs">
                        {(script.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewScript(script.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View script"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadScript(script)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Download script"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Generated: {new Date(script.generatedAt).toLocaleString()}
                </div>
                
                <div className="text-sm text-gray-700 line-clamp-3">
                  {script.content.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Script Detail Modal */}
      {selectedScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">{selectedScript.topic}</h3>
              <button
                onClick={() => setSelectedScript(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <div className="font-medium">{selectedScript.duration} minutes</div>
                </div>
                <div>
                  <span className="text-gray-500">Tone:</span>
                  <div className="font-medium capitalize">{selectedScript.tone}</div>
                </div>
                <div>
                  <span className="text-gray-500">Audience:</span>
                  <div className="font-medium">{selectedScript.audience}</div>
                </div>
                <div>
                  <span className="text-gray-500">Confidence:</span>
                  <div className="font-medium">{(selectedScript.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <h4 className="text-lg font-medium mb-3">Script Content</h4>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedScript.content}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => downloadScript(selectedScript)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setSelectedScript(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScriptGenerator 