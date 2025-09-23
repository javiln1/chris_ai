'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    bio: 'AI enthusiast and creative thinker',
    location: 'San Francisco, CA',
    website: 'https://johndoe.com'
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to a backend
    console.log('Profile saved:', userInfo);
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
            <h1 className="text-xl font-semibold text-text">Profile</h1>
            <p className="text-sm text-text-secondary">Manage your account information</p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-custom-dark-secondary rounded-xl p-6 border border-border text-center"
          >
            {/* Avatar */}
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-lime-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-black">
                {userInfo.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            
            <h2 className="text-2xl font-semibold text-text mb-2">{userInfo.name}</h2>
            <p className="text-text-secondary mb-4">{userInfo.bio}</p>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-custom-dark-tertiary border border-border rounded-lg text-text hover:bg-custom-dark transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </motion.div>

          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-custom-dark-secondary rounded-xl p-6 border border-border"
          >
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Personal Information</span>
            </h3>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                    className="w-full px-3 py-2 bg-custom-dark border border-border rounded-lg text-text focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/20"
                  />
                ) : (
                  <p className="text-text">{userInfo.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                    className="w-full px-3 py-2 bg-custom-dark border border-border rounded-lg text-text focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/20"
                  />
                ) : (
                  <p className="text-text">{userInfo.email}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={userInfo.bio}
                    onChange={(e) => setUserInfo({...userInfo, bio: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 bg-custom-dark border border-border rounded-lg text-text focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/20 resize-none"
                  />
                ) : (
                  <p className="text-text">{userInfo.bio}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userInfo.location}
                    onChange={(e) => setUserInfo({...userInfo, location: e.target.value})}
                    className="w-full px-3 py-2 bg-custom-dark border border-border rounded-lg text-text focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/20"
                  />
                ) : (
                  <p className="text-text">{userInfo.location}</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={userInfo.website}
                    onChange={(e) => setUserInfo({...userInfo, website: e.target.value})}
                    className="w-full px-3 py-2 bg-custom-dark border border-border rounded-lg text-text focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/20"
                  />
                ) : (
                  <a 
                    href={userInfo.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lime-500 hover:text-lime-400 transition-colors"
                  >
                    {userInfo.website}
                  </a>
                )}
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-custom-dark-tertiary border border-border rounded-lg text-text hover:bg-custom-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-black rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#00ff00' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00cc00'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00ff00'}
                >
                  Save Changes
                </button>
              </div>
            )}
          </motion.div>

          {/* Account Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-custom-dark-secondary rounded-xl p-6 border border-border"
          >
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Account Statistics</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-text">24</div>
                <div className="text-sm text-text-secondary">Chats</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text">156</div>
                <div className="text-sm text-text-secondary">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text">5</div>
                <div className="text-sm text-text-secondary">Agents Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-text">7d</div>
                <div className="text-sm text-text-secondary">Active</div>
              </div>
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
