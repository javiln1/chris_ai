import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { searchKnowledgeBase } = await import('@/lib/pinecone');

    // Test search with a simple query
    const testQuery = "product research";
    const results = await searchKnowledgeBase(testQuery, undefined, 5);

    return NextResponse.json({
      status: 'success',
      message: 'Pinecone connection working!',
      testQuery,
      resultsFound: results.length,
      sampleResults: results.slice(0, 3).map(r => ({
        title: r.title,
        category: r.category,
        score: r.score,
        contentLength: r.content.length
      })),
      environment: {
        hasPineconeKey: !!process.env.PINECONE_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        hasPineconeKey: !!process.env.PINECONE_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
