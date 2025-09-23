'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getAgentById } from '@/lib/agents';

interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

interface FoldersPageProps {
  onBack: () => void;
  onSelectChat: (chatId: string) => void;
  currentSessionId: string;
  sessions: ChatSession[];
  starredSessions: string[];
  onToggleStar: (sessionId: string) => void;
}

export default function FoldersPage({ 
  onBack, 
  onSelectChat, 
  currentSessionId, 
  sessions, 
  starredSessions, 
  onToggleStar 
}: FoldersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alphabetical'>('recent');

  // Filter starred sessions and apply search
  const starredSessionsData = useMemo(() => {
    return sessions.filter(session => starredSessions.includes(session.id));
  }, [sessions, starredSessions]);

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = starredSessionsData.filter(session => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        session.title.toLowerCase().includes(query) ||
        getAgentById(session.agentId).name.toLowerCase().includes(query) ||
        (session.lastMessage && session.lastMessage.toLowerCase().includes(query))
      );
    });

    // Sort sessions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'oldest':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [starredSessionsData, searchQuery, sortBy]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  return (
    <div className="h-screen bg-custom-dark overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-custom-dark-tertiary rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h1 className="text-xl font-semibold text-text">Starred Chats</h1>
            </div>
            <p className="text-sm text-text-secondary">Your favorite conversations</p>
          </div>
        </div>
      </div>

      {/* Search and Sort Bar */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search starred chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-custom-dark-secondary border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/20 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="w-4 h-4 text-text-secondary hover:text-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest' | 'alphabetical')}
              className="appearance-none bg-custom-dark-secondary border border-border rounded-lg px-4 py-3 pr-8 text-text focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/20 transition-colors"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">A-Z</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 text-sm text-text-secondary">
          {searchQuery ? (
            <span>
              {filteredAndSortedSessions.length} of {starredSessionsData.length} starred chats match "{searchQuery}"
            </span>
          ) : (
            <span>{starredSessionsData.length} starred chats</span>
          )}
        </div>
      </div>

      {/* Starred Chats List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAndSortedSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-custom-dark-secondary rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-text mb-2">
              {starredSessionsData.length === 0 
                ? 'No starred chats yet' 
                : searchQuery 
                  ? 'No starred chats found' 
                  : 'No starred chats'
              }
            </h3>
            <p className="text-text-secondary">
              {starredSessionsData.length === 0
                ? 'Star chats by clicking the star icon to save them here'
                : searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Star some chats to see them here'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {filteredAndSortedSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectChat(session.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                  currentSessionId === session.id 
                    ? 'bg-custom-dark-tertiary border-lime-500/50' 
                    : 'bg-custom-dark-secondary border-border hover:border-lime-500/30 hover:bg-custom-dark-tertiary'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Agent Icon */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${getAgentById(session.agentId).color}20` }}
                  >
                    {getAgentById(session.agentId).icon}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-medium text-text truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(session.id);
                          }}
                          className="p-1 hover:bg-custom-dark rounded transition-colors"
                        >
                          <svg className="w-5 h-5 text-yellow-400 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <span className="text-sm text-text-secondary">
                          {formatTimeAgo(session.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span 
                        className="px-2 py-1 text-xs rounded-full font-medium"
                        style={{ 
                          backgroundColor: `${getAgentById(session.agentId).color}15`,
                          color: getAgentById(session.agentId).color
                        }}
                      >
                        {getAgentById(session.agentId).name}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {session.messageCount} messages
                      </span>
                    </div>

                    {/* Last Message Preview */}
                    {session.lastMessage && (
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {session.lastMessage}
                      </p>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {currentSessionId === session.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center flex-shrink-0"
                    >
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-border p-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-custom-dark-secondary border border-border rounded-lg text-text hover:bg-custom-dark-tertiary transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
}
