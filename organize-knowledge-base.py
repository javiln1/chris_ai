#!/usr/bin/env python3
"""
Organize and categorize the knowledge base with proper topics
"""

import os
from openai import OpenAI
from pinecone import Pinecone
from typing import List, Dict
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize clients
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

# Define proper topic categories based on your content
TOPIC_CATEGORIES = {
    "content_creation": {
        "name": "Content Creation & Filming",
        "keywords": ["filming", "content", "video", "background", "lighting", "hand movements", "eye", "music", "sounds", "controversy", "pace", "viral", "hooks"],
        "description": "Everything about creating compelling video content"
    },
    "social_media_strategy": {
        "name": "Social Media Strategy",
        "keywords": ["tiktok", "instagram", "youtube", "facebook", "account", "fyp", "viral", "platform", "optimization", "burners", "recycle", "targeting", "countries"],
        "description": "Platform-specific strategies and optimization"
    },
    "product_research": {
        "name": "Product Research & Sourcing",
        "keywords": ["product", "research", "sourcing", "temu", "ali", "cj", "saturation", "good vs bad", "untapped", "existing", "custom"],
        "description": "Finding and evaluating profitable products"
    },
    "business_development": {
        "name": "Business & Brand Building",
        "keywords": ["brand", "website", "building", "selling", "bundles", "aov", "cvr", "email marketing", "broadcast", "longevity", "consistency"],
        "description": "Building and scaling your business"
    },
    "marketing_strategies": {
        "name": "Marketing & Growth",
        "keywords": ["marketing", "angles", "audience", "niche", "growth", "archive", "method", "prime", "trials", "sales", "offer"],
        "description": "Marketing tactics and growth strategies"
    },
    "case_studies": {
        "name": "Case Studies & Results",
        "keywords": ["case study", "results", "subs", "months", "filming", "k", "million", "30m", "250k", "350k", "20k"],
        "description": "Real success stories and results"
    },
    "advanced_tactics": {
        "name": "Advanced Tactics",
        "keywords": ["bts", "behind the scenes", "whole", "creating", "shareable", "replicating", "concepts", "dropshipping"],
        "description": "Advanced strategies and behind-the-scenes insights"
    }
}

def categorize_document(title: str, content: str) -> str:
    """Categorize a document based on its title and content"""
    
    # Create a prompt for AI categorization
    prompt = f"""
    Based on the document title and content, categorize this into one of these categories:
    
    1. content_creation - Content Creation & Filming (filming, video production, lighting, etc.)
    2. social_media_strategy - Social Media Strategy (platform optimization, viral tactics, etc.)
    3. product_research - Product Research & Sourcing (finding products, market research, etc.)
    4. business_development - Business & Brand Building (websites, branding, scaling, etc.)
    5. marketing_strategies - Marketing & Growth (marketing tactics, audience targeting, etc.)
    6. case_studies - Case Studies & Results (success stories, real results, etc.)
    7. advanced_tactics - Advanced Tactics (BTS content, advanced strategies, etc.)
    
    Document Title: {title}
    Content Preview: {content[:500]}...
    
    Return ONLY the category key (e.g., "content_creation"). Be specific and accurate.
    """
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50,
            temperature=0.1
        )
        
        category = response.choices[0].message.content.strip().lower()
        
        # Validate category
        if category in TOPIC_CATEGORIES:
            return category
        else:
            # Fallback to keyword matching
            return categorize_by_keywords(title, content)
    
    except Exception as e:
        print(f"Error in AI categorization: {e}")
        return categorize_by_keywords(title, content)

def categorize_by_keywords(title: str, content: str) -> str:
    """Fallback categorization using keyword matching"""
    text = (title + " " + content).lower()
    
    category_scores = {}
    for category, info in TOPIC_CATEGORIES.items():
        score = sum(1 for keyword in info["keywords"] if keyword in text)
        category_scores[category] = score
    
    # Return the category with the highest score
    if category_scores:
        return max(category_scores, key=category_scores.get)
    return "advanced_tactics"  # Default fallback

