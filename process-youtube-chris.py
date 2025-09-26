#!/usr/bin/env python3
"""
Process YouTube (Chris) tab and extract Google Docs content for Pinecone
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

# YouTube (Chris) data
youtube_chris_data = [
    {"title": "We tried Organic Dropshipping for 10 Days (Realistic Results)", "url": "https://docs.google.com/document/d/1oPHh0sTvJGJb6phVZJbaXYADgm_LPYWX7frdpt-akgo/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How He Makes $18k a Month at 36 Years Old with Organic Dropshipping I Case Study", "url": "https://docs.google.com/document/d/1q1qHHeld_lOqXnYqCNCL255ItkNFCJPFWMcB3iHEuZM/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "$16k Month OFF Insta.gram And Facebook Organic Propshipping I Case Study", "url": "https://docs.google.com/document/d/1XVgUPdH7_OGHDt_PSEuNS_a92YWLweKrH7Mfmtq5WkA/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "From 0 to 11k а month after 40 pays in Organic Demons", "url": "https://docs.google.com/document/d/1NtW0msuiO07TeO858dwLBJiJ6rYOBBXavUyXLoDovao/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "$45,000 in 29 Days Organic Demons Case study", "url": "https://docs.google.com/document/d/1zDyFnC3VJ9dEJYlEVnRwQHuAf002fbuUxVn4Y4eruTk/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Case Study Organic Demons- $60k in 28 Days", "url": "https://docs.google.com/document/d/1Y5RA6oljQpz3lJ63uPwj_J6cuSdZBioq0K1IgJ_ndFI/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I got 1.3 Milion Subscribers With YouTube Organic Propshipping", "url": "https://docs.google.com/document/d/1BYZv4STJWp1Y7Tib2hTuiC5rF3oHsFQq4HhEZbNAzSY/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How he Went From debt to $/ 100k With Organic Dropshipping", "url": "https://docs.google.com/document/d/1lLzHqQZTp4MxmAfcX7qxGrhZ0COlsLekR2bYQsiXOS8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I would start Organic Dropshipping I from Scratch In 2025", "url": "https://docs.google.com/document/d/1WIThOYR0R_sCaFnFF36pr2mzuJnxe0DLTA-VMXG8Jeg/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to Master Organic Dropshipping on Facebook", "url": "https://docs.google.com/document/d/1-qN6bE7_C_Nod0moyt32WIwXsOGn_sWs_x4Ard9UdN4/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Nobody Talks About This Organic Dropshipping Method (Instagram Brand...", "url": "https://docs.google.com/document/d/1LLEREMn1hGYjm30DjrxgQSq3NQKqdxuoKUoRFRKni9k/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I use AI to go Viral with Organic Dropshipping", "url": "https://docs.google.com/document/d/1n49beWUecOiuf1wYhS281XfdbpoDhuO3MdmTEF1vUl4/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How Master Instagram Organic Dropshipping", "url": "https://docs.google.com/document/d/1GzSSbFdeRg6a1oC4sn-R_i9itbwUfF025kc3HbTmrAs/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to Go viral With Every Product You Test (Organic Propshipping)", "url": "https://docs.google.com/document/d/1tDOpaFG0b85J4qCi7f--pEhPYHp1qdny8gR_dAdPeHg/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I brought Back The Most Saturated Product (Organic dropshipping)", "url": "https://docs.google.com/document/d/1aBLoKxBb-mOtGrV3snfbkipXYDWsn9lOF43h3bZOfI8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How-he Made $300,000 in 5 Pays (0rganic Propshipping Record)", "url": "https://docs.google.com/document/d/1whD2ktZHF4OxWc4Ywer0d9cLCcBYk--VBjERhV-f18s/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "I tried Organic dropshipping For 7 pays with Only $1 00", "url": "https://docs.google.com/document/d/13ANhczGEhw-znq5A3aiqFPh3ZI5ApJsrqvCXAEcojVo/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Bro turned $1 into $1k in 7 days", "url": "https://docs.google.com/document/d/1UgLXp5WBTvhdi57jZoXJN7iCA_zAvfPgGoh4Rcr5Rf4/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Rich off Brain Rot", "url": "https://docs.google.com/document/d/1lFjck7poQZdUMsuvCi1_s7ZR2ZXd4ZajB3m5aXsgC88/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I got 1.3 Million Subscribers With YouTube Organic Dropshipping", "url": "https://docs.google.com/document/d/1dzhWAJzRr_Jr_n7iErHuci3cFeLknAJjlE-hJtK8swE/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I make $10k m with TikTok Shop | Full Beginner Guide", "url": "https://docs.google.com/document/d/1ksDHme1vPJn7SbhSGKgJ5RXjUxp6lPVNld24DxXZDII/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I make $10k m with TikTok Shop | Full Beginner Guide", "url": "https://docs.google.com/document/d/1w4xZ1iGzwx2Ea0x1qOFvwm4Ht6I_8zP148rrh1--uok/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "The fastest way to hit $10k m on TikTok Shop (Even as a beginner)", "url": "https://docs.google.com/document/d/1Efan-2v_jOE2xay0LGdSURjDrFx5zSSa2eJSjIphtjs/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to legally steal $100k with TikTok Shop", "url": "https://docs.google.com/document/d/1XqrV4TSo7vD4sYP3a3yZ7pl78NatNOaslYYy4vcvNEA/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I made 106k PROFIT on TikTok Shop in ONE month", "url": "https://docs.google.com/document/d/1NirTUeq90WHgclk33xRkhlexwCWDUwgHE-WOw5udcgI/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How I Made $32k in 30 Days with TikTok Shop", "url": "https://docs.google.com/document/d/1zEVyEnWxX5qdSHNiwbXyWuapdZHgw0XDAmKzAkfmH0g/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How God took me from $56 to $450k with TikTok Shop", "url": "https://docs.google.com/document/d/1vxawjLDBOXOMtLpgikm2Gf6GlUEbKU83WOJlz1WztaQ/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "give me 9 minutes and i'll 11x your TikTok Shop commission", "url": "https://docs.google.com/document/d/1b1TgwogGrTOUafLgXgIt672UInOLsaRub1IXfkvh1uE/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"}
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
        
        response = requests.get(export_url, timeout=30)
        if response.status_code == 200:
            content = response.text
            # Clean up the content
            content = content.replace('\r\n', '\n').strip()
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

def categorize_youtube_content(title: str) -> str:
    """Categorize YouTube content based on title"""
    title_lower = title.lower()
    
    # TikTok Shop content
    if "tiktok shop" in title_lower or "tiktok" in title_lower:
        return "tiktok_shop"
    # Case studies with specific dollar amounts
    elif any(word in title_lower for word in ["$", "k", "month", "days", "case study", "profit"]):
        return "case_studies"
    # Organic dropshipping strategies
    elif "organic dropshipping" in title_lower or "dropshipping" in title_lower:
        return "dropshipping_strategies"
    # YouTube growth
    elif "subscribers" in title_lower or "youtube" in title_lower:
        return "youtube_growth"
    # Platform-specific strategies
    elif any(platform in title_lower for platform in ["facebook", "instagram", "meta"]):
        return "social_media_strategy"
    # AI and viral content
    elif any(word in title_lower for word in ["ai", "viral", "go viral"]):
        return "advanced_tactics"
    else:
        return "case_studies"  # Default to case studies for YouTube content

def process_youtube_documents():
    """Process all YouTube documents and store in Pinecone"""
    print("🚀 Starting to process YouTube (Chris) documents...")
    
    # Connect to Pinecone
    index = pc.Index("gpc-knowledge-base")
    
    processed_count = 0
    failed_count = 0
    
    for i, doc in enumerate(youtube_chris_data, 1):
        print(f"\n📄 Processing {i}/{len(youtube_chris_data)}: {doc['title']}")
        
        # Extract content
        content = extract_doc_content(doc['url'])
        
        if content.startswith("Error") or content.startswith("Failed") or content.startswith("Could not"):
            print(f"❌ Failed to extract content: {content}")
            failed_count += 1
            continue
        
        # Create embedding
        embedding = create_embedding(content)
        if not embedding:
            print(f"❌ Failed to create embedding for: {doc['title']}")
            failed_count += 1
            continue
        
        # Categorize the content
        category = categorize_youtube_content(doc['title'])
        
        # Prepare metadata
        metadata = {
            "title": doc['title'],
            "source_type": doc['source_type'],
            "language": doc['language'],
            "status": doc['status'],
            "tab": "YouTube (Chris)",
            "url": doc['url'],
            "content_length": len(content),
            "category": category,
            "platform": "youtube" if "youtube" in doc['title'].lower() else "general",
            "content_type": "case_study" if any(word in doc['title'].lower() for word in ["$", "k", "case study"]) else "strategy"
        }
        
        # Store in Pinecone
        try:
            vector_id = f"youtube_chris_{i}_{doc['title'].replace(' ', '_').lower()[:50]}"
            index.upsert([(vector_id, embedding, metadata)])
            print(f"✅ Successfully stored: {doc['title']} (Category: {category})")
            processed_count += 1
        except Exception as e:
            print(f"❌ Failed to store in Pinecone: {e}")
            failed_count += 1
        
        # Rate limiting
        time.sleep(1)
    
    print(f"\n🎉 YouTube (Chris) processing complete!")
    print(f"✅ Successfully processed: {processed_count} documents")
    print(f"❌ Failed: {failed_count} documents")
    
    # Test the updated knowledge base
    print(f"\n🔍 Testing updated knowledge base...")
    try:
        # Create a test query embedding for TikTok Shop
        test_query = "How to make money with TikTok Shop as a beginner"
        test_embedding = create_embedding(test_query)
        
        if test_embedding:
            results = index.query(
                vector=test_embedding,
                top_k=5,
                include_metadata=True
            )
            
            print(f"📊 Found {len(results.matches)} relevant documents for TikTok Shop:")
            for match in results.matches:
                title = match.metadata.get('title', 'Unknown')
                tab = match.metadata.get('tab', 'Unknown')
                print(f"  - {title} ({tab}) - Score: {match.score:.3f}")
    
    except Exception as e:
        print(f"❌ Error testing knowledge base: {e}")

if __name__ == "__main__":
    process_youtube_documents()
