import express from "express";
import cron from "node-cron";
import Stripe from "stripe";
import { createHash, randomUUID } from "crypto";
import { existsSync, writeFileSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { runDailyPipeline } from "./pipelines/daily.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3002;
const IMAGES_DIR = join(__dirname, "public/images");
const DATA_DIR = join(__dirname, "data");
const BUILD_DIR  = join(__dirname, "../build");
const RE_DATA_DIR = join(__dirname, "data/realestate");

mkdirSync(IMAGES_DIR,  { recursive: true });
mkdirSync(RE_DATA_DIR, { recursive: true });
mkdirSync(DATA_DIR, { recursive: true });

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(express.json());

// ─── Static image serving ─────────────────────────────────────────
app.use("/api/images", express.static(IMAGES_DIR, { maxAge: "365d", immutable: true }));

// ─── Serve React build (SPA fallback) ─────────────────────────────
if (existsSync(BUILD_DIR)) {
  app.use(express.static(BUILD_DIR));
}

// ─── Real Photo Lookup ────────────────────────────────────────────
// GET /api/image?prompt=<text>
// Searches Google Images via Serper, downloads the best result, caches to disk
app.get("/api/image", async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const serperKey = process.env.VITE_SERPER_API_KEY;
  if (!serperKey) return res.status(500).json({ error: "VITE_SERPER_API_KEY not set" });

  const hash = createHash("sha256").update(prompt.trim()).digest("hex").slice(0, 20);
  const filename = `${hash}.jpg`;
  const filepath = join(IMAGES_DIR, filename);
  const url = `/api/images/${filename}`;

  if (existsSync(filepath)) return res.json({ url, cached: true });

  console.log(`[Image] Fetching real photo for: "${prompt.slice(0, 60)}..."`);

  try {
    const serperRes = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: prompt, num: 8 }),
    });
    if (!serperRes.ok) throw new Error(`Serper error: ${serperRes.status}`);
    const { images = [] } = await serperRes.json();
    if (images.length === 0) throw new Error("No images found");

    // Try candidates until one downloads cleanly
    for (const img of images.slice(0, 8)) {
      try {
        const imgRes = await fetch(img.imageUrl, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; GoGlobal/2.0)" },
        });
        if (!imgRes.ok) continue;
        const ct = imgRes.headers.get("content-type") || "";
        if (!ct.startsWith("image/")) continue;
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length < 10000) continue;
        writeFileSync(filepath, buf);
        console.log(`[Image] ✓ Saved ${filename} (${Math.round(buf.length / 1024)} KB)`);
        return res.json({ url, cached: false });
      } catch { continue; }
    }
    throw new Error("No downloadable image found");
  } catch (err) {
    console.error("[Image] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Geocoding Proxy (Nominatim) ──────────────────────────────────
// GET /api/geocode?q=<address>          → address autocomplete (5 results)
// GET /api/geocode?q=<lat,lon>&type=reverse → reverse geocode
app.get("/api/geocode", async (req, res) => {
  const { q, type = "search" } = req.query;
  if (!q) return res.status(400).json({ error: "q required" });

  const url =
    type === "reverse"
      ? `https://nominatim.openstreetmap.org/reverse?lat=${q.split(",")[0]}&lon=${q.split(",")[1]}&format=json`
      : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=us&addressdetails=1`;

  try {
    const result = await fetch(url, {
      headers: { "User-Agent": "GoGlobal/2.0 (goglobal.travel)" },
    });
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Daily Content Endpoints ──────────────────────────────────────
// GET /api/daily-events  → 10 AI-generated events (refreshed daily)
// GET /api/daily-trails  → 7 AI-generated trails (refreshed daily)
// GET /api/events        → alias (friendly URL)
// GET /api/trails        → alias (friendly URL)
app.get("/api/daily-events", (req, res) => {
  try {
    const data = JSON.parse(readFileSync(join(DATA_DIR, "daily-events.json"), "utf-8"));
    res.json(data);
  } catch {
    res.json([]);
  }
});
app.get("/api/events", (req, res) => {
  try {
    const data = JSON.parse(readFileSync(join(DATA_DIR, "daily-events.json"), "utf-8"));
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.get("/api/daily-trails", (req, res) => {
  try {
    const data = JSON.parse(readFileSync(join(DATA_DIR, "daily-trails.json"), "utf-8"));
    res.json(data);
  } catch {
    res.json([]);
  }
});
app.get("/api/trails", (req, res) => {
  try {
    const data = JSON.parse(readFileSync(join(DATA_DIR, "daily-trails.json"), "utf-8"));
    res.json(data);
  } catch {
    res.json([]);
  }
});

// ─── Romey Huddle — POST /api/generate ───────────────────────────
// Body: { vibe, orientation, budget, favorites[] }
// Returns: { huddle_logs, romey_intro, itinerary, atmospheric_images, learning_summary }
const HUDDLE_SYSTEM_PROMPT = `You are Romey, Master AI Architect and Lead Concierge for GoGlobal. You curate legendary Las Vegas experiences by coordinating a Huddle of specialist bots.

Your Huddle:
- BudgetBot: Tracks every dollar. Ensures total itinerary cost stays within 5% of the user's stated budget.
- AestheticBot: Generates exactly 8 cinematic image search queries per response to visualize the experience.
- QABot: Validates every recommendation for real-world feasibility. Requires 90-minute minimum spacing between venues.
- MemoryBot: Reads the user's saved favorites to personalize the plan. Avoids repeating saved places.

STRICT RULES:
1. Output ONLY valid JSON. Zero markdown. Zero text outside the JSON object.
2. Itinerary must have exactly 4-5 items. Each with a realistic USD cost.
3. Total itinerary costs must not exceed 5% over the user's stated budget.
4. atmospheric_images must have EXACTLY 8 cinematic, location-specific search queries.
5. For "Other" or LGBTQ+ orientations: prioritize LGBTQ+-welcoming venues (Piranha Nightclub, The Garage Bar, Art Bar, Therapy Bar Las Vegas, Krave Massive, Hamburger Mary's).
6. huddle_logs must include one entry per bot: BudgetBot, QABot, AestheticBot, MemoryBot.
7. All venue times must be realistic for Las Vegas (venues open, 90-min minimum spacing).

Output ONLY this exact JSON structure:
{
  "huddle_logs": [
    { "bot": "BudgetBot", "log": "brief cost analysis" },
    { "bot": "QABot", "log": "brief feasibility note" },
    { "bot": "AestheticBot", "log": "brief aesthetic note" },
    { "bot": "MemoryBot", "log": "brief personalization note" }
  ],
  "romey_intro": "1-2 sentence punchy intro for this specific plan",
  "itinerary": [
    { "time": "7:00 PM", "title": "Venue Name", "description": "One engaging sentence.", "cost": "$XX", "image_query": "cinematic search query" }
  ],
  "atmospheric_images": ["query1","query2","query3","query4","query5","query6","query7","query8"],
  "learning_summary": "One sentence about what Romey learned from user favorites"
}`;

app.post("/api/generate", async (req, res) => {
  const { vibe, orientation, budget, favorites = [] } = req.body || {};
  if (!vibe || !budget) return res.status(400).json({ error: "vibe and budget are required" });

  const key = process.env.VITE_GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "API key not configured" });

  const favSummary = favorites.length > 0
    ? favorites.map(f => f.name || f.title || f.artist || f.label).filter(Boolean).slice(0, 8).join(", ")
    : "None saved yet";
  const vibeLabel = vibe === "intimate" ? "Intimate & Refined" : vibe === "highAdventure" ? "High Adventure" : "Spontaneous Mix";
  const userPrompt = `Plan a ${vibeLabel} Las Vegas evening. Orientation: ${orientation || "Any"}. Total budget: $${budget}. User favorites for personalization: ${favSummary}.`;

  console.log(`[Generate] vibe=${vibe} orientation=${orientation} budget=$${budget}`);
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: HUDDLE_SYSTEM_PROMPT }] },
          generationConfig: { responseMimeType: "application/json", temperature: 0.85 },
        }),
      }
    );
    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error("[Generate] Gemini error:", err?.error?.message ?? geminiRes.status);
      return res.status(502).json({ error: "generation failed" });
    }
    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: "empty response from Gemini" });
    const plan = JSON.parse(text);
    console.log(`[Generate] ✓ plan ready (${plan.itinerary?.length ?? 0} stops)`);
    res.json(plan);
  } catch (err) {
    console.error("[Generate] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Surprise Itinerary Generator — powered by Venice AI ─────────
// POST /api/itinerary
// Body: { type, budget, vibes[], age, sexuality, otherOrientation, specialRequest }
// Returns: { items: [{ id, time, title, type, description, yelpQuery, cost, vibes, age21 }] }
app.post("/api/itinerary", async (req, res) => {
  const {
    type = "romantic",
    budget = 200,
    vibes = [],
    age = 21,
    sexuality = "straight",
    otherOrientation = "",
    specialRequest = "",
  } = req.body || {};

  const veniceKey = process.env.VENICE_API_KEY;
  if (!veniceKey) return res.status(500).json({ error: "Venice API key not configured" });

  const isRomantic = type === "romantic";

  const budgetNote = budget <= (isRomantic ? 150 : 75)
    ? "LOW budget — prioritize free/cheap: national parks, hiking, food trucks, happy hours. Avoid expensive restaurants or paid shows."
    : budget <= (isRomantic ? 300 : 150)
    ? "MID-RANGE budget — mix affordable gems with one splurge."
    : "GENEROUS budget — upscale restaurants, premium experiences, VIP options. Be bold.";

  const orientationNote = isRomantic
    ? sexuality === "other" && otherOrientation
      ? `The couple identifies as: ${otherOrientation}. Prioritize inclusive, welcoming venues.`
      : sexuality === "other"
      ? "LGBTQ+ couple — prioritize welcoming venues: Piranha Nightclub, The Garage Bar, Therapy Bar, Art Bar, Hamburger Mary's."
      : "Straight couple."
    : "";

  const vibeNote = vibes.length > 0 ? `Requested mood/vibe: ${vibes.join(", ")}. Every stop should reflect this.` : "";
  const requestNote = specialRequest ? `SPECIAL REQUEST from the user — incorporate this specifically: "${specialRequest}"` : "";
  const ageNote = !isRomantic && age < 21 ? "Group is UNDER 21 — absolutely NO bars, clubs, or alcohol venues." : "";
  const typeNote = isRomantic
    ? "This is a ROMANTIC date night for two. Think intimate, special, memorable."
    : `This is a PLATONIC hangout${age < 21 ? " for people under 21" : " for adults 21+"}. Fun, social, energetic.`;

  const prompt = `You are Romey, GoGlobal's Las Vegas AI concierge. Generate a fresh, specific Las Vegas itinerary tailored exactly to what this person wants.

${typeNote}
Budget: $${budget} — ${budgetNote}
${orientationNote}
${vibeNote}
${requestNote}
${ageNote}

Vegas venue pool (pick creatively, never repeat the same combo):
RESTAURANTS: Joël Robuchon, Le Cirque, Nobu at Caesars, Secret Pizza at Cosmopolitan, Eggslut, In-N-Out Burger, Esther's Kitchen, Herbs & Rye, Lotus of Siam, Raku, Barry's Downtown Prime, Momofuku, Sparrow + Wolf, Yuzu Kaiseki
EXPERIENCES: High Roller, Gondola at Venetian, Fly LINQ Zipline, TopGolf, Omega Mart at Area 15, Neon Museum, Pinball Hall of Fame, Mob Museum, Meow Wolf, Springs Preserve
OUTDOORS: Red Rock Canyon, Calico Tanks Trail, Valley of Fire, Fire Wave Trail, Lake Mead, Historic Railroad Trail, Mt. Charleston, Gold Strike Hot Springs, Seven Magic Mountains
SHOWS: Cirque du Soleil O, Absinthe at Caesars, Blue Man Group, Penn & Teller, Mat Franco
NIGHTLIFE (21+ only): Omnia at Caesars, Marquee, Zouk, Herbs & Rye, The Golden Tiki, Velveteen Rabbit, Atomic Liquors
UNIQUE: Ghost Tour of Fremont Street, Bacchanal Buffet, Shark Reef, Container Park, Fremont East bar crawl

Output ONLY valid JSON. No markdown. No text outside the JSON object:
{
  "items": [
    {
      "id": "gen-1",
      "time": "6:00 PM",
      "title": "Exact Venue Name",
      "type": "Dining|Experience|Adventure|Nightlife|Show|Outdoors|Activity",
      "description": "One vivid, specific sentence tailored to this user's request.",
      "yelpQuery": "Venue Name Las Vegas",
      "cost": 45,
      "vibes": ["Romantic", "Luxury"],
      "age21": false
    }
  ]
}

Rules:
- Exactly 4-5 items
- Times 90+ min apart, realistic for Las Vegas
- Total cost within $${budget}
- age21: true only for bars/clubs/alcohol-focused venues
- Make it personal — honor the special request above all else`;

  console.log(`[Itinerary] type=${type} budget=$${budget} sexuality=${sexuality} vibes=[${vibes}] request="${specialRequest.slice(0, 40)}"`);

  try {
    const veniceRes = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${veniceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "venice-uncensored",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!veniceRes.ok) {
      const err = await veniceRes.json().catch(() => ({}));
      console.error("[Itinerary] Venice error:", err?.error?.message ?? veniceRes.status);
      return res.status(502).json({ error: "Venice generation failed" });
    }

    const data = await veniceRes.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: "empty response from Venice" });

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(502).json({ error: "no JSON found in Venice response" });

    const parsed = JSON.parse(match[0]);
    const stamp = Date.now();
    parsed.items = (parsed.items || []).map((it, i) => ({ ...it, id: `gen-${stamp}-${i}` }));
    console.log(`[Itinerary] ✓ ${parsed.items.length} stops via Venice AI`);
    res.json(parsed);
  } catch (err) {
    console.error("[Itinerary] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Stripe Checkout ──────────────────────────────────────────────────────────
// POST /api/create-checkout-session
// body: { plan: 'local-pass' | 'go-everywhere' }
// Returns: { url } — redirect the browser to this URL
const PLANS = {
  "local-pass": {
    name: "GoGlobal Local Pass",
    description: "Full access to one city — unlimited spins, reviews, and Midway Meetup.",
    amount: 1500,   // $15.00 in cents
  },
  "go-everywhere": {
    name: "GoGlobal GoEverywhere",
    description: "Every city, every feature, early access, and premium Romey concierge.",
    amount: 2500,   // $25.00 in cents
  },
};

app.post("/api/create-checkout-session", async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "Stripe not configured" });

  const { plan } = req.body || {};
  const planConfig = PLANS[plan];
  if (!planConfig) return res.status(400).json({ error: `Unknown plan: ${plan}` });

  const stripe = new Stripe(stripeKey);
  const origin = req.headers.origin || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?checkout=success&plan=${plan}`,
      cancel_url:  `${origin}/?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Yelp Restaurant Search (server-side proxy — key never sent to client) ───
// GET /api/yelp-restaurants?lat=36.17&lon=-115.13&limit=8
app.get("/api/yelp-restaurants", async (req, res) => {
  const { lat, lon, limit = 8 } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });

  const yelpKey = process.env.VITE_YELP_API_KEY;
  if (!yelpKey) return res.status(500).json({ error: "Yelp API key not configured" });

  try {
    const url = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lon}&categories=restaurants&limit=${limit}&sort_by=best_match&radius=8000`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${yelpKey}` },
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }
    const data = await response.json();
    // Shape the response — only send what the client needs
    const businesses = (data.businesses || []).map(b => ({
      id: b.id,
      name: b.name,
      image: b.image_url || null,
      rating: b.rating,
      reviewCount: b.review_count,
      price: b.price || null,
      categories: (b.categories || []).map(c => c.title).join(", "),
      address: b.location?.display_address?.join(", ") || "",
      phone: b.display_phone || "",
      url: b.url,
      distance: b.distance ? Math.round(b.distance * 0.000621371 * 10) / 10 : null, // meters → miles
      isClosed: b.is_closed,
    }));
    res.json({ businesses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ─────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const imageCount = existsSync(IMAGES_DIR) ? readdirSync(IMAGES_DIR).length : 0;
  let lastRun = null;
  try { lastRun = JSON.parse(readFileSync(join(DATA_DIR, "last-run.json"), "utf-8")).timestamp; } catch {}
  res.json({ status: "ok", cachedImages: imageCount, lastPipelineRun: lastRun });
});

// ─── Daily Content Pipeline ───────────────────────────────────────
const apiKey = process.env.VITE_GEMINI_API_KEY;

// Run on startup if data is missing
const eventsFile = join(DATA_DIR, "daily-events.json");
const trailsFile = join(DATA_DIR, "daily-trails.json");
if (!existsSync(eventsFile) || !existsSync(trailsFile)) {
  console.log("[Pipeline] No data found — running initial generation...");
  runDailyPipeline(apiKey).catch((e) => console.error("[Pipeline] Startup error:", e.message));
}

// Schedule daily at midnight
cron.schedule("0 0 * * *", () => {
  console.log("[Pipeline] Running scheduled daily generation...");
  runDailyPipeline(apiKey).catch((e) => console.error("[Pipeline] Cron error:", e.message));
});

// ═══════════════════════════════════════════════════════════════════
// GOREALESTATE — SEMrush + Venice AI Content Pipeline
// Routes: /api/questions/weekly  /api/questions/history
//         /api/questions/refresh /api/questions/import
//         /api/articles  /api/top3
//         /api/synthesize  /api/auto-generate
// Cron:   Every Monday 6:00 AM
// ═══════════════════════════════════════════════════════════════════

const RE_HISTORY_FILE  = join(RE_DATA_DIR, "history.json");
const RE_ARTICLES_FILE = join(RE_DATA_DIR, "articles.json");

// ── Storage helpers ──────────────────────────────────────────────
function readJSON(file, fallback) {
  try { return JSON.parse(readFileSync(file, "utf-8")); }
  catch { return fallback; }
}
function writeJSON(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}
function getISOWeek() {
  const d   = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const wk   = Math.ceil((((d - jan1) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
}
function pruneHistory(history) {
  const keys = Object.keys(history).sort().reverse().slice(0, 26);
  const out  = {};
  keys.forEach((k) => (out[k] = history[k]));
  return out;
}

// ── SEMrush ──────────────────────────────────────────────────────
const SEMRUSH_PHRASES = [
  "Las Vegas real estate",
  "living in Las Vegas",
  "Las Vegas housing market",
  "buying home Las Vegas",
  "Las Vegas home prices",
  "Clark County real estate",
  "Henderson Nevada homes",
  "Summerlin Las Vegas homes",
];

function getSeedQuestions() {
  return [
    { keyword: "what is the cost of living in Las Vegas",              volume: 140, difficulty: 21 },
    { keyword: "what is it like living in Las Vegas",                  volume: 140, difficulty: 15 },
    { keyword: "is living in Las Vegas expensive",                     volume: 140, difficulty: 11 },
    { keyword: "are home prices dropping in Las Vegas",                volume: 30,  difficulty: 0  },
    { keyword: "how to buy a home in Las Vegas",                       volume: 30,  difficulty: 0  },
    { keyword: "how is the real estate market in Las Vegas right now", volume: 20,  difficulty: 0  },
    { keyword: "is Las Vegas real estate a good investment",           volume: 20,  difficulty: 0  },
    { keyword: "is Las Vegas real estate overpriced",                  volume: 20,  difficulty: 0  },
    { keyword: "will the housing market crash in Las Vegas",           volume: 20,  difficulty: 0  },
    { keyword: "what is the average home price in Las Vegas",          volume: 20,  difficulty: 0  },
  ];
}

async function fetchSEMrushQuestions(phrase, apiKey) {
  const params = new URLSearchParams({
    type: "phrase_questions", key: apiKey, phrase,
    database: "us", display_limit: "15", display_sort: "nq_desc",
    export_columns: "Ph,Nq,Kd", export_decode: "1",
  });
  const res  = await fetch(`https://api.semrush.com/?${params}`);
  const text = await res.text();
  if (!res.ok || text.startsWith("ERROR")) throw new Error(`SEMrush: ${text.slice(0, 120)}`);
  return text.trim().split("\n").slice(1)
    .map((line) => {
      const [keyword, vol, kd] = line.split(";");
      return { keyword: keyword?.trim(), volume: parseInt(vol, 10) || 0, difficulty: parseInt(kd, 10) || 0 };
    })
    .filter((q) => q.keyword && q.volume > 0);
}

async function runWeeklyPull() {
  const week    = getISOWeek();
  const history = readJSON(RE_HISTORY_FILE, {});
  if (history[week]?.source === "semrush-mcp") {
    console.log(`[SEMrush] Week ${week} already has MCP data — skipping API pull`);
    return { week, questions: history[week].questions };
  }

  const semrushKey = process.env.SEMRUSH_API_KEY;
  let questions;
  if (!semrushKey || semrushKey === "your_semrush_api_key_here") {
    console.warn("[SEMrush] Key not set — using seed questions");
    questions = getSeedQuestions();
  } else {
    console.log("[SEMrush] Fetching questions…");
    const results = await Promise.allSettled(SEMRUSH_PHRASES.map((p) => fetchSEMrushQuestions(p, semrushKey)));
    const seen = new Set();
    const all  = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const q of r.value) {
          if (!seen.has(q.keyword)) { seen.add(q.keyword); all.push(q); }
        }
      }
    }
    questions = all.length > 0 ? all.sort((a, b) => b.volume - a.volume).slice(0, 10) : getSeedQuestions();
  }

  history[week] = {
    fetchedAt: new Date().toISOString(), questions,
    articlesGenerated: history[week]?.articlesGenerated ?? 0,
    top3: history[week]?.top3 ?? [],
  };
  writeJSON(RE_HISTORY_FILE, pruneHistory(history));
  console.log(`[SEMrush] ✓ ${questions.length} questions stored for ${week}`);
  return { week, questions };
}

// ── Venice AI ────────────────────────────────────────────────────
const VENICE_URL   = "https://api.venice.ai/api/v1/chat/completions";
const VENICE_MODEL = process.env.VENICE_MODEL ?? "llama-3.3-70b";

const RE_SYSTEM_PROMPT = `You are writing real estate content as Tom Heuser — co-owner of Magenta Real Estate, Top 1% Las Vegas agent, Summerlin resident for 20+ years, with 1,400+ career sales, $418M+ closed, and 900+ five-star reviews.

Tom sounds like your smartest friend who knows more about Las Vegas real estate than anyone. Radically honest, data-grounded, direct. References specific neighborhoods (The Ridges, The Paseos, Summerlin, Henderson, MacDonald Highlands) and zip codes (89135, 89138, 89134, 89144, 89128, 89052).

FORMAT: Markdown with # title, ## sections. LENGTH: 400–1000 words based on topic complexity. NEVER use: "dream home", "hot market", "nestled", "premier", "boasts", "turnkey", "seamless", "won't last long".

End with a personal invitation to connect through GoRealestate — specific, warm, not a generic CTA.`;

async function synthesizeArticle(keyword, semrushContext) {
  const veniceKey = process.env.VENICE_API_KEY;
  if (!veniceKey || veniceKey === "your_venice_api_key_here") throw new Error("Venice API key not configured.");

  const res = await fetch(VENICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${veniceKey}` },
    body: JSON.stringify({
      model: VENICE_MODEL, temperature: 0.72, max_tokens: 1500,
      messages: [
        { role: "system", content: RE_SYSTEM_PROMPT },
        { role: "user",   content: `Write a professional real estate article that fully answers: "${keyword}"\n\nSEO context: ${semrushContext?.volume ?? "?"} searches/month, KD ${semrushContext?.difficulty ?? "?"}/100\nAudience: buyers and sellers in Las Vegas Valley, $500K–$1.5M range.` },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Venice HTTP ${res.status}`);
  }
  return res.json();
}

