import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function extractCommonQuestions() {
  console.log('🔍 Extracting common questions and topics from Chris\'s content...\n');

  const index = pc.index('gpc-knowledge-base');

  // Get all Coaching Calls and Course Content
  const dummyEmbedding = new Array(1536).fill(0);

  console.log('📞 Fetching ALL Coaching Calls...');
  const coachingResults = await index.query({
    vector: dummyEmbedding,
    topK: 100,
    includeMetadata: true,
    filter: { category: { $eq: 'Coaching Calls' } }
  });

  console.log('📚 Fetching ALL Course Content...');
  const courseResults = await index.query({
    vector: dummyEmbedding,
    topK: 100,
    includeMetadata: true,
    filter: { category: { $eq: 'Course Content' } }
  });

  // Collect all content
  const allContent = [
    ...(coachingResults.matches?.filter(m => m.metadata?.content && (m.metadata.content as string).length > 500).map(m => ({
      title: m.metadata?.title as string,
      content: m.metadata?.content as string,
      category: 'Coaching Calls'
    })) || []),
    ...(courseResults.matches?.filter(m => m.metadata?.content && (m.metadata.content as string).length > 500).map(m => ({
      title: m.metadata?.title as string,
      content: m.metadata?.content as string,
      category: 'Course Content'
    })) || [])
  ];

  console.log(`\n✅ Found ${allContent.length} pieces of content to analyze`);
  console.log(`   - Coaching Calls: ${coachingResults.matches?.length || 0}`);
  console.log(`   - Course Content: ${courseResults.matches?.length || 0}\n`);

  // Prepare content samples for analysis (take snippets from each)
  const contentSamples = allContent.slice(0, 20).map((item, i) => {
    // Take first 2000 chars and last 1000 chars to capture intro and conclusions
    const content = item.content;
    const sample = content.length > 3000
      ? content.substring(0, 2000) + '\n...\n' + content.substring(content.length - 1000)
      : content;

    return `
=== ${item.category}: ${item.title} ===
${sample}
`;
  }).join('\n');

  console.log('🤖 Analyzing content with GPT-4 to extract patterns...\n');

  const analysisPrompt = `You are analyzing Chris's Coaching Calls and Course Content to identify the MOST COMMON questions, topics, and pain points that students repeatedly ask about.

CONTENT TO ANALYZE (20 samples from ${allContent.length} total pieces):
${contentSamples}

Please provide a comprehensive analysis in the following format:

## 1. TOP 10 MOST COMMON QUESTIONS
List the exact questions or variations that appear REPEATEDLY across multiple coaching calls and courses.
For each question, include:
- The question (as students typically ask it)
- How frequently it appears (estimate: Very High, High, Medium)
- Why students struggle with this
- What they're really asking (the underlying concern)

Example format:
**Q1: "How do I find winning products?"**
- Frequency: VERY HIGH
- Why they struggle: Too many options, analysis paralysis, don't know what metrics to look for
- What they're really asking: "Give me a step-by-step system so I don't waste time on losers"

## 2. RECURRING PAIN POINTS & OBSTACLES
What are the TOP 5 issues students keep hitting? Not questions, but PROBLEMS.
Examples: "Products aren't going viral", "Can't find reliable suppliers", "Ad account keeps getting banned"

For each pain point:
- The problem (specific and clear)
- How often it comes up
- Chris's typical solution approach
- Key advice Chris gives repeatedly

## 3. COMMON MISCONCEPTIONS
What wrong beliefs do students have that Chris has to correct REPEATEDLY?
List 5-7 misconceptions and what the truth actually is.

Example:
**Misconception:** "I need a perfect store before I can start"
**Truth (from Chris):** "Start testing products organically with basic setup, store polish comes later"

## 4. TOPIC FREQUENCY ANALYSIS
Rank these topics by how often Chris covers them (1 = most common):
- Product research/finding winners
- Content creation (TikTok/Instagram/Facebook)
- Supplier/fulfillment issues
- Store setup and optimization
- Scaling strategies
- Marketing and audience targeting
- Mindset and motivation
- Technical issues (ads, pixels, etc.)
- Customer service
- Pricing and profit margins

## 5. STUDENT SUCCESS BLOCKERS
What are the TOP 3 things that stop students from succeeding (based on what Chris addresses most)?
Be specific about what's blocking them and what Chris recommends.

## 6. CRITICAL DECISION POINTS
What are the key moments where students need guidance on "what to do next"?
Examples: "When to kill a product", "When to scale", "When to try paid ads"

List 5-7 critical decision points Chris addresses repeatedly.

## 7. TERMINOLOGY CONFUSION
What technical terms or concepts do students consistently misunderstand or need explained?
List 5-10 terms and how Chris explains them simply.

## 8. QUICK WINS CHRIS EMPHASIZES
What are the "easy fixes" or "low-hanging fruit" Chris repeatedly tells students to focus on?
List 5-7 actionable quick wins.

## 9. ADVANCED TOPICS (Less Common but Important)
What topics only come up occasionally but are important for scaling/advanced students?
List 3-5 advanced topics.

## 10. PRIORITY RANKING FOR SYSTEM PROMPTS
Based on frequency and impact, rank the TOP 5 topics that deserve specialized, highly-detailed system prompts:
1. [Topic] - Why this needs special focus
2. [Topic] - Why this needs special focus
...

BE EXTREMELY SPECIFIC. Quote actual questions when possible. Provide concrete examples.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at pattern recognition and educational content analysis. Be thorough and specific with real examples.'
      },
      { role: 'user', content: analysisPrompt }
    ],
    temperature: 0.3,
    max_tokens: 4000
  });

  const analysis = completion.choices[0].message.content;

  console.log('📊 ANALYSIS COMPLETE\n');
  console.log('='.repeat(100));
  console.log(analysis);
  console.log('='.repeat(100));

  // Save analysis to file
  const fs = require('fs');
  const outputPath = './common-questions-analysis.md';

  const fullReport = `# Common Questions & Topics Analysis
Generated: ${new Date().toISOString()}

## Summary
- Analyzed ${allContent.length} pieces of content
- ${coachingResults.matches?.length || 0} Coaching Calls
- ${courseResults.matches?.length || 0} Course Content pieces
- Sample size: 20 pieces (detailed analysis)

---

${analysis}

---

## All Content Titles Analyzed:

### Coaching Calls (${coachingResults.matches?.length || 0} total):
${allContent.filter(c => c.category === 'Coaching Calls').slice(0, 20).map((c, i) => `${i + 1}. ${c.title}`).join('\n')}

### Course Content (${courseResults.matches?.length || 0} total):
${allContent.filter(c => c.category === 'Course Content').slice(0, 20).map((c, i) => `${i + 1}. ${c.title}`).join('\n')}
`;

  fs.writeFileSync(outputPath, fullReport);
  console.log(`\n✅ Full analysis saved to: ${outputPath}\n`);

  // Generate specialized system prompts for top topics
  console.log('🎯 Generating specialized system prompts for top topics...\n');

  const promptGenerationRequest = `Based on this analysis of common questions:

${analysis}

Generate 3-5 SPECIALIZED SYSTEM PROMPTS for the MOST CRITICAL topics that students ask about repeatedly.

For each topic, create a system prompt addition that:
1. Addresses the specific pain points students have
2. Pre-emptively answers common follow-up questions
3. Includes Chris's typical response structure for this topic
4. Provides specific metrics, numbers, and examples Chris uses
5. Anticipates misconceptions and corrects them upfront

Format each as:

## TOPIC: [Topic Name]
**When to use this prompt:** [Trigger keywords/questions that should activate this]

**SPECIALIZED SYSTEM PROMPT:**
[The actual prompt text that should be added to the system]

---

Make these prompts ACTIONABLE and SPECIFIC. Include Chris's exact advice, metrics, and examples for each topic.`;

  const promptCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at creating specialized AI system prompts that address specific user needs and pain points.'
      },
      { role: 'user', content: promptGenerationRequest }
    ],
    temperature: 0.3,
    max_tokens: 3000
  });

  const specializedPrompts = promptCompletion.choices[0].message.content;

  console.log('='.repeat(100));
  console.log('SPECIALIZED SYSTEM PROMPTS:');
  console.log('='.repeat(100));
  console.log(specializedPrompts);
  console.log('='.repeat(100));

  // Save specialized prompts
  const promptsPath = './specialized-topic-prompts.md';
  fs.writeFileSync(promptsPath, `# Specialized Topic System Prompts
Generated: ${new Date().toISOString()}

These prompts should be used when specific topics/questions are detected.

${specializedPrompts}
`);
  console.log(`\n✅ Specialized prompts saved to: ${promptsPath}\n`);

  console.log('🎉 Analysis complete! Check the generated files for detailed insights.\n');
}

extractCommonQuestions().catch(console.error);
