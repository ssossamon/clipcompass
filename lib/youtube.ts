// All real YouTube data goes through this file - one place to see exactly
// which fields are official API data vs. a labeled estimate.

const API_BASE = "https://www.googleapis.com/youtube/v3";

export function extractVideoId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    const v = url.searchParams.get("v");
    if (v) return v;
    const shorts = url.pathname.match(/\/shorts\/([\w-]{11})/);
    if (shorts) return shorts[1];
  } catch {
    return null;
  }
  return null;
}
export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  tagsVisible: boolean;
  hasMaxResThumbnail: boolean;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
};

// Real call to videos.list - this is "verified" data, straight from YouTube.
export async function fetchVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set - add it to .env before running audits.");
  }

const url = `${API_BASE}/videos?part=snippet,statistics&id=${encodeURIComponent(videoId)}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API error (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

const tags: string[] = item.snippet?.tags ?? [];

return {
  id: item.id,
  title: item.snippet?.title ?? "",
  description: item.snippet?.description ?? "",
  tags,
  tagsVisible: tags.length > 0,
  hasMaxResThumbnail: Boolean(item.snippet?.thumbnails?.maxres),
  viewCount: Number(item.statistics?.viewCount ?? 0),
  likeCount: Number(item.statistics?.likeCount ?? 0),
  publishedAt: item.snippet?.publishedAt ?? ""
};
}

export type ChecklistResult = {
  check: string;
  passed: boolean;
  detail: string;
};

export function computeChecklist(video: YouTubeVideo, targetKeyword: string): {
  checklist: ChecklistResult[];
  score: number;
} {
  const kw = targetKeyword.trim().toLowerCase();
  const title = video.title.toLowerCase();
  const description = video.description.toLowerCase();
  const firstLine = description.split("\n")[0] ?? "";

const checklist: ChecklistResult[] = [
  {
    check: "Target keyword appears in title",
    passed: kw.length > 0 && title.includes(kw),
    detail: kw ? "" : "No target keyword was provided."
  },
  {
    check: "Description is 200+ characters",
    passed: video.description.length >= 200,
    detail: `Currently ${video.description.length} characters.`
  },
  {
    check: "Keyword appears in first line of description",
    passed: kw.length > 0 && firstLine.includes(kw),
    detail: ""
  },
  {
    check: "5 or more tags set",
    passed: video.tagsVisible && video.tags.length >= 5,
    detail: video.tagsVisible
    ? `Currently ${video.tags.length} tags.`
      : "This channel hides tags publicly - can't verify this one."
  },
  {
    check: "Custom (maxres) thumbnail present",
    passed: video.hasMaxResThumbnail,
    detail: "Estimated from thumbnail resolution, not a direct API flag."
  }
  ];

const passedCount = checklist.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checklist.length) * 100);

return { checklist, score };
}

// Uses YouTube's public (unofficial) autocomplete endpoint - not part of
// Data API v3, so results are labeled "estimated" everywhere they're shown.
export async function fetchKeywordSuggestions(seed: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(seed)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.[1]) ? data[1] : [];
}
