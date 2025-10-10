'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function SuggestedPrompts({ suggestions, onSelect }: SuggestedPromptsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mt-4 space-y-2"
    >
      <div className="flex items-center gap-2 text-sm text-[#B3B3B3] mb-3">
        <Sparkles size={14} className="text-[#00ff00]" />
        <span>Suggested follow-up questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 255, 0, 0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(suggestion)}
            className="px-4 py-2 rounded-lg bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#00ff00] text-sm text-[#EAEAEA] transition-all duration-200 text-left max-w-full"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
