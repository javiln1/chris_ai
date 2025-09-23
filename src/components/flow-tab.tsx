'use client';

import React, { useState } from 'react';
import AIFlow from './ai-flow';
import { Button } from '@/components/ui/button';

interface FlowTabProps {
  className?: string;
}

export default function FlowTab({ className }: FlowTabProps) {
  const [activeFlow, setActiveFlow] = useState('ai-workflow');

  const flowTemplates = {
    'ai-workflow': {
      title: 'AI Workflow',
      description: 'Basic AI processing flow'
    },
    'decision-tree': {
      title: 'Decision Tree',
      description: 'Multi-path decision making'
    },
    'data-pipeline': {
      title: 'Data Pipeline',
      description: 'Data processing workflow'
    }
  };

  return (
    <div className={`flex flex-col h-full bg-custom-dark ${className}`}>
      {/* Flow Header */}
      <div className="border-b border-border p-4 bg-custom-dark-secondary">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">AI Flow Designer</h2>
            <p className="text-sm text-text-secondary">Visualize AI workflows and processes</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-custom-dark border-border text-text hover:bg-custom-dark-secondary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Flow
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-custom-dark border-border text-text hover:bg-custom-dark-secondary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Flow Tabs */}
      <div className="border-b border-border bg-custom-dark-secondary">
        <div className="flex space-x-1 p-2">
          {Object.entries(flowTemplates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setActiveFlow(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeFlow === key
                  ? 'bg-accent text-black'
                  : 'text-text-secondary hover:text-text hover:bg-custom-dark'
              }`}
            >
              {template.title}
            </button>
          ))}
        </div>
      </div>

      {/* Flow Content */}
      <div className="flex-1 relative">
        <AIFlow className="w-full h-full" />
        
        {/* Flow Info Panel */}
        <div className="absolute top-4 left-4 bg-custom-dark-secondary/90 backdrop-blur-sm border border-border rounded-lg p-3 max-w-xs">
          <h3 className="text-sm font-semibold text-text mb-1">
            {flowTemplates[activeFlow as keyof typeof flowTemplates]?.title}
          </h3>
          <p className="text-xs text-text-secondary mb-2">
            {flowTemplates[activeFlow as keyof typeof flowTemplates]?.description}
          </p>
          <div className="text-xs text-text-muted">
            • Drag nodes to reposition<br/>
            • Connect nodes by dragging from handles<br/>
            • Use controls to zoom and pan<br/>
            • Right-click for context menu
          </div>
        </div>

        {/* Quick Actions */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <Button 
            size="sm"
            className="bg-accent text-black hover:bg-accent/90 shadow-lg"
            onClick={() => {
              // Add new node logic here
              console.log('Add new node');
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="bg-custom-dark-secondary border-border text-text hover:bg-custom-dark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}

