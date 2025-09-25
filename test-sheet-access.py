#!/usr/bin/env python3
"""
Test different approaches to access the Google Sheet
"""

import os
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

def test_sheet_access():
    """Test different ways to access the sheet"""
    
    load_dotenv()
    sheet_id = os.getenv('GOOGLE_SHEET_ID')
    
    print(f"🧪 Testing Sheet Access for ID: {sheet_id}")
    print("=" * 50)
    
    # Load credentials
    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/documents.readonly'
    ]
    
    creds = Credentials.from_service_account_file(
        'google-credentials.json', scopes=SCOPES
    )
    
    sheets_service = build('sheets', 'v4', credentials=creds)
    
    # Try different approaches
    approaches = [
        ("Original ID", sheet_id),
        ("Without 'e/' prefix", sheet_id.replace('e/', '') if sheet_id.startswith('e/') else sheet_id),
        ("Direct sheet access", sheet_id.split('/')[-1] if '/' in sheet_id else sheet_id)
    ]
    
    for approach_name, test_id in approaches:
        print(f"\n🔍 Trying: {approach_name}")
        print(f"   ID: {test_id}")
        
        try:
            # Try to get sheet metadata first
            sheet_info = sheets_service.spreadsheets().get(
                spreadsheetId=test_id
            ).execute()
            
            print(f"   ✅ SUCCESS! Sheet title: {sheet_info.get('properties', {}).get('title', 'Unknown')}")
            
            # Try to read data
            range_name = 'A1:Z1'
            result = sheets_service.spreadsheets().values().get(
                spreadsheetId=test_id, range=range_name
            ).execute()
            
            values = result.get('values', [])
            if values:
                print(f"   ✅ Data access successful! Found {len(values[0])} columns")
                print(f"   📋 First few columns: {', '.join(values[0][:5])}...")
                return test_id  # Return the working ID
            else:
                print(f"   ⚠️ Sheet accessible but no data found")
                
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:100]}...")
    
    print(f"\n❌ All approaches failed. Let's try a different method...")
    return None

def test_csv_access():
    """Test if we can access the sheet via CSV export"""
    
    load_dotenv()
    sheet_id = os.getenv('GOOGLE_SHEET_ID')
    
    print(f"\n🔄 Trying CSV export approach...")
    
    # Try the CSV export URL
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid=0"
    
    try:
        import requests
        response = requests.get(csv_url)
        
        if response.status_code == 200:
            print("   ✅ CSV export successful!")
            print(f"   📊 First few lines:")
            lines = response.text.split('\n')[:3]
            for i, line in enumerate(lines):
                print(f"      {i+1}: {line[:100]}...")
            return True
        else:
            print(f"   ❌ CSV export failed: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ CSV export error: {e}")
    
    return False

if __name__ == "__main__":
    working_id = test_sheet_access()
    
    if not working_id:
        test_csv_access()
    
    if working_id:
        print(f"\n🎉 Found working approach!")
        print(f"   Update your .env file with: GOOGLE_SHEET_ID={working_id}")
    else:
        print(f"\n💡 Alternative approach needed...")
        print(f"   We might need to use a different method to access your sheet")
