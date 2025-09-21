'use client'

import React, { useState, useEffect, useRef } from 'react'
import { DIDAgent, DIDAgentStream, DIDAgentMessage, didAgentsClient, createX402DemoAgent } from '../lib/didAgents'

interface DIDAgentProps {
  sessionId: string
  isAdmin?: boolean
  onStatusChange?: (status: string) => void
}

/**
 * D-ID Agent Component
 * Displays a live conversational AI agent using D-ID Agents API
 * Based on https://docs.d-id.com/reference/agents-overview
 */
const DIDAgent: React.FC<DIDAgentProps> = ({ 
  sessionId, 
  isAdmin = false, 
  onStatusChange 
}) => {
  const [agent, setAgent] = useState<DIDAgent | null>(null)
  const [stream, setStream] = useState<DIDAgentStream | null>(null)
  const [messages, setMessages] = useState<DIDAgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize agent when component mounts
  useEffect(() => {
    if (sessionId && !agent) {
      initializeAgent()
    }
  }, [sessionId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeAgent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🤖 Initializing D-ID Agent...')
      
      // Create or get the x402 demo agent
      const demoAgent = await createX402DemoAgent()
      if (!demoAgent) {
        throw new Error('Failed to create demo agent')
      }
      
      setAgent(demoAgent)
      onStatusChange?.('agent_ready')
      
      // Add welcome message
      const welcomeMessage: DIDAgentMessage = {
        type: 'agent',
        content: `Hello! I'm your AI assistant specializing in the x402 payment standard. I can explain how this innovative protocol enables AI agents to make autonomous micropayments. What would you like to know?`,
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      }
      setMessages([welcomeMessage])
      
      console.log('✅ D-ID Agent initialized successfully')
      
    } catch (err) {
      console.error('Failed to initialize agent:', err)
      setError('Failed to initialize D-ID Agent. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const startLiveSession = async () => {
    if (!agent) return
    
    setIsLoading(true)
    try {
      console.log('🎬 Starting live agent session...')
      
      const result = await didAgentsClient.createAgentStream(agent.id)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create agent stream')
      }
      
      setStream(result.data)
      setIsLive(true)
      onStatusChange?.('live')
      
      console.log('✅ Live agent session started')
      
    } catch (err) {
      console.error('Failed to start live session:', err)
      setError('Failed to start live session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const stopLiveSession = async () => {
    setIsLive(false)
    setStream(null)
    onStatusChange?.('stopped')
    console.log('⏹️ Live agent session stopped')
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || !stream || !isLive) return
    
    const userMessage: DIDAgentMessage = {
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date().toISOString(),
      sessionId: stream.sessionId
    }
    
    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsTyping(true)
    
    try {
      // Send message to agent
      const result = await didAgentsClient.sendMessage(stream.sessionId, userMessage.content)
      
      if (result.success) {
        // Simulate agent response (in real implementation, this would come from WebSocket)
        setTimeout(() => {
          const agentResponse: DIDAgentMessage = {
            type: 'agent',
            content: generateAgentResponse(userMessage.content),
            timestamp: new Date().toISOString(),
            sessionId: stream.sessionId
          }
          setMessages(prev => [...prev, agentResponse])
          setIsTyping(false)
        }, 1500)
      }
      
    } catch (err) {
      console.error('Failed to send message:', err)
      setIsTyping(false)
    }
  }

  const generateAgentResponse = (userMessage: string): string => {
    const responses = [
      "That's a great question about x402! The x402 payment standard is designed to enable AI agents to make autonomous micropayments for digital services and data access.",
      "The key benefit of x402 is that it eliminates the need for traditional payment methods like credit cards or bank transfers, allowing AI systems to pay for services in real-time.",
      "x402 uses HTTP 402 status codes to request payment, and AI agents can respond with cryptographically signed payment authorizations using stablecoins like USDC.",
      "This enables true pay-per-use access without subscriptions or manual invoicing, which is essential for autonomous AI systems.",
      "The protocol supports instant settlement in about 200 milliseconds, which is much faster than traditional payment systems.",
      "x402 is chain-agnostic and can work with any blockchain network, making it flexible for different AI applications.",
      "Would you like me to explain any specific aspect of x402 in more detail?"
    ]
    
    // Simple keyword-based response selection
    const message = userMessage.toLowerCase()
    if (message.includes('what') || message.includes('explain')) {
      return responses[0]
    } else if (message.includes('benefit') || message.includes('advantage')) {
      return responses[1]
    } else if (message.includes('how') || message.includes('work')) {
      return responses[2]
    } else if (message.includes('autonomous') || message.includes('ai')) {
      return responses[3]
    } else if (message.includes('speed') || message.includes('fast')) {
      return responses[4]
    } else if (message.includes('blockchain') || message.includes('crypto')) {
      return responses[5]
    } else {
      return responses[6]
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agent_ready': return 'text-green-600 bg-green-100'
      case 'live': return 'text-blue-600 bg-blue-100'
      case 'stopped': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agent_ready': return 'Agent Ready'
      case 'live': return 'Live'
      case 'stopped': return 'Stopped'
      default: return 'Unknown'
    }
  }

  if (isLoading && !agent) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing D-ID Agent...</p>
          <p className="text-sm text-gray-500 mt-2">Creating AI assistant...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={initializeAgent}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Agent Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{agent?.preview_name || 'AI Agent'}</h3>
            <p className="text-sm text-gray-500">D-ID Conversational Agent</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isLive ? 'live' : 'agent_ready')}`}>
            {getStatusText(isLive ? 'live' : 'agent_ready')}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-75 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 ml-2">Agent is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      {isAdmin && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 mb-4">
            {!isLive ? (
              <button
                onClick={startLiveSession}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <span>🎬</span>
                    <span>Start Live Session</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={stopLiveSession}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <span>⏹️</span>
                <span>Stop Live Session</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message Input */}
      {isLive && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about x402 payment standard..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isTyping}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Demo Info */}
      <div className="bg-blue-50 border-t border-blue-200 p-3">
        <p className="text-sm text-blue-800">
          <strong>Demo Mode:</strong> This is a simulated D-ID Agent conversation. 
          In production, this would connect to the real D-ID Agents API with WebSocket streaming.
        </p>
      </div>
    </div>
  )
}

export default DIDAgent
