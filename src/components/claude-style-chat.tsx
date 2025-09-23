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
  files?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  content?: string;
}

interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ClaudeStyleChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentAgent = getAgentById(selectedAgent);
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load current session messages
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages);
      setSelectedAgent(currentSession.agentId);
    } else {
      setMessages([]);
      setShowQuickActions(true);
    }
  }, [currentSession]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `New Chat with ${currentAgent.name}`,
      agentId: selectedAgent,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setShowQuickActions(true);
    setIsSidebarOpen(false);
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const updateSession = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            messages: newMessages, 
            updatedAt: new Date(),
            title: newMessages.length > 0 
              ? newMessages[0].content.substring(0, 50) + (newMessages[0].content.length > 50 ? '...' : '')
              : session.title
          }
        : session
    ));
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      agentId: selectedAgent,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);
    setUploadedFiles([]);

    // Create session if none exists
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        agentId: selectedAgent,
        messages: newMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
    } else {
      updateSession(currentSessionId, newMessages);
    }

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This is a mock response from the ${currentAgent.name}. You asked: "${message}". The real AI integration will be connected soon!${uploadedFiles.length > 0 ? ` I can see you've uploaded ${uploadedFiles.length} file(s).` : ''}`,
        agentId: selectedAgent,
        timestamp: new Date(),
      };
      
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      
      if (currentSessionId) {
        updateSession(currentSessionId, finalMessages);
      }
      
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

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
    });
  };

  const handleFileMenuAction = (action: string) => {
    setIsFileMenuOpen(false);
    
    switch (action) {
      case 'local':
        fileInputRef.current?.click();
        break;
      case 'screenshot':
        console.log('Screenshot capture not implemented yet');
        break;
      case 'drive':
        console.log('Google Drive integration not implemented yet');
        break;
      case 'more':
        console.log('More options not implemented yet');
        break;
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('text')) return '📝';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📎';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
  };

  return (
    <div className="flex h-screen bg-custom-dark overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.2,
              ease: [0.4, 0.0, 0.2, 1]
            }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -256 }}
        animate={{ x: isSidebarOpen ? 0 : -256 }}
        transition={{ 
          duration: 0.25, 
          ease: [0.4, 0.0, 0.2, 1],
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-custom-dark-secondary shadow-2xl"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text mb-4">Chat History</h2>
            <button
              onClick={createNewSession}
              className="w-full bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-md transition-colors font-medium"
            >
              New Chat
            </button>
          </div>

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto py-4">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-text-secondary text-sm">No chat history yet</p>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => selectSession(session.id)}
                    className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-custom-dark-tertiary ${
                      currentSessionId === session.id ? 'bg-custom-dark-tertiary' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${getAgentById(session.agentId).color}20` }}
                      >
                        {getAgentById(session.agentId).icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {getAgentById(session.agentId).name} • {formatTimeAgo(session.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-custom-dark">
          {/* Left Side - Hamburger Menu and Logo */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
              className="p-2 hover:bg-custom-dark-tertiary rounded-lg transition-all duration-150 cursor-pointer bg-custom-dark-secondary border border-border"
            >
              <svg 
                className="w-5 h-5 text-text-secondary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              </svg>
            </motion.button>
            
            <div className="flex items-center space-x-3">
              <Image
                src="/gpc-ai-logo.png"
                alt="GPC AI Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-lg font-medium text-text">GPC AI</h1>
              </div>
            </div>
          </div>

          {/* Right Side - Agent Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 bg-custom-dark-secondary rounded-lg hover:bg-custom-dark-tertiary transition-all duration-200"
            >
              <span className="text-sm font-medium text-text">
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
                  className="absolute right-0 mt-2 w-48 bg-custom-dark-secondary border border-border rounded-lg shadow-lg z-50"
                >
                  <div className="p-1">
                    {Object.values(AGENTS).map((agent) => (
                      <motion.button
                        key={agent.id}
                        whileHover={{ x: 4 }}
                        onClick={() => handleAgentChange(agent.id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                          selectedAgent === agent.id 
                            ? 'bg-custom-dark-tertiary' 
                            : 'hover:bg-custom-dark-tertiary'
                        }`}
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          {agent.icon}
                        </div>
                        <span className="text-sm font-medium text-text">{agent.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Chat Messages Area - Claude-style centered layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Welcome State - Claude-style centered */}
            {showQuickActions && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-col items-center justify-center text-center space-y-8 min-h-[60vh]"
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
                  className="space-y-3"
                >
                  <h2 className="text-3xl font-medium text-text">
                    Welcome to GPC AI
                  </h2>
                  <p className="text-text-secondary text-lg">
                    How can I help you today?
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full"
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
                      className="bg-custom-dark-secondary rounded-xl p-6 text-center hover:bg-custom-dark-tertiary transition-all duration-200 group"
                    >
                      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                        {action.icon}
                      </div>
                      <h3 className="font-medium text-text text-base">
                        {action.title}
                      </h3>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Messages - Claude-style conversation flow */}
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] lg:max-w-[75%] ${
                      message.role === 'user' 
                        ? 'message-user' 
                        : 'message-ai'
                    }`}>
                      {message.files && message.files.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {message.files.map(file => (
                            <div key={file.id} className="flex items-center gap-2 p-2 bg-custom-dark-secondary rounded-lg">
                              <span className="text-sm">{getFileIcon(file.type)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate text-text">{file.name}</div>
                                <div className="text-xs opacity-75 text-text-secondary">{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="prose prose-invert max-w-none">
                        <p className="text-base leading-relaxed text-text whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading Animation - Claude-style */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="message-ai">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-text-secondary">
                        {currentAgent.name} is thinking...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area - Claude-style fixed bottom */}
        <div className="border-t border-border bg-custom-dark">
          <div className="max-w-4xl mx-auto px-6 py-4">
            {/* File Previews */}
            {uploadedFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-custom-dark-secondary rounded-lg">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text truncate">{file.name}</div>
                      <div className="text-xs text-text-secondary">{formatFileSize(file.size)}</div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-custom-dark-tertiary rounded transition-colors"
                    >
                      <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Container - Claude-style */}
            <div className="flex items-center space-x-3">
              {/* Plus Button */}
              <div className="relative" ref={fileMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                  className="bg-custom-dark-tertiary hover:bg-custom-dark rounded-full p-2 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>

                {/* File Menu */}
                <AnimatePresence>
                  {isFileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 mb-2 bg-custom-dark-secondary border border-border rounded-lg shadow-lg p-2 space-y-1 w-48"
                    >
                      <div className="flex items-center gap-3 p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer" onClick={() => handleFileMenuAction('local')}>
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-text">Add from local files</span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer" onClick={() => handleFileMenuAction('drive')}>
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        <span className="text-sm text-text">Add from Google Drive</span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer" onClick={() => handleFileMenuAction('screenshot')}>
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                        <span className="text-sm text-text">Upload screenshot</span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer" onClick={() => handleFileMenuAction('more')}>
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                        <span className="text-sm text-text">More</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Text Input - Claude-style */}
              <div className="flex-1 relative">
                <textarea
                  placeholder={`Ask ${currentAgent.name} anything...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(input);
                    }
                  }}
                  className="w-full px-4 py-3 pr-20 bg-custom-dark-secondary border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  disabled={isLoading}
                  rows={1}
                  style={{
                    height: '44px',
                    minHeight: '44px'
                  }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                  {/* Voice Input Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVoiceInput}
                    disabled={isLoading}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isListening ? 'bg-primary animate-pulse' : 
                      isProcessing ? 'bg-custom-dark-tertiary' : 
                      'bg-custom-dark-tertiary hover:bg-custom-dark'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-text-secondary rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    ) : (
                      <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </motion.button>
                </div>
              </div>
              
              {/* Send Button - Claude-style */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage(input)}
                disabled={isLoading}
                className={`p-3 rounded-lg transition-all duration-200 flex-shrink-0 ${
                  input.trim() 
                    ? 'bg-lime-500 hover:bg-lime-400 text-black' 
                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <motion.svg 
                  className="w-5 h-5" 
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
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json"
        />
      </main>
    </div>
  );
}
