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

    const result = await streamText({
      model,
      messages,
      system: agent.systemPrompt,
      maxTokens: 1000, // Reduced to avoid token limits
    });

    console.log('streamText successful, returning response');
    return result.toDataStreamResponse();
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