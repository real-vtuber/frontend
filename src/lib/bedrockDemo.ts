/**
 * Demo Bedrock Nova AI Integration
 * Provides fallback script generation when Bedrock access is not available
 */
import { GeneratedScript, ScriptGenerationRequest } from '../types/script'

/**
 * Demo script templates for different topics and tones
 */
const DEMO_SCRIPTS = {
  'sustainable technology': {
    professional: `# Sustainable Technology: Building a Greener Future

## Introduction
Welcome to our comprehensive overview of sustainable technology. In today's rapidly evolving world, technology plays a crucial role in addressing environmental challenges while driving economic growth and innovation.

## Key Concepts

### 1. Green Energy Solutions
- **Solar Power**: Advanced photovoltaic systems with improved efficiency
- **Wind Energy**: Offshore and onshore wind farms with smart grid integration
- **Hydroelectric Systems**: Small-scale and large-scale hydroelectric power
- **Energy Storage**: Next-generation battery technologies and grid storage

### 2. Smart Infrastructure
- **IoT Integration**: Internet of Things for efficient resource management
- **Smart Cities**: Connected systems for traffic, energy, and waste management
- **Green Buildings**: LEED-certified construction with energy-efficient designs
- **Water Management**: Smart irrigation and water conservation systems

### 3. Circular Economy Technologies
- **Waste-to-Energy**: Converting waste into renewable energy sources
- **Recycling Innovation**: AI-powered sorting and processing systems
- **Biodegradable Materials**: Sustainable alternatives to traditional plastics
- **Resource Recovery**: Extracting valuable materials from waste streams

## Practical Applications

### Smart Cities Implementation
Modern cities are implementing IoT sensors for real-time monitoring of:
- Traffic flow optimization
- Energy consumption patterns
- Air quality management
- Waste collection efficiency

### Renewable Energy Transition
The shift from fossil fuels includes:
- Solar panel installations on residential and commercial buildings
- Wind farm development in optimal locations
- Grid modernization for renewable energy integration
- Energy storage solutions for consistent power supply

### Sustainable Agriculture
Precision farming technologies include:
- Vertical farming systems for urban areas
- AI-powered crop monitoring and optimization
- Water-efficient irrigation systems
- Soil health monitoring and improvement

## Future Outlook

The future of sustainable technology lies in:
- **Integration**: Seamless connection between different green technologies
- **Innovation**: Continuous development of more efficient solutions
- **Collaboration**: Public-private partnerships for large-scale implementation
- **Education**: Training the next generation of sustainability professionals

## Conclusion

Sustainable technology represents our best hope for addressing climate change while maintaining economic prosperity. By investing in these solutions today, we create a more sustainable world for future generations.

Thank you for your attention. Together, we can build a greener, more sustainable future.`,

    casual: `Hey everyone! Let's talk about sustainable tech - it's pretty amazing stuff that's helping us save the planet while still making cool things work.

So what's the deal with sustainable technology? Basically, it's all about using tech to solve environmental problems without messing up our economy. Think solar panels, wind turbines, and smart systems that help us use resources better.

Here are some cool things happening:

**Clean Energy is Getting Better**
- Solar panels are way more efficient now
- Wind farms are popping up everywhere
- We're getting better at storing renewable energy

**Smart Cities are the Future**
- Everything's connected with IoT sensors
- Traffic flows better, energy gets used smarter
- Waste management is getting automated

**We're Getting Smarter About Waste**
- Turning trash into energy
- AI helps sort recyclables better
- Making stuff that actually breaks down naturally

The coolest part? This isn't just for big companies. Regular people can get solar panels, smart thermostats, and electric cars. It's becoming more accessible and affordable.

Bottom line: sustainable tech isn't just good for the planet - it's creating jobs, saving money, and making our lives better. Pretty awesome, right?`
  },

  'artificial intelligence': {
    professional: `# Artificial Intelligence: Transforming Industries and Society

## Introduction
Artificial Intelligence represents one of the most significant technological advancements of our time, fundamentally changing how we work, live, and interact with technology.

## Core Concepts

### Machine Learning Fundamentals
- **Supervised Learning**: Training models with labeled data
- **Unsupervised Learning**: Finding patterns in unlabeled data
- **Deep Learning**: Neural networks with multiple layers
- **Reinforcement Learning**: Learning through trial and error

### AI Applications Across Industries
- **Healthcare**: Medical diagnosis, drug discovery, personalized treatment
- **Finance**: Fraud detection, algorithmic trading, risk assessment
- **Transportation**: Autonomous vehicles, traffic optimization
- **Education**: Personalized learning, intelligent tutoring systems

## Ethical Considerations

### Responsible AI Development
- **Bias Mitigation**: Ensuring fair and unbiased AI systems
- **Transparency**: Making AI decisions explainable and understandable
- **Privacy Protection**: Safeguarding personal data in AI applications
- **Human Oversight**: Maintaining human control over AI systems

## Future Implications

### Economic Impact
- Job displacement and creation
- New industries and business models
- Increased productivity and efficiency
- Global competitiveness in AI development

### Social Transformation
- Enhanced decision-making capabilities
- Improved accessibility and inclusion
- New forms of human-computer interaction
- Challenges to traditional employment structures

## Conclusion

AI presents both tremendous opportunities and significant challenges. Success depends on responsible development, ethical implementation, and thoughtful consideration of societal impacts.`,

    casual: `So AI - it's everywhere now, right? From your phone's camera recognizing faces to Netflix knowing what you want to watch next.

Let me break down what's really happening with AI:

**The Basics**
- It's basically teaching computers to think and learn like humans
- Machine learning is like training a really smart student
- Deep learning uses networks that mimic how our brains work

**Where You See It Every Day**
- Your phone's voice assistant
- Social media algorithms showing you content
- Online shopping recommendations
- Email spam filters

**The Cool Stuff**
- Self-driving cars (they're getting really good!)
- AI doctors helping with diagnoses
- Smart home devices that learn your habits
- Language translation that's almost instant

**The Important Stuff**
- We need to make sure AI is fair and doesn't discriminate
- Privacy is huge - your data needs protection
- Some jobs might change, but new ones will be created
- Humans are still in charge (and that's good!)

The future? AI will keep getting smarter and more helpful, but we need to be thoughtful about how we use it. It's a tool that can make life better if we use it right!`
  }
}

