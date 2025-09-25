#!/usr/bin/env python3
"""
Simplified Pinecone Setup for Google Sheets → Pinecone
Easy setup script for beginners
"""

import os
import json
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_pinecone():
    """Interactive setup for Pinecone knowledge base"""
    
    print("🚀 Pinecone Knowledge Base Setup")
    print("=" * 50)
    
    # Get API keys
    print("\n📝 Step 1: API Keys")
    pinecone_key = input("Enter your Pinecone API key: ").strip()
    openai_key = input("Enter your OpenAI API key: ").strip()
    
    # Get Google Sheet ID
    print("\n📊 Step 2: Google Sheet")
    sheet_id = input("Enter your Google Sheet ID: ").strip()
    
    # Get Google credentials
    print("\n🔐 Step 3: Google Credentials")
    creds_path = input("Enter path to Google service account JSON file: ").strip()
    
    # Validate inputs
    if not all([pinecone_key, openai_key, sheet_id, creds_path]):
        print("❌ All fields are required!")
        return
    
    # Create .env file
    with open('.env', 'w') as f:
        f.write(f"PINECONE_API_KEY={pinecone_key}\n")
        f.write(f"OPENAI_API_KEY={openai_key}\n")
        f.write(f"GOOGLE_SHEET_ID={sheet_id}\n")
        f.write(f"GOOGLE_CREDENTIALS_PATH={creds_path}\n")
    
    print("✅ Configuration saved to .env file")
    
    # Install dependencies
    print("\n📦 Step 4: Installing dependencies...")
    os.system("pip install pinecone-client openai google-api-python-client google-auth-httplib2 google-auth-oauthlib pandas python-dotenv")
    
    print("\n🎉 Setup complete!")
    print("\nNext steps:")
    print("1. Make sure your Google Sheet is shared with your service account")
    print("2. Run: python pinecone-setup.py")
    print("3. Wait for the processing to complete")
    print("4. Start querying your knowledge base!")

if __name__ == "__main__":
    setup_pinecone()
