import React from 'react';
import { motion } from 'framer-motion';

interface HelpSupportPageProps {
  onBack: () => void;
}

export default function HelpSupportPage({ onBack }: HelpSupportPageProps) {
  const faqItems = [
    {
      question: "How do I switch between different AI models?",
      answer: "Click the dropdown menu in the top-right corner of the interface to select from ChatGPT 4.0, ChatGPT 5.0, Claude 3, Claude 4, or Gemini Pro. Each model has different strengths and capabilities."
    },
    {
      question: "How do I start a new chat?",
      answer: "Click the GPC AI logo in the header or use the 'New Chat' button in the sidebar to start a fresh conversation with the currently selected AI model."
    },
    {
      question: "Can I upload files to the AI?",
      answer: "Yes! Click the plus (+) button next to the input field to access file upload options including local files, Google Drive, and screenshots."
    },
    {
      question: "How do I use voice input?",
      answer: "Click the microphone button next to the input field to start voice transcription. The button will turn green and pulse while listening to your voice."
    },
    {
      question: "How do I access my chat history?",
      answer: "Click the hamburger menu (☰) in the top-left corner to open the sidebar and view all your previous chat sessions."
    },
    {
      question: "What are the different AI models good for?",
      answer: "ChatGPT 4.0 is great for general tasks and coding, Claude 3 excels at complex reasoning, ChatGPT 5.0 is best for creative tasks, Claude 4 handles advanced analysis, and Gemini Pro is excellent for research and multimodal content."
    }
  ];

  const supportOptions = [
    {
      title: "Email Support",
      description: "Get help via email",
      icon: "📧",
      action: "mailto:support@gpcai.com"
    },
    {
      title: "Documentation",
      description: "Read our guides",
      icon: "📚",
      action: "#"
    },
    {
      title: "Community",
      description: "Join our Discord",
      icon: "💬",
      action: "#"
    },
    {
      title: "Bug Report",
      description: "Report issues",
      icon: "🐛",
      action: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-custom-dark text-text">
      {/* Header */}
      <header className="border-b border-border bg-custom-dark-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-custom-dark-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-text">Help & Support</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-text mb-4">How can we help you?</h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Find answers to common questions, learn how to use GPC AI effectively, and get support when you need it.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h3 className="text-xl font-semibold text-text mb-6">Get Support</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportOptions.map((option, index) => (
              <motion.a
                key={index}
                href={option.action}
                className="bg-custom-dark-secondary hover:bg-custom-dark-tertiary rounded-lg p-6 transition-all duration-200 border border-border hover:border-primary/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-2xl mb-3">{option.icon}</div>
                <h4 className="font-medium text-text mb-2">{option.title}</h4>
                <p className="text-sm text-text-secondary">{option.description}</p>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="text-xl font-semibold text-text mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-custom-dark-secondary border border-border rounded-lg p-6"
              >
                <h4 className="font-medium text-text mb-3">{item.question}</h4>
                <p className="text-text-secondary leading-relaxed">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-custom-dark-secondary border border-border rounded-lg p-8 text-center"
        >
          <h3 className="text-xl font-semibold text-text mb-4">Still need help?</h3>
          <p className="text-text-secondary mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@gpcai.com"
              className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Contact Support
            </a>
            <a
              href="#"
              className="bg-custom-dark-tertiary hover:bg-custom-dark text-text px-6 py-3 rounded-lg font-medium transition-colors border border-border"
            >
              View Documentation
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
