'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, DocumentIcon, VideoIcon, UserIcon } from '@heroicons/react/24/outline';

interface Source {
  title: string;
  content: string;
  category: string;
  creator?: string;
  relevance: string;
  score: number;
  hasVideo: boolean;
  videoUrl?: string;
}

interface SourcesDropdownProps {
  sources: Source[];
  searchQuery: string;
  className?: string;
}

export function SourcesDropdown({ sources, searchQuery, className = '' }: SourcesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  const relevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const categoryColor = (category: string) => {
    const colors = {
      'Course Content': 'bg-blue-100 text-blue-800',
      'Books': 'bg-purple-100 text-purple-800',
      'Coaching Calls': 'bg-green-100 text-green-800',
      'Youtubers': 'bg-orange-100 text-orange-800',
      'YouTube (Chris)': 'bg-red-100 text-red-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <DocumentIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Sources ({sources.length})
          </span>
          <span className="text-xs text-gray-500">
            for "{searchQuery}"
          </span>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 bg-white">
          <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
            {sources.map((source, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {source.title}
                    </h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColor(source.category)}`}>
                        {source.category}
                      </span>
                      {source.creator && (
                        <span className="inline-flex items-center text-xs text-gray-600">
                          <UserIcon className="h-3 w-3 mr-1" />
                          {source.creator}
                        </span>
                      )}
                      {source.hasVideo && (
                        <span className="inline-flex items-center text-xs text-blue-600">
                          <VideoIcon className="h-3 w-3 mr-1" />
                          Video Available
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${relevanceColor(source.score)}`}>
                    {source.relevance} match
                  </span>
                </div>
                
                <div className="text-xs text-gray-600 mb-2">
                  <strong>Relevant content:</strong>
                </div>
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-blue-300 max-h-20 overflow-y-auto">
                  {source.content.length > 200 
                    ? `${source.content.substring(0, 200)}...` 
                    : source.content
                  }
                </div>
                
                {source.videoUrl && (
                  <div className="mt-2">
                    <a
                      href={source.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <VideoIcon className="h-3 w-3 mr-1" />
                      Watch Video
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="text-xs text-gray-600">
              <strong>Search Method:</strong> Semantic search across 196+ documents from top organic dropshipping creators
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Results ranked by relevance score (0-1) using AI embeddings
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
