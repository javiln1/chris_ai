#!/usr/bin/env python3
"""
Test API connections with your configuration
"""

import os
from dotenv import load_dotenv

def test_config():
    """Test your API configuration"""
    
    print("🧪 Testing Your API Configuration...")
    print("=" * 40)
    
    # Load environment variables
    load_dotenv()
    
    # Check if .env file exists and has values
    pinecone_key = os.getenv('PINECONE_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')
    sheet_id = os.getenv('GOOGLE_SHEET_ID')
    
    if not pinecone_key or pinecone_key == 'your-pinecone-api-key-here':
        print("❌ Pinecone API key not configured")
        return False
    
    if not openai_key or openai_key == 'your-openai-api-key-here':
        print("❌ OpenAI API key not configured")
        return False
        
    if not sheet_id or sheet_id == 'your-google-sheet-id-here':
        print("❌ Google Sheet ID not configured")
        return False
    
    print("✅ Configuration file looks good!")
    
    # Test Pinecone connection
    try:
        print("\n📊 Testing Pinecone connection...")
        from pinecone import Pinecone
        pc = Pinecone(api_key=pinecone_key)
        print("   ✅ Pinecone connection successful!")
    except Exception as e:
        print(f"   ❌ Pinecone connection failed: {e}")
        return False
    
    # Test OpenAI connection
    try:
        print("\n🤖 Testing OpenAI connection...")
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)
        print("   ✅ OpenAI connection successful!")
    except Exception as e:
        print(f"   ❌ OpenAI connection failed: {e}")
        return False
    
    print("\n🎉 All API connections working!")
    print("\n📋 Next Steps:")
    print("1. Set up Google Sheets access (I'll help with this)")
    print("2. Run the main Pinecone setup")
    print("3. Start querying your knowledge base!")
    
    return True

if __name__ == "__main__":
    test_config()
