/**
 * AWS Bedrock Nova AI Integration
 * Handles script generation using RAG from Pinecone knowledge base
 */
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { env, validateEnv } from './env'

let bedrockClient: BedrockRuntimeClient | null = null

/**
 * Get or initialize Bedrock client
 */
export function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    if (!validateEnv()) {
      throw new Error('Required environment variables are missing for Bedrock')
    }
    
    if (!env.BEDROCK_NOVA_ACCESS_KEY || !env.BEDROCK_NOVA_ACCESS_KEY_SECRET) {
      throw new Error('BEDROCK_NOVA_ACCESS_KEY and BEDROCK_NOVA_ACCESS_KEY_SECRET environment variables are required for Bedrock access')
    }
    
    console.log('🔧 Initializing Bedrock client for region:', env.BEDROCK_REGION)
    console.log('🔑 Using Bedrock Nova Access Key:', env.BEDROCK_NOVA_ACCESS_KEY.substring(0, 10) + '...')
    
    // Configure Bedrock client with dedicated Nova credentials
    bedrockClient = new BedrockRuntimeClient({
      region: env.BEDROCK_REGION,
      credentials: {
        accessKeyId: env.BEDROCK_NOVA_ACCESS_KEY,
        secretAccessKey: env.BEDROCK_NOVA_ACCESS_KEY_SECRET,
      },
    })
  }
  return bedrockClient
}

/**
 * Interface for script generation request
 */
export interface ScriptGenerationRequest {
  sessionId: string
  topic: string
  context?: string
  duration?: number // in minutes
  tone?: 'professional' | 'casual' | 'educational' | 'entertaining'
  audience?: string
}

/**
 * Interface for generated script
 */
export interface GeneratedScript {
  id: string
  sessionId: string
  topic: string
  content: string
  duration: number
  tone: string
  audience: string
  sourceContext: string[]
  generatedAt: string
  metadata: {
    modelUsed: string
    tokensUsed?: number
    confidence?: number
  }
}

/**
 * Generate script using Bedrock Nova AI with RAG context
 * @param request Script generation parameters
 * @param knowledgeContext Retrieved context from Pinecone
 * @returns Promise<GeneratedScript>
 */
