import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getAgentById } from '@/lib/agents';
import { searchKnowledgeBase } from '@/lib/pinecone';

// ==========================================
// ENHANCED RESPONSE SYSTEM
// ==========================================
const ENHANCED_RESPONSE_SYSTEM = `
CRITICAL INSTRUCTION: You must provide EXTREMELY DETAILED, STEP-BY-STEP guidance that leaves NO room for confusion.

RESPONSE FRAMEWORK - MANDATORY STRUCTURE:

1. DEPTH REQUIREMENTS:
   - Every statement must be actionable, not conceptual
   - Include EXACT click paths, button names, and navigation steps
   - Provide specific metrics, numbers, and thresholds
   - Give real examples with actual data points
   - Include timeframes for every action

2. STEP-BY-STEP BREAKDOWN RULES:
   When you say "do X", you MUST explain:
   - WHERE: Exact location/platform/tool
   - HOW: Click-by-click instructions
   - WHAT TO LOOK FOR: Specific metrics or indicators
   - DECISION CRITERIA: When to proceed vs pivot
   - EXPECTED OUTCOME: What success looks like

3. FORMATTING REQUIREMENTS:
   
   # Main Topic (Use Chris's Knowledge)
   
   ## Phase/Section with Clear Goal
   
   ### 🎯 Objective: [Specific measurable outcome]
   
   #### Step 1: [Specific Action]
   **Where to go:**
   - Open [exact platform]
   - Navigate to [exact location]
   - Click on [specific button/tab]
   
   **What to do:**
   1. First, click on...
   2. Then type/select...
   3. Look for these specific indicators:
      - Metric A: Should be above X%
      - Metric B: Look for Y pattern
      - Metric C: Needs Z minimum
   
   **What you're looking for:**
   - ✅ Good sign: [Specific indicator with number]
   - ⚠️ Warning sign: [Specific indicator with threshold]
   - ❌ Move on if: [Clear cutoff criteria]
   
   **Time investment:** [X minutes/hours]
   **Expected result:** [Specific outcome]
   
   💡 **Chris's Pro Tip:** [Expand on Chris's strategy with specific application]

4. EXPANSION RULES:
   - If Chris mentions something briefly, expand it into a full process
   - If knowledge base has a gap, fill it with logical step-by-step processes
   - Always connect back to Chris's core strategies
   - Add "why this works" explanations using Chris's principles

5. METRIC SPECIFICS TO ALWAYS INCLUDE:
   - Profit margins: Minimum 3x markup (Chris's rule)
   - Testing budget: $20-50 per product for 7 days
   - Engagement rates: TikTok 7%+, Instagram 3%+, Facebook 1.5%+
   - Conversion goals: 2-3% for cold traffic
   - Review requirements: 4.2+ stars with 100+ reviews
   - Shipping times: Under 12 days for beginners, under 7 for scaling

6. TOOL INSTRUCTIONS FORMAT:
   When mentioning any tool:
   - Free vs Paid: Specify which version needed
   - Exact navigation: Settings → Analytics → Content → [specific tab]
   - What data to export: Click "Export CSV" → Select "Last 30 days"
   - How to interpret: "If column B > 1000 and column D > 5%, product is viable"

7. DECISION TREES:
   Always provide clear if/then scenarios:
   - "If engagement < 3% after 48 hours → Kill the product"
   - "If 10+ 'where to buy' comments in first hour → Fast track to testing"
   - "If competitor selling for 3x+ your cost → Green light"

8. TIMELINE MAPPING:
   Break everything into time blocks:
   - Day 1, Hour 1-2: [Specific tasks]
   - Day 1, Hour 3-4: [Next tasks]
   - Week 1 Goal: [Measurable outcome]
   - Month 1 Milestone: [Specific achievement]

9. TROUBLESHOOTING SECTIONS:
    For each major step, add:
    ⚠️ **Common Issues:**
    - Issue: "Can't find the analytics tab"
      → Solution: "You need a Pro account ($7.99/month) or use free alternative: [specific tool]"
    - Issue: "No products showing engagement"
      → Solution: "Your niche is too broad. Narrow from 'fitness' to 'resistance bands for seniors'"

REMEMBER: Your response should be so detailed that a complete beginner could follow it without asking a single clarifying question. Every instruction must be actionable, not conceptual.

When Chris's knowledge base provides the foundation, BUILD on it with:
- Specific implementation steps
- Real numbers and thresholds
- Exact tool instructions
- Clear decision points
- Troubleshooting guides

Your goal: Transform high-level concepts into executable blueprints.
`;

