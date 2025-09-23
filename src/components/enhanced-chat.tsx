'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';
import Image from 'next/image';
import { Response } from '@/components/ai-elements/response';
import { Message } from '@/components/ai-elements/message';
import { CodeBlock } from '@/components/ai-elements/code-block';
import { Sources } from '@/components/ai-elements/sources';
import { Actions } from '@/components/ai-elements/actions';
import FlowTab from '@/components/flow-tab';

export default function EnhancedChat() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'flow'>('chat');
  
  // Initialize with a welcome message
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your GPC AI assistant. How can I help you today?',
      },
    ],
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>;
    
    handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>);
    
    setTimeout(() => {
      handleSubmit(syntheticEvent);
    }, 0);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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
        
        {/* Centered Logo and Tabs */}
        <div className="flex items-center justify-center flex-1">
          <Image 
            src="/gpc-ai-logo.png" 
            alt="GPC AI Logo Design" 
            width={96} 
            height={96} 
            className="w-24 h-24 rounded-2xl object-cover"
          />
          
          {/* Tab Navigation */}
          <div className="ml-8 flex space-x-1 bg-custom-dark border border-border rounded-lg p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-accent text-black'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'flow'
                  ? 'bg-accent text-black'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Flow
            </button>
          </div>
        </div>

        {/* Desktop Sidebar Toggle */}
        <button 
          onClick={toggleSidebar}
          className="hidden md:flex w-8 h-8 bg-custom-dark border border-border rounded-full items-center justify-center hover:bg-custom-dark-secondary transition-all duration-200"
        >
          <svg className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Control Center - Only show in chat mode */}
        {activeTab === 'chat' && (
          <div className={`w-80 bg-custom-dark-secondary border-r border-border p-6 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0 p-0 border-r-0 overflow-hidden' : ''}`}>
          {/* Agents Toggle */}
          <div className="mb-6">
            <button className="flex items-center justify-between w-full text-left bg-custom-dark border border-border rounded-xl p-4 hover:border-gray-700 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-text">Agents</h3>
                  <p className="text-text-secondary text-sm">Select an AI agent to get started</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-accent/20 text-accent rounded-full mt-1">Enhanced</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>

          {/* History Toggle */}
          <div className="mb-6">
            <button className="flex items-center justify-between w-full text-left bg-custom-dark border border-border rounded-xl p-4 hover:border-gray-700 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-text">History</h3>
                  <p className="text-text-secondary text-sm">View your conversation history</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>

          {/* How to Use Toggle */}
          <div className="mb-6">
            <button className="flex items-center justify-between w-full text-left bg-custom-dark border border-border rounded-xl p-4 hover:border-gray-700 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-text">How to Use</h3>
                  <p className="text-text-secondary text-sm">Learn how to get the most out of GPC AI</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-text font-semibold mb-3">Quick Actions</h4>
            <button 
              onClick={() => handleSendMessage("Write a Python function to calculate fibonacci numbers")}
              className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span className="text-text">Code Example</span>
              </div>
            </button>
            <button 
              onClick={() => handleSendMessage("Explain how machine learning works with examples")}
              className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span className="text-text">Detailed Explanation</span>
              </div>
            </button>
            <button 
              onClick={() => handleSendMessage("What are the latest trends in AI?")}
              className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span className="text-text">AI Trends</span>
              </div>
            </button>
          </div>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'chat' ? (
          /* Main Chat Area */
          <div className="flex-1 flex flex-col bg-custom-dark">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Error Display */}
            {error && (
              <div className="flex justify-start">
                <div className="bg-red-900/20 border border-red-500/50 text-red-400 rounded-2xl p-4 max-w-[70%]">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">Error occurred</p>
                      <p className="text-xs text-red-300 mt-1">{error.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <Response>
                  {message.content}
                </Response>
                <div className="text-xs text-text-muted mt-2">
                  {new Date().toLocaleTimeString()}
                </div>
              </Message>
            ))}
            
            {isLoading && (
              <Message from="assistant">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <span className="text-sm text-text-muted ml-2">AI is thinking...</span>
                </div>
              </Message>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-6 bg-custom-dark-secondary">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={input}
                onChange={handleInputChange}
                className="flex-1 bg-custom-dark border border-border rounded-xl px-4 py-3 text-text placeholder-text-muted focus:outline-none focus:border-gray-700 focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-accent text-black hover:bg-accent/90 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
          </div>
        ) : (
          /* Flow Tab */
          <FlowTab className="flex-1" />
        )}
      </div>
    </div>
  );
}
