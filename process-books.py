#!/usr/bin/env python3
"""
Process Books tab documents from Google Sheet and store in Pinecone
"""

import os
import requests
from bs4 import BeautifulSoup
from pinecone import Pinecone
from openai import OpenAI
import time
import re

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize clients
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Connect to Pinecone index
index = pc.Index('gpc-knowledge-base')

def extract_document_content(url):
    """Extract content from Google Docs URL"""
    try:
        # Convert edit URL to export URL
        if '/edit?' in url:
            export_url = url.replace('/edit?', '/export?format=txt&')
        else:
            export_url = url + '&export=download&format=txt'
        
        response = requests.get(export_url, timeout=30)
        response.raise_for_status()
        
        # Clean up the content
        content = response.text.strip()
        
        # Remove any HTML tags if present
        soup = BeautifulSoup(content, 'html.parser')
        content = soup.get_text()
        
        # Clean up extra whitespace
        content = re.sub(r'\n\s*\n', '\n\n', content)
        content = re.sub(r'[ \t]+', ' ', content)
        
        return content.strip()
    
    except Exception as e:
        print(f"❌ Failed to extract content: {str(e)}")
        return None

def create_embedding(text):
    """Create embedding using OpenAI"""
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Failed to create embedding: {str(e)}")
        return None

def store_in_pinecone(title, content, category="Books"):
    """Store document in Pinecone"""
    try:
        # Create embedding
        embedding = create_embedding(content)
        if not embedding:
            return False
        
        # Create vector ID (sanitize title)
        vector_id = f"books_{re.sub(r'[^a-zA-Z0-9_-]', '_', title.lower())}"
        
        # Prepare metadata
        metadata = {
            'title': title,
            'category': category,
            'source_type': 'doc',
            'language': 'english',
            'status': 'active',
            'content_length': len(content)
        }
        
        # Store in Pinecone
        index.upsert(vectors=[{
            'id': vector_id,
            'values': embedding,
            'metadata': metadata
        }])
        
        return True
    
    except Exception as e:
        print(f"❌ Failed to store in Pinecone: {str(e)}")
        return False

def process_books_documents():
    """Process all Books tab documents"""
    
    # Books tab data
    books_data = [
        {
            "title": "Atomic Habits",
            "url": "https://docs.google.com/document/d/1w6xKqw5-k24GS_yZpS71etZlkVDrbdqfiXu58WQbJZU/edit?usp=sharing",
            "source_type": "doc",
            "language": "english",
            "status": "active"
        },
        {
            "title": "Cant Hurt Me",
            "url": "https://docs.google.com/document/d/1DS7xPlcarZCJFQkhaY_iZesVXfXGMQY4BILqhlMxmM4/edit?usp=sharing",
            "source_type": "doc",
            "language": "english",
            "status": "active"
        },
        {
            "title": "12 Rules For Life",
            "url": "https://docs.google.com/document/d/1royJslTvtABt82H3DR69c7A_20x6Jg3YxutMXx5jsP0/edit?usp=sharing",
            "source_type": "doc",
            "language": "english",
            "status": "active"
        },
        {
            "title": "The Psychology Of Money",
            "url": "https://docs.google.com/document/d/1YfQ1Uj3XNE-AC6ksRq1qA-Qe66aOcXws9z1NFz68rAw/edit?usp=sharing",
            "source_type": "doc",
            "language": "english",
            "status": "active"
        }
    ]
    
    print("🚀 Starting to process Books documents...")
    
    successful = 0
    failed = 0
    
    for i, doc in enumerate(books_data, 1):
        print(f"\n📄 Processing {i}/{len(books_data)}: {doc['title']}")
        
        # Extract content
        content = extract_document_content(doc['url'])
        if not content:
            print(f"❌ Failed to extract content for: {doc['title']}")
            failed += 1
            continue
        
        # Check content length
        if len(content) > 50000:  # 50k character limit
            print(f"⚠️  Content too long ({len(content)} chars), skipping...")
            failed += 1
            continue
        
        # Store in Pinecone
        if store_in_pinecone(doc['title'], content, "Books"):
            print(f"✅ Successfully stored: {doc['title']}")
            successful += 1
        else:
            print(f"❌ Failed to store: {doc['title']}")
            failed += 1
        
        # Small delay to avoid rate limits
        time.sleep(1)
    
    print(f"\n🎉 Processing complete!")
    print(f"✅ Successfully processed: {successful} documents")
    print(f"❌ Failed: {failed} documents")
    
    # Test the knowledge base
    if successful > 0:
        print(f"\n🔍 Testing knowledge base...")
        test_query = "habits and personal development"
        test_embedding = create_embedding(test_query)
        
        if test_embedding:
            results = index.query(
                vector=test_embedding,
                top_k=3,
                include_metadata=True
            )
            
            print(f"📊 Found {len(results.matches)} relevant documents:")
            for match in results.matches:
                print(f"  - {match.metadata['title']} (Score: {match.score:.3f})")

if __name__ == "__main__":
    process_books_documents()
