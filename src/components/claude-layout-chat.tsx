'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
// Custom chat implementation - no need for external useChat
import { AGENTS, getAgentById } from '@/lib/agents';
import AgentsPage from './agents-page';
import ChatsPage from './chats-page';
import FoldersPage from './folders-page';
import SettingsPage from './settings-page';
import ProfilePage from './profile-page';
import HelpSupportPage from './help-support-page';
import ToggleSwitch from './toggle-switch';
import ConnectorsModal from './connectors-modal';

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

export default function ClaudeLayoutChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('chatgpt4');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isConnectorsMenuOpen, setIsConnectorsMenuOpen] = useState(false);
  const [enabledConnectors, setEnabledConnectors] = useState({
    'web-search': true,
    'google-drive': true,
    'gmail': true,
    'calendar': true,
    'mcp-server': false
  });
  const [showConnectorsModal, setShowConnectorsModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [starredSessions, setStarredSessions] = useState<string[]>([]);
  const [showAgentsPage, setShowAgentsPage] = useState(false);
  const [showChatsPage, setShowChatsPage] = useState(false);
  const [showFoldersPage, setShowFoldersPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showHelpSupportPage, setShowHelpSupportPage] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const connectorsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentAgent = getAgentById(selectedAgent);

  // Custom chat state management
  const [messages, setMessages] = useState<Message[]>([]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
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

      recognitionRef.current.onerror = (event: any) => {
        console.log('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      }
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
      if (connectorsMenuRef.current && !connectorsMenuRef.current.contains(event.target as Node)) {
        setIsConnectorsMenuOpen(false);
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
      // Show welcome state only for sessions with no messages
      setShowWelcome(currentSession.messages.length === 0);
    } else {
      setMessages([]);
      setShowWelcome(true);
    }
  }, [currentSession]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `New Chat with ${currentAgent.name}`,
      agentId: selectedAgent,
      messages: [], // Empty messages array to trigger welcome state
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]); // Clear any existing messages
    setInput(''); // Clear input field
    setShowWelcome(true); // Force show the welcome/main menu state
    setIsSidebarOpen(false);
    
        // Reset any open pages to ensure we return to main chat
        setShowAgentsPage(false);
        setShowChatsPage(false);
        setShowFoldersPage(false);
        setShowSettingsPage(false);
        setShowProfilePage(false);
        setShowHelpSupportPage(false);
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // If selecting a session with no messages, show welcome state
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.messages.length === 0) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
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

    // Hide welcome state and start chat
    setShowWelcome(false);

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

    try {
      // Call the AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          agentId: selectedAgent,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let aiResponse = '';
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        agentId: selectedAgent,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        console.log('Stream chunk:', chunk); // Debug log
        
        // AI SDK v5 returns plain text chunks, not formatted lines
        // Each chunk is a piece of the response
        aiResponse += chunk;
        
        // Update the message with streaming content
        const updatedMessage = { ...aiMessage, content: aiResponse };
        const updatedMessages = [...newMessages, updatedMessage];
        setMessages(updatedMessages);
        
        if (currentSessionId) {
          updateSession(currentSessionId, updatedMessages);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API key configuration.`,
        agentId: selectedAgent,
        timestamp: new Date(),
      };
      
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      
      if (currentSessionId) {
        updateSession(currentSessionId, finalMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log('Speech recognition start error:', error);
        setIsListening(false);
        setIsProcessing(false);
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
        // For now, trigger file input for screenshots
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*';
          fileInputRef.current.click();
          // Reset accept attribute after clicking
          setTimeout(() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json';
            }
          }, 100);
        }
        break;
      case 'drive':
        alert('Google Drive integration coming soon! For now, you can upload files locally.');
        break;
      case 'more':
        alert('More options coming soon! For now, you can upload local files and images.');
        break;
    }
  };

  const toggleConnector = (connectorId: string) => {
    setEnabledConnectors(prev => ({
      ...prev,
      [connectorId]: !prev[connectorId as keyof typeof prev]
    }));
  };

  const handleConnectorsMenuAction = (action: string) => {
    switch (action) {
      case 'add-connector':
        setIsConnectorsMenuOpen(false);
        setShowConnectorsModal(true);
        break;
      case 'manage-connectors':
        setIsConnectorsMenuOpen(false);
        alert('Manage connectors - Coming soon! You\'ll be able to configure and manage all your connected services.');
        break;
      default:
        // Don't close menu for toggle actions
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
      id: 'write',
      title: 'Write',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      prompt: 'Help me write a professional email',
    },
    {
      id: 'learn',
      title: 'Learn',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      prompt: 'Explain machine learning concepts',
    },
    {
      id: 'code',
      title: 'Code',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      prompt: 'Help me debug this code',
    },
    {
      id: 'life',
      title: 'Life stuff',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      prompt: 'Help me plan my day',
    },
    {
      id: 'drive',
      title: 'From Drive',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      prompt: 'Analyze my Google Drive files',
    },
  ];

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    setIsDropdownOpen(false);
  };

  const toggleStarSession = (sessionId: string) => {
    setStarredSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const navigateToAgentsPage = () => {
    setShowAgentsPage(true);
  };

  const handleBackFromAgents = () => {
    setShowAgentsPage(false);
  };

  const handleSelectAgentFromPage = (agentId: string) => {
    setSelectedAgent(agentId);
    setShowAgentsPage(false);
  };

  const navigateToChatsPage = () => {
    setShowChatsPage(true);
  };

  const handleBackFromChats = () => {
    setShowChatsPage(false);
  };

  const handleSelectChatFromPage = (chatId: string) => {
    selectSession(chatId);
    setShowChatsPage(false);
  };

  const navigateToFoldersPage = () => {
    setShowFoldersPage(true);
  };

  const handleBackFromFolders = () => {
    setShowFoldersPage(false);
  };

  const handleSelectChatFromFolders = (chatId: string) => {
    selectSession(chatId);
    setShowFoldersPage(false);
  };

  const navigateToSettings = () => {
    setShowSettingsPage(true);
  };

  const handleBackFromSettings = () => {
    setShowSettingsPage(false);
  };

  const navigateToProfile = () => {
    setShowProfilePage(true);
  };

  const handleBackFromProfile = () => {
    setShowProfilePage(false);
  };

  const navigateToHelpSupport = () => {
    setShowHelpSupportPage(true);
  };

  const handleBackFromHelpSupport = () => {
    setShowHelpSupportPage(false);
  };

  // Show agents page if requested
  if (showAgentsPage) {
    return (
      <AgentsPage
        onBack={handleBackFromAgents}
        onSelectAgent={handleSelectAgentFromPage}
        selectedAgent={selectedAgent}
      />
    );
  }

  // Show chats page if requested
  if (showChatsPage) {
    return (
      <ChatsPage
        onBack={handleBackFromChats}
        onSelectChat={handleSelectChatFromPage}
        currentSessionId={currentSessionId}
        sessions={sessions}
      />
    );
  }

  // Show folders page if requested
  if (showFoldersPage) {
    return (
      <FoldersPage
        onBack={handleBackFromFolders}
        onSelectChat={handleSelectChatFromFolders}
        currentSessionId={currentSessionId}
        sessions={sessions}
        starredSessions={starredSessions}
        onToggleStar={toggleStarSession}
      />
    );
  }

  // Show settings page if requested
  if (showSettingsPage) {
    return (
      <SettingsPage
        onBack={handleBackFromSettings}
      />
    );
  }

  // Show profile page if requested
  if (showProfilePage) {
    return (
      <ProfilePage
        onBack={handleBackFromProfile}
      />
    );
  }

  if (showHelpSupportPage) {
    return (
      <HelpSupportPage
        onBack={handleBackFromHelpSupport}
      />
    );
  }

  return (
    <div className="flex h-screen bg-custom-dark overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: isSidebarOpen ? 256 : 0 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0.0, 0.2, 1]
        }}
        className="bg-custom-dark-secondary border-r border-border overflow-hidden flex-shrink-0"
      >
        <div className="flex flex-col h-full w-64">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <button
              onClick={createNewSession}
              className="w-full text-white px-4 py-3 rounded-lg transition-colors font-medium mb-4"
              style={{ backgroundColor: '#26412C' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d4f34'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#26412C'}
            >
              New Chat
            </button>
          </div>

          {/* Folders Section */}
          <div className="px-4 py-2">
            <div 
              className="flex items-center space-x-2 p-2 hover:bg-custom-dark-tertiary rounded-lg cursor-pointer transition-colors"
              onClick={navigateToFoldersPage}
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm font-medium text-text">Folders</span>
              <svg className="w-3 h-3 text-text-secondary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Chats Section */}
          <div className="px-4 py-2">
            <div 
              className="flex items-center space-x-2 p-2 hover:bg-custom-dark-tertiary rounded-lg cursor-pointer transition-colors"
              onClick={navigateToChatsPage}
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium text-text">Chats</span>
              <svg className="w-3 h-3 text-text-secondary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Agents Section */}
          <div className="px-4 py-2">
            <div 
              className="flex items-center space-x-2 p-2 hover:bg-custom-dark-tertiary rounded-lg cursor-pointer transition-colors"
              onClick={navigateToAgentsPage}
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-text">Agents</span>
              <svg className="w-3 h-3 text-text-secondary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
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
                    className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-custom-dark-tertiary ${
                      currentSessionId === session.id ? 'bg-custom-dark-tertiary' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3" onClick={() => selectSession(session.id)}>
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
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarSession(session.id);
                        }}
                        className="p-1 hover:bg-custom-dark rounded transition-colors"
                      >
                        <svg 
                          className={`w-3 h-3 ${
                            starredSessions.includes(session.id) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-text-secondary'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Menu */}
          <div className="border-t border-border p-4 space-y-2">
            <button 
              onClick={navigateToSettings}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-custom-dark-tertiary transition-colors text-left"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-text">Settings</span>
            </button>
            
            <button 
              onClick={navigateToProfile}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-custom-dark-tertiary transition-colors text-left"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-text">Profile</span>
            </button>
            
            <button 
              onClick={navigateToHelpSupport}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-custom-dark-tertiary transition-colors text-left"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-text">Help & Support</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-custom-dark">
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
              className="p-2 hover:bg-custom-dark-tertiary rounded-lg transition-all duration-150 cursor-pointer bg-custom-dark-secondary border border-border min-w-[44px] min-h-[44px] touch-manipulation"
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
            
            {/* Clickable Logo */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createNewSession}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
              className="hover:opacity-80 transition-opacity duration-200 min-w-[44px] min-h-[44px] touch-manipulation"
            >
              <Image
                src="/gpc-ai-logo.png"
                alt="GPC AI Logo"
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg object-cover"
              />
            </motion.button>
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

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {showWelcome ? (
            /* Welcome State - Claude-style centered */
            <div className="flex items-center justify-center min-h-full px-4 sm:px-6">
              <div className="w-full max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-center space-y-8"
                >
                  {/* Welcome Message */}
                  <div className="space-y-4">
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
                        className="w-20 h-20 rounded-2xl object-cover mx-auto"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                      className="space-y-2"
                    >
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-text leading-tight">
                        Hello, how can I help you today?
                      </h2>
                    </motion.div>
                  </div>

                  {/* Main Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                    className="relative"
                  >
                    <div className="bg-custom-dark-secondary border border-gray-900 rounded-2xl p-3 sm:p-4 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="relative" ref={fileMenuRef}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                            className="bg-custom-dark-tertiary hover:bg-custom-dark rounded-full p-2 sm:p-2 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center"
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Connectors Button */}
                        <div className="relative" ref={connectorsMenuRef}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsConnectorsMenuOpen(!isConnectorsMenuOpen)}
                            className="bg-custom-dark-tertiary hover:bg-custom-dark rounded-full p-2 sm:p-2 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </motion.button>

                          {/* Connectors Menu */}
                          <AnimatePresence>
                            {isConnectorsMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 mb-2 bg-custom-dark-secondary border border-border rounded-lg shadow-lg p-2 space-y-1 w-56"
                              >
                                <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                    </svg>
                                    <span className="text-sm text-text">Web search</span>
                                  </div>
                                  <ToggleSwitch 
                                    enabled={enabledConnectors['web-search']} 
                                    onChange={() => toggleConnector('web-search')} 
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    </svg>
                                    <span className="text-sm text-text">Drive search</span>
                                  </div>
                                  <ToggleSwitch 
                                    enabled={enabledConnectors['google-drive']} 
                                    onChange={() => toggleConnector('google-drive')} 
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-text">Gmail search</span>
                                  </div>
                                  <ToggleSwitch 
                                    enabled={enabledConnectors['gmail']} 
                                    onChange={() => toggleConnector('gmail')} 
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-text">Calendar search</span>
                                  </div>
                                  <ToggleSwitch 
                                    enabled={enabledConnectors['calendar']} 
                                    onChange={() => toggleConnector('calendar')} 
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                    </svg>
                                    <span className="text-sm text-text">MCP Server</span>
                                  </div>
                                  <ToggleSwitch 
                                    enabled={enabledConnectors['mcp-server']} 
                                    onChange={() => toggleConnector('mcp-server')} 
                                  />
                                </div>
                                
                                <div className="border-t border-border my-1"></div>
                                
                                <div className="flex items-center gap-3 p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer" onClick={() => handleConnectorsMenuAction('add-connector')}>
                                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span className="text-sm text-text">Add connectors</span>
                                </div>
                                
                                <div className="flex items-center gap-3 p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer" onClick={() => handleConnectorsMenuAction('manage-connectors')}>
                                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  </svg>
                                  <span className="text-sm text-text">Manage connectors</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>


                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 max-w-4xl mx-auto px-4"
                  >
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 + index * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="bg-custom-dark-secondary hover:bg-custom-dark-tertiary rounded-lg px-3 py-3 sm:px-4 sm:py-2 text-sm font-medium text-text transition-all duration-200 flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation"
                      >
                        {action.icon}
                        <span>{action.title}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          ) : (
            /* Chat Messages - Normal chat view */
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
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
                      <div className={`max-w-[95%] sm:max-w-[85%] lg:max-w-[75%] ${
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

                {/* Loading Animation */}
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

              {/* Input Area - Bottom when in chat */}
              <div className="mt-4 sm:mt-8">
                <div className="bg-custom-dark-secondary border border-gray-900 rounded-2xl p-3 sm:p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative" ref={fileMenuRef}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                        className="bg-custom-dark-tertiary hover:bg-custom-dark rounded-full p-2 transition-colors flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation"
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Connectors Button */}
                    <div className="relative" ref={connectorsMenuRef}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsConnectorsMenuOpen(!isConnectorsMenuOpen)}
                        className="bg-custom-dark-tertiary hover:bg-custom-dark rounded-full p-2 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </motion.button>

                      {/* Connectors Menu */}
                      <AnimatePresence>
                        {isConnectorsMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 mb-2 bg-custom-dark-secondary border border-border rounded-lg shadow-lg p-2 space-y-1 w-56"
                          >
                            <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                              <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                </svg>
                                <span className="text-sm text-text">Web search</span>
                              </div>
                              <ToggleSwitch 
                                enabled={enabledConnectors['web-search']} 
                                onChange={() => toggleConnector('web-search')} 
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                              <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                </svg>
                                <span className="text-sm text-text">Drive search</span>
                              </div>
                              <ToggleSwitch 
                                enabled={enabledConnectors['google-drive']} 
                                onChange={() => toggleConnector('google-drive')} 
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                              <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-text">Gmail search</span>
                              </div>
                              <ToggleSwitch 
                                enabled={enabledConnectors['gmail']} 
                                onChange={() => toggleConnector('gmail')} 
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                              <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-text">Calendar search</span>
                              </div>
                              <ToggleSwitch 
                                enabled={enabledConnectors['calendar']} 
                                onChange={() => toggleConnector('calendar')} 
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer">
                              <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                                <span className="text-sm text-text">MCP Server</span>
                              </div>
                              <ToggleSwitch 
                                enabled={enabledConnectors['mcp-server']} 
                                onChange={() => toggleConnector('mcp-server')} 
                              />
                            </div>
                            
                            <div className="border-t border-border my-1"></div>
                            
                            <div className="flex items-center gap-3 p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer" onClick={() => handleConnectorsMenuAction('add-connector')}>
                              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-sm text-text">Add connectors</span>
                            </div>
                            
                            <div className="flex items-center gap-3 p-2 hover:bg-custom-dark-tertiary rounded cursor-pointer" onClick={() => handleConnectorsMenuAction('manage-connectors')}>
                              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              </svg>
                              <span className="text-sm text-text">Manage connectors</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

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
                        className="w-full px-4 py-3 pr-20 bg-transparent border-0 text-text placeholder-text-secondary focus:outline-none focus:ring-0 focus:border-transparent resize-none"
                        rows={1}
                        style={{
                          height: '44px',
                          minHeight: '44px'
                        }}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleVoiceInput}
                          disabled={isLoading}
                          className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors touch-manipulation ${
                            isListening ? 'bg-lime-500 animate-pulse' : 
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
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSendMessage(input)}
                      disabled={isLoading}
                      className={`p-3 sm:p-3 rounded-lg transition-all duration-200 flex-shrink-0 min-w-[44px] min-h-[44px] touch-manipulation ${
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
            </div>
          )}
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

        {/* Connectors Modal */}
        <ConnectorsModal 
          isOpen={showConnectorsModal} 
          onClose={() => setShowConnectorsModal(false)} 
        />
      </div>
    );
  }
