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

export default function MobileChat() {
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your GPC AI assistant with specialized agents. How can I help you today?',
      agentId: 'general',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentAgent = getAgentById(selectedAgent);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    setIsDropdownOpen(false);
    setShowQuickActions(true);
  };

  return (
    <div className="min-h-screen bg-custom-dark flex flex-col">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass border-b border-border px-6 py-4 sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative"
            >
              <Image
                src="/gpc-ai-logo.png"
                alt="GPC AI Logo"
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl object-cover"
              />
            </motion.div>
            <div>
              <h1 className="text-xl font-heading font-semibold text-text">GPC AI</h1>
              <p className="text-sm text-text-secondary">AI Assistant</p>
            </div>
          </div>

          {/* Agent Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 px-4 py-3 glass-light rounded-xl hover:border-accent/50 transition-all duration-200"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: `${currentAgent.color}20` }}
              >
                {currentAgent.icon}
              </div>
              <span className="text-base font-medium text-text hidden sm:block">
                {currentAgent.name}
              </span>
              <motion.svg
                className="w-4 h-4 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-72 glass border border-border rounded-xl shadow-lg z-50"
                >
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Select Agent
                    </div>
                    {Object.values(AGENTS).map((agent) => (
                      <motion.button
                        key={agent.id}
                        whileHover={{ x: 4 }}
                        onClick={() => handleAgentChange(agent.id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                          selectedAgent === agent.id 
                            ? 'agent-card selected' 
                            : 'hover:bg-custom-dark-tertiary'
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          {agent.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-text">{agent.name}</div>
                          <div className="text-xs text-text-secondary">{agent.description}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] p-4 ${
                  message.role === 'user' 
                    ? 'message-user' 
                    : 'message-ai'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
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
                  <p className="text-xs text-text-muted mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Animation */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="message-ai p-4 max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
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
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col items-center justify-center py-16 text-center space-y-8"
              >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
                className="relative"
              >
                <Image
                  src="/gpc-ai-logo.png"
                  alt="GPC AI Logo"
                  width={100}
                  height={100}
                  className="w-24 h-24 lg:w-28 lg:h-28 rounded-3xl object-cover"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-2xl lg:text-3xl font-heading font-semibold text-text">
                  Welcome to GPC AI
                </h2>
                <p className="text-text-secondary max-w-lg text-base lg:text-lg">
                  Choose an agent and start a conversation. I'm here to help with research, coding, creative tasks, and analysis.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full px-4"
              >
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="glass-light rounded-xl p-5 text-left hover:border-accent/50 transition-all duration-200 group min-h-[100px] lg:min-h-[110px]"
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
                      {action.icon}
                    </div>
                    <h3 className="font-heading font-medium text-text mb-2 text-base">
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
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="border-t border-border p-6 glass"
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
                  className="input-modern w-full px-5 py-4 text-text placeholder-text-muted pr-12"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="fab btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-14 h-14"
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
