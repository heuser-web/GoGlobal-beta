// Daily Content Pipeline
// Calls Gemini (text) to generate 10 events + 7 trails.
// Saves output to server/data/ as JSON files served by Express.
// Called on server startup (if no data) and daily via node-cron.

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");

async function callGemini(prompt, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) {
    console.error(`[Pipeline] Gemini HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

function safeParseArray(text) {
  if (!text) return null;
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

export async function runDailyPipeline(apiKey) {
  if (!apiKey) { console.error("[Pipeline] No API key — skipping"); return; }
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("[Pipeline] Generating daily content...");

  const eventsPrompt = `Generate exactly 10 diverse Las Vegas area events for 2026. Return ONLY a raw JSON array, no markdown, no explanation:
[{"id":"daily-evt-1","artist":"Artist or Event Name","venue":"Real Vegas Venue","dates":["Apr 15, 2026"],"category":"Music","price":"$XX+"}]
Mix categories: 3 Music, 2 Art, 1 Tech, 1 Food, 2 Show, 1 Sports.
Real venues: MGM Grand, Park MGM, Bellagio, Caesars Palace, T-Mobile Arena, Allegiant Stadium, Brooklyn Bowl, Neon Museum, Area 15, Wynn, Encore.
Include off-Strip events too. Make all dates in 2026.`;

  const trailsPrompt = `Generate exactly 7 hiking trails near Las Vegas, Nevada. Return ONLY a raw JSON array, no markdown:
[{"id":"daily-hike-1","name":"Trail Name","difficulty":"Moderate","distance":"3.2 mi","elevation":"600 ft","description":"One engaging sentence.","tags":["Scenic","Wildlife"],"gemsRating":4}]
Rules: difficulty must be Easy/Moderate/Hard exactly. gemsRating 1-5.
Use diverse locations: Red Rock Canyon, Valley of Fire, Lake Mead, Spring Mountains, Gold Butte, Black Canyon, Sloan Canyon.
Do NOT include: Calico Tanks, Fire Wave Trail, Mary Jane Falls, Gold Strike Hot Springs, Historic Railroad Trail, Kraft Mountain Loop.`;

  const [eventsText, trailsText] = await Promise.all([
    callGemini(eventsPrompt, apiKey),
    callGemini(trailsPrompt, apiKey),
  ]);

  if (eventsText) {
    const events = safeParseArray(eventsText);
    if (events?.length) {
      writeFileSync(join(DATA_DIR, "daily-events.json"), JSON.stringify(events, null, 2));
      console.log(`[Pipeline] ✓ ${events.length} events saved`);
    } else {
      console.error("[Pipeline] ✗ Could not parse events response");
    }
  }

  if (trailsText) {
    const trails = safeParseArray(trailsText);
    if (trails?.length) {
      writeFileSync(join(DATA_DIR, "daily-trails.json"), JSON.stringify(trails, null, 2));
      console.log(`[Pipeline] ✓ ${trails.length} trails saved`);
    } else {
      console.error("[Pipeline] ✗ Could not parse trails response");
    }
  }

  writeFileSync(
    join(DATA_DIR, "last-run.json"),
    JSON.stringify({ timestamp: new Date().toISOString() })
  );
  console.log("[Pipeline] Complete.");
}
