import { Pinecone, type PineconeConfiguration } from '@pinecone-database/pinecone'
import { ProxyAgent, type Dispatcher } from 'undici'
import { env, validateEnv } from './env'

/**
 * Pinecone client configuration with proxy support
 * Based on Pinecone TypeScript SDK documentation
 * Uses environment variables from .env file via centralized env config
 */

// Custom fetch function with proxy support (if needed)
const createCustomFetch = () => {
  // Check if proxy configuration is needed
  const proxyUrl = env.PINECONE_PROXY_URL
  
  if (proxyUrl) {
    const proxyAgent = new ProxyAgent({
      uri: proxyUrl,
      // Add additional proxy configuration if needed
    })
    
    return (input: string | URL | Request, init: RequestInit | undefined) => {
      return fetch(input, {
        ...init,
        // @ts-ignore - undici dispatcher is not in standard RequestInit
        dispatcher: proxyAgent as Dispatcher,
        keepalive: true,
      } as RequestInit)
    }
  }
  
  // Return default fetch if no proxy needed
  return undefined
}

// Pinecone client configuration
const pineconeConfig: PineconeConfiguration = {
  apiKey: env.PINECONE_API_KEY,
  maxRetries: 5,
  // Add custom fetch if proxy is configured
  ...(createCustomFetch() && { fetchApi: createCustomFetch() })
}

// Initialize Pinecone client (only if API key is available)
let pinecone: Pinecone | null = null

export function getPineconeClient(): Pinecone {
  if (!pinecone) {
    // Validate environment variables
    if (!validateEnv()) {
      throw new Error('Required environment variables are missing. Please check your .env file and Document/ENV.md for setup instructions.')
    }
    
    if (!env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required. Please check your .env file and Document/ENV.md for setup instructions.')
    }
    
    console.log('🔧 Initializing Pinecone client with API key:', env.PINECONE_API_KEY.substring(0, 10) + '...')
    pinecone = new Pinecone(pineconeConfig)
  }
  return pinecone
}

// Default index name (using PINECONE_INDEX from .env)
export const DEFAULT_INDEX_NAME = env.PINECONE_INDEX

/**
 * Get or create Pinecone index
 * Creates a serverless index if it doesn't exist
 */
export async function getOrCreateIndex(indexName: string = DEFAULT_INDEX_NAME) {
  try {
    const client = getPineconeClient()
    
    // Check if index exists
    const indexList = await client.listIndexes()
    const existingIndex = indexList.indexes?.find(index => index.name === indexName)
    
    if (existingIndex) {
      console.log(`Using existing Pinecone index: ${indexName}`)
      return client.index(indexName)
    }
    
    // Create new serverless index
    console.log(`Creating new Pinecone index: ${indexName}`)
    await client.createIndex({
      name: indexName,
      dimension: 1536, // OpenAI text-embedding-ada-002 dimension
      spec: {
        serverless: {
          cloud: 'aws',
          region: env.PINECONE_REGION,
        },
      },
              tags: { 
          project: 'realvtuber',
          environment: env.NODE_ENV
        },
      waitUntilReady: true,
    })
    
    return client.index(indexName)
  } catch (error) {
    console.error('Failed to get or create Pinecone index:', error)
    throw error
  }
}

/**
 * Generate embeddings using Pinecone's inference API
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const client = getPineconeClient()
    const BATCH_SIZE = 90 // Pinecone has a limit of 96 inputs per request, use 90 for safety
    const allEmbeddings: number[][] = []
    
    console.log(`🔄 Generating embeddings for ${texts.length} texts in batches of ${BATCH_SIZE}`)
    
    // Process in batches
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)
      console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} items)`)
      
      const response = await client.inference.embed(
        'multilingual-e5-large', // Using Pinecone's hosted embedding model
        batch,
        { inputType: 'passage', truncate: 'END' }
      )
      
      const batchEmbeddings = response.data.map(item => {
        if ('values' in item) {
          return item.values || []
        }
        // Handle sparse vectors or other formats
        return []
      })
      
      allEmbeddings.push(...batchEmbeddings)
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log(`✅ Generated ${allEmbeddings.length} embeddings successfully`)
    return allEmbeddings
  } catch (error) {
    console.error('Failed to generate embeddings:', error)
    throw error
  }
}

/**
 * Upsert vectors to Pinecone index
 */
