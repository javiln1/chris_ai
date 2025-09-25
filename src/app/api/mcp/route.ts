import { NextRequest, NextResponse } from 'next/server';
import { mcpServer } from '@/lib/mcp';

// GET /api/mcp - Get all available MCP servers and tools
export async function GET(request: NextRequest) {
  try {
    const servers = mcpServer.getAllServers();
    const tools = mcpServer.getAvailableTools();
    
    return NextResponse.json({
      servers,
      tools,
      total_servers: servers.length,
      total_tools: tools.length
    });
  } catch (error) {
    console.error('MCP API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP information' },
      { status: 500 }
    );
  }
}

// POST /api/mcp - Execute a tool or manage MCP servers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, server_name, tool_name, params } = body;

    switch (action) {
      case 'call_tool':
        if (!tool_name) {
          return NextResponse.json(
            { error: 'tool_name is required for call_tool action' },
            { status: 400 }
          );
        }

        const result = await mcpServer.callTool(
          server_name || 'default',
          tool_name,
          params || {}
        );

        return NextResponse.json({
          success: true,
          result,
          tool_name,
          server_name: server_name || 'default'
        });

      case 'get_server':
        if (!server_name) {
          return NextResponse.json(
            { error: 'server_name is required for get_server action' },
            { status: 400 }
          );
        }

        const server = mcpServer.getServer(server_name);
        if (!server) {
          return NextResponse.json(
            { error: `Server '${server_name}' not found` },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          server
        });

      case 'get_tools':
        const availableTools = mcpServer.getAvailableTools();
        const filteredTools = server_name 
          ? availableTools.filter(tool => {
              const server = mcpServer.getServer(server_name);
              return server?.tools.some(t => t.name === tool.name);
            })
          : availableTools;

        return NextResponse.json({
          success: true,
          tools: filteredTools,
          server_name: server_name || 'all'
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('MCP API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

