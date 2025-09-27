import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getAgentById } from '@/lib/agents';

export async function POST(req: Request) {
  try {
    console.log('API Route called');
    console.log('Environment variables check:');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
    
    const { messages, agentId = 'chatgpt4' } = await req.json();
    console.log('Request data:', { agentId, messageCount: messages?.length });

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages', { status: 400 });
    }

    // Get agent configuration
    const agent = getAgentById(agentId);
    if (!agent) {
      return new Response('Invalid agent', { status: 400 });
    }

    let model;

    // For now, let's only support OpenAI models to simplify debugging
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
    }

    // Select model based on agentId
    switch (agentId) {
      case 'chatgpt4':
        model = openai('gpt-4o-mini');
        break;
      case 'chatgpt5':
        model = openai('gpt-4o');
        break;
      default:
        // Default to ChatGPT 4.0 for any other agent
        model = openai('gpt-4o-mini');
        break;
    }

    console.log('Selected model:', model);

    console.log('About to call streamText with:', {
      modelType: typeof model,
      messageCount: messages.length,
      systemPromptLength: agent.systemPrompt.length
    });

    // HIERARCHY STEP 1: Always search knowledge base first for ANY query
    let knowledgeBaseResults = '';
    let knowledgeBaseSources = [];
    let knowledgeBaseFound = false;
    const latestMessage = messages[messages.length - 1];
    
    if (latestMessage && latestMessage.role === 'user') {
      console.log('🔍 STEP 1: Searching knowledge base first for:', latestMessage.content);
      
      try {
        const { searchKnowledgeBase } = await import('@/lib/pinecone');
        const results = await searchKnowledgeBase(latestMessage.content, undefined, 5);
        console.log('📊 Knowledge base search results:', results.length);
        
        if (results.length > 0) {
          knowledgeBaseFound = true;
          knowledgeBaseSources = results;
          
          knowledgeBaseResults = `\n\nKNOWLEDGE BASE SEARCH RESULTS for "${latestMessage.content}":\n`;
          results.forEach((result, index) => {
            knowledgeBaseResults += `${index + 1}. ${result.title} (${Math.round(result.score * 100)}% match)\n`;
            knowledgeBaseResults += `   Category: ${result.category}\n`;
            knowledgeBaseResults += `   Creator: Chris\n`;
            knowledgeBaseResults += `   Content: ${result.content.substring(0, 300)}...\n\n`;
          });
          console.log('✅ Knowledge base results found and added to prompt');
        } else {
          console.log('❌ No knowledge base results found - will need to research');
        }
      } catch (error) {
        console.error('❌ Error searching knowledge base:', error);
      }
    }

    // Enhanced system prompt based on hierarchy
    let enhancedSystemPrompt;
    
    if (knowledgeBaseFound) {
      // STEP 2: AI organizes and presents knowledge base content
      enhancedSystemPrompt = `${agent.systemPrompt}${knowledgeBaseResults}

MENTORSHIP/COACHING RESPONSE INSTRUCTIONS:
You are acting as a complete mentor and coach, replacing human guidance. Your responses must be so comprehensive and detailed that someone could follow them step-by-step without any additional help.

RESPONSE REQUIREMENTS:
1. Use Chris's knowledge base content as your PRIMARY source
2. Always reference "Chris" as the creator of this knowledge
3. Create COMPLETE Standard Operating Procedures (SOPs)
4. Provide step-by-step instructions that are so detailed they replace human coaching
5. Include specific examples, timelines, and actionable steps
6. Address potential obstacles and how to overcome them
7. Make it so comprehensive that no additional research is needed

SOP RESPONSE STRUCTURE:
## 🎯 [Main Topic] - Complete Step-by-Step Guide

### 📋 Prerequisites & Setup
- **What you need before starting**
- **Tools and resources required**
- **Initial setup steps**

### 🚀 Phase 1: [First Major Step]
**Step 1:** [Detailed instruction]
**Step 2:** [Detailed instruction]
**Step 3:** [Detailed instruction]

> 💡 **Pro Tip from Chris:** [Specific advice]

### 🔥 Phase 2: [Second Major Step]
[Continue with detailed phases]

### ⚠️ Common Mistakes & How to Avoid Them
- **Mistake 1:** [Description] → **Solution:** [How to avoid]
- **Mistake 2:** [Description] → **Solution:** [How to avoid]

### 📊 Success Metrics & Timeline
- **Week 1:** [What to expect]
- **Week 2:** [What to expect]
- **Month 1:** [What to expect]

### 🎯 Next Steps & Action Items
1. **Immediate Action:** [What to do right now]
2. **This Week:** [Weekly goals]
3. **This Month:** [Monthly objectives]

> 🔥 **Remember:** [Motivational message from Chris's experience]`;
    } else {
      // STEP 3 & 4: No knowledge base results - research fallback
      enhancedSystemPrompt = `${agent.systemPrompt}

FALLBACK RESPONSE INSTRUCTIONS:
Since this topic isn't in Chris's knowledge base, you must still provide comprehensive guidance but clearly indicate the source limitations.

FALLBACK RESPONSE STRUCTURE:
## ⚠️ Topic Not in Chris's Knowledge Base

> **Important:** This specific topic isn't covered in Chris's proven strategies. The guidance below is from general research and may not reflect Chris's specific methods.

### 🎯 What You Can Do Right Now
[Provide actionable steps even without Chris's specific guidance]

### 📚 Related Topics in Chris's Knowledge Base
**Ask about these proven strategies instead:**
- [Topic 1 from KB] - Chris's proven method
- [Topic 2 from KB] - Chris's proven method
- [Topic 3 from KB] - Chris's proven method

### 💡 General Guidance (Not Chris's Method)
[Provide helpful but clearly marked as general research]

### 🚀 Recommended Next Steps
1. **Try the related topics above** - These have Chris's proven strategies
2. **Ask more specific questions** about Chris's methods
3. **Focus on Chris's proven areas** for guaranteed results

> 🔥 **Chris's Success Formula:** Focus on proven strategies from his knowledge base for the best results!`;
    }

    let result;
    
    // Always use non-streaming to ensure sources are included
    console.log('🔧 Using non-streaming approach for hierarchy system...');
    
    result = await streamText({
      model,
      messages,
      system: enhancedSystemPrompt,
      maxOutputTokens: 4000, // Increased for comprehensive SOP-style responses
    });
    
    // Get the full text response
    const fullText = await result.text;
    console.log('📝 Got full text response');
    
    // Add simple, user-friendly sources at the end of the response
    let sourcesText = '';
    
    if (knowledgeBaseFound && knowledgeBaseSources.length > 0) {
      sourcesText = `\n\n---\n\n## 📚 Sources from Chris's Knowledge Base\n\n`;
      knowledgeBaseSources.forEach((result, index) => {
        const relevance = Math.round(result.score * 100);
        sourcesText += `**${index + 1}.** ${result.title} \`${relevance}% match\`\n\n`;
      });
      sourcesText += `> *This information comes from Chris's proven strategies and case studies.*`;
    } else {
      sourcesText = `\n\n---\n\n> ⚠️ **Note:** This topic isn't covered in Chris's knowledge base. The information above is from general research and may not reflect Chris's specific strategies.\n\n> 💡 **Tip:** Ask about topics like "product research," "viral strategies," or "case studies" to get Chris's proven methods!`;
    }
    
    // Return simple text response with user-friendly sources
    const responseWithSources = fullText + sourcesText;
    console.log('📤 Returning response with simple sources');
    
    return new Response(responseWithSources, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

    console.log('streamText result:', {
      type: typeof result,
      methods: Object.getOwnPropertyNames(result),
      prototype: Object.getOwnPropertyNames(Object.getPrototypeOf(result))
    });
    
    // Try different response methods for AI SDK v5
    if (typeof result.toDataStreamResponse === 'function') {
      console.log('Using toDataStreamResponse');
      return result.toDataStreamResponse();
    } else if (typeof result.toResponse === 'function') {
      console.log('Using toResponse');
      return result.toResponse();
    } else if (typeof result.toTextStreamResponse === 'function') {
      console.log('Using toTextStreamResponse');
      return result.toTextStreamResponse();
    } else {
      console.log('Using manual response creation');
      return new Response(result.toDataStream(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  } catch (error) {
    console.error('API Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}