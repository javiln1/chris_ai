'use client';

import { useChat } from 'ai';
import { useState } from 'react';
import Image from 'next/image';
import { Response } from '@/components/ai-elements/response';
import { Message } from '@/components/ai-elements/message';
import { Branch } from '@/components/ai-elements/branch';
import FlowTab from '@/components/flow-tab';
import { getAgentById } from '@/lib/agents';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// STEP 3: Enhanced message parser function
const parseAndFormatMessage = (content: string) => {
  // Check if content contains SOURCES_DATA
  const sourcesMatch = content.match(/<!-- SOURCES_DATA: (.*?) -->/);
  
  if (sourcesMatch) {
    try {
      // Extract the main content (before sources)
      const mainContent = content.replace(/<!-- SOURCES_DATA:.*?-->/s, '').trim();
      
      // Parse the sources data
      const sourcesData = JSON.parse(sourcesMatch[1]);
      
      return {
        mainContent,
        sources: sourcesData.sources || [],
        sourceType: sourcesData.sourceType || 'none',
        searchQuery: sourcesData.searchQuery || '',
        hierarchy: sourcesData.hierarchy || ''
      };
    } catch (error) {
      console.error('Error parsing sources:', error);
      return { mainContent: content, sources: [] };
    }
  }
  
  return { mainContent: content, sources: [] };
};

// STEP 4: Copy to clipboard function
const copyToClipboard = async (text: string, showToast: (message: string) => void) => {
  try {
    // Remove sources data from the text if present
    const cleanText = text.replace(/<!-- SOURCES_DATA:.*?-->/s, '').trim();
    await navigator.clipboard.writeText(cleanText);
    showToast('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy');
  }
};

// STEP 5: Toast notification component
const Toast = ({ message, show }: { message: string; show: boolean }) => {
  if (!show) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-lime-500 text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

// STEP 6: Formatted message component with markdown support
const FormattedMessage = ({ content, role, onCopy }: { content: string; role: string; onCopy: () => void }) => {
  const [showCopyButton, setShowCopyButton] = useState(false);
  
  if (role === 'user') {
    // User messages remain plain text
    return (
      <p className="text-base leading-relaxed text-text whitespace-pre-wrap">
        {content}
      </p>
    );
  }
  
  // Assistant messages with markdown
  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowCopyButton(true)}
      onMouseLeave={() => setShowCopyButton(false)}
    >
      {/* Copy button */}
      <button
        onClick={onCopy}
        className={`absolute top-0 right-0 p-2 bg-custom-dark-secondary hover:bg-custom-dark-tertiary rounded-lg transition-all ${
          showCopyButton ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Copy message"
      >
        <svg className="w-4 h-4 text-text-secondary hover:text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      
      {/* Formatted markdown content */}
      <div className="prose prose-invert prose-lg max-w-none
        prose-headings:text-lime-400 prose-headings:font-bold
        prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
        prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
        prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
        prose-p:text-gray-200 prose-p:leading-relaxed prose-p:mb-4
        prose-strong:text-lime-300 prose-strong:font-semibold
        prose-em:text-gray-300
        prose-ul:text-gray-200 prose-ul:my-4 prose-ul:space-y-2
        prose-ol:text-gray-200 prose-ol:my-4 prose-ol:space-y-2
        prose-li:text-gray-200 prose-li:leading-relaxed
        prose-li:marker:text-lime-400
        prose-blockquote:text-gray-300 prose-blockquote:border-l-4 prose-blockquote:border-lime-400 prose-blockquote:pl-4 prose-blockquote:italic
        prose-code:text-lime-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg
        prose-a:text-lime-400 prose-a:no-underline hover:prose-a:text-lime-300 hover:prose-a:underline
        prose-hr:border-gray-700">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom code block rendering
            code({node, className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '');
              const inline = !match;
              
              return inline ? (
                <code className="bg-gray-800 text-lime-300 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              ) : (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg text-sm"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default function MultiAgentChat() {
  const [activeTab, setActiveTab] = useState<'chat' | 'flow'>('chat');
  
  // Add toast state
  const [toast, setToast] = useState({ show: false, message: '' });
  
  // Toast helper function
  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };
  
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
      agentId: 'general', // Always use general agent
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


  const currentAgent = getAgentById('general'); // Always use general agent

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

      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">

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
            
                {messages.map((message, index) => {
              const parsedContent = parseAndFormatMessage(message.content);
              
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
                      {/* Formatted message content with markdown */}
                      <FormattedMessage 
                        content={parsedContent.mainContent}
                        role={message.role}
                        onCopy={() => copyToClipboard(message.content, showToast)}
                      />
                      
                      {/* Always-visible copy button for assistant messages */}
                      {message.role === 'assistant' && (
                        <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                          <span className="text-xs text-text-secondary">
                            Response from {currentAgent.name}
                          </span>
                          <button
                            onClick={() => copyToClipboard(message.content, showToast)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-custom-dark-secondary hover:bg-custom-dark-tertiary rounded-lg transition-colors group"
                          >
                            <svg className="w-4 h-4 text-text-secondary group-hover:text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-text-secondary group-hover:text-lime-400">Copy</span>
                          </button>
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
        
        {/* Toast notification */}
        <Toast message={toast.message} show={toast.show} />
      </div>
    );
  }

