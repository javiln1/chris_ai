/**
 * Check Pinecone upload status
 */

import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function checkPinecone() {
  const index = pinecone.index('gpc-knowledge-base');

  // Get index stats
  console.log('📊 Checking Pinecone Index Stats...\n');
  const stats = await index.describeIndexStats();

  console.log('✅ Total vectors uploaded:', stats.totalRecordCount);
  console.log('📐 Vector dimensions:', stats.dimension);
  console.log('');

  // Query to check content
  console.log('📄 Checking sample entries for content...\n');
  const results = await index.query({
    vector: new Array(1536).fill(0.1),
    topK: 10,
    includeMetadata: true,
  });

  let hasContent = 0;
  let noContent = 0;

  results.matches.forEach((match, i) => {
    const title = match.metadata?.title || 'No title';
    const content = match.metadata?.content || '';
    const category = match.metadata?.category || 'Unknown';

    if (content.length > 100) {
      hasContent++;
    } else {
      noContent++;
    }

    console.log(`${i + 1}. "${title}"`);
    console.log(`   Category: ${category}`);
    console.log(`   Content: ${content.length} chars (${Math.round(content.length / 1000)}KB)`);
    console.log('');
  });

  console.log('📈 Summary:');
  console.log(`   ✅ Entries with full content: ${hasContent}`);
  console.log(`   ❌ Entries with no/little content: ${noContent}`);
  console.log('');

  if (hasContent >= 8) {
    console.log('🎉 SUCCESS! Knowledge base is properly populated with full transcripts!');
  } else {
    console.log('⚠️ WARNING: Some entries may be missing content');
  }
}

checkPinecone().catch(console.error);
