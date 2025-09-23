'use client';

import { useState, useEffect } from 'react';
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

export default function ModernChat() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const currentAgent = getAgentById(selectedAgent);

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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    setShowQuickActions(true);
  };

  return (
    <div className="antialiased min-h-screen bg-custom-dark">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-20 glass border-b border-border flex items-center justify-between px-6 relative z-50"
      >
        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-text-secondary hover:text-text transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* Centered Logo */}
        <div className="flex items-center justify-center flex-1">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <Image
              src="/gpc-ai-logo.png"
              alt="GPC AI Logo"
              width={64}
              height={64}
              className="w-16 h-16 rounded-2xl object-cover animate-float"
            />
            <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl opacity-20 blur-lg animate-pulse"></div>
          </motion.div>
        </div>

        {/* Desktop Sidebar Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="hidden md:flex w-10 h-10 glass-light rounded-full items-center justify-center hover:bg-accent/10 transition-all duration-200"
        >
          <motion.svg 
            className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </motion.svg>
        </motion.button>
      </motion.header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-80 glass border-r border-border p-6 relative z-40"
            >
              {/* Agent Selection */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <h3 className="text-lg font-heading font-semibold text-text mb-4">Select Agent</h3>
                <div className="space-y-3">
                  {Object.values(AGENTS).map((agent) => (
                    <motion.button
                      key={agent.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAgentChange(agent.id)}
                      className={`w-full agent-card p-4 text-left transition-all duration-300 ${
                        selectedAgent === agent.id ? 'selected' : 'glass-light'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          {agent.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text">{agent.name}</div>
                          <div className="text-xs text-text-secondary">{agent.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-3"
              >
                <h4 className="text-text font-heading font-semibold mb-3">Quick Actions</h4>
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="w-full text-left glass-light rounded-lg p-3 hover:border-gray-700 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 text-lg group-hover:scale-110 transition-transform duration-200">
                        {action.icon}
                      </div>
                      <span className="text-text group-hover:text-accent transition-colors duration-200">
                        {action.title}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Sidebar Icons */}
        {sidebarCollapsed && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-16 glass border-r border-border p-4 space-y-3"
          >
            {Object.values(AGENTS).map((agent) => (
              <motion.button
                key={agent.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAgentChange(agent.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                  selectedAgent === agent.id ? 'selected' : 'glass-light'
                }`}
                title={agent.name}
              >
                {agent.icon}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-custom-dark relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-black/5 to-green-900/10 pointer-events-none"></div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-4 ${
                    message.role === 'user' 
                      ? 'message-user' 
                      : 'message-ai'
                  }`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
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
                <div className="message-ai p-4 max-w-[70%]">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
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
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
                  className="relative"
                >
                  <Image
                    src="/gpc-ai-logo.png"
                    alt="GPC AI Logo"
                    width={120}
                    height={120}
                    className="w-30 h-30 rounded-3xl object-cover animate-float"
                  />
                  <div className="absolute -inset-4 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-3xl opacity-20 blur-xl animate-pulse"></div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="space-y-2"
                >
                  <h2 className="text-2xl font-heading font-semibold text-text">
                    Welcome to GPC AI
                  </h2>
                  <p className="text-text-secondary max-w-md">
                    Choose an agent and start a conversation. I'm here to help with research, coding, creative tasks, and analysis.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl"
                >
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="glass-light rounded-xl p-4 text-left hover:border-accent/50 transition-all duration-300 group"
                    >
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
                        {action.icon}
                      </div>
                      <h3 className="font-heading font-medium text-text mb-1">
                        {action.title}
                      </h3>
                      <p className="text-xs text-text-secondary">
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
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="border-t border-border p-6 glass relative z-10"
          >
            <div className="flex space-x-4 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Ask ${currentAgent.name} anything...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                  className="input-modern w-full px-4 py-3 text-text placeholder-text-muted pr-12"
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
                className="fab btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <motion.svg 
                  className="w-6 h-6 relative z-10" 
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
