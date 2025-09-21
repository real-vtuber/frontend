/**
 * D-ID Agents Integration
 * Handles D-ID Agents API calls for live conversational AI avatars
 * Based on https://docs.d-id.com/reference/agents-overview
 */
import { env } from './env'

// Hardcoded demo values for hackathon
const DEMO_AGENT_CONFIG = {
  CLIENT_KEY: 'demo_client_key_12345',
  AGENT_ID: 'demo_agent_id_67890',
  API_KEY: 'demo_api_key_abcdef',
  API_URL: 'https://api.d-id.com',
  WEBSOCKET_URL: 'wss://api.d-id.com/ws'
}

export interface DIDAgent {
  id: string
  preview_name: string
  status: 'created' | 'done' | 'error'
  presenter: {
    type: 'talk' | 'clip'
    voice: {
      type: 'microsoft' | 'elevenlabs' | 'amazon'
      voice_id: string
    }
    thumbnail: string
    source_url?: string
    presenter_id?: string
  }
  llm: {
    type: 'openai'
    provider: 'openai'
    model: string
    instructions: string
  }
  knowledge?: {
    provider: 'pinecone'
    id: string
  }
  created: string
  modified: string
}

export interface DIDAgentStream {
  sessionId: string
  agentId: string
  status: 'starting' | 'live' | 'ended' | 'error'
  streamUrl?: string
  error?: string
}

export interface DIDAgentMessage {
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
  sessionId: string
}

/**
 * D-ID Agents API Client
 */
class DIDAgentsClient {
  private apiKey: string
  private baseUrl: string = 'https://api.d-id.com'

  constructor() {
    this.apiKey = env.DID_API_KEY || 'dummy-api-key-for-demo'
    console.log('🤖 Initializing D-ID Agents client with API key:', this.apiKey.substring(0, 10) + '...')
  }

