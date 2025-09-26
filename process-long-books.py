#!/usr/bin/env python3
"""
Process long books by chunking them into smaller pieces
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

def chunk_text(text, max_chunk_size=40000):
    """Split text into chunks of maximum size"""
    chunks = []
    
    # Split by paragraphs first
    paragraphs = text.split('\n\n')
    
    current_chunk = ""
    for paragraph in paragraphs:
        # If adding this paragraph would exceed the limit, save current chunk
        if len(current_chunk) + len(paragraph) > max_chunk_size:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = paragraph
            else:
                # Single paragraph is too long, split by sentences
                sentences = paragraph.split('. ')
                temp_chunk = ""
                for sentence in sentences:
                    if len(temp_chunk) + len(sentence) > max_chunk_size:
                        if temp_chunk:
                            chunks.append(temp_chunk.strip())
                            temp_chunk = sentence
                        else:
                            # Single sentence is too long, split by words
                            words = sentence.split(' ')
                            temp_word_chunk = ""
                            for word in words:
                                if len(temp_word_chunk) + len(word) > max_chunk_size:
                                    if temp_word_chunk:
                                        chunks.append(temp_word_chunk.strip())
                                        temp_word_chunk = word
                                    else:
                                        # Single word is too long, truncate
                                        chunks.append(word[:max_chunk_size])
                                else:
                                    temp_word_chunk += " " + word if temp_word_chunk else word
                            if temp_word_chunk:
                                current_chunk = temp_word_chunk
                    else:
                        temp_chunk += ". " + sentence if temp_chunk else sentence
                if temp_chunk:
                    current_chunk = temp_chunk
        else:
            current_chunk += "\n\n" + paragraph if current_chunk else paragraph
    
    # Add the last chunk
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

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

def store_chunk_in_pinecone(title, chunk_content, chunk_index, total_chunks, category="Books"):
    """Store document chunk in Pinecone"""
    try:
        # Create embedding
        embedding = create_embedding(chunk_content)
        if not embedding:
            return False
        
        # Create vector ID (sanitize title)
        base_id = f"books_{re.sub(r'[^a-zA-Z0-9_-]', '_', title.lower())}"
        vector_id = f"{base_id}_chunk_{chunk_index + 1}"
        
        # Prepare metadata
        metadata = {
            'title': title,
            'category': category,
            'source_type': 'doc',
            'language': 'english',
            'status': 'active',
            'chunk_index': chunk_index + 1,
            'total_chunks': total_chunks,
            'content_length': len(chunk_content)
        }
        
        # Store in Pinecone
        index.upsert(vectors=[{
            'id': vector_id,
            'values': embedding,
            'metadata': metadata
        }])
        
        return True
    
    except Exception as e:
        print(f"❌ Failed to store chunk in Pinecone: {str(e)}")
        return False

def process_long_books():
    """Process the long books by chunking them"""
    
    # Long books that need chunking
    long_books = [
        {
            "title": "Atomic Habits",
            "url": "https://docs.google.com/document/d/1w6xKqw5-k24GS_yZpS71etZlkVDrbdqfiXu58WQbJZU/edit?usp=sharing"
        },
        {
            "title": "12 Rules For Life",
            "url": "https://docs.google.com/document/d/1royJslTvtABt82H3DR69c7A_20x6Jg3YxutMXx5jsP0/edit?usp=sharing"
        },
        {
            "title": "The Psychology Of Money",
            "url": "https://docs.google.com/document/d/1YfQ1Uj3XNE-AC6ksRq1qA-Qe66aOcXws9z1NFz68rAw/edit?usp=sharing"
        }
    ]
    
    print("🚀 Starting to process long books with chunking...")
    
    total_successful = 0
    total_failed = 0
    
    for i, book in enumerate(long_books, 1):
        print(f"\n📚 Processing {i}/{len(long_books)}: {book['title']}")
        
        # Extract content
        content = extract_document_content(book['url'])
        if not content:
            print(f"❌ Failed to extract content for: {book['title']}")
            total_failed += 1
            continue
        
        print(f"📄 Content length: {len(content):,} characters")
        
        # Chunk the content
        chunks = chunk_text(content, max_chunk_size=40000)
        print(f"📦 Split into {len(chunks)} chunks")
        
        # Store each chunk
        successful_chunks = 0
        failed_chunks = 0
        
        for chunk_index, chunk in enumerate(chunks):
            print(f"  📄 Storing chunk {chunk_index + 1}/{len(chunks)}...")
            
            if store_chunk_in_pinecone(book['title'], chunk, chunk_index, len(chunks), "Books"):
                successful_chunks += 1
                print(f"  ✅ Chunk {chunk_index + 1} stored successfully")
            else:
                failed_chunks += 1
                print(f"  ❌ Failed to store chunk {chunk_index + 1}")
            
            # Small delay to avoid rate limits
            time.sleep(1)
        
        print(f"📊 {book['title']} summary:")
        print(f"  ✅ Successful chunks: {successful_chunks}")
        print(f"  ❌ Failed chunks: {failed_chunks}")
        
        total_successful += successful_chunks
        total_failed += failed_chunks
    
    print(f"\n🎉 Processing complete!")
    print(f"✅ Total successful chunks: {total_successful}")
    print(f"❌ Total failed chunks: {total_failed}")
    
    # Test the knowledge base
    if total_successful > 0:
        print(f"\n🔍 Testing knowledge base...")
        test_query = "atomic habits and personal development"
        test_embedding = create_embedding(test_query)
        
        if test_embedding:
            results = index.query(
                vector=test_embedding,
                top_k=5,
                include_metadata=True
            )
            
            print(f"📊 Found {len(results.matches)} relevant documents:")
            for match in results.matches:
                print(f"  - {match.metadata['title']} (Score: {match.score:.3f})")

if __name__ == "__main__":
    process_long_books()
