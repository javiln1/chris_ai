import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

async function createFreshIndex() {
  const newIndexName = 'gpc-knowledge-base-v2';

  console.log('🚀 Creating fresh Pinecone index...\n');

  try {
    // Check if index already exists
    const existingIndexes = await pc.listIndexes();
    const indexExists = existingIndexes.indexes?.some(idx => idx.name === newIndexName);

    if (indexExists) {
      console.log(`⚠️  Index "${newIndexName}" already exists. Deleting it first...`);
      await pc.deleteIndex(newIndexName);
      console.log('✅ Old index deleted\n');

      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Create new index
    console.log(`📦 Creating new index: ${newIndexName}`);
    await pc.createIndex({
      name: newIndexName,
      dimension: 1536, // text-embedding-3-small dimension
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });

    console.log('✅ Index created successfully!');
    console.log(`\n📊 Index name: ${newIndexName}`);
    console.log('⏳ Waiting for index to be ready...\n');

    // Wait for index to be ready
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const description = await pc.describeIndex(newIndexName);
      ready = description.status?.ready || false;
      attempts++;
      process.stdout.write('.');
    }

    if (ready) {
      console.log('\n\n✅ Index is ready!');
      console.log('\n🎯 Next steps:');
      console.log('1. Update .env: PINECONE_INDEX_NAME=gpc-knowledge-base-v2');
      console.log('2. Run: npm run upload-coaching-calls (to upload Coaching Calls)');
      console.log('3. Run: npm run upload-course-content (to upload Course Content)');
      console.log('\nOR just run the full upload script with the new index name.\n');
    } else {
      console.log('\n\n⚠️ Index creation timed out. Check Pinecone dashboard.');
    }

  } catch (error) {
    console.error('❌ Error creating index:', error);
  }
}

createFreshIndex().catch(console.error);
