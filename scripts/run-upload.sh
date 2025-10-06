#!/bin/bash

# Upload Knowledge Base to Pinecone
# This script fetches Google Docs content and uploads to Pinecone

echo "🚀 Starting Knowledge Base Upload to Pinecone"
echo ""
echo "This will:"
echo "1. Read your Google Sheet"
echo "2. Fetch FULL content from each Google Doc link"
echo "3. Upload to Pinecone with embeddings"
echo ""

# Check environment variables
if [ -z "$PINECONE_API_KEY" ]; then
  echo "❌ Error: PINECONE_API_KEY not set"
  exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY not set"
  exit 1
fi

if [ -z "$GOOGLE_SHEET_ID" ]; then
  echo "❌ Error: GOOGLE_SHEET_ID not set"
  exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Run the upload script
npx tsx scripts/fetch-from-sheets.ts

echo ""
echo "✅ Upload complete!"
