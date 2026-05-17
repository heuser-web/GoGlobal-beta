import express from "express";
import cron from "node-cron";
import Stripe from "stripe";
import { createHash, randomUUID } from "crypto";
import { existsSync, writeFileSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { runDailyPipeline } from "./pipelines/daily.js";
import { resolveCheckoutOrigin } from "./checkoutOrigin.js";

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
  res.header("Access-Control-Allow-Headers", "Content-Type, X-GoGlobal-Admin-Token");
  next();
});
app.use(express.json());

const geminiApiKey = () => process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const serperApiKey = () => process.env.SERPER_API_KEY || process.env.VITE_SERPER_API_KEY;
const yelpApiKey = () => process.env.YELP_API_KEY || process.env.VITE_YELP_API_KEY;
const adminToken = () => process.env.GOGLOBAL_ADMIN_TOKEN || process.env.ADMIN_TOKEN;

function requireAdmin(req, res, next) {
  const configured = adminToken();
  if (!configured) return res.status(503).json({ error: "Admin token not configured" });
  const supplied = req.get("X-GoGlobal-Admin-Token") || "";
  if (supplied !== configured) return res.status(401).json({ error: "Admin access required" });
  next();
}

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

  const serperKey = serperApiKey();
  if (!serperKey) return res.status(500).json({ error: "SERPER_API_KEY not set" });

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
const ROMEY_VENUE_GUIDE = `ROMEY'S LAS VEGAS VENUE BRAIN:

POPULAR / CREDIBLE DINNER ANCHORS:
- Strip splurge: SW Steakhouse, Mizumi, Delilah, Bazaar Meat, Cote Korean Steakhouse, Carbone, Bavette's, Mott 32, Wing Lei, Joël Robuchon, Le Cirque.
- Hot/new: Gymkhana at Aria, Sartiano's at Wynn, Braseria by EDO, Cantina Contramar, Mother Wolf, Rare Society, Butcher and Thief.
- Niche/off-Strip/local: Esther's Kitchen, Lotus of Siam, Sparrow + Wolf, Raku, Partage, EDO Gastro Tapas, Moia Peruvian, Bob Taylor's Ranch House, Cleaver, Tacos El Gordo.
- Casual but high-signal: Secret Pizza, Miznon, China Poblano, Best Friend, Peppermill, Shang Artisan Noodle, 888 Japanese BBQ.

DESSERT / LIGHT SECOND-ACT TREATS:
- Strip/Core: Dominique Ansel, Milk Bar, Bellagio Patisserie, Dandelion Chocolate.
- Chinatown/local: Sweets Raku, Sweet Talk, Is Sweet Coffee & Dessert.
- Off-Strip/Henderson: Luv-It Frozen Custard, Sorry Not Sorry Creamery, Ethel M Chocolates.

NON-FOOD ANCHORS BY MOOD:
- Iconic Vegas: Bellagio Conservatory, Bellagio fountains, Eiffel Tower viewing deck, Gondola at Venetian, Neon Museum, Sphere exterior/photo stop, High Roller only when it truly fits.
- Games / arcades / pinball: Pinball Hall of Fame, Player 1 Video Game Bar, Game Nest Arcade, Emporium Arcade Bar, Play Playground at Luxor, Velocity Esports.
- Sports bars / watch parties: Circa Sportsbook, Stadium Swim, Beer Park, Flanker Kitchen + Sports Bar, TAP Sports Bar, Born and Raised, PKWY Tavern.
- Casinos / gambling moments: Circa casino floor, El Cortez, Ellis Island, Palms, Durango, Park MGM, Caesars Palace sportsbook. Use as one focused gambling stop, not vague casino-hopping.
- Adventure / active: Lake Las Vegas Aqua Park obstacle course, Lake Las Vegas Water Sports, Fly LINQ, TopGolf, Dig This, Pole Position Raceway, Las Vegas Mini Grand Prix.
- Outdoors / reset: Red Rock scenic loop, Calico Tanks, Valley of Fire, Seven Magic Mountains, Springs Preserve, Wetlands Park, Lake Las Vegas.
- Shows and culture: Absinthe, Cirque du Soleil O, Awakening, Atomic Saloon, The Magician's Study, Mob Museum, Punk Rock Museum, Beverly Theater, Galaxy Theatres Boulevard Mall.
- Wellness / low-key: Qua Baths & Spa, Awana Spa, Sahra Spa, Spa at Wynn, Red Rock Spa.
- Nightcap / lounges: Velveteen Rabbit, The Laundry Room, Golden Tiki, Rosina, Ski Lodge, Legacy Club, Skyfall Lounge, Ghost Donkey.

ROUTE CLUSTERS:
- Strip/LINQ: Bellagio, Aria, Cosmo, Caesars, Paris, Venetian/Palazzo, Wynn/Encore, Resorts World, Fontainebleau, Sphere, High Roller, Fly LINQ, Beer Park.
- South Strip/Town Square: Luxor, Mandalay Bay, MGM Grand, Pinball Hall of Fame, Town Square, Player 1, Galaxy Theatres Boulevard Mall.
- Downtown/Arts District: Circa, Fremont, Mob Museum, Neon Museum, Esther's Kitchen, Main Street, Velveteen Rabbit, Atomic Liquors.
- Chinatown/West: Spring Mountain, Lotus of Siam, Sparrow + Wolf, Raku, Sweets Raku, Golden Tiki, AREA15, Palms, Chinatown Plaza.
- Summerlin/Red Rock: Red Rock Canyon, Red Rock Resort, Tivoli Village, Downtown Summerlin.
- Henderson/Lake Las Vegas: Lake Las Vegas, Aqua Park, Ethel M Chocolates, Green Valley Ranch, Water Street, M Resort.

QUALITY BAR:
- Prefer specific, reservation-worthy, locally loved, playful, or genuinely iconic places.
- Avoid filler chains unless the user asks for cheap/casual.
- Avoid vague "explore the Strip" stops; every item needs an exact venue or bounded place.
- Keep plans geographically sane: same cluster when possible, or one clear nearby transfer. Do not bounce between far clusters.
- Never make the plan mostly food. A great GoGlobal route has one meal anchor and one or two events, activities, dessert, or afterglow stops.`;

