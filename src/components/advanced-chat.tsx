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

export default function AdvancedChat() {
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
  const [isDragOver, setIsDragOver] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const currentAgent = getAgentById(selectedAgent);
  const currentSession = sessions.find(s => s.id === currentSessionId);

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
        // Implement screenshot capture
        console.log('Screenshot capture not implemented yet');
        break;
      case 'drive':
        // Implement Google Drive integration
        console.log('Google Drive integration not implemented yet');
        break;
      case 'more':
        // Implement more options
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
    <div className="min-h-screen bg-custom-dark flex">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay open lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`sidebar ${isSidebarOpen ? 'open' : ''} lg:translate-x-0 lg:relative lg:block`}
      >
        <div className="p-4 border-b border-border">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-custom-dark-tertiary hover:bg-custom-dark border border-border rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium text-text">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => selectSession(session.id)}
                className={`chat-session ${currentSessionId === session.id ? 'active' : ''}`}
              >
                <div className="chat-session-title">
                  {session.title}
                </div>
                <div className="chat-session-meta">
                  <div className="chat-session-agent">
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: `${getAgentById(session.agentId).color}20` }}
                    >
                      {getAgentById(session.agentId).icon}
                    </div>
                    <span>{getAgentById(session.agentId).name}</span>
                  </div>
                  <span>•</span>
                  <span>{formatTimeAgo(session.updatedAt)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="border-b border-border px-6 py-4 sticky top-0 z-40 bg-custom-dark/95 backdrop-blur-sm"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Left Side - Hamburger Menu and Logo */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-custom-dark-secondary transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
          </div>
        </motion.header>

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
                  {message.files && message.files.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {message.files.map(file => (
                        <div key={file.id} className="file-preview">
                          <span className="file-preview-icon">{getFileIcon(file.type)}</span>
                          <div className="file-preview-info">
                            <div className="file-preview-name">{file.name}</div>
                            <div className="file-preview-size">{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed font-body">
                    {message.content}
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
                  <div className="loading-dots">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                  <span className="text-sm text-text-muted">
                    {currentAgent.name} is thinking...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {showQuickActions && messages.length === 0 && (
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
                <p className="text-text-secondary text-base">
                  How can I help you today?
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full px-4"
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
        </div>

        {/* Input Area with File Upload */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="border-t border-border p-6 bg-custom-dark/95 backdrop-blur-sm"
        >
          <div className="max-w-4xl mx-auto">
            {/* File Previews */}
            {uploadedFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="file-preview">
                    <span className="file-preview-icon">{getFileIcon(file.type)}</span>
                    <div className="file-preview-info">
                      <div className="file-preview-name">{file.name}</div>
                      <div className="file-preview-size">{formatFileSize(file.size)}</div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-custom-dark rounded"
                    >
                      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-3 items-end">
              {/* Plus Button with File Menu */}
              <div className="relative" ref={fileMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                  className="plus-button"
                >
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>

                {/* File Menu */}
                <div className={`file-menu ${isFileMenuOpen ? 'open' : ''}`}>
                  <div className="file-menu-item" onClick={() => handleFileMenuAction('local')}>
                    <svg className="file-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="file-menu-text">Add from local files</span>
                  </div>
                  
                  <div className="file-menu-item" onClick={() => handleFileMenuAction('drive')}>
                    <svg className="file-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    <span className="file-menu-text">Add from Google Drive</span>
                  </div>
                  
                  <div className="file-menu-item" onClick={() => handleFileMenuAction('screenshot')}>
                    <svg className="file-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <span className="file-menu-text">Upload screenshot</span>
                  </div>
                  
                  <div className="file-menu-item" onClick={() => handleFileMenuAction('more')}>
                    <svg className="file-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                    <span className="file-menu-text">More</span>
                  </div>
                </div>
              </div>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Ask ${currentAgent.name} anything...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                  className="input-modern w-full px-4 py-3 text-text placeholder-text-muted pr-20"
                  disabled={isLoading}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
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
              
              {/* Send Button */}
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

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json"
        />
      </div>
    </div>
  );
}
