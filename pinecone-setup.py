#!/usr/bin/env python3
"""
Pinecone Knowledge Base Setup
Extracts data from Google Sheets → Google Docs → Pinecone Vector Database
"""

import os
import json
import time
from typing import List, Dict, Any
import pandas as pd
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import pinecone
from pinecone import Pinecone
import openai
from openai import OpenAI

class PineconeKnowledgeBase:
    def __init__(self, 
                 pinecone_api_key: str,
                 openai_api_key: str,
                 google_credentials_path: str,
                 google_sheet_id: str):
        """
        Initialize the knowledge base system
        
        Args:
            pinecone_api_key: Your Pinecone API key
            openai_api_key: Your OpenAI API key for embeddings
            google_credentials_path: Path to Google service account JSON
            google_sheet_id: ID of your Google Sheet
        """
        # Initialize Pinecone
        self.pc = Pinecone(api_key=pinecone_api_key)
        
        # Initialize OpenAI
        self.openai_client = OpenAI(api_key=openai_api_key)
        
        # Initialize Google Sheets API
        self.setup_google_sheets(google_credentials_path)
        self.sheet_id = google_sheet_id
        
        # Configuration
        self.index_name = "gpc-knowledge-base"
        self.embedding_model = "text-embedding-3-small"  # Cost-effective model
        self.chunk_size = 1000  # Characters per chunk
        self.chunk_overlap = 200  # Overlap between chunks
        
    def setup_google_sheets(self, credentials_path: str):
        """Setup Google Sheets API access"""
        try:
            # Define the scope
            SCOPES = [
                'https://www.googleapis.com/auth/spreadsheets.readonly',
                'https://www.googleapis.com/auth/documents.readonly'
            ]
            
            # Load credentials
            creds = Credentials.from_service_account_file(
                credentials_path, scopes=SCOPES
            )
            
            # Build services
            self.sheets_service = build('sheets', 'v4', credentials=creds)
            self.docs_service = build('docs', 'v1', credentials=creds)
            
            print("✅ Google Sheets API initialized successfully")
            
        except Exception as e:
            print(f"❌ Error setting up Google Sheets API: {e}")
            raise
    
    def create_pinecone_index(self):
        """Create Pinecone index for the knowledge base"""
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                # Create index
                self.pc.create_index(
                    name=self.index_name,
                    dimension=1536,  # OpenAI text-embedding-3-small dimension
                    metric='cosine',
                    spec={'serverless': {'cloud': 'aws', 'region': 'us-east-1'}}
                )
                
                print(f"✅ Created Pinecone index: {self.index_name}")
                
                # Wait for index to be ready
                while not self.pc.describe_index(self.index_name).status['ready']:
                    print("⏳ Waiting for index to be ready...")
                    time.sleep(1)
                    
            else:
                print(f"✅ Index {self.index_name} already exists")
                
            # Connect to index
            self.index = self.pc.Index(self.index_name)
            print("✅ Connected to Pinecone index")
            
        except Exception as e:
            print(f"❌ Error creating Pinecone index: {e}")
            raise
    
    def get_sheet_data(self, tab_name: str) -> pd.DataFrame:
        """Extract data from a specific Google Sheet tab"""
        try:
            range_name = f"{tab_name}!A:F"  # Adjust range as needed
            
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.sheet_id,
                range=range_name
            ).execute()
            
            values = result.get('values', [])
            
            if not values:
                print(f"⚠️ No data found in tab: {tab_name}")
                return pd.DataFrame()
            
            # Create DataFrame
            df = pd.DataFrame(values[1:], columns=values[0])
            print(f"✅ Extracted {len(df)} rows from tab: {tab_name}")
            
            return df
            
        except HttpError as e:
            print(f"❌ Error reading sheet tab {tab_name}: {e}")
            return pd.DataFrame()
    
    def extract_doc_content(self, doc_url: str) -> str:
        """Extract text content from a Google Doc"""
        try:
            # Extract document ID from URL
            doc_id = doc_url.split('/d/')[1].split('/')[0]
            
            # Get document
            doc = self.docs_service.documents().get(documentId=doc_id).execute()
            
            # Extract text content
            content = ""
            for element in doc.get('body', {}).get('content', []):
                if 'paragraph' in element:
                    paragraph = element['paragraph']
                    for text_run in paragraph.get('elements', []):
                        if 'textRun' in text_run:
                            content += text_run['textRun']['content']
            
            return content.strip()
            
        except Exception as e:
            print(f"❌ Error extracting content from {doc_url}: {e}")
            return ""
    
    def create_embeddings(self, text: str) -> List[float]:
        """Create embeddings for text using OpenAI"""
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
            
        except Exception as e:
            print(f"❌ Error creating embeddings: {e}")
            return []
    
    def chunk_text(self, text: str, title: str) -> List[Dict[str, Any]]:
        """Split text into chunks for better retrieval"""
        chunks = []
        
        # Simple chunking by character count
        start = 0
        chunk_id = 0
        
        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            chunk_text = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk_text.rfind('.')
                last_newline = chunk_text.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > start + self.chunk_size // 2:
                    end = start + break_point + 1
                    chunk_text = text[start:end]
            
            chunks.append({
                'id': f"{title}_{chunk_id}",
                'text': chunk_text,
                'chunk_index': chunk_id,
                'title': title
            })
            
            start = end - self.chunk_overlap
            chunk_id += 1
            
        return chunks
    
    def process_sheet_tab(self, tab_name: str):
        """Process all documents in a sheet tab"""
        print(f"\n🔄 Processing tab: {tab_name}")
        
        # Get sheet data
        df = self.get_sheet_data(tab_name)
        
        if df.empty:
            return
        
        # Find the transcript/doc column
        doc_column = None
        for col in df.columns:
            if 'transcript' in col.lower() or 'doc' in col.lower():
                doc_column = col
                break
        
        if not doc_column:
            print(f"⚠️ No document column found in {tab_name}")
            return
        
        # Process each row
        vectors_to_upsert = []
        
        for index, row in df.iterrows():
            try:
                # Get document URL
                doc_url = row[doc_column]
                if not doc_url or not doc_url.startswith('https://docs.google.com'):
                    continue
                
                # Extract content
                print(f"📄 Processing document {index + 1}/{len(df)}: {doc_url}")
                content = self.extract_doc_content(doc_url)
                
                if not content:
                    continue
                
                # Get title (try different columns)
                title = row.get('Title', row.get('title', f"Doc_{index}"))
                
                # Create chunks
                chunks = self.chunk_text(content, title)
                
                # Process each chunk
                for chunk in chunks:
                    # Create embedding
                    embedding = self.create_embeddings(chunk['text'])
                    
                    if embedding:
                        # Prepare metadata
                        metadata = {
                            'text': chunk['text'],
                            'title': chunk['title'],
                            'chunk_index': chunk['chunk_index'],
                            'tab_name': tab_name,
                            'source_type': row.get('source_type', 'doc'),
                            'language': row.get('language', 'english'),
                            'status': row.get('status', 'active'),
                            'doc_url': doc_url
                        }
                        
                        # Add to upsert list
                        vectors_to_upsert.append({
                            'id': chunk['id'],
                            'values': embedding,
                            'metadata': metadata
                        })
                
                # Upsert in batches
                if len(vectors_to_upsert) >= 100:  # Pinecone batch limit
                    self.index.upsert(vectors=vectors_to_upsert)
                    print(f"✅ Upserted {len(vectors_to_upsert)} vectors")
                    vectors_to_upsert = []
                
                # Rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Error processing row {index}: {e}")
                continue
        
        # Upsert remaining vectors
        if vectors_to_upsert:
            self.index.upsert(vectors=vectors_to_upsert)
            print(f"✅ Upserted final batch of {len(vectors_to_upsert)} vectors")
    
    def setup_knowledge_base(self, tab_names: List[str] = None):
        """Complete setup process"""
        print("🚀 Starting Pinecone Knowledge Base Setup")
        
        # Create Pinecone index
        self.create_pinecone_index()
        
        # If no tab names provided, try to get all tabs
        if not tab_names:
            tab_names = [
                "Course Content", "Youtube", "Books", "Coaching Calls", 
                "Looms", "Courses", "Youtubers"
            ]
        
        # Process each tab
        for tab_name in tab_names:
            try:
                self.process_sheet_tab(tab_name)
            except Exception as e:
                print(f"❌ Error processing tab {tab_name}: {e}")
                continue
        
        print("\n🎉 Knowledge base setup complete!")
        print(f"📊 Total vectors in index: {self.index.describe_index_stats()['total_vector_count']}")
    
    def query_knowledge_base(self, query: str, top_k: int = 5):
        """Query the knowledge base"""
        try:
            # Create query embedding
            query_embedding = self.create_embeddings(query)
            
            if not query_embedding:
                return []
            
            # Query Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            return results.matches
            
        except Exception as e:
            print(f"❌ Error querying knowledge base: {e}")
            return []

# Usage example
if __name__ == "__main__":
    # Configuration - YOU NEED TO SET THESE
    PINECONE_API_KEY = "your-pinecone-api-key"
    OPENAI_API_KEY = "your-openai-api-key"
    GOOGLE_CREDENTIALS_PATH = "path/to/your/google-credentials.json"
    GOOGLE_SHEET_ID = "your-google-sheet-id"
    
    # Initialize knowledge base
    kb = PineconeKnowledgeBase(
        pinecone_api_key=PINECONE_API_KEY,
        openai_api_key=OPENAI_API_KEY,
        google_credentials_path=GOOGLE_CREDENTIALS_PATH,
        google_sheet_id=GOOGLE_SHEET_ID
    )
    
    # Setup the knowledge base
    kb.setup_knowledge_base()
    
    # Example query
    results = kb.query_knowledge_base("How to make money online?")
    for result in results:
        print(f"Score: {result.score}")
        print(f"Title: {result.metadata['title']}")
        print(f"Text: {result.metadata['text'][:200]}...")
        print("---")
