import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
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

    // Select model based on agentId
    switch (agentId) {
      case 'chatgpt4':
        if (!process.env.OPENAI_API_KEY) {
          console.error('OpenAI API key not found in environment variables');
          throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
        }
        model = openai('gpt-4o-mini', {
          apiKey: process.env.OPENAI_API_KEY
        });
        break;
      case 'chatgpt5':
        if (!process.env.OPENAI_API_KEY) {
          console.error('OpenAI API key not found in environment variables');
          throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
        }
        model = openai('gpt-4o', {
          apiKey: process.env.OPENAI_API_KEY
        });
        break;
      case 'claude3':
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }
        model = anthropic('claude-3-haiku-20240307');
        break;
      case 'claude4':
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }
        model = anthropic('claude-3-5-sonnet-20241022');
        break;
      case 'gemini':
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error('Google API key not configured');
        }
        model = google('gemini-1.5-pro');
        break;
      default:
        throw new Error('Unsupported agent');
    }

    const result = await streamText({
      model,
      messages,
      system: agent.systemPrompt,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}