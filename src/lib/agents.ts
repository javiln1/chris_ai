export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
  capabilities: string[];
  examples: string[];
}

export const AGENTS: Record<string, Agent> = {
  chatgpt4: {
    id: 'chatgpt4',
    name: 'ChatGPT 4.0',
    description: 'OpenAI\'s most advanced conversational AI model',
    icon: '🤖',
    color: '#00ff00',
    systemPrompt: `You are ChatGPT 4.0, OpenAI's most advanced conversational AI. You excel at natural language understanding, creative writing, problem-solving, and providing detailed, accurate responses. You can help with a wide range of tasks from coding to creative writing to analysis.`,
    capabilities: ['Natural conversation', 'Creative writing', 'Code generation', 'Problem solving'],
    examples: ['Write a creative story', 'Help me debug code', 'Explain complex topics']
  },
  
  chatgpt5: {
    id: 'chatgpt5',
    name: 'ChatGPT 5.0',
    description: 'Next-generation AI with enhanced reasoning capabilities',
    icon: '🚀',
    color: '#00ccff',
    systemPrompt: `You are ChatGPT 5.0, the next-generation AI with enhanced reasoning, creativity, and problem-solving capabilities. You provide more nuanced responses, better context understanding, and advanced analytical thinking. You excel at complex reasoning tasks and creative problem-solving.`,
    capabilities: ['Advanced reasoning', 'Enhanced creativity', 'Complex analysis', 'Multi-step problem solving'],
    examples: ['Solve complex logic puzzles', 'Design innovative solutions', 'Analyze intricate scenarios']
  },
  
  claude3: {
    id: 'claude3',
    name: 'Claude 3',
    description: 'Anthropic\'s advanced AI with superior reasoning',
    icon: '🧠',
    color: '#ff6b6b',
    systemPrompt: `You are Claude 3, Anthropic's advanced AI assistant known for superior reasoning, helpfulness, and safety. You excel at nuanced conversations, careful analysis, and providing thoughtful, well-reasoned responses. You're particularly good at complex reasoning tasks and ethical considerations.`,
    capabilities: ['Advanced reasoning', 'Ethical analysis', 'Nuanced conversation', 'Careful problem-solving'],
    examples: ['Analyze ethical dilemmas', 'Provide nuanced perspectives', 'Help with complex reasoning']
  },
  
  claude4: {
    id: 'claude4',
    name: 'Claude 4',
    description: 'Next-generation Claude with enhanced capabilities',
    icon: '🌟',
    color: '#ff9f43',
    systemPrompt: `You are Claude 4, the next-generation version with enhanced reasoning, creativity, and understanding capabilities. You provide even more nuanced responses, better context awareness, and superior analytical thinking. You excel at complex multi-step reasoning and creative problem-solving.`,
    capabilities: ['Enhanced reasoning', 'Superior creativity', 'Advanced analysis', 'Multi-domain expertise'],
    examples: ['Solve complex multi-step problems', 'Generate innovative ideas', 'Provide deep insights']
  },
  
  gemini: {
    id: 'gemini',
    name: 'Gemini Pro',
    description: 'Google\'s advanced multimodal AI model',
    icon: '💎',
    color: '#9b59b6',
    systemPrompt: `You are Gemini Pro, Google's advanced multimodal AI model. You excel at understanding and generating content across text, images, and other modalities. You're particularly strong at research, analysis, and providing comprehensive, well-structured responses.`,
    capabilities: ['Multimodal understanding', 'Research excellence', 'Comprehensive analysis', 'Structured responses'],
    examples: ['Analyze images and text', 'Conduct thorough research', 'Provide structured insights']
  }
};

export function detectAgentType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Code and technical keywords - use ChatGPT 4.0
  if (lowerMessage.includes('code') || 
      lowerMessage.includes('program') || 
      lowerMessage.includes('function') ||
      lowerMessage.includes('algorithm') ||
      lowerMessage.includes('debug') ||
      lowerMessage.includes('python') ||
      lowerMessage.includes('javascript') ||
      lowerMessage.includes('java') ||
      lowerMessage.includes('react') ||
      lowerMessage.includes('api')) {
    return 'chatgpt4';
  }
  
  // Complex reasoning and analysis - use Claude 3
  if (lowerMessage.includes('analyze') || 
      lowerMessage.includes('reasoning') || 
      lowerMessage.includes('complex') ||
      lowerMessage.includes('ethical') ||
      lowerMessage.includes('philosophy') ||
      lowerMessage.includes('nuanced') ||
      lowerMessage.includes('deep') ||
      lowerMessage.includes('thinking')) {
    return 'claude3';
  }
  
  // Creative and innovative tasks - use ChatGPT 5.0
  if (lowerMessage.includes('creative') || 
      lowerMessage.includes('innovative') || 
      lowerMessage.includes('brainstorm') ||
      lowerMessage.includes('design') ||
      lowerMessage.includes('art') ||
      lowerMessage.includes('idea') ||
      lowerMessage.includes('inspire') ||
      lowerMessage.includes('story')) {
    return 'chatgpt5';
  }
  
  // Research and multimodal tasks - use Gemini
  if (lowerMessage.includes('research') || 
      lowerMessage.includes('find') || 
      lowerMessage.includes('multimodal') ||
      lowerMessage.includes('image') ||
      lowerMessage.includes('visual') ||
      lowerMessage.includes('comprehensive') ||
      lowerMessage.includes('structured')) {
    return 'gemini';
  }
  
  // Default to ChatGPT 4.0 for general tasks
  return 'chatgpt4';
}

export function getAgentById(id: string): Agent {
  return AGENTS[id] || AGENTS.chatgpt4;
}

export function getAllAgents(): Agent[] {
  return Object.values(AGENTS);
}

