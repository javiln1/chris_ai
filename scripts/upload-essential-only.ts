/**
 * Upload ONLY Coaching Calls and Course Content to fresh Pinecone index
 * This ensures we only have Chris's direct teaching - no broken/empty entries
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as fs from 'fs';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const NEW_INDEX_NAME = 'gpc-knowledge-base-v2';

// Initialize Google Auth
let googleAuth: JWT | null = null;

function getGoogleAuth(): JWT {
  if (googleAuth) return googleAuth;

  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

  googleAuth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });

  return googleAuth;
}

function extractDocId(url: string): string | null {
  const patterns = [
    /\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /document\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

async function fetchGoogleDocContent(docUrl: string): Promise<string> {
  const docId = extractDocId(docUrl);
  if (!docId) return '';

  try {
    const auth = getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });

    const doc = await docs.documents.get({ documentId: docId });

    if (!doc.data.body?.content) return '';

    let fullText = '';

    const extractText = (element: any): void => {
      if (element.paragraph) {
        for (const textRun of element.paragraph.elements || []) {
          if (textRun.textRun?.content) {
            fullText += textRun.textRun.content;
          }
        }
      }
      if (element.table) {
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            for (const cellElement of cell.content || []) {
              extractText(cellElement);
            }
          }
        }
      }
    };

    for (const element of doc.data.body.content) {
      extractText(element);
    }

    return fullText;
  } catch (error: any) {
    console.warn(`⚠️  Could not fetch doc ${docId}: ${error.message}`);
    return '';
  }
}

async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000),
  });

  return response.data[0].embedding;
}

async function fetchSheetTab(tabName: string) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

  console.log(`📥 Fetching tab: ${tabName}`);
  const response = await fetch(csvUrl);

  if (!response.ok) {
    console.error(`❌ Failed to fetch ${tabName}`);
    return [];
  }

  const csvText = await response.text();
  const lines = csvText.split('\n').slice(1); // Skip header

  const rows = lines.map(line => {
    const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
    return {
      title: values[0] || '',
      transcript_link: values[1] || '',
      source_type: values[2] || 'doc',
      language: values[3] || 'english',
      status: values[4] || 'active',
      category: tabName,
      creator: 'Chris',
      video_url: values[6] || '',
    };
  });

  return rows.filter(r => r.status === 'active' && r.transcript_link);
}

async function main() {
  console.log('🚀 Uploading ONLY Coaching Calls + Course Content\n');
  console.log(`📦 Target index: ${NEW_INDEX_NAME}\n`);

  const index = pinecone.index(NEW_INDEX_NAME);

  // Fetch only the essential tabs
  const tabs = ['Course Content', 'Courses', 'Looms'];

  let allItems: any[] = [];

  for (const tab of tabs) {
    const items = await fetchSheetTab(tab);
    allItems.push(...items);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Total items to upload: ${allItems.length}\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];

    console.log(`\n[${i + 1}/${allItems.length}] Processing: ${item.title}`);

    // Fetch content from Google Doc
    const content = await fetchGoogleDocContent(item.transcript_link);

    if (!content || content.length < 100) {
      console.log(`⚠️  Skipping - content too short (${content.length} chars)`);
      failed++;
      continue;
    }

    try {
      // Create embedding
      const embedding = await createEmbedding(content);

      // Create unique ID
      const id = `${item.category}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Upload to Pinecone with CONTENT FIELD
      await index.upsert([
        {
          id,
          values: embedding,
          metadata: {
            title: item.title,
            content: content, // ✅ ACTUAL CONTENT INCLUDED
            category: item.category,
            creator: item.creator,
            video_url: item.video_url,
            source_type: item.source_type,
            language: item.language,
          },
        },
      ]);

      console.log(`✅ Uploaded "${item.title}" (${content.length} chars)`);
      successful++;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`❌ Failed to upload: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n\n🎉 Upload complete!`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n📊 Total in index: ${successful} items with FULL CONTENT`);
}

main().catch(console.error);
