// Single source of truth for every AI prompt used in ClipCompass.
// Nothing else in the app should hardcode prompt text - route new AI
// features through here so the prompts stay auditable in one place.
//
// Not wired to a live model yet (see Section 8 of the build prompt).
// When ANTHROPIC_API_KEY is added, call buildTitleRewritePrompt() and
// send it to the model, then parse the response against the JSON shape
// documented below. Never let the model invent metrics it wasn't given.

function buildTitleRewritePrompt({ currentTitle, currentDescription, currentTags, targetKeyword, transcriptExcerpt }) {
  return {
    system:
      "You are a YouTube SEO assistant. You only use the information given to you. " +
      "Never invent view counts, rankings, or competitor data. If information is " +
      "missing (e.g. no transcript), say so instead of guessing.",
    user: JSON.stringify({
      current_title: currentTitle,
      current_description: currentDescription,
      current_tags: currentTags,
      target_keyword: targetKeyword,
      transcript_excerpt: transcriptExcerpt || null
    }),
    expectedOutputShape: {
      suggested_titles: ["string", "string", "string"],
      suggested_description: "string",
      suggested_tags: ["string"],
      suggested_hashtags: ["string"],
      rationale: "string"
    }
  };
}

module.exports = { buildTitleRewritePrompt };
