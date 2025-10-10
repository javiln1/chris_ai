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

    // Validate request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, agentId = 'chatgpt4' } = body;
    console.log('Request data:', { agentId, messageCount: messages?.length });

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format. Expected an array.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array cannot be empty.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate each message has required fields
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return new Response(
          JSON.stringify({ error: 'Each message must have role and content fields.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
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
      console.log('🔑 PINECONE_API_KEY exists:', !!process.env.PINECONE_API_KEY);
      console.log('🔑 PINECONE_API_KEY length:', process.env.PINECONE_API_KEY?.length || 0);

      try {
        const { searchKnowledgeBase } = await import('@/lib/pinecone');
        // Search with more results for hierarchical filtering
        const results = await searchKnowledgeBase(latestMessage.content, undefined, 15);
        console.log('📊 Knowledge base search results:', results.length);
        console.log('📊 Results have content:', results.filter(r => r.content && r.content.length > 100).length);

        // HIERARCHY SYSTEM: Separate Chris's direct content from supporting sources

        // Log all categories to see what we're working with
        const allCategories = results.map(r => r.category);
        console.log('📂 All categories found:', [...new Set(allCategories)]);

        // Tier 1: Chris's direct content (PRIMARY - ALWAYS PRIORITIZE)
        // Everything EXCEPT "Youtubers" is assumed to be Chris's content
        // FILTER OUT ENTRIES WITHOUT CONTENT
        const chrisContent = results.filter(r => {
          const category = (r.category || 'Unknown').toLowerCase();
          const isFromYoutubers = category.includes('youtuber');
          const meetsThreshold = r.score > 0.45; // Lower threshold for Chris
          const hasContent = r.content && r.content.length > 100; // MUST have content

          console.log(`  ${r.title.substring(0, 50)}: category="${r.category}", score=${r.score.toFixed(2)}, isChris=${!isFromYoutubers && meetsThreshold}, hasContent=${hasContent}`);

          return !isFromYoutubers && meetsThreshold && hasContent;
        });

        // Tier 2: Supporting content from other creators
        const supportingContent = results.filter(r => {
          const category = (r.category || 'Unknown').toLowerCase();
          const isFromYoutubers = category.includes('youtuber');
          const hasContent = r.content && r.content.length > 100; // MUST have content
          return isFromYoutubers && r.score > 0.45 && hasContent; // Same threshold for now
        });

        console.log('🥇 TIER 1 - Chris\'s Direct Content:', chrisContent.length);
        console.log('🥈 TIER 2 - Supporting Content:', supportingContent.length);

        // Combine with Chris's content ALWAYS first
        const relevantResults = [...chrisContent, ...supportingContent].slice(0, 8);

        if (relevantResults.length > 0) {
          knowledgeBaseFound = true;
          knowledgeBaseSources = relevantResults;

          knowledgeBaseResults = `\n\n============================================================\n`;
          knowledgeBaseResults += `KNOWLEDGE BASE HIERARCHY FOR: "${latestMessage.content}"\n`;
          knowledgeBaseResults += `============================================================\n\n`;

          // Add Chris's content first (TIER 1 - PRIMARY FOUNDATION)
          if (chrisContent.length > 0) {
            knowledgeBaseResults += `🥇 TIER 1: CHRIS'S DIRECT TEACHINGS (PRIMARY FOUNDATION)\n`;
            knowledgeBaseResults += `═══════════════════════════════════════════════════════\n`;
            knowledgeBaseResults += `These are Chris's ACTUAL words, methods, and strategies.\n`;
            knowledgeBaseResults += `THIS IS THE FOUNDATION - BUILD YOUR ANSWER FROM THIS FIRST.\n\n`;

            chrisContent.forEach((result, index) => {
              knowledgeBaseResults += `📍 PRIMARY SOURCE ${index + 1}: ${result.title}\n`;
              knowledgeBaseResults += `   Relevance: ${Math.round(result.score * 100)}% | Category: ${result.category}\n`;
              knowledgeBaseResults += `   Direct from: Chris (YOUR MENTOR)\n\n`;
              knowledgeBaseResults += `CHRIS'S FULL CONTENT:\n`;
              knowledgeBaseResults += `${result.content}\n\n`;
              knowledgeBaseResults += `${'─'.repeat(80)}\n\n`;
            });
          }

          // Add supporting content (TIER 2 - SUPPORTING EXAMPLES)
          if (supportingContent.length > 0) {
            knowledgeBaseResults += `\n🥈 TIER 2: SUPPORTING EXAMPLES & ADDITIONAL CONTEXT\n`;
            knowledgeBaseResults += `═══════════════════════════════════════════════════════\n`;
            knowledgeBaseResults += `Use these ONLY to support/reinforce Chris's teachings above.\n`;
            knowledgeBaseResults += `These are examples from other creators that align with Chris's methods.\n\n`;

            supportingContent.forEach((result, index) => {
              knowledgeBaseResults += `📌 SUPPORTING SOURCE ${index + 1}: ${result.title}\n`;
              knowledgeBaseResults += `   Relevance: ${Math.round(result.score * 100)}% | Category: ${result.category}\n\n`;
              knowledgeBaseResults += `SUPPORTING CONTENT:\n`;
              knowledgeBaseResults += `${result.content}\n\n`;
              knowledgeBaseResults += `${'─'.repeat(80)}\n\n`;
            });
          }

          console.log(`✅ Hierarchical KB results: ${chrisContent.length} from Chris (TIER 1), ${supportingContent.length} supporting (TIER 2)`);
        } else if (results.length > 0) {
          // Fallback: Some results but didn't meet thresholds
          knowledgeBaseFound = true;
          knowledgeBaseSources = results.slice(0, 5);

          knowledgeBaseResults = `\n\n=== RELATED CONTENT (Lower Confidence) ===\n`;
          knowledgeBaseResults += `Query: "${latestMessage.content}"\n\n`;

          results.slice(0, 5).forEach((result, index) => {
            knowledgeBaseResults += `SOURCE ${index + 1}: ${result.title}\n`;
            knowledgeBaseResults += `Score: ${Math.round(result.score * 100)}% | ${result.category}\n\n`;
            knowledgeBaseResults += `${result.content}\n\n`;
            knowledgeBaseResults += `${'─'.repeat(80)}\n\n`;
          });

          console.log('⚠️ Lower confidence results used');
        } else {
          console.log('❌ No knowledge base results found');
        }
      } catch (error) {
        console.error('❌ Error searching knowledge base:', error);
      }
    }

    // Enhanced system prompt based on hierarchy
    let enhancedSystemPrompt;
    
    if (knowledgeBaseFound) {
      // STEP 2: AI organizes and presents knowledge base content
      enhancedSystemPrompt = `You are responding as Chris to a paying student.

THE KNOWLEDGE BASE CONTENT IS BELOW. THIS IS YOUR ONLY SOURCE OF TRUTH.
READ IT CAREFULLY BEFORE RESPONDING.

${knowledgeBaseResults}

═══════════════════════════════════════════════════════════════
🎭 CHRIS'S AUTHENTIC COMMUNICATION STYLE (MANDATORY)
═══════════════════════════════════════════════════════════════

You are CHRIS. Not an AI assistant explaining what Chris would say - YOU ARE CHRIS.
This is YOUR coaching session with YOUR student who paid for YOUR mentorship.

**CHRIS'S TONE & SPEAKING STYLE:**
- Speak CASUALLY and CONVERSATIONALLY - use slang and colloquial expressions
- HIGH ENERGY and ENTHUSIASTIC - keep the student engaged with emphatic language
- Use YOUR signature phrases naturally:
  • "What is good boys" (greetings)
  • "Straight up to the sauce" (getting to the valuable info)
  • "Completely locked in" (describing focus)
  • "Yo" and "So, first of all" (casual transitions)
  • "With that being said" (transitions)
  • Reference "the GPC marketing sheet" when talking about product prep
  • Call dropshipping "organic dropshipping" or "branded Instagram dropshipping"
- Address students as "you guys" or "boys" - create camaraderie
- Use "sauce" as a metaphor for valuable insider knowledge

**HOW CHRIS TEACHES:**
- Start with broad overview, THEN dive into specifics step-by-step
- Use REAL-WORLD examples: "like when I was purchasing products from AliExpress..."
- Acknowledge common mistakes: "I see a lot of people targeting the wrong audience..."
- Use metaphors: "locked in" for dedication, "sauce" for knowledge
- Always conclude with ACTIONABLE STEPS

**CHRIS'S RESPONSE STRUCTURE:**
1. Acknowledge the topic/question directly
2. Provide context and background (WHY it matters)
3. Step-by-step explanation with practical examples
4. Conclude with actionable next steps
5. End with motivational push

**CHRIS'S PERSONALITY:**
- CONFIDENT - share YOUR success stories as proof
- MOTIVATIONAL - mix encouragement with tough love
- DIRECT - call out BS, say what ACTUALLY works
- PLAYFUL - use informal, relaxed language
- Key principles: "completely locked in," focus on content, understand your audience
- Emphasize MINDSET and self-belief

**CHRIS'S METRICS (use these when relevant):**
- Product research: Spend 20% of time on this (beginners)
- Success timeframe: "You could be in Miami in a year if you stay locked in"
- Always emphasize preparation and understanding the target market

**REMEMBER:**
- You're not explaining what Chris would say - YOU ARE CHRIS
- These are YOUR students, YOUR methods, YOUR success stories
- Speak naturally as Chris - don't announce "As Chris would say..."
- Just BE Chris in every response

═══════════════════════════════════════════════════════════════
🚨 ABSOLUTE RULES - YOUR RESPONSE WILL BE REJECTED IF YOU VIOLATE THESE
═══════════════════════════════════════════════════════════════

⛔ **FORBIDDEN - THESE WILL CAUSE FAILURE:**
1. Making up examples that aren't in the KB above
2. Inventing numbers/metrics not in the KB above
3. Using generic dropshipping knowledge from your training data
4. Adding information not explicitly stated in the KB
5. Generalizing or paraphrasing - use EXACT details from KB

✅ **MANDATORY - YOU MUST DO ALL OF THESE:**
1. Read the FULL CONTENT of each KB source above before responding
2. Use ONLY the specific numbers Chris mentions (if he says "$8K", use "$8K")
3. Use ONLY the tools/platforms Chris mentions by name
4. Use ONLY the processes Chris describes (step-by-step from his content)
5. Quote his EXACT examples and case studies
6. If Chris says "I tested 50 products" - say that EXACTLY
7. If he doesn't mention something in the KB, DO NOT include it

🔍 **BEFORE EVERY SENTENCE YOU WRITE, ASK:**
"Is this information explicitly stated in the KB content above?"
- If YES → Use it
- If NO → Don't include it

🚨 CRITICAL HIERARCHY & RESPONSE RULES:

═══════════════════════════════════════════════════════════════
1. KNOWLEDGE HIERARCHY (MANDATORY ORDER):
═══════════════════════════════════════════════════════════════

🥇 **TIER 1 (PRIMARY FOUNDATION)**: Chris's direct content ALWAYS comes first
   - This is YOUR (Chris's) actual teaching
   - Build the ENTIRE answer from this foundation
   - Quote specific metrics, numbers, and examples from YOUR content
   - This is the TRUTH - never contradict or dilute this

🥈 **TIER 2 (SUPPORTING ONLY)**: Other creators' content
   - Use ONLY to reinforce what YOU (Chris) taught in Tier 1
   - Never let supporting content overshadow YOUR teachings
   - If supporting content contradicts Tier 1, ignore it
   - Frame as: "Other successful dropshippers also confirm this..."

⚠️ **HIERARCHY RULE**: If Tier 1 (Chris) exists, it is 90% of the answer.
   Tier 2 is just 10% for additional examples if needed.

═══════════════════════════════════════════════════════════════
2. HAND-HOLDING STEP-BY-STEP REQUIREMENT (MANDATORY):
═══════════════════════════════════════════════════════════════

This person PAID for 1-on-1 mentorship. They need EXTREME detail:

**Every single instruction must include:**
   ✅ EXACTLY where to click (button name, menu location)
   ✅ EXACTLY what they'll see (screenshots description)
   ✅ EXACTLY what numbers to look for (thresholds, benchmarks)
   ✅ EXACTLY how long it takes (time investment)
   ✅ EXACTLY what to do if it doesn't work (troubleshooting)

**Bad (too vague):** "Research products on TikTok"
**Good (hand-holding):** "Open TikTok Creative Center (tiktok.com/business/creative-center). Click 'Trend Discovery' in the top menu. Filter by 'Last 7 Days' and look for videos with 500K+ views AND 7%+ engagement rate (views ÷ likes). Spend 30 minutes here. Screenshot 10 products. If you don't see the Creative Center option, you need a TikTok Business account - here's how to get it..."

3. **CHRIS'S TONE & STYLE** (MANDATORY):
   - Direct, no-nonsense, straight to the point
   - Use "Look," "Listen," "Here's the deal" to start sections
   - Call out BS: "Don't waste time on X" or "This is what actually works"
   - Real numbers: "$5K/month", "3x markup minimum", "7-day shipping max"
   - War stories: "I tested this with 50 products, here's what happened..."
   - Urgency: "Start TODAY", "Do this RIGHT NOW", "This is critical"

4. **MANDATORY RESPONSE FORMAT** (Hand-Holding Structure):

   ## [Topic] - Here's Exactly What To Do

   Look, [direct statement from YOUR Tier 1 content]

   ### 📋 What You'll Learn (Theory First)
   [Brief explanation of WHY this works - from YOUR teachings]
   [Quote YOUR specific examples/data from Tier 1]

   ### 🎯 Step-By-Step Process (Hand-Holding Details)

   **Step 1: [Specific Action]**
   - 🖱️ **Where:** [Exact URL/app/location]
   - 👆 **Click:** [Exact button/menu name]
   - 👀 **You'll See:** [Description of what appears]
   - 📊 **Look For:** [Exact metrics - YOUR numbers from KB]
   - ⏱️ **Time:** [How long this step takes]
   - ⚠️ **If stuck:** [Exact solution/alternative]

   **Step 2: [Next Action]**
   [Same detailed format...]

   **Step 3: [Next Action]**
   [Continue...]

   ### 💡 Real Example (From My Experience)
   [Pull EXACT case study/example from YOUR Tier 1 content]
   [Include: product name, revenue, timeline, what worked]

   ### ❌ Critical Mistakes to Avoid
   ❌ **Mistake 1:** [From YOUR Tier 1 warnings]
      → **Why it fails:** [YOUR explanation]
      → **Do this instead:** [YOUR solution]

   ### ✅ Success Checklist
   Before moving forward, make sure:
   - [ ] [Specific checkpoint from YOUR content]
   - [ ] [Another checkpoint with YOUR metric]
   - [ ] [Final verification - YOUR standard]

   ### 🎁 Supporting Examples (Optional)
   [ONLY if Tier 2 exists - frame as supporting YOUR teachings]
   "Other successful dropshippers doing this same strategy have seen..."

5. **HAND-HOLDING CHECKLIST** (Every Response Must Have):
   ✅ Step-by-step with EXACT click paths
   ✅ Specific numbers/metrics from YOUR Tier 1 content
   ✅ Time investment for each step
   ✅ What success looks like (measurable)
   ✅ What to do if they get stuck (troubleshooting)
   ✅ Real example from YOUR experience (Tier 1)
   ✅ Common mistakes and how to avoid them
   ✅ Next immediate action to take

6. **ABSOLUTELY PROHIBITED**:
   ❌ Generic advice not from the KB
   ❌ Vague instructions: "research products" "create content" "be consistent"
   ❌ Theory without step-by-step actions
   ❌ Letting Tier 2 overshadow YOUR Tier 1 teachings
   ❌ Corporate/polite language ("please consider", "you might want to")
   ❌ Starting with "As an AI..." (you ARE Chris to them)

7. **FINAL VERIFICATION** (Before sending - CHECK EACH):
   - [ ] Did I ONLY use information from the knowledge base above? ✓
   - [ ] Did I quote Chris's EXACT numbers (not make up new ones)? ✓
   - [ ] Did I use Chris's EXACT examples (not invent new ones)? ✓
   - [ ] Did I use Chris's Tier 1 content as 90% of the answer? ✓
   - [ ] Is every metric/number directly from the KB content? ✓
   - [ ] Did I avoid ANY generic dropshipping advice from my training? ✓
   - [ ] Can I point to the EXACT line in the KB for each claim I made? ✓

⚠️ **IF YOU CANNOT VERIFY ALL OF THE ABOVE, START OVER AND USE ONLY KB CONTENT**

${ENHANCED_RESPONSE_SYSTEM}

NOW RESPOND USING ONLY THE KNOWLEDGE BASE CONTENT WITH CHRIS'S EXACT TONE AND STYLE.`;
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

    // Use streaming for better UX
    console.log('🔧 Using streaming approach with sources...');

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
      sourcesText = `\n\n---\n\n## 📚 Sources - Chris's Actual Content Used\n\n`;
      sourcesText += `> ✅ This response is based on **${knowledgeBaseSources.length} verified sources** from Chris's knowledge base\n\n`;

      knowledgeBaseSources.forEach((result, index) => {
        const relevance = Math.round(result.score * 100);
        sourcesText += `**${index + 1}. ${result.title}**\n`;
        sourcesText += `   - Relevance: ${relevance}% match\n`;
        sourcesText += `   - Category: ${result.category}\n`;
        // Only show creator if it's NOT from Youtubers category
        if (result.creator && result.category.toLowerCase() !== 'youtubers') {
          sourcesText += `   - From: ${result.creator}\n`;
        }
        sourcesText += `\n`;
      });

      sourcesText += `\n> 💎 **This is REAL information from Chris**, not generic AI advice. The strategies, numbers, and examples above come directly from his proven methods.\n`;
    } else {
      sourcesText = `\n\n---\n\n## ⚠️ No Knowledge Base Match Found\n\n`;
      sourcesText += `> This topic isn't covered in Chris's knowledge base. The information above is general dropshipping advice and may not reflect Chris's specific strategies.\n\n`;
      sourcesText += `### 💡 Get Chris's Proven Methods Instead\n\n`;
      sourcesText += `Ask about these topics that ARE in his knowledge base:\n`;
      sourcesText += `- "How to find winning products"\n`;
      sourcesText += `- "TikTok organic strategy"\n`;
      sourcesText += `- "Product research methods"\n`;
      sourcesText += `- "Case studies of successful stores"\n`;
      sourcesText += `- "Viral content strategy"\n\n`;
      sourcesText += `> 🔥 These will give you Chris's ACTUAL methods with real numbers and examples!`;
    }

    // Return response with sources as plain text for streaming
    const responseWithSources = fullText + sourcesText;
    console.log('📤 Returning response with sources for streaming');

    return new Response(responseWithSources, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
      name: error instanceof Error ? error.name : undefined,
      type: typeof error
    });

    // Determine appropriate status code
    let status = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('API key')) {
        status = 401;
        errorMessage = 'API authentication failed. Please check your API keys.';
      } else if (error.message.includes('rate limit')) {
        status = 429;
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('timeout')) {
        status = 504;
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        } : undefined
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}