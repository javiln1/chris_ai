'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function SimpleChat() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your GPC AI assistant with specialized agents. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('general');

  const agents = {
    general: { name: 'General Assistant', icon: '🤖', color: '#00ff00' },
    research: { name: 'Research Agent', icon: '🔍', color: '#3b82f6' },
    code: { name: 'Code Agent', icon: '💻', color: '#f59e0b' },
    creative: { name: 'Creative Agent', icon: '🎨', color: '#ec4899' },
    analysis: { name: 'Analysis Agent', icon: '📊', color: '#8b5cf6' },
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm the ${agents[selectedAgent as keyof typeof agents].name} ${agents[selectedAgent as keyof typeof agents].icon}. I received your message: "${input}". This is a demo response - the full AI integration is ready to be activated!`,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const currentAgent = agents[selectedAgent as keyof typeof agents];

  return (
    <div className="antialiased">
      {/* Header */}
      <header className="h-20 bg-custom-dark-secondary border-b border-border flex items-center justify-between px-6 relative">
        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-text-secondary hover:text-text transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        
        {/* Centered Logo */}
        <div className="flex items-center justify-center flex-1">
          <Image 
            src="/gpc-ai-logo.png" 
            alt="GPC AI Logo Design" 
            width={96} 
            height={96} 
            className="w-24 h-24 rounded-2xl object-cover"
          />
        </div>

        {/* Desktop Sidebar Toggle */}
        <button className="hidden md:flex w-8 h-8 bg-custom-dark border border-border rounded-full items-center justify-center hover:bg-custom-dark-secondary transition-all duration-200">
          <svg className="w-4 h-4 text-text-secondary transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Control Center */}
        <div className="w-80 bg-custom-dark-secondary border-r border-border p-6">
          
          {/* Agent Selector */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text mb-3">Select Agent</h3>
            <div className="space-y-2">
              {Object.entries(agents).map(([id, agent]) => (
                <button
                  key={id}
                  onClick={() => setSelectedAgent(id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                    selectedAgent === id
                      ? 'bg-accent/20 border-accent'
                      : 'bg-custom-dark border-border hover:border-gray-700'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: agent.color + '20' }}
                  >
                    {agent.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-text">{agent.name}</div>
                    <div className="text-xs text-text-secondary">
                      {id === 'general' && 'All-purpose AI assistant'}
                      {id === 'research' && 'Information and fact-checking expert'}
                      {id === 'code' && 'Programming specialist'}
                      {id === 'creative' && 'Writing and design expert'}
                      {id === 'analysis' && 'Data analysis specialist'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-text font-semibold mb-3">Quick Actions</h4>
            <button 
              onClick={() => setInput("Research the latest AI trends")}
              className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 text-blue-400">🔍</div>
                <span className="text-text">Research AI Trends</span>
              </div>
            </button>
            <button 
              onClick={() => setInput("Write a Python function to calculate fibonacci")}
              className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 text-yellow-400">💻</div>
                <span className="text-text">Code Example</span>
              </div>
            </button>
            <button 
              onClick={() => setInput("Help me brainstorm creative ideas")}
              className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 text-pink-400">🎨</div>
                <span className="text-text">Creative Brainstorm</span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-custom-dark">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl p-4 ${
                  message.role === 'user' 
                    ? 'bg-accent text-black' 
                    : 'bg-custom-dark-tertiary text-text border border-border'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: currentAgent.color + '20' }}
                      >
                        {currentAgent.icon}
                      </div>
                      <span className="text-xs text-text-secondary">{currentAgent.name}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-custom-dark-tertiary text-text border border-border rounded-2xl p-4 max-w-[70%]">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: currentAgent.color + '20' }}
                    >
                      {currentAgent.icon}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      <span className="text-sm text-text-muted ml-2">{currentAgent.name} is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-6 bg-custom-dark-secondary">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder={`Ask ${currentAgent.name} anything...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-custom-dark border border-border rounded-xl px-4 py-3 text-text placeholder-text-muted focus:outline-none focus:border-gray-700 focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-accent text-black hover:bg-accent/90 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ 
                  backgroundColor: input.trim() ? '#00ff00' : '#00ff0030',
                  color: input.trim() ? '#000000' : '#ffffff'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
