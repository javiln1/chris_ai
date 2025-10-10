/**
 * Debug Pinecone content storage
 */

import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function debugPinecone() {
  const index = pinecone.index('gpc-knowledge-base');

  console.log('🔍 Debugging Pinecone content storage...\n');

  // Query to get some results
  const results = await index.query({
    vector: new Array(1536).fill(0.1),
    topK: 5,
    includeMetadata: true,
  });

  console.log('📊 Sample entries:\n');

  results.matches.forEach((match, i) => {
    console.log(`\n${i + 1}. ID: ${match.id}`);
    console.log(`   Score: ${match.score}`);
    console.log(`   Metadata keys: ${Object.keys(match.metadata || {}).join(', ')}`);

    const metadata = match.metadata || {};
    console.log(`   Title: ${metadata.title}`);
    console.log(`   Category: ${metadata.category}`);
    console.log(`   Content type: ${typeof metadata.content}`);
    console.log(`   Content length: ${(metadata.content as string)?.length || 0}`);

    if (metadata.content) {
      const content = metadata.content as string;
      console.log(`   First 200 chars: ${content.substring(0, 200)}...`);
    } else {
      console.log(`   ⚠️ NO CONTENT FOUND`);
    }
  });

  // Check stats
  const stats = await index.describeIndexStats();
  console.log(`\n\n📈 Total vectors in index: ${stats.totalRecordCount}`);
}

debugPinecone().catch(console.error);
