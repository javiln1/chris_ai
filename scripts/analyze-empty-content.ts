import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function analyzeContent() {
  console.log('🔍 Analyzing Pinecone content...\n');

  const index = pc.index('gpc-knowledge-base');

  // Get index stats
  const stats = await index.describeIndexStats();
  const totalVectors = stats.totalRecordCount || 0;

  console.log(`📊 Total vectors in index: ${totalVectors}\n`);

  // Sample a large batch to get statistics
  const sampleSize = 100;
  const queryResponse = await index.query({
    vector: new Array(1536).fill(0), // Dummy vector to get random samples
    topK: sampleSize,
    includeMetadata: true,
  });

  let withContent = 0;
  let withoutContent = 0;
  let totalContentSize = 0;
  const categoryCounts: Record<string, { withContent: number; withoutContent: number }> = {};

  queryResponse.matches?.forEach(match => {
    const content = match.metadata?.content as string || '';
    const category = match.metadata?.category as string || 'Unknown';

    if (!categoryCounts[category]) {
      categoryCounts[category] = { withContent: 0, withoutContent: 0 };
    }

    if (content && content.length > 100) {
      withContent++;
      totalContentSize += content.length;
      categoryCounts[category].withContent++;
    } else {
      withoutContent++;
      categoryCounts[category].withoutContent++;
    }
  });

  console.log('📈 CONTENT ANALYSIS (Sample of 100 vectors):\n');
  console.log(`✅ Entries WITH content (>100 chars): ${withContent} (${Math.round(withContent / sampleSize * 100)}%)`);
  console.log(`❌ Entries WITHOUT content: ${withoutContent} (${Math.round(withoutContent / sampleSize * 100)}%)`);
  console.log(`📦 Average content size: ${Math.round(totalContentSize / withContent)} chars\n`);

  console.log('📂 BREAKDOWN BY CATEGORY:\n');
  Object.entries(categoryCounts)
    .sort((a, b) => (b[1].withContent + b[1].withoutContent) - (a[1].withContent + a[1].withoutContent))
    .forEach(([category, counts]) => {
      const total = counts.withContent + counts.withoutContent;
      const percentage = Math.round(counts.withContent / total * 100);
      console.log(`${category}:`);
      console.log(`  ✅ With content: ${counts.withContent}`);
      console.log(`  ❌ Without content: ${counts.withoutContent}`);
      console.log(`  📊 Success rate: ${percentage}%\n`);
    });

  // Extrapolate to full index
  const estimatedWithContent = Math.round(totalVectors * withContent / sampleSize);
  const estimatedWithoutContent = Math.round(totalVectors * withoutContent / sampleSize);

  console.log('🎯 ESTIMATED FULL INDEX:\n');
  console.log(`✅ Total entries WITH content: ~${estimatedWithContent} / ${totalVectors} (${Math.round(estimatedWithContent / totalVectors * 100)}%)`);
  console.log(`❌ Total entries WITHOUT content: ~${estimatedWithoutContent} / ${totalVectors} (${Math.round(estimatedWithoutContent / totalVectors * 100)}%)`);
}

analyzeContent().catch(console.error);
