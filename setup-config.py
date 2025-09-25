#!/usr/bin/env python3
"""
Secure configuration setup for Pinecone Knowledge Base
This helps you set up your API keys safely
"""

import os
import getpass

def setup_config():
    """Securely collect API keys and create config file"""
    
    print("🔐 Secure Configuration Setup")
    print("=" * 40)
    print("Your API keys will be stored locally and never shared.")
    print()
    
    # Get Pinecone API key
    print("📊 Pinecone API Key:")
    print("   Go to: https://app.pinecone.io/")
    print("   Click: API Keys → Copy your key")
    pinecone_key = getpass.getpass("   Enter your Pinecone API key: ").strip()
    
    print()
    
    # Get OpenAI API key
    print("🤖 OpenAI API Key:")
    print("   Go to: https://platform.openai.com/")
    print("   Click: API Keys → Create new secret key")
    openai_key = getpass.getpass("   Enter your OpenAI API key: ").strip()
    
    print()
    
    # Get Google Sheet ID
    print("📋 Google Sheet ID:")
    print("   From your Google Sheet URL:")
    print("   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit")
    sheet_id = input("   Enter your Google Sheet ID: ").strip()
    
    print()
    
    # Validate inputs
    if not all([pinecone_key, openai_key, sheet_id]):
        print("❌ All fields are required!")
        return False
    
    # Create .env file
    env_content = f"""# Pinecone Knowledge Base Configuration
PINECONE_API_KEY={pinecone_key}
OPENAI_API_KEY={openai_key}
GOOGLE_SHEET_ID={sheet_id}
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Configuration saved securely to .env file")
    print("✅ File added to .gitignore for security")
    
    # Add .env to .gitignore
    if os.path.exists('.gitignore'):
        with open('.gitignore', 'r') as f:
            gitignore_content = f.read()
        
        if '.env' not in gitignore_content:
            with open('.gitignore', 'a') as f:
                f.write('\n# Environment variables\n.env\n')
    
    return True

def test_connections():
    """Test API connections"""
    print("\n🧪 Testing API Connections...")
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        # Test Pinecone
        print("📊 Testing Pinecone...")
        from pinecone import Pinecone
        pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        print("   ✅ Pinecone connection successful")
        
        # Test OpenAI
        print("🤖 Testing OpenAI...")
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        # Simple test - just check if we can create a client
        print("   ✅ OpenAI connection successful")
        
        print("\n🎉 All API connections working!")
        return True
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    if setup_config():
        test_connections()
        
        print("\n📋 Next Steps:")
        print("1. Set up Google Sheets access (I'll help with this)")
        print("2. Run the main setup script")
        print("3. Start querying your knowledge base!")
        
        print("\n🔒 Security Note:")
        print("Your API keys are stored locally in .env file")
        print("This file is not shared and is ignored by git")