const ROMANTIC_PLAN_ARCS = [
  {
    name: "Skyline Classic",
    sequence: "iconic view opener -> dinner anchor -> dessert or romantic walk",
    example: "High Roller golden-hour cabin -> dinner at Mizumi or Esther's Kitchen -> Dominique Ansel or Bellagio fountains",
  },
  {
    name: "Spa Cinema Slow Burn",
    sequence: "spa or wellness reset -> dinner anchor -> movie/show/low-key closer",
    example: "Awana Spa or Qua Baths -> dinner at Bavette's or Sparrow + Wolf -> Beverly Theater or Absinthe",
  },
  {
    name: "Art District Date",
    sequence: "gallery/neighborhood wander -> dinner anchor -> cocktail or dessert",
    example: "Arts District murals -> Esther's Kitchen or EDO -> Velveteen Rabbit or Luv-It",
  },
  {
    name: "Old Vegas Mood",
    sequence: "nostalgic opener -> classic dinner -> intimate nightcap",
    example: "Neon Museum -> Bob Taylor's Ranch House or Golden Steer-style steakhouse -> Laundry Room or Golden Tiki",
  },
  {
    name: "Big Swing Luxury",
    sequence: "spectacle opener -> splurge dinner -> polished nightcap",
    example: "Bellagio Conservatory/fountains -> SW Steakhouse or Joël Robuchon -> Skyfall Lounge",
  },
  {
    name: "Soft Adventure",
    sequence: "scenic outdoor moment -> relaxed dinner -> dessert",
    example: "Red Rock scenic loop -> Lotus of Siam or Partage -> Ethel M Chocolates",
  },
  {
    name: "Breakfast Trail Movie",
    sequence: "breakfast or coffee -> hike/scenic reset -> movie or low-key closer",
    example: "Mothership Coffee -> Calico Tanks or Springs Preserve -> Beverly Theater",
  },
  {
    name: "Lake Las Vegas Escape",
    sequence: "lake activity -> Henderson dinner anchor -> dessert or mellow closer",
    example: "Lake Las Vegas Aqua Park -> Hank's or Bottiglia at Green Valley Ranch -> Ethel M Chocolates",
  },
];

const PLATONIC_PLAN_ARCS = [
  {
    name: "Play Then Feast",
    sequence: "active/game opener -> one meal anchor -> playful closer",
    example: "TopGolf or Fly LINQ -> Tacos El Gordo or Best Friend -> Area15/Omega Mart",
  },
  {
    name: "Culture Crawl",
    sequence: "museum/culture opener -> one meal anchor -> speakeasy/mocktail closer",
    example: "Mob Museum -> Esther's Kitchen or China Poblano -> Golden Tiki or Mob Museum speakeasy",
  },
  {
    name: "Off-Strip Food Nerd",
    sequence: "neighborhood activity -> standout local meal -> dessert or arcade",
    example: "Chinatown wander -> Raku or Shang Artisan Noodle -> Sweets Raku or Pinball Hall of Fame",
  },
  {
    name: "Outdoor Reset",
    sequence: "outdoor scenic anchor -> casual meal -> easy social closer",
    example: "Seven Magic Mountains or Springs Preserve -> Secret Pizza or Peppermill -> High Roller",
  },
  {
    name: "High-Energy Night",
    sequence: "spectacle/activity -> one dinner anchor -> nightlife closer",
    example: "Absinthe or Sphere photo stop -> Cote or Momofuku -> Legacy Club or Ghost Donkey",
  },
  {
    name: "Sportsbook Social",
    sequence: "sports bar or sportsbook opener -> one meal anchor -> game/arcade closer",
    example: "Circa Sportsbook or Stadium Swim -> Carson Kitchen -> Emporium Arcade Bar",
  },
  {
    name: "Gamble And Play",
    sequence: "focused casino/gambling stop -> one meal anchor -> arcade/pinball closer",
    example: "El Cortez tables -> Barry's Downtown Prime -> Player 1 or Pinball Hall of Fame",
  },
  {
    name: "Lake Day Challenge",
    sequence: "Lake Las Vegas obstacle course -> casual dinner nearby -> dessert or movie",
    example: "Lake Las Vegas Aqua Park -> Bottiglia or Water Street dining -> Ethel M Chocolates or Galaxy Theatres",
  },
];