export async function upsertVectors(
  indexName: string,
  vectors: Array<{
    id: string
    values: number[]
    metadata?: Record<string, any>
  }>,
  namespace?: string
) {
  try {
    const client = getPineconeClient()
    const index = client.index(indexName)
    
    const upsertResponse = await index.namespace(namespace || '').upsert(vectors)
    
    console.log(`Upserted ${vectors.length} vectors to index ${indexName}`)
    return upsertResponse
  } catch (error) {
    console.error('Failed to upsert vectors:', error)
    throw error
  }
}

/**
 * Query vectors from Pinecone index
 */
export async function queryVectors(
  indexName: string,
  queryVector: number[],
  topK: number = 5,
  namespace?: string,
  filter?: Record<string, any>,
  retries: number = 3
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Pinecone query attempt ${attempt}/${retries}`)
      
      const client = getPineconeClient()
      const index = client.index(indexName)
      
      const queryResponse = await Promise.race([
        index.namespace(namespace || '').query({
          vector: queryVector,
          topK,
          includeValues: false,
          includeMetadata: true,
          filter
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Pinecone query timeout after 20 seconds')), 20000)
        )
      ]) as any
      
      console.log('✅ Pinecone query successful')
      return queryResponse
      
    } catch (error) {
      console.error(`❌ Pinecone attempt ${attempt} failed:`, error)
      
      if (attempt === retries) {
        console.error('❌ All Pinecone retry attempts failed')
        throw error
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000
      console.log(`⏳ Waiting ${waitTime}ms before Pinecone retry...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
}

/**
 * Search knowledge base using text query
 * This function combines embedding generation and vector search
 */
export async function searchKnowledgeBase(
  query: string,
  sessionId?: string,
  topK: number = 10,
  indexName: string = DEFAULT_INDEX_NAME
): Promise<{
  matches: Array<{
    id: string
    score: number
    content: string
    metadata: any
  }>
  totalResults: number
}> {
  try {
    console.log('🔍 Searching knowledge base for:', query)
    console.log('  Session ID:', sessionId || 'all sessions')
    console.log('  Top K results:', topK)
    
    // Generate embedding for the query
    const queryEmbeddings = await generateEmbeddings([query])
    if (queryEmbeddings.length === 0 || queryEmbeddings[0].length === 0) {
      throw new Error('Failed to generate query embedding')
    }
    
    const queryVector = queryEmbeddings[0]
    console.log('✅ Query embedding generated, dimension:', queryVector.length)
    
    // Build filter for session-specific search
    const filter: Record<string, any> = {}
    if (sessionId) {
      filter.sessionId = { $eq: sessionId }
    }
    
    // Search vectors in Pinecone
    const namespace = sessionId || '' // Use session-specific namespace if provided
    const searchResults = await queryVectors(
      indexName,
      queryVector,
      topK,
      namespace,
      Object.keys(filter).length > 0 ? filter : undefined
    )
    
    console.log('📊 Search results:', searchResults.matches?.length || 0, 'matches')
    
    // Format results
    const matches = (searchResults.matches || []).map((match: any) => ({
      id: match.id || '',
      score: match.score || 0,
      content: String(match.metadata?.content || ''),
      metadata: match.metadata || {}
    }))
    
    // Log top results for debugging
    matches.slice(0, 3).forEach((match: any, index: number) => {
      console.log(`  Result ${index + 1}: Score ${match.score?.toFixed(3)}, Content: ${match.content.substring(0, 100)}...`)
    })
    
    return {
      matches,
      totalResults: matches.length
    }
    
  } catch (error) {
    console.error('❌ Knowledge base search failed:', error)
    throw new Error(`Knowledge search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get relevant context for script generation
 * Searches knowledge base and returns formatted context strings
 */
export async function getRelevantContext(
  topic: string,
  sessionId?: string,
  maxContexts: number = 5
): Promise<string[]> {
  try {
    console.log('📚 Retrieving relevant context for topic:', topic)
    
    // Search for relevant content
    const searchResults = await searchKnowledgeBase(topic, sessionId, maxContexts * 2) // Get more results to filter
    
    // Filter and format context
    const contexts = searchResults.matches
      .filter(match => match.score > 0.7) // Only use high-confidence matches
      .slice(0, maxContexts) // Limit to requested number
      .map(match => {
        const content = match.content
        const fileName = match.metadata?.fileName || 'Unknown source'
        return `[Source: ${fileName}]\n${content}`
      })
    
    console.log(`✅ Retrieved ${contexts.length} relevant contexts`)
    contexts.forEach((ctx, index) => {
      console.log(`  Context ${index + 1}: ${ctx.substring(0, 150)}...`)
    })
    
    return contexts
    
  } catch (error) {
    console.error('❌ Failed to retrieve context:', error)
    return [] // Return empty array instead of throwing to allow script generation to continue
  }
} 