def create_searchable_topics():
    """Create topic-based search vectors for better organization"""
    
    print("🎯 Creating organized topic structure...")
    
    # Connect to Pinecone
    index = pc.Index("gpc-knowledge-base")
    
    # Get all vectors from the index
    try:
        # Query with a dummy vector to get all documents
        results = index.query(
            vector=[0.0] * 1536,  # Dummy vector
            top_k=1000,  # Get many results
            include_metadata=True
        )
        
        print(f"📊 Found {len(results.matches)} documents to categorize")
        
        categorized_count = 0
        category_counts = {}
        
        for match in results.matches:
            title = match.metadata.get('title', '')
            url = match.metadata.get('url', '')
            
            print(f"📄 Categorizing: {title}")
            
            # Get the content (we'll need to extract it again or store it)
            # For now, let's use the title and any existing metadata
            category = categorize_document(title, "")
            
            # Update metadata with category
            updated_metadata = match.metadata.copy()
            updated_metadata['category'] = category
            updated_metadata['category_name'] = TOPIC_CATEGORIES[category]['name']
            updated_metadata['category_description'] = TOPIC_CATEGORIES[category]['description']
            
            # Update the vector with new metadata
            index.upsert([(match.id, match.values, updated_metadata)])
            
            categorized_count += 1
            category_counts[category] = category_counts.get(category, 0) + 1
            
            print(f"  ✅ Categorized as: {TOPIC_CATEGORIES[category]['name']}")
        
        print(f"\n🎉 Categorization complete!")
        print(f"✅ Categorized {categorized_count} documents")
        print(f"\n📊 Category breakdown:")
        for category, count in category_counts.items():
            print(f"  - {TOPIC_CATEGORIES[category]['name']}: {count} documents")
    
    except Exception as e:
        print(f"❌ Error categorizing documents: {e}")

def create_topic_search_vectors():
    """Create search vectors for each topic category"""
    
    print("\n🔍 Creating topic search vectors...")
    
    index = pc.Index("gpc-knowledge-base")
    
    for category_key, category_info in TOPIC_CATEGORIES.items():
        # Create a search query for this topic
        search_query = f"{category_info['name']}: {category_info['description']}. Keywords: {', '.join(category_info['keywords'])}"
        
        # Create embedding for this topic
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=search_query
            )
            
            embedding = response.data[0].embedding
            
            # Store as a topic vector
            topic_metadata = {
                "title": f"Topic: {category_info['name']}",
                "category": category_key,
                "category_name": category_info['name'],
                "description": category_info['description'],
                "keywords": ', '.join(category_info['keywords']),
                "type": "topic_search",
                "tab": "Topic Categories"
            }
            
            topic_id = f"topic_{category_key}"
            index.upsert([(topic_id, embedding, topic_metadata)])
            
            print(f"  ✅ Created topic vector: {category_info['name']}")
        
        except Exception as e:
            print(f"  ❌ Error creating topic vector for {category_key}: {e}")

def test_topic_search():
    """Test the organized topic search"""
    
    print("\n🧪 Testing topic-based search...")
    
    index = pc.Index("gpc-knowledge-base")
    
    # Test queries for different topics
    test_queries = [
        "How to set up lighting for videos",
        "Best TikTok growth strategies", 
        "Product research methods",
        "Building a successful brand",
        "Marketing to specific audiences",
        "Case studies of successful creators",
        "Behind the scenes content creation"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Query: '{query}'")
        
        try:
            # Create embedding for query
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=query
            )
            
            embedding = response.data[0].embedding
            
            # Search
            results = index.query(
                vector=embedding,
                top_k=3,
                include_metadata=True
            )
            
            print(f"  📊 Top results:")
            for match in results.matches:
                category_name = match.metadata.get('category_name', 'Unknown')
                title = match.metadata.get('title', 'Unknown')
                print(f"    - {title} ({category_name}) - Score: {match.score:.3f}")
        
        except Exception as e:
            print(f"  ❌ Error testing query: {e}")

if __name__ == "__main__":
    print("🚀 Starting knowledge base organization...")
    
    # Step 1: Categorize existing documents
    create_searchable_topics()
    
    # Step 2: Create topic search vectors
    create_topic_search_vectors()
    
    # Step 3: Test the organized search
    test_topic_search()
    
    print("\n🎉 Knowledge base organization complete!")
    print("Your AI can now search by specific topics instead of generic queries!")