/**
 * Generate a demo script when Bedrock is not available
 */
export async function generateDemoScript(request: ScriptGenerationRequest): Promise<GeneratedScript> {
  console.log('🎭 Generating demo script (Bedrock not available)')
  
  const { topic, tone = 'professional', duration = 5, audience = 'general' } = request
  
  // Get demo script template
  const topicKey = topic.toLowerCase().includes('sustainable') ? 'sustainable technology' : 'artificial intelligence'
  const toneKey = tone === 'casual' ? 'casual' : 'professional'
  
  let scriptContent = DEMO_SCRIPTS[topicKey]?.[toneKey] || DEMO_SCRIPTS['sustainable technology']['professional']
  
  // Adjust content length based on duration
  const targetLength = duration * 200 // ~200 words per minute
  const currentLength = scriptContent.split(' ').length
  
  if (currentLength > targetLength) {
    // Truncate if too long
    const words = scriptContent.split(' ')
    scriptContent = words.slice(0, targetLength).join(' ') + '...'
  } else if (currentLength < targetLength * 0.7) {
    // Expand if too short
    scriptContent += `\n\n## Additional Insights\n\nThis topic continues to evolve rapidly, with new developments emerging regularly. The key is to stay informed and adapt to changing technologies and methodologies.`
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
    sourceContext: ['Demo mode: Using pre-generated content'],
    generatedAt: new Date().toISOString(),
    metadata: {
      modelUsed: 'demo-mode',
      tokensUsed: scriptContent.length,
      confidence: 0.75,
      fallbackUsed: true
    }
  }
  
  console.log('✅ Demo script generated successfully')
  console.log('  Topic:', generatedScript.topic)
  console.log('  Duration:', generatedScript.duration, 'minutes')
  console.log('  Content length:', generatedScript.content.length, 'characters')
  
  return generatedScript
}

/**
 * Estimate script duration based on content length
 */
function estimateScriptDuration(content: string): number {
  const wordsPerMinute = 150 // Average speaking rate
  const wordCount = content.split(/\s+/).length
  return Math.max(1, Math.round(wordCount / wordsPerMinute))
}

/**
 * Check if demo mode should be used
 */
export function shouldUseDemoMode(): boolean {
  // Use demo mode if Bedrock credentials are not properly configured
  return !process.env.BEDROCK_NOVA_ACCESS_KEY || !process.env.BEDROCK_NOVA_ACCESS_KEY_SECRET
}
