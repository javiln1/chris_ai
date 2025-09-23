'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AGENTS, getAgentById } from '@/lib/agents';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId: string;
  timestamp: Date;
}

export default function ScrollableAgentChat() {
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your GPC AI assistant with specialized agents. Choose an agent below to get started!',
      agentId: 'general',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const currentAgent = getAgentById(selectedAgent);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setIsProcessing(true);
        
        // Simulate processing time
        setTimeout(() => {
          setIsProcessing(false);
        }, 1000);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Check scroll position for indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      agentId: selectedAgent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This is a mock response from the ${currentAgent.name}. You asked: "${message}". The real AI integration will be connected soon!`,
        agentId: selectedAgent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    }
  };

  const scrollToDirection = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  const quickActions = [
    {
      id: 'research',
      title: 'Research AI Trends',
      icon: '🔍',
      prompt: 'What are the latest trends in artificial intelligence?',
    },
    {
      id: 'code',
      title: 'Code Example',
      icon: '💻',
      prompt: 'Show me a React component example',
    },
    {
      id: 'creative',
      title: 'Creative Brainstorm',
      icon: '🎨',
      prompt: 'Help me brainstorm creative ideas',
    },
  ];

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    setShowQuickActions(true);
    
    // Add welcome message from selected agent
    const agent = getAgentById(agentId);
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hello! I'm your ${agent.name}. ${agent.description}. How can I assist you today?`,
      agentId: agentId,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, welcomeMessage]);
  };

  const agents = Object.values(AGENTS);

  return (
    <div className="min-h-screen bg-custom-dark flex flex-col">
      {/* Header - Clean Claude Style */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="border-b border-border px-6 py-4 sticky top-0 z-50 bg-custom-dark/95 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative"
            >
              <Image
                src="/gpc-ai-logo.png"
                alt="GPC AI Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-cover"
              />
            </motion.div>
            <div>
              <h1 className="text-lg font-medium text-text">GPC AI</h1>
              <p className="text-sm text-text-secondary">AI Assistant</p>
            </div>
          </div>

          {/* Current Agent Indicator */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-custom-dark-secondary rounded-lg">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: `${currentAgent.color}20` }}
            >
              {currentAgent.icon}
            </div>
            <span className="text-sm font-medium text-text hidden sm:block">
              {currentAgent.name}
            </span>
          </div>
        </div>
      </motion.header>

      {/* Agent Selection Grid */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="agent-selection-container"
      >
        <div className="max-w-6xl mx-auto relative">
          {/* Scroll Indicators */}
          <button
            onClick={() => scrollToDirection('left')}
            className={`scroll-indicator left ${!canScrollLeft ? 'hidden' : ''}`}
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => scrollToDirection('right')}
            className={`scroll-indicator right ${!canScrollRight ? 'hidden' : ''}`}
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Scrollable Agent Grid */}
          <div 
            ref={scrollContainerRef}
            className="agent-scroll-container"
          >
            <div className="agent-grid">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAgentChange(agent.id)}
                  className={`agent-card-horizontal ${
                    selectedAgent === agent.id ? 'selected' : ''
                  }`}
                >
                  <div 
                    className="agent-icon-large"
                    style={{ backgroundColor: `${agent.color}20` }}
                  >
                    {agent.icon}
                  </div>
                  <div className="agent-info">
                    <h3 className="agent-name">{agent.name}</h3>
                    <p className="agent-description">{agent.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] ${
                  message.role === 'user' 
                    ? 'message-user' 
                    : 'message-ai'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-3">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: `${getAgentById(message.agentId).color}20` }}
                      >
                        {getAgentById(message.agentId).icon}
                      </div>
                      <span className="text-xs text-text-secondary">
                        {getAgentById(message.agentId).name}
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed font-body">
                    {message.content}
                  </p>
                  <p className="text-xs text-text-muted mt-3">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Animation */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="message-ai max-w-[85%] sm:max-w-[75%]">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${currentAgent.color}20` }}
                  >
                    {currentAgent.icon}
                  </div>
                  <div className="loading-dots">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                  <span className="text-sm text-text-muted ml-2">
                    {currentAgent.name} is thinking...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {showQuickActions && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex flex-col items-center justify-center py-16 text-center space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3, type: "spring" }}
                className="relative"
              >
                <Image
                  src="/gpc-ai-logo.png"
                  alt="GPC AI Logo"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-medium text-text">
                  Welcome to GPC AI
                </h2>
                <p className="text-text-secondary max-w-lg text-base">
                  Choose an agent above to get started. Each agent specializes in different areas to provide you with the best assistance.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl w-full px-4"
              >
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="bg-custom-dark-secondary rounded-xl p-5 text-left hover:bg-custom-dark-tertiary transition-all duration-200 group min-h-[100px]"
                  >
                    <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-200">
                      {action.icon}
                    </div>
                    <h3 className="font-medium text-text mb-2 text-base">
                      {action.title}
                    </h3>
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {action.prompt}
                    </p>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="border-t border-border p-6 bg-custom-dark/95 backdrop-blur-sm"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex space-x-3 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Ask ${currentAgent.name} anything...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                  className="input-modern w-full px-4 py-3 text-text placeholder-text-muted pr-20"
                  disabled={isLoading}
                />
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2 flex space-x-2">
                  {/* Voice Input Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVoiceInput}
                    disabled={isLoading}
                    className={`voice-button w-8 h-8 ${
                      isListening ? 'listening' : isProcessing ? 'processing' : ''
                    }`}
                  >
                    {isProcessing ? (
                      <div className="loading-dots">
                        <div className="loading-dot w-1 h-1"></div>
                        <div className="loading-dot w-1 h-1"></div>
                        <div className="loading-dot w-1 h-1"></div>
                      </div>
                    ) : (
                      <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </motion.button>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="fab btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12"
              >
                <motion.svg 
                  className="w-5 h-5 relative z-10" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: isLoading ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </motion.svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