const HUDDLE_PLAN_ARCS = [
  ...ROMANTIC_PLAN_ARCS,
  ...PLATONIC_PLAN_ARCS,
  {
    name: "Surprise Me, But Cohesive",
    sequence: "one iconic Vegas moment -> one excellent meal -> one unexpected closer",
    example: "Neon Museum -> Gymkhana or Esther's Kitchen -> Lost Spirits or Velveteen Rabbit",
  },
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function formatPlanArc(arc) {
  return `${arc.name}: ${arc.sequence}. Example shape only: ${arc.example}.`;
}

function isDessertStop(item) {
  const text = `${item?.type || ""} ${item?.title || ""}`.toLowerCase();
  return /dessert|custard|creamery|patisserie|chocolate|gelato|bakery|sweets|milk bar|dominique ansel/.test(text);
}

function isFullMealStop(item) {
  if (isDessertStop(item)) return false;
  const type = String(item?.type || "").toLowerCase();
  if (/dining|dinner|restaurant|meal|brunch|lunch/.test(type)) return true;
  if (/experience|adventure|nightlife|show|outdoors|wellness|movie|activity|casino|sports|arcade|bar|lounge/.test(type)) {
    return false;
  }

  const titleText = `${item?.title || ""} ${item?.yelpQuery || ""}`.toLowerCase();
  return /restaurant|steakhouse|supper|brunch|lunch|pizza|tacos|ramen|thai|sushi|tasting menu/.test(titleText);
}

function normalizeVenueTitle(title = "") {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SERVER_ROUTE_GROUPS = [
  {
    group: "strip-linq",
    aliases: ["strip", "bellagio", "cosmopolitan", "cosmo", "aria", "caesars", "paris", "venetian", "palazzo", "wynn", "encore", "resorts world", "fontainebleau", "sphere", "high roller", "linq", "fly linq", "beer park", "park mgm", "best friend", "brooklyn bowl", "ellis island", "mott 32", "bavette", "carbone", "delilah", "mizumi", "sw steakhouse"],
  },
  {
    group: "south-strip",
    aliases: ["luxor", "mandalay", "mgm grand", "pinball hall of fame", "town square", "player 1", "galaxy theatres boulevard", "play playground", "tropicana", "welcome to fabulous"],
  },
  {
    group: "downtown-arts",
    aliases: ["downtown", "fremont", "circa", "stadium swim", "mob museum", "neon museum", "el cortez", "arts district", "main street", "springs preserve", "esther", "velveteen rabbit", "atomic", "carson kitchen", "barry's downtown prime", "legacy club", "container park", "able baker", "laundry room", "emporium arcade"],
  },
  {
    group: "chinatown-west",
    aliases: ["chinatown", "spring mountain", "lotus of siam", "sparrow + wolf", "sparrow and wolf", "raku", "sweets raku", "golden tiki", "game nest", "area15", "area 15", "omega mart", "palms", "rio", "mas por favor", "shang artisan", "moia", "partage"],
  },
  {
    group: "summerlin-red-rock",
    aliases: ["red rock", "summerlin", "calico", "scenic loop", "tivoli", "downtown summerlin", "charleston", "red rock canyon", "red rock spa"],
  },
  {
    group: "henderson-lake-las-vegas",
    aliases: ["lake las vegas", "aqua park", "water sports", "henderson", "green valley", "ethel m", "water street", "m resort", "bottiglia", "hank's"],
  },
  {
    group: "valley-of-fire",
    aliases: ["valley of fire", "fire wave", "atlatl rock", "mouse's tank"],
  },
];

const COMPATIBLE_ROUTE_GROUPS = new Set([
  "south-strip|strip-linq",
  "chinatown-west|strip-linq",
  "chinatown-west|south-strip",
  "downtown-arts|strip-linq",
  "chinatown-west|downtown-arts",
  "chinatown-west|summerlin-red-rock",
  "henderson-lake-las-vegas|south-strip",
]);

function routeText(item) {
  return `${item?.title || ""} ${item?.type || ""} ${item?.description || ""} ${item?.yelpQuery || ""}`.toLowerCase();
}

function inferRouteGroup(item) {
  const text = routeText(item);
  const match = SERVER_ROUTE_GROUPS.find(({ aliases }) => aliases.some((alias) => text.includes(alias)));
  return match?.group || null;
}

function routeGroupsAreCompatible(groups) {
  if (groups.length <= 1) return true;
  if (groups.length > 2) return false;
  const key = [...groups].sort().join("|");
  return COMPATIBLE_ROUTE_GROUPS.has(key);
}

function validateRouteCoherence(items) {
  const knownGroups = items.map(inferRouteGroup).filter(Boolean);
  const uniqueGroups = [...new Set(knownGroups)];
  if (!routeGroupsAreCompatible(uniqueGroups)) {
    return `Route is too spread out (${uniqueGroups.join(" -> ")}). Keep stops in one cluster or one nearby transfer.`;
  }

  const transitions = knownGroups.slice(1).filter((group, i) => group !== knownGroups[i]).length;
  if (transitions > 1) {
    return "Route bounces between neighborhoods. Order the stops so the plan moves cleanly instead of zig-zagging.";
  }

  return null;
}

function validateItineraryShape(items, isRomantic, recentVenues = []) {
  if (!Array.isArray(items) || items.length < 3) return "Itinerary needs at least 3 real stops.";
  const names = items.map((item) => normalizeVenueTitle(item?.title)).filter(Boolean);
  if (new Set(names).size !== names.length) return "Duplicate venue titles in the same itinerary. Every stop must be unique.";
  const repeatedRecent = names.find((name) => recentVenues.some((recent) => {
    const recentName = normalizeVenueTitle(recent);
    if (!recentName) return false;
    return recentName.includes(name) || name.includes(recentName);
  }));
  if (repeatedRecent) return "Itinerary repeated a recently suggested venue. Use fresh alternatives.";
  const routeIssue = validateRouteCoherence(items);
  if (routeIssue) return routeIssue;
  const mealCount = items.filter(isFullMealStop).length;
  const dessertCount = items.filter(isDessertStop).length;
  const nonMealCount = items.filter((item) => !isFullMealStop(item) && !isDessertStop(item)).length;
  if (mealCount > 1) return "Too many full meal stops. Use exactly one dinner/meal anchor, plus activities or dessert.";
  if (mealCount < 1) return "Missing one strong dinner/meal anchor.";
  if (nonMealCount < 2 && !(nonMealCount >= 1 && dessertCount >= 1)) return isRomantic
    ? "A date needs either two non-food moments, or one strong event plus a dessert/light closer."
    : "A hangout needs either two activity moments, or one strong event plus a dessert/light closer.";
  return null;
}

async function callVeniceItinerary(veniceKey, prompt) {
  const veniceRes = await fetch("https://api.venice.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${veniceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "venice-uncensored",
      temperature: 0.95,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!veniceRes.ok) {
    const err = await veniceRes.json().catch(() => ({}));
    const message = err?.error?.message || `Venice HTTP ${veniceRes.status}`;
    throw Object.assign(new Error(message), { provider: "Venice", status: veniceRes.status });
  }

  const data = await veniceRes.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("empty response from Venice");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no JSON found in Venice response");
  return JSON.parse(match[0]);
}

async function callGeminiItinerary(key, prompt) {
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.92 },
      }),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.json().catch(() => ({}));
    const message = err?.error?.message || `Gemini HTTP ${geminiRes.status}`;
    throw Object.assign(new Error(message), { provider: "Gemini", status: geminiRes.status });
  }

  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("empty response from Gemini");
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

