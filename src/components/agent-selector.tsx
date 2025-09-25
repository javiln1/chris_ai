'use client';

import React, { useState } from 'react';
import { Agent, getAllAgents, getAgentById } from '@/lib/agents';

interface AgentSelectorProps {
  selectedAgent: string;
  onAgentChange: (agentId: string) => void;
  className?: string;
}

export default function AgentSelector({ selectedAgent, onAgentChange, className }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const agents = getAllAgents();
  const currentAgent = getAgentById(selectedAgent);

  return (
    <div className={`relative ${className}`}>
      {/* Agent Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 w-full bg-custom-dark border border-border rounded-xl p-4 hover:border-gray-700 transition-all duration-200"
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: currentAgent.color + '20' }}
        >
          {currentAgent.icon}
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-lg font-semibold text-text">{currentAgent.name}</h3>
          <p className="text-text-secondary text-sm">{currentAgent.description}</p>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-accent/20 text-accent rounded-full mt-1">
            Active
          </span>
        </div>
        <svg 
          className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* Agent Options Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-custom-dark-secondary border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                onAgentChange(agent.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 p-4 hover:bg-custom-dark transition-all duration-200 ${
                selectedAgent === agent.id ? 'bg-accent/10' : ''
              }`}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: agent.color + '20' }}
              >
                {agent.icon}
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-text">{agent.name}</h4>
                <p className="text-xs text-text-secondary">{agent.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.capabilities.slice(0, 2).map((capability) => (
                    <span 
                      key={capability}
                      className="px-1 py-0.5 text-xs bg-custom-dark text-text-secondary rounded"
                    >
                      {capability}
                    </span>
                  ))}
                  {agent.capabilities.length > 2 && (
                    <span className="px-1 py-0.5 text-xs text-text-muted">
                      +{agent.capabilities.length - 2} more
                    </span>
                  )}
                </div>
                {agent.tools && agent.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="px-1 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                      🛠️ {agent.tools.length} tools
                    </span>
                  </div>
                )}
              </div>
              {selectedAgent === agent.id && (
                <div className="w-2 h-2 bg-accent rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Agent Capabilities Preview */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-custom-dark-secondary border border-border rounded-xl p-4 z-40">
          <h4 className="text-sm font-semibold text-text mb-2">Capabilities</h4>
          <div className="flex flex-wrap gap-2">
            {currentAgent.capabilities.map((capability) => (
              <span 
                key={capability}
                className="px-2 py-1 text-xs bg-custom-dark text-text-secondary rounded-full"
              >
                {capability}
              </span>
            ))}
          </div>
          
          {currentAgent.tools && currentAgent.tools.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-text mb-2 mt-3">Available Tools</h4>
              <div className="flex flex-wrap gap-2">
                {currentAgent.tools.map((tool) => (
                  <span 
                    key={tool}
                    className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full"
                  >
                    🛠️ {tool}
                  </span>
                ))}
              </div>
            </>
          )}
          
          <h4 className="text-sm font-semibold text-text mb-2 mt-3">Example Questions</h4>
          <div className="space-y-1">
            {currentAgent.examples.map((example) => (
              <div 
                key={example}
                className="text-xs text-text-muted bg-custom-dark p-2 rounded"
              >
                "{example}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

