# Knowledge Base Upload Scripts

## Problem
Your Pinecone database had **0 characters** of actual content. It only had titles and Google Docs links, but NOT the actual transcript content.

## Solution
These scripts fetch the FULL transcript content from your Google Docs and upload them to Pinecone.

---

## How to Use

### Option 1: Automatic (Recommended)

Run this command to upload ALL your knowledge base:

```bash
./scripts/run-upload.sh
```

This will:
1. Read your Google Sheet (all tabs)
2. Fetch FULL content from each Google Doc link
3. Create embeddings
4. Upload to Pinecone with complete transcripts

### Option 2: Test with Sample First

To test with just a few items first:

```bash
npx tsx scripts/test-upload.ts
```

---

## What This Fixes

**Before:**
```
📄 "How to Find Winning Products": 0 chars (0KB)  ❌
✅ Total content retrieved: 0 chars
```

**After:**
```
📄 "How to Find Winning Products": 8,432 chars (8KB)  ✅
✅ Total content retrieved: 156,789 chars
```

Now the AI will have ACTUAL transcript content to work with!

---

## Environment Variables Needed

Make sure these are in your `.env`:

```bash
PINECONE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_SHEET_ID=your_sheet_id_here
```

---

## Google Sheet Structure Expected

Each tab should have columns:
- **A (Title)**: Video/content title
- **B (Transcript)**: Google Docs link to transcript
- **C (source_type)**: doc/video/etc
- **D (language)**: english
- **E (status)**: active/inactive

Tabs will be used as categories:
- Course Content → category: "Course Content"
- Youtubers → category: "Youtubers"
- etc.

---

## Important Notes

### Google Docs Must Be Public/Shareable
For the script to fetch content, your Google Docs need to be accessible via link.

Two options:
1. **Public**: Share → Anyone with link can view
2. **Use Service Account** (more secure - see below)

### Using Service Account (More Secure)

If you want to keep docs private, use a Google Service Account:

1. Create service account at: https://console.cloud.google.com/
2. Download credentials JSON
3. Add to `.env`:
   ```bash
   GOOGLE_CREDENTIALS_PATH=./google-credentials.json
   ```
4. Share each doc with the service account email

---

## Troubleshooting

### "Failed to fetch doc" errors
- Make sure Google Docs are shared publicly or with service account
- Check doc IDs are correct in spreadsheet

### "Rate limit" errors
- The script waits 500ms between requests
- For large uploads, this is normal - just wait

### "Content too short" warnings
- Some docs might be empty or have little content
- Script skips these automatically

---

## After Upload

Once uploaded, test with:

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How to find winning products"}],"agentId":"chatgpt4"}'
```

You should now see responses based on Chris's ACTUAL transcript content!

---

## Need Help?

Check the console logs for detailed progress:
- ✅ = Success
- ⚠️ = Warning (skipped)
- ❌ = Error

Each upload shows:
- Document title
- Characters fetched
- Upload status
