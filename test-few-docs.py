#!/usr/bin/env python3
"""
Test processing a few documents first
"""

import os
import requests
import re
from openai import OpenAI
from pinecone import Pinecone
from typing import List, Dict
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize clients
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

# Test with just 3 documents first
test_docs = [
    {"title": "Watch this first neu", "url": "https://docs.google.com/document/d/1NCVyRrpqbjejU3o3Ry6fnkFWxdRX1bKDhVig6o90xvQ/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "GPC Organic Roadmap", "url": "https://docs.google.com/document/d/1tXDrpfM5cXCm9Mszr7m7szencKxS-8pDqPjJ9-wtG7Q/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Good habits Neu", "url": "https://docs.google.com/document/d/1QOoMhSfn7uZz2F9H7-MAekOCuw9YsSclSi6VKEwd_-4/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"}
]

def extract_doc_content(url: str) -> str:
    """Extract content from a Google Doc URL"""
    try:
        # Convert sharing URL to export URL
        doc_id = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
        if not doc_id:
            return f"Could not extract document ID from URL: {url}"
        
        doc_id = doc_id.group(1)
        export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=txt"
        
        print(f"  📥 Fetching: {export_url}")
        response = requests.get(export_url, timeout=30)
        if response.status_code == 200:
            content = response.text
            content = content.replace('\r\n', '\n').strip()
            print(f"  ✅ Got {len(content)} characters")
            return content
        else:
            return f"Failed to fetch document content. Status: {response.status_code}"
    
    except Exception as e:
        return f"Error extracting content: {str(e)}"

def create_embedding(text: str) -> List[float]:
    """Create OpenAI embedding for text"""
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error creating embedding: {e}")
        return []

def test_documents():
    """Test processing a few documents"""
    print("🧪 Testing with 3 documents first...")
    
    # Connect to Pinecone
    index = pc.Index("gpc-knowledge-base")
    
    for i, doc in enumerate(test_docs, 1):
        print(f"\n📄 Testing {i}/3: {doc['title']}")
        
        # Extract content
        content = extract_doc_content(doc['url'])
        
        if content.startswith("Error") or content.startswith("Failed") or content.startswith("Could not"):
            print(f"❌ Failed to extract content: {content}")
            continue
        
        # Create embedding
        print(f"  🔄 Creating embedding...")
        embedding = create_embedding(content)
        if not embedding:
            print(f"❌ Failed to create embedding")
            continue
        
        # Store in Pinecone
        try:
            metadata = {
                "title": doc['title'],
                "source_type": doc['source_type'],
                "language": doc['language'],
                "status": doc['status'],
                "tab": "Course Content",
                "url": doc['url'],
                "content_length": len(content)
            }
            
            vector_id = f"test_course_content_{i}_{doc['title'].replace(' ', '_').lower()}"
            index.upsert([(vector_id, embedding, metadata)])
            print(f"  ✅ Successfully stored in Pinecone")
        except Exception as e:
            print(f"❌ Failed to store in Pinecone: {e}")
        
        time.sleep(2)  # Rate limiting
    
    print(f"\n🎉 Test complete! Check your Pinecone dashboard.")

if __name__ == "__main__":
    test_documents()
