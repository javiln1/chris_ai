# Tier 3 Content Integration Plan

## Current Status (v2 Index)

**What's Uploaded Now:**
- ✅ Tier 1: 43 Coaching Calls (Chris's 1-on-1 coaching)
- ✅ Tier 1: ~207 Course Content (Chris's courses & training)
- ✅ **Total: ~250 entries with 100% content coverage**

**What's NOT Uploaded Yet:**
- ❌ YouTubers category (~40+ entries)
- ❌ Case studies from other creators
- ❌ Books/external resources
- ❌ Advanced tactics from community

## Why Tier 3 Content is Valuable

Even though it's "tier 3", this content can still provide value:
- **Real-world examples** from other successful dropshippers
- **Different perspectives** on the same strategies Chris teaches
- **Niche-specific case studies** that might not be in Chris's content
- **Supporting evidence** for Chris's methods
- **Alternative explanations** that might click better for some students

## The Problem We Need to Solve

**Issue:** Can't just dump tier 3 content into the KB because:
1. It dilutes Chris's voice (the AI starts sounding generic)
2. It can contradict Chris's methods
3. Users came for Chris's teaching, not random YouTubers
4. Quality varies widely

## The Solution: Smart Tier Detection

### Phase 1: Content Tagging (When Uploading)
When uploading tier 3 content, tag it clearly:

```typescript
metadata: {
  title: "...",
  content: "...",
  category: "Youtubers",
  tier: 3,  // ← Explicit tier level
  creator: "Other YouTuber Name",
  reliability_score: 0.7,  // How much we trust this source
  topics: ["product_research", "tiktok_organic"],  // What it covers
}
```

### Phase 2: Query Analysis (When Searching)
Before searching, analyze the user's question:

```typescript
// Determine if we NEED tier 3 content
function shouldUseTier3(query: string, tier1Results: Result[]): boolean {
  // Only use tier 3 if:
  // 1. Tier 1 results are insufficient (<2 results with content)
  // 2. User explicitly asks for "examples" or "case studies"
  // 3. Query is about a niche topic not in tier 1

  if (tier1Results.length >= 3) return false;  // Tier 1 is enough
  if (query.includes("example") || query.includes("case study")) return true;

  return tier1Results.length === 0;  // Only as fallback
}
```

### Phase 3: Response Framing (When Presenting)
If tier 3 content is used, ALWAYS frame it properly:

```markdown
## Chris's Method (Primary)
[Use tier 1 content here - Chris's actual teaching]

---

## Supporting Examples (From Other Successful Dropshippers)
> ⚠️ **Note:** These examples are NOT from Chris but from other creators who've had success with similar strategies.

[Use tier 3 content here - properly attributed]

**Remember:** Chris's method above is the foundation. These are just additional examples to show the strategy in action.
```

### Phase 4: System Prompt Rules

Update system prompt to enforce hierarchy:

```
🚨 TIER 3 CONTENT RULES:

1. **ALWAYS prioritize Tier 1** (Chris's content) over everything else
2. **ONLY use Tier 3** when:
   - User explicitly asks for examples/case studies
   - Tier 1 has <2 relevant results
   - You need supporting evidence for Chris's method

3. **ALWAYS frame Tier 3 properly:**
   - Clearly label it as "Supporting Examples"
   - State it's NOT from Chris
   - Attribute to the actual creator
   - Frame as reinforcement, not replacement

4. **NEVER let Tier 3 contradict Tier 1:**
   - If Tier 3 contradicts Chris, ignore it completely
   - If Tier 3 adds nuance, use it as "alternative perspective"
   - Chris's method is ALWAYS the primary answer

5. **Quality filter:**
   - Only use Tier 3 with reliability_score > 0.6
   - Prefer verified success stories
   - Skip generic/obvious advice
```

## Implementation Checklist

### To Add Tier 3 Content:

- [ ] Create upload script that properly tags tier level
- [ ] Add reliability scoring system
- [ ] Implement query analyzer to detect when tier 3 is needed
- [ ] Update system prompts with tier 3 framing rules
- [ ] Add quality filters (minimum reliability score)
- [ ] Test with various queries to ensure Chris's voice stays dominant
- [ ] Add user feedback mechanism to rate tier 3 helpfulness

### Upload Script Changes:

```typescript
// New field in metadata
interface Tier3Metadata {
  tier: 3;
  creator: string;
  source_url: string;
  reliability_score: number;  // 0-1 based on creator reputation
  verified_success: boolean;  // True if revenue numbers verified
  topics: string[];  // What topics this covers
}
```

### Search Logic Changes:

```typescript
// Priority order
1. Search Tier 1 (Chris) first
2. If Tier 1 has 3+ good results → STOP, use only Tier 1
3. If Tier 1 has 0-2 results → Search Tier 3 as supplement
4. Combine: 80% Tier 1, 20% Tier 3 in response
5. Always frame Tier 3 as "supporting examples"
```

## Benefits of This Approach

✅ **Keeps Chris's voice primary** - Tier 1 always dominates
✅ **Adds value when needed** - Tier 3 fills gaps with examples
✅ **Clear attribution** - Users know what's from Chris vs others
✅ **Quality control** - Reliability scoring filters out BS
✅ **Prevents confusion** - Clear framing prevents contradiction
✅ **Scales well** - Can add more tier 3 content without dilution

## Next Steps

1. **Finish uploading Tier 1** (in progress - ~250 items)
2. **Test Tier 1-only responses** to ensure quality
3. **Deploy and get user feedback** on Tier 1 coverage
4. **Identify gaps** where Tier 3 would actually help
5. **Implement tier detection logic** (Phase 1-4 above)
6. **Carefully add Tier 3 content** with proper tagging
7. **Monitor response quality** to ensure Chris's voice stays authentic

---

**Philosophy:** Tier 1 (Chris) is the meal. Tier 3 is the garnish. Never let the garnish overwhelm the meal.