const LOCAL_ITINERARY_TEMPLATES = {
  romantic: [
    {
      name: "Skyline Glow",
      stops: [
        { time: "6:00 PM", title: "High Roller Observation Wheel", type: "Experience", description: "Start with skyline views and a built-in first scene before the dinner anchor.", yelpQuery: "High Roller Las Vegas", cost: 28, vibes: ["Romantic", "Scenic"], age21: false },
        { time: "7:45 PM", title: "Mizumi at Wynn", type: "Dining", description: "A polished dinner anchor with garden views, strong service, and enough ceremony to feel intentional.", yelpQuery: "Mizumi Wynn Las Vegas", cost: 115, vibes: ["Romantic", "Luxury"], age21: false },
        { time: "9:30 PM", title: "Bellagio Fountains", type: "Experience", description: "Close with a free classic that gives the night a cinematic ending without adding another heavy stop.", yelpQuery: "Bellagio Fountains Las Vegas", cost: 0, vibes: ["Romantic", "Iconic"], age21: false },
      ],
    },
    {
      name: "Arts District Slow Burn",
      stops: [
        { time: "5:45 PM", title: "Arts District Murals on Main Street", type: "Experience", description: "Ease in with a low-pressure walk through local murals, shops, and street texture.", yelpQuery: "Las Vegas Arts District Main Street", cost: 0, vibes: ["Artsy", "Local"], age21: false },
        { time: "7:15 PM", title: "Esther's Kitchen", type: "Dining", description: "Use Esther's as the one dinner anchor: local-loved, warm, and far less generic than Strip filler.", yelpQuery: "Esther's Kitchen Las Vegas", cost: 58, vibes: ["Romantic", "Local"], age21: false },
        { time: "9:00 PM", title: "Velveteen Rabbit", type: "Nightlife", description: "Finish nearby with a creative cocktail room that keeps the route compact and intimate.", yelpQuery: "Velveteen Rabbit Las Vegas", cost: 22, vibes: ["Cozy", "Nightlife"], age21: true },
      ],
    },
    {
      name: "Spa To Screen",
      stops: [
        { time: "5:30 PM", title: "Awana Spa at Resorts World", type: "Wellness", description: "Begin with a reset that makes the night feel personal before anything loud or crowded.", yelpQuery: "Awana Spa Resorts World Las Vegas", cost: 95, vibes: ["Luxury", "Relaxed"], age21: false },
        { time: "7:45 PM", title: "Brezza", type: "Dining", description: "Anchor dinner with polished Italian inside the same resort corridor, keeping logistics easy.", yelpQuery: "Brezza Resorts World Las Vegas", cost: 72, vibes: ["Romantic", "Refined"], age21: false },
        { time: "9:45 PM", title: "The Beverly Theater", type: "Movie", description: "Close with a curated film or intimate screening room instead of defaulting to another restaurant.", yelpQuery: "The Beverly Theater Las Vegas", cost: 18, vibes: ["Low-key", "Culture"], age21: false },
      ],
    },
    {
      name: "Old Vegas Date",
      stops: [
        { time: "6:00 PM", title: "The Neon Museum", type: "Experience", description: "Open with old Vegas glow and a specific sense of place before the meal.", yelpQuery: "The Neon Museum Las Vegas", cost: 28, vibes: ["Romantic", "Nostalgic"], age21: false },
        { time: "7:45 PM", title: "Barry's Downtown Prime", type: "Dining", description: "Make dinner the only full meal: classic steakhouse energy without bouncing back to the Strip.", yelpQuery: "Barry's Downtown Prime Las Vegas", cost: 86, vibes: ["Classic", "Luxury"], age21: false },
        { time: "9:45 PM", title: "Legacy Club", type: "Nightlife", description: "End with a skyline nightcap nearby so the plan lands with a view, not a second dinner.", yelpQuery: "Legacy Club Circa Las Vegas", cost: 26, vibes: ["Views", "Nightlife"], age21: true },
      ],
    },
    {
      name: "Lake Las Vegas Escape",
      stops: [
        { time: "3:30 PM", title: "Lake Las Vegas Aqua Park", type: "Adventure", description: "Turn the date into a playful obstacle-course challenge on the water before the polished part of the night.", yelpQuery: "Lake Las Vegas Aqua Park Henderson", cost: 30, vibes: ["Playful", "Adventure"], age21: false },
        { time: "6:15 PM", title: "Bottiglia Cucina & Enoteca", type: "Dining", description: "Keep dinner close at Green Valley Ranch with an airy Italian anchor that still feels like a proper date.", yelpQuery: "Bottiglia Cucina Enoteca Green Valley Ranch", cost: 62, vibes: ["Romantic", "Refined"], age21: false },
        { time: "8:15 PM", title: "Ethel M Chocolates Cactus Garden", type: "Dessert", description: "Finish nearby with chocolate and a garden walk instead of stacking another restaurant.", yelpQuery: "Ethel M Chocolates Cactus Garden Henderson", cost: 16, vibes: ["Sweet", "Low-key"], age21: false },
      ],
    },
    {
      name: "Breakfast Trail Movie",
      stops: [
        { time: "9:00 AM", title: "Mothership Coffee Roasters", type: "Dining", description: "Start with a light breakfast that gives the morning structure without eating the whole budget.", yelpQuery: "Mothership Coffee Roasters Las Vegas", cost: 18, vibes: ["Casual", "Local"], age21: false },
        { time: "10:30 AM", title: "Springs Preserve", type: "Outdoors", description: "Use Springs Preserve as the easy nature reset: close to town, walkable, and more personal than another casino stop.", yelpQuery: "Springs Preserve Las Vegas", cost: 19, vibes: ["Outdoors", "Calm"], age21: false },
        { time: "1:15 PM", title: "The Beverly Theater", type: "Movie", description: "Close the daytime date with a curated movie setting that feels intentional after the walk.", yelpQuery: "The Beverly Theater Las Vegas", cost: 18, vibes: ["Culture", "Low-key"], age21: false },
      ],
    },
  ],
  platonic: [
    {
      name: "Play Then Feast",
      stops: [
        { time: "6:00 PM", title: "AREA15", type: "Activity", description: "Start with a weird, high-energy shared playground so the hangout has an immediate hook.", yelpQuery: "AREA15 Las Vegas", cost: 25, vibes: ["Social", "Artsy"], age21: false },
        { time: "7:45 PM", title: "Best Friend by Roy Choi", type: "Dining", description: "Use one loud, fun dinner anchor that works for groups and keeps the night from becoming a food crawl.", yelpQuery: "Best Friend Roy Choi Las Vegas", cost: 48, vibes: ["Social", "Fun"], age21: false },
        { time: "9:30 PM", title: "Brooklyn Bowl", type: "Activity", description: "Close with something active and social so the group still has momentum after dinner.", yelpQuery: "Brooklyn Bowl Las Vegas", cost: 24, vibes: ["Active", "Social"], age21: false },
      ],
    },
    {
      name: "Chinatown Food Nerd",
      stops: [
        { time: "5:45 PM", title: "Chinatown Plaza", type: "Experience", description: "Open with a quick neighborhood wander so the route feels local instead of casino-default.", yelpQuery: "Chinatown Plaza Las Vegas", cost: 0, vibes: ["Local", "Low-key"], age21: false },
        { time: "7:00 PM", title: "Shang Artisan Noodle", type: "Dining", description: "Anchor with a popular, affordable noodle spot that gives the group a specific food win.", yelpQuery: "Shang Artisan Noodle Las Vegas", cost: 22, vibes: ["Local", "Casual"], age21: false },
        { time: "8:45 PM", title: "Sweets Raku", type: "Dessert", description: "Finish with dessert theater nearby, keeping the second food stop lighter and more memorable.", yelpQuery: "Sweets Raku Las Vegas", cost: 18, vibes: ["Dessert", "Niche"], age21: false },
        { time: "10:00 PM", title: "Pinball Hall of Fame", type: "Activity", description: "Add a cheap, playful closer so the route has another shared activity after dessert.", yelpQuery: "Pinball Hall of Fame Las Vegas", cost: 12, vibes: ["Playful", "Low-key"], age21: false },
      ],
    },
    {
      name: "Desert Reset",
      stops: [
        { time: "4:45 PM", title: "Red Rock Canyon Scenic Loop", type: "Outdoors", description: "Start outside the neon with a scenic group reset before heading back toward dinner.", yelpQuery: "Red Rock Canyon Scenic Loop Las Vegas", cost: 20, vibes: ["Adventure", "Scenic"], age21: false },
        { time: "7:15 PM", title: "Lotus of Siam", type: "Dining", description: "Make Lotus the single dinner anchor: credible, beloved, and worth planning around.", yelpQuery: "Lotus of Siam Las Vegas", cost: 42, vibes: ["Local", "Iconic"], age21: false },
        { time: "9:00 PM", title: "Game Nest Arcade", type: "Activity", description: "Close on Spring Mountain with private-room arcade energy instead of another reservation.", yelpQuery: "Game Nest Arcade Las Vegas", cost: 15, vibes: ["Playful", "Low-key"], age21: false },
      ],
    },
    {
      name: "Downtown Culture Crawl",
      stops: [
        { time: "5:30 PM", title: "The Mob Museum", type: "Experience", description: "Open with a real Vegas story anchor that gives the group something to talk about.", yelpQuery: "The Mob Museum Las Vegas", cost: 35, vibes: ["Culture", "Fun"], age21: false },
        { time: "7:30 PM", title: "Carson Kitchen", type: "Dining", description: "Use a downtown dinner anchor that is social, shareable, and not a generic casino pick.", yelpQuery: "Carson Kitchen Las Vegas", cost: 46, vibes: ["Social", "Local"], age21: false },
        { time: "9:15 PM", title: "Fremont Street Experience", type: "Experience", description: "End with spectacle and people-watching nearby, keeping the night compact and easy.", yelpQuery: "Fremont Street Experience Las Vegas", cost: 0, vibes: ["Energetic", "Iconic"], age21: false },
      ],
    },
    {
      name: "Sportsbook Arcade Loop",
      stops: [
        { time: "5:30 PM", title: "Circa Sportsbook", type: "Activity", description: "Start with a huge sports-screen moment where the group can watch, wager, and pick a side together.", yelpQuery: "Circa Sportsbook Las Vegas", cost: 25, vibes: ["Sports", "Energetic"], age21: true },
        { time: "7:15 PM", title: "Carson Kitchen", type: "Dining", description: "Make dinner the single downtown anchor: shareable, social, and close enough to keep the route tight.", yelpQuery: "Carson Kitchen Las Vegas", cost: 46, vibes: ["Social", "Local"], age21: false },
        { time: "9:00 PM", title: "Emporium Arcade Bar", type: "Activity", description: "Close with games and friendly competition instead of drifting into a second restaurant.", yelpQuery: "Emporium Arcade Bar Las Vegas", cost: 18, vibes: ["Arcade", "Playful"], age21: true },
      ],
    },
    {
      name: "Casino And Pinball",
      stops: [
        { time: "5:15 PM", title: "Ellis Island Casino", type: "Activity", description: "Open with a focused, low-roller gambling stop that feels more local than a giant Strip casino wander.", yelpQuery: "Ellis Island Casino Las Vegas", cost: 35, vibes: ["Casino", "Casual"], age21: true },
        { time: "7:00 PM", title: "Best Friend by Roy Choi", type: "Dining", description: "Use one loud dinner anchor nearby so the night has a real meal without turning into a food crawl.", yelpQuery: "Best Friend Roy Choi Las Vegas", cost: 48, vibes: ["Social", "Fun"], age21: false },
        { time: "8:45 PM", title: "Pinball Hall of Fame", type: "Activity", description: "End with a cheap, memorable pinball run that gives the group another shared event.", yelpQuery: "Pinball Hall of Fame Las Vegas", cost: 12, vibes: ["Pinball", "Playful"], age21: false },
      ],
    },
    {
      name: "Lake Day Challenge",
      stops: [
        { time: "2:30 PM", title: "Lake Las Vegas Aqua Park", type: "Adventure", description: "Build the hangout around the floating obstacle course so the plan has a genuinely different main event.", yelpQuery: "Lake Las Vegas Aqua Park Henderson", cost: 30, vibes: ["Adventure", "Playful"], age21: false },
        { time: "5:30 PM", title: "Bottiglia Cucina & Enoteca", type: "Dining", description: "Keep dinner in the Henderson corridor with a bright, group-friendly anchor instead of dragging everyone back to the Strip.", yelpQuery: "Bottiglia Cucina Enoteca Green Valley Ranch", cost: 45, vibes: ["Social", "Refined"], age21: false },
        { time: "7:30 PM", title: "Ethel M Chocolates Cactus Garden", type: "Dessert", description: "Close nearby with dessert and an easy walk so the route stays coherent.", yelpQuery: "Ethel M Chocolates Cactus Garden Henderson", cost: 16, vibes: ["Dessert", "Low-key"], age21: false },
      ],
    },
  ],
};

