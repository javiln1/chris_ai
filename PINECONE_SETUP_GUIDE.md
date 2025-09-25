# 🚀 Complete Pinecone Knowledge Base Setup Guide

## 📋 **What You Need Before Starting:**

### **1. API Keys & Accounts:**
- ✅ **Pinecone Account** (you have this!)
- ✅ **OpenAI Account** (for embeddings)
- ✅ **Google Cloud Project** (for Sheets/Docs access)

### **2. Google Sheets Access:**
- Google Sheet with your data (you have this!)
- Google Service Account credentials

---

## 🔧 **Step-by-Step Setup:**

### **Step 1: Get Your API Keys**

#### **Pinecone API Key:**
1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Click "API Keys" in the sidebar
3. Copy your API key

#### **OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Click "API Keys"
3. Create a new secret key
4. Copy the key

#### **Google Sheets API Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Google Sheets API
   - Google Docs API
4. Create Service Account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Download the JSON credentials file

### **Step 2: Install Dependencies**

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### **Step 3: Configure Your Setup**

Create a `.env` file:
```bash
PINECONE_API_KEY=your-pinecone-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_SHEET_ID=your-google-sheet-id-here
```

### **Step 4: Get Your Google Sheet ID**

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789JKL/edit
                                    ↑ This is your Sheet ID ↑
```

### **Step 5: Run the Setup Script**

```bash
python pinecone-setup.py
```

---

## 🎯 **What the Script Does:**

### **1. Extracts Data from Google Sheets:**
- Reads all tabs in your spreadsheet
- Finds Google Docs links in each row
- Extracts the document content

### **2. Processes Documents:**
- Splits large documents into chunks
- Creates embeddings for each chunk
- Stores metadata (title, source, language, etc.)

### **3. Stores in Pinecone:**
- Creates a vector database index
- Uploads all document chunks as vectors
- Enables semantic search across all content

---

## 🔍 **How to Use Your Knowledge Base:**

### **Query Examples:**
```python
# Initialize the knowledge base
kb = PineconeKnowledgeBase(
    pinecone_api_key="your-key",
    openai_api_key="your-key", 
    google_credentials_path="credentials.json",
    google_sheet_id="your-sheet-id"
)

# Query for specific information
results = kb.query_knowledge_base("How to make money online?")

# Get results with scores and metadata
for result in results:
    print(f"Score: {result.score}")
    print(f"Title: {result.metadata['title']}")
    print(f"Text: {result.metadata['text'][:200]}...")
```

---

## 📊 **Expected Results:**

After running the script, you'll have:
- **Vector Database**: All your document content stored as searchable vectors
- **Semantic Search**: Find relevant content by meaning, not just keywords
- **Metadata**: Rich information about each document (source, type, etc.)
- **Chunked Content**: Large documents split into manageable pieces

---

## 🚨 **Troubleshooting:**

### **Common Issues:**

#### **"Permission denied" errors:**
- Make sure your Google Service Account has access to the Sheet
- Share your Google Sheet with the service account email

#### **"API quota exceeded" errors:**
- You're hitting rate limits
- The script includes delays to avoid this
- Consider upgrading your OpenAI plan

#### **"Document not found" errors:**
- Check that Google Docs links are public or accessible
- Make sure the service account has permission to read the docs

### **Cost Considerations:**

#### **OpenAI Embeddings:**
- `text-embedding-3-small`: ~$0.00002 per 1K tokens
- For 1000 documents (~1M tokens): ~$20

#### **Pinecone:**
- Serverless index: $0.096 per 1M vectors per month
- For 10K document chunks: ~$1/month

---

## 🎉 **Next Steps:**

### **1. Integrate with Your AI Agent:**
- Add Pinecone querying to your AI agents
- Enable semantic search in conversations

### **2. Advanced Features:**
- Add document filtering by source type
- Implement hybrid search (keyword + semantic)
- Add document summarization

### **3. Maintenance:**
- Regular updates when you add new documents
- Monitor usage and costs
- Optimize chunk sizes for your use case

---

## 📞 **Need Help?**

If you run into issues:
1. Check the error messages carefully
2. Verify all API keys are correct
3. Ensure Google Sheets/Docs are accessible
4. Check your internet connection and API quotas

The script is designed to be robust and handle errors gracefully, so it will continue processing even if some documents fail.
