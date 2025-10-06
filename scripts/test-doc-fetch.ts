/**
 * Simple test to fetch a Google Doc
 * No Pinecone/OpenAI needed
 */

// Extract Google Doc ID from URL
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

// Fetch Google Doc content
async function fetchGoogleDoc(docUrl: string): Promise<string> {
  const docId = extractDocId(docUrl);

  if (!docId) {
    console.log('❌ Could not extract doc ID from URL');
    return '';
  }

  console.log(`📄 Extracted Doc ID: ${docId}`);

  try {
    // Try to export as plain text
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    console.log(`🔗 Fetching: ${exportUrl}\n`);

    const response = await fetch(exportUrl);

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response type: ${response.headers.get('content-type')}\n`);

    if (!response.ok) {
      console.log('❌ Failed to fetch doc');
      console.log('This usually means:');
      console.log('  - Doc is not shared publicly');
      console.log('  - Or requires sign-in to access\n');
      console.log('To fix: Open the doc → Share → "Anyone with link can view"');
      return '';
    }

    const content = await response.text();

    console.log(`✅ SUCCESS! Fetched ${content.length} characters\n`);
    console.log('First 500 characters:');
    console.log('─'.repeat(80));
    console.log(content.substring(0, 500));
    console.log('─'.repeat(80));

    return content;
  } catch (error) {
    console.error('❌ Error:', error);
    return '';
  }
}

// Test with one of your doc URLs from the spreadsheet
// Replace this with an actual URL from your sheet
const TEST_DOC_URL = 'https://docs.google.com/document/d/1HzihWAJzRr_Jr_n7EHluc3cFgLkuxAJjE-hJlK8swEfgcdi/edit';

console.log('🧪 Testing Google Doc Fetch\n');
console.log(`URL: ${TEST_DOC_URL}\n`);

fetchGoogleDoc(TEST_DOC_URL).then((content) => {
  if (content.length > 0) {
    console.log('\n✅ TEST PASSED! Docs are accessible!');
    console.log('\nYou can now run the full upload:');
    console.log('  ./scripts/run-upload.sh');
  } else {
    console.log('\n❌ TEST FAILED - Could not fetch content');
    console.log('\nNext steps:');
    console.log('1. Make sure the doc is shared publicly');
    console.log('2. Try opening the doc URL in an incognito window');
    console.log('3. If it asks you to sign in, the doc is not public');
  }
});
