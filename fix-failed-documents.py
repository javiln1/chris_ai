#!/usr/bin/env python3
"""
Fix the failed YouTube (Chris) documents by handling different issues
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

# Failed documents that need fixing
failed_documents = [
    {"title": "We tried Organic Dropshipping for 10 Days (Realistic Results)", "url": "https://docs.google.com/document/d/1oPHh0sTvJGJb6phVZJbaXYADgm_LPYWX7frdpt-akgo/edit?usp=sharing", "issue": "410_error"},
    {"title": "How He Makes $18k a Month at 36 Years Old with Organic Dropshipping I Case Study", "url": "https://docs.google.com/document/d/1q1qHHeld_lOqXnYqCNCL255ItkNFCJPFWMcB3iHEuZM/edit?usp=sharing", "issue": "410_error"},
    {"title": "$16k Month OFF Insta.gram And Facebook Organic Propshipping I Case Study", "url": "https://docs.google.com/document/d/1XVgUPdH7_OGHDt_PSEuNS_a92YWLweKrH7Mfmtq5WkA/edit?usp=sharing", "issue": "410_error"},
    {"title": "From 0 to 11k а month after 40 pays in Organic Demons", "url": "https://docs.google.com/document/d/1NtW0msuiO07TeO858dwLBJiJ6rYOBBXavUyXLoDovao/edit?usp=sharing", "issue": "410_error"},
    {"title": "$45,000 in 29 Days Organic Demons Case study", "url": "https://docs.google.com/document/d/1zDyFnC3VJ9dEJYlEVnRwQHuAf002fbuUxVn4Y4eruTk/edit?usp=sharing", "issue": "410_error"},
    {"title": "Case Study Organic Demons- $60k in 28 Days", "url": "https://docs.google.com/document/d/1Y5RA6oljQpz3lJ63uPwj_J6cuSdZBioq0K1IgJ_ndFI/edit?usp=sharing", "issue": "410_error"},
    {"title": "How I got 1.3 Milion Subscribers With YouTube Organic Propshipping", "url": "https://docs.google.com/document/d/1BYZv4STJWp1Y7Tib2hTuiC5rF3oHsFQq4HhEZbNAzSY/edit?usp=sharing", "issue": "410_error"},
    {"title": "How he Went From debt to $/ 100k With Organic Dropshipping", "url": "https://docs.google.com/document/d/1lLzHqQZTp4MxmAfcX7qxGrhZ0COlsLekR2bYQsiXOS8/edit?usp=sharing", "issue": "410_error"},
    {"title": "How I would start Organic Dropshipping I from Scratch In 2025", "url": "https://docs.google.com/document/d/1WIThOYR0R_sCaFnFF36pr2mzuJnxe0DLTA-VMXG8Jeg/edit?usp=sharing", "issue": "410_error"},
    {"title": "How to Master Organic Dropshipping on Facebook", "url": "https://docs.google.com/document/d/1-qN6bE7_C_Nod0moyt32WIwXsOGn_sWs_x4Ard9UdN4/edit?usp=sharing", "issue": "410_error"},
    {"title": "Nobody Talks About This Organic Dropshipping Method (Instagram Brand...", "url": "https://docs.google.com/document/d/1LLEREMn1hGYjm30DjrxgQSq3NQKqdxuoKUoRFRKni9k/edit?usp=sharing", "issue": "410_error"},
    {"title": "How I use AI to go Viral with Organic Dropshipping", "url": "https://docs.google.com/document/d/1n49beWUecOiuf1wYhS281XfdbpoDhuO3MdmTEF1vUl4/edit?usp=sharing", "issue": "410_error"},
    {"title": "How Master Instagram Organic Dropshipping", "url": "https://docs.google.com/document/d/1GzSSbFdeRg6a1oC4sn-R_i9itbwUfF025kc3HbTmrAs/edit?usp=sharing", "issue": "410_error"},
    {"title": "How to Go viral With Every Product You Test (Organic Propshipping)", "url": "https://docs.google.com/document/d/1tDOpaFG0b85J4qCi7f--pEhPYHp1qdny8gR_dAdPeHg/edit?usp=sharing", "issue": "410_error"},
    {"title": "How I brought Back The Most Saturated Product (Organic dropshipping)", "url": "https://docs.google.com/document/d/1aBLoKxBb-mOtGrV3snfbkipXYDWsn9lOF43h3bZOfI8/edit?usp=sharing", "issue": "410_error"},
    {"title": "How-he Made $300,000 in 5 Pays (0rganic Propshipping Record)", "url": "https://docs.google.com/document/d/1whD2ktZHF4OxWc4Ywer0d9cLCcBYk--VBjERhV-f18s/edit?usp=sharing", "issue": "410_error"},
    {"title": "I tried Organic dropshipping For 7 pays with Only $1 00", "url": "https://docs.google.com/document/d/13ANhczGEhw-znq5A3aiqFPh3ZI5ApJsrqvCXAEcojVo/edit?usp=sharing", "issue": "410_error"},
    {"title": "How I make $10k m with TikTok Shop | Full Beginner Guide", "url": "https://docs.google.com/document/d/1ksDHme1vPJn7SbhSGKgJ5RXjUxp6lPVNld24DxXZDII/edit?usp=sharing", "issue": "token_limit"},
    {"title": "How I make $10k m with TikTok Shop | Full Beginner Guide", "url": "https://docs.google.com/document/d/1w4xZ1iGzwx2Ea0x1qOFvwm4Ht6I_8zP148rrh1--uok/edit?usp=sharing", "issue": "token_limit"},
    {"title": "How God took me from $56 to $450k with TikTok Shop", "url": "https://docs.google.com/document/d/1vxawjLDBOXOMtLpgikm2Gf6GlUEbKU83WOJlz1WztaQ/edit?usp=sharing", "issue": "token_limit"}
]

def try_alternative_access_methods(url: str) -> str:
    """Try different methods to access the Google Doc"""
    
    # Extract document ID
    doc_id_match = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
    if not doc_id_match:
        return f"Could not extract document ID from URL: {url}"
    
    doc_id = doc_id_match.group(1)
    
    # Method 1: Try with different export formats
    export_formats = ['txt', 'html', 'pdf']
    for format_type in export_formats:
        try:
            export_url = f"https://docs.google.com/document/d/{doc_id}/export?format={format_type}"
            print(f"  🔄 Trying {format_type} format: {export_url}")
            
            response = requests.get(export_url, timeout=30)
            if response.status_code == 200:
                if format_type == 'txt':
                    content = response.text.replace('\r\n', '\n').strip()
                elif format_type == 'html':
                    # Basic HTML parsing to extract text
                    content = response.text
                    # Remove HTML tags (basic cleanup)
                    content = re.sub(r'<[^>]+>', ' ', content)
                    content = re.sub(r'\s+', ' ', content).strip()
                else:  # PDF - skip for now as it requires special handling
                    continue
                
                if len(content) > 100:  # Ensure we got meaningful content
                    print(f"  ✅ Success with {format_type} format ({len(content)} chars)")
                    return content
        except Exception as e:
            print(f"  ❌ Failed with {format_type}: {e}")
            continue
    
    # Method 2: Try with different URL parameters
    alternative_urls = [
        f"https://docs.google.com/document/d/{doc_id}/export?format=txt&id={doc_id}",
        f"https://docs.google.com/document/d/{doc_id}/export?format=txt&usp=sharing",
        f"https://docs.google.com/document/d/{doc_id}/export?format=txt&usp=drive_web"
    ]
    
    for alt_url in alternative_urls:
        try:
            print(f"  🔄 Trying alternative URL: {alt_url}")
            response = requests.get(alt_url, timeout=30)
            if response.status_code == 200:
                content = response.text.replace('\r\n', '\n').strip()
                if len(content) > 100:
                    print(f"  ✅ Success with alternative URL ({len(content)} chars)")
                    return content
        except Exception as e:
            print(f"  ❌ Failed with alternative URL: {e}")
            continue
    
    return f"All access methods failed for document ID: {doc_id}"

def chunk_content_for_embedding(content: str, max_tokens: int = 6000) -> List[str]:
    """Split content into chunks that fit within token limits"""
    
    # Rough estimation: 1 token ≈ 4 characters for English text
    max_chars = max_tokens * 4
    
    if len(content) <= max_chars:
        return [content]
    
    # Split by paragraphs first
    paragraphs = content.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        # If adding this paragraph would exceed the limit
        if len(current_chunk) + len(paragraph) > max_chars and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = paragraph
        else:
            current_chunk += "\n\n" + paragraph if current_chunk else paragraph
    
    # Add the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks

def create_embedding_with_retry(text: str, max_retries: int = 3) -> List[float]:
    """Create embedding with retry logic for token limits"""
    
    for attempt in range(max_retries):
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            if "maximum context length" in str(e):
                print(f"  ⚠️ Token limit exceeded (attempt {attempt + 1})")
                # Reduce text size by 20%
                text = text[:int(len(text) * 0.8)]
                continue
            else:
                print(f"  ❌ Embedding error: {e}")
                return []
    
    return []

def fix_failed_documents():
    """Attempt to fix all failed documents"""
    
    print("🔧 Attempting to fix failed YouTube (Chris) documents...")
    
    # Connect to Pinecone
    index = pc.Index("gpc-knowledge-base")
    
    fixed_count = 0
    still_failed_count = 0
    
    for i, doc in enumerate(failed_documents, 1):
        print(f"\n📄 Fixing {i}/{len(failed_documents)}: {doc['title']}")
        print(f"  🐛 Issue: {doc['issue']}")
        
        if doc['issue'] == '410_error':
            # Try alternative access methods
            content = try_alternative_access_methods(doc['url'])
        elif doc['issue'] == 'token_limit':
            # First get the content, then chunk it
            content = try_alternative_access_methods(doc['url'])
        else:
            print(f"  ❌ Unknown issue type: {doc['issue']}")
            still_failed_count += 1
            continue
        
        if content.startswith("Could not") or content.startswith("All access"):
            print(f"  ❌ Could not access document: {content}")
            still_failed_count += 1
            continue
        
        # Handle token limits by chunking
        if doc['issue'] == 'token_limit':
            chunks = chunk_content_for_embedding(content)
            print(f"  📝 Split into {len(chunks)} chunks")
            
            # Process each chunk
            for chunk_idx, chunk in enumerate(chunks):
                print(f"  🔄 Processing chunk {chunk_idx + 1}/{len(chunks)}")
                
                embedding = create_embedding_with_retry(chunk)
                if not embedding:
                    print(f"  ❌ Failed to create embedding for chunk {chunk_idx + 1}")
                    continue
                
                # Prepare metadata
                metadata = {
                    "title": f"{doc['title']} (Part {chunk_idx + 1})",
                    "original_title": doc['title'],
                    "source_type": "doc",
                    "language": "english",
                    "status": "active",
                    "tab": "YouTube (Chris)",
                    "url": doc['url'],
                    "content_length": len(chunk),
                    "chunk_index": chunk_idx,
                    "total_chunks": len(chunks),
                    "category": "tiktok_shop" if "tiktok shop" in doc['title'].lower() else "dropshipping_strategies"
                }
                
                # Store in Pinecone
                try:
                    vector_id = f"youtube_chris_fixed_{i}_{chunk_idx}_{doc['title'].replace(' ', '_').lower()[:30]}"
                    index.upsert([(vector_id, embedding, metadata)])
                    print(f"  ✅ Stored chunk {chunk_idx + 1}")
                except Exception as e:
                    print(f"  ❌ Failed to store chunk {chunk_idx + 1}: {e}")
            
            fixed_count += 1
            
        else:
            # Regular processing for 410 errors that we managed to fix
            embedding = create_embedding_with_retry(content)
            if not embedding:
                print(f"  ❌ Failed to create embedding")
                still_failed_count += 1
                continue
            
            # Prepare metadata
            metadata = {
                "title": doc['title'],
                "source_type": "doc",
                "language": "english",
                "status": "active",
                "tab": "YouTube (Chris)",
                "url": doc['url'],
                "content_length": len(content),
                "category": "tiktok_shop" if "tiktok shop" in doc['title'].lower() else "dropshipping_strategies"
            }
            
            # Store in Pinecone
            try:
                vector_id = f"youtube_chris_fixed_{i}_{doc['title'].replace(' ', '_').lower()[:50]}"
                index.upsert([(vector_id, embedding, metadata)])
                print(f"  ✅ Successfully stored fixed document")
                fixed_count += 1
            except Exception as e:
                print(f"  ❌ Failed to store in Pinecone: {e}")
                still_failed_count += 1
        
        # Rate limiting
        time.sleep(2)
    
    print(f"\n🎉 Document fixing complete!")
    print(f"✅ Successfully fixed: {fixed_count} documents")
    print(f"❌ Still failed: {still_failed_count} documents")
    
    # Test the updated knowledge base
    print(f"\n🔍 Testing updated knowledge base...")
    try:
        test_query = "How to start organic dropshipping from scratch in 2025"
        test_embedding = create_embedding_with_retry(test_query)
        
        if test_embedding:
            results = index.query(
                vector=test_embedding,
                top_k=5,
                include_metadata=True
            )
            
            print(f"📊 Found {len(results.matches)} relevant documents:")
            for match in results.matches:
                title = match.metadata.get('title', 'Unknown')
                tab = match.metadata.get('tab', 'Unknown')
                print(f"  - {title} ({tab}) - Score: {match.score:.3f}")
    
    except Exception as e:
        print(f"❌ Error testing knowledge base: {e}")

if __name__ == "__main__":
    fix_failed_documents()