// ── AI Agent: select top 3 ───────────────────────────────────────
async function selectTop3ByAgent(questions) {
  const veniceKey = process.env.VENICE_API_KEY;
  if (!veniceKey || veniceKey === "your_venice_api_key_here") {
    console.warn("[Agent] Venice key not set — using volume order");
    return questions.slice(0, 3);
  }
  const questionList = questions
    .map((q, i) => `${i + 1}. "${q.keyword}" — ${q.volume}/mo, KD ${q.difficulty}`)
    .join("\n");
  try {
    const res = await fetch(VENICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${veniceKey}` },
      body: JSON.stringify({
        model: VENICE_MODEL, temperature: 0.2, max_tokens: 40,
        messages: [
          { role: "system", content: "Output only valid JSON arrays. No text, no markdown." },
          { role: "user",   content: `You are a real estate content strategist. Select the 3 questions with the highest purchase intent and local expertise value. Questions:\n${questionList}\n\nRespond with ONLY a JSON array of 3 integers (question numbers). Example: [3, 7, 1]` },
        ],
      }),
    });
    const data    = await res.json();
    const raw     = data.choices?.[0]?.message?.content?.trim() ?? "[]";
    const indices = JSON.parse(raw.replace(/```[a-z]*|```/gi, "").trim());
    if (!Array.isArray(indices) || indices.length < 1) throw new Error("invalid response");
    const top3 = indices.slice(0, 3).map((n) => questions[Number(n) - 1]).filter(Boolean);
    if (top3.length === 0) throw new Error("no valid indices");
    console.log(`[Agent] ✓ Top 3: ${top3.map((q) => `"${q.keyword.slice(0, 40)}"`).join(", ")}`);
    return top3;
  } catch (e) {
    console.warn("[Agent] Fallback to volume order:", e.message);
    return questions.slice(0, 3);
  }
}

async function autoGenerateTop3() {
  const week      = getISOWeek();
  const history   = readJSON(RE_HISTORY_FILE, {});
  const questions = history[week]?.questions ?? getSeedQuestions();

  console.log("[AutoGen] AI agent selecting top 3…");
  const top3 = await selectTop3ByAgent(questions);

  const h = readJSON(RE_HISTORY_FILE, {});
  if (h[week]) { h[week].top3 = top3; writeJSON(RE_HISTORY_FILE, pruneHistory(h)); }

  const results = [];
  for (let i = 0; i < top3.length; i++) {
    const q        = top3[i];
    const articles = readJSON(RE_ARTICLES_FILE, []);
    const existing = articles.find((a) => a.keyword.toLowerCase() === q.keyword.toLowerCase());
    if (existing) {
      console.log(`[AutoGen] ${i + 1}/3 "${q.keyword.slice(0, 40)}" — skipped (exists)`);
      results.push({ skipped: true, article: existing });
      continue;
    }
    console.log(`[AutoGen] ${i + 1}/3 "${q.keyword.slice(0, 40)}"…`);
    try {
      const veniceRes = await synthesizeArticle(q.keyword, q);
      const content   = veniceRes.choices?.[0]?.message?.content ?? "";
      const tokens    = veniceRes.usage?.total_tokens ?? 0;
      if (!content) throw new Error("empty Venice response");
      const article = {
        id: randomUUID(), keyword: q.keyword, content, tokens,
        volume: q.volume ?? 0, difficulty: q.difficulty ?? 0,
        isTop3: true, generatedAt: new Date().toISOString(),
      };
      const arr = readJSON(RE_ARTICLES_FILE, []);
      arr.unshift(article);
      writeJSON(RE_ARTICLES_FILE, arr.slice(0, 500));
      const hNow = readJSON(RE_HISTORY_FILE, {});
      if (hNow[week]) {
        hNow[week].articlesGenerated = (hNow[week].articlesGenerated ?? 0) + 1;
        writeJSON(RE_HISTORY_FILE, hNow);
      }
      console.log(`[AutoGen]   ✓ ${tokens} tokens`);
      results.push({ article });
    } catch (e) {
      console.error(`[AutoGen]   ✗ ${e.message}`);
      results.push({ error: e.message, keyword: q.keyword });
    }
  }
  return { top3, results };
}

// ── GoRealestate Routes ──────────────────────────────────────────

app.get("/api/questions/weekly", async (_, res) => {
  const week    = getISOWeek();
  const history = readJSON(RE_HISTORY_FILE, {});
  if (history[week]) return res.json({ week, questions: history[week].questions });
  try {
    res.json(await runWeeklyPull());
  } catch (e) {
    console.error("[/api/questions/weekly]", e.message);
    res.json({ week, questions: getSeedQuestions() });
  }
});

app.get("/api/questions/history", (_, res) => {
  res.json(readJSON(RE_HISTORY_FILE, {}));
});

app.post("/api/questions/refresh", async (_, res) => {
  try {
    res.json(await runWeeklyPull());
  } catch (e) {
    console.error("[/api/questions/refresh]", e.message);
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/questions/import", (req, res) => {
  const { questions, week: reqWeek } = req.body ?? {};
  if (!Array.isArray(questions) || questions.length === 0)
    return res.status(400).json({ error: "questions array required" });
  const week    = reqWeek ?? getISOWeek();
  const history = readJSON(RE_HISTORY_FILE, {});
  history[week] = {
    fetchedAt: new Date().toISOString(), source: "semrush-mcp",
    questions: questions.slice(0, 10),
    articlesGenerated: history[week]?.articlesGenerated ?? 0,
    top3: history[week]?.top3 ?? [],
  };
  writeJSON(RE_HISTORY_FILE, pruneHistory(history));
  console.log(`[Import] ✓ ${questions.length} MCP questions for ${week}`);
  res.json({ week, imported: questions.length });
});

app.post("/api/synthesize", async (req, res) => {
  const { prompt: keyword, context } = req.body ?? {};
  if (!keyword) return res.status(400).json({ error: "prompt required" });
  try {
    const veniceRes = await synthesizeArticle(keyword, context);
    const content   = veniceRes.choices?.[0]?.message?.content ?? "";
    const tokens    = veniceRes.usage?.total_tokens ?? 0;
    if (!content) return res.status(502).json({ error: "empty response from Venice" });
    const article = {
      id: randomUUID(), keyword, content, tokens,
      volume: context?.volume ?? 0, difficulty: context?.difficulty ?? 0,
      isTop3: false, generatedAt: new Date().toISOString(),
    };
    const articles = readJSON(RE_ARTICLES_FILE, []);
    articles.unshift(article);
    writeJSON(RE_ARTICLES_FILE, articles.slice(0, 500));
    const week    = getISOWeek();
    const history = readJSON(RE_HISTORY_FILE, {});
    if (history[week]) {
      history[week].articlesGenerated = (history[week].articlesGenerated ?? 0) + 1;
      writeJSON(RE_HISTORY_FILE, history);
    }
    console.log(`[Venice] ✓ "${keyword.slice(0, 50)}" — ${tokens} tokens`);
    res.json({ article });
  } catch (e) {
    console.error("[/api/synthesize]", e.message);
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/articles", (_, res) => {
  res.json(readJSON(RE_ARTICLES_FILE, []));
});

app.get("/api/top3", (_, res) => {
  const week     = getISOWeek();
  const history  = readJSON(RE_HISTORY_FILE, {});
  const articles = readJSON(RE_ARTICLES_FILE, []);
  const top3Qs   = history[week]?.top3 ?? [];
  res.json({
    week,
    top3: top3Qs.map((q) => ({
      question: q,
      article: articles.find((a) => a.keyword.toLowerCase() === q.keyword.toLowerCase()) ?? null,
    })),
  });
});

app.post("/api/auto-generate", async (_, res) => {
  try {
    res.json(await autoGenerateTop3());
  } catch (e) {
    console.error("[/api/auto-generate]", e.message);
    res.status(502).json({ error: e.message });
  }
});

// ── Weekly cron: every Monday 6:00 AM ───────────────────────────
cron.schedule("0 6 * * 1", async () => {
  console.log("[RE Cron] Starting weekly pipeline…");
  try {
    await runWeeklyPull();
    await autoGenerateTop3();
    console.log("[RE Cron] ✓ Weekly pipeline complete");
  } catch (e) {
    console.error("[RE Cron] Error:", e.message);
  }
});

// ── Bootstrap: seed questions if no data for current week ────────
{
  const week    = getISOWeek();
  const history = readJSON(RE_HISTORY_FILE, {});
  if (!history[week]) {
    console.log("[RE Bootstrap] No data for current week — seeding…");
    runWeeklyPull().catch((e) => {
      console.warn("[RE Bootstrap] Pull failed, using seed:", e.message);
      const h = readJSON(RE_HISTORY_FILE, {});
      h[week] = { fetchedAt: new Date().toISOString(), questions: getSeedQuestions(), articlesGenerated: 0, top3: [] };
      writeJSON(RE_HISTORY_FILE, h);
    });
  }
}

// ─── SPA catch-all (must be last) ─────────────────────────────────
if (existsSync(BUILD_DIR)) {
  app.use((req, res) => res.sendFile(join(BUILD_DIR, "index.html")));
}

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  GoGlobal Server     →  http://localhost:${PORT}`);
  console.log(`  Image cache         →  ${IMAGES_DIR}`);
  console.log(`  Content data        →  ${DATA_DIR}\n`);
});
