# 🔑 GPC AI - API Keys Setup Guide

## Quick Setup Steps

### 1. Create `.env.local` File
Create a file called `.env.local` in your project root with:

```bash
# GPC AI - Multi-Agent System API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here
MANUS_API_KEY=your_manus_api_key_here
```

### 2. Get API Keys

#### 🤖 OpenAI (ChatGPT 4.0 & 5.0)
- **URL**: https://platform.openai.com/api-keys
- **Cost**: Pay-per-use (~$0.002 per 1K tokens)
- **Key Format**: `sk-...`

#### 🧠 Claude (Claude 3 & 4)
- **URL**: https://console.anthropic.com/
- **Cost**: Pay-per-use (~$0.003 per 1K tokens)
- **Key Format**: `sk-ant-...`

#### 💎 Gemini (Gemini Pro)
- **URL**: https://makersuite.google.com/app/apikey
- **Cost**: Free tier available
- **Key Format**: Long alphanumeric string

#### 🚀 Manus
- **URL**: https://manus.ai/ (check for API access)
- **Status**: May be in beta/waitlist
- **Alternative**: Uses other providers under the hood

### 3. Test Your Setup

1. Add at least one API key to `.env.local`
2. Restart your development server: `npm run dev`
3. Open http://localhost:3000
4. Try chatting with different AI models!

## Current Status
✅ **OpenAI Integration**: Ready
✅ **Claude Integration**: Ready  
✅ **Gemini Integration**: Ready
⏳ **Manus Integration**: Pending (check availability)

## Next Steps
1. Get your first API key (OpenAI recommended)
2. Test the system
3. Add more providers as needed
4. Set up Supabase for vector storage
