import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getAgentById, detectAgentType } from '@/lib/agents';
import { mcpServer } from '@/lib/mcp';
import { knowledgeBaseTools } from '@/lib/knowledge-tools';

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
    
    // Check if this is a knowledge base related query and search if needed
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
      
      if (isKnowledgeBaseQuery && agent.tools && agent.tools.includes('searchKnowledgeBase')) {
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
              knowledgeBaseResults += `   Creator: ${result.creator || 'Unknown'}\n`;
              knowledgeBaseResults += `   Content: ${result.content.substring(0, 200)}...\n\n`;
            });
            console.log('✅ Knowledge base results added to prompt');
          } else {
            console.log('❌ No knowledge base results found');
          }
        } catch (error) {
          console.error('❌ Error searching knowledge base:', error);
        }
      } else {
        console.log('ℹ️ Not a knowledge base query or agent not configured');
        console.log('Query:', latestMessage.content);
        console.log('Is KB query:', isKnowledgeBaseQuery);
        console.log('Agent tools:', agent.tools);
      }
    }
    
    // Add agent context to the system prompt
    const enhancedSystemPrompt = `${agent.systemPrompt}${knowledgeBaseResults}

You are currently operating as the ${agent.name} (${agent.icon}). 
Your specialized capabilities include: ${agent.capabilities.join(', ')}.

Available tools: ${agent.tools ? agent.tools.join(', ') : 'none'}

Remember to:
- Stay true to your specialized role
- Provide responses that showcase your expertise
- Be helpful and professional
- Use your specialized knowledge to provide the best possible assistance
- If knowledge base results are provided above, use them to give accurate, specific answers`;

    // Get available tools for this agent
    const availableTools = agent.tools || [];
    
    // Temporarily disable MCP tools to focus on knowledge base
    // const mcpTools = mcpServer.getAvailableTools();
    // const agentTools = mcpTools.filter(tool => availableTools.includes(tool.name));

    // Create tool definitions for the AI SDK
    const tools: any = {};
    
    // Temporarily disable MCP tools
    // const tools = agentTools.reduce((acc, mcpTool) => {
    //   acc[mcpTool.name] = tool({
    //     description: mcpTool.description,
    //     parameters: mcpTool.inputSchema,
    //     execute: async (params) => {
    //       return await mcpServer.callTool('default', mcpTool.name, params);
    //     }
    //   });
    //   return acc;
    // }, {} as any);

    // Temporarily disable all tools to test basic functionality
    // const knowledgeBaseToolNames = ['searchKnowledgeBase', 'searchCaseStudies', 'searchCreatorContent', 'getKnowledgeBaseStats'];
    // const hasKnowledgeBaseTools = availableTools.some(tool => knowledgeBaseToolNames.includes(tool));
    
    // if (hasKnowledgeBaseTools) {
    //   // Add knowledge base tools
    //   Object.entries(knowledgeBaseTools).forEach(([toolName, toolDef]) => {
    //     if (availableTools.includes(toolName)) {
    //       tools[toolName] = tool({
    //         description: toolDef.description,
    //         parameters: toolDef.parameters,
    //         execute: async (params) => {
    //           return await toolDef.execute(params);
    //         }
    //       });
    //     }
    //   });
    // }

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

    // If we have knowledge base results, use a simpler non-streaming approach
    if (knowledgeBaseResults && latestMessage) {
      console.log('🔧 Using non-streaming approach for sources...');
      
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
            creator: result.creator,
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
    }

    // Default streaming response if no knowledge base results
    if (typeof result.toDataStreamResponse === 'function') {
      return result.toDataStreamResponse();
    } else if (typeof result.toResponse === 'function') {
      return result.toResponse();
    } else if (typeof result.toTextStreamResponse === 'function') {
      return result.toTextStreamResponse();
    } else {
      return new Response(result.toDataStream(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
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