function stopWasRecent(stop, recentVenues) {
  const title = normalizeVenueTitle(stop.title || "");
  return Array.isArray(recentVenues) && recentVenues.some((name) => {
    const recent = normalizeVenueTitle(name);
    if (!recent) return false;
    return title && (recent.includes(title) || title.includes(recent));
  });
}

function templateCost(template) {
  return template.stops.reduce((sum, stop) => sum + (Number(stop.cost) || 0), 0);
}

function templateSearchText(template) {
  return [
    template.name,
    ...template.stops.flatMap((stop) => [stop.title, stop.type, stop.description, stop.yelpQuery, ...(stop.vibes || [])]),
  ].filter(Boolean).join(" ").toLowerCase();
}

function templatePreferenceScore(template, preferenceText) {
  const text = templateSearchText(template);
  const pref = String(preferenceText || "").toLowerCase();
  if (!pref.trim()) return 0;

  const intentGroups = [
    ["lake", "obstacle", "water", "aqua", "paddle", "henderson"],
    ["sports", "game", "watch party", "sportsbook", "stadium"],
    ["casino", "gamble", "gambling", "blackjack", "poker", "slots"],
    ["arcade", "pinball", "games", "play"],
    ["hike", "trail", "red rock", "outdoors", "nature"],
    ["movie", "cinema", "theater", "film"],
    ["dessert", "sweet", "chocolate", "ice cream"],
    ["spa", "wellness", "relax"],
  ];

  return intentGroups.reduce((score, keywords) => {
    const requested = keywords.some((keyword) => pref.includes(keyword));
    const offered = keywords.some((keyword) => text.includes(keyword));
    return score + (requested && offered ? 1 : 0);
  }, 0);
}

