/**
 * AWS DynamoDB Integration
 * Handles storage and retrieval of generated scripts for D-ID Live Avatar sessions
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'
import { env, validateEnv } from './env'
import { GeneratedScript } from './bedrock'

let dynamoClient: DynamoDBClient | null = null
let docClient: DynamoDBDocumentClient | null = null

/**
 * Get or initialize DynamoDB clients
 */
export function getDynamoDBClient(): {
  client: DynamoDBClient
  docClient: DynamoDBDocumentClient
} {
  if (!dynamoClient || !docClient) {
    if (!validateEnv()) {
      throw new Error('Required environment variables are missing for DynamoDB')
    }
    
    console.log('🔧 Initializing DynamoDB client for region:', env.AWS_REGION)
    dynamoClient = new DynamoDBClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    })
    
    docClient = DynamoDBDocumentClient.from(dynamoClient)
  }
  
  return { client: dynamoClient, docClient }
}

/**
 * Interface for script storage in DynamoDB
 */
export interface StoredScript extends GeneratedScript {
  ttl?: number // Time to live for automatic cleanup
  status: 'draft' | 'active' | 'used' | 'archived'
  usageCount: number
  lastUsed?: string
  tags?: string[]
}

/**
 * Store generated script in DynamoDB
 */
export async function storeScript(script: GeneratedScript, tags: string[] = []): Promise<StoredScript> {
  try {
    console.log('💾 Storing script in DynamoDB scripts table:', script.id)
    
    const { docClient } = getDynamoDBClient()
    const tableName = 'scripts' // Use dedicated scripts table
    
    // Create stored script with additional metadata
    const storedScript: StoredScript = {
      ...script,
      status: 'draft',
      usageCount: 0,
      tags,
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
    }
    
    // Use new schema: sessionId (partition key) + scriptId (sort key) + script (data)
    const item = {
      sessionId: script.sessionId,      // Partition key
      scriptId: script.id,              // Sort key  
      script: storedScript,             // Script data and metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(sessionId) AND attribute_not_exists(scriptId)', // Prevent overwrites
    })
    
    await docClient.send(command)
    
    console.log('✅ Script stored successfully in DynamoDB scripts table')
    console.log('  Table:', tableName)
    console.log('  Session ID:', script.sessionId)
    console.log('  Script ID:', script.id)
    
    return storedScript
    
  } catch (error) {
    console.error('❌ Failed to store script in DynamoDB scripts table:', error)
    throw new Error(`Script storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Retrieve script by ID
 */
export async function getScript(sessionId: string, scriptId: string): Promise<StoredScript | null> {
  try {
    console.log('📖 Retrieving script from DynamoDB scripts table:', scriptId)
    
    const { docClient } = getDynamoDBClient()
    const tableName = 'scripts' // Use dedicated scripts table
    
    const command = new GetCommand({
      TableName: tableName,
      Key: { 
        sessionId: sessionId,  // Partition key
        scriptId: scriptId     // Sort key
      }
    })
    
    const response = await docClient.send(command)
    
    if (!response.Item) {
      console.log('📭 Script not found in scripts table:', scriptId)
      return null
    }
    
    console.log('✅ Script retrieved successfully from scripts table')
    // Extract the script object from the item
    return response.Item.script as StoredScript
    
  } catch (error) {
    console.error('❌ Failed to retrieve script from scripts table:', error)
    throw new Error(`Script retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get all scripts for a session
 */
export async function getSessionScripts(sessionId: string): Promise<StoredScript[]> {
  try {
    console.log('📚 Retrieving scripts for session from scripts table:', sessionId)
    
    const { docClient } = getDynamoDBClient()
    const tableName = 'scripts' // Use dedicated scripts table
    
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId
      },
      ScanIndexForward: false // Most recent first
    })
    
    const response = await docClient.send(command)
    const items = response.Items || []
    
    // Extract script objects from items
    const scripts = items.map(item => item.script as StoredScript)
    
    console.log(`✅ Retrieved ${scripts.length} scripts for session ${sessionId} from scripts table`)
    
    return scripts
    
  } catch (error) {
    console.error('❌ Failed to retrieve session scripts from scripts table:', error)
    
    // Fallback to scan if needed
    try {
      console.log('🔄 Falling back to table scan...')
      return await scanScriptsBySession(sessionId)
    } catch (scanError) {
      throw new Error(`Session scripts retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

/**
 * Fallback: Scan table for session scripts (less efficient)
 */
async function scanScriptsBySession(sessionId: string): Promise<StoredScript[]> {
  const { docClient } = getDynamoDBClient()
  const tableName = env.AWS_DYNAMODB_NAME!
  
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: 'sessionId = :sessionId',
    ExpressionAttributeValues: {
      ':sessionId': sessionId
    }
  })
  
  const response = await docClient.send(command)
  return (response.Items || []) as StoredScript[]
}

/**
 * Update script status and usage
 */
export async function updateScriptUsage(
  sessionId: string,
  scriptId: string, 
  status?: 'draft' | 'active' | 'used' | 'archived'
): Promise<void> {
  try {
    console.log('🔄 Updating script usage:', scriptId)
    
    const { docClient } = getDynamoDBClient()
    const tableName = env.AWS_DYNAMODB_NAME
    
    if (!tableName) {
      throw new Error('AWS_DYNAMODB_NAME environment variable is required')
    }
    
    const updateExpression = ['ADD usageCount :inc', 'SET lastUsed = :now']
    const expressionAttributeValues: Record<string, any> = {
      ':inc': 1,
      ':now': new Date().toISOString()
    }
    
    if (status) {
      updateExpression.push('SET #status = :status')
      expressionAttributeValues[':status'] = status
    }
    
    const command = new UpdateCommand({
      TableName: tableName,
      Key: { 
        sessionId: sessionId,
        itemType: `script#${scriptId}`
      },
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'UPDATED_NEW'
    })
    
    await docClient.send(command)
    console.log('✅ Script usage updated successfully')
    
  } catch (error) {
    console.error('❌ Failed to update script usage:', error)
    throw new Error(`Script update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete script
 */
export async function deleteScript(scriptId: string): Promise<void> {
  try {
    console.log('🗑️ Deleting script:', scriptId)
    
    const { docClient } = getDynamoDBClient()
    const tableName = env.AWS_DYNAMODB_NAME
    
    if (!tableName) {
      throw new Error('AWS_DYNAMODB_NAME environment variable is required')
    }
    
    const command = new DeleteCommand({
      TableName: tableName,
      Key: { id: scriptId }
    })
    
    await docClient.send(command)
    console.log('✅ Script deleted successfully')
    
  } catch (error) {
    console.error('❌ Failed to delete script:', error)
    throw new Error(`Script deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get recent scripts across all sessions
 */
export async function getRecentScripts(limit: number = 20): Promise<StoredScript[]> {
  try {
    console.log('📋 Retrieving recent scripts, limit:', limit)
    
    const { docClient } = getDynamoDBClient()
    const tableName = env.AWS_DYNAMODB_NAME
    
    if (!tableName) {
      throw new Error('AWS_DYNAMODB_NAME environment variable is required')
    }
    
    const command = new ScanCommand({
      TableName: tableName,
      Limit: limit,
      ProjectionExpression: 'id, sessionId, topic, #status, generatedAt, usageCount',
      ExpressionAttributeNames: {
        '#status': 'status'
      }
    })
    
    const response = await docClient.send(command)
    const scripts = (response.Items || []) as StoredScript[]
    
    // Sort by generatedAt descending
    scripts.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    
    console.log(`✅ Retrieved ${scripts.length} recent scripts`)
    return scripts
    
  } catch (error) {
    console.error('❌ Failed to retrieve recent scripts:', error)
    throw new Error(`Recent scripts retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} 