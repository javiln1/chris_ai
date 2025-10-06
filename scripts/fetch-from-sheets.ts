/**
 * Fetch data from Google Sheets and upload to Pinecone
 *
 * This reads your actual Google Sheet with all the tabs
 * and processes each one
 */

import { google } from 'googleapis';
import { uploadKnowledgeBase, fetchGoogleDocContent } from './upload-knowledge-base';

interface SheetRow {
  title: string;
  transcript_link: string;
  source_type: string;
  language: string;
  status: string;
  category?: string;
  creator?: string;
  video_url?: string;
}

// Your Google Sheet ID from .env
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

/**
 * Get Google Sheets client (public sheet - no auth needed)
 */
function getSheetsClient() {
  return google.sheets({ version: 'v4' });
}

/**
 * Fetch all data from a specific tab
 */
async function fetchSheetTab(tabName: string): Promise<SheetRow[]> {
  const sheets = getSheetsClient();

  try {
    // For published/public sheets, we can use the web URL
    // Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={TAB_NAME}

    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

    console.log(`📥 Fetching tab: ${tabName}`);
    const response = await fetch(csvUrl);

    if (!response.ok) {
      console.error(`❌ Failed to fetch ${tabName}: ${response.status}`);
      return [];
    }

    const csvText = await response.text();

    // Parse CSV
    const rows = parseCSV(csvText);

    console.log(`✅ Loaded ${rows.length} rows from ${tabName}`);

    return rows.map((row) => ({
      title: row[0] || '',
      transcript_link: row[1] || '',
      source_type: row[2] || 'doc',
      language: row[3] || 'english',
      status: row[4] || 'active',
      category: tabName, // Use tab name as category
      creator: row[5] || (tabName === 'Youtubers' ? row[5] : 'Chris'),
      video_url: row[6] || '',
    }));
  } catch (error) {
    console.error(`❌ Error fetching ${tabName}:`, error);
    return [];
  }
}

/**
 * Simple CSV parser
 */
function parseCSV(csv: string): string[][] {
  const lines = csv.split('\n');
  const result: string[][] = [];

  for (const line of lines) {
    // Simple CSV parsing (handles quoted fields)
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    result.push(row);
  }

  return result.slice(1); // Skip header row
}

/**
 * Main function - fetch all tabs and upload
 */
async function main() {
  // List of tabs from your screenshots
  const tabs = [
    'Course Content',
    'Books',
    'Youtube',
    'Coaching Calls',
    'Looms',
    'Courses',
    'Youtubers',
  ];

  console.log('🚀 Starting Google Sheets → Pinecone upload\n');

  const allData: SheetRow[] = [];

  // Fetch all tabs
  for (const tab of tabs) {
    const tabData = await fetchSheetTab(tab);
    allData.push(...tabData);

    // Wait between tabs to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Total items to upload: ${allData.length}\n`);

  // Filter only active items
  const activeItems = allData.filter((item) => item.status === 'active' && item.transcript_link);

  console.log(`✅ Active items with transcripts: ${activeItems.length}\n`);

  // Upload to Pinecone
  await uploadKnowledgeBase(activeItems);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { fetchSheetTab };
