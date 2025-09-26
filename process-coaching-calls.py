#!/usr/bin/env python3
"""
Process Coaching Calls tab documents from Google Sheet and store in Pinecone
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

def store_in_pinecone(title, content, video_url, category="Coaching Calls"):
    """Store document in Pinecone"""
    try:
        # Create embedding
        embedding = create_embedding(content)
        if not embedding:
            return False
        
        # Create vector ID (sanitize title)
        vector_id = f"coaching_{re.sub(r'[^a-zA-Z0-9_-]', '_', title.lower())}"
        
        # Prepare metadata
        metadata = {
            'title': title,
            'category': category,
            'source_type': 'doc',
            'language': 'english',
            'status': 'active',
            'content_length': len(content),
            'video_url': video_url,
            'has_video': bool(video_url and 'loom.com' in video_url)
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

def process_coaching_calls():
    """Process all Coaching Calls tab documents"""
    
    # Coaching Calls tab data
    coaching_data = [
        {
            "transcript_url": "https://docs.google.com/document/d/1i-gxRAOzEYvWizyaIYWdJdi-pptRKdFKO7KmovE1eio/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/787b7a7b9c2e47a78147a4b6acd8f459?sid=a8c954ef-190d-4db2-9052-9087d8934f02"
        },
        {
            "transcript_url": "https://www.loom.com/share/0a6001c0903d4e4a92598c1c01f28846?sid=d663043a-1ad2-4606-a4de-9d8af08163df",
            "video_url": "https://www.loom.com/share/38167c4a6be44d4e9856d116e4aa4f36?sid=91cfb942-e2d1-48ce-bb31-4289d07ce960"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1VQUNFNuAJCq9VojNod_5o0qPglt0AAz0mCrRAOFk5Qg/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/8d0909ca2dfb4172b98335993ca8d2d3?sid=d9a62760-5701-40cb-9fd7-c4d805bf0be7"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1GH695AMEZh99s8iVXHUJUdll4j_3Ut8Tsgwl0UH7Utk/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/0a6001c0903d4e4a92598c1c01f28846?sid=d663043a-1ad2-4606-a4de-9d8af08163df"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/19S857GblUoZ_SQMW6lmEydL6KTaHQtxpBUWEg_lLlyc/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/81615afc99564b73916b67598e134fd3?sid=c1ff300b-5001-49b8-8dab-258743fc08d2"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1A1r4HCsz3dMMiqYf5ZvCjhn-uZ_C6i-ToRjrkxrATvs/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/a1275db24f6642b3a692b7aacdbbeed1?sid=6141fb6e-eefd-4b37-a1e8-1ad6e9006ff7"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1erVtjcTQKdAZmIbnWIcf5orQ6jnBPu2Txvvcf9qIIV8/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/767aca9cf7d84560a9f23eaff9e025e0?sid=0c1f1cc1-0f9b-44ac-8f2b-0445a9fb6c85"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1O_8jejg869vZF7L7l4CmxbCbogtCdR_K9D8avLr7O4o/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/48fe20057d8d45998912a54a99177890?sid=b53ffab3-316f-4822-a90c-4cf2ea9c028d"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1Rj8mg-nSuptk8xOCifxXIQ2aKdLLLLtmmu4-hKokUf8/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/caec49c635154e6bb09f5a34523d2972?sid=bb5d3084-b6f6-4025-a635-af3855b6abb9"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1eGGdaT16PXjPH-FgJXidfLrrQNpEVDthMQ2pqa6zdBU/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/ed9e3413d116440ab8f20e3a6e78ce84?sid=ac58e2ab-ae85-487d-829a-f5fbb7f7e3cd"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1SDpVYdRlTDnPRoJ_qjbj3rEoAfZGxEJVtueXk-B6NSo/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/6ac02846256549d88c3a43578dfdba02?sid=d9d2bde1-9f6c-48d8-a98f-a6d2e65f5d53"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1LbfC0g3lWkQ-ly5isFD4gkd-SuxunucJ6MJDpzf-hr4/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/016e27b09cee450290f22efe83572a33?sid=4d6e58f4-04f3-4409-ad32-2e2f053499e3"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1Apbb0ZJ4ZNIIc0EiBTYOGM4KjLMeJNfH5cidwdN4qoQ/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/a6d8e4802a0945c3ac38f9691180b5b7?sid=db597902-251a-4f17-a6a1-30c574d0309c"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1PymF-ou3ZnNZrxchpRwLch9zmUXKK4AMuukLXhr2a-w/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/bc4c9dfdbe8042f9a10d64b72fe51429?sid=b124a2be-ff8d-421b-8fba-c1e742c7a659"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/14KGvGmirln3YbC3j_0kRyuDc0l5EObfG2Ei6q2gQdZU/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/03efd83e3ee94e7e8e3c61046013d1af?sid=3fdfaf3d-49ab-4b9d-a9b1-edea50e477ae"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1t7BYIA6BahR4YUMXJRG6mvlCNfa1pd33VkLLtxEFEVk/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/e1597b9c62c44a95b3f403d542e93e67?sid=e0d69d7f-166c-4665-aecb-493cb740a8ce"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1SsftdIRnUCnqRvFVZY4zkv80tvVpzUGkwNruhXTassI/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/8021a73577114e97a1dad1a6d8c811f4?sid=a1d53e0c-9f7e-4eac-a0d6-53ea87735535"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1nTUdbX20ppK-QAkbtqu_W79_9-y1WBqm_-tg853vkuM/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/3c986fc69bf34e0ab6ff170cee261845?sid=619e9a83-f9c1-4a3d-a682-0a86137d866f"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1qpmowIC-5dZzKYu29cuKjpAeiyebmPM11DQeaSijZBQ/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/6011572a67244af7a600db87f4d5631b?sid=872638d2-b853-4d89-a992-083e64f069bd"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1hiCpPCm9m5eVtde8GJcjJaKPhzoTKEmyox7yyUwsS_Y/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/03917d978388455b9af7d715c6dac17e?sid=b7d74ad0-f2af-422d-bb6c-875c4ba3afbd"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/18FN_94JKnSmvlXaWkUQe93DhzE2WPzvgw1VQfJ59Dfc/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/d4a6161017474f4baba979e3a00fe87e?sid=70b1ce1f-6dbd-4f86-a7e1-bb64843eb20f"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1K9Uny-zmjNL4wHUt9Jh8bW1uKYF-_gQdpQpMPMyP3aw/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/c184a4f0b47b4615bdc7fde71627ea46?sid=25ebb28c-9bc2-4135-9f37-48de78d16449"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1BAicrUKxkSvNxPRIfQ7nuBQXGqXN__7dttPybLSAx2w/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/1020c4f61bca4314b2afae18214beea6?sid=1999a500-e8f4-4aeb-9ec4-0770d2bd222c"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/19BothR5mQLqCLG2Mwu7fcbQ9ZWaWSr5-BXp5Qeq3g0I/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/476a5927e59749c99b6858ca02f89459?sid=2f24dcdf-2b35-4653-bc4b-eceb7c800421"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1KUo_cTmB3e0uBubhiVcSHvn9qFZD9YPENrB_lJ-Lwu0/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/9be8564055794375ae0ac3f45ef85db0?sid=7570e5ca-9cba-41f9-87d8-95695f5f2644"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1QIj89U-uayvkkIVz3085t-gcOY30xm6s48ai3tEJw44/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/43b2314351d84b24b74b49e3cb124d9d?sid=0c748b91-0633-41b1-b531-43c0e472a4b6"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/13GUojsMYiNbqyc8KyHmBsGCyuhv7GPOw1qE36if719U/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/902a0bd6bc9249a88a63a4c60898ef52?sid=7369df60-e92d-453a-85cb-bc43085c7676"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1pzV1tGJyB1eAb0YgfY5oa5fUz8qREkEtzcnx8UZOPcQ/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/d722e50538f140aa8616858e8546389a?sid=e782e507-9d14-4cf2-ab41-3561ce1d2e60"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1vAnuxC_o-EmlZ8P-lE-DpYCWwWZJRaByeTgt1G_xtbE/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/aa23a598c9ba4dce80d2f4022a856b53?sid=247e63be-90a1-4ad9-858a-650f9becae63"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1n8amak2NInwcCg1ZE8Ysk0_sqgpoRQYSecGFeUpd1nY/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/a386859b72b84b1b808047250d57c7dd?sid=4a318d66-be25-4990-9fe9-8d508c0c797c"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1PCuISKvU8pk-NXZLh0NYLKGu1y-ndjjjWvYX7VFHJmI/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/d13d291aff4c418592b9c6a380a0d6fe?sid=50f9dbc3-28db-42da-96da-969e47859451"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1AJSWNIm7s2tEKQiI11KGYgDcKnJvBi1urLBLKIbRsTo/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/05be8896c72c43588412e7463b535522?sid=4a2e5643-bb13-4389-a634-7edc56109f8f"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1J4oJvW-6WW0zU5R1-cAMTwdFAf_yYSC1MfUpZiuQ4vI/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/8294b6611c0a4ded81469bfba30aecd6?sid=f56f2a78-91a6-4eb8-bf71-3bd3617c89b1"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/18Hnsdec_9f4E2a8zuUCwo67ag-cqHNnsHGhq6qE_f4M/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/eaa6682dbd2c4111b7eb9419fc712baf?sid=dbd83f9c-3d2a-42e0-acfc-7de1bd27214f"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1T0FREY6tnopqxJf5aEm0sv-x08aGPRwTnlag5DLt-HM/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/89c9f3dd5019442cb99028ea7d7dedf0?sid=f718e92a-8574-49a9-b9b1-b8265183010b"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/11EBpwp2c5A5nbvdZ6tAkL0apXikSvIkkBvMJdq8gouw/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/46c453fe1a6d493cb2fdfb993fe75f04?sid=dc995e41-fe77-4e14-825b-3bb8030286c0"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1SkR1_y4dDmgo-NXLl_ja8rheyDM-Lcc0kd3hT6s0_Nk/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/7cad54e1e6ef464aa162b60e259e4800?sid=26540f2f-0279-4285-a5e1-466ab8ffff39"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1aUU-Z7A845WCzJ3Qj1cMKRIFwreD6yJvMB4JRvxI5xA/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/e09fc1b55d7c4629922a4f4402f48011?sid=21fc8df2-ae6d-4040-9269-31f93982eb67"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1m1YvaWcWPPp2_QsPRAaLTR1eiV4B_jFeVHhqURPk8Vk/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/4885a17306c14d188f6e9298379e49dc?sid=dd045516-68ad-4240-a90c-0d323d2b8a1a"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1RBI6ZsVYr0MRBqBeIe2g8EMudI4yLeyq24DM7pzG4H8/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/b1b64cfbf151402083fa6b16658d11e7?sid=5b28abfa-fa3d-4e07-9870-81e4f030c2ee"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1kURdOZwwbx6iXveQniGn2Q3iurmypftZtHCc5EXyumQ/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/4459d09837904daeba9e6607c8e89109?sid=a35b1b1a-09d6-42ab-958d-eeb3959e1d54"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1HTl8co2abr-VbIz_7e8Gnvb3p1xcA6F7hHL7CKPW-rs/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/59ee3a118c1b4e65a465d85c32fdfcae?sid=364c5080-0531-4bb6-8459-5571af64944c"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1u-6imfavAdlMmULgjRzgsFpr0J3gjKN7kLwAaHbQMFo/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/adfc15c98cd54186a8ef28a90e5900cc?sid=ba627c2c-c213-48a3-a8d9-03f197079dd0"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/10F7s2wcb6yBj2ND1hikx3_VsK9w885LZP0CfjYUPRqE/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/6ae1cac9a04a4989aeb1fe34ecc8cd9f?sid=d2d199d7-6c09-4b29-8fff-54b7b60ae757"
        },
        {
            "transcript_url": "https://docs.google.com/document/d/1CgmRHP7hEICeMFRtcJWgvUosadBEmBzT7C_CKeQ3EAE/edit?usp=sharing",
            "video_url": "https://www.loom.com/share/073028d0d1f34c5199c415c34c5e7958?sid=4d63ef07-5f8f-4353-a9df-91449fef823b"
        }
    ]
    
    print("🚀 Starting to process Coaching Calls documents...")
    
    successful = 0
    failed = 0
    
    for i, call in enumerate(coaching_data, 1):
        # Extract title from the document URL or use a generic title
        title = f"Coaching Call {i}"
        
        print(f"\n📞 Processing {i}/{len(coaching_data)}: {title}")
        
        # Check if transcript_url is a Google Doc or Loom link
        if 'docs.google.com' in call['transcript_url']:
            # Extract content from Google Doc
            content = extract_document_content(call['transcript_url'])
            if not content:
                print(f"❌ Failed to extract content for: {title}")
                failed += 1
                continue
        else:
            # Skip Loom links for now (we can't extract content from them)
            print(f"⚠️  Skipping Loom link for: {title}")
            failed += 1
            continue
        
        # Check content length
        if len(content) > 50000:  # 50k character limit
            print(f"⚠️  Content too long ({len(content)} chars), skipping...")
            failed += 1
            continue
        
        # Store in Pinecone
        if store_in_pinecone(title, content, call['video_url'], "Coaching Calls"):
            print(f"✅ Successfully stored: {title}")
            successful += 1
        else:
            print(f"❌ Failed to store: {title}")
            failed += 1
        
        # Small delay to avoid rate limits
        time.sleep(1)
    
    print(f"\n🎉 Processing complete!")
    print(f"✅ Successfully processed: {successful} documents")
    print(f"❌ Failed: {failed} documents")
    
    # Test the knowledge base
    if successful > 0:
        print(f"\n🔍 Testing knowledge base...")
        test_query = "coaching call advice and tips"
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
    process_coaching_calls()
