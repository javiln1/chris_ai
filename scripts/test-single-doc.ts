/**
 * Test fetching a single Google Doc
 *
 * Use this to verify the fetch logic works before uploading everything
 */

import { fetchGoogleDocContent } from './upload-knowledge-base';

async function testFetch() {
  // Test with one of your Google Docs links
  const testUrl = 'https://docs.google.com/document/d/1HzihW AJzRr_Jr_n7EHluc3cFgLkuxAJjE-hJlK8swEfgcdi/edit?usp=sharing';

  console.log('🧪 Testing Google Doc fetch\n');
  console.log(`URL: ${testUrl}\n`);

  const content = await fetchGoogleDocContent(testUrl);

  console.log('\n📄 Result:');
  console.log(`Length: ${content.length} characters`);
  console.log(`First 500 chars:\n${content.substring(0, 500)}...\n`);

  if (content.length > 0) {
    console.log('✅ SUCCESS! Content was fetched.');
    console.log('\nYou can now run the full upload with: ./scripts/run-upload.sh');
  } else {
    console.log('❌ FAILED - No content fetched');
    console.log('\nPossible issues:');
    console.log('1. Google Doc is not publicly shared');
    console.log('2. Doc ID extraction failed');
    console.log('3. Doc is empty');
    console.log('\nMake sure the doc is shared: Share → Anyone with link can view');
  }
}

testFetch().catch(console.error);
