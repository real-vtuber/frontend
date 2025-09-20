/**
 * Script Generation API Route
 * Combines Pinecone RAG, Bedrock Nova AI, and DynamoDB storage
 * For D-ID Live Avatar script generation
 */
import { NextRequest, NextResponse } from 'next/server'
import { getRelevantContext } from '../../../lib/pinecone'
import { generateScript, generateScriptVariations, ScriptGenerationRequest } from '../../../lib/bedrock'
import { storeScript, getSessionScripts, getScript, updateScriptUsage } from '../../../lib/dynamodb'

/**
 * POST /api/generate-script
 * Generate a new script using RAG from Pinecone knowledge base
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting script generation request...')
    
    const body = await request.json()
    const { 
      sessionId, 
      topic, 
      duration = 5, 
      tone = 'professional', 
      audience = 'general',
      variations = 1,
      tags = []
    } = body
    
    // Validate required fields
    if (!sessionId || !topic) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: sessionId and topic are required' 
        },
        { status: 400 }
      )
    }
    
    console.log('📝 Script generation parameters:')
    console.log('  Session ID:', sessionId)
    console.log('  Topic:', topic)
    console.log('  Duration:', duration, 'minutes')
    console.log('  Tone:', tone)
    console.log('  Audience:', audience)
    console.log('  Variations:', variations)
    
    // Step 1: Retrieve relevant context from Pinecone knowledge base
    console.log('🔍 Step 1: Retrieving relevant context from knowledge base...')
    let knowledgeContext: string[] = []
    
    try {
      knowledgeContext = await getRelevantContext(topic, sessionId, 8) // Get more context for better quality
      console.log(`✅ Retrieved ${knowledgeContext.length} relevant context chunks from Pinecone`)
    } catch (contextError) {
      console.error('❌ Failed to retrieve context from Pinecone:', contextError)
      console.log('🔄 Using fallback: generating script without specific document context')
      
      // Fallback: Generate script without specific document context
      knowledgeContext = [
        `Topic: ${topic}`,
        `Please provide a comprehensive ${tone} overview suitable for ${audience}.`,
        `Duration: ${duration} minutes`,
        `Focus on key concepts, practical applications, and relevant examples.`
      ]
      console.log(`✅ Using ${knowledgeContext.length} fallback context chunks`)
    }
    
    if (knowledgeContext.length === 0) {
      console.warn('⚠️ No context available, using minimal fallback')
      knowledgeContext = [`Please provide a ${tone} presentation about ${topic} for ${audience} lasting ${duration} minutes.`]
    }
    
    // Step 2: Generate script(s) using Bedrock Nova AI
    console.log('🤖 Step 2: Generating script with Bedrock Nova AI...')
    
    const scriptRequest: ScriptGenerationRequest = {
      sessionId,
      topic,
      duration,
      tone,
      audience
    }
    
    let generatedScripts
    if (variations > 1) {
      generatedScripts = await generateScriptVariations(scriptRequest, knowledgeContext, variations)
    } else {
      const singleScript = await generateScript(scriptRequest, knowledgeContext)
      generatedScripts = [singleScript]
    }
    
    console.log(`✅ Generated ${generatedScripts.length} script variation(s)`)
    
    // Step 3: Store scripts in DynamoDB (with fallback)
    console.log('💾 Step 3: Storing scripts in DynamoDB...')
    
    const storedScripts = []
    let storageWarning = ''
    
    for (const script of generatedScripts) {
      try {
        const storedScript = await storeScript(script, tags)
        storedScripts.push(storedScript)
      } catch (storeError) {
        console.warn('⚠️ Failed to store script in DynamoDB:', script.id, storeError)
        // Create a mock stored script for the response
        const mockStoredScript = {
          ...script,
          status: 'draft' as const,
          usageCount: 0,
          tags
        }
        storedScripts.push(mockStoredScript)
        storageWarning = 'Scripts generated but not persisted - DynamoDB access required for storage'
      }
    }
    
    console.log(`✅ Generated ${storedScripts.length} scripts (${storageWarning ? 'temporary storage' : 'stored in DynamoDB'})`)
    
    // Prepare response
    const response = {
      success: true,
      message: `Successfully generated ${generatedScripts.length} script(s) for topic: ${topic}`,
      sessionId,
      topic,
      scripts: storedScripts.map(script => ({
        id: script.id,
        topic: script.topic,
        content: script.content,
        duration: script.duration,
        tone: script.tone,
        audience: script.audience,
        confidence: script.metadata.confidence,
        generatedAt: script.generatedAt,
        status: script.status,
        contextSources: script.sourceContext.length
      })),
      metadata: {
        contextChunksUsed: knowledgeContext.length,
        totalScriptsGenerated: generatedScripts.length,
        totalScriptsStored: storedScripts.length,
        processingTime: Date.now() // Client can calculate duration
      },
      ...(storageWarning && { warning: storageWarning })
    }
    
    console.log('🎉 Script generation completed successfully!')
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('❌ Script generation failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Script generation failed',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

/**
 * GET /api/generate-script?sessionId=xxx&scriptId=xxx
 * Retrieve scripts for a session or a specific script
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const scriptId = searchParams.get('scriptId')
    const action = searchParams.get('action') || 'list'
    
    console.log('📖 Script retrieval request:')
    console.log('  Session ID:', sessionId)
    console.log('  Script ID:', scriptId)
    console.log('  Action:', action)
    
    if (scriptId && sessionId) {
      // Get specific script
      const script = await getScript(sessionId, scriptId)
      
      if (!script) {
        return NextResponse.json(
          { success: false, error: 'Script not found' },
          { status: 404 }
        )
      }
      
      // Update usage count
      await updateScriptUsage(sessionId, scriptId)
      
      return NextResponse.json({
        success: true,
        script: {
          id: script.id,
          sessionId: script.sessionId,
          topic: script.topic,
          content: script.content,
          duration: script.duration,
          tone: script.tone,
          audience: script.audience,
          status: script.status,
          usageCount: script.usageCount,
          generatedAt: script.generatedAt,
          lastUsed: script.lastUsed,
          metadata: script.metadata
        }
      })
    }
    
    if (sessionId) {
      // Get all scripts for session
      try {
        const scripts = await getSessionScripts(sessionId)
        
        return NextResponse.json({
          success: true,
          sessionId,
          scripts: scripts.map(script => ({
            id: script.id,
            topic: script.topic,
            duration: script.duration,
            tone: script.tone,
            status: script.status,
            usageCount: script.usageCount,
            generatedAt: script.generatedAt,
            lastUsed: script.lastUsed,
            confidence: script.metadata.confidence
          })),
          totalScripts: scripts.length
        })
      } catch (dbError) {
        console.warn('⚠️ DynamoDB access failed, returning empty script list:', dbError)
        // Return empty list if DynamoDB is not accessible
        return NextResponse.json({
          success: true,
          sessionId,
          scripts: [],
          totalScripts: 0,
          warning: 'Script storage not available - scripts will not be persisted'
        })
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Either sessionId or scriptId is required' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('❌ Script retrieval failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Script retrieval failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/generate-script
 * Update script status
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, scriptId, status } = body
    
    if (!sessionId || !scriptId || !status) {
      return NextResponse.json(
        { success: false, error: 'sessionId, scriptId and status are required' },
        { status: 400 }
      )
    }
    
    await updateScriptUsage(sessionId, scriptId, status)
    
    return NextResponse.json({
      success: true,
      message: 'Script status updated successfully',
      scriptId,
      status
    })
    
  } catch (error) {
    console.error('❌ Script update failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Script update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 