export async function POST(req: Request) {
  try {
    console.log('API Route called');
    console.log('Environment variables check:');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
    
    const { messages, agentId = 'chatgpt4' } = await req.json();
    console.log('Request data:', { agentId, messageCount: messages?.length });

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages', { status: 400 });
    }

    // Get agent configuration
    const agent = getAgentById(agentId);
    if (!agent) {
      return new Response('Invalid agent', { status: 400 });
    }

    let model;

    // For now, let's only support OpenAI models to simplify debugging
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
    }

    // Select model based on agentId
    switch (agentId) {
      case 'chatgpt4':
        model = openai('gpt-4o-mini');
        break;
      case 'chatgpt5':
        model = openai('gpt-4o');
        break;
      default:
        // Default to ChatGPT 4.0 for any other agent
        model = openai('gpt-4o-mini');
        break;
    }

    console.log('Selected model:', model);

    console.log('About to call streamText with:', {
      modelType: typeof model,
      messageCount: messages.length,
      systemPromptLength: agent.systemPrompt.length
    });

    // HIERARCHY STEP 1: Always search knowledge base first for ANY query
    let knowledgeBaseResults = '';
    let knowledgeBaseSources = [];
    let knowledgeBaseFound = false;
    const latestMessage = messages[messages.length - 1];
    
    if (latestMessage && latestMessage.role === 'user') {
      console.log('🔍 STEP 1: Searching knowledge base first for:', latestMessage.content);
      
      try {
        const { searchKnowledgeBase } = await import('@/lib/pinecone');
        const results = await searchKnowledgeBase(latestMessage.content, undefined, 5);
        console.log('📊 Knowledge base search results:', results.length);
        
        if (results.length > 0) {
          knowledgeBaseFound = true;
          knowledgeBaseSources = results;
          
          knowledgeBaseResults = `\n\nKNOWLEDGE BASE SEARCH RESULTS for "${latestMessage.content}":\n`;
          results.forEach((result, index) => {
            knowledgeBaseResults += `${index + 1}. ${result.title} (${Math.round(result.score * 100)}% match)\n`;
            knowledgeBaseResults += `   Category: ${result.category}\n`;
            knowledgeBaseResults += `   Creator: Chris\n`;
            knowledgeBaseResults += `   Content: ${result.content.substring(0, 300)}...\n\n`;
          });
          console.log('✅ Knowledge base results found and added to prompt');
        } else {
          console.log('❌ No knowledge base results found - will need to research');
        }
      } catch (error) {
        console.error('❌ Error searching knowledge base:', error);
      }
    }

    // Enhanced system prompt based on hierarchy
    let enhancedSystemPrompt;
    
    if (knowledgeBaseFound) {
      // STEP 2: AI organizes and presents knowledge base content
      enhancedSystemPrompt = `${agent.systemPrompt}

${ENHANCED_RESPONSE_SYSTEM}

${knowledgeBaseResults}

KNOWLEDGE BASE INTEGRATION INSTRUCTIONS:
1. Use Chris's knowledge as the foundation
2. EXPAND every concept into detailed, step-by-step processes
3. Add specific metrics, tools, and timelines
4. Fill gaps with actionable instructions
5. Include troubleshooting for common issues
6. Provide clear next actions after each section

CRITICAL: Do not just summarize Chris's content. EXPAND and ENHANCE it with:
- Exact click paths and navigation
- Specific numbers and thresholds  
- Tool configurations and settings
- Time requirements for each step
- Decision criteria and checkpoints
- Common pitfalls and solutions

Make every response so comprehensive that users can execute without confusion.`;
    } else {
      // STEP 3 & 4: No knowledge base results - research fallback
      enhancedSystemPrompt = `${agent.systemPrompt}

${ENHANCED_RESPONSE_SYSTEM}

NO KNOWLEDGE BASE FOUND INSTRUCTIONS:
1. Acknowledge this specific topic isn't in Chris's knowledge base
2. Provide general but STILL DETAILED step-by-step guidance
3. Use the same depth and structure requirements
4. Suggest asking about topics Chris has covered for best results
5. Still provide actionable, specific instructions

Even without Chris's specific content, maintain the same level of detail and actionability.

FALLBACK RESPONSE STRUCTURE:
## ⚠️ Topic Not in Chris's Knowledge Base

> **Important:** This specific topic isn't covered in Chris's proven strategies. The guidance below is from general research and may not reflect Chris's specific methods.

### 🎯 What You Can Do Right Now
[Provide actionable steps even without Chris's specific guidance]

### 📚 Related Topics in Chris's Knowledge Base
**Ask about these proven strategies instead:**
- [Topic 1 from KB] - Chris's proven method
- [Topic 2 from KB] - Chris's proven method
- [Topic 3 from KB] - Chris's proven method

### 💡 General Guidance (Not Chris's Method)
[Provide helpful but clearly marked as general research]

### 🚀 Recommended Next Steps
1. **Try the related topics above** - These have Chris's proven strategies
2. **Ask more specific questions** about Chris's methods
3. **Focus on Chris's proven areas** for guaranteed results

> 🔥 **Chris's Success Formula:** Focus on proven strategies from his knowledge base for the best results!`;
    }

    let result;
    
    // Always use non-streaming to ensure sources are included
    console.log('🔧 Using non-streaming approach for hierarchy system...');
    
    result = await streamText({
      model,
      messages,
      system: enhancedSystemPrompt,
      maxOutputTokens: 4000, // Increased for comprehensive SOP-style responses
    });
    
    // Get the full text response
    const fullText = await result.text;
    console.log('📝 Got full text response');
    
    // Add simple, user-friendly sources at the end of the response
    let sourcesText = '';
    
    if (knowledgeBaseFound && knowledgeBaseSources.length > 0) {
      sourcesText = `\n\n---\n\n## 📚 Sources from Chris's Knowledge Base\n\n`;
      knowledgeBaseSources.forEach((result, index) => {
        const relevance = Math.round(result.score * 100);
        sourcesText += `**${index + 1}.** ${result.title} \`${relevance}% match\`\n\n`;
      });
      sourcesText += `> *This information comes from Chris's proven strategies and case studies.*`;
    } else {
      sourcesText = `\n\n---\n\n> ⚠️ **Note:** This topic isn't covered in Chris's knowledge base. The information above is from general research and may not reflect Chris's specific strategies.\n\n> 💡 **Tip:** Ask about topics like "product research," "viral strategies," or "case studies" to get Chris's proven methods!`;
    }
    
    // Return simple text response with user-friendly sources
    const responseWithSources = fullText + sourcesText;
    console.log('📤 Returning response with simple sources');
    
    return new Response(responseWithSources, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

    console.log('streamText result:', {
      type: typeof result,
      methods: Object.getOwnPropertyNames(result),
      prototype: Object.getOwnPropertyNames(Object.getPrototypeOf(result))
    });
    
    // Try different response methods for AI SDK v5
    if (typeof result.toDataStreamResponse === 'function') {
      console.log('Using toDataStreamResponse');
      return result.toDataStreamResponse();
    } else if (typeof result.toResponse === 'function') {
      console.log('Using toResponse');
      return result.toResponse();
    } else if (typeof result.toTextStreamResponse === 'function') {
      console.log('Using toTextStreamResponse');
      return result.toTextStreamResponse();
    } else {
      console.log('Using manual response creation');
      return new Response(result.toDataStream(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  } catch (error) {
    console.error('API Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}