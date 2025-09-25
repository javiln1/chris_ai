import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getAgentById, detectAgentType } from '@/lib/agents';
import { mcpServer } from '@/lib/mcp';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, agentId } = await req.json();

    // Validate the request
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine which agent to use
    let selectedAgentId = agentId;
    
    // If no agent specified, auto-detect from the latest message
    if (!selectedAgentId && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.role === 'user') {
        selectedAgentId = detectAgentType(latestMessage.content);
      }
    }
    
    // Get the agent configuration
    const agent = getAgentById(selectedAgentId || 'general');
    
    // Add agent context to the system prompt
    const enhancedSystemPrompt = `${agent.systemPrompt}

You are currently operating as the ${agent.name} (${agent.icon}). 
Your specialized capabilities include: ${agent.capabilities.join(', ')}.

Available tools: ${agent.tools ? agent.tools.join(', ') : 'none'}

Remember to:
- Stay true to your specialized role
- Provide responses that showcase your expertise
- Be helpful and professional
- Use your specialized knowledge to provide the best possible assistance
- Use available tools when appropriate to enhance your responses`;

    // Get available tools for this agent
    const availableTools = agent.tools || [];
    const mcpTools = mcpServer.getAvailableTools();
    const agentTools = mcpTools.filter(tool => availableTools.includes(tool.name));

    // Create tool definitions for the AI SDK
    const tools = agentTools.reduce((acc, mcpTool) => {
      acc[mcpTool.name] = tool({
        description: mcpTool.description,
        parameters: mcpTool.inputSchema,
        execute: async (params) => {
          return await mcpServer.callTool('default', mcpTool.name, params);
        }
      });
      return acc;
    }, {} as any);

    // Use OpenAI for AI responses with agent-specific system prompt and tools
    const result = await streamText({
      model: openai(agent.model || 'gpt-4o-mini'),
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      system: enhancedSystemPrompt,
      temperature: agent.temperature || 0.7,
      maxTokens: agent.maxTokens || 1000,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Agent API Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return new Response(JSON.stringify({ 
          error: 'Invalid API key. Please check your OpenAI API key configuration.' 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your request. Please try again.' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

