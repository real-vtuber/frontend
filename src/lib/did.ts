/**
 * D-ID Avatar Integration
 * Handles live avatar sessions and script presentation
 * Hardcoded demo values for hackathon
 */
import { env } from './env'

// Hardcoded values for hackathon demo
const DEMO_DID_CONFIG = {
  CLIENT_KEY: 'demo_client_key_12345',
  AGENT_ID: 'demo_agent_id_67890',
  API_KEY: 'demo_api_key_abcdef',
  API_URL: 'https://api.d-id.com',
  WEBSOCKET_URL: 'wss://api.d-id.com/ws'
}

export interface DIDAvatarConfig {
  agentId: string
  script: string
  voice?: string
  language?: string
  quality?: 'high' | 'medium' | 'low'
}

export interface DIDLiveSession {
  sessionId: string
  agentId: string
  status: 'connecting' | 'connected' | 'speaking' | 'idle' | 'disconnected'
  isLive: boolean
  currentScript?: string
  startTime?: Date
  endTime?: Date
}

export interface DIDMessage {
  type: 'start' | 'stop' | 'script' | 'status' | 'error'
  data?: any
  timestamp: string
}

/**
 * Initialize D-ID Avatar session
 */
export async function initializeDIDAvatar(config: DIDAvatarConfig): Promise<DIDLiveSession> {
  console.log('🎭 Initializing D-ID Avatar...')
  console.log('  Agent ID:', config.agentId)
  console.log('  Script length:', config.script.length)
  console.log('  Voice:', config.voice || 'en-US-Standard-A')
  
  // For demo purposes, simulate successful initialization
  const session: DIDLiveSession = {
    sessionId: `did_session_${Date.now()}`,
    agentId: config.agentId,
    status: 'connecting',
    isLive: false,
    currentScript: config.script,
    startTime: new Date()
  }
  
  // Simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  session.status = 'connected'
  session.isLive = true
  
  console.log('✅ D-ID Avatar initialized successfully')
  console.log('  Session ID:', session.sessionId)
  console.log('  Status:', session.status)
  
  return session
}

/**
 * Start live avatar presentation
 */
export async function startAvatarPresentation(session: DIDLiveSession, script: string): Promise<boolean> {
  console.log('🎬 Starting avatar presentation...')
  console.log('  Session ID:', session.sessionId)
  console.log('  Script preview:', script.substring(0, 100) + '...')
  
  try {
    // Simulate starting presentation
    session.status = 'speaking'
    session.currentScript = script
    
    // In a real implementation, this would:
    // 1. Send script to D-ID API
    // 2. Start WebSocket connection
    // 3. Handle real-time audio/video stream
    
    console.log('✅ Avatar presentation started')
    console.log('  Status:', session.status)
    console.log('  Script length:', script.length, 'characters')
    
    return true
    
  } catch (error) {
    console.error('❌ Failed to start avatar presentation:', error)
    session.status = 'disconnected'
    return false
  }
}

/**
 * Stop avatar presentation
 */
export async function stopAvatarPresentation(session: DIDLiveSession): Promise<boolean> {
  console.log('⏹️ Stopping avatar presentation...')
  
  try {
    session.status = 'idle'
    session.isLive = false
    session.endTime = new Date()
    
    console.log('✅ Avatar presentation stopped')
    console.log('  Status:', session.status)
    console.log('  Duration:', session.endTime.getTime() - (session.startTime?.getTime() || 0), 'ms')
    
    return true
    
  } catch (error) {
    console.error('❌ Failed to stop avatar presentation:', error)
    return false
  }
}

/**
 * Get avatar status
 */
export function getAvatarStatus(session: DIDLiveSession): string {
  return session.status
}

/**
 * Check if avatar is live
 */
export function isAvatarLive(session: DIDLiveSession): boolean {
  return session.isLive && session.status === 'speaking'
}

/**
 * Get demo configuration
 */
export function getDemoConfig(): typeof DEMO_DID_CONFIG {
  return DEMO_DID_CONFIG
}

/**
 * Create WebSocket connection for real-time updates
 */
export function createDIDWebSocket(sessionId: string): WebSocket | null {
  try {
    // For demo, return null (no real WebSocket)
    console.log('🔌 WebSocket connection would be created for session:', sessionId)
    console.log('  URL:', DEMO_DID_CONFIG.WEBSOCKET_URL)
    return null
  } catch (error) {
    console.error('❌ Failed to create WebSocket:', error)
    return null
  }
}

/**
 * Parse script for D-ID presentation
 */
export function parseScriptForDID(script: string): string {
  // Clean up script for D-ID presentation
  let cleanedScript = script
    .replace(/#+/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
    .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
    .trim()
  
  // Add natural pauses
  cleanedScript = cleanedScript
    .replace(/\. /g, '. ')
    .replace(/\? /g, '? ')
    .replace(/! /g, '! ')
  
  // Add demo introduction
  cleanedScript = `Hello everyone, welcome to our live presentation. ${cleanedScript}`
  
  return cleanedScript
}

/**
 * Estimate presentation duration
 */
export function estimatePresentationDuration(script: string): number {
  const wordsPerMinute = 150 // Average speaking rate
  const wordCount = script.split(/\s+/).length
  const minutes = Math.max(1, Math.round(wordCount / wordsPerMinute))
  console.log(`📊 Estimated duration: ${minutes} minutes (${wordCount} words)`)
  return minutes
}

/**
 * Get demo script for testing
 */
export function getDemoScript(): string {
  return `Welcome to our live session. Today we will discuss the x402 payment standard and its impact on AI agent commerce. This innovative protocol enables autonomous AI systems to make micropayments for digital services and data access. The x402 standard represents a significant advancement in machine-native transactions, allowing AI agents to autonomously pay for services without human intervention.`
}
