import { config } from 'dotenv'

// Load environment variables from .env file
config()

/**
 * Environment configuration
 * Centralizes all environment variable access with proper typing
 * Loads from .env file using dotenv
 */

export const env = {
  // AWS Configuration
  AWS_REGION: process.env.AWS_REGION || 'ap-southeast-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || '',
  AWS_DYNAMODB_NAME: process.env.AWS_DYNAMODB_NAME || '',

  // Pinecone Configuration
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  PINECONE_INDEX: process.env.PINECONE_INDEX || 'knowledge-index',
  PINECONE_REGION: process.env.PINECONE_REGION || 'us-west-2',
  PINECONE_PROXY_URL: process.env.PINECONE_PROXY_URL,

  // Kendra Configuration
  KENDRA_INDEX_ID: process.env.KENDRA_INDEX_ID || '',

  // Bedrock Configuration
  BEDROCK_REGION: process.env.BEDROCK_REGION || 'ap-southeast-1',
  BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || '',
  BEDROCK_API_KEY: process.env.BEDROCK_API_KEY || '',
  BEDROCK_NOVA_ACCESS_KEY: process.env.BEDROCK_NOVA_ACCESS_KEY || '',
  BEDROCK_NOVA_ACCESS_KEY_SECRET: process.env.BEDROCK_NOVA_ACCESS_KEY_SECRET || '',

  // D-ID Configuration
  DID_CLIENT_KEY: process.env.DID_CLIENT_KEY || '',
  DID_AGENT_ID: process.env.DID_AGENT_ID || '',

  // Next.js Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const requiredVars = [
    'PINECONE_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'BEDROCK_API_KEY',
    'BEDROCK_NOVA_ACCESS_KEY',
    'BEDROCK_NOVA_ACCESS_KEY_SECRET'
  ] as const

  const missing = requiredVars.filter(key => !env[key])
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`)
    console.warn('Please check your .env file and Document/ENV.md for setup instructions')
    return false
  }

  return true
}

/**
 * Get environment variable with validation
 */
export function getEnv(key: keyof typeof env): string {
  const value = env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not set. Please check your .env file.`)
  }
  return value
} 