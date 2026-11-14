import * as cheerio from "cheerio";

export type Showtime = {
  date: string;
  screen: string;
  times: string[];
};

export type ScrapeResult = {
  hasShowtimes: boolean;
  showtimes: Showtime[];
  error?: string;
};

const CUE_URL =
  "https://cuecinemas.com/Browsing/Movies/Details/f-F000001483";

export async function scrapeShowtimes(): Promise<ScrapeResult> {
  let html: string;

  try {
    const res = await fetch(CUE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return { hasShowtimes: false, showtimes: [], error: `HTTP ${res.status}` };
    }

    html = await res.text();
  } catch (err) {
    return {
      hasShowtimes: false,
      showtimes: [],
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }

  const $ = cheerio.load(html);

  // If this text appears, there are no showtimes yet
  const noSessionsText = $("*")
    .filter((_i, el) => {
      const text = $(el).text();
      return text.includes("no sessions scheduled") || text.includes("Please check back");
    })
    .length;

  if (noSessionsText > 0) {
    return { hasShowtimes: false, showtimes: [] };
  }

  // Parse showtimes — CUE renders dates as headings and times as buttons/links
  const showtimes: Showtime[] = [];

  // Look for the showtimes section
  // Selector heuristic: date headers followed by screen names and time buttons
  // Based on the "Hunger Games" page pattern in the screenshot
  let currentDate = "";
  let currentScreen = "";
  let currentTimes: string[] = [];

  $("body").find("*").each((_i, el) => {
    const text = $(el).text().trim();
    const tag = el.type === "tag" ? (el as { name: string }).name : "";

    // Date heading — matches patterns like "Friday, 20 November 2026"
    if (
      tag === "h3" ||
      (tag === "div" && /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/.test(text))
    ) {
      if (currentDate && currentScreen && currentTimes.length) {
        showtimes.push({ date: currentDate, screen: currentScreen, times: currentTimes });
      }
      if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/.test(text)) {
        currentDate = text;
        currentScreen = "";
        currentTimes = [];
      }
    }

    // Screen name — typically uppercase short text like "SCREEN 2", "PLATINUM 7", "MAXIMUS"
    if (
      tag === "p" &&
      /^[A-Z][A-Z\s\d]+$/.test(text) &&
      text.length < 30
    ) {
      if (currentScreen && currentTimes.length) {
        showtimes.push({ date: currentDate, screen: currentScreen, times: currentTimes });
      }
      currentScreen = text;
      currentTimes = [];
    }

    // Time button — matches "12:45 PM", "06:15 PM" etc.
    if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(text)) {
      currentTimes.push(text);
    }
  });

  // Flush last group
  if (currentDate && currentScreen && currentTimes.length) {
    showtimes.push({ date: currentDate, screen: currentScreen, times: currentTimes });
  }

  // If we parsed zero structured showtimes but the page had no "no sessions" message,
  // it still means showtimes are available — just hard to parse structurally
  const hasShowtimes = showtimes.length > 0 || noSessionsText === 0;

  return { hasShowtimes, showtimes };
}
