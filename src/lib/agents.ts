export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
  capabilities: string[];
  examples: string[];
  tools?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: any;
  handler: (params: any) => Promise<any>;
}

export const AGENTS: Record<string, Agent> = {
  // Enhanced existing agents with tools and better configurations
  general: {
    id: 'general',
    name: 'General Assistant',
    description: 'All-purpose AI for general questions and conversations with access to comprehensive organic dropshipping knowledge base',
    icon: '🤖',
    color: '#00ff00',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: `You are a helpful general-purpose AI assistant with access to a comprehensive knowledge base containing 196+ documents from top organic dropshipping creators, case studies, and strategies. You excel at natural language understanding, creative writing, problem-solving, and providing detailed, accurate responses. 

IMPORTANT: When users ask about organic dropshipping, product research, viral strategies, case studies, or any business-related questions, you should ALWAYS search the knowledge base first to provide accurate, real-world insights from successful entrepreneurs and creators.

Available knowledge base categories:
- Course Content: 69 documents with organic dropshipping strategies
- Books: 1 document with business insights
- Coaching Calls: 43 documents with real coaching sessions
- Youtubers: 84 documents from top creators like Bsmfredo, Ethan Hayes, jordaninaforeign
- YouTube (Chris): 19 documents with Chris's personal strategies

Always search the knowledge base for relevant information before providing answers about organic dropshipping, business strategies, or success stories.`,
    capabilities: ['Natural conversation', 'Creative writing', 'Code generation', 'Problem solving', 'General assistance', 'Organic dropshipping expertise', 'Business strategy insights'],
    examples: ['Write a creative story', 'Help me debug code', 'Explain complex topics', 'General questions', 'How to find winning dropshipping products', 'Organic dropshipping case studies'],
    tools: ['web_search', 'file_operations', 'calculator', 'searchKnowledgeBase', 'searchCaseStudies', 'searchCreatorContent']
  },
  
  research: {
    id: 'research',
    name: 'Research Agent',
    description: 'Expert at finding information and fact-checking with access to comprehensive organic dropshipping knowledge base',
    icon: '🔍',
    color: '#3b82f6',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 1500,
    systemPrompt: `You are a Research Agent specialized in finding accurate, up-to-date information with access to a comprehensive knowledge base containing 196+ documents from top organic dropshipping creators. You excel at information research, fact-checking, detailed explanations, and source citations. 

IMPORTANT: When researching organic dropshipping topics, business strategies, or case studies, you should ALWAYS search the knowledge base first to provide accurate, real-world insights from successful entrepreneurs and creators.

Available knowledge base categories:
- Course Content: 69 documents with organic dropshipping strategies
- Books: 1 document with business insights  
- Coaching Calls: 43 documents with real coaching sessions
- Youtubers: 84 documents from top creators like Bsmfredo, Ethan Hayes, jordaninaforeign
- YouTube (Chris): 19 documents with Chris's personal strategies

Always search the knowledge base for relevant information before providing answers about organic dropshipping, business strategies, or success stories. Always provide well-sourced, accurate information and cite your sources when possible.`,
    capabilities: ['Information research', 'Fact-checking', 'Detailed explanations', 'Source citations', 'Data gathering', 'Organic dropshipping expertise', 'Business strategy insights'],
    examples: ['Research the latest AI trends', 'What are the benefits of renewable energy?', 'Find information about...', 'Research organic dropshipping strategies', 'Find case studies of successful dropshippers'],
    tools: ['web_search', 'academic_search', 'fact_checker', 'citation_generator', 'searchKnowledgeBase', 'searchCaseStudies', 'searchCreatorContent']
  },
  
  code: {
    id: 'code',
    name: 'Code Agent',
    description: 'Programming expert for technical solutions',
    icon: '💻',
    color: '#f59e0b',
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 2000,
    systemPrompt: `You are a Code Agent, a programming expert specializing in technical solutions. You excel at code generation, debugging, algorithm design, and technical explanations. Always provide clean, well-commented, and efficient code solutions with explanations.`,
    capabilities: ['Code generation', 'Debugging', 'Algorithm design', 'Technical explanations', 'Code review'],
    examples: ['Write a Python function', 'Debug this code', 'Explain how recursion works', 'Design an algorithm'],
    tools: ['code_executor', 'syntax_checker', 'performance_analyzer', 'git_operations']
  },
  
  creative: {
    id: 'creative',
    name: 'Creative Agent',
    description: 'Creative specialist for writing and design',
    icon: '🎨',
    color: '#ec4899',
    model: 'gpt-4o',
    temperature: 0.9,
    maxTokens: 1500,
    systemPrompt: `You are a Creative Agent, a creative specialist for writing, design, and artistic endeavors. You excel at creative writing, brainstorming, design thinking, and storytelling. Always provide innovative, engaging, and original creative solutions.`,
    capabilities: ['Creative writing', 'Brainstorming', 'Design thinking', 'Storytelling', 'Innovation'],
    examples: ['Write a creative story', 'Brainstorm startup ideas', 'Help me design a logo', 'Create a marketing campaign'],
    tools: ['image_generator', 'design_tools', 'creative_templates', 'mood_board']
  },
  
  analysis: {
    id: 'analysis',
    name: 'Analysis Agent',
    description: 'Data analysis expert for insights and patterns',
    icon: '📊',
    color: '#8b5cf6',
    model: 'gpt-4o-mini',
    temperature: 0.4,
    maxTokens: 1500,
    systemPrompt: `You are an Analysis Agent, a data analysis expert specializing in insights and pattern recognition. You excel at data analysis, pattern recognition, insights generation, and visualization. Always provide clear, actionable insights with supporting data.`,
    capabilities: ['Data analysis', 'Pattern recognition', 'Insights generation', 'Visualization', 'Statistical analysis'],
    examples: ['Analyze this data', 'What patterns do you see?', 'Help me understand these metrics', 'Generate insights'],
    tools: ['data_processor', 'chart_generator', 'statistical_analyzer', 'pattern_detector']
  },

  // New specialized agents
  workflow: {
    id: 'workflow',
    name: 'Workflow Agent',
    description: 'Orchestrates complex multi-step processes and agent collaboration',
    icon: '🔄',
    color: '#10b981',
    model: 'gpt-4o',
    temperature: 0.5,
    maxTokens: 2000,
    systemPrompt: `You are a Workflow Agent that orchestrates complex multi-step processes and coordinates between different specialized agents. You excel at breaking down complex tasks, creating execution plans, and managing agent collaboration.`,
    capabilities: ['Task orchestration', 'Agent coordination', 'Process management', 'Workflow design', 'Multi-agent collaboration'],
    examples: ['Create a marketing campaign workflow', 'Coordinate a research project', 'Design a development process'],
    tools: ['workflow_engine', 'agent_coordinator', 'task_manager', 'progress_tracker']
  },

  api: {
    id: 'api',
    name: 'API Integration Agent',
    description: 'Specializes in API integrations and external service connections',
    icon: '🔌',
    color: '#6366f1',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 1500,
    systemPrompt: `You are an API Integration Agent specializing in connecting to external services and APIs. You excel at API integration, data transformation, service orchestration, and handling external communications.`,
    capabilities: ['API integration', 'Data transformation', 'Service orchestration', 'External communications', 'Protocol handling'],
    examples: ['Integrate with a REST API', 'Connect to a database', 'Set up webhook handlers'],
    tools: ['api_client', 'data_transformer', 'webhook_handler', 'service_discovery']
  }
};

