'use client';

import React, { useState, useEffect } from 'react';

interface MCPServer {
  name: string;
  version: string;
  description: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: any;
  }>;
  resources: any[];
  prompts: any[];
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPManagerProps {
  className?: string;
}

export default function MCPManager({ className }: MCPManagerProps) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchMCPInfo();
  }, []);

  const fetchMCPInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/mcp');
      const data = await response.json();
      
      if (response.ok) {
        setServers(data.servers);
        setTools(data.tools);
      } else {
        setError(data.error || 'Failed to fetch MCP information');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const callTool = async (toolName: string, params: any) => {
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'call_tool',
          server_name: selectedServer,
          tool_name: toolName,
          params
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setToolResults(prev => ({
          ...prev,
          [toolName]: data.result
        }));
      } else {
        setError(data.error || 'Failed to call tool');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const testWebSearch = () => {
    callTool('web_search', { query: 'AI agents and MCP', max_results: 3 });
  };

  const testCalculator = () => {
    callTool('calculator', { expression: '2 + 2 * 3' });
  };

  const testFileOperations = () => {
    callTool('file_operations', { operation: 'list', path: '/' });
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-2 text-text-secondary">Loading MCP information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text">MCP Manager</h2>
            <p className="text-text-secondary">Manage Model Context Protocol servers and tools</p>
          </div>
          <button
            onClick={fetchMCPInfo}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Server Selection */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Active MCP Server
          </label>
          <select
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value)}
            className="w-full p-3 bg-custom-dark border border-border rounded-lg text-text focus:border-accent focus:outline-none"
          >
            {servers.map((server) => (
              <option key={server.name} value={server.name}>
                {server.name} - {server.description}
              </option>
            ))}
          </select>
        </div>

        {/* Server Info */}
        {servers.length > 0 && (
          <div className="bg-custom-dark-secondary border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-2">Server Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-text-secondary">Total Servers</p>
                <p className="text-text font-semibold">{servers.length}</p>
              </div>
              <div>
                <p className="text-text-secondary">Total Tools</p>
                <p className="text-text font-semibold">{tools.length}</p>
              </div>
              <div>
                <p className="text-text-secondary">Active Server</p>
                <p className="text-text font-semibold">{selectedServer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Available Tools */}
        <div className="bg-custom-dark-secondary border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-text mb-4">Available Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <div key={tool.name} className="bg-custom-dark border border-border rounded-lg p-3">
                <h4 className="font-semibold text-text mb-1">{tool.name}</h4>
                <p className="text-sm text-text-secondary mb-3">{tool.description}</p>
                
                {/* Quick Test Buttons */}
                <div className="space-y-2">
                  {tool.name === 'web_search' && (
                    <button
                      onClick={testWebSearch}
                      className="w-full px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      Test Search
                    </button>
                  )}
                  {tool.name === 'calculator' && (
                    <button
                      onClick={testCalculator}
                      className="w-full px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30 transition-colors"
                    >
                      Test Calculator
                    </button>
                  )}
                  {tool.name === 'file_operations' && (
                    <button
                      onClick={testFileOperations}
                      className="w-full px-3 py-1 bg-orange-500/20 text-orange-400 rounded text-sm hover:bg-orange-500/30 transition-colors"
                    >
                      Test File Ops
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tool Results */}
        {Object.keys(toolResults).length > 0 && (
          <div className="bg-custom-dark-secondary border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-4">Tool Results</h3>
            <div className="space-y-3">
              {Object.entries(toolResults).map(([toolName, result]) => (
                <div key={toolName} className="bg-custom-dark border border-border rounded-lg p-3">
                  <h4 className="font-semibold text-text mb-2">{toolName}</h4>
                  <pre className="text-sm text-text-secondary bg-custom-dark-tertiary p-2 rounded overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MCP Status */}
        <div className="bg-custom-dark-secondary border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-text mb-2">MCP Status</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-text">MCP Protocol Active</span>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            Model Context Protocol is enabled and ready to handle tool calls from AI agents.
          </p>
        </div>
      </div>
    </div>
  );
}

