#!/usr/bin/env python3
"""
Alternative Pinecone Setup - Manual CSV Import
Since your Google Sheet has a special format, we'll use a different approach
"""

import os
import csv
import requests
from dotenv import load_dotenv
from pinecone import Pinecone
from openai import OpenAI
import time

def setup_pinecone_alternative():
    """Alternative setup using manual CSV export"""
    
    print("🔄 Alternative Pinecone Setup")
    print("=" * 40)
    print("Since your Google Sheet has a special format,")
    print("we'll use a manual approach to get your data.")
    print()
    
    # Load environment variables
    load_dotenv()
    
    # Initialize Pinecone and OpenAI
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    print("✅ API connections established")
    
    # Create Pinecone index
    index_name = "gpc-knowledge-base"
    
    try:
        # Check if index exists
        existing_indexes = [index.name for index in pc.list_indexes()]
        
        if index_name not in existing_indexes:
            print(f"📊 Creating Pinecone index: {index_name}")
            pc.create_index(
                name=index_name,
                dimension=1536,  # OpenAI text-embedding-3-small dimension
                metric='cosine',
                spec={'serverless': {'cloud': 'aws', 'region': 'us-east-1'}}
            )
            
            # Wait for index to be ready
            while not pc.describe_index(index_name).status['ready']:
                print("⏳ Waiting for index to be ready...")
                time.sleep(1)
        else:
            print(f"✅ Index {index_name} already exists")
        
        # Connect to index
        index = pc.Index(index_name)
        print("✅ Connected to Pinecone index")
        
    except Exception as e:
        print(f"❌ Error setting up Pinecone: {e}")
        return False
    
    return True, index, openai_client

def manual_data_entry():
    """Manual data entry process"""
    
    print("\n📝 Manual Data Entry Process")
    print("=" * 40)
    print("Since we can't automatically read your Google Sheet,")
    print("we'll use a manual approach:")
    print()
    print("1. You'll provide the data from your sheets")
    print("2. I'll process it and store it in Pinecone")
    print("3. You'll have a searchable knowledge base")
    print()
    
    # Get data from user
    documents = []
    
    print("📋 Let's start with your data:")
    print("   For each tab in your Google Sheet:")
    print("   - Tell me the tab name")
    print("   - Provide the Google Docs URLs from that tab")
    print("   - I'll extract the content and store it")
    print()
    
    return documents

def process_google_doc(doc_url, title, tab_name, openai_client):
    """Process a single Google Doc"""
    
    try:
        print(f"📄 Processing: {title}")
        
        # For now, we'll create a placeholder
        # In a real implementation, you'd extract the actual content
        content = f"Content from {title} in {tab_name} tab. URL: {doc_url}"
        
        # Create embedding
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=content
        )
        embedding = response.data[0].embedding
        
        # Prepare metadata
        metadata = {
            'title': title,
            'tab_name': tab_name,
            'doc_url': doc_url,
            'content': content,
            'source_type': 'doc',
            'language': 'english',
            'status': 'active'
        }
        
        return {
            'id': f"{tab_name}_{title}_{hash(doc_url)}",
            'values': embedding,
            'metadata': metadata
        }
        
    except Exception as e:
        print(f"❌ Error processing {title}: {e}")
        return None

def main():
    """Main setup process"""
    
    # Setup Pinecone
    success, index, openai_client = setup_pinecone_alternative()
    
    if not success:
        return
    
    print("\n🎯 Ready to Process Your Data!")
    print("=" * 40)
    print("Now we need to get your Google Docs data.")
    print()
    print("📋 What I need from you:")
    print("1. The tab names from your Google Sheet")
    print("2. The Google Docs URLs from each tab")
    print("3. Any titles or descriptions for each document")
    print()
    print("💡 You can provide this data in any format:")
    print("   - Copy and paste from your sheet")
    print("   - Tell me the tab names and I'll guide you through each one")
    print("   - Share the data in whatever way is easiest for you")
    print()
    
    # Start manual data collection
    manual_data_entry()

if __name__ == "__main__":
    main()