export function detectAgentType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Research keywords - Research Agent
  if (lowerMessage.includes('research') || 
      lowerMessage.includes('find') || 
      lowerMessage.includes('search') ||
      lowerMessage.includes('what is') ||
      lowerMessage.includes('explain') ||
      lowerMessage.includes('information') ||
      lowerMessage.includes('fact') ||
      lowerMessage.includes('source') ||
      lowerMessage.includes('latest') ||
      lowerMessage.includes('current')) {
    return 'research';
  }
  
  // Code and technical keywords - Code Agent
  if (lowerMessage.includes('code') || 
      lowerMessage.includes('program') || 
      lowerMessage.includes('function') ||
      lowerMessage.includes('algorithm') ||
      lowerMessage.includes('debug') ||
      lowerMessage.includes('python') ||
      lowerMessage.includes('javascript') ||
      lowerMessage.includes('java') ||
      lowerMessage.includes('react') ||
      lowerMessage.includes('api') ||
      lowerMessage.includes('script') ||
      lowerMessage.includes('develop') ||
      lowerMessage.includes('build') ||
      lowerMessage.includes('implement')) {
    return 'code';
  }
  
  // Creative keywords - Creative Agent
  if (lowerMessage.includes('creative') || 
      lowerMessage.includes('innovative') || 
      lowerMessage.includes('brainstorm') ||
      lowerMessage.includes('design') ||
      lowerMessage.includes('art') ||
      lowerMessage.includes('idea') ||
      lowerMessage.includes('inspire') ||
      lowerMessage.includes('story') ||
      lowerMessage.includes('write') ||
      lowerMessage.includes('content') ||
      lowerMessage.includes('marketing') ||
      lowerMessage.includes('brand')) {
    return 'creative';
  }
  
  // Analysis keywords - Analysis Agent
  if (lowerMessage.includes('analyze') || 
      lowerMessage.includes('analysis') || 
      lowerMessage.includes('data') ||
      lowerMessage.includes('pattern') ||
      lowerMessage.includes('trend') ||
      lowerMessage.includes('insight') ||
      lowerMessage.includes('metric') ||
      lowerMessage.includes('statistic') ||
      lowerMessage.includes('chart') ||
      lowerMessage.includes('graph') ||
      lowerMessage.includes('report') ||
      lowerMessage.includes('evaluate')) {
    return 'analysis';
  }
  
  // Workflow keywords - Workflow Agent
  if (lowerMessage.includes('workflow') || 
      lowerMessage.includes('process') || 
      lowerMessage.includes('step') ||
      lowerMessage.includes('coordinate') ||
      lowerMessage.includes('orchestrate') ||
      lowerMessage.includes('manage') ||
      lowerMessage.includes('plan') ||
      lowerMessage.includes('sequence') ||
      lowerMessage.includes('pipeline')) {
    return 'workflow';
  }
  
  // API integration keywords - API Agent
  if (lowerMessage.includes('integrate') || 
      lowerMessage.includes('api') || 
      lowerMessage.includes('connect') ||
      lowerMessage.includes('service') ||
      lowerMessage.includes('webhook') ||
      lowerMessage.includes('database') ||
      lowerMessage.includes('external') ||
      lowerMessage.includes('protocol') ||
      lowerMessage.includes('endpoint')) {
    return 'api';
  }
  
  // Default to General Agent for general tasks
  return 'general';
}

export function getAgentById(id: string): Agent {
  return AGENTS[id] || AGENTS.general;
}

export function getAllAgents(): Agent[] {
  return Object.values(AGENTS);
}

