/**
 * Oxylabs Web Scraper API wrapper.
 * Uses the realtime endpoint with `source: "universal"` for news sites.
 * Server-only — never import from client code.
 */

const OXYLABS_ENDPOINT = "https://realtime.oxylabs.io/v1/queries";

interface OxylabsResult {
  content: string;
  status_code: number;
  url: string;
}

interface OxylabsResponse {
  results: OxylabsResult[];
}

/**
 * Scrape a URL through Oxylabs and return the HTML content.
 * Uses Basic Auth with OXY_WSA_USERNAME / OXY_WSA_PASSWORD.
 */
export async function scrapeUrl(url: string): Promise<string> {
  const username = process.env.OXY_WSA_USERNAME;
  const password = process.env.OXY_WSA_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing Oxylabs credentials: OXY_WSA_USERNAME / OXY_WSA_PASSWORD");
  }

  console.log(`  [oxylabs] Scraping: ${url}`);

  const response = await fetch(OXYLABS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    },
    body: JSON.stringify({
      source: "universal",
      url,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Oxylabs request failed for ${url}: ${response.status} ${response.statusText} — ${body.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as OxylabsResponse;

  if (!data.results?.[0]?.content) {
    throw new Error(`Oxylabs returned no content for ${url}`);
  }

  if (data.results[0].status_code !== 200) {
    throw new Error(
      `Oxylabs target returned status ${data.results[0].status_code} for ${url}`
    );
  }

  return data.results[0].content;
}
