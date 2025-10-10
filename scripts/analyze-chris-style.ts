import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function analyzeChrisStyle() {
  console.log('🔍 Analyzing Chris\'s coaching style and patterns...\n');

  const index = pc.index('gpc-knowledge-base');

  // Create embedding for coaching-related queries
  const coachingQuery = "coaching advice tips strategy methods";
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: coachingQuery,
  });

  // Get Coaching Calls content
  console.log('📞 Fetching Coaching Calls...');
  const coachingResults = await index.query({
    vector: embeddingResponse.data[0].embedding,
    topK: 50,
    includeMetadata: true,
    filter: { category: { $eq: 'Coaching Calls' } }
  });

  // Get Course Content
  console.log('📚 Fetching Course Content...');
  const courseResults = await index.query({
    vector: embeddingResponse.data[0].embedding,
    topK: 50,
    includeMetadata: true,
    filter: { category: { $eq: 'Course Content' } }
  });

  // Collect all content
  const coachingContent = coachingResults.matches
    ?.filter(m => m.metadata?.content && (m.metadata.content as string).length > 500)
    .map(m => ({
      title: m.metadata?.title as string,
      content: m.metadata?.content as string,
      category: 'Coaching Calls'
    })) || [];

  const courseContent = courseResults.matches
    ?.filter(m => m.metadata?.content && (m.metadata.content as string).length > 500)
    .map(m => ({
      title: m.metadata?.title as string,
      content: m.metadata?.content as string,
      category: 'Course Content'
    })) || [];

  console.log(`\n✅ Found ${coachingContent.length} Coaching Calls with content`);
  console.log(`✅ Found ${courseContent.length} Course Content with content\n`);

  // Combine samples for analysis (first 3 of each)
  const sampleContent = [
    ...coachingContent.slice(0, 3),
    ...courseContent.slice(0, 3)
  ];

  console.log('🤖 Analyzing Chris\'s communication patterns with GPT-4...\n');

  const analysisPrompt = `You are analyzing Chris's coaching and teaching style from his actual content.

CONTENT TO ANALYZE:
${sampleContent.map((item, i) => `
=== ${item.category}: ${item.title} ===
${item.content.substring(0, 3000)}
...
`).join('\n')}

Please provide a COMPREHENSIVE analysis in the following format:

## 1. TONE & COMMUNICATION STYLE
- How does Chris speak? (casual, formal, direct, etc.)
- What's his energy level?
- Does he use specific phrases or expressions repeatedly?
- How does he address students/viewers?

## 2. TEACHING METHODOLOGY
- How does Chris structure his explanations?
- Does he use examples? What kind?
- How does he handle mistakes or common errors?
- Does he use analogies or metaphors?

## 3. COMMON PHRASES & PATTERNS
List 15-20 exact phrases Chris uses repeatedly, categorized:
- Greeting/Opening phrases
- Transition phrases
- Emphasis phrases
- Closing/Action phrases

## 4. TECHNICAL VOCABULARY
- What dropshipping-specific terms does Chris use?
- How does he explain complex concepts?
- Does he use acronyms? Which ones?

## 5. RESPONSE STRUCTURE
When answering questions, what pattern does Chris follow?
- Does he acknowledge the question first?
- Does he provide context before solutions?
- How does he conclude his answers?

## 6. MOTIVATIONAL STYLE
- How does Chris motivate students?
- Does he use tough love or encouragement?
- What are his key success principles?

## 7. SPECIFIC NUMBERS & METRICS
List specific numbers, percentages, timeframes Chris mentions frequently:
- Product research metrics
- Profit margins
- Testing budgets
- Timeframes for results

## 8. CASE STUDY PATTERNS
- How does Chris present success stories?
- What details does he include?
- How does he break down revenue/results?

## 9. PROBLEM-SOLVING APPROACH
When a student has an issue, how does Chris diagnose and solve it?
- Step-by-step breakdown
- Questions he asks
- Solutions he provides

## 10. PERSONALITY TRAITS
- Is Chris humble or confident?
- Does he share personal failures?
- How does he handle disagreement?
- What's his humor style?

BE EXTREMELY SPECIFIC. Quote exact phrases. Include actual examples from the content.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert at analyzing communication patterns and teaching styles. Be thorough and specific.' },
      { role: 'user', content: analysisPrompt }
    ],
    temperature: 0.3,
    max_tokens: 4000
  });

  const analysis = completion.choices[0].message.content;

  console.log('📊 ANALYSIS COMPLETE\n');
  console.log('='.repeat(80));
  console.log(analysis);
  console.log('='.repeat(80));

  // Save analysis to file
  const fs = require('fs');
  const outputPath = './chris-style-analysis.md';

  const fullReport = `# Chris's Coaching & Teaching Style Analysis
Generated: ${new Date().toISOString()}

## Summary
- Analyzed ${coachingContent.length} Coaching Calls
- Analyzed ${courseContent.length} Course Content pieces
- Sample analyzed: ${sampleContent.length} pieces

---

${analysis}

---

## Content Sample Titles Analyzed:

### Coaching Calls:
${coachingContent.slice(0, 10).map((c, i) => `${i + 1}. ${c.title}`).join('\n')}

### Course Content:
${courseContent.slice(0, 10).map((c, i) => `${i + 1}. ${c.title}`).join('\n')}
`;

  fs.writeFileSync(outputPath, fullReport);
  console.log(`\n✅ Full analysis saved to: ${outputPath}`);

  // Generate system prompt
  console.log('\n🎯 Generating optimized system prompt...\n');

  const promptGenerationRequest = `Based on this analysis of Chris's style:

${analysis}

Generate a SYSTEM PROMPT that will make an AI respond EXACTLY like Chris. The prompt should:

1. Capture his exact tone and speaking style
2. Include his common phrases and expressions
3. Enforce his teaching methodology
4. Include his specific metrics and numbers
5. Match his personality and energy
6. Follow his response structure

Format it as a complete system prompt ready to use in an AI chat application. Make it detailed and specific.`;

  const promptCompletion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert at creating AI system prompts that capture someone\'s unique communication style.' },
      { role: 'user', content: promptGenerationRequest }
    ],
    temperature: 0.3,
    max_tokens: 3000
  });

  const systemPrompt = promptCompletion.choices[0].message.content;

  console.log('='.repeat(80));
  console.log('GENERATED SYSTEM PROMPT:');
  console.log('='.repeat(80));
  console.log(systemPrompt);
  console.log('='.repeat(80));

  // Save system prompt
  const promptPath = './chris-system-prompt.txt';
  fs.writeFileSync(promptPath, systemPrompt);
  console.log(`\n✅ System prompt saved to: ${promptPath}`);
}

analyzeChrisStyle().catch(console.error);
