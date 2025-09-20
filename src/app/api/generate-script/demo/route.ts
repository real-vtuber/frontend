/**
 * Demo Script Generation API Route
 * Simulates the complete RAG pipeline without requiring AWS permissions
 * Shows the full workflow: Pinecone → Context Retrieval → Mock Script Generation
 */
import { NextRequest, NextResponse } from 'next/server'
import { getRelevantContext } from '../../../../lib/pinecone'

/**
 * POST /api/generate-script/demo
 * Demonstrate the RAG pipeline with mock script generation
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎭 Starting DEMO script generation request...')
    
    const body = await request.json()
    const { 
      sessionId, 
      topic, 
      duration = 5, 
      tone = 'professional', 
      audience = 'general'
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
    
    console.log('📝 DEMO Script generation parameters:')
    console.log('  Session ID:', sessionId)
    console.log('  Topic:', topic)
    console.log('  Duration:', duration, 'minutes')
    console.log('  Tone:', tone)
    console.log('  Audience:', audience)
    
    // Step 1: Retrieve relevant context from Pinecone knowledge base
    console.log('🔍 Step 1: Retrieving relevant context from knowledge base...')
    const knowledgeContext = await getRelevantContext(topic, sessionId, 5)
    
    if (knowledgeContext.length === 0) {
      console.warn('⚠️ No relevant context found in knowledge base')
      return NextResponse.json(
        { 
          success: false, 
          error: 'No relevant knowledge found for the given topic. Please ensure documents are uploaded and processed for this session.',
          suggestion: 'Upload relevant documents to the knowledge base first.'
        },
        { status: 404 }
      )
    }
    
    console.log(`✅ Retrieved ${knowledgeContext.length} relevant context chunks`)
    
    // Step 2: Generate DEMO script using the retrieved context
    console.log('🎭 Step 2: Generating DEMO script using retrieved context...')
    
    const contextSummary = knowledgeContext
      .map(ctx => ctx.replace(/\[Source: [^\]]+\]\n/, ''))
      .join('\n\n')
      .substring(0, 1000) + (knowledgeContext.join('').length > 1000 ? '...' : '')
    
    // Create a realistic demo script based on the actual context
    const demoScript = generateDemoScript(topic, contextSummary, tone, duration, audience)
    
    // Create mock script object
    const mockScript = {
      id: `demo_script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      topic,
      content: demoScript,
      duration: duration,
      tone,
      audience,
      confidence: 0.85, // Mock confidence score
      generatedAt: new Date().toISOString(),
      status: 'demo',
      contextSources: knowledgeContext.length,
      sourceContext: knowledgeContext.map(ctx => ctx.substring(0, 200) + '...'),
      metadata: {
        modelUsed: 'DEMO_MODE',
        tokensUsed: demoScript.split(' ').length,
        confidence: 0.85
      }
    }
    
    console.log('✅ DEMO script generated successfully!')
    console.log('  Length:', demoScript.length, 'characters')
    console.log('  Context sources:', knowledgeContext.length)
    
    // Prepare response
    const response = {
      success: true,
      message: `DEMO: Successfully generated script for topic: ${topic}`,
      mode: 'DEMONSTRATION',
      sessionId,
      topic,
      scripts: [{
        id: mockScript.id,
        topic: mockScript.topic,
        content: mockScript.content,
        duration: mockScript.duration,
        tone: mockScript.tone,
        audience: mockScript.audience,
        confidence: mockScript.confidence,
        generatedAt: mockScript.generatedAt,
        status: mockScript.status,
        contextSources: mockScript.contextSources
      }],
      metadata: {
        contextChunksUsed: knowledgeContext.length,
        totalScriptsGenerated: 1,
        totalScriptsStored: 0,
        processingTime: Date.now(),
        contextPreview: contextSummary.substring(0, 300) + '...'
      },
      warning: 'This is a DEMO - real script generation requires AWS Bedrock permissions'
    }
    
    console.log('🎉 DEMO script generation completed successfully!')
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('❌ DEMO script generation failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'DEMO script generation failed',
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
 * Generate a realistic demo script based on retrieved context
 */
function generateDemoScript(topic: string, context: string, tone: string, duration: number, audience: string): string {
  const wordCount = duration * 150 // Approximate words per minute
  
  // Extract key information from context
  const contextLines = context.split('\n').filter(line => line.trim().length > 0)
  const keyPoints = contextLines.slice(0, 5).map(line => line.trim().substring(0, 100))
  
  let script = ''
  
  // Introduction
  script += `Welcome to today's ${tone} presentation on ${topic}.\n\n`
  
  if (tone === 'professional') {
    script += `In this session, we'll explore the key concepts and technical details that make this topic particularly relevant for ${audience}.\n\n`
  } else if (tone === 'educational') {
    script += `Let's dive into the fundamental concepts and learn together about the important aspects of ${topic}.\n\n`
  } else {
    script += `Let's take a closer look at ${topic} and understand why it's important.\n\n`
  }
  
  // Main content based on context
  script += `Based on the available documentation, here are the key points:\n\n`
  
  keyPoints.forEach((point, index) => {
    if (point && point.length > 20) {
      script += `${index + 1}. ${point}${point.endsWith('.') ? '' : '.'}\n\n`
      if (tone === 'professional') {
        script += `This aspect is particularly significant because it demonstrates the technical sophistication and practical applications in real-world scenarios.\n\n`
      }
    }
  })
  
  // Add pauses for natural delivery
  script += `[PAUSE]\n\n`
  
  // Additional insights
  if (context.toLowerCase().includes('blockchain') || context.toLowerCase().includes('protocol')) {
    script += `The blockchain technology aspects highlighted in our documentation show the innovative approach to solving traditional challenges in this space.\n\n`
  }
  
  if (context.toLowerCase().includes('performance') || context.toLowerCase().includes('throughput')) {
    script += `Performance characteristics are crucial, and the documentation indicates significant improvements in throughput and efficiency.\n\n`
  }
  
  // Conclusion
  script += `[PAUSE]\n\n`
  script += `To summarize, ${topic} represents a significant advancement in the field, with practical implications for ${audience}.\n\n`
  
  if (tone === 'professional') {
    script += `The technical specifications and implementation details we've covered today provide a solid foundation for understanding the broader implications of this technology.\n\n`
  }
  
  script += `Thank you for your attention. I hope this overview has provided valuable insights into ${topic}.`
  
  // Adjust length if needed
  const currentWords = script.split(' ').length
  if (currentWords < wordCount * 0.8) {
    script += `\n\n*Additional context from documentation*: ${context.substring(0, Math.min(500, wordCount * 2))}`
  }
  
  return script
} 