#!/usr/bin/env python3
"""
Google Sheets API Setup for Pinecone Knowledge Base
Simplified setup process
"""

import os
import json
from dotenv import load_dotenv

def setup_google_sheets():
    """Guide you through Google Sheets API setup"""
    
    print("📊 Google Sheets API Setup")
    print("=" * 40)
    print("This will allow the script to read your Google Sheet.")
    print()
    
    # Load environment variables
    load_dotenv()
    sheet_id = os.getenv('GOOGLE_SHEET_ID')
    
    print(f"📋 Your Google Sheet ID: {sheet_id}")
    print()
    
    print("🔧 Step-by-Step Setup:")
    print()
    
    print("1️⃣ Go to Google Cloud Console:")
    print("   https://console.cloud.google.com/")
    print()
    
    print("2️⃣ Create or select a project:")
    print("   - Click the project dropdown at the top")
    print("   - Create a new project or select existing one")
    print("   - Name it something like 'Pinecone Knowledge Base'")
    print()
    
    print("3️⃣ Enable APIs:")
    print("   - Go to 'APIs & Services' → 'Library'")
    print("   - Search for 'Google Sheets API' and enable it")
    print("   - Search for 'Google Docs API' and enable it")
    print()
    
    print("4️⃣ Create Service Account:")
    print("   - Go to 'IAM & Admin' → 'Service Accounts'")
    print("   - Click 'Create Service Account'")
    print("   - Name: 'pinecone-setup'")
    print("   - Description: 'Access Google Sheets for Pinecone'")
    print("   - Click 'Create and Continue'")
    print("   - Skip roles for now, click 'Continue'")
    print("   - Click 'Done'")
    print()
    
    print("5️⃣ Create API Key:")
    print("   - Click on your new service account")
    print("   - Go to 'Keys' tab")
    print("   - Click 'Add Key' → 'Create new key'")
    print("   - Choose 'JSON' format")
    print("   - Click 'Create'")
    print("   - Save the downloaded JSON file")
    print()
    
    print("6️⃣ Share Your Google Sheet:")
    print("   - Open your Google Sheet")
    print("   - Click 'Share' button")
    print("   - Add the service account email (from the JSON file)")
    print("   - Give it 'Viewer' access")
    print("   - Click 'Send'")
    print()
    
    print("📁 Place the JSON file in this folder and rename it to:")
    print("   google-credentials.json")
    print()
    
    print("✅ Once you've completed these steps, let me know!")
    print("   I'll test the Google Sheets connection and then we can start")
    print("   extracting your data to Pinecone!")

def test_google_sheets():
    """Test Google Sheets API connection"""
    
    print("\n🧪 Testing Google Sheets Connection...")
    
    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build
        
        # Check if credentials file exists
        if not os.path.exists('google-credentials.json'):
            print("❌ google-credentials.json file not found!")
            print("   Please complete the setup steps above first.")
            return False
        
        # Load credentials
        SCOPES = [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/documents.readonly'
        ]
        
        creds = Credentials.from_service_account_file(
            'google-credentials.json', scopes=SCOPES
        )
        
        # Test Sheets API
        sheets_service = build('sheets', 'v4', credentials=creds)
        
        # Load environment variables
        load_dotenv()
        sheet_id = os.getenv('GOOGLE_SHEET_ID')
        
        # Try to read the sheet
        range_name = 'A1:Z1'  # Just read the first row to test
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id, range=range_name
        ).execute()
        
        values = result.get('values', [])
        
        if values:
            print("✅ Google Sheets connection successful!")
            print(f"📊 Found {len(values[0])} columns in your sheet")
            print(f"📋 Column headers: {', '.join(values[0][:5])}...")
            return True
        else:
            print("❌ Could not read data from the sheet")
            return False
            
    except Exception as e:
        print(f"❌ Google Sheets connection failed: {e}")
        return False

if __name__ == "__main__":
    setup_google_sheets()
    
    # Check if credentials file exists
    if os.path.exists('google-credentials.json'):
        test_google_sheets()
    else:
        print("\n⏳ Complete the setup steps above, then run this script again.")
