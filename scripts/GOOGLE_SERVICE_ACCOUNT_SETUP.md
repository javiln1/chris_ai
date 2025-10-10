x# Google Service Account Setup Guide

This will let the scripts access your private Google Docs without making them public.

---

## Step 1: Create Google Cloud Project (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account
2. **Create a New Project**
   - Click the project dropdown (top left, next to "Google Cloud")
   - Click "NEW PROJECT"
   - Project name: `chris-ai-knowledge-base`
   - Click "CREATE"
   - Wait for it to finish creating (~30 seconds)
   - Make sure the new project is selected in the dropdown

---

## Step 2: Enable Google Docs API (2 minutes)

1. **Go to APIs & Services**
   - In the left sidebar, click: **APIs & Services** → **Library**
   - Or visit: https://console.cloud.google.com/apis/library

2. **Enable Google Docs API**
   - Search for: `Google Docs API`
   - Click on **Google Docs API**
   - Click **ENABLE**
   - Wait for it to enable (~10 seconds)

3. **Enable Google Drive API** (also needed)
   - Click "Library" again
   - Search for: `Google Drive API`
   - Click on **Google Drive API**
   - Click **ENABLE**

---

## Step 3: Create Service Account (5 minutes)

1. **Go to Service Accounts**
   - Left sidebar: **APIs & Services** → **Credentials**
   - Or visit: https://console.cloud.google.com/apis/credentials

2. **Create Service Account**
   - Click **+ CREATE CREDENTIALS** (top)
   - Select **Service account**

3. **Fill in Details**
   - Service account name: `chris-ai-docs-reader`
   - Service account ID: (auto-filled, leave as is)
   - Description: `Access to Chris's knowledge base docs`
   - Click **CREATE AND CONTINUE**

4. **Grant Access (Optional Step)**
   - Skip this - click **CONTINUE**

5. **Grant Users Access (Optional Step)**
   - Skip this - click **DONE**

---

## Step 4: Download Credentials JSON (2 minutes)

1. **Find Your Service Account**
   - You should see your service account in the list
   - Email looks like: `chris-ai-docs-reader@your-project.iam.gserviceaccount.com`

2. **Create Key**
   - Click on the service account email
   - Go to the **KEYS** tab
   - Click **ADD KEY** → **Create new key**
   - Choose **JSON** format
   - Click **CREATE**
   - A file will download: `chris-ai-knowledge-base-xxxxx.json`

3. **Save the File**
   - Move this file to your project folder:
     ```bash
     mv ~/Downloads/chris-ai-knowledge-base-*.json /Users/javilopez/cursor-projects/chris-ai/google-credentials.json
     ```

---

## Step 5: Share Google Drive Folder with Service Account (3 minutes)

**THIS IS THE KEY STEP - Don't skip this!**

Instead of sharing each doc individually, share the ENTIRE FOLDER:

1. **Find the Service Account Email**
   - From the credentials JSON file, copy the email
   - It looks like: `chris-ai-docs-reader@chris-ai-knowledge-base-xxxxx.iam.gserviceaccount.com`

2. **Share Your Google Drive Folder**
   - Go to Google Drive
   - Find the folder that contains ALL your transcript docs
   - **Right-click the folder** → **Share**
   - Paste the service account email
   - Set permission to **Viewer**
   - **UNCHECK** "Notify people"
   - Click **Share**

3. **Done!**
   - Now the service account can read ALL docs in that folder
   - No need to share each doc individually!

---

## Step 6: Update Your .env File (1 minute)

Add this line to your `.env`:

```bash
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
```

Your `.env` should now have:
```bash
PINECONE_API_KEY=pcsk_...
OPENAI_API_KEY=sk-proj-...
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
```

---

## Step 7: Test It Works (1 minute)

Run the test script:

```bash
npx tsx scripts/test-doc-fetch-with-auth.ts
```

If you see:
```
✅ SUCCESS! Fetched 8,432 characters
```

You're ready to upload!

---

## Step 8: Run Full Upload

```bash
./scripts/run-upload.sh
```

This will now:
1. Authenticate using the service account
2. Fetch ALL your private Google Docs
3. Upload full transcripts to Pinecone

---

## Troubleshooting

### "Permission denied" error
- Make sure you shared the FOLDER (not individual docs)
- Service account email must match exactly
- Wait 1-2 minutes after sharing for permissions to propagate

### "File not found" error for credentials
- Make sure the file is named `google-credentials.json`
- Make sure it's in the project root folder
- Check the path in .env matches

### "API not enabled" error
- Go back to Step 2 and enable both APIs
- Make sure you're in the correct project

---

## Security Notes

- The `google-credentials.json` file is gitignored
- Never commit this file to GitHub
- Keep it safe - it has access to your docs
- You can revoke access anytime in Google Cloud Console

---

## Quick Summary

1. ✅ Create Google Cloud Project
2. ✅ Enable Google Docs + Drive APIs
3. ✅ Create Service Account
4. ✅ Download credentials JSON
5. ✅ Share Drive FOLDER with service account email
6. ✅ Add path to .env
7. ✅ Test it works
8. ✅ Run upload!

**Total time: ~15-20 minutes**

Then you'll have ALL your transcripts in Pinecone with zero manual doc sharing! 🚀