export async function generateScript(
  request: ScriptGenerationRequest,
  knowledgeContext: string[]
): Promise<GeneratedScript> {
  try {
    console.log('🤖 Generating script with Bedrock Nova AI...')
    console.log('  Topic:', request.topic)
    console.log('  Context chunks:', knowledgeContext.length)
    
    const client = getBedrockClient()
    
    // Prepare the prompt with RAG context
    const contextText = knowledgeContext.join('\n\n')
    const prompt = buildScriptPrompt(request, contextText)
    
    console.log('📝 Prompt length:', prompt.length, 'characters')
    
    // Use the model ID directly from environment (supports ARN format)
    const modelId = env.BEDROCK_MODEL_ID
    
    console.log('🔧 Using model ID from env:', modelId)
    
    // Prepare the request payload - support both Nova and Anthropic models
    let requestPayload
    
    if (modelId.includes('nova')) {
      // Nova models use a different format
      requestPayload = {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ],
        inferenceConfig: {
          max_new_tokens: 4000,
          temperature: 0.7,
          top_p: 0.9
        }
      }
    } else {
      // Anthropic models use this format
      requestPayload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }
    }
    
    // Invoke Bedrock AI
    const command = new InvokeModelCommand({
          modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestPayload)
    })
    
            console.log('🚀 Invoking Bedrock model:', modelId)
    const response = await client.send(command)
    
    if (!response.body) {
      throw new Error('No response body from Bedrock')
    }
    
    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    console.log('✅ Bedrock response received')
    
    // Handle different response formats for different models
    let scriptContent = ''
    if (responseBody.output?.message?.content?.[0]?.text) {
      // Nova model response format
      scriptContent = responseBody.output.message.content[0].text
    } else if (responseBody.content?.[0]?.text) {
      // Anthropic model response format
      scriptContent = responseBody.content[0].text
    } else if (responseBody.completion) {
      // Legacy completion format
      scriptContent = responseBody.completion
    } else {
      console.warn('Unknown response format:', responseBody)
      scriptContent = JSON.stringify(responseBody, null, 2)
    }
    
    if (!scriptContent) {
      throw new Error('No script content generated')
    }
    
    // Create the generated script object
    const generatedScript: GeneratedScript = {
      id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: request.sessionId,
      topic: request.topic,
      content: scriptContent.trim(),
      duration: request.duration || estimateScriptDuration(scriptContent),
      tone: request.tone || 'professional',
      audience: request.audience || 'general',
      sourceContext: knowledgeContext.map(ctx => ctx.substring(0, 200) + '...'),
      generatedAt: new Date().toISOString(),
                          metadata: {
            modelUsed: modelId,
            tokensUsed: responseBody.usage?.totalTokens || responseBody.usage?.total_tokens || undefined,
            confidence: calculateConfidenceScore(scriptContent, knowledgeContext)
          }
    }
    
    console.log('📋 Script generated successfully:')
    console.log('  Length:', scriptContent.length, 'characters')
    console.log('  Estimated duration:', generatedScript.duration, 'minutes')
    console.log('  Confidence:', generatedScript.metadata.confidence)
    
    return generatedScript
    
  } catch (error) {
    console.error('❌ Failed to generate script:', error)
    throw new Error(`Script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Build the prompt for script generation
 */
function buildScriptPrompt(request: ScriptGenerationRequest, context: string): string {
  const { topic, tone = 'professional', audience = 'general', duration = 5 } = request
  
  return `You are an expert script writer for AI avatars in live sessions. Generate an engaging, informative script based on the provided context.

**CONTEXT INFORMATION:**
${context}

**SCRIPT REQUIREMENTS:**
- Topic: ${topic}
- Tone: ${tone}
- Target Audience: ${audience}
- Duration: ${duration} minutes (approximately ${duration * 150} words)
- Format: Natural, conversational script suitable for AI avatar presentation

**INSTRUCTIONS:**
1. Use ONLY the information provided in the context above
2. Create a natural, flowing script that an AI avatar can present
3. Include smooth transitions between topics
4. Make it engaging and appropriate for a live session
5. Add natural pauses and emphasis markers where appropriate
6. Structure with clear introduction, main content, and conclusion
7. If context is insufficient, acknowledge limitations and work with available information

**SCRIPT FORMAT:**
- Use natural speech patterns
- Include [PAUSE] markers for natural breaks
- Use *emphasis* for important points
- Structure in clear paragraphs
- End with a call-to-action or summary

Generate the script now:`
}

/**
 * Estimate script duration based on word count
 * Average speaking rate: 150 words per minute
 */
function estimateScriptDuration(script: string): number {
  const wordCount = script.split(/\s+/).length
  const duration = Math.ceil(wordCount / 150)
  return Math.max(1, duration) // Minimum 1 minute
}

/**
 * Calculate confidence score based on context relevance
 */
function calculateConfidenceScore(script: string, context: string[]): number {
  if (context.length === 0) return 0.1
  
  // Simple confidence calculation based on context usage
  const scriptWords = script.toLowerCase().split(/\s+/)
  const contextWords = context.join(' ').toLowerCase().split(/\s+/)
  
  const commonWords = scriptWords.filter(word => 
    word.length > 3 && contextWords.includes(word)
  )
  
  const confidence = Math.min(0.95, commonWords.length / scriptWords.length * 2)
  return Math.round(confidence * 100) / 100
}

/**
 * Generate multiple script variations
 */
export async function generateScriptVariations(
  request: ScriptGenerationRequest,
  knowledgeContext: string[],
  variations: number = 3
): Promise<GeneratedScript[]> {
  const scripts: GeneratedScript[] = []
  
  for (let i = 0; i < variations; i++) {
    const variationRequest = {
      ...request,
      topic: `${request.topic} (Variation ${i + 1})`
    }
    
    const script = await generateScript(variationRequest, knowledgeContext)
    scripts.push(script)
    
    // Small delay between generations
    if (i < variations - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return scripts
} 