function preferenceMatchedTemplates(candidates, preferenceText) {
  const pref = String(preferenceText || "").toLowerCase();
  if (!pref.trim()) return [];

  const wantsLake = /lake|obstacle|aqua|water sport|paddle/.test(pref);
  const wantsSportsCasino = /sports|sports bar|sportsbook|watch party|casino|gambl|blackjack|poker|slots/.test(pref);
  const wantsArcade = /arcade|pinball|video game|games/.test(pref);
  const wantsMorningOutdoors = /breakfast|coffee|hike|trail|movie|cinema|film/.test(pref);
  const wantsSpa = /spa|wellness|relax|massage/.test(pref);

  if (wantsSportsCasino && wantsArcade) {
    const combinedMatches = candidates.filter((template) =>
      /sportsbook|casino|pinball|emporium arcade|player 1|play playground/.test(templateSearchText(template))
    );
    if (combinedMatches.length) return combinedMatches;
  }

  const matches = candidates.filter((template) => {
    const text = templateSearchText(template);
    if (wantsLake && /lake las vegas|aqua park|henderson/.test(text)) return true;
    if (wantsSportsCasino && wantsArcade && /sportsbook|casino|pinball|emporium arcade|player 1|play playground/.test(text)) return true;
    if (wantsSportsCasino && /sportsbook|casino|stadium swim|sports bar|wager/.test(text)) return true;
    if (wantsArcade && /arcade|pinball|game nest|play playground/.test(text)) return true;
    if (wantsMorningOutdoors && /breakfast|coffee|hike|trail|springs preserve|movie|theater/.test(text)) return true;
    if (wantsSpa && /spa|wellness|massage|baths/.test(text)) return true;
    return false;
  });

  return matches;
}

function buildLocalItinerary({ type, budget, vibes, age, specialRequest, recentVenues }) {
  const isRomantic = type === "romantic";
  const pool = LOCAL_ITINERARY_TEMPLATES[isRomantic ? "romantic" : "platonic"]
    .filter(template => age >= 21 || !template.stops.some(stop => stop.age21));
  const affordable = pool.filter(template => templateCost(template) <= Number(budget || 200) * 1.05);
  const fresh = affordable.filter(template => !template.stops.some(stop => stopWasRecent(stop, recentVenues)));
  const candidates = fresh.length ? fresh : affordable.length ? affordable : pool;
  const preferenceText = [specialRequest, ...(vibes || [])].filter(Boolean).join(" ");
  const preferenceMatches = preferenceMatchedTemplates(candidates, preferenceText);
  const selectionPool = preferenceMatches.length ? preferenceMatches : (candidates.length ? candidates : pool);
  const scored = selectionPool
    .map((template) => ({ template, score: templatePreferenceScore(template, preferenceText) }));
  const bestScore = Math.max(0, ...scored.map(({ score }) => score));
  const bestCandidates = bestScore > 0
    ? scored.filter(({ score }) => score === bestScore).map(({ template }) => template)
    : scored.map(({ template }) => template);
  const selected = pickRandom(bestCandidates);
  const requestTail = specialRequest
    ? ` Tuned for the request: ${String(specialRequest).slice(0, 90)}.`
    : "";

  return {
    provider: "local",
    items: selected.stops.map((stop, i) => ({
      ...stop,
      id: `local-${Date.now()}-${i}`,
      description: `${stop.description}${requestTail}`,
      vibes: vibes?.length ? [...new Set([...stop.vibes, ...vibes])].slice(0, 4) : stop.vibes,
    })),
  };
}

const HUDDLE_SYSTEM_PROMPT = `You are Romey, Master AI Architect and Lead Concierge for GoGlobal. You curate legendary Las Vegas experiences by coordinating a Huddle of specialist bots.

Your Huddle:
- BudgetBot: Tracks every dollar. Ensures total itinerary cost stays within 5% of the user's stated budget.
- AestheticBot: Generates exactly 8 cinematic image search queries per response to visualize the experience.
- QABot: Validates every recommendation for real-world feasibility, route logic, and variety. Requires 75-120 minute spacing between venues.
- MemoryBot: Reads the user's saved favorites to personalize the plan. Avoids repeating saved places.

STRICT RULES:
1. Output ONLY valid JSON. Zero markdown. Zero text outside the JSON object.
2. Itinerary must have exactly 3-4 items. Each with a realistic USD cost.
3. Total itinerary costs must not exceed 5% over the user's stated budget.
4. atmospheric_images must have EXACTLY 8 cinematic, location-specific search queries.
5. For "Other" or LGBTQ+ orientations: prioritize LGBTQ+-welcoming venues (Piranha Nightclub, The Garage Bar, Art Bar, Therapy Bar Las Vegas, Krave Massive, Hamburger Mary's).
6. huddle_logs must include one entry per bot: BudgetBot, QABot, AestheticBot, MemoryBot.
7. All venue times must be realistic for Las Vegas (venues open, 90-min minimum spacing).
8. Never output more than one full restaurant/dinner stop. Dessert, coffee, cocktail, spa, show, movie, walk, museum, view, or adventure can be separate stops.
9. Every itinerary must follow an arc: opener -> one dinner/meal anchor -> different-feeling closer. No same-category pileups.
10. Keep stops geographically coherent: one route cluster, or one short transfer between compatible clusters.
11. Prefer niche, local-loved, currently credible, playful, or iconic venues from this guide:
${ROMEY_VENUE_GUIDE}

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

const ROMEY_CHAT_SYSTEM_PROMPT = `You are Romey, the GoGlobal concierge — a sophisticated, witty, and deeply knowledgeable guide to Las Vegas. Your personality shifts based on the user's selected vibe:

