'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

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
            <h1 className="text-xl font-semibold text-text">Settings</h1>
            <p className="text-sm text-text-secondary">Customize your GPC AI experience</p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-custom-dark-secondary rounded-xl p-6 border border-border"
          >
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>General</span>
            </h2>
            
            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text font-medium">Dark Mode</h3>
                  <p className="text-sm text-text-secondary">Use dark theme interface</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-lime-500' : 'bg-custom-dark-tertiary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Save Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text font-medium">Auto Save</h3>
                  <p className="text-sm text-text-secondary">Automatically save chat sessions</p>
                </div>
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoSave ? 'bg-lime-500' : 'bg-custom-dark-tertiary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Notifications Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-custom-dark-secondary rounded-xl p-6 border border-border"
          >
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 102.828 2.828L10.828 12M4.828 7H9a2 2 0 012 2v4.172M4.828 7L2 4.172l2.828 2.828z" />
              </svg>
              <span>Notifications</span>
            </h2>
            
            <div className="space-y-4">
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text font-medium">Push Notifications</h3>
                  <p className="text-sm text-text-secondary">Receive notifications for new messages</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-lime-500' : 'bg-custom-dark-tertiary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Voice Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-custom-dark-secondary rounded-xl p-6 border border-border"
          >
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Voice</span>
            </h2>
            
            <div className="space-y-4">
              {/* Voice Input Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-text font-medium">Voice Input</h3>
                  <p className="text-sm text-text-secondary">Enable voice transcription</p>
                </div>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    voiceEnabled ? 'bg-lime-500' : 'bg-custom-dark-tertiary'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-custom-dark-secondary rounded-xl p-6 border border-border"
          >
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Account</span>
            </h2>
            
            <div className="space-y-4">
              <button className="w-full text-left p-3 rounded-lg hover:bg-custom-dark-tertiary transition-colors">
                <h3 className="text-text font-medium">Export Chat Data</h3>
                <p className="text-sm text-text-secondary">Download your conversation history</p>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg hover:bg-custom-dark-tertiary transition-colors">
                <h3 className="text-text font-medium">Clear Chat History</h3>
                <p className="text-sm text-text-secondary">Delete all your conversations</p>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg hover:bg-custom-dark-tertiary transition-colors">
                <h3 className="text-text font-medium">Privacy Settings</h3>
                <p className="text-sm text-text-secondary">Manage your privacy preferences</p>
              </button>
            </div>
          </motion.div>
        </div>
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
