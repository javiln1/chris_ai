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

    // Check if this is a knowledge base related query
    let knowledgeBaseResults = '';
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.role === 'user') {
      const query = latestMessage.content.toLowerCase();
      const isKnowledgeBaseQuery = query.includes('dropshipping') || 
                                  query.includes('product') || 
                                  query.includes('viral') || 
                                  query.includes('case study') ||
                                  query.includes('strategy') ||
                                  query.includes('marketing') ||
                                  query.includes('bsmfredo') ||
                                  query.includes('ethan hayes') ||
                                  query.includes('jordaninaforeign');
      
      if (isKnowledgeBaseQuery) {
        console.log('🔍 Knowledge base query detected:', latestMessage.content);
        try {
          const { searchKnowledgeBase } = await import('@/lib/pinecone');
          console.log('📚 Searching knowledge base...');
          const results = await searchKnowledgeBase(latestMessage.content, undefined, 3);
          console.log('📊 Found results:', results.length);
          
          if (results.length > 0) {
            knowledgeBaseResults = `\n\nKNOWLEDGE BASE SEARCH RESULTS for "${latestMessage.content}":\n`;
            results.forEach((result, index) => {
              knowledgeBaseResults += `${index + 1}. ${result.title} (${Math.round(result.score * 100)}% match)\n`;
              knowledgeBaseResults += `   Category: ${result.category}\n`;
              knowledgeBaseResults += `   Creator: Chris\n`;
              knowledgeBaseResults += `   Content: ${result.content.substring(0, 200)}...\n\n`;
            });
            console.log('✅ Knowledge base results added to prompt');
          } else {
            console.log('❌ No knowledge base results found');
          }
        } catch (error) {
          console.error('❌ Error searching knowledge base:', error);
        }
      }
    }

    // Enhanced system prompt with knowledge base results
    const enhancedSystemPrompt = `${agent.systemPrompt}${knowledgeBaseResults}

You have access to a comprehensive knowledge base of dropshipping strategies, case studies, and content from Chris. Use this information to provide specific, actionable advice based on real examples and proven strategies. Always refer to the creator as "Chris" when referencing any strategies, case studies, or content from the knowledge base.`;

    let result;
    
    // If we have knowledge base results, use non-streaming to include sources
    if (knowledgeBaseResults && latestMessage) {
      console.log('🔧 Using non-streaming approach for sources...');
      
      result = await streamText({
        model,
        messages,
        system: enhancedSystemPrompt,
        maxOutputTokens: 1000,
      });
      
      // Get the full text response
      const fullText = await result.text;
      console.log('📝 Got full text response');
      
      // Get the sources data
      let sourcesData = '';
      try {
        const { searchKnowledgeBase } = await import('@/lib/pinecone');
        const results = await searchKnowledgeBase(latestMessage.content, undefined, 3);
        
        if (results.length > 0) {
          const sources = results.map(result => ({
            title: result.title,
            content: result.content,
            category: result.category,
            creator: 'Chris', // Always show as Chris
            relevance: Math.round(result.score * 100) + '%',
            score: result.score,
            hasVideo: !!result.video_url,
            videoUrl: result.video_url
          }));
          
          sourcesData = `\n\n<!-- SOURCES_DATA: ${JSON.stringify({ sources, searchQuery: latestMessage.content })} -->`;
          console.log('✅ Sources data prepared:', sources.length, 'sources');
        }
      } catch (error) {
        console.error('❌ Error preparing sources data:', error);
      }
      
      // Return a simple text response with sources
      const responseWithSources = fullText + sourcesData;
      console.log('📤 Returning response with sources data');
      
      return new Response(responseWithSources, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } else {
      // Use normal streaming for non-knowledge base queries
      result = await streamText({
        model,
        messages,
        system: enhancedSystemPrompt,
        maxOutputTokens: 1000,
      });
    }

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