VIBE: High Adventure → You're a thrill-seeking insider. Direct, energetic, vivid action language. You know every ATV trail, every bungee cord, every secret rooftop.
VIBE: Intimate & Refined → You're a luxury concierge. Measured, evocative, understated. You speak of ambiance, exclusivity, hidden courtyards, and Michelin stars.
VIBE: Default → Balanced warmth with dry wit. Professional but never stiff.

RULES:
- Never use generic filler. Every response must contain at least one specific venue, address, or insider tip.
- Keep responses under 120 words unless the user asks for detail.
- If asked about pricing, give real approximate ranges.
- Reference the user's vibe naturally, never break character.
- Recommend exact places from Romey's venue brain. Favor niche/local-loved or popular credible picks over generic filler.
- Do not suggest three similar restaurants as a plan. Shape recommendations as an evening arc: opener, one strong meal, closer.
- If the user asks for a date idea or hangout, think in combinations like sports bar -> dinner -> arcade, casino tables -> dinner -> pinball, Lake Las Vegas Aqua Park -> Henderson dinner -> dessert, breakfast -> hike -> movie, spa -> dinner -> movie, or museum -> dinner -> nightcap.
- Keep locations close enough to make sense. Do not bounce users across distant Vegas corridors unless the user asked for a day-trip adventure.
- Avoid repeating the same obvious defaults. High Roller is allowed only when it is the best fit, not as a reflex.
- End responses with a subtle follow-up question to keep the conversation flowing.

${ROMEY_VENUE_GUIDE}`;

app.post("/api/romey-chat", async (req, res) => {
  const { messages = [], vibe = "default" } = req.body || {};
  const key = geminiApiKey();
  if (!key) return res.status(500).json({ error: "Gemini API key not configured" });
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  const contents = messages
    .slice(-12)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.text || "").slice(0, 2000) }],
    }))
    .filter((m) => m.parts[0].text.trim());

  if (contents.length === 0) return res.status(400).json({ error: "message text required" });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: `${ROMEY_CHAT_SYSTEM_PROMPT}\n\nCurrent vibe: ${vibe}` }] },
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error("[Romey chat] Gemini error:", err?.error?.message ?? geminiRes.status);
      return res.status(502).json({ error: "Romey chat failed" });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) return res.status(502).json({ error: "empty response from Gemini" });
    res.json({ reply });
  } catch (err) {
    console.error("[Romey chat]", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/generate", async (req, res) => {
  const { vibe, orientation, budget, favorites = [] } = req.body || {};
  if (!vibe || !budget) return res.status(400).json({ error: "vibe and budget are required" });

  const key = geminiApiKey();
  if (!key) return res.status(500).json({ error: "Gemini API key not configured" });

  const favSummary = favorites.length > 0
    ? favorites.map(f => f.name || f.title || f.artist || f.label).filter(Boolean).slice(0, 8).join(", ")
    : "None saved yet";
  const vibeLabel = vibe === "intimate" ? "Intimate & Refined" : vibe === "highAdventure" ? "High Adventure" : "Spontaneous Mix";
  const planArc = pickRandom(HUDDLE_PLAN_ARCS);
  const userPrompt = `Plan a ${vibeLabel} Las Vegas evening. Orientation: ${orientation || "Any"}. Total budget: $${budget}. User favorites for personalization: ${favSummary}.

Required plan arc for this run: ${formatPlanArc(planArc)}
Make it feel hand-curated, not like a generic list. Use one strong meal and surround it with different kinds of experiences.`;

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
          generationConfig: { responseMimeType: "application/json", temperature: 0.95 },
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
// Body: { type, budget, vibes[], age, sexuality, otherOrientation, specialRequest, recentVenues[] }
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
    recentVenues = [],
  } = req.body || {};

  const veniceKey = process.env.VENICE_API_KEY;

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
  const recentVenueNote = Array.isArray(recentVenues) && recentVenues.length
    ? `Avoid these recently suggested venues unless the user explicitly asked for them: ${recentVenues.slice(0, 16).join(", ")}. Use fresh alternatives in the same quality tier.`
    : "";
  const ageNote = !isRomantic && age < 21 ? "Group is UNDER 21 — absolutely NO bars, clubs, or alcohol venues." : "";
  const typeNote = isRomantic
    ? "This is a ROMANTIC date night for two. Think intimate, special, memorable."
    : `This is a PLATONIC hangout${age < 21 ? " for people under 21" : " for adults 21+"}. Fun, social, energetic.`;
  const selectedArc = pickRandom(isRomantic ? ROMANTIC_PLAN_ARCS : PLATONIC_PLAN_ARCS);

  const prompt = `You are Romey, GoGlobal's Las Vegas AI concierge. Generate a fresh, specific Las Vegas itinerary tailored exactly to what this person wants.

${typeNote}
Budget: $${budget} — ${budgetNote}
Required itinerary arc for this run: ${formatPlanArc(selectedArc)}
${orientationNote}
${vibeNote}
${requestNote}
${recentVenueNote}
${ageNote}

${ROMEY_VENUE_GUIDE}

ORGANIZATION REQUIREMENTS:
- Build an arc, not a list. Good examples: sports bar -> dinner -> arcade; casino tables -> dinner -> pinball; Lake Las Vegas Aqua Park -> Henderson dinner -> dessert; breakfast -> hike -> movie; spa -> dinner -> movie; Neon Museum -> dinner -> nightcap.
- Exactly one full dinner/meal anchor. Never output 2+ restaurant stops. Dessert, coffee, cocktails, a movie, spa, view, museum, show, sports bar, casino, arcade, pinball, or walk are different categories and are allowed.
- Include either two non-food moments, or one substantial event/activity plus dessert/light closer. A great plan should have movement and contrast.
- Keep geography coherent: same resort/corridor/neighborhood when possible; use at most one short transfer between compatible route clusters. Do not bounce Summerlin -> Strip -> Henderson.
- Randomize the combination, but keep it believable. Do not default to the same obvious trio every time; if recent venues are listed, use completely different titles.
- For restaurants, prefer the venue brain's popular/current or niche/local-loved options over generic tourist filler.
- Make every description explain why that stop fits this user, vibe, budget, and arc.

