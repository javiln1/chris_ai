/**
 * Count entries with vs without content
 */

import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function countContent() {
  const index = pinecone.index('gpc-knowledge-base');

  console.log('🔍 Sampling entries to check content...\n');

  // Sample multiple queries to get more entries
  let withContent = 0;
  let withoutContent = 0;
  const seenIds = new Set();

  for (let i = 0; i < 10; i++) {
    const randomVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);

    const results = await index.query({
      vector: randomVector,
      topK: 50,
      includeMetadata: true,
    });

    results.matches.forEach((match) => {
      if (seenIds.has(match.id)) return;
      seenIds.add(match.id);

      const metadata = match.metadata || {};
      const hasContent = metadata.content && (metadata.content as string).length > 100;

      if (hasContent) {
        withContent++;
      } else {
        withoutContent++;
      }
    });
  }

  console.log(`\n📊 Results from ${seenIds.size} unique entries:`);
  console.log(`   ✅ With content (>100 chars): ${withContent}`);
  console.log(`   ❌ Without content: ${withoutContent}`);
  console.log(`\n📈 Total vectors in index: ${(await index.describeIndexStats()).totalRecordCount}`);
}

countContent().catch(console.error);
