'use client';

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node Types
const AIProcessNode = ({ data, isConnectable }: any) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-custom-dark-tertiary border border-border text-text min-w-[150px]">
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-accent rounded-full"></div>
      <div className="font-semibold text-sm">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-text-secondary mt-1">{data.description}</div>
    )}
  </div>
);

const DecisionNode = ({ data, isConnectable }: any) => (
  <div className="px-4 py-2 shadow-md rounded-lg bg-custom-dark-secondary border-2 border-accent text-text min-w-[120px] transform rotate-45">
    <div className="transform -rotate-45 text-center">
      <div className="font-semibold text-sm">{data.label}</div>
      {data.description && (
        <div className="text-xs text-text-secondary mt-1">{data.description}</div>
      )}
    </div>
  </div>
);

const DataNode = ({ data, isConnectable }: any) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-custom-dark border border-border text-text min-w-[140px]">
    <div className="flex items-center space-x-2">
      <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
      <div className="font-semibold text-sm">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-text-secondary mt-1">{data.description}</div>
    )}
  </div>
);

const OutputNode = ({ data, isConnectable }: any) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-accent text-black min-w-[140px]">
    <div className="flex items-center space-x-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="font-semibold text-sm">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-gray-700 mt-1">{data.description}</div>
    )}
  </div>
);

const nodeTypes: NodeTypes = {
  aiProcess: AIProcessNode,
  decision: DecisionNode,
  data: DataNode,
  output: OutputNode,
};

// Initial nodes for AI workflow
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'data',
    position: { x: 100, y: 100 },
    data: { 
      label: 'User Input', 
      description: 'Question or request'
    },
  },
  {
    id: '2',
    type: 'aiProcess',
    position: { x: 300, y: 100 },
    data: { 
      label: 'AI Processing', 
      description: 'GPT-4 analysis'
    },
  },
  {
    id: '3',
    type: 'decision',
    position: { x: 500, y: 100 },
    data: { 
      label: 'Decision', 
      description: 'Route response'
    },
  },
  {
    id: '4',
    type: 'output',
    position: { x: 700, y: 100 },
    data: { 
      label: 'Response', 
      description: 'Final answer'
    },
  },
];

// Initial edges
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#00ff00' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: '#00ff00' },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    animated: true,
    style: { stroke: '#00ff00' },
  },
];

interface AIFlowProps {
  className?: string;
}

export default function AIFlow({ className }: AIFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-custom-dark"
      >
        <Controls 
          className="bg-custom-dark-secondary border border-border"
          style={{ button: { backgroundColor: '#000', color: '#00ff00', borderColor: '#333' } }}
        />
        <MiniMap 
          className="bg-custom-dark-secondary border border-border"
          nodeColor={(node) => {
            switch (node.type) {
              case 'aiProcess': return '#00ff00';
              case 'decision': return '#00ff00';
              case 'data': return '#333';
              case 'output': return '#00ff00';
              default: return '#333';
            }
          }}
          maskColor="rgba(0, 255, 0, 0.1)"
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1}
          color="#333"
        />
      </ReactFlow>
    </div>
  );
}

