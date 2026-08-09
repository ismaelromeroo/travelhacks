import type { ResearchFact } from "./types";

const TAVILY_URL = "https://api.tavily.com/search";
const MAX_RESULTS = 5;
const MAX_FACT_LENGTH = 240;

interface TavilySearchResponse {
  results?: { content: string; url: string }[];
}

/** Pre-call grounding: a few facts about the hotel to negotiate from. Returns [] if unset or on any failure. */
export async function gatherResearch(hotelName: string): Promise<ResearchFact[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `${hotelName} amenities rate breakfast`,
        max_results: MAX_RESULTS,
        include_answer: false,
      }),
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as TavilySearchResponse;
    return (data.results ?? []).slice(0, MAX_RESULTS).map((result) => ({
      fact: result.content.slice(0, MAX_FACT_LENGTH),
      source: result.url,
    }));
  } catch {
    return [];
  }
}
