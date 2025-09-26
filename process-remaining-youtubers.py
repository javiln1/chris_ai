#!/usr/bin/env python3
"""
Process remaining Youtubers tab documents from Google Sheet and store in Pinecone
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

def store_in_pinecone(title, content, video_url, creator, category="Youtubers"):
    """Store document in Pinecone"""
    try:
        # Create embedding
        embedding = create_embedding(content)
        if not embedding:
            return False
        
        # Create vector ID (sanitize title)
        vector_id = f"youtuber_{re.sub(r'[^a-zA-Z0-9_-]', '_', title.lower())}"
        
        # Prepare metadata
        metadata = {
            'title': title,
            'category': category,
            'source_type': 'doc',
            'language': 'english',
            'status': 'active',
            'content_length': len(content),
            'video_url': video_url,
            'creator': creator,
            'has_video': bool(video_url and 'youtu.be' in video_url)
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

def process_remaining_youtubers():
    """Process remaining Youtubers tab documents"""
    
    # Remaining Youtubers tab data (35+ videos)
    remaining_youtubers_data = [
        # More jordaninaforeign videos
        {"title": "How To Find Viral Video Ideas For Organic Dropshipping", "video_url": "https://youtu.be/OTyFX3KLh14?si=PuawQ_qjj0l7cAOL", "transcript_url": "https://docs.google.com/document/d/1QjedgtkVvDOb4y6p5dDouS_X1LdTS4CsWYNB9lEkHpw/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "How To Find Winning Dropshipping Products (Full 2025 Guide)", "video_url": "https://youtu.be/LSI8ulE6hxA?si=wU7v4YD3ntqOu8g3", "transcript_url": "https://docs.google.com/document/d/1072zpVwPcFehRDC8mztnRHyUDfWRie0VxCH6RK8FOZc/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "2 Years Of Organic Dropshipping Game In 18 Minutes", "video_url": "https://youtu.be/jFzA0LpSN-8?si=GvgMTK2wF_GiwuK6", "transcript_url": "https://docs.google.com/document/d/1fzQEyVfMpjpVDP5eoSlibxadd5dFffedB-NQHzNrUZc/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "i got 6M views in 1 day(method revealed)", "video_url": "https://youtu.be/8EhjnSriOcM?si=eWl1K5cTtW0UzfRg", "transcript_url": "https://docs.google.com/document/d/1HIotKVoapDJ_YeWuf4AkMMNm_TPWelTSSp2LnRbcSBk/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "Why You Need To Stop Hiring Creators(Organic Dropshipping)", "video_url": "https://youtu.be/pRSj3ZkhT0w?si=sS0CxdqLUEGBmWUs", "transcript_url": "https://docs.google.com/document/d/1jppIUH3adeqgRAshsPBVUJaRXy9F5L4HmiRc4mui8LU/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "10 Tips That Will Make You More Money With Organic Dropshipping", "video_url": "https://youtu.be/TG3DPJ-VEwc?si=_m06RFgA9N4HH46L", "transcript_url": "https://docs.google.com/document/d/1QnI8xuRLLhQ6Iy9glKm-J8GbapNLSw2529D0fkrBB7U/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "The REAL Reason You Can't Go Viral With Organic Dropshipping", "video_url": "https://youtu.be/eunmW3KIyjs?si=M06u9duZnDPqdwR2", "transcript_url": "https://docs.google.com/document/d/1kTUTJo5Ip7vPgUcQi9JMkJRSnIkU4KRA7rRve5APe8E/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "How I Made $6,000 L", "video_url": "https://youtu.be/A4boK6RjtAU?si=kcnu75SiorIpVyF5", "transcript_url": "https://docs.google.com/document/d/1rMDB7EmGPIO5GaJbmUPzNHoBlAzVOv0Y7EqEG9PgdrI/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "From College Dropout To Making $50k With Organic Dropshipping | Case Study", "video_url": "https://youtu.be/q6gzJwb6tNk?si=HbAI72V_nJZkbv83", "transcript_url": "https://docs.google.com/document/d/1R5l5wPQ-IOi41D80qIcwhtF_Zz9Ndy90W3imZOqJJXU/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "11.3k in just 11 days 1K every single day for the whole month", "video_url": "https://youtu.be/mNDcHkEIQRk?si=O4k1r9uG3cfsHS61", "transcript_url": "https://docs.google.com/document/d/165HJHD4AvUUfTbnXvsaBmF7DPM1IdLrEcZsOcTrz4SQ/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "5 Things Every Organic Dropshipper Needs In Q4", "video_url": "https://youtu.be/EK-rId08Pfg?si=ECn9LgtAd64a7zNq", "transcript_url": "https://docs.google.com/document/d/1KW8xInp-IGS9bhGygcufh5ZvCoN09fOqo5ZiyCiCZtk/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "How To Start Dropshipping In 2025(FULL 2025 GUIDE)", "video_url": "https://youtu.be/p1kHkEmpPaM?si=HrdHY5o5kkcKo2Y1", "transcript_url": "https://docs.google.com/document/d/1wMWGTxaH8NHx8SrPZQaV3mcCb2YOp6lL_PrMNXEoyLM/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "My Q4 Advice For Organic Dropshippers | Q&A", "video_url": "https://youtu.be/MrCG9YfsJ7Q?si=BHiTXymZwbiQtFsA", "transcript_url": "https://docs.google.com/document/d/1xuspU0s-I_3ZjIH9JOaiQAP42wt64T_B7q2_4So3D0Q/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "TikTok Organic Dropshipping Is Dead, Here's The Solution", "video_url": "https://youtu.be/U-zCiBo0uqk?si=jH0LxnsoZhan8JyC", "transcript_url": "https://docs.google.com/document/d/1PWFI4xVZ0iPKi0ci6fHC3o-iw3ZYX9MivEF3y_6uebo/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "$10,000 In One Day With Organic Dropshipping | Case Study", "video_url": "https://youtu.be/JUYXZZeZrRA?si=JKfm5im4Z-9vZ17D", "transcript_url": "https://docs.google.com/document/d/1g1WFhLliBs530G8ClEaqwwaYKNmtj_aX4apaEClmt88/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "I Made $90,000 With This Product", "video_url": "https://youtu.be/H92FznYv6TQ?si=gcbXnwH9jwdG-cpd", "transcript_url": "https://docs.google.com/document/d/1nvZpq7WJIhczt5kw5EdZ3bIb3SC768mn6-HsVd6qTQA/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "$107,000 in 6 weeks | Organic Dropshipping Case Study", "video_url": "https://youtu.be/NDd-MxS-v3E?si=e_9FG_Cszm_xWChz", "transcript_url": "https://docs.google.com/document/d/1HEK9VvebHpGkOiP5QHfv6qVpeOB47qgZhzM-Nr_b9dU/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "i made $33,000 in 7 days with organic dropshipping", "video_url": "https://youtu.be/IpCh9Jk3_KI?si=PE_tDJFH7tFuueKm", "transcript_url": "https://docs.google.com/document/d/1lk_co_TfOY5JBqmqUrhEiaVSnCT4546jz3r6dB1z0pM/edit?usp=sharing", "creator": "jordaninaforeign"},
        {"title": "How to ACTUALLY make $10k a month with TikTok Organic Dropshipping", "video_url": "https://youtu.be/2quncpCENGw?si=L6ZX_I7teFJlQFdA", "transcript_url": "https://docs.google.com/document/d/1rCTsGTnS1XrYDXUP15QQ2TR3fkJEXXsZ7tYWEu9LlJU/edit?usp=sharing", "creator": "jordaninaforeign"},
        
        # More Ethan Hayes videos
        {"title": "I've started 17 organic dropshipping stores", "video_url": "https://youtu.be/VoLq3g_SaIU?si=TfeUonT3m-26_IVq", "transcript_url": "https://docs.google.com/document/d/11YONrdSJZXiIBxGQZuC2OOYbuKjAU_PPFJBwqYsUfQo/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "Organic Dropshipping Masterclass (6+ HOUR FREE COURSE)", "video_url": "https://youtu.be/R6Tb397we2I?si=nugPpBBv9B09Ng_A", "transcript_url": "https://docs.google.com/document/d/1EiZjYlNBOfRalq-XQaeQ1ENcAczy2hoDlYEvay81p-I/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How To Tell WHY Your Product Didn't Convert After Going Viral (Organic Dropshipping)", "video_url": "https://youtu.be/XF1PXU8FZ0w?si=vIZsx9UGScXZIff1", "transcript_url": "https://docs.google.com/document/d/1E_bMALKxiwmvN8JskPLdRAeRXVmrnEVsDWq17370Y4M/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How to create a Viral Dropshipping Backgrounds for Enhanced Engagement and Sales", "video_url": "https://youtu.be/-BNu9x7EU_8?si=hevnR6VckFqgz5fB", "transcript_url": "https://docs.google.com/document/d/120Zwy48uRW4LjPEXcJcU8kpSvvTqY6L1IiDT_f0IUqc/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "First $20k+ Month With Organic Dropshipping [Full Case Study]", "video_url": "https://youtu.be/ImrvNAZTN48?si=Fk9AtcGWZmEVxQ8g", "transcript_url": "https://docs.google.com/document/d/1sk61wgyQUIdcOO7N1qKGUS48MEtxISO3h-a_eFG0tqY/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How I Create BANGER Hooks For Every Vid I Post (1B+ Views With Organic Dropshipping)", "video_url": "https://youtu.be/lTtW4A1tc20?si=ubuOs-3Yo0OkwMrJ", "transcript_url": "https://docs.google.com/document/d/1fdRsvKVU-r0dwL4oVxXAb9odWw10UYq5qRYqljqN4Sk/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "8 Organic Dropshipping Lessons That Made Me Almost $1M And 1B+ Views", "video_url": "https://youtu.be/6Njx1BPvUIE?si=ZZSY5KJpKR7W5109", "transcript_url": "https://docs.google.com/document/d/1shKi_wdxcq_W1NooJI2oR3VnehAbUdYcICAldUQWflo/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "$25k In 7 Days With Instagram Organic Dropshipping [Full Case Study]", "video_url": "https://youtu.be/JmnTUu4OHGI?si=sPousRBcight_r_y", "transcript_url": "https://docs.google.com/document/d/16T0WgCJxTNQF4e_T_rn3Uf8Pc2_2q8tiZFrhhE6hg6g/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "1B+ views with organic dropshipping", "video_url": "https://youtu.be/OAjQE-Nnb20?si=rsneEPCNXm_95r4g", "transcript_url": "https://docs.google.com/document/d/1ITI3npubeFPzVTx1EwxgmGYFHJrxVcZ_eY4flMS_G1E/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "6 Figure Organic Dropshipper Gives His Thoughts On Trump's Business Killing Tariffs", "video_url": "https://youtu.be/ZaWqTdGmyVQ?si=JC7yu5NkhytjEtwQ", "transcript_url": "https://docs.google.com/document/d/1rpQ09fVrCYcVPesjXINwtRl4q4Ka1krdrTfIgjJ1miE/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "$23k In 1 Month With A POD Product (Organic Dropshipping Case Study)", "video_url": "https://youtu.be/_ou62ehwS-M?si=0yZjvbEpM2scG6Vh", "transcript_url": "https://docs.google.com/document/d/1-SGZF7alt8fnngRu6hMGpHyBOi9ZqzX1lkBK0j2OLpo/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "6 Figure Organic Dropshipper Helps 3 People Make More Money With Organic Dropshipping", "video_url": "https://youtu.be/_NyGtOVpqlQ?si=R-3rSMG2hYvCf62g", "transcript_url": "https://docs.google.com/document/d/1FwZ15GEWQoZGi26p-5EOApoZNXhOx-8yxoWT1zzgSME/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "Organic Dropshipping Bootcamp Lesson 4: How To Identify Your Product's Target Audience", "video_url": "https://youtu.be/nwW-kWc-eHU?si=6tqXg35d8wKlXbPE", "transcript_url": "https://docs.google.com/document/d/10gn39HJDznACtG3JpnOjkwCiqiw_ZtMU9IShHA0JVTg/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "$30k With 3 Winning Products In 3 Months (Organic Dropshipping Case Study)", "video_url": "https://youtu.be/W6uxfoR0aJg?si=AV3GM_mtUEeplSr5", "transcript_url": "https://docs.google.com/document/d/1J1xzkPC_iQfH9DujXi6OoqLJX7EWwXS1MjSe73Wrs0Y/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "8 Video Concepts To Make Your Product Go Viral (Organic Dropshipping)", "video_url": "https://youtu.be/ycLYdu5yFfk?si=mkLblAG_HivhbMf-", "transcript_url": "https://docs.google.com/document/d/1ZWE9p9wS1douSkkLk4IkaleMZtSvOf-ak4PxnPYISE4/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "What Got Me To Almost $1,000,000 Rev With Organic Dropshipping (TIER LIST)", "video_url": "https://youtu.be/teaE8iXHIOs?si=OmpAdVuhXcDnEWQV", "transcript_url": "https://docs.google.com/document/d/1G3EynV9pFD1BiPHhAVrIxAe4W5_6kbpWwxOmz-cGfsw/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "This Is Why You've Been Seeing Canvases & Paintings All Over Your Burner (Organic Dropshipping)", "video_url": "https://youtu.be/xqQ54GABdwQ?si=VAmoLbQ9dsUCYOvN", "transcript_url": "https://docs.google.com/document/d/1oMaUHgHyjwNnId9fY0Q8_k3rDtzvko48NkPDqY7QbzI/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How To Find 6 Figure Organic Dropshipping Products (Full Winning Product Guide)", "video_url": "https://youtu.be/sNA8sU8W9cE?si=Wlhcoib_gG3PEsda", "transcript_url": "https://docs.google.com/document/d/1wbCTQMoXRZd0CjNn3o54_Oxw-NrCwDUgrgQtbJzgZS4/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How I Made $80,000 With This Product (Dropshipping Case Study)", "video_url": "https://youtu.be/rsXdIXDcefk?si=wUJC9zSC0rvw1xmy", "transcript_url": "https://docs.google.com/document/d/1KtEXzKadJHG3XeOYH3IV_SGDGLMlSkVromV2QtRAcNI/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "Organic Dropshipping Bootcamp Lesson 3: The Blueprint For Starting/Testing A New Product", "video_url": "https://youtu.be/6-rVdMqEVmo?si=fbm_DyIIjBi6wYlF", "transcript_url": "https://docs.google.com/document/d/1VolenoPhERMpbGAfkeaVAQykWv9UJk-EkTLBA5xazVY/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "Organic Dropshipping Bootcamp Lesson 2: Mindset & Priorities", "video_url": "https://youtu.be/t976wM17TQI?si=JE1XAxKKOKNViQiy", "transcript_url": "https://docs.google.com/document/d/1627asOJxq3D6La2YqTYN6qexqsxPsv_b81pXXGHI6rk/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "Organic Dropshipping Bootcamp Lesson 1: Hooks", "video_url": "https://youtu.be/oh6_H_3ABQ4?si=vjXVbVXU8L9d6bwl", "transcript_url": "https://docs.google.com/document/d/1789E59KFYjIbExoT_veSF999ta-vlnys7eVi2cw_PVY/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "LIVE FILMING With A 6 Figure Organic Dropshipper", "video_url": "https://youtu.be/lFuuc-bk50I?si=ZmHP7v7rym3dbx52", "transcript_url": "https://docs.google.com/document/d/1ieBZiaKxP3BDEdUiwAbZqwEvbzCLuzqLze0Awu9ir74/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How To Go Viral EVERYTIME You Post (Organic Dropshipping)", "video_url": "https://youtu.be/UVGSSt_2a5c?si=52tVS2rI7jRyDVbY", "transcript_url": "https://docs.google.com/document/d/1n3PbJPJ3IXCE9jHDF0b3rfLhi6BoGLNDt8X9MVADVw0/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "The Raw Reality Of Being A 6 Figure Organic Dropshipper", "video_url": "https://youtu.be/nCDktGg7JIw?si=UFYK61DvWamUBXW5", "transcript_url": "https://docs.google.com/document/d/1hmpvsnZb4TTfXh9p2d4SSvN5NJJSg7NQaDjQDejasa4/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How To Start Organic Dropshipping In Less Than 20 Mins (For Beginners) 2025 UPDATED!", "video_url": "https://youtu.be/bmUZO8Oj0co?si=jVHxaF4PpAxfwlRK", "transcript_url": "https://docs.google.com/document/d/1gyd5zPyexhakKwvVH1rQJglIz_ybEU53CwWFqurMK4g/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How To Find and RUN Untapped Winning Products (Organic Dropshipping)", "video_url": "https://youtu.be/Pjv2mDb5nKo?si=55WQGjLQM4ZD_-fR", "transcript_url": "https://docs.google.com/document/d/1MRr4O_2891YA-h0YhsUNmGWlL4CM2IDJJ1zIv-MkWoQ/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "The Guy Behind Anime Blades… (Organic Drop Shipping)", "video_url": "https://youtu.be/RlZLZgvTWMM?si=JRA9Xfj1X_P3Id-Y", "transcript_url": "https://docs.google.com/document/d/1wYEXfKoP60CBv3Xmg63brEb16bEKzHxr6ds2snoRIXE/edit?usp=sharing", "creator": "Ethan Hayes"},
        {"title": "How I Made $169,000 in a Month With Organic Dropshipping", "video_url": "https://youtu.be/YqiG4Xbt0ac?si=u-OPt01FcacyJYqp", "transcript_url": "https://docs.google.com/document/d/19mXMsMQ2rrBX36dPPR69fmsG9hNjvQ0esqO9Ru-nUgo/edit?usp=sharing", "creator": "Ethan Hayes"},
        
        # More Michael Bernstein videos
        {"title": "How To Create Organic Dropshipping Videos That ACTUALLY Convert", "video_url": "https://youtu.be/65wsC1nlmGc?si=q6aafuxW6M0j8orC", "transcript_url": "https://docs.google.com/document/d/1VkKgMRkoI5Ej5e-x5qeW-xSUB3j9pmyqhLzfWMsyqP0/edit?usp=sharing", "creator": "Michael Bernstein"},
        {"title": "Steal These 5 Viral Video Ideas | Organic Dropshipping", "video_url": "https://youtu.be/yLD1U9OlkFM?si=qhhT6HMcL6ZWyGDX", "transcript_url": "https://docs.google.com/document/d/1K7ORUxm2l5r0jNgFtUOKMB-lKPPuLG_KLl94oSeOf88/edit?usp=sharing", "creator": "Michael Bernstein"}
    ]
    
    print("🚀 Starting to process remaining Youtubers documents...")
    print(f"📊 Processing {len(remaining_youtubers_data)} documents...")
    
    successful = 0
    failed = 0
    
    for i, video in enumerate(remaining_youtubers_data, 1):
        print(f"\n📺 Processing {i}/{len(remaining_youtubers_data)}: {video['title']}")
        print(f"👤 Creator: {video['creator']}")
        
        # Extract content from Google Doc transcript
        content = extract_document_content(video['transcript_url'])
        if not content:
            print(f"❌ Failed to extract content for: {video['title']}")
            failed += 1
            continue
        
        # Check content length
        if len(content) > 50000:  # 50k character limit
            print(f"⚠️  Content too long ({len(content)} chars), skipping...")
            failed += 1
            continue
        
        # Store in Pinecone
        if store_in_pinecone(video['title'], content, video['video_url'], video['creator'], "Youtubers"):
            print(f"✅ Successfully stored: {video['title']}")
            successful += 1
        else:
            print(f"❌ Failed to store: {video['title']}")
            failed += 1
        
        # Small delay to avoid rate limits
        time.sleep(1)
    
    print(f"\n🎉 Processing complete!")
    print(f"✅ Successfully processed: {successful} documents")
    print(f"❌ Failed: {failed} documents")
    
    # Test the knowledge base
    if successful > 0:
        print(f"\n🔍 Testing knowledge base...")
        test_query = "organic dropshipping case studies and revenue"
        test_embedding = create_embedding(test_query)
        
        if test_embedding:
            results = index.query(
                vector=test_embedding,
                top_k=5,
                include_metadata=True
            )
            
            print(f"📊 Found {len(results.matches)} relevant documents:")
            for match in results.matches:
                print(f"  - {match.metadata['title']} by {match.metadata.get('creator', 'Unknown')} (Score: {match.score:.3f})")

if __name__ == "__main__":
    process_remaining_youtubers()
