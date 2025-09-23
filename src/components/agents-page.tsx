'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AGENTS } from '@/lib/agents';

interface AgentsPageProps {
  onBack: () => void;
  onSelectAgent: (agentId: string) => void;
  selectedAgent: string;
}

export default function AgentsPage({ onBack, onSelectAgent, selectedAgent }: AgentsPageProps) {
  return (
    <div className="h-screen bg-custom-dark overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-custom-dark-tertiary rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text">AI Agents</h1>
            <p className="text-sm text-text-secondary">Choose your specialized AI assistant</p>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="p-6 overflow-y-auto h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {Object.values(AGENTS).map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectAgent(agent.id)}
              className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedAgent === agent.id 
                  ? 'bg-custom-dark-tertiary border-2 border-lime-500' 
                  : 'bg-custom-dark-secondary border border-border hover:border-lime-500/50'
              }`}
            >
              {/* Agent Icon */}
              <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4 mx-auto" 
                   style={{ backgroundColor: `${agent.color}20` }}>
                <span className="text-2xl">{agent.icon}</span>
              </div>

              {/* Agent Info */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-text mb-2">{agent.name}</h3>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  {agent.description}
                </p>
                
                {/* Capabilities */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {agent.capabilities.slice(0, 3).map((capability, capIndex) => (
                    <span
                      key={capIndex}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ 
                        backgroundColor: `${agent.color}15`,
                        color: agent.color,
                        border: `1px solid ${agent.color}30`
                      }}
                    >
                      {capability}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-custom-dark-tertiary text-text-secondary">
                      +{agent.capabilities.length - 3} more
                    </span>
                  )}
                </div>

                {/* Example */}
                <div className="text-left">
                  <p className="text-xs text-text-secondary mb-1">Example:</p>
                  <p className="text-xs text-text italic">"{agent.examples[0]}"</p>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedAgent === agent.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-custom-dark-secondary border border-border rounded-lg text-text hover:bg-custom-dark-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelectAgent(selectedAgent)}
            className="px-6 py-3 text-black rounded-lg transition-colors font-medium"
            style={{ backgroundColor: '#00ff00' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00cc00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00ff00'}
          >
            Select Agent
          </button>
        </div>
      </div>
    </div>
  );
}