  /**
   * Create a new D-ID Agent
   */
  async createAgent(config: {
    preview_name: string
    instructions: string
    presenter_type: 'talk' | 'clip'
    voice_id?: string
    knowledge_id?: string
  }): Promise<{ success: boolean; data?: DIDAgent; error?: string }> {
    try {
      console.log('🤖 Creating D-ID Agent...')
      console.log('  Name:', config.preview_name)
      console.log('  Instructions:', config.instructions.substring(0, 100) + '...')

      // For demo purposes, simulate D-ID Agent creation
      if (this.apiKey === 'dummy-api-key-for-demo') {
        console.log('🤖 Using demo mode for D-ID Agents')
        return this.createDemoAgent(config)
      }

      const agentData = {
        presenter: {
          type: config.presenter_type,
          voice: {
            type: 'microsoft',
            voice_id: config.voice_id || 'en-US-JennyMultilingualV2Neural'
          },
          thumbnail: 'https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/thumbnail.jpeg',
          source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/thumbnail.jpeg'
        },
        llm: {
          type: 'openai',
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          instructions: config.instructions
        },
        preview_name: config.preview_name
      }

      const response = await fetch(`${this.baseUrl}/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`D-ID API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ D-ID Agent created successfully')
      
      return {
        success: true,
        data: data as DIDAgent
      }

    } catch (error) {
      console.error('❌ Failed to create D-ID Agent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get an existing agent
   */
  async getAgent(agentId: string): Promise<{ success: boolean; data?: DIDAgent; error?: string }> {
    try {
      if (this.apiKey === 'dummy-api-key-for-demo') {
        return this.getDemoAgent(agentId)
      }

      const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get agent: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data as DIDAgent
      }

    } catch (error) {
      console.error('❌ Failed to get agent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a live stream with an agent
   */
  async createAgentStream(agentId: string): Promise<{ success: boolean; data?: DIDAgentStream; error?: string }> {
    try {
      console.log('🎬 Creating D-ID Agent stream...')
      console.log('  Agent ID:', agentId)

      if (this.apiKey === 'dummy-api-key-for-demo') {
        return this.createDemoAgentStream(agentId)
      }

      const response = await fetch(`${this.baseUrl}/agents/${agentId}/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`D-ID API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ D-ID Agent stream created successfully')
      
      return {
        success: true,
        data: {
          sessionId: data.id,
          agentId: agentId,
          status: 'starting',
          streamUrl: data.stream_url
        }
      }

    } catch (error) {
      console.error('❌ Failed to create agent stream:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send a message to an agent
   */
  async sendMessage(streamId: string, message: string): Promise<{ success: boolean; data?: DIDAgentMessage; error?: string }> {
    try {
      console.log('💬 Sending message to agent...')
      console.log('  Stream ID:', streamId)
      console.log('  Message:', message.substring(0, 100) + '...')

      if (this.apiKey === 'dummy-api-key-for-demo') {
        return this.sendDemoMessage(streamId, message)
      }

      const response = await fetch(`${this.baseUrl}/agents/streams/${streamId}/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`D-ID API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Message sent successfully')
      
      return {
        success: true,
        data: {
          type: 'user',
          content: message,
          timestamp: new Date().toISOString(),
          sessionId: streamId
        }
      }

    } catch (error) {
      console.error('❌ Failed to send message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Demo mode implementations
   */
  private createDemoAgent(config: {
    preview_name: string
    instructions: string
    presenter_type: 'talk' | 'clip'
    voice_id?: string
    knowledge_id?: string
  }): { success: boolean; data?: DIDAgent; error?: string } {
    const agent: DIDAgent = {
      id: `demo_agent_${Date.now()}`,
      preview_name: config.preview_name,
      status: 'done',
      presenter: {
        type: config.presenter_type,
        voice: {
          type: 'microsoft',
          voice_id: config.voice_id || 'en-US-JennyMultilingualV2Neural'
        },
        thumbnail: 'https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/thumbnail.jpeg',
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/thumbnail.jpeg'
      },
      llm: {
        type: 'openai',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        instructions: config.instructions
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }

    if (config.knowledge_id) {
      agent.knowledge = {
        provider: 'pinecone',
        id: config.knowledge_id
      }
    }

    return {
      success: true,
      data: agent
    }
  }

  private getDemoAgent(agentId: string): { success: boolean; data?: DIDAgent; error?: string } {
    const agent: DIDAgent = {
      id: agentId,
      preview_name: 'Demo Agent',
      status: 'done',
      presenter: {
        type: 'talk',
        voice: {
          type: 'microsoft',
          voice_id: 'en-US-JennyMultilingualV2Neural'
        },
        thumbnail: 'https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/thumbnail.jpeg',
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/thumbnail.jpeg'
      },
      llm: {
        type: 'openai',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        instructions: 'You are a helpful AI assistant specializing in the x402 payment standard and AI agent commerce.'
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }

    return {
      success: true,
      data: agent
    }
  }

  private createDemoAgentStream(agentId: string): { success: boolean; data?: DIDAgentStream; error?: string } {
    const streamId = `demo_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      success: true,
      data: {
        sessionId: streamId,
        agentId: agentId,
        status: 'starting',
        streamUrl: `wss://demo.d-id.com/streams/${streamId}`
      }
    }
  }

  private sendDemoMessage(streamId: string, message: string): { success: boolean; data?: DIDAgentMessage; error?: string } {
    return {
      success: true,
      data: {
        type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        sessionId: streamId
      }
    }
  }
}

// Export singleton instance
export const didAgentsClient = new DIDAgentsClient()

/**
 * Create a demo agent for x402 presentation
 */
export async function createX402DemoAgent(): Promise<DIDAgent | null> {
  const config = {
    preview_name: 'X402 Payment Expert',
    instructions: `You are an expert on the x402 payment standard and AI agent commerce. You can explain:

- What x402 is and how it works
- The benefits of machine-native transactions
- How AI agents can autonomously pay for services
- The technical implementation details
- Real-world applications and use cases

Be conversational, helpful, and provide detailed explanations when asked. You're presenting to a live audience interested in learning about this innovative payment protocol.`,
    presenter_type: 'talk' as const,
    voice_id: 'en-US-JennyMultilingualV2Neural'
  }

  const result = await didAgentsClient.createAgent(config)
  return result.success ? result.data || null : null
}

/**
 * Get demo configuration
 */
export function getDemoAgentConfig(): typeof DEMO_AGENT_CONFIG {
  return DEMO_AGENT_CONFIG
}
