import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  enabled: boolean;
}

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectorsModal({ isOpen, onClose }: ConnectorsModalProps) {
  const connectors: Connector[] = [
    {
      id: 'asana',
      name: 'Asana',
      description: 'Connect to Asana to coordinate tasks, projects, and goals.',
      icon: '🔺',
      category: 'Productivity',
      enabled: false
    },
    {
      id: 'atlassian',
      name: 'Atlassian',
      description: 'Access Jira & Confluence from GPC AI.',
      icon: '🔷',
      category: 'Productivity',
      enabled: false
    },
    {
      id: 'box',
      name: 'Box',
      description: 'Search, access and get insights on your Box content.',
      icon: '📦',
      category: 'Storage',
      enabled: false
    },
    {
      id: 'canva',
      name: 'Canva',
      description: 'Search, create, autofill, and export Canva designs.',
      icon: '🎨',
      category: 'Design',
      enabled: false
    },
    {
      id: 'close',
      name: 'Close',
      description: 'Connect GPC AI to Close CRM to securely access and act on your sales data.',
      icon: '💼',
      category: 'CRM',
      enabled: false
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare Developer',
      description: 'Build applications with compute, storage, and AI.',
      icon: '☁️',
      category: 'Development',
      enabled: false
    },
    {
      id: 'cloudinary',
      name: 'Cloudinary',
      description: 'Manage, transform and deliver your images & videos.',
      icon: '📸',
      category: 'Media',
      enabled: false
    },
    {
      id: 'fireflies',
      name: 'Fireflies',
      description: 'Analyze and generate insights from meeting transcripts.',
      icon: '🔥',
      category: 'Communication',
      enabled: false
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Draft replies, summarize threads, & search your inbox.',
      icon: '📧',
      category: 'Communication',
      enabled: true
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Understand your schedule and optimize your time.',
      icon: '📅',
      category: 'Productivity',
      enabled: true
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Find and analyze files instantly.',
      icon: '💾',
      category: 'Storage',
      enabled: true
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Chat with your CRM data to get personalized insights.',
      icon: '🎯',
      category: 'CRM',
      enabled: false
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      description: 'Access thousands of AI models and datasets.',
      icon: '🤗',
      category: 'AI/ML',
      enabled: false
    },
    {
      id: 'indeed',
      name: 'Indeed',
      description: 'Search jobs and analyze market trends.',
      icon: '💼',
      category: 'Recruitment',
      enabled: false
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Access and organize your Notion workspace.',
      icon: '📝',
      category: 'Productivity',
      enabled: false
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Search messages, channels, and files across your workspace.',
      icon: '💬',
      category: 'Communication',
      enabled: false
    },
    {
      id: 'trello',
      name: 'Trello',
      description: 'Manage boards, cards, and team collaboration.',
      icon: '📋',
      category: 'Productivity',
      enabled: false
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect thousands of apps and automate workflows.',
      icon: '⚡',
      category: 'Automation',
      enabled: false
    }
  ];

  const categories = ['All', 'Productivity', 'Communication', 'Storage', 'CRM', 'Design', 'Development', 'AI/ML', 'Automation', 'Media', 'Recruitment'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredConnectors = connectors.filter(connector => {
    const matchesCategory = selectedCategory === 'All' || connector.category === selectedCategory;
    const matchesSearch = connector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connector.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnectorToggle = (connectorId: string) => {
    // This would normally update the connector state
    console.log(`Toggled connector: ${connectorId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 bg-custom-dark border border-border rounded-lg shadow-2xl z-50 flex flex-col max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold text-text">Connectors</h2>
                <p className="text-text-secondary mt-2">
                  Unlock more with GPC AI when you connect with remote and local tools. Choose from verified connectors, 
                  <span className="text-primary cursor-pointer hover:underline"> add a custom one</span> — or 
                  <span className="text-primary cursor-pointer hover:underline"> learn more</span> about connectors.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-custom-dark-secondary hover:bg-custom-dark-tertiary border border-border rounded-lg text-text transition-colors">
                  Manage connectors
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-custom-dark-tertiary rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex space-x-6">
                <button className="text-text border-b-2 border-primary pb-2 font-medium">Web</button>
                <button className="text-text-secondary hover:text-text transition-colors pb-2">Desktop extensions</button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search connectors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-custom-dark-secondary border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  {categories.slice(0, 6).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary text-black'
                          : 'bg-custom-dark-secondary text-text-secondary hover:text-text'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Connectors Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredConnectors.map((connector) => (
                  <motion.div
                    key={connector.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-custom-dark-secondary border border-border rounded-lg p-4 hover:bg-custom-dark-tertiary transition-colors cursor-pointer"
                    onClick={() => handleConnectorToggle(connector.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{connector.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-text">{connector.name}</h3>
                          <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                            {connector.description}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        {connector.enabled ? (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-border rounded-full flex items-center justify-center hover:border-primary transition-colors">
                            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
