/**
 * Upload Knowledge Base to Pinecone
 *
 * This script:
 * 1. Reads Google Sheet with titles and Google Docs links
 * 2. Fetches the ACTUAL content from each Google Doc
 * 3. Uploads full transcripts to Pinecone with embeddings
 */

import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as fs from 'fs';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Initialize clients
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize Google Auth with Service Account
let googleAuth: JWT | null = null;

function getGoogleAuth(): JWT {
  if (googleAuth) return googleAuth;

  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      `Google credentials file not found at: ${credentialsPath}\n` +
      'Please follow the setup guide in scripts/GOOGLE_SERVICE_ACCOUNT_SETUP.md'
    );
  }

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

interface SheetRow {
  title: string;
  transcript_link: string; // Google Docs link
  source_type: string;
  language: string;
  status: string;
  category?: string;
  creator?: string;
  video_url?: string;
}

/**
 * Extract Google Doc ID from various URL formats
 */
function extractDocId(url: string): string | null {
  const patterns = [
    /\/d\/([a-zA-Z0-9-_]+)/,           // /d/DOC_ID
    /id=([a-zA-Z0-9-_]+)/,             // ?id=DOC_ID
    /document\/d\/([a-zA-Z0-9-_]+)/,   // /document/d/DOC_ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Fetch Google Doc content using Service Account authentication
 */
async function fetchGoogleDocContent(docUrl: string): Promise<string> {
  const docId = extractDocId(docUrl);

  if (!docId) {
    console.warn(`⚠️ Could not extract doc ID from: ${docUrl}`);
    return '';
  }

  try {
    const auth = getGoogleAuth();
    const docs = google.docs({ version: 'v1', auth });

    // Get the document
    const doc = await docs.documents.get({
      documentId: docId,
    });

    if (!doc.data.body?.content) {
      console.warn(`⚠️ Doc ${docId} has no content`);
      return '';
    }

    // Extract text from document structure
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

    console.log(`✅ Fetched doc ${docId}: ${fullText.length} chars`);

    return fullText;
  } catch (error: any) {
    if (error.code === 404) {
      console.warn(`⚠️ Doc ${docId} not found - might not be shared with service account`);
    } else if (error.code === 403) {
      console.warn(`⚠️ Doc ${docId} permission denied - share folder with service account`);
    } else {
      console.error(`❌ Error fetching doc ${docId}:`, error.message);
    }
    return '';
  }
}

/**
 * Create embedding for text
 */
async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000), // Limit to 8K chars for embedding
  });

  return response.data[0].embedding;
}

/**
 * Upload single item to Pinecone
 */
async function uploadToPinecone(
  index: any,
  row: SheetRow,
  content: string,
  batchNumber: number
) {
  if (!content || content.length < 50) {
    console.warn(`⚠️ Skipping "${row.title}" - content too short (${content.length} chars)`);
    return;
  }

  try {
    // Create embedding
    const embedding = await createEmbedding(content);

    // Create unique ID
    const id = `${row.category || 'unknown'}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Upload to Pinecone
    await index.upsert([
      {
        id,
        values: embedding,
        metadata: {
          title: row.title,
          content: content, // FULL TRANSCRIPT CONTENT!
          category: row.category || 'Unknown',
          creator: row.creator || '',
          video_url: row.video_url || '',
          source_type: row.source_type,
          language: row.language,
        },
      },
    ]);

    console.log(`✅ [${batchNumber}] Uploaded "${row.title}" (${content.length} chars)`);
  } catch (error) {
    console.error(`❌ Error uploading "${row.title}":`, error);
  }
}

/**
 * Main upload function
 */
async function uploadKnowledgeBase(sheetData: SheetRow[]) {
  const index = pinecone.index('gpc-knowledge-base');

  console.log(`\n🚀 Starting upload of ${sheetData.length} items...\n`);

  for (let i = 0; i < sheetData.length; i++) {
    const row = sheetData[i];

    console.log(`\n[${i + 1}/${sheetData.length}] Processing: ${row.title}`);

    // Fetch Google Doc content
    const content = await fetchGoogleDocContent(row.transcript_link);

    if (content) {
      // Upload to Pinecone with full content
      await uploadToPinecone(index, row, content, i + 1);
    }

    // Rate limiting - wait 500ms between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n✅ Upload complete!\n');
}

/**
 * Parse sheet data from JSON file
 *
 * You'll need to export your Google Sheet to JSON first
 * Or we can use Google Sheets API
 */
async function main() {
  // For now, let's create a sample to test
  // You'll replace this with actual Google Sheets API call

  const sampleData: SheetRow[] = [
    {
      title: 'How to Find Winning Products',
      transcript_link: 'https://docs.google.com/document/d/YOUR_DOC_ID/edit',
      source_type: 'doc',
      language: 'english',
      status: 'active',
      category: 'product_research',
      creator: 'Chris',
      video_url: 'https://youtube.com/watch?v=...',
    },
    // Add more rows...
  ];

  await uploadKnowledgeBase(sampleData);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { uploadKnowledgeBase, fetchGoogleDocContent };
