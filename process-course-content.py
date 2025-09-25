#!/usr/bin/env python3
"""
Process Course Content tab and extract Google Docs content for Pinecone
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

# Course Content data
course_content_data = [
    {"title": "Watch this first neu", "url": "https://docs.google.com/document/d/1NCVyRrpqbjejU3o3Ry6fnkFWxdRX1bKDhVig6o90xvQ/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "GPC Organic Roadmap", "url": "https://docs.google.com/document/d/1tXDrpfM5cXCm9Mszr7m7szencKxS-8pDqPjJ9-wtG7Q/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Good habits Neu", "url": "https://docs.google.com/document/d/1QOoMhSfn7uZz2F9H7-MAekOCuw9YsSclSi6VKEwd_-4/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "GPC Providing value NEU", "url": "https://docs.google.com/document/d/1K6rGy0DdOXHQr023h9aURWC8YtwFnRjPwldzhlRE2PA/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to set up your background", "url": "https://docs.google.com/document/d/19WW6zRfd9BrRgU01d0vbP8_CvJyXkicE2I6tfc0nCzo/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Handmovements NEU", "url": "https://docs.google.com/document/d/1ORqx_jtQ-BGPOLefsTW7hfZY4gNWuylv61_a3WlQR3I/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Good eye for content NEU", "url": "https://docs.google.com/document/d/1pGeqUOT1S1pWyl2EFKF6c2PKMaIu61OWEXA2BvXfuEY/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to Subconsciously Sync Music While Filming neu", "url": "https://docs.google.com/document/d/1G5ZnFlpLgzjj_CjKY_uzL-FKU0zEYWeO3WY_CJE-KnA/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How To Set Up Lighting NEU", "url": "https://docs.google.com/document/d/1Ivl5f5hz9LXWicWbUK3q6bM2oxq2K8kyKop-nMH1Fhk/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How To Properly Use Controversy NEU", "url": "https://docs.google.com/document/d/1m1_ZcIK_dq1anUdliJMoeGviYapDWrL8g59GiYNkNTM/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Slow vs Fast Pace NEU", "url": "https://docs.google.com/document/d/15n57ME7dWw-cjrlaWthelSDjXMNDLCegGIcGMH71KCw/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "how to make own sounds new", "url": "https://docs.google.com/document/d/1XOshS-xCO4fshKSvdEmhHssCmliZpeXXFPcniCZM0IY/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to Make new Acc & Optimize FYP", "url": "https://docs.google.com/document/d/1qay3JfaiCM-CmS6XU4RiKbaqLo9tqaSKk1FjyDCgIug/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "TikTok vs Instagram vs YouTube NEU", "url": "https://docs.google.com/document/d/127vZX6WLpvGRO9xUGNnKuoIMsmu-nzPyYPfAupr9Mso/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Good vs bad vids NEW", "url": "https://docs.google.com/document/d/1wYEImbNArdRk6JnmjLCoz8DHAIZe_-q25TWPpBXoY_E/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Good Vs Bad Accounts", "url": "https://docs.google.com/document/d/1XIt7xUL0YdCCFhkbBL7_5elgFffd4ieWbidmnV3ORpA/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to behave after going viral NEW", "url": "https://docs.google.com/document/d/1JhkKTokoew7XIVwfygUDY3OHelofCaERUIXWWItewwc/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Viral Hooks NEU", "url": "https://docs.google.com/document/d/1fr2F2GW0kIXlArXuYWDZ8DOPuseNURL8KVLd-2gXRgY/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to avoid Burners", "url": "https://docs.google.com/document/d/1a678GCs7oe_N7W8ni_KjTkVJriOAPszD1l68xPMDjAk/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to avoid 0 views on every platform - NEU", "url": "https://docs.google.com/document/d/1cViX3JzYBnrcK3X1daI9guryuBF8jPOis3s2SAqLFKo/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "GPC TikTok Recycle Method NEU", "url": "https://docs.google.com/document/d/1_j9c1pqrUYYS7QDMSv29io7idDZdfytWTPOJQlKd_eU/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Targeting Other Countries NEU", "url": "https://docs.google.com/document/d/1oAr1Jl1kPBI6FNjHlL26Kgv84q1M3pqnhl1hA1qcTvk/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "viral burner new", "url": "https://docs.google.com/document/d/1TBHf8jZqyUcaGO99lGcDs2pxbgfIVPIMJv6cFfp1eOw/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Ali Temu PR Method neu", "url": "https://docs.google.com/document/d/1VILYzxq01yzW4tTnI3J3l3AtsQ8h7WfdDXfw95i8zdc/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Good Vs Bad Products NEU", "url": "https://docs.google.com/document/d/1j7hlevODh0MVxmFMxgiZV4PXYQyL7LtAHtg08yEd8RQ/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "A-Z product research guide Neu", "url": "https://docs.google.com/document/d/111AKLHdXEayB8gURGnPEpcq0gj6UUJp0BZk8xCaRXFE/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "BTS of finding a good product", "url": "https://docs.google.com/document/d/1h_yAXhR9dtPXbxg3p9Qqwcjpsf4fUPVSkrPm8xhfJvE/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How To Source Products on CJ neu", "url": "https://docs.google.com/document/d/15EXtjZKYc4wj1phcoXVlaWeuaYzqhzRRpjcNpQDv5JE/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Saturation NEu", "url": "https://docs.google.com/document/d/1MZdz3OFuFNVvOLBfNxj28dlKj4CTCXlLi5YjKp-FQW8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Niche Growth/Archive Method Example", "url": "https://docs.google.com/document/d/1AZl4sQGK6HImxRlAZMtavzm1IGyNI-Gvq1mcuOZT1Co/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "how to prepare for products - marketing sheet", "url": "https://docs.google.com/document/d/180mPIlfakobVUDVmhLEozuzi3l5zH7zPUma6F_cPZzA/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How To Market towards your targeting Audience neu", "url": "https://docs.google.com/document/d/1uRimIp0wvqkri_TmIigvo4ROGs7q8n4f1znur7wdSmI/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to Open Up new Marketing Angles neu", "url": "https://docs.google.com/document/d/1w4UWlz22J-qmmE1zU9u8D-eLRT-EiiUw8kJZ4bIwV2Q/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Building website bTS", "url": "https://docs.google.com/document/d/1cDCMV794pbJ2AfpngB67xgDIiMdngV8-Q4rQX3rTiW8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Website Themes and Add Ons", "url": "https://docs.google.com/document/d/19m3SKkNbybYXKf1XSspwkvmXVxPAQkF3oJGr2WIFV-Y/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to Increase ur AOV with Bundles", "url": "https://docs.google.com/document/d/1r_on7oIYx0eHWTkLkypX7CCIFVD7LzaMaWp-4ZxdBL8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Good Vs Bad Websites", "url": "https://docs.google.com/document/d/166MlGg1GOKFUWx82Bs_ig0umwm5LbwYCDZLuvqXGNHs/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Custom Products", "url": "https://docs.google.com/document/d/1ULBHC7iQkpq_XULqBucXzeEboywAeHqSaXcmHOWS-s4/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "BTS of custom products", "url": "https://docs.google.com/document/d/1ffA0dvKPbyQMhseEaa5hvrI2LOtaoZjZWxPMIOe3B1s/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "0-30M Case Study", "url": "https://docs.google.com/document/d/1FXJ_bxyjF9l3xMw3_UilWym0D0dZ-eAGpKrnokzbhMw/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "0-250K subs in one month YouTube Shorts", "url": "https://docs.google.com/document/d/1hf0CAAanpIYSRCoaIl4aWv6BaYJ2xj5Vt1xHPiIceUc/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "case study 20k in 3 months with only 2 months of filming", "url": "https://docs.google.com/document/d/1l1ir23YWsdQn4pVTmhW--q_OYaxo8L2QfwPzBOKSijY/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Watch this when u are done", "url": "https://docs.google.com/document/d/1ALe4rfTmsqjjdtaUgRWFE-IFTGTFWpk06VbZavS54es/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Welcome to the Organic Demons", "url": "https://docs.google.com/document/d/1mshdYRvPa-GbtQd3XKCiV7CERmVn4B6VWU-z1y22dKg/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Niche Growth AI", "url": "https://docs.google.com/document/d/1DHeJCMkw94YVbNO_0th3S8NyWzrDKSXHkM_70XMNYpg/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Longevity with Instagram", "url": "https://docs.google.com/document/d/1Vqkl-Qwr522K-jxn1aycmMGNsWY383zb_mwN2satitA/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Branding", "url": "https://docs.google.com/document/d/142-mLJO46ANa6U_Ou1q7Ga2vAqg42sm_EgiYwqbuOro/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Niche Growth/Archive Method Example", "url": "https://docs.google.com/document/d/1bPS0j0_p31yyUAAT7aw6BtSjfS_i0q0XHdsgD5600W0/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Archive Method 2.0", "url": "https://docs.google.com/document/d/1BlOEdJCw4Y_hhM_cqeP567sBfXL9SnjWmdHITYzdJGg/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "IG prime method", "url": "https://docs.google.com/document/d/1cmHuTDIGxvwJuNrVtBXggvKyZtDhcRHb7tAnk-NZ-J8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "IG Trials", "url": "https://docs.google.com/document/d/1t5tF9AhaOob1AOq1YsEdyRdFbI5E2kyE114c0Bk_6Hw/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "IG sales offer", "url": "https://docs.google.com/document/d/1R_H-dlYHUQal_OyIqAF0jskyyZeAHu33Z6DpHPJJBXQ/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Email Marketing Branded IG", "url": "https://docs.google.com/document/d/17KO9O5MyPxlyc85tLIHaPqPAlmYcBA7BJjobdeZfO04/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Broadcast Method", "url": "https://docs.google.com/document/d/1Kjv5E8g6Kin4Km56ngvZzePFQSc81wGv4GR1kLvfTm4/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Building and Selling Brands", "url": "https://docs.google.com/document/d/1bAjMEb9V0q_dDO6XaGpFuV7W1mNFPJVdbQdVl-ja8a8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Longetivity on TikTok", "url": "https://docs.google.com/document/d/1pBzN3v7HZbKNx2KNe0-xvrutQiMpQWYvaJkse3t1my0/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "6 Figure Products (TikTok)", "url": "https://docs.google.com/document/d/15jWv_rGD4kjthZONicF1_6YjbaUawtv0Ubaa7KNAwjE/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "The Ultimate A to Z FACEBOOK Guide", "url": "https://docs.google.com/document/d/1_ZuS0ZkvnY4n65D5zmHR07WMAZk-itJ_ajr2JVaQC80/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Good vs Bad FB accounts", "url": "https://docs.google.com/document/d/1WDs0rp_P0DBnCNpXSRDJ0xkM44wY5tNIdXTrZrxWjp8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to behave after going viral NEW", "url": "https://docs.google.com/document/d/1SWfNXW3zdEy_nDCkijGVeJoDd0SaIRpoApH2x1mqOuk/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "WHOLE BTS of me creating content", "url": "https://docs.google.com/document/d/1ROE4_OyigXQra6j940GPLK8TU2cjNGICUrxzbxvpRZg/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Shareable Content", "url": "https://docs.google.com/document/d/1VYMMntIxvqm3tiLupiRMwHXkV542M7n4xn9EMKzl6E8/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Going Viral For the Right Reasons", "url": "https://docs.google.com/document/d/1B6-hB1xQdz93VTqMGT5VPKDpifdvKqcGFAm42FqrNfE/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Replicating Viral Concepts", "url": "https://docs.google.com/document/d/1MsZBRfzlOLM94cswLtBh7iKocvNmgS_QEukAkLVA2Fc/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to increase ur CVR", "url": "https://docs.google.com/document/d/1L8G-gYtsCC0cVDAZSzGi88PLI0Grik3_ZHP77xiUjwE/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "10k to 350k in 12 months Case Study", "url": "https://docs.google.com/document/d/1ZRYa5vapnudHKQ9MSMajDuNEHI_8adb_mbuw5C7ioLo/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "How to start new Accounts", "url": "https://docs.google.com/document/d/1eb6mZitEkH1wBJHa8ITko_dQS8tHdZH55SybiDnWUuI/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Existing vs Untapped Products", "url": "https://docs.google.com/document/d/1zu0r4PLQs2BSrUKINZJSYnapqQ_4rzGyc53HsPQd7-Y/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"},
    {"title": "Consistency with Dropshipping", "url": "https://docs.google.com/document/d/1ydJaaEbNHn8Wzh5G5WLmkWaAl2ZzlPIiCK1V3bli4bs/edit?usp=sharing", "source_type": "doc", "language": "english", "status": "active"}
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

def process_documents():
    """Process all documents and store in Pinecone"""
    print("🚀 Starting to process Course Content documents...")
    
    # Connect to Pinecone
    index = pc.Index("gpc-knowledge-base")
    
    processed_count = 0
    failed_count = 0
    
    for i, doc in enumerate(course_content_data, 1):
        print(f"\n📄 Processing {i}/{len(course_content_data)}: {doc['title']}")
        
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
        
        # Prepare metadata
        metadata = {
            "title": doc['title'],
            "source_type": doc['source_type'],
            "language": doc['language'],
            "status": doc['status'],
            "tab": "Course Content",
            "url": doc['url'],
            "content_length": len(content)
        }
        
        # Store in Pinecone
        try:
            vector_id = f"course_content_{i}_{doc['title'].replace(' ', '_').lower()}"
            index.upsert([(vector_id, embedding, metadata)])
            print(f"✅ Successfully stored: {doc['title']}")
            processed_count += 1
        except Exception as e:
            print(f"❌ Failed to store in Pinecone: {e}")
            failed_count += 1
        
        # Rate limiting
        time.sleep(1)
    
    print(f"\n🎉 Processing complete!")
    print(f"✅ Successfully processed: {processed_count} documents")
    print(f"❌ Failed: {failed_count} documents")
    
    # Test the knowledge base
    print(f"\n🔍 Testing knowledge base...")
    try:
        # Create a test query embedding
        test_query = "How to make money online with social media"
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
    
    except Exception as e:
        print(f"❌ Error testing knowledge base: {e}")

if __name__ == "__main__":
    process_documents()
