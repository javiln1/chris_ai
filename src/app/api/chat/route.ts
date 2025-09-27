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

KNOWLEDGE BASE HIERARCHY INSTRUCTIONS:
1. You have found relevant information in Chris's knowledge base above
2. Use this knowledge base content as your PRIMARY source
3. Organize and present this information in a clear, actionable way
4. Always reference "Chris" as the creator of this knowledge
5. If the knowledge base covers the question well, focus entirely on that content
6. If there are gaps, you may supplement with general knowledge but prioritize the KB content
7. Make sure to cite that the information comes from Chris's knowledge base

RESPONSE STRUCTURE:
- Lead with knowledge base content
- Organize it logically for the user
- Provide actionable insights based on Chris's proven strategies`;
    } else {
      // STEP 3 & 4: No knowledge base results - research fallback
      enhancedSystemPrompt = `${agent.systemPrompt}

KNOWLEDGE BASE HIERARCHY INSTRUCTIONS:
1. No relevant information found in Chris's knowledge base for this query
2. You should inform the user that this specific topic is not in the knowledge base
3. You may provide general information but must clearly indicate it's from web research
4. Always mention that for Chris's specific strategies and proven methods, they should ask about topics covered in the knowledge base
5. Suggest related topics that ARE covered in the knowledge base

RESPONSE STRUCTURE:
- Start by acknowledging this isn't in Chris's knowledge base
- Provide general information if helpful (clearly marked as web research)
- Suggest related knowledge base topics they should ask about
- End with encouragement to explore Chris's proven strategies`;
    }

    let result;
    
    // Always use non-streaming to ensure sources are included
    console.log('🔧 Using non-streaming approach for hierarchy system...');
    
    result = await streamText({
      model,
      messages,
      system: enhancedSystemPrompt,
      maxOutputTokens: 1500, // Increased for more comprehensive responses
    });
    
    // Get the full text response
    const fullText = await result.text;
    console.log('📝 Got full text response');
    
    // Add simple, user-friendly sources at the end of the response
    let sourcesText = '';
    
    if (knowledgeBaseFound && knowledgeBaseSources.length > 0) {
      sourcesText = `\n\n📚 **Sources from Chris's Knowledge Base:**\n`;
      knowledgeBaseSources.forEach((result, index) => {
        const relevance = Math.round(result.score * 100);
        sourcesText += `${index + 1}. ${result.title} (${relevance}% match)\n`;
      });
      sourcesText += `\n*This information comes from Chris's proven strategies and case studies.*`;
    } else {
      sourcesText = `\n\n⚠️ *This topic isn't covered in Chris's knowledge base. The information above is from general research and may not reflect Chris's specific strategies.*`;
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