Output ONLY valid JSON. No markdown. No text outside the JSON object:
{
  "items": [
    {
      "id": "gen-1",
      "time": "6:00 PM",
      "title": "Exact Venue Name",
      "type": "Dining|Dessert|Experience|Adventure|Nightlife|Show|Outdoors|Wellness|Movie|Activity",
      "description": "One vivid, specific sentence tailored to this user's request.",
      "yelpQuery": "Venue Name Las Vegas",
      "cost": 45,
      "vibes": ["Romantic", "Luxury"],
      "age21": false
    }
  ]
}

Rules:
- Exactly 3-4 items
- Times 75+ min apart for major stops, realistic for Las Vegas
- Total cost within $${budget}
- age21: true only for bars/clubs/alcohol-focused venues
- No more than one item may have type "Dining"
- Dessert must use type "Dessert", not "Dining"
- Every title in this response must be unique and must not appear in the recent venue list
- Route must stay in one Vegas cluster or one compatible nearby transfer
- Make it personal — honor the special request above all else`;

  console.log(`[Itinerary] type=${type} budget=$${budget} sexuality=${sexuality} vibes=[${vibes}] request="${specialRequest.slice(0, 40)}"`);

  try {
    let parsed = null;
    let provider = "local";

    if (veniceKey) {
      try {
        parsed = await callVeniceItinerary(veniceKey, prompt);
        provider = "Venice";
      } catch (veniceErr) {
        console.warn(`[Itinerary] Venice unavailable (${veniceErr.status || "error"}): ${veniceErr.message}`);
      }
    } else {
      console.warn("[Itinerary] Venice key not configured — trying fallback providers");
    }

    if (!parsed) {
      const key = geminiApiKey();
      if (key) {
        try {
          parsed = await callGeminiItinerary(key, prompt);
          provider = "Gemini";
        } catch (geminiErr) {
          console.warn(`[Itinerary] Gemini fallback failed (${geminiErr.status || "error"}): ${geminiErr.message}`);
        }
      }
    }

    if (!parsed) {
      parsed = buildLocalItinerary({ type, budget, vibes, age, specialRequest, recentVenues });
      provider = "local";
    }

    const shapeIssue = validateItineraryShape(parsed.items, isRomantic, recentVenues);
    if (shapeIssue) {
      console.warn(`[Itinerary] repairing shape: ${shapeIssue}`);
      const repairPrompt = `${prompt}

The previous response failed this quality check: ${shapeIssue}
Repair it now. Preserve the same user preferences and required arc, but output a cleaner itinerary with exactly one full meal anchor, a coherent route, fresh venue titles, and either two non-food moments or one strong event plus dessert/light closer.

Previous JSON:
${JSON.stringify(parsed).slice(0, 4000)}`;

      try {
        const key = geminiApiKey();
        if (provider === "Venice" && veniceKey) {
          parsed = await callVeniceItinerary(veniceKey, repairPrompt);
        } else if (key) {
          parsed = await callGeminiItinerary(key, repairPrompt);
          provider = "Gemini";
        } else {
          parsed = buildLocalItinerary({ type, budget, vibes, age, specialRequest, recentVenues });
          provider = "local";
        }
      } catch (repairErr) {
        console.warn(`[Itinerary] repair fallback failed: ${repairErr.message}`);
        parsed = buildLocalItinerary({ type, budget, vibes, age, specialRequest, recentVenues });
        provider = "local";
      }
    }

    const finalIssue = validateItineraryShape(parsed.items, isRomantic, recentVenues);
    if (finalIssue) {
      console.warn(`[Itinerary] final fallback after quality issue: ${finalIssue}`);
      parsed = buildLocalItinerary({ type, budget, vibes, age, specialRequest, recentVenues });
      provider = "local";
    }

    const lastIssue = validateItineraryShape(parsed.items, isRomantic, recentVenues);
    if (lastIssue) return res.status(502).json({ error: `Itinerary quality check failed: ${lastIssue}` });

    const stamp = Date.now();
    parsed.items = (parsed.items || []).map((it, i) => ({ ...it, id: `gen-${stamp}-${i}` }));
    parsed.provider = provider;
    console.log(`[Itinerary] ✓ ${parsed.items.length} stops via ${provider} (${selectedArc.name})`);
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
    amount: 500,    // $5.00 in cents
  },
  "go-everywhere": {
    name: "GoGlobal GoEverywhere",
    description: "Every city, every feature, early access, and premium Romey concierge.",
    amount: 1000,   // $10.00 in cents
  },
};

app.post("/api/create-checkout-session", async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "Stripe not configured" });

  const { plan } = req.body || {};
  const planConfig = PLANS[plan];
  if (!planConfig) return res.status(400).json({ error: `Unknown plan: ${plan}` });

  const stripe = new Stripe(stripeKey);
  const origin = resolveCheckoutOrigin(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      metadata: { plan },
      subscription_data: { metadata: { plan } },
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
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe]", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/checkout-session", async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: "Stripe not configured" });

  const { session_id: sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "session_id required" });

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const plan = session.metadata?.plan;

    if (!PLANS[plan]) return res.status(400).json({ error: "Unknown checkout plan" });
    if (session.status !== "complete" || session.payment_status !== "paid") {
      return res.status(402).json({ error: "Checkout session is not paid" });
    }

    res.json({
      verified: true,
      plan,
    });
  } catch (err) {
    console.error("[Stripe verify]", err.message);
    res.status(500).json({ error: "Could not verify checkout session" });
  }
});

// ─── Yelp Restaurant Search (server-side proxy — key never sent to client) ───
// GET /api/yelp-restaurants?lat=36.17&lon=-115.13&limit=8
app.get("/api/yelp-restaurants", async (req, res) => {
  const { lat, lon, limit = 8 } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });

  const yelpKey = yelpApiKey();
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
const apiKey = geminiApiKey();

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

app.post("/api/questions/refresh", requireAdmin, async (_, res) => {
  try {
    res.json(await runWeeklyPull());
  } catch (e) {
    console.error("[/api/questions/refresh]", e.message);
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/questions/import", requireAdmin, (req, res) => {
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

app.post("/api/synthesize", requireAdmin, async (req, res) => {
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

app.post("/api/auto-generate", requireAdmin, async (_, res) => {
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
