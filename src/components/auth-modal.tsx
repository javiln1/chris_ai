'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidEmail) {
      onLogin(email);
      setEmail('');
      setIsValidEmail(false);
    }
  };

  const handleGuestMode = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-custom-dark-secondary border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">Welcome to GPC AI</h2>
              <p className="text-text-secondary">Sign in to save your chats and access them across devices</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-custom-dark border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-colors"
                  required
                />
                {email && !isValidEmail && (
                  <p className="text-red-400 text-sm mt-1">Please enter a valid email address</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={!isValidEmail}
                whileHover={{ scale: isValidEmail ? 1.02 : 1 }}
                whileTap={{ scale: isValidEmail ? 0.98 : 1 }}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isValidEmail
                    ? 'bg-lime-500 hover:bg-lime-400 text-black cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Sign In
              </motion.button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <button
                onClick={handleGuestMode}
                className="w-full py-3 text-text-secondary hover:text-text transition-colors"
              >
                Continue as Guest
              </button>
              <p className="text-xs text-text-secondary text-center mt-2">
                Guest mode saves chats locally on this device only
              </p>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-secondary hover:text-text transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
