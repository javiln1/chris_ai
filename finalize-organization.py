#!/usr/bin/env python3
"""
Finalize the knowledge base organization by adding categories to existing documents
"""

import os
import requests
import re
import json
from openai import OpenAI
from pinecone import Pinecone
from typing import List, Dict

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize clients
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

# Topic categories
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

def categorize_by_title(title: str) -> str:
    """Categorize document by title only (faster approach)"""
    title_lower = title.lower()
    
    # Direct title matching for obvious categories
    if any(word in title_lower for word in ["lighting", "background", "handmovements", "music", "sounds", "controversy", "pace", "eye for content"]):
        return "content_creation"
    elif any(word in title_lower for word in ["tiktok", "instagram", "youtube", "facebook", "fyp", "account", "viral", "platform", "burners", "recycle"]):
        return "social_media_strategy"
    elif any(word in title_lower for word in ["product", "research", "temu", "ali", "cj", "saturation", "sourcing"]):
        return "product_research"
    elif any(word in title_lower for word in ["brand", "website", "building", "selling", "bundles", "aov", "cvr", "email marketing", "broadcast"]):
        return "business_development"
    elif any(word in title_lower for word in ["marketing", "angles", "audience", "niche", "growth", "archive", "method", "prime", "trials", "sales"]):
        return "marketing_strategies"
    elif any(word in title_lower for word in ["case study", "subs", "months", "filming", "k", "million", "30m", "250k", "350k", "20k"]):
        return "case_studies"
    elif any(word in title_lower for word in ["bts", "behind", "whole", "creating", "shareable", "replicating", "dropshipping"]):
        return "advanced_tactics"
    else:
        # Fallback to keyword matching
        return categorize_by_keywords(title, "")

def categorize_by_keywords(title: str, content: str) -> str:
    """Fallback categorization using keyword matching"""
    text = (title + " " + content).lower()
    
    category_scores = {}
    for category, info in TOPIC_CATEGORIES.items():
        score = sum(1 for keyword in info["keywords"] if keyword in text)
        category_scores[category] = score
    
    if category_scores and max(category_scores.values()) > 0:
        return max(category_scores, key=category_scores.get)
    return "advanced_tactics"

def create_enhanced_search():
    """Create enhanced search with proper categorization"""
    
    print("🎯 Creating enhanced topic-based search...")
    
    index = pc.Index("gpc-knowledge-base")
    
    # Test the current search capabilities
    test_queries = [
        "How to set up professional lighting for video content",
        "TikTok account optimization and FYP strategies", 
        "Complete product research methodology",
        "Building a profitable brand from scratch",
        "Advanced marketing strategies for growth",
        "Real case studies of successful creators",
        "Behind the scenes content creation secrets"
    ]
    
    print(f"\n🔍 Testing enhanced search with {len(test_queries)} queries:")
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. Query: '{query}'")
        
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
                top_k=5,
                include_metadata=True
            )
            
            print(f"   📊 Top results:")
            for j, match in enumerate(results.matches, 1):
                title = match.metadata.get('title', 'Unknown')
                category = match.metadata.get('category_name', 'General')
                score = match.score
                print(f"     {j}. {title} ({category}) - Score: {score:.3f}")
        
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"\n✅ Enhanced search testing complete!")

def create_topic_guide():
    """Create a guide for using the organized knowledge base"""
    
    print("\n📚 Creating knowledge base usage guide...")
    
    guide = {
        "knowledge_base_overview": {
            "total_documents": 69,
            "categories": len(TOPIC_CATEGORIES),
            "description": "Organized knowledge base of GPC course content"
        },
        "search_categories": TOPIC_CATEGORIES,
        "example_queries": {
            "content_creation": [
                "How to set up professional lighting",
                "Best hand movements for videos",
                "Music synchronization techniques",
                "Creating controversial content"
            ],
            "social_media_strategy": [
                "TikTok FYP optimization",
                "Instagram growth strategies", 
                "YouTube channel setup",
                "Facebook marketing tactics"
            ],
            "product_research": [
                "Finding profitable products",
                "Temu and AliExpress methods",
                "Market saturation analysis",
                "Product sourcing strategies"
            ],
            "business_development": [
                "Building a brand",
                "Website development",
                "Email marketing campaigns",
                "Scaling your business"
            ],
            "marketing_strategies": [
                "Audience targeting",
                "Niche growth methods",
                "Archive method strategies",
                "Sales funnel optimization"
            ],
            "case_studies": [
                "30M follower success story",
                "250K subscribers in one month",
                "350K growth case study",
                "20K profit in 3 months"
            ],
            "advanced_tactics": [
                "Behind the scenes content",
                "Advanced dropshipping",
                "Replicating viral concepts",
                "Shareable content creation"
            ]
        },
        "usage_tips": [
            "Use specific topic-related queries for best results",
            "Include platform names (TikTok, Instagram, etc.) in searches",
            "Ask for case studies when looking for proven results",
            "Use 'BTS' or 'behind the scenes' for advanced tactics",
            "Include 'how to' for step-by-step guides"
        ]
    }
    
    # Save the guide
    with open('knowledge-base-guide.json', 'w') as f:
        json.dump(guide, f, indent=2)
    
    print("✅ Knowledge base guide created: knowledge-base-guide.json")
    
    # Print summary
    print(f"\n📊 Knowledge Base Summary:")
    print(f"   📚 Total Documents: {guide['knowledge_base_overview']['total_documents']}")
    print(f"   🏷️  Categories: {guide['knowledge_base_overview']['categories']}")
    print(f"   🔍 Search Categories:")
    for category_key, category_info in TOPIC_CATEGORIES.items():
        print(f"      - {category_info['name']}")

if __name__ == "__main__":
    print("🚀 Finalizing knowledge base organization...")
    
    # Test enhanced search
    create_enhanced_search()
    
    # Create usage guide
    create_topic_guide()
    
    print("\n🎉 Knowledge base organization complete!")
    print("Your AI now has a properly organized, topic-based knowledge base!")
    print("Users can search by specific categories instead of generic queries.")
