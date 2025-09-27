import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface SearchResult {
  title: string;
  content: string;
  category: string;
  creator?: string;
  video_url?: string;
  score: number;
}

export async function searchKnowledgeBase(
  query: string,
  category?: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // Get the index
    const index = pc.index('gpc-knowledge-base');

    // Create embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Build filter for category if provided
    const filter = category ? { category: { $eq: category } } : undefined;

    // Search the knowledge base
    const searchResponse = await index.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter,
    });

    // Transform results
    const results: SearchResult[] = searchResponse.matches?.map(match => ({
      title: match.metadata?.title as string || 'Unknown',
      content: match.metadata?.content as string || '',
      category: match.metadata?.category as string || 'Unknown',
      creator: match.metadata?.creator as string,
      video_url: match.metadata?.video_url as string,
      score: match.score || 0,
    })) || [];

    return results;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
}

export async function searchWithContext(
  query: string,
  context: string = '',
  category?: string,
  limit: number = 3
): Promise<SearchResult[]> {
  try {
    // Enhance query with context if provided
    const enhancedQuery = context ? `${query} ${context}` : query;
    
    const results = await searchKnowledgeBase(enhancedQuery, category, limit);
    
    // Filter out low-relevance results
    return results.filter(result => result.score > 0.3);
  } catch (error) {
    console.error('Error searching with context:', error);
    return [];
  }
}

export async function getRelevantCaseStudies(
  query: string,
  limit: number = 3
): Promise<SearchResult[]> {
  try {
    // Search for case studies and revenue-related content
    const caseStudyQuery = `${query} case study revenue income money success`;
    
    const results = await searchKnowledgeBase(caseStudyQuery, undefined, limit * 2);
    
    // Filter for case studies and high-revenue content
    const caseStudies = results.filter(result => 
      result.title.toLowerCase().includes('case study') ||
      result.title.toLowerCase().includes('$') ||
      result.title.toLowerCase().includes('revenue') ||
      result.title.toLowerCase().includes('income') ||
      result.score > 0.4
    );
    
    return caseStudies.slice(0, limit);
  } catch (error) {
    console.error('Error getting case studies:', error);
    return [];
  }
}

export async function getCreatorContent(
  creator: string,
  query: string,
  limit: number = 3
): Promise<SearchResult[]> {
  try {
    // Search for content from specific creator
    const creatorQuery = `${query} ${creator}`;
    
    const results = await searchKnowledgeBase(creatorQuery, undefined, limit * 2);
    
    // Filter for content from the specific creator
    const creatorContent = results.filter(result => 
      result.creator?.toLowerCase().includes(creator.toLowerCase()) ||
      result.title.toLowerCase().includes(creator.toLowerCase())
    );
    
    return creatorContent.slice(0, limit);
  } catch (error) {
    console.error('Error getting creator content:', error);
    return [];
  }
}
