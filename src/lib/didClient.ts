/**
 * D-ID Live Avatar Integration
 * Handles D-ID API calls for live avatar sessions
 */
import { env } from './env'

export interface DIDAvatarConfig {
  agentId: string
  script: string
  voice?: string
  language?: string
}

export interface DIDLiveSession {
  sessionId: string
  status: 'starting' | 'live' | 'ended' | 'error'
  avatarUrl?: string
  error?: string
}

export interface DIDResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * D-ID API Client
 */
class DIDClient {
  private apiKey: string
  private baseUrl: string = 'https://api.d-id.com'

  constructor() {
    this.apiKey = env.DID_API_KEY || 'dummy-api-key-for-demo'
    console.log('🎭 Initializing D-ID client with API key:', this.apiKey.substring(0, 10) + '...')
  }

  /**
   * Create a live avatar session
   */
  async createLiveSession(config: DIDAvatarConfig): Promise<DIDResponse> {
    try {
      console.log('🎬 Creating D-ID live session...')
      console.log('  Agent ID:', config.agentId)
      console.log('  Script length:', config.script.length, 'characters')

      // For demo purposes, simulate D-ID API call
      if (this.apiKey === 'dummy-api-key-for-demo') {
        console.log('🎭 Using demo mode for D-ID (API key not configured)')
        return this.createDemoSession(config)
      }

      const response = await fetch(`${this.baseUrl}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: config.agentId,
          script: {
            type: 'text',
            input: config.script,
            voice: config.voice || 'en-US-AriaNeural',
            language: config.language || 'en-US'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`D-ID API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ D-ID live session created successfully')
      
      return {
        success: true,
        data: {
          sessionId: data.id,
          status: 'starting',
          avatarUrl: data.avatar_url
        }
      }

    } catch (error) {
      console.error('❌ Failed to create D-ID live session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get live session status
   */
  async getSessionStatus(sessionId: string): Promise<DIDResponse> {
    try {
      if (this.apiKey === 'dummy-api-key-for-demo') {
        return this.getDemoSessionStatus(sessionId)
      }

      const response = await fetch(`${this.baseUrl}/talks/streams/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get session status: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: {
          sessionId: data.id,
          status: data.status,
          avatarUrl: data.avatar_url
        }
      }

    } catch (error) {
      console.error('❌ Failed to get session status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * End a live session
   */
  async endSession(sessionId: string): Promise<DIDResponse> {
    try {
      if (this.apiKey === 'dummy-api-key-for-demo') {
        return this.endDemoSession(sessionId)
      }

      const response = await fetch(`${this.baseUrl}/talks/streams/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`)
      }

      return {
        success: true,
        data: { sessionId, status: 'ended' }
      }

    } catch (error) {
      console.error('❌ Failed to end session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Demo mode implementations
   */
  private createDemoSession(config: DIDAvatarConfig): DIDResponse {
    const sessionId = `demo_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Simulate processing delay
    setTimeout(() => {
      console.log('🎭 Demo session would be live now:', sessionId)
    }, 2000)

    return {
      success: true,
      data: {
        sessionId,
        status: 'starting',
        avatarUrl: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Demo+Avatar'
      }
    }
  }

  private getDemoSessionStatus(sessionId: string): DIDResponse {
    return {
      success: true,
      data: {
        sessionId,
        status: 'live',
        avatarUrl: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Demo+Avatar'
      }
    }
  }

  private endDemoSession(sessionId: string): DIDResponse {
    return {
      success: true,
      data: {
        sessionId,
        status: 'ended'
      }
    }
  }
}

// Export singleton instance
export const didClient = new DIDClient()
