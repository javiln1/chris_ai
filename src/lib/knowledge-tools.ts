import { searchKnowledgeBase, searchWithContext, getRelevantCaseStudies, getCreatorContent } from './pinecone';

export const knowledgeBaseTools = {
  searchKnowledgeBase: {
    description: 'Search the comprehensive knowledge base for organic dropshipping information, strategies, and case studies',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant information in the knowledge base'
        },
        category: {
          type: 'string',
          description: 'Optional category to filter results (e.g., "Course Content", "Books", "Coaching Calls", "Youtubers")',
          enum: ['Course Content', 'Books', 'Coaching Calls', 'Youtubers', 'YouTube (Chris)']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5
        }
      },
      required: ['query']
    },
    execute: async (params: { query: string; category?: string; limit?: number }) => {
      try {
        const results = await searchKnowledgeBase(params.query, params.category, params.limit || 5);
        
        if (results.length === 0) {
          return {
            success: false,
            message: 'No relevant information found in the knowledge base',
            results: []
          };
        }

        return {
          success: true,
          message: `Found ${results.length} relevant documents`,
          results: results.map(result => ({
            title: result.title,
            category: result.category,
            creator: result.creator,
            relevance: Math.round(result.score * 100) + '%',
            hasVideo: !!result.video_url,
            videoUrl: result.video_url
          }))
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error searching knowledge base',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  searchCaseStudies: {
    description: 'Search for specific case studies, revenue examples, and success stories in the knowledge base',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant case studies (e.g., "make $50k", "viral strategy", "product success")'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of case studies to return (default: 3)',
          default: 3
        }
      },
      required: ['query']
    },
    execute: async (params: { query: string; limit?: number }) => {
      try {
        const results = await getRelevantCaseStudies(params.query, params.limit || 3);
        
        if (results.length === 0) {
          return {
            success: false,
            message: 'No relevant case studies found in the knowledge base',
            results: []
          };
        }

        return {
          success: true,
          message: `Found ${results.length} relevant case studies`,
          results: results.map(result => ({
            title: result.title,
            category: result.category,
            creator: result.creator,
            relevance: Math.round(result.score * 100) + '%',
            hasVideo: !!result.video_url,
            videoUrl: result.video_url
          }))
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error searching case studies',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  searchCreatorContent: {
    description: 'Search for content from specific creators in the knowledge base',
    parameters: {
      type: 'object',
      properties: {
        creator: {
          type: 'string',
          description: 'The creator name to search for (e.g., "Bsmfredo", "Ethan Hayes", "jordaninaforeign")'
        },
        query: {
          type: 'string',
          description: 'The search query to find relevant content from this creator'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 3)',
          default: 3
        }
      },
      required: ['creator', 'query']
    },
    execute: async (params: { creator: string; query: string; limit?: number }) => {
      try {
        const results = await getCreatorContent(params.creator, params.query, params.limit || 3);
        
        if (results.length === 0) {
          return {
            success: false,
            message: `No relevant content found from ${params.creator}`,
            results: []
          };
        }

        return {
          success: true,
          message: `Found ${results.length} relevant documents from ${params.creator}`,
          results: results.map(result => ({
            title: result.title,
            category: result.category,
            creator: result.creator,
            relevance: Math.round(result.score * 100) + '%',
            hasVideo: !!result.video_url,
            videoUrl: result.video_url
          }))
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error searching creator content',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  getKnowledgeBaseStats: {
    description: 'Get statistics about the knowledge base content',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async () => {
      try {
        // This would require a more complex query to get actual stats
        // For now, return the known stats from our processing
        return {
          success: true,
          message: 'Knowledge base statistics',
          stats: {
            totalDocuments: '196+',
            categories: {
              'Course Content': '69 documents (100% processed)',
              'Books': '1 document (25% processed - 3 too long)',
              'Coaching Calls': '43 documents (95.6% processed)',
              'Youtubers': '84 documents (93.3% processed)',
              'YouTube (Chris)': '19 documents (48.7% processed)'
            },
            creators: [
              'Bsmfredo (21 videos)',
              'Ethan Hayes (25 videos)',
              'jordaninaforeign (19 videos)',
              'Michael Bernstein (5 videos)',
              'Mikey Again (2 videos)',
              'Robert Malagisi (2 videos)'
            ]
          }
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error getting knowledge base stats',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
};
