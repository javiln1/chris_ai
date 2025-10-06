import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let pc: Pinecone | null = null;
let openai: OpenAI | null = null;

// Simple in-memory cache with TTL
interface CacheEntry {
  data: SearchResult[];
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string, category?: string, limit?: number): string {
  return `${query}:${category || 'all'}:${limit || 5}`;
}

function getFromCache(key: string): SearchResult[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;

  // Check if cache entry is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key: string, data: SearchResult[]): void {
  searchCache.set(key, {
    data,
    timestamp: Date.now()
  });

  // Clean up old entries periodically
  if (searchCache.size > 100) {
    const now = Date.now();
    for (const [key, entry] of searchCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        searchCache.delete(key);
      }
    }
  }
}

// Enhance query to improve semantic search results
function enhanceQueryForSearch(query: string): string {
  const lowerQuery = query.toLowerCase();

  // Add dropshipping context if not present
  const dropshippingTerms = ['dropshipping', 'ecommerce', 'shopify', 'product', 'store'];
  const hasDropshippingContext = dropshippingTerms.some(term => lowerQuery.includes(term));

  // Common query patterns and their enhancements
  const enhancements: Record<string, string> = {
    'how to find': 'product research strategy method finding',
    'how do i': 'strategy method process steps',
    'what is': 'explanation definition strategy',
    'best way': 'optimal strategy proven method',
    'should i': 'recommendation advice strategy decision',
    'can i': 'method approach strategy',
    'viral': 'viral content organic tiktok instagram facebook engagement',
    'product': 'product research winning products criteria',
    'marketing': 'marketing strategy organic content viral',
    'ads': 'advertising paid ads facebook tiktok instagram',
    'profit': 'revenue profit margin pricing markup',
    'supplier': 'supplier aliexpress cjdropshipping shipping',
    'shipping': 'shipping delivery times fulfillment',
    'case study': 'case study example revenue results success',
  };

  // Build enhanced query
  let enhanced = query;

  // Add contextual keywords
  for (const [pattern, enhancement] of Object.entries(enhancements)) {
    if (lowerQuery.includes(pattern)) {
      enhanced += ` ${enhancement}`;
      break; // Only add one enhancement
    }
  }

  // Add organic dropshipping context if missing
  if (!hasDropshippingContext) {
    enhanced += ' organic dropshipping ecommerce';
  }

  return enhanced;
}

function getPineconeClient() {
  if (!pc) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('Pinecone API key missing. Please set PINECONE_API_KEY environment variable.');
    }
    pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pc;
}

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key missing. Please set OPENAI_API_KEY environment variable.');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

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
    // Check cache first
    const cacheKey = getCacheKey(query, category, limit);
    const cachedResults = getFromCache(cacheKey);
    if (cachedResults) {
      console.log('📦 Cache hit for query:', query);
      return cachedResults;
    }

    console.log('🔍 Cache miss, searching knowledge base...');

    // Get the clients
    const pcClient = getPineconeClient();
    const openaiClient = getOpenAIClient();

    // Get the index
    const index = pcClient.index('gpc-knowledge-base');

    // Enhance query for better semantic search
    const enhancedQuery = enhanceQueryForSearch(query);
    console.log('🔧 Enhanced query:', enhancedQuery);

    // Create embedding for the enhanced query
    const embeddingResponse = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: enhancedQuery,
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
    const results: SearchResult[] = searchResponse.matches?.map(match => {
      const content = match.metadata?.content as string || '';
      const title = match.metadata?.title as string || 'Unknown';

      // DEBUG: Log content length to see if we're getting full transcripts
      console.log(`📄 "${title.substring(0, 50)}...": ${content.length} chars (${Math.round(content.length / 1000)}KB)`);

      return {
        title,
        content,
        category: match.metadata?.category as string || 'Unknown',
        creator: match.metadata?.creator as string,
        video_url: match.metadata?.video_url as string,
        score: match.score || 0,
      };
    }) || [];

    // Cache the results
    setCache(cacheKey, results);

    console.log(`✅ Total content retrieved: ${results.reduce((sum, r) => sum + r.content.length, 0)} chars`);

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
