'use client';

import { useChat } from 'ai';
import { useState } from 'react';
import Image from 'next/image';
import { Response } from '@/components/ai-elements/response';
import { Message } from '@/components/ai-elements/message';
import { Branch } from '@/components/ai-elements/branch';
import FlowTab from '@/components/flow-tab';
import AgentSelector from '@/components/agent-selector';
import { SourcesDropdown } from '@/components/sources-dropdown';
import { getAgentById, detectAgentType } from '@/lib/agents';

export default function MultiAgentChat() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'flow'>('chat');
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [agentSuggestions, setAgentSuggestions] = useState<string[]>([]);
  
  // Initialize with a welcome message
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your GPC AI assistant with access to your dropshipping knowledge base. How can I help you today?',
      },
    ],
    onError: (error) => {
      console.error('Chat error:', error);
    },
    body: {
      agentId: selectedAgent,
    },
  });

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Auto-detect agent if none selected
    const detectedAgent = detectAgentType(message);
    if (selectedAgent === 'general' && detectedAgent !== 'general') {
      setSelectedAgent(detectedAgent);
      setAgentSuggestions([detectedAgent]);
    }
    
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

  const currentAgent = getAgentById(selectedAgent);

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
            
            {/* Agent Selector */}
            <div className="mb-6">
              <AgentSelector 
                selectedAgent={selectedAgent}
                onAgentChange={setSelectedAgent}
              />
            </div>

            {/* Agent Suggestions */}
            {agentSuggestions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-text font-semibold mb-3">Suggested Agent</h4>
                <div className="space-y-2">
                  {agentSuggestions.map((agentId) => {
                    const agent = getAgentById(agentId);
                    return (
                      <button
                        key={agentId}
                        onClick={() => setSelectedAgent(agentId)}
                        className={`w-full text-left bg-custom-dark border border-border rounded-lg p-3 transition-all duration-200 ${
                          selectedAgent === agentId ? 'border-accent bg-accent/10' : 'hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                            style={{ backgroundColor: agent.color + '20' }}
                          >
                            {agent.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text">{agent.name}</div>
                            <div className="text-xs text-text-secondary">{agent.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-text font-semibold mb-3">Quick Actions</h4>
              <button 
                onClick={() => handleSendMessage("How do I find winning dropshipping products?")}
                className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-400">🛍️</div>
                  <span className="text-text">Find Winning Products</span>
                </div>
              </button>
              <button 
                onClick={() => handleSendMessage("Show me successful case studies from Bsmfredo")}
                className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-blue-400">📈</div>
                  <span className="text-text">Bsmfredo Case Studies</span>
                </div>
              </button>
              <button 
                onClick={() => handleSendMessage("What are the best viral strategies for organic dropshipping?")}
                className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-red-400">🚀</div>
                  <span className="text-text">Viral Strategies</span>
                </div>
              </button>
              <button 
                onClick={() => handleSendMessage("Help me with TikTok organic marketing strategies")}
                className="w-full text-left bg-custom-dark border border-border rounded-lg p-3 hover:border-gray-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-purple-400">📱</div>
                  <span className="text-text">TikTok Marketing</span>
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
            
            {messages.map((message) => {
              // Extract sources from message if available
              let sources = [];
              let searchQuery = '';
              let cleanContent = message.content;
              
              // Try to parse sources from the message content
              try {
                console.log('🔍 Parsing message content for sources...');
                console.log('Message content:', message.content.substring(0, 200) + '...');
                
                // Look for sources data in HTML comment format
                const sourcesMatch = message.content.match(/<!-- SOURCES_DATA: ({[\s\S]*?}) -->/);
                console.log('Sources match result:', sourcesMatch);
                
                if (sourcesMatch) {
                  console.log('✅ Found sources data, parsing JSON...');
                  const sourcesData = JSON.parse(sourcesMatch[1]);
                  sources = sourcesData.sources || [];
                  searchQuery = sourcesData.searchQuery || '';
                  console.log('📊 Parsed sources:', sources.length, 'sources');
                  console.log('🔍 Search query:', searchQuery);
                } else {
                  console.log('❌ No sources data found in message');
                }
                
                // Clean content by removing HTML comments
                cleanContent = message.content
                  .replace(/<!-- SOURCES_DATA: {.*?} -->/g, '')
                  .trim();
                console.log('🧹 Cleaned content length:', cleanContent.length);
              } catch (error) {
                console.error('❌ Error parsing sources from message:', error);
                cleanContent = message.content;
              }
              
              return (
                <Message key={message.id} from={message.role}>
                  <div className="flex items-start space-x-3">
                    {/* Agent Indicator for Assistant Messages */}
                    {message.role === 'assistant' && (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
                        style={{ backgroundColor: currentAgent.color + '20' }}
                      >
                        {currentAgent.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <Response>
                        {cleanContent}
                      </Response>
                      
                      {/* Sources Dropdown for Assistant Messages */}
                      {message.role === 'assistant' && sources.length > 0 && (
                        <div className="mt-3">
                          <SourcesDropdown 
                            sources={sources}
                            searchQuery={searchQuery || 'knowledge base search'}
                            className="max-w-full"
                          />
                        </div>
                      )}
                      
                      <div className="text-xs text-text-muted mt-2">
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </Message>
              );
            })}
            
            {isLoading && (
              <Message from="assistant">
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
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
              </Message>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-6 bg-custom-dark-secondary">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                placeholder={`Ask ${currentAgent.name} anything...`}
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

