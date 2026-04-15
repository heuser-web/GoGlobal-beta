import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIImage } from "./AIImage";
import {
  Heart, MapPin, Search, Star, Calendar, Share2, ExternalLink, ChevronRight,
  ChevronDown, Moon, Sun, X, MessageCircle, Send, Sparkles, Globe, Mountain,
  Gem, Users, Clock, Filter, ArrowRight, Navigation, Compass, Gift,
  Music, Utensils, Camera, Plane, Home, BookOpen, Award, Zap, Coffee, Wine,
  Sunset, TreePine, Building2, Tent, Waves, PartyPopper, Drama, Palette,
  ShoppingBag, Bike, Flame, Check, Copy, Mail, Phone, ChevronLeft, Menu,
  Plus, Minus, Info, AlertCircle, Loader2, RefreshCw, HeartHandshake,
  Laugh, Link, ArrowUpRight, Play, Volume2, Eye, Bookmark, Grid3x3, Crown, BarChart2
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXTS
// ═══════════════════════════════════════════════════════════════════════════
import { ThemeProvider, FavoritesProvider, MembershipProvider, useTheme, useFavorites, useMembership } from './context/AppContext'
import { LocationMap } from './components/ui/expand-map'
import MembershipPage from './pages/MembershipPage'
import InfographicsPage from './pages/InfographicsPage'

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI AI INTEGRATION — Romey Concierge
// ═══════════════════════════════════════════════════════════════════════════
const GEMINI_CONFIG = {
  // User must supply their own key in .env as VITE_GEMINI_API_KEY
  model: "gemini-2.5-flash-preview-05-20",  // Highest available Nano-class model in alpha
  systemPrompt: `You are Romey, the GoGlobal concierge — a sophisticated, witty, and deeply knowledgeable guide to Las Vegas. Your personality shifts based on the user's selected vibe:

VIBE: High Adventure → You're a thrill-seeking insider. Direct, energetic, vivid action language. You know every ATV trail, every bungee cord, every secret rooftop.
VIBE: Intimate & Refined → You're a luxury concierge. Measured, evocative, understated. You speak of ambiance, exclusivity, hidden courtyards, and Michelin stars.
VIBE: Default → Balanced warmth with dry wit. Professional but never stiff.

RULES:
- Never use generic filler. Every response must contain at least one specific venue, address, or insider tip.
- Keep responses under 120 words unless the user asks for detail.
- If asked about pricing, give real approximate ranges.
- Reference the user's vibe naturally, never break character.
- You may recommend from this curated list: Joël Robuchon, Secret Pizza at Cosmopolitan, Herbs & Rye, Absinthe, Cirque du Soleil O, Gold Strike Hot Springs, Red Rock Canyon, Valley of Fire, Omega Mart, Neon Museum, Seven Magic Mountains, Fremont East District.
- End responses with a subtle follow-up question to keep the conversation flowing.`
};

async function queryGemini(messages, vibe, apiKey) {
  if (!apiKey) return null;
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_CONFIG.model,
      systemInstruction: GEMINI_CONFIG.systemPrompt + `\n\nCurrent vibe: ${vibe}`
    });
    const chat = model.startChat({ history: messages.slice(0, -1).map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })) });
    const result = await chat.sendMessage(messages[messages.length - 1].text);
    return result.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROMEY HUDDLE — Multi-bot AI concierge system
// ═══════════════════════════════════════════════════════════════════════════
const HUDDLE_SYSTEM_PROMPT = `You are Romey, Master AI Architect and Lead Concierge for GoGlobal. You curate legendary Las Vegas experiences by coordinating a Huddle of specialist bots. You NEVER work alone.

Your Huddle:
- BudgetBot: Tracks every dollar. Ensures total itinerary cost stays within 5% of the user's stated budget.
- AestheticBot: Generates cinematic image search queries to visualize the experience.
- QABot: Validates every recommendation for real-world feasibility. Requires 90-minute minimum spacing between venues. Checks hours and logistics.
- MemoryBot: Reads the user's saved favorites to personalize the plan. Avoids repeating saved places.

STRICT RULES:
1. Output ONLY valid JSON. Zero markdown. Zero text outside the JSON object.
2. Itinerary must have exactly 3-4 items. Each with a realistic USD cost.
3. Total itinerary costs must not exceed 5% over the user's stated budget.
4. atmospheric_images must have EXACTLY 4 cinematic, location-specific search queries.
5. For "Other" or LGBTQ+ orientations: prioritize LGBTQ+-welcoming venues (Piranha Nightclub, The Garage Bar, Art Bar, Therapy Bar Las Vegas, Krave Massive, Hamburger Mary's).
6. huddle_logs must include exactly one entry per bot in this order: BudgetBot, QABot, AestheticBot, MemoryBot.
7. All venue times must be realistic for Las Vegas (venues open, 90-min minimum spacing).

Output ONLY this exact JSON structure, nothing else:
{
  "huddle_logs": [
    { "bot": "BudgetBot", "log": "brief cost analysis" },
    { "bot": "QABot", "log": "brief feasibility note" },
    { "bot": "AestheticBot", "log": "brief aesthetic note" },
    { "bot": "MemoryBot", "log": "brief personalization note" }
  ],
  "romey_intro": "1-2 sentence punchy intro for this specific plan",
  "itinerary": [
    { "time": "7:00 PM", "title": "Venue or Activity Name", "description": "One engaging specific sentence.", "cost": "$XX", "image_query": "cinematic search query for this venue" }
  ],
  "atmospheric_images": ["query1", "query2", "query3", "query4"],
  "learning_summary": "One sentence about what Romey learned from user favorites"
}`;

const HUDDLE_BOTS = [
  { name: "BudgetBot",    icon: "💰", color: "#30D158" },
  { name: "QABot",        icon: "✅", color: "#0A84FF" },
  { name: "AestheticBot", icon: "🎨", color: "#BF5AF2" },
  { name: "MemoryBot",    icon: "🧠", color: "#FF9F0A" },
];

async function queryRomeyHuddle(vibe, orientation, budget, favorites) {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vibe, orientation, budget, favorites }),
    });
    if (!res.ok) { console.error("[Huddle] HTTP", res.status); return null; }
    return await res.json();
  } catch (err) {
    console.error("[Huddle] Error:", err);
    return null;
  }
}



//══════════════════════════════════════════
// ALL DATA (PRESERVED FROM V1)
// ═══════════════════════════════════════════════════════════════════════════
import {
  CITIES,
  VEGAS_HIKES,
  VEGAS_GEMS,
  VEGAS_EVENTS,
  NATIONAL_PARKS,
  ROMANTIC_SURPRISE,
  PLATONIC_SURPRISE,
  ROMEY_PROMPTS,
  VEGAS_PHOTOS
} from './data/constants'
import StackedPanels from './components/StackedPanels'

// ─── Surprise Itinerary Metadata ─────────────────────────────────────────
// Cost estimates and vibe tags for filtering
const ROMANTIC_META = {
  "rom-1": { cost: 110, vibes: ["Romantic", "Luxury"] },
  "rom-2": { cost: 55,  vibes: ["Romantic", "Scenic"] },
  "rom-3": { cost: 350, vibes: ["Luxury", "Fine Dining"] },
  "rom-4": { cost: 60,  vibes: ["Romantic", "Adventurous"] },
};
const PLATONIC_META = {
  "pla-1": { cost: 40, vibes: ["Adventurous", "Thrills"],  age21: false },
  "pla-2": { cost: 20, vibes: ["Cozy", "Low-key"],         age21: false },
  "pla-3": { cost: 50, vibes: ["Adventurous", "Artsy"],    age21: false },
  "pla-4": { cost: 45, vibes: ["Active", "Social"],        age21: false },
  "pla-5": { cost: 55, vibes: ["Nightlife", "Social"],     age21: true  },
  "pla-6": { cost: 65, vibes: ["Luxury", "Views"],         age21: true  },
};
// Extended platonic list — pla-5 and pla-6 are 21+ only
const PLATONIC_EXTENDED = [
  ...PLATONIC_SURPRISE,
  { id: "pla-5", time: "8:00 PM", title: "Herbs & Rye Craft Cocktails", type: "Nightlife",
    description: "Vegas's finest cocktail program inside a dimly lit award-winning speakeasy.", yelpQuery: "Herbs and Rye Las Vegas" },
  { id: "pla-6", time: "10:30 PM", title: "Ghostbar at Palms Casino", type: "Nightlife",
    description: "Outdoor sky lounge 55 floors above the city with unobstructed Vegas panoramas.", yelpQuery: "Ghostbar Palms Casino Las Vegas" },
];
const ROMANCE_VIBES = ["Romantic", "Adventurous", "Cozy", "Luxury", "Low-key", "Spontaneous"];
const SQUAD_VIBES   = ["Adventurous", "Active", "Artsy", "Cozy", "Social", "Low-key"];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
function deduplicateEvents(events) {
  const groups = {};
  events.forEach(evt => {
    const key = `${evt.artist}|||${evt.venue}`;
    if (!groups[key]) groups[key] = { ...evt, dates: [...evt.dates], relatedIds: [evt.id] };
    else { groups[key].dates = [...groups[key].dates, ...evt.dates]; groups[key].relatedIds.push(evt.id); }
  });
  return Object.values(groups);
}

const yelpLink = (q) => `https://www.yelp.com/search?find_desc=${encodeURIComponent(q)}&find_loc=Las+Vegas%2C+NV`;
const googleLink = (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " Las Vegas")}`;

async function shareContent(title, text) {
  if (navigator.share) { try { await navigator.share({ title, text, url: window.location.href }); return true; } catch { return false; } }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN COMPONENTS — Apple Store × Vegas Luxury
// ═══════════════════════════════════════════════════════════════════════════

// Apple-style section header
function SectionHeader({ badge, badgeColor = "#FF2D55", title, subtitle }) {
  const { dark } = useTheme();
  return (
    <div style={{ marginBottom: 40 }}>
      {badge && (
        <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 100,
          background: `${badgeColor}12`, color: badgeColor,
          fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14
        }}>{badge}</motion.span>
      )}
      <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{
        fontFamily: "var(--font-display)", fontWeight: 700,
        fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1,
        color: dark ? "#F5F5F7" : "#1D1D1F", margin: "0 0 10px",
        letterSpacing: "-0.025em"
      }}>{title}</motion.h2>
      {subtitle && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{
          fontFamily: "var(--font-body)", fontSize: 17, lineHeight: 1.6,
          color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", maxWidth: 520
        }}>{subtitle}</motion.p>
      )}
    </div>
  );
}

// Apple-style glass card
function Card({ children, className, onClick, delay = 0, style: extraStyle = {}, noPad }) {
  const { dark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      onClick={onClick}
      style={{
        background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
        borderRadius: 20, overflow: "hidden",
        boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.3s ease",
        padding: noPad ? 0 : undefined,
        ...extraStyle
      }}
    >{children}</motion.div>
  );
}

// Photo card with gradient overlay — supports AI image generation via `prompt` prop
function PhotoCard({ src, prompt, gradient, icon, label, aspectRatio = "16/10" }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // AI-generated image path: delegate entirely to AIImage
  if (prompt) {
    return (
      <div style={{ aspectRatio, width: "100%", position: "relative", overflow: "hidden", borderRadius: "20px 20px 0 0" }}>
        <AIImage prompt={prompt} gradient={gradient} icon={icon} label={label} kenBurns={true} />
      </div>
    );
  }

  return (
    <div style={{ aspectRatio, width: "100%", position: "relative", overflow: "hidden", borderRadius: "20px 20px 0 0", background: gradient || "linear-gradient(135deg, #1a1a2e, #16213e)" }}>
      {src && !error && (
        <img
          src={src}
          alt={label || ""}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: loaded ? 1 : 0,
            transition: "opacity 0.6s ease"
          }}
        />
      )}
      {/* Always overlay gradient for text readability */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%)"
      }} />
      {/* Shimmer while loading */}
      {src && !loaded && !error && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s linear infinite"
        }} />
      )}
      {/* Fallback icon */}
      {(!src || error) && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, zIndex: 1 }}>
          <span style={{ fontSize: 36, opacity: 0.8 }}>{icon || "📸"}</span>
          {label && <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "var(--font-body)", fontWeight: 500 }}>{label}</span>}
        </div>
      )}
    </div>
  );
}

// Heart button
function HeartBtn({ item }) {
  const { addFav, isFav } = useFavorites();
  const active = isFav(item.id);
  return (
    <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); addFav(item); }} style={{
      background: active ? "#FF2D55" : "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)",
      border: "none", borderRadius: "50%", width: 36, height: 36,
      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      boxShadow: active ? "0 2px 12px rgba(255,45,85,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
      transition: "all 0.25s ease"
    }} aria-label={active ? "Remove from favorites" : "Add to favorites"}>
      <Heart size={15} fill={active ? "#fff" : "none"} color="#fff" strokeWidth={2} />
    </motion.button>
  );
}

// Badge
function Badge({ children, color = "#FF2D55" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 100,
      background: `${color}15`, color, fontSize: 11, fontWeight: 600,
      fontFamily: "var(--font-body)", letterSpacing: "0.04em"
    }}>{children}</span>
  );
}

// External link pill
function LinkPill({ href, icon, label }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px",
      borderRadius: 100, background: "rgba(255,45,85,0.08)", color: "#FF2D55",
      fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
      textDecoration: "none", transition: "background 0.2s"
    }}>{icon} {label}</a>
  );
}

// Filter pills
function FilterBar({ options, active, onChange, color = "#FF2D55" }) {
  const { dark } = useTheme();
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 20 }}>
      {options.map(opt => (
        <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => onChange(opt)} style={{
          padding: "8px 18px", borderRadius: 100,
          border: `1px solid ${active === opt ? color : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          background: active === opt ? `${color}12` : "transparent",
          color: active === opt ? color : dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, cursor: "pointer",
          transition: "all 0.2s"
        }}>{opt}</motion.button>
      ))}
    </div>
  );
}

// Share suite
function ShareSuite({ title, items, type }) {
  const { dark } = useTheme();
  const [open, setOpen] = useState(false);
  const buildText = () => {
    let t = `✨ My ${type} Surprise Itinerary — GoGlobal\n\n`;
    items.forEach(i => { t += `${i.time} — ${i.title}\n${i.description}\n🔗 ${yelpLink(i.yelpQuery)}\n\n`; });
    t += "Plan yours at GoGlobal! 🌎"; return t;
  };
  const txt = buildText();
  const act = (m) => {
    if (m === "native") shareContent(title, txt);
    else if (m === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
    else if (m === "email") window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(txt)}`, "_blank");
    else if (m === "sms") window.open(`sms:?body=${encodeURIComponent(txt)}`, "_blank");
    else if (m === "copy") navigator.clipboard.writeText(txt);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 100,
        background: "linear-gradient(135deg, #FF2D55, #FF6B8A)", color: "#fff", border: "none",
        cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
        boxShadow: "0 4px 20px rgba(255,45,85,0.3)"
      }}><Share2 size={15}/> Share My Journey</motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} style={{
            position: "absolute", bottom: "calc(100% + 8px)", right: 0, minWidth: 200, padding: 6, borderRadius: 16,
            background: dark ? "rgba(28,28,30,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(24px)", border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            boxShadow: "0 16px 48px rgba(0,0,0,0.25)", zIndex: 50
          }}>
            {[{ m: "native", i: <Share2 size={15}/>, l: "Share..." }, { m: "whatsapp", i: <MessageCircle size={15}/>, l: "WhatsApp" }, { m: "email", i: <Mail size={15}/>, l: "Email" }, { m: "sms", i: <Phone size={15}/>, l: "SMS" }, { m: "copy", i: <Copy size={15}/>, l: "Copy Text" }].map(({ m, i, l }) => (
              <button key={m} onClick={() => act(m)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
                border: "none", borderRadius: 10, background: "transparent", cursor: "pointer",
                color: dark ? "#E5E5E7" : "#1D1D1F", fontFamily: "var(--font-body)", fontSize: 14
              }}>{i} {l}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal
function Modal({ open, onClose, title, children }) {
  const { dark } = useTheme();
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)" }} />
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} style={{
        position: "relative", maxWidth: 540, width: "100%", maxHeight: "80vh", overflow: "auto",
        background: dark ? "rgba(28,28,30,0.95)" : "rgba(255,255,255,0.98)",
        backdropFilter: "blur(24px)", borderRadius: 24, padding: 28,
        border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}`,
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: dark ? "#F5F5F7" : "#1D1D1F", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: dark ? "#98989D" : "#86868B" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICING SECTION
// ═══════════════════════════════════════════════════════════════════════════
const PRICING_PLANS = [
  {
    id: "free",
    name: "Explorer",
    price: "0",
    description: "Get a taste of what GoGlobal offers.",
    color: "#8E8E93",
    features: ["1 city preview", "Basic trail listings", "Romey intro (3 messages)", "Curated events feed"],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "city",
    name: "City Pass",
    price: "15",
    description: "Full access to one city of your choice.",
    color: "#C9A84C",
    features: ["Unlimited city access", "AI itinerary generator", "Hidden gems & trails", "Surprise itineraries", "Romey unlimited chat"],
    cta: "Choose City",
    popular: false,
  },
  {
    id: "allaccess",
    name: "All Access",
    price: "25",
    description: "Every city. Every experience. Unlimited.",
    color: "#FF2D55",
    features: ["All 12 cities unlocked", "Everything in City Pass", "Early access to new cities", "Priority Romey responses", "Exclusive member events"],
    cta: "Go All Access",
    popular: true,
  },
];

function PricingSection() {
  return (
    <div style={{ background: "#000", padding: "80px 56px 100px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px",
            borderRadius: 100, background: "rgba(255,45,85,0.1)", border: "1px solid rgba(255,45,85,0.2)",
            marginBottom: 20
          }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "#FF2D55", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Membership
            </span>
          </span>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05,
            color: "#fff", margin: "0 0 16px", letterSpacing: "-0.03em"
          }}>
            Choose your<br />
            <span style={{ background: "linear-gradient(135deg, #FF2D55, #C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              adventure plan
            </span>
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 480, margin: "0 auto" }}>
            Unlock curated city guides, hidden gems, and your personal AI concierge.
          </p>
        </motion.div>

        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              style={{
                flex: "1 1 280px", maxWidth: 340,
                borderRadius: 24,
                background: plan.popular ? "rgba(255,45,85,0.07)" : "rgba(255,255,255,0.03)",
                backdropFilter: "blur(20px) saturate(180%)",
                border: `1px solid ${plan.popular ? "rgba(255,45,85,0.35)" : "rgba(255,255,255,0.07)"}`,
                padding: "32px 28px",
                position: "relative",
                transform: plan.popular ? "scale(1.04)" : "scale(1)",
                boxShadow: plan.popular ? "0 0 64px rgba(255,45,85,0.18), 0 8px 32px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              {plan.popular && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  padding: "5px 18px", borderRadius: 100,
                  background: "linear-gradient(135deg, #FF2D55, #C9335C)",
                  fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "#fff",
                  letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
                  boxShadow: "0 4px 16px rgba(255,45,85,0.4)"
                }}>Most Popular</div>
              )}

              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: plan.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {plan.name}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 52, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em" }}>${plan.price}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/mo</span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 24px", lineHeight: 1.5 }}>
                {plan.description}
              </p>

              <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${plan.color}40, transparent)`, marginBottom: 20 }} />

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 11 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Check size={14} color={plan.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 14,
                  background: plan.popular
                    ? "linear-gradient(135deg, #FF2D55, #C9335C)"
                    : plan.id === "city"
                      ? "rgba(201,168,76,0.1)"
                      : "rgba(142,142,147,0.1)",
                  border: plan.popular ? "none" : `1px solid ${plan.color}30`,
                  color: plan.popular ? "#fff" : plan.color,
                  fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", letterSpacing: "0.01em",
                  boxShadow: plan.popular ? "0 8px 24px rgba(255,45,85,0.3)" : "none"
                }}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ textAlign: "center", marginTop: 44, fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.18)" }}
        >
          Cancel anytime · Secure payment · New cities added regularly
        </motion.p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ITINERARY INVITE PANEL
// ═══════════════════════════════════════════════════════════════════════════
const PERMISSION_OPTIONS = [
  { value: "view", label: "Can view" },
  { value: "edit", label: "Can edit" },
];

function ItineraryInvitePanel({ itineraryTitle }) {
  const { dark } = useTheme();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [invited, setInvited] = useState([]);
  const [sending, setSending] = useState(false);

  const bg = dark ? "rgba(28,28,30,0.95)" : "rgba(255,255,255,0.98)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const tp = dark ? "#F5F5F7" : "#1D1D1F";
  const tm = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const selectBg = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  const getInitials = (e) => e.split("@")[0].slice(0, 2).toUpperCase();
  const AVATAR_COLORS = ["#FF2D55", "#C9A84C", "#30D158", "#0A84FF", "#BF5AF2", "#FF9F0A"];
  const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

  const handleInvite = () => {
    if (!email.trim()) return;
    setSending(true);
    setTimeout(() => {
      setInvited(prev => [...prev, { id: Date.now(), email: email.trim(), permission }]);
      setEmail("");
      setSending(false);
    }, 700);
  };

  return (
    <div style={{ position: "relative" }}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 100,
          background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          color: tm, border: `1px solid ${border}`, cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
        }}
      >
        <Users size={15} /> Invite Friends
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute", bottom: "calc(100% + 10px)", right: 0,
              width: 340, borderRadius: 20, padding: 20, zIndex: 50,
              background: bg, backdropFilter: "blur(24px) saturate(180%)",
              border: `1px solid ${border}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: tp, margin: "0 0 2px" }}>
                  Share Itinerary
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={12} /> {invited.length} invited
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: tm }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Email input row */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
                placeholder="Add an email…"
                type="email"
                style={{
                  flex: 1, padding: "9px 14px", borderRadius: 12,
                  border: `1px solid ${border}`, background: inputBg,
                  outline: "none", color: tp, fontFamily: "var(--font-body)", fontSize: 13,
                }}
              />
              <select
                value={permission}
                onChange={e => setPermission(e.target.value)}
                style={{
                  padding: "9px 10px", borderRadius: 12, border: `1px solid ${border}`,
                  background: selectBg, color: tp, fontFamily: "var(--font-body)", fontSize: 12,
                  cursor: "pointer", outline: "none", flexShrink: 0
                }}
              >
                {PERMISSION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Send button */}
            <div style={{ display: "flex", gap: 8, marginBottom: invited.length ? 16 : 0 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 12, border: `1px solid ${border}`,
                  background: "transparent", color: tm, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleInvite}
                disabled={!email.trim() || sending}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 12, border: "none",
                  background: email.trim() ? "linear-gradient(135deg, #FF2D55, #C9335C)" : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  color: email.trim() ? "#fff" : tm,
                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                  cursor: email.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                {sending ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <><Send size={13} /> Send Invite</>}
              </motion.button>
            </div>

            {/* Invited members */}
            {invited.length > 0 && (
              <>
                <div style={{ height: 1, background: border, marginBottom: 12 }} />
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: tm, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Access</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <AnimatePresence>
                    {invited.map((inv, i) => (
                      <motion.div
                        key={inv.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 12, background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: avatarColor(i), display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, color: "#fff"
                        }}>
                          {getInitials(inv.email)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: tp, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {inv.email.split("@")[0]}
                          </p>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: tm, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {inv.email}
                          </p>
                        </div>
                        <select
                          value={inv.permission}
                          onChange={e => setInvited(prev => prev.map(m => m.id === inv.id ? { ...m, permission: e.target.value } : m))}
                          style={{
                            padding: "4px 8px", borderRadius: 8, border: `1px solid ${border}`,
                            background: selectBg, color: tp, fontFamily: "var(--font-body)", fontSize: 11,
                            cursor: "pointer", outline: "none", flexShrink: 0
                          }}
                        >
                          {PERMISSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COVER PAGE — Immersive Vegas hero with city grid
// ═══════════════════════════════════════════════════════════════════════════
// ── Traveler testimonials ─────────────────────────────────────────
const COVER_TESTIMONIALS = [
  {
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Priya M.",
    handle: "@priya_travels",
    text: "Romey planned our entire date night — Joël Robuchon to the High Roller. Flawless.",
  },
  {
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Jake S.",
    handle: "@jakeinvegas",
    text: "The squad roulette feature hit different. Gold Strike Hot Springs was a game changer.",
  },
  {
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Aaliyah R.",
    handle: "@aaliyah_roams",
    text: "Hidden gems section took us straight to Omega Mart. GoGlobal knows Vegas better than locals.",
  },
];

function TestimonialCard({ t, className }) {
  return (
    <div
      className={className}
      style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        padding: "16px 18px", borderRadius: 20, width: 240, flexShrink: 0,
        background: "rgba(10,10,10,0.6)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <img src={t.avatar} alt={t.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
      <div>
        <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "#F5F5F7", margin: "0 0 1px" }}>{t.name}</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 6px" }}>{t.handle}</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.7)", margin: 0 }}>{t.text}</p>
      </div>
    </div>
  );
}

function CoverPage({ onEnter }) {
  const { dark, toggle } = useTheme();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [showCities, setShowCities] = useState(false);

  const filtered = CITIES.filter(c => {
    const q = search.toLowerCase();
    return (c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
      && (region === "All" || c.region === region);
  });

  const inputBg = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const inputBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div style={{ minHeight: "100dvh", background: "#000" }}>

      {/* ── SPLIT HERO ────────────────────────────────────────────── */}
      <div style={{ display: "flex", minHeight: "100dvh", flexDirection: "row" }}>

        {/* ── LEFT PANEL ── */}
        <section style={{
          flex: "0 0 46%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "48px 56px",
          background: dark ? "#000" : "#0a0a0a",
          position: "relative", zIndex: 2,
          minWidth: 0,
        }}>
          {/* Top bar */}
          <div style={{ position: "absolute", top: 28, left: 56, right: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="gg-animate-up gg-d1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Globe size={20} color="#FF2D55" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>
                Go<span style={{ color: "#FF2D55" }}>Global</span>
              </span>
            </div>
            <button
              className="gg-animate-up gg-d1"
              onClick={toggle}
              style={{
                background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                width: 38, height: 38, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)"
              }}
            >
              {dark ? <Sun size={15}/> : <Moon size={15}/>}
            </button>
          </div>

          {/* Content */}
          <div style={{ maxWidth: 420 }}>
            {/* Live badge */}
            <div className="gg-animate-up gg-d2" style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px",
              borderRadius: 100, background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.2)",
              marginBottom: 28
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#30D158", boxShadow: "0 0 8px #30D158" }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "#30D158", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Las Vegas is Live
              </span>
            </div>

            {/* Headline */}
            <h1 className="gg-animate-up gg-d3" style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "clamp(38px, 4.5vw, 58px)", lineHeight: 1.05,
              color: "#fff", margin: "0 0 18px", letterSpacing: "-0.035em"
            }}>
              Your next<br />
              adventure<br />
              <span style={{
                background: "linear-gradient(135deg, #FF2D55 0%, #C9A84C 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>
                starts here.
              </span>
            </h1>

            {/* Subtext */}
            <p className="gg-animate-up gg-d4" style={{
              fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.7,
              color: "rgba(255,255,255,0.45)", margin: "0 0 36px"
            }}>
              Curated city experiences, hidden gems, surprise itineraries — all guided by Romey, your personal AI concierge.
            </p>

            {/* Search input */}
            <div className="gg-animate-up gg-d5" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "4px 4px 4px 18px", borderRadius: 16, marginBottom: 12,
              background: inputBg, border: `1px solid ${inputBorder}`,
              transition: "border-color 0.2s",
            }}>
              <Search size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowCities(true); }}
                onFocus={() => setShowCities(true)}
                placeholder="Search a city or destination…"
                style={{
                  flex: 1, border: "none", background: "transparent", outline: "none",
                  fontFamily: "var(--font-body)", fontSize: 14,
                  color: "#F5F5F7", padding: "12px 0"
                }}
              />
              {search && (
                <button onClick={() => { setSearch(""); setShowCities(false); }} style={{
                  background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8,
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "rgba(255,255,255,0.4)", flexShrink: 0
                }}><X size={13}/></button>
              )}
            </div>

            {/* City dropdown */}
            <AnimatePresence>
              {showCities && search && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    marginBottom: 16, borderRadius: 16, overflow: "hidden",
                    background: "rgba(18,18,18,0.98)", border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(24px)", boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                  }}
                >
                  {filtered.length === 0 ? (
                    <div style={{ padding: "14px 18px", fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                      No cities found
                    </div>
                  ) : filtered.map(city => (
                    <div
                      key={city.name}
                      onClick={city.live ? onEnter : undefined}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
                        cursor: city.live ? "pointer" : "default",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        opacity: city.live ? 1 : 0.4,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => city.live && (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: 22 }}>{city.icon}</span>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#F5F5F7" }}>
                          {city.name}
                          {city.live && <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, color: "#30D158", letterSpacing: "0.1em", textTransform: "uppercase" }}>LIVE</span>}
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{city.state}</div>
                      </div>
                      {city.live && <ArrowRight size={14} color="rgba(255,255,255,0.2)" style={{ marginLeft: "auto" }} />}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary CTA */}
            <motion.button
              className="gg-animate-up gg-d6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "16px 28px", borderRadius: 16, marginBottom: 12,
                background: "linear-gradient(135deg, #FF2D55, #C9335C)",
                color: "#fff", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700,
                boxShadow: "0 8px 32px rgba(255,45,85,0.35)",
                letterSpacing: "0.01em", position: "relative", overflow: "hidden"
              }}
            >
              <span style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                backgroundSize: "200% 100%", animation: "shimmer 2.5s linear infinite"
              }} />
              Explore Las Vegas <ArrowRight size={16}/>
            </motion.button>

            {/* Divider */}
            <div className="gg-animate-up gg-d7" style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 12px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Browse cities */}
            <button
              className="gg-animate-up gg-d8"
              onClick={() => setShowCities(v => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, padding: "14px 28px", borderRadius: 16,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.55)", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
            >
              <Globe size={15}/> Browse all 12 cities
            </button>

            {/* Stats */}
            <div className="gg-animate-up gg-d9" style={{ display: "flex", gap: 28, marginTop: 36, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {[["12", "Cities"], ["100+", "Experiences"], ["AI", "Concierge"]].map(([val, lbl]) => (
                <div key={lbl}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#FF2D55" }}>{val}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RIGHT PANEL ── */}
        <section className="gg-animate-hero gg-d3" style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: "100dvh" }}>
          {/* Hero video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover"
            }}
          >
            <source src="/lasvegas-hero.mp4" type="video/mp4" />
          </video>
          {/* Left fade so left panel bleeds in */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to right, #000 0%, transparent 18%), linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)"
          }} />

          {/* Testimonial cards */}
          <div style={{
            position: "absolute", bottom: 32, left: 24, right: 24,
            display: "flex", gap: 14, zIndex: 2, flexWrap: "nowrap", overflow: "hidden"
          }}>
            {COVER_TESTIMONIALS.map((t, i) => (
              <TestimonialCard
                key={t.handle}
                t={t}
                className={`gg-animate-card gg-d${8 + i}`}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ── CITY GRID (shown when Browse clicked or search active) ── */}
      <AnimatePresence>
        {showCities && !search && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: dark ? "#000" : "#0a0a0a", padding: "60px 56px 80px" }}
          >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <SectionHeader badge="12 Cities" badgeColor="#C9A84C" title="Choose Your Destination"
                subtitle="Iconic American cities, each with curated experiences waiting to be discovered." />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32, marginTop: 24 }}>
                {["All", "West", "East", "South", "Midwest"].map(r => (
                  <button key={r} onClick={() => setRegion(r)} style={{
                    padding: "8px 18px", borderRadius: 100,
                    border: `1px solid ${region === r ? "#C9A84C" : "rgba(255,255,255,0.08)"}`,
                    background: region === r ? "rgba(201,168,76,0.12)" : "transparent",
                    color: region === r ? "#C9A84C" : "rgba(255,255,255,0.4)",
                    fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer", transition: "all 0.2s"
                  }}>{r}</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                {filtered.map((city, i) => (
                  <Card key={city.name} delay={i * 0.04} onClick={city.live ? onEnter : undefined}
                    style={{ opacity: city.live ? 1 : 0.5, padding: 0 }} noPad>
                    <div style={{
                      height: 72, background: `linear-gradient(135deg, ${city.color}, ${city.accent})`,
                      display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
                    }}>
                      <span style={{ fontSize: 32 }}>{city.icon}</span>
                      {city.live && (
                        <span style={{
                          position: "absolute", top: 8, right: 8, padding: "2px 8px", borderRadius: 100,
                          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                          fontSize: 8, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase",
                          fontFamily: "var(--font-body)"
                        }}>LIVE</span>
                      )}
                    </div>
                    <div style={{ padding: "12px 16px 16px" }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#F5F5F7", margin: "0 0 2px" }}>{city.name}</h3>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 5px" }}>{city.state}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic", margin: 0 }}>"{city.tagline}"</p>
                      {!city.live && <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body)", textAlign: "center" }}>Coming Soon</div>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION — Floating Apple-style nav
// ═══════════════════════════════════════════════════════════════════════════
function NavBar({ page, setPage, onHome }) {
  const { dark, toggle } = useTheme();
  const { favorites } = useFavorites();
  const items = [
    { id: "cities",     label: "Cities",     icon: <Globe size={15}/>      },
    { id: "zero-list",  label: "Trails",     icon: <Mountain size={15}/>   },
    { id: "gems",       label: "Gems",       icon: <Gem size={15}/>        },
    { id: "parks",      label: "Parks",      icon: <TreePine size={15}/>   },
    { id: "events",     label: "Events",     icon: <Calendar size={15}/>   },
    { id: "romantic",   label: "Romance",    icon: <Heart size={15}/>      },
    { id: "platonic",   label: "Squad",      icon: <Laugh size={15}/>      },
    { id: "midway",     label: "Meetup",     icon: <Navigation size={15}/> },
    { id: "favorites",  label: `Saved${favorites.length ? ` (${favorites.length})` : ""}`, icon: <Bookmark size={15}/> },
    { id: "membership",   label: "Membership",   icon: <Crown size={15}/>      },
    { id: "infographics", label: "Infographics", icon: <BarChart2 size={15}/>   },
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: dark ? "rgba(0,0,0,0.75)" : "rgba(250,250,250,0.75)",
      backdropFilter: "blur(24px) saturate(180%)",
      borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
      padding: "0 24px"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <button onClick={onHome} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          <Globe size={19} color="#FF2D55" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: dark ? "#F5F5F7" : "#1D1D1F" }}>
            Go<span style={{ color: "#FF2D55" }}>Global</span>
          </span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 2, overflow: "auto", scrollbarWidth: "none", maxWidth: "calc(100% - 180px)" }}>
          {items.map(it => (
            <button key={it.id} onClick={() => setPage(it.id)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 100, border: "none",
              background: page === it.id ? "rgba(255,45,85,0.1)" : "transparent",
              color: page === it.id ? "#FF2D55" : dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s"
            }}>{it.icon} <span>{it.label}</span></button>
          ))}
        </div>
        <button onClick={toggle} style={{
          background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: "none", borderRadius: 10,
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          color: dark ? "#FFD60A" : "#86868B"
        }}>{dark ? <Sun size={16}/> : <Moon size={16}/>}</button>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ELEVATION GRAPH — SVG sparkline showing hike elevation profile
// ═══════════════════════════════════════════════════════════════════════════
function ElevationGraph({ profile, color = "#30D158" }) {
  const { dark } = useTheme();
  if (!profile || profile.length < 2) return null;

  const W = 280;
  const H = 64;
  const PAD = 4;

  const minE = Math.min(...profile.map(p => p.e));
  const maxE = Math.max(...profile.map(p => p.e));
  const maxD = profile[profile.length - 1].d;
  const rangeE = maxE - minE || 1;

  const toX = d => PAD + ((d / maxD) * (W - PAD * 2));
  const toY = e => H - PAD - (((e - minE) / rangeE) * (H - PAD * 2));

  const points = profile.map(p => `${toX(p.d)},${toY(p.e)}`).join(" ");
  const areaPoints = `${toX(profile[0].d)},${H} ${points} ${toX(profile[profile.length - 1].d)},${H}`;

  const gainFt = Math.round(maxE - profile[0].e);
  const startFt = Math.round(profile[0].e).toLocaleString();
  const endFt = Math.round(profile[profile.length - 1].e).toLocaleString();

  return (
    <div style={{ marginTop: 12, marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Elevation Profile
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
          +{gainFt.toLocaleString()} ft gain
        </span>
      </div>
      <div style={{
        borderRadius: 10,
        overflow: "hidden",
        background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        padding: "6px 8px 4px",
      }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", height: H }}>
          <defs>
            <linearGradient id={`elevGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <motion.polygon
            points={areaPoints}
            fill={`url(#elevGrad-${color.replace("#", "")})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
          {/* Line */}
          <motion.polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          {/* Start dot */}
          <circle cx={toX(profile[0].d)} cy={toY(profile[0].e)} r="2.5" fill={color} opacity="0.7" />
          {/* End dot */}
          <circle cx={toX(profile[profile.length - 1].d)} cy={toY(profile[profile.length - 1].e)} r="2.5" fill={color} opacity="0.7" />
          {/* Peak dot */}
          {(() => {
            const peak = profile.reduce((a, b) => b.e > a.e ? b : a);
            return <circle cx={toX(peak.d)} cy={toY(peak.e)} r="3" fill="#fff" stroke={color} strokeWidth="1.5" />;
          })()}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>{startFt} ft</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>{endFt} ft</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ELEVATION TOGGLE — animated pill switch
// ═══════════════════════════════════════════════════════════════════════════
function ElevationToggle({ on, onChange }) {
  const { dark } = useTheme();
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px",
        borderRadius: 100, cursor: "pointer",
        background: on
          ? (dark ? "rgba(48,209,88,0.12)" : "rgba(48,209,88,0.1)")
          : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
        border: `1px solid ${on ? "rgba(48,209,88,0.3)" : (dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}`,
        transition: "all 0.2s",
      }}
    >
      <div style={{
        position: "relative", width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: on ? "#30D158" : (dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"),
        transition: "background 0.25s",
      }}>
        <motion.div
          animate={{ x: on ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%",
            background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }}
        />
      </div>
      <span style={{
        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
        color: on ? "#30D158" : (dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"),
        transition: "color 0.2s",
      }}>
        Elevation Graphs
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: ZERO LIST (HIKING)
// ═══════════════════════════════════════════════════════════════════════════
function ZeroListPage() {
  const { dark } = useTheme();
  const [filter, setFilter] = useState("All");
  const [selHike, setSelHike] = useState(null);
  const [elevOn, setElevOn] = useState(true);
  const [dynamicHikes, setDynamicHikes] = useState([]);
  useEffect(() => {
    fetch("/api/daily-trails").then(r => r.json()).then(setDynamicHikes).catch(() => {});
  }, []);
  const allHikes = [...VEGAS_HIKES, ...dynamicHikes];
  const filtered = filter === "All" ? allHikes : allHikes.filter(h => h.difficulty === filter);
  const diffCol = { Easy: "#30D158", Moderate: "#FFD60A", Hard: "#FF2D55" };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <SectionHeader badge={`${allHikes.length} Trails`} badgeColor="#30D158" title="Las Vegas Hiking Trails"
        subtitle="Beyond the neon — desert canyons, alpine forests, and ancient sandstone await within two hours of the Strip." />

      {/* Filter row + elevation toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <FilterBar options={["All", "Easy", "Moderate", "Hard"]} active={filter} onChange={setFilter} color="#30D158" />
        <ElevationToggle on={elevOn} onChange={setElevOn} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginTop: 24 }}>
        {filtered.map((h, i) => (
          <Card key={h.id} delay={i * 0.06} noPad style={{ padding: 0, cursor: "pointer" }} onClick={() => setSelHike(h)}>
            <div style={{ position: "relative" }}>
              <PhotoCard
                prompt={`${h.name} Las Vegas hiking trail`}
                gradient={`linear-gradient(135deg, ${diffCol[h.difficulty]}30, #0a0a0a)`}
                icon="🥾"
                label={h.name}
              />
              <div style={{ position: "absolute", top: 12, right: 12 }} onClick={e => e.stopPropagation()}><HeartBtn item={h}/></div>
              <div style={{ position: "absolute", top: 12, left: 12 }}><Badge color={diffCol[h.difficulty]}>{h.difficulty}</Badge></div>
            </div>
            <div style={{ padding: "16px 18px 18px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: dark ? "#F5F5F7" : "#1D1D1F", margin: "0 0 6px" }}>{h.name}</h3>
              <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontFamily: "var(--font-body)" }}><MapPin size={12}/> {h.distance}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontFamily: "var(--font-body)" }}><Mountain size={12}/> {h.elevation}</span>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                {h.tags.map(t => <Badge key={t} color="#5E5CE6">{t}</Badge>)}
              </div>
              <button
                onClick={e => { e.stopPropagation(); setSelHike(h); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px",
                  borderRadius: 100, background: `${diffCol[h.difficulty]}18`, color: diffCol[h.difficulty],
                  border: `1px solid ${diffCol[h.difficulty]}40`, cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                }}
              >
                <Mountain size={13} /> More Info
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Hike detail modal */}
      <AnimatePresence>
        {selHike && (
          <Modal open={!!selHike} onClose={() => setSelHike(null)} title={selHike.name}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <Badge color={diffCol[selHike.difficulty]}>{selHike.difficulty}</Badge>
              {selHike.tags.map(t => <Badge key={t} color="#5E5CE6">{t}</Badge>)}
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.65, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)", margin: "0 0 18px" }}>
              {selHike.description}
            </p>
            <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)", fontFamily: "var(--font-body)" }}>
                <MapPin size={14} color="#30D158"/> {selHike.distance}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)", fontFamily: "var(--font-body)" }}>
                <Mountain size={14} color={diffCol[selHike.difficulty]}/> {selHike.elevation} gain
              </span>
            </div>

            {/* Elevation graph — controlled by toggle */}
            <AnimatePresence>
              {elevOn && selHike.elevationProfile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <ElevationGraph profile={selHike.elevationProfile} color={diffCol[selHike.difficulty]} />
                </motion.div>
              )}
            </AnimatePresence>
            {!elevOn && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)", margin: "4px 0 12px" }}>
                Elevation graph hidden — use the toggle above to enable
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(selHike.name + " hiking Las Vegas")}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 100, background: "#30D158", color: "#fff", textDecoration: "none", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(48,209,88,0.3)" }}>
                <ExternalLink size={14}/> Trail Details
              </a>
              <a href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(selHike.name + " hiking")}&find_loc=Las+Vegas`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 100, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: dark ? "#E5E5E7" : "#1D1D1F", textDecoration: "none", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
                <Star size={14}/> Reviews
              </a>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: HIDDEN GEMS
// ═══════════════════════════════════════════════════════════════════════════
function GemsPage() {
  const { dark } = useTheme();
  const [filter, setFilter] = useState("All");
  const cats = ["All", ...new Set(VEGAS_GEMS.map(g => g.category))];
  const filtered = filter === "All" ? VEGAS_GEMS : VEGAS_GEMS.filter(g => g.category === filter);
  const catIcon = { Culture: "🏛️", Experience: "🎭", Fun: "🎮", Nature: "🌿", Nightlife: "🍸", Art: "🎨" };
  const catCol = { Culture: "#BF5AF2", Experience: "#FF2D55", Fun: "#FF9F0A", Nature: "#30D158", Nightlife: "#5E5CE6", Art: "#C9A84C" };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <SectionHeader badge="Off The Beaten Path" badgeColor="#BF5AF2" title="Las Vegas Hidden Gems" subtitle="The Vegas that locals love — beyond the Strip, beyond the obvious." />
      <FilterBar options={cats} active={filter} onChange={setFilter} color="#BF5AF2" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20, marginTop: 32 }}>
        {filtered.map((g, i) => (
          <Card key={g.id} delay={i * 0.06} noPad style={{ padding: 0 }}>
            <div style={{ position: "relative" }}>
              <PhotoCard
                  prompt={`${g.name} Las Vegas photos`}
                  gradient={`linear-gradient(135deg, ${catCol[g.category]}, ${catCol[g.category]}40)`}
                  icon={catIcon[g.category]}
                  label={g.name}
                />
              <div style={{ position: "absolute", top: 12, right: 12 }}><HeartBtn item={g}/></div>
            </div>
            <div style={{ padding: "18px 22px 22px" }}>
              <Badge color={catCol[g.category]}>{g.category}</Badge>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: dark ? "#F5F5F7" : "#1D1D1F", margin: "8px 0" }}>{g.name}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.55, color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", margin: "0 0 14px" }}>{g.description}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <LinkPill href={yelpLink(g.name + " Las Vegas")} icon={<Star size={12}/>} label="Yelp" />
                <LinkPill href={googleLink(g.name)} icon={<ExternalLink size={12}/>} label="Google" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PARK PHOTOS — fetch from NPS API or Wikipedia depending on park type
// ═══════════════════════════════════════════════════════════════════════════
async function fetchParkPhotos(park) {
  if (park.photoSource === "nps") {
    const key = import.meta.env.VITE_NPS_API_KEY || "DEMO_KEY";
    // Primary: /parks includes up to ~10 embedded images per park
    const res = await fetch(
      `https://developer.nps.gov/api/v1/parks?parkCode=${park.npsCode}&fields=images&api_key=${key}`
    );
    const data = await res.json();
    const parkImages = data.data?.[0]?.images || [];
    const primary = parkImages.map(img => img.url).filter(Boolean);

    // Supplement: /multimedia/images gives additional NPS photos
    const res2 = await fetch(
      `https://developer.nps.gov/api/v1/multimedia/images?parkCode=${park.npsCode}&limit=10&api_key=${key}`
    );
    const data2 = await res2.json();
    const secondary = (data2.data || [])
      .map(item => item.images?.[0]?.url)
      .filter(Boolean);

    // Merge, deduplicate
    const all = [...primary, ...secondary];
    return [...new Map(all.map(u => [u, u])).values()].slice(0, 12);
  }

  if (park.photoSource === "wiki") {
    const title = encodeURIComponent(park.wikiTitle);
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${title}`
    );
    const data = await res.json();
    const items = (data.items || []).filter(
      item => item.type === "image" && item.showInGallery !== false
    );
    return items
      .map(item => {
        // Prefer largest srcset entry
        const srcset = item.srcset || [];
        const src = srcset[srcset.length - 1]?.src || item.src || "";
        return src.startsWith("//") ? "https:" + src : src;
      })
      .filter(u => u && !u.endsWith(".svg") && !u.endsWith(".ogg"))
      .slice(0, 12);
  }

  return [];
}

// Module-level cache so card covers don't re-fetch across re-renders
const parkPhotoCache = new Map();

// ─── Park card cover photo — fetches and caches the first real photo ───────
function ParkCardCover({ park }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (parkPhotoCache.has(park.id)) {
      setSrc(parkPhotoCache.get(park.id));
      return;
    }
    fetchParkPhotos(park).then(urls => {
      const first = urls[0] || null;
      parkPhotoCache.set(park.id, first);
      setSrc(first);
    }).catch(() => {});
  }, [park.id]);

  return (
    <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", borderRadius: "16px 16px 0 0", background: "linear-gradient(135deg, #1a3a2a, #0a0a0f)", position: "relative" }}>
      {src ? (
        <motion.img
          src={src}
          alt={park.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
            <Loader2 size={22} color="rgba(48,209,88,0.5)" />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PARK PHOTO GALLERY MODAL
// ═══════════════════════════════════════════════════════════════════════════
function ParkGalleryModal({ park, onClose }) {
  const { dark } = useTheme();
  const [idx, setIdx] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!park) return;
    setIdx(0);
    setPhotos([]);
    setLoading(true);
    setError(false);
    fetchParkPhotos(park)
      .then(urls => {
        if (urls.length > 0) setPhotos(urls);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [park?.id]);

  if (!park) return null;

  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.80)", backdropFilter: "blur(16px)" }} />
      <motion.div
        initial={{ scale: 0.94, y: 24 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative", width: "100%", maxWidth: 780, maxHeight: "90vh", overflowY: "auto",
          background: dark ? "rgba(22,22,24,0.97)" : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(24px)", borderRadius: 28,
          border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"}`,
          boxShadow: "0 32px 100px rgba(0,0,0,0.5)",
        }}
      >
        {/* Photo gallery */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "28px 28px 0 0", overflow: "hidden", background: "#111" }}>

          {/* Loading skeleton */}
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 size={28} color="#30D158" />
              </motion.div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                Loading official {park.photoSource === "nps" ? "NPS" : "park"} photos…
              </span>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 32 }}>🏞️</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "0 32px" }}>
                Couldn't load photos. Check your NPS API key in .env
              </span>
            </div>
          )}

          {/* Main photo */}
          {!loading && !error && photos.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.img
                key={idx}
                src={photos[idx]}
                alt={`${park.name} — official photo ${idx + 1}`}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </AnimatePresence>
          )}

          {/* Nav arrows — only when photos loaded */}
          {!loading && photos.length > 1 && (
            <>
              <button onClick={prev} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)" }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={next} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)" }}>
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Close */}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)" }}>
            <X size={15} />
          </button>

          {/* Source badge — bottom left */}
          {!loading && photos.length > 0 && (
            <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 12px", fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              {park.photoSource === "nps" ? "📷 NPS Official Photos" : "📷 Park Photos"}
            </div>
          )}

          {/* Counter — bottom right */}
          {!loading && photos.length > 0 && (
            <div style={{ position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 14px", fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
              {idx + 1} / {photos.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {!loading && photos.length > 1 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 20px 0", scrollbarWidth: "none" }}>
            {photos.map((url, i) => (
              <button
                key={i} onClick={() => setIdx(i)}
                style={{ flexShrink: 0, width: 56, height: 40, borderRadius: 8, overflow: "hidden", padding: 0, border: i === idx ? "2px solid #30D158" : "2px solid transparent", cursor: "pointer", opacity: i === idx ? 1 : 0.55, transition: "all 0.2s" }}
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            ))}
          </div>
        )}

        {/* Park info */}
        <div style={{ padding: "20px 28px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: dark ? "#F5F5F7" : "#1D1D1F", margin: "0 0 2px" }}>{park.name}</h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", margin: 0 }}>{park.state} · {park.distance} from Vegas</p>
            </div>
            <HeartBtn item={park} />
          </div>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.65, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)", margin: "0 0 20px" }}>
            {park.description}
          </p>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Admission", value: park.admission, icon: "🎫" },
              { label: "Hours", value: park.hours, icon: "🕐" },
              { label: "Best Time", value: park.bestTime, icon: "📅" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                padding: "12px 14px", borderRadius: 14,
                background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: dark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)", lineHeight: 1.4 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href={`https://www.google.com/maps/dir/Las+Vegas,+NV/${encodeURIComponent(park.name)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px",
                borderRadius: 100, background: "#30D158", color: "#fff", textDecoration: "none",
                fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
                boxShadow: "0 4px 16px rgba(48,209,88,0.35)",
              }}
            >
              <MapPin size={14} /> Directions from Vegas
            </a>
            <a
              href={`https://www.nps.gov/index.htm`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px",
                borderRadius: 100, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                color: dark ? "#E5E5E7" : "#1D1D1F", textDecoration: "none",
                fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
                border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <ExternalLink size={14} /> NPS.gov Info
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: NATIONAL PARKS
// ═══════════════════════════════════════════════════════════════════════════
function ParksPage() {
  const { dark } = useTheme();
  const [selPark, setSelPark] = useState(null);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <SectionHeader badge="Las Vegas Parks" badgeColor="#30D158" title="National Parks Near Vegas" subtitle="Some of the most dramatic landscapes on Earth are just a short drive away." />

      {/* Interactive 3D Parks Slideshow */}
      <div style={{
        position: "relative", width: "100%", height: 380, borderRadius: 24, overflow: "hidden", marginBottom: 32,
        background: dark ? "linear-gradient(135deg, #0a1a12 0%, #0a0a1a 100%)" : "linear-gradient(135deg, #e8f5ec 0%, #e8eaf5 100%)",
        border: `1px solid ${dark ? "rgba(48,209,88,0.15)" : "rgba(48,209,88,0.25)"}`,
        boxShadow: dark ? "0 8px 48px rgba(0,0,0,0.5)" : "0 8px 48px rgba(48,209,88,0.12)",
      }}>
        <div style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 10, opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat", backgroundSize: "128px 128px",
        }} />
        <p style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 20,
          fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", whiteSpace: "nowrap", margin: 0,
          color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)", fontFamily: "var(--font-body)", fontWeight: 600,
        }}>12 Parks · Move cursor to explore</p>
        <p style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 20,
          fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", whiteSpace: "nowrap", margin: 0,
          color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)", fontFamily: "var(--font-body)", fontWeight: 500,
        }}>From 20 minutes to 5 hours away</p>
        <StackedPanels />
      </div>

      {/* America the Beautiful Pass CTA */}
      <motion.a href="https://store.usgs.gov/product/510" target="_blank" rel="noopener noreferrer"
        whileHover={{ y: -2 }}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
          padding: "22px 28px", borderRadius: 20, marginBottom: 32, textDecoration: "none",
          background: "linear-gradient(135deg, rgba(48,209,88,0.08), rgba(48,209,88,0.04))",
          border: "1px solid rgba(48,209,88,0.25)", boxShadow: "0 4px 24px rgba(48,209,88,0.08)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>🏞️</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: dark ? "#F5F5F7" : "#1D1D1F" }}>America the Beautiful Pass</span>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", margin: 0 }}>$80/year · Unlimited entry to all 2,000+ national parks & federal lands</p>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 100, background: "#30D158", color: "#fff", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(48,209,88,0.35)" }}>
          <ExternalLink size={14} /> Buy Pass — $80
        </span>
      </motion.a>

      {/* Park cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {NATIONAL_PARKS.map((p, i) => (
          <Card key={p.id} delay={i * 0.06} noPad style={{ padding: 0, cursor: "pointer" }} onClick={() => setSelPark(p)}>
            <div style={{ position: "relative" }}>
              <ParkCardCover park={p} />
              <div style={{ position: "absolute", top: 10, right: 10 }} onClick={e => e.stopPropagation()}><HeartBtn item={p}/></div>
              <div style={{ position: "absolute", bottom: 10, left: 10 }}>
                <Badge color="rgba(0,0,0,0.6)" style={{ backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>{p.distance}</Badge>
              </div>
            </div>
            <div style={{ padding: "16px 18px 18px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: dark ? "#F5F5F7" : "#1D1D1F", margin: "0 0 2px" }}>{p.name}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", margin: "0 0 8px" }}>{p.state}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", margin: "0 0 12px", lineHeight: 1.5 }}>{p.highlight}</p>
              <button
                onClick={e => { e.stopPropagation(); setSelPark(p); }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px",
                  borderRadius: 100, background: "rgba(48,209,88,0.12)", color: "#30D158",
                  border: "1px solid rgba(48,209,88,0.25)", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                }}
              >
                <Camera size={13} /> More Info
              </button>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {selPark && <ParkGalleryModal park={selPark} onClose={() => setSelPark(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: EVENTS (DE-DUPLICATED)
// ═══════════════════════════════════════════════════════════════════════════
function EventsPage() {
  const { dark } = useTheme();
  const [filter, setFilter] = useState("All");
  const [sel, setSel] = useState(null);
  const [dynamicEvents, setDynamicEvents] = useState([]);
  useEffect(() => {
    fetch("/api/daily-events").then(r => r.json()).then(setDynamicEvents).catch(() => {});
  }, []);
  const deduped = useMemo(() => deduplicateEvents([...VEGAS_EVENTS, ...dynamicEvents]), [dynamicEvents]);
  const filtered = filter === "All" ? deduped : deduped.filter(e => e.category === filter);
  const catCol = { Music: "#FF2D55", Show: "#BF5AF2", Sports: "#30D158" };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <SectionHeader badge={`${deduped.length} Events`} badgeColor="#FF2D55" title="Enchanting Events" subtitle="Headliners, residencies, and spectacles — refreshed daily, de-duplicated for clarity." />
      <FilterBar options={["All", "Music", "Show", "Sports", "Art", "Tech", "Food"]} active={filter} onChange={setFilter} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20, marginTop: 32 }}>
        {filtered.map((e, i) => (
          <Card key={e.id} delay={i * 0.06} onClick={() => setSel(e)} noPad style={{ padding: 0 }}>
            <div style={{ position: "relative" }}>
              <PhotoCard
                  prompt={`${e.artist} ${e.venue} Las Vegas`}
                  gradient={`linear-gradient(135deg, ${catCol[e.category]}, ${catCol[e.category]}30)`}
                  icon={e.category === "Music" ? "🎵" : e.category === "Show" ? "🎭" : "🏟️"}
                  label={e.artist}
                />
              <div style={{ position: "absolute", top: 12, right: 12 }}><HeartBtn item={e}/></div>
            </div>
            <div style={{ padding: "18px 22px 22px" }}>
              <Badge color={catCol[e.category]}>{e.category}</Badge>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: dark ? "#F5F5F7" : "#1D1D1F", margin: "8px 0 4px" }}>{e.artist}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12}/> {e.venue}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>{e.dates.length} date{e.dates.length > 1 ? "s" : ""} · From {e.price}</p>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.artist || ""}>
        {sel && (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 6, margin: "0 0 20px" }}><MapPin size={14}/> {sel.venue}</p>
            <h4 style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>All Dates</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {sel.dates.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: dark ? "#E5E5E7" : "#1D1D1F", display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} color="#FF2D55"/> {d}</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "#FF2D55" }}>{sel.price}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a href={googleLink(sel.artist + " " + sel.venue + " tickets")} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 100, background: "#FF2D55", color: "#fff", textDecoration: "none", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600 }}><ExternalLink size={14}/> Find Tickets</a>
              <a href={yelpLink(sel.venue)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 100, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: dark ? "#E5E5E7" : "#1D1D1F", textDecoration: "none", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}><Star size={14}/> Venue</a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: SURPRISE ITINERARIES — with advanced filters
// ═══════════════════════════════════════════════════════════════════════════
function SurprisePage({ type }) {
  const { dark } = useTheme();
  const accent     = type === "romantic" ? "#FF2D55" : "#BF5AF2";
  const accentSoft = type === "romantic" ? "rgba(255,45,85,0.12)" : "rgba(191,90,242,0.12)";
  const title      = type === "romantic" ? "Romantic Surprise" : "Squad Surprise";
  const vibeOptions = type === "romantic" ? ROMANCE_VIBES : SQUAD_VIBES;
  const maxBudget   = type === "romantic" ? 500 : 200;
  const minBudget   = type === "romantic" ? 50 : 20;

  // ── Form state ────────────────────────────────────────────────────
  const [specialRequest, setSpecialRequest] = useState("");
  const [budget, setBudget]                 = useState(maxBudget);
  const [selectedVibes, setSelectedVibes]   = useState([]);
  const [sexuality, setSexuality]           = useState("straight");
  const [otherOrientationText, setOtherOrientationText] = useState("");
  const [age, setAge]                       = useState(21);
  const [alcohol, setAlcohol]               = useState(false);

  const isOver21        = age >= 21;
  const effectiveBudget = type === "platonic" && isOver21 && alcohol ? Math.round(budget * 1.25) : budget;
  const toggleVibe      = v => setSelectedVibes(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  // ── AI state ──────────────────────────────────────────────────────
  const [aiItems, setAiItems]       = useState(null);
  const [spinning, setSpinning]     = useState(false);
  const [spinError, setSpinError]   = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    setSpinError(null);
    setExpandedId(null);
    setAiItems(null);
    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          budget: effectiveBudget,
          vibes: selectedVibes,
          age,
          sexuality,
          otherOrientation: sexuality === "other" ? otherOrientationText : "",
          specialRequest: specialRequest.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      if (!data.items || data.items.length === 0) throw new Error("Empty itinerary — try again");
      setAiItems(data.items);
    } catch (err) {
      console.error("[Plan]", err.message);
      setSpinError(`Romey hit a snag: ${err.message}`);
    } finally {
      setSpinning(false);
    }
  };

  // ── Hover image preview ───────────────────────────────────────────
  const containerRef  = useRef(null);
  const animFrameRef  = useRef(null);
  const [hoveredId, setHoveredId]           = useState(null);
  const [mousePos, setMousePos]             = useState({ x: 0, y: 0 });
  const [smoothPos, setSmoothPos]           = useState({ x: 0, y: 0 });
  const [previewVisible, setPreviewVisible] = useState(false);
  const [imageCache, setImageCache]         = useState({});

  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t;
    const animate = () => {
      setSmoothPos(prev => ({ x: lerp(prev.x, mousePos.x, 0.12), y: lerp(prev.y, mousePos.y, 0.12) }));
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [mousePos]);

  const prefetchImage = async (item) => {
    if (imageCache[item.id]) return;
    try {
      const res = await fetch(`/api/image?prompt=${encodeURIComponent(item.title + " Las Vegas")}`);
      const { url } = await res.json();
      if (url) setImageCache(prev => ({ ...prev, [item.id]: url }));
    } catch {}
  };

  const handleMouseMove = e => setMousePos({ x: e.clientX, y: e.clientY });
  const handleItemEnter = item => { setHoveredId(item.id); setPreviewVisible(true); prefetchImage(item); };
  const handleItemLeave = () => { setHoveredId(null); setPreviewVisible(false); };

  // ── Shared styles ─────────────────────────────────────────────────
  const tp     = dark ? "#F5F5F7" : "#1D1D1F";
  const tm     = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const border = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const labelStyle = {
    fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: tm,
    display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em"
  };
  const pillStyle = active => ({
    padding: "7px 16px", borderRadius: 100,
    border: `1px solid ${active ? accent : border}`,
    background: active ? accentSoft : "transparent",
    color: active ? accent : tm,
    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active ? 600 : 400,
    cursor: "pointer", transition: "all 0.2s"
  });

  const items = aiItems ?? [];
  const getMeta = it => ({ cost: it.cost, vibes: it.vibes, age21: it.age21 });
  const totalCost = items.reduce((s, it) => s + (it.cost || 0), 0);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHeader
          badge={type === "romantic" ? "Date Night" : "Squad Goals"}
          badgeColor={accent}
          title={title}
          subtitle={type === "romantic"
            ? "Tell Romey what you want — Venice AI builds your perfect date night."
            : "Tell Romey what you're after — Venice AI plans your squad hangout."}
        />
      </div>

      {/* ── Planning Form ── */}
      <Card noPad style={{ padding: 28, marginBottom: 36 }}>

        {/* Special Requests */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>
            {type === "romantic" ? "What do you have in mind? (optional)" : "Any special requests? (optional)"}
          </label>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 4px 16px",
            borderRadius: 14, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${specialRequest ? accent : border}`, transition: "border-color 0.2s"
          }}>
            <Search size={15} color={specialRequest ? accent : tm} style={{ flexShrink: 0 }} />
            <input
              value={specialRequest}
              onChange={e => setSpecialRequest(e.target.value)}
              placeholder={type === "romantic"
                ? "e.g. sunset views, outdoor, avoid crowds, surprise her with art…"
                : "e.g. something active, near Downtown, no drinking, escape room…"}
              style={{
                flex: 1, border: "none", background: "transparent", outline: "none",
                fontFamily: "var(--font-body)", fontSize: 14,
                color: dark ? "#F5F5F7" : "#1D1D1F", padding: "12px 0"
              }}
            />
            {specialRequest && (
              <button onClick={() => setSpecialRequest("")} style={{
                background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8,
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: tm, flexShrink: 0
              }}><X size={13}/></button>
            )}
          </div>
        </div>

        {/* Budget */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={labelStyle}>{type === "romantic" ? "Total Date Budget" : "Budget Per Person"}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: accent }}>
              ${budget}{budget >= maxBudget ? "+" : ""}
              {type === "platonic" && isOver21 && alcohol
                ? <span style={{ color: "#FF9F0A" }}> → ${effectiveBudget} w/ drinks</span> : ""}
            </span>
          </div>
          <input type="range" min={minBudget} max={maxBudget} step={type === "romantic" ? 25 : 10}
            value={budget} onChange={e => setBudget(+e.target.value)}
            style={{ width: "100%", accentColor: accent, cursor: "pointer", height: 4 }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>${minBudget}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>${maxBudget}+</span>
          </div>
        </div>

        {/* Who's on this date (romantic) */}
        {type === "romantic" && (
          <div style={{ marginBottom: 28 }}>
            <span style={labelStyle}>Who's on this date?</span>
            <div style={{ display: "flex", gap: 8, marginBottom: sexuality === "other" ? 12 : 0 }}>
              {[["Straight", "straight"], ["Other / LGBTQ+", "other"]].map(([lbl, val]) => (
                <motion.button key={val} whileTap={{ scale: 0.97 }}
                  onClick={() => setSexuality(val)}
                  style={pillStyle(sexuality === val)}>{lbl}</motion.button>
              ))}
            </div>
            <AnimatePresence>
              {sexuality === "other" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                  <input
                    value={otherOrientationText}
                    onChange={e => setOtherOrientationText(e.target.value)}
                    placeholder="Tell us more — e.g. gay couple, non-binary, queer…"
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10, marginTop: 4,
                      border: `1px solid ${border}`, background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      fontFamily: "var(--font-body)", fontSize: 13, color: dark ? "#F5F5F7" : "#1D1D1F",
                      outline: "none", boxSizing: "border-box"
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Age + Alcohol (platonic) */}
        {type === "platonic" && (
          <div style={{ marginBottom: 28 }}>
            <span style={labelStyle}>Age Group</span>
            <div style={{ display: "flex", gap: 8, marginBottom: isOver21 ? 14 : 10 }}>
              {[["Under 21", 20], ["21 & Over", 21]].map(([lbl, val]) => (
                <motion.button key={lbl} whileTap={{ scale: 0.97 }}
                  onClick={() => { setAge(val); if (val < 21) setAlcohol(false); }}
                  style={pillStyle(age === val)}>{lbl}</motion.button>
              ))}
            </div>
            {isOver21 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>Include bars & drinks?</span>
                <motion.button whileTap={{ scale: 0.92 }} onClick={() => setAlcohol(v => !v)} style={{
                  width: 46, height: 26, borderRadius: 13,
                  background: alcohol ? accent : dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  border: "none", cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0
                }}>
                  <motion.div animate={{ x: alcohol ? 22 : 2 }} transition={{ duration: 0.2 }}
                    style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
                </motion.button>
              </div>
            )}
            {!isOver21 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(48,209,88,0.06)", border: "1px solid rgba(48,209,88,0.15)" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#30D158" }}>✓ 21+ venues automatically excluded</span>
              </motion.div>
            )}
          </div>
        )}

        {/* Mood */}
        <div style={{ marginBottom: 28 }}>
          <span style={labelStyle}>Mood of the {type === "romantic" ? "Date" : "Hangout"}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {vibeOptions.map(v => (
              <motion.button key={v} whileTap={{ scale: 0.97 }}
                onClick={() => toggleVibe(v)}
                style={pillStyle(selectedVibes.includes(v))}>{v}</motion.button>
            ))}
          </div>
        </div>

        {/* Plan button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={spin}
          disabled={spinning}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, padding: "16px 28px", borderRadius: 14,
            background: spinning
              ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")
              : `linear-gradient(135deg, ${accent}, ${type === "romantic" ? "#C9335C" : "#9B59D0"})`,
            color: spinning ? tm : "#fff",
            border: "none", cursor: spinning ? "not-allowed" : "pointer",
            fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
            letterSpacing: "-0.01em",
            boxShadow: spinning ? "none" : `0 8px 32px ${accent}40`,
            transition: "all 0.3s ease"
          }}
        >
          <motion.span
            animate={spinning ? { rotate: 360 } : { rotate: 0 }}
            transition={spinning ? { duration: 0.6, repeat: Infinity, ease: "linear" } : {}}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Sparkles size={17} />
          </motion.span>
          {spinning
            ? "Venice AI is planning…"
            : aiItems
            ? `Plan a New ${type === "romantic" ? "Date" : "Hangout"}`
            : `Plan My ${type === "romantic" ? "Date Night" : "Hangout"}`}
        </motion.button>
      </Card>

      {/* ── Error state ── */}
      <AnimatePresence>
        {spinError && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 24, padding: "14px 18px", borderRadius: 14,
              background: "rgba(255,45,85,0.08)", border: "1px solid rgba(255,45,85,0.2)",
              display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertCircle size={15} color="#FF2D55" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", margin: 0 }}>{spinError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading skeleton ── */}
      <AnimatePresence>
        {spinning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ borderTop: `1px solid ${border}` }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{ padding: "20px 4px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: accentSoft, flexShrink: 0,
                  animation: "shimmer 1.4s linear infinite",
                  backgroundImage: `linear-gradient(90deg, ${accentSoft} 25%, ${accent}20 50%, ${accentSoft} 75%)`,
                  backgroundSize: "200% 100%" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ height: 16, width: `${55 + n * 7}%`, borderRadius: 8, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    animation: "shimmer 1.4s linear infinite", backgroundImage: "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%)", backgroundSize: "200% 100%" }} />
                  <div style={{ height: 11, width: "30%", borderRadius: 6, background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }} />
                </div>
              </div>
            ))}
            <div style={{ padding: "20px 0", display: "flex", alignItems: "center", gap: 10 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 size={16} color={accent} />
              </motion.div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: tm }}>Venice AI is curating your perfect plan…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      <AnimatePresence>
        {!spinning && !aiItems && !spinError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{type === "romantic" ? "💑" : "👥"}</div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: tp, margin: "0 0 8px" }}>
              {type === "romantic" ? "Your perfect date awaits" : "Your perfect hangout awaits"}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: tm, margin: 0 }}>
              Fill in your preferences above and hit Plan — Venice AI builds something just for you.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Showcase List ── */}
      {!spinning && items.length > 0 && (
        <div ref={containerRef} onMouseMove={handleMouseMove} style={{ position: "relative" }}>

          {/* ── Floating image preview ── */}
          <div
            style={{
              position: "fixed", zIndex: 9999, pointerEvents: "none",
              width: 300, height: 190, borderRadius: 18, overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
              transform: `translate3d(${
                smoothPos.x + 20
              }px, ${
                smoothPos.y - 140
              }px, 0)`,
              opacity: previewVisible ? 1 : 0,
              scale: previewVisible ? 1 : 0.88,
              transition: "opacity 0.25s cubic-bezier(0.4,0,0.2,1), scale 0.25s cubic-bezier(0.4,0,0.2,1)"
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: dark ? "#1a1a1a" : "#f0f0f0" }} />
            {items.map(it => (
              <img
                key={it.id}
                src={imageCache[it.id] || ""}
                alt={it.title}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover",
                  opacity: hoveredId === it.id && imageCache[it.id] ? 1 : 0,
                  transform: hoveredId === it.id ? "scale(1)" : "scale(1.08)",
                  filter: hoveredId === it.id ? "none" : "blur(8px)",
                  transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)"
                }}
              />
            ))}
            {/* Gradient overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(to top, ${accent}60 0%, transparent 60%)`,
              zIndex: 1
            }} />
            {/* No-image fallback spinner */}
            {hoveredId && !imageCache[hoveredId] && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Loader2 size={20} color={accent} />
                </motion.div>
              </div>
            )}
          </div>

          {/* ── Item rows ── */}
          <div style={{ borderTop: `1px solid ${border}` }}>
            <AnimatePresence mode="popLayout">
              {items.map((it, i) => {
                const m = getMeta(it);
                const isExpanded = expandedId === it.id;
                const isHovered  = hoveredId === it.id;

                return (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, delay: spinning ? 0 : i * 0.05 }}
                  >
                    {/* ── Row ── */}
                    <div
                      onMouseEnter={() => handleItemEnter(it)}
                      onMouseLeave={handleItemLeave}
                      onClick={() => setExpandedId(isExpanded ? null : it.id)}
                      style={{
                        position: "relative", borderBottom: `1px solid ${border}`,
                        padding: "20px 4px", cursor: "pointer",
                        transition: "background 0.2s"
                      }}
                    >
                      {/* Hover bg */}
                      <motion.div
                        animate={{ opacity: isHovered ? 1 : 0, scaleX: isHovered ? 1 : 0.96 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: "absolute", inset: "0 -16px", borderRadius: 14,
                          background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          pointerEvents: "none"
                        }}
                      />

                      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
                        {/* Left: index + info */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
                          {/* Step number */}
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: isExpanded ? accent : accentSoft,
                            transition: "background 0.25s"
                          }}>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800, color: isExpanded ? "#fff" : accent }}>
                              {i + 1}
                            </span>
                          </div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <h3 style={{
                                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18,
                                color: tp, margin: 0, letterSpacing: "-0.015em",
                                position: "relative", display: "inline-block"
                              }}>
                                {it.title}
                                {/* Animated underline */}
                                <span style={{
                                  position: "absolute", bottom: -2, left: 0, height: 1,
                                  background: accent,
                                  width: isHovered ? "100%" : "0%",
                                  transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)"
                                }} />
                              </h3>
                              <motion.div
                                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -6, y: isHovered ? 0 : 6 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ArrowUpRight size={15} color={tm} />
                              </motion.div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: tm }}>{it.type}</span>
                              {m.age21 && <Badge color="#BF5AF2">21+</Badge>}
                            </div>
                          </div>
                        </div>

                        {/* Right: time + cost + chevron */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: accent }}>{it.time}</div>
                            {m.cost && <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm, marginTop: 2 }}>~${m.cost}</div>}
                          </div>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
                            <ChevronDown size={16} color={tm} />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* ── Expanded detail panel ── */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{
                            margin: "0 0 2px",
                            padding: "20px 0 24px",
                            borderBottom: `1px solid ${border}`,
                            display: "flex", gap: 24, flexWrap: "wrap"
                          }}>
                            {/* Photo */}
                            <div style={{
                              width: 220, height: 140, borderRadius: 14, overflow: "hidden",
                              background: dark ? "#1a1a1a" : "#eee", flexShrink: 0, position: "relative"
                            }}>
                              {imageCache[it.id]
                                ? <img src={imageCache[it.id]} alt={it.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : (
                                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
                                      <Loader2 size={18} color={accent} />
                                    </motion.div>
                                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: tm }}>Loading photo…</span>
                                  </div>
                                )
                              }
                              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${accent}50, transparent 50%)` }} />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 240 }}>
                              <p style={{
                                fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65,
                                color: dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)",
                                margin: "0 0 18px"
                              }}>{it.description}</p>

                              {/* Vibes */}
                              {m.vibes && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                                  {m.vibes.map(v => (
                                    <span key={v} style={{
                                      padding: "4px 12px", borderRadius: 100,
                                      background: accentSoft, color: accent,
                                      fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600
                                    }}>{v}</span>
                                  ))}
                                </div>
                              )}

                              {/* Action links */}
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                <a href={yelpLink(it.yelpQuery)} target="_blank" rel="noopener noreferrer" style={{
                                  display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px",
                                  borderRadius: 100, background: accent, color: "#fff", textDecoration: "none",
                                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                                  boxShadow: `0 4px 16px ${accent}35`
                                }}>
                                  <Star size={13} /> Yelp Reviews
                                </a>
                                <a href={googleLink(it.title)} target="_blank" rel="noopener noreferrer" style={{
                                  display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px",
                                  borderRadius: 100,
                                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                  border: `1px solid ${border}`,
                                  color: tp, textDecoration: "none",
                                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500
                                }}>
                                  <ExternalLink size={13} /> More Info
                                </a>
                                <HeartBtn item={it} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ── Summary bar ── */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: 32, padding: "16px 24px", borderRadius: 16,
                background: accentSoft, border: `1px solid ${accent}30`,
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
              }}
            >
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Stops</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: tp }}>{items.length}</div>
                </div>
                {totalCost > 0 && (
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Est. Total</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: tp }}>${totalCost}</div>
                  </div>
                )}
              </div>
              <ShareSuite title={title} items={items} type={type === "romantic" ? "Romantic" : "Platonic"} />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: MIDWAY MEETUP — video hero + geocoding + live Yelp restaurant cards
// ═══════════════════════════════════════════════════════════════════════════

// ── Star rating helper ────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          size={11}
          fill={rating >= n ? "#C9A84C" : rating >= n - 0.5 ? "#C9A84C" : "none"}
          color={rating >= n - 0.5 ? "#C9A84C" : "rgba(255,255,255,0.15)"}
          strokeWidth={1.5}
        />
      ))}
      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.45)", marginLeft: 4 }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ── Single restaurant card ────────────────────────────────────────────────
function RestaurantCard({ biz, index }) {
  const [imgError, setImgError] = useState(false);
  const accent = "#FF2D55";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.22 } }}
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
      onClick={() => window.open(biz.url, "_blank", "noopener noreferrer")}
    >
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
        {biz.image && !imgError ? (
          <img
            src={biz.image}
            alt={biz.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Utensils size={32} color="rgba(255,255,255,0.1)" />
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
        {/* Price badge */}
        {biz.price && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
            borderRadius: 8, padding: "3px 9px",
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "#C9A84C",
            border: "1px solid rgba(201,168,76,0.25)",
          }}>
            {biz.price}
          </div>
        )}
        {/* Distance badge */}
        {biz.distance !== null && (
          <div style={{
            position: "absolute", bottom: 10, left: 12,
            fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.7)",
          }}>
            {biz.distance} mi away
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <h4 style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
          color: "#F5F5F7", margin: 0, lineHeight: 1.25,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {biz.name}
        </h4>

        <StarRating rating={biz.rating} />

        {biz.categories && (
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 12,
            color: "rgba(255,255,255,0.38)", margin: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {biz.categories}
          </p>
        )}

        <div style={{ flex: 1 }} />

        {/* CTA row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            {biz.reviewCount?.toLocaleString()} reviews
          </span>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
            color: accent,
          }}>
            View on Yelp <ArrowUpRight size={12} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
function MidwayPage() {
  const { dark } = useTheme();
  const [values, setValues]         = useState(["", ""]);
  const [suggestions, setSuggestions] = useState([[], []]);
  const [coords, setCoords]         = useState([null, null]);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [restLoading, setRestLoading] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const debounceRef = useRef([null, null]);
  const resultsRef  = useRef(null);

  const accent     = "#FF2D55";
  const accentElec = "#5E5CE6";
  const tp         = dark ? "#F5F5F7" : "#1D1D1F";
  const tm         = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const border     = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  // ── Geocode autocomplete ──────────────────────────────────────────────
  const handleInput = (idx, val) => {
    const nv = [...values]; nv[idx] = val; setValues(nv);
    const nc = [...coords]; nc[idx] = null; setCoords(nc);
    clearTimeout(debounceRef.current[idx]);
    if (val.length < 2) {
      const ns = [...suggestions]; ns[idx] = []; setSuggestions(ns); return;
    }
    debounceRef.current[idx] = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        const ns   = [...suggestions];
        ns[idx]    = (Array.isArray(data) ? data : []).slice(0, 5).map(p => ({
          short: p.address?.road || p.address?.neighbourhood || p.address?.suburb || p.display_name.split(",")[0],
          city:  [p.address?.city || p.address?.town || p.address?.village, p.address?.state].filter(Boolean).join(", "),
          lat: parseFloat(p.lat), lon: parseFloat(p.lon),
        }));
        setSuggestions(ns);
      } catch { /* silent */ }
    }, 320);
  };

  const pickSuggestion = (idx, s) => {
    const nv = [...values]; nv[idx] = `${s.short}${s.city ? `, ${s.city}` : ""}`; setValues(nv);
    const nc = [...coords]; nc[idx] = { lat: s.lat, lon: s.lon }; setCoords(nc);
    const ns = [...suggestions]; ns[idx] = []; setSuggestions(ns);
  };

  // ── Find midpoint + fetch restaurants ────────────────────────────────
  const findMidpoint = async () => {
    if (!coords[0] || !coords[1]) return;
    setLoading(true);
    setResult(null);
    setRestaurants([]);

    const midLat  = (coords[0].lat + coords[1].lat) / 2;
    const midLon  = (coords[0].lon + coords[1].lon) / 2;
    const distKm  = Math.sqrt(
      Math.pow((coords[1].lat - coords[0].lat) * 111, 2) +
      Math.pow((coords[1].lon - coords[0].lon) * 85,  2)
    );

    try {
      const res  = await fetch(`/api/geocode?q=${midLat},${midLon}&type=reverse`);
      const data = await res.json();
      const area = data.address?.neighbourhood || data.address?.suburb || data.address?.city_district || data.address?.city || "Midpoint Area";
      const city = [data.address?.city || data.address?.town, data.address?.state].filter(Boolean).join(", ") || "Location";
      const newResult = { area, city, lat: midLat, lon: midLon, distanceMi: Math.round(distKm * 0.621) };
      setResult(newResult);
      setLoading(false);

      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);

      // Fetch restaurants async
      setRestLoading(true);
      try {
        const rRes  = await fetch(`/api/yelp-restaurants?lat=${midLat}&lon=${midLon}&limit=8`);
        const rData = await rRes.json();
        setRestaurants(rData.businesses || []);
      } catch { /* silent — Yelp optional */ }
      setRestLoading(false);
    } catch {
      setResult({ area: "Midpoint", city: `${midLat.toFixed(4)}, ${midLon.toFixed(4)}`, lat: midLat, lon: midLon, distanceMi: null });
      setLoading(false);
    }
  };

  const canFind = !!(coords[0] && coords[1]);

  const labelStyle = {
    fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
    color: tm, display: "block", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: "0.06em",
  };

  return (
    <div style={{ maxWidth: "100%", overflowX: "hidden" }}>

      {/* ═══ FULLSCREEN VIDEO HERO ═══════════════════════════════════════ */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "100svh",
        minHeight: 520,
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}>
        {/* Video */}
        <video
          src="/midway-meetup.mp4"
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: videoLoaded ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        />
        {/* Fallback tint while loading */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0d0d10 0%, #1a0a12 100%)",
          opacity: videoLoaded ? 0 : 1,
          transition: "opacity 1s ease",
        }} />

        {/* Gradient scrim — bottom heavy for text legibility */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.88) 100%)",
          pointerEvents: "none",
        }} />

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "relative", zIndex: 2,
            width: "100%", maxWidth: 800,
            padding: "0 24px 72px",
            textAlign: "center",
          }}
        >
          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 100,
              background: `${accent}18`, color: accent,
              fontSize: 11, fontWeight: 600, fontFamily: "var(--font-body)",
              letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20,
              border: `1px solid ${accent}30`,
            }}
          >
            <Navigation size={10} /> Meet in the Middle
          </motion.span>

          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(28px, 5.5vw, 56px)",
            lineHeight: 1.05, letterSpacing: "-0.025em",
            color: "#FFFFFF", margin: "0 0 18px",
            textShadow: "0 2px 24px rgba(0,0,0,0.4)",
          }}>
            Don't spend all day finding<br />a spot in the middle.
          </h1>

          <p style={{
            fontFamily: "var(--font-body)", fontSize: "clamp(15px, 2vw, 19px)",
            color: "rgba(255,255,255,0.72)", lineHeight: 1.6,
            margin: "0 auto 36px", maxWidth: 520,
          }}>
            Drop two addresses — we calculate the exact geographic midpoint and surface the best restaurants waiting right there between you.
          </p>

          {/* Scroll affordance */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
            onClick={() => document.getElementById("midway-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            <ChevronDown size={28} color="rgba(255,255,255,0.45)" />
          </motion.div>
        </motion.div>
      </div>

      {/* ═══ SEARCH FORM ══════════════════════════════════════════════════ */}
      <div id="midway-form" style={{ maxWidth: 700, margin: "0 auto", padding: "72px 24px 48px" }}>
        <SectionHeader
          badge="Find Your Midpoint"
          badgeColor={accentElec}
          title="Where are you both coming from?"
          subtitle="Enter two real addresses, neighborhoods, or landmarks — we'll do the math."
        />

        <Card noPad style={{ padding: 28, marginBottom: 24 }}>
          {[0, 1].map(idx => (
            <div key={idx} style={{ marginBottom: idx === 0 ? 20 : 24, position: "relative" }}>
              <label style={labelStyle}>
                {idx === 0 ? "Your location" : "Their location"}
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "4px 4px 4px 16px", borderRadius: 14,
                background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${coords[idx] ? accentElec : border}`,
                transition: "border-color 0.25s",
              }}>
                <MapPin size={15} color={coords[idx] ? accentElec : tm} />
                <input
                  value={values[idx]}
                  onChange={e => handleInput(idx, e.target.value)}
                  placeholder="City, address, or landmark..."
                  style={{
                    flex: 1, border: "none", background: "transparent", outline: "none",
                    fontFamily: "var(--font-body)", fontSize: 15, color: tp, padding: "10px 0",
                  }}
                />
                {coords[idx] && <Check size={15} color={accentElec} style={{ marginRight: 12, flexShrink: 0 }} />}
              </div>

              {suggestions[idx].length > 0 && (
                <div style={{
                  position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)",
                  background: dark ? "rgba(14,14,16,0.98)" : "rgba(255,255,255,0.98)",
                  backdropFilter: "blur(24px)", borderRadius: 14, overflow: "hidden",
                  zIndex: 20, border: `1px solid ${border}`,
                  boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
                }}>
                  {suggestions[idx].map((s, j) => (
                    <button
                      key={j}
                      onClick={() => pickSuggestion(idx, s)}
                      style={{
                        display: "flex", flexDirection: "column", gap: 2,
                        width: "100%", padding: "11px 16px", border: "none",
                        background: "transparent", cursor: "pointer", textAlign: "left",
                        borderBottom: j < suggestions[idx].length - 1 ? `1px solid ${border}` : "none",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: tp }}>{s.short}</span>
                      {s.city && <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: tm }}>{s.city}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Find button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={findMidpoint}
            disabled={!canFind || loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "15px",
              borderRadius: 100,
              background: canFind
                ? `linear-gradient(135deg, ${accent}, #ff6b35)`
                : dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              color: canFind ? "#fff" : tm,
              border: "none",
              cursor: canFind ? "pointer" : "default",
              fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600,
              transition: "all 0.25s",
              boxShadow: canFind ? "0 4px 24px rgba(255,45,85,0.3)" : "none",
            }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Calculating midpoint…</>
              : <><Navigation size={16} /> Find Midway Point</>
            }
          </motion.button>
        </Card>
      </div>

      {/* ═══ RESULTS ══════════════════════════════════════════════════════ */}
      {result && (
        <div ref={resultsRef} style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>

          {/* ── Three location maps ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 48 }}
          >
            {/* Section label */}
            <p style={{
              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
              color: tm, textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: 24,
            }}>
              Your locations
            </p>

            {/* Map trio — responsive flex row */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 32,
              alignItems: "flex-start",
              justifyContent: "center",
            }}>

              {/* Location A */}
              <LocationMap
                label="Location A"
                location={values[0] || "Location A"}
                coordinates={`${Math.abs(coords[0]?.lat ?? 0).toFixed(4)}° ${(coords[0]?.lat ?? 0) >= 0 ? "N" : "S"}, ${Math.abs(coords[0]?.lon ?? 0).toFixed(4)}° ${(coords[0]?.lon ?? 0) >= 0 ? "E" : "W"}`}
                accentColor={accent}
              />

              {/* Connector dots */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 6, paddingTop: 44,
                alignSelf: "flex-start",
              }}>
                {[0,1,2,3,4].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.25, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    style={{
                      width: i === 2 ? 6 : 4,
                      height: i === 2 ? 6 : 4,
                      borderRadius: "50%",
                      background: tm,
                    }}
                  />
                ))}
              </div>

              {/* Midpoint */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <LocationMap
                  label="Midpoint"
                  location={`${result.area}, ${result.city}`}
                  coordinates={`${Math.abs(result.lat).toFixed(4)}° ${result.lat >= 0 ? "N" : "S"}, ${Math.abs(result.lon).toFixed(4)}° ${result.lon >= 0 ? "E" : "W"}`}
                  accentColor={accentElec}
                  directionsHref={`https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lon}`}
                />
                {result.distanceMi && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    style={{
                      fontFamily: "var(--font-body)", fontSize: 11, color: tm,
                      marginTop: 10, textAlign: "center",
                    }}
                  >
                    ~{result.distanceMi} mi from each of you
                  </motion.p>
                )}
              </div>

              {/* Connector dots */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 6, paddingTop: 44,
                alignSelf: "flex-start",
              }}>
                {[0,1,2,3,4].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.25, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    style={{
                      width: i === 2 ? 6 : 4,
                      height: i === 2 ? 6 : 4,
                      borderRadius: "50%",
                      background: tm,
                    }}
                  />
                ))}
              </div>

              {/* Location B */}
              <LocationMap
                label="Location B"
                location={values[1] || "Location B"}
                coordinates={`${Math.abs(coords[1]?.lat ?? 0).toFixed(4)}° ${(coords[1]?.lat ?? 0) >= 0 ? "N" : "S"}, ${Math.abs(coords[1]?.lon ?? 0).toFixed(4)}° ${(coords[1]?.lon ?? 0) >= 0 ? "E" : "W"}`}
                accentColor={accent}
              />
            </div>
          </motion.div>

          {/* Restaurant section header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: 28 }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700,
                  fontSize: "clamp(22px, 3vw, 30px)", color: tp,
                  margin: "0 0 6px", letterSpacing: "-0.02em",
                }}>
                  Restaurants near the middle
                </h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: tm, margin: 0 }}>
                  Top-rated spots within a 5-mile radius of your midpoint
                </p>
              </div>
              {restLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: tm, fontFamily: "var(--font-body)", fontSize: 13 }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Loading…
                </div>
              )}
            </div>
          </motion.div>

          {/* Restaurant grid */}
          {restaurants.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
              marginBottom: 48,
            }}>
              {restaurants.map((biz, i) => (
                <RestaurantCard key={biz.id} biz={biz} index={i} />
              ))}
            </div>
          )}

          {/* Empty state if Yelp returned nothing */}
          {!restLoading && restaurants.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: "48px 24px", textAlign: "center", borderRadius: 20,
                background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${border}`, marginBottom: 48,
              }}
            >
              <Utensils size={40} color={tm} strokeWidth={1} style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: tm }}>
                No restaurants found near this midpoint — try a more urban area.
              </p>
            </motion.div>
          )}

          {/* Quick-action chips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          >
            {[
              { icon: Coffee, label: "Coffee nearby", href: `https://www.yelp.com/search?find_desc=coffee&find_loc=${encodeURIComponent(result.city)}` },
              { icon: Zap,    label: "Things to do",   href: `https://www.google.com/search?q=things+to+do+near+${encodeURIComponent(result.area + " " + result.city)}` },
              { icon: Wine,   label: "Bars & lounges", href: `https://www.yelp.com/search?find_desc=bars&find_loc=${encodeURIComponent(result.city)}` },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "9px 18px", borderRadius: 100,
                  background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${border}`,
                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                  color: tp, textDecoration: "none",
                  transition: "background 0.2s",
                }}
              >
                <Icon size={14} color={tm} /> {label} <ArrowUpRight size={12} color={tm} />
              </a>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: FAVORITES
// ═══════════════════════════════════════════════════════════════════════════
function FavoritesPage() {
  const { dark } = useTheme();
  const { favorites, addFav } = useFavorites();
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <SectionHeader badge="Your Collection" badgeColor="#C9A84C" title="Saved Favorites" subtitle={favorites.length ? `${favorites.length} saved item${favorites.length > 1 ? "s" : ""}` : "Tap the heart icon on any card to save it here."} />
      {favorites.length === 0 ? (
        <Card noPad style={{ padding: 64, textAlign: "center" }}>
          <Heart size={48} color={dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth={1} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", marginTop: 16 }}>Your favorites will appear here.</p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {favorites.map((f, i) => (
            <Card key={f.id} delay={i * 0.04} noPad style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: dark ? "#F5F5F7" : "#1D1D1F", margin: "0 0 4px" }}>{f.name || f.title || f.artist}</h3>
                  {f.description && <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", margin: 0, lineHeight: 1.5 }}>{f.description}</p>}
                </div>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => addFav(f)} style={{ background: "#FF2D55", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 12 }}>
                  <X size={13} color="#fff"/>
                </motion.button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROMEY CHATBOT — Gemini-Powered Concierge
// ═══════════════════════════════════════════════════════════════════════════
function RomeyChatbot() {
  const { dark } = useTheme();
  const { favorites } = useFavorites();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("vibe"); // vibe | orientation | budget | thinking | plan | chat
  const [vibe, setVibe] = useState(null);
  const [orientation, setOrientation] = useState("Any");
  const [orientationOther, setOrientationOther] = useState("");
  const [budget, setBudget] = useState(null);
  const [customBudget, setCustomBudget] = useState("");
  const [plan, setPlan] = useState(null);
  const [visibleBots, setVisibleBots] = useState(0);
  const [msgs, setMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef(null);
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;

  // Advance bot animation; transition to plan when all bots shown + plan ready
  useEffect(() => {
    if (step !== "thinking") return;
    if (visibleBots < 4) {
      const t = setTimeout(() => setVisibleBots(v => v + 1), 1200);
      return () => clearTimeout(t);
    }
    if (plan !== null) setStep("plan");
  }, [step, visibleBots, plan]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const reset = () => {
    setStep("vibe"); setVibe(null); setOrientation("Any");
    setOrientationOther(""); setBudget(null); setCustomBudget("");
    setPlan(null); setVisibleBots(0); setMsgs([]); setChatInput("");
  };

  const generate = async () => {
    const finalBudget = customBudget ? parseInt(customBudget) : budget;
    if (!finalBudget || !vibe) return;
    const orientLabel = orientation === "Other" ? (orientationOther.trim() || "LGBTQ+") : orientation;
    setStep("thinking");
    setVisibleBots(0);
    const result = await queryRomeyHuddle(vibe, orientLabel, finalBudget, favorites);
    setPlan(result || { error: true, romey_intro: "The bots hit a snag — try again?", itinerary: [], huddle_logs: [], atmospheric_images: [], learning_summary: "" });
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput.trim();
    setChatInput("");
    setChatLoading(true);
    const newMsgs = [...msgs, { role: "user", text: userText }];
    setMsgs(newMsgs);
    const reply = await queryGemini(newMsgs, vibe || "default", apiKey);
    setMsgs(prev => [...prev, { role: "romey", text: reply || "Even I need a moment — rephrase that?" }]);
    setChatLoading(false);
  };

  const bg = dark ? "rgba(10,10,12,0.97)" : "rgba(255,255,255,0.97)";
  const border = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tp = dark ? "#E5E5E7" : "#1D1D1F";
  const tm = dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const cb = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";
  const containerBase = { position: "fixed", bottom: 24, right: 24, zIndex: 200, width: 380, maxWidth: "calc(100vw - 48px)", maxHeight: "calc(100dvh - 100px)", background: bg, backdropFilter: "blur(24px)", borderRadius: 24, overflow: "hidden", border: `1px solid ${border}`, boxShadow: "0 24px 80px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" };

  const headerEl = (
    <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #FF2D55, #C9335C)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={17} color="#fff"/></div>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#fff", margin: 0 }}>Romey Huddle</h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.6)", margin: 0 }}>4-Bot AI Concierge</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {step !== "vibe" && <button onClick={reset} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 100, padding: "4px 10px", cursor: "pointer", color: "#fff", fontFamily: "var(--font-body)", fontSize: 11 }}>New Plan</button>}
        <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}><X size={14}/></button>
      </div>
    </div>
  );

  if (!open) return (
    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setOpen(true)} className="animate-pulse-glow"
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #FF2D55, #FF6B8A)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <MessageCircle size={22} color="#fff"/>
    </motion.button>
  );

  // ── Vibe ──────────────────────────────────────────────────────────
  if (step === "vibe") return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} style={containerBase}>
      {headerEl}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: tp, textAlign: "center", marginBottom: 2 }}>What's tonight's vibe?</p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm, textAlign: "center", marginBottom: 6 }}>Your Huddle will craft the perfect plan.</p>
        {[
          { id: "highAdventure", l: "High Adventure",     i: <Zap size={18}/>,      d: "Adrenaline, thrills & hidden gems",  c: "#FF9F0A" },
          { id: "intimate",      l: "Intimate & Refined", i: <Wine size={18}/>,     d: "Luxury, elegance & Michelin stars",  c: "#BF5AF2" },
          { id: "spontaneous",   l: "Surprise Me",        i: <Sparkles size={18}/>, d: "A curated mix of the unexpected",    c: "#FF2D55" },
        ].map(v => (
          <motion.button key={v.id} whileTap={{ scale: 0.97 }} onClick={() => { setVibe(v.id); setStep("orientation"); }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 16, background: cb, border: `1px solid ${border}`, cursor: "pointer", textAlign: "left", width: "100%" }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: `${v.c}18`, display: "flex", alignItems: "center", justifyContent: "center", color: v.c, flexShrink: 0 }}>{v.i}</div>
            <div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: tp, display: "block" }}>{v.l}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm }}>{v.d}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  // ── Orientation ───────────────────────────────────────────────────
  if (step === "orientation") return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={containerBase}>
      {headerEl}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: tp, marginBottom: 4 }}>Who's joining tonight?</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm }}>MemoryBot personalizes venues based on this.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Any", "Hetero", "Gay/Lesbian", "Bisexual", "Other"].map(o => (
            <button key={o} onClick={() => setOrientation(o)} style={{ padding: "8px 16px", borderRadius: 100, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, cursor: "pointer", background: orientation === o ? "linear-gradient(135deg, #FF2D55, #C9335C)" : cb, color: orientation === o ? "#fff" : tp, border: `1px solid ${orientation === o ? "transparent" : border}` }}>{o}</button>
          ))}
        </div>
        {orientation === "Other" && (
          <input value={orientationOther} onChange={e => setOrientationOther(e.target.value)}
            placeholder="Tell Romey how to personalize (optional)"
            style={{ padding: "10px 14px", borderRadius: 12, border: `1px solid ${border}`, background: cb, color: tp, fontFamily: "var(--font-body)", fontSize: 13, outline: "none" }}/>
        )}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("budget")}
          style={{ padding: "13px", borderRadius: 14, background: "linear-gradient(135deg, #FF2D55, #C9335C)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600 }}>
          Next →
        </motion.button>
      </div>
    </motion.div>
  );

  // ── Budget ────────────────────────────────────────────────────────
  if (step === "budget") return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={containerBase}>
      {headerEl}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: tp, marginBottom: 4 }}>What's your budget?</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm }}>BudgetBot guarantees within 5% of this amount.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[100, 200, 350, 500].map(b => (
            <button key={b} onClick={() => { setBudget(b); setCustomBudget(""); }} style={{ padding: "14px", borderRadius: 14, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, cursor: "pointer", background: budget === b && !customBudget ? "linear-gradient(135deg, #FF2D55, #C9335C)" : cb, color: budget === b && !customBudget ? "#fff" : tp, border: `1px solid ${budget === b && !customBudget ? "transparent" : border}` }}>${b}{b === 500 ? "+" : ""}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: border }}/><span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm }}>or custom</span><div style={{ flex: 1, height: 1, background: border }}/>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: tm }}>$</span>
          <input value={customBudget} onChange={e => { setCustomBudget(e.target.value.replace(/\D/g, "")); setBudget(null); }} placeholder="Enter amount"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: `1px solid ${customBudget ? "#FF2D55" : border}`, background: cb, color: tp, fontFamily: "var(--font-body)", fontSize: 14, outline: "none" }}/>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={generate} disabled={!budget && !customBudget}
          style={{ padding: "14px", borderRadius: 14, background: (budget || customBudget) ? "linear-gradient(135deg, #FF2D55, #C9335C)" : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"), color: (budget || customBudget) ? "#fff" : tm, border: "none", cursor: (budget || customBudget) ? "pointer" : "default", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600 }}>
          Activate the Huddle ✦
        </motion.button>
      </div>
    </motion.div>
  );

  // ── Thinking ──────────────────────────────────────────────────────
  if (step === "thinking") return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={containerBase}>
      {headerEl}
      <div style={{ padding: "28px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: tp, marginBottom: 4 }}>Bots are thinking…</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm }}>Your Huddle is crafting the perfect evening</p>
        </div>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          {HUDDLE_BOTS.map((bot, idx) => (
            visibleBots > idx ? (
              <motion.div key={bot.name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, background: `${bot.color}10`, border: `1px solid ${bot.color}30` }}>
                <span style={{ fontSize: 20 }}>{bot.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: bot.color }}>{bot.name}</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: tm, display: "block" }}>
                    {idx === 0 ? "Calculating budget allocation..." : idx === 1 ? "Checking feasibility & timing..." : idx === 2 ? "Selecting cinematic imagery..." : "Scanning your favorites..."}
                  </span>
                </div>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader2 size={15} color={bot.color}/></motion.div>
              </motion.div>
            ) : null
          ))}
        </div>
      </div>
    </motion.div>
  );

  // ── Plan + Chat ───────────────────────────────────────────────────
  const itinerary = plan?.itinerary || [];
  const huddleLogs = plan?.huddle_logs || [];
  const atmosphericImages = plan?.atmospheric_images || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      style={{ ...containerBase, height: 580 }}>
      {headerEl}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Huddle Logs */}
        {huddleLogs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {huddleLogs.map((log, i) => {
              const bot = HUDDLE_BOTS.find(b => b.name === log.bot) || { color: "#8E8E93", icon: "🤖" };
              return (
                <div key={i} style={{ display: "flex", gap: 8, padding: "7px 11px", borderRadius: 10, background: `${bot.color}08`, borderLeft: `3px solid ${bot.color}` }}>
                  <span style={{ fontSize: 13 }}>{bot.icon}</span>
                  <div>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: bot.color }}>{log.bot}: </span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: tm }}>{log.log}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Romey Intro */}
        {plan?.romey_intro && (
          <div style={{ padding: "13px 16px", borderRadius: 16, background: "linear-gradient(135deg, rgba(255,45,85,0.08), rgba(201,51,92,0.04))", border: "1px solid rgba(255,45,85,0.15)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Sparkles size={14} color="#FF2D55" style={{ marginTop: 2, flexShrink: 0 }}/>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.55, color: tp, margin: 0, fontStyle: "italic" }}>{plan.romey_intro}</p>
            </div>
          </div>
        )}

        {/* Itinerary */}
        {itinerary.length > 0 && (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: tm, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Tonight's Plan</p>
            {itinerary.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF2D55", marginTop: 4 }}/>
                  {i < itinerary.length - 1 && <div style={{ width: 2, flex: 1, background: border, minHeight: 14, margin: "4px 0" }}/>}
                </div>
                <div style={{ flex: 1, paddingBottom: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: tm }}>{item.time}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "#30D158" }}>{item.cost}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: tp, margin: "0 0 3px" }}>{item.title}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: tm, margin: 0, lineHeight: 1.5 }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Atmospheric Images */}
        {atmosphericImages.length > 0 && (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: tm, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>Atmosphere</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {atmosphericImages.map((q, i) => (
                <span key={i} style={{ padding: "5px 10px", borderRadius: 100, background: cb, border: `1px solid ${border}`, fontFamily: "var(--font-body)", fontSize: 11, color: tm }}>{q}</span>
              ))}
            </div>
          </div>
        )}

        {/* MemoryBot Learning */}
        {plan?.learning_summary && (
          <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.2)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: "#FF9F0A" }}>🧠 MemoryBot: </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: tm }}>{plan.learning_summary}</span>
          </div>
        )}

        {/* Chat Messages */}
        {step === "chat" && (
          <>
            <div style={{ height: 1, background: border }}/>
            <div ref={chatRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                  <div style={{ padding: "10px 14px", borderRadius: 14, fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.5, background: m.role === "user" ? "linear-gradient(135deg, #FF2D55, #C9335C)" : cb, color: m.role === "user" ? "#fff" : tp, borderBottomRightRadius: m.role === "user" ? 4 : 14, borderBottomLeftRadius: m.role === "user" ? 14 : 4 }}>{m.text}</div>
                </motion.div>
              ))}
              {chatLoading && <Loader2 size={16} color="#FF2D55" style={{ animation: "spin 1s linear infinite" }}/>}
            </div>
          </>
        )}

        {/* Actions */}
        {step === "plan" && !plan?.error && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("chat")}
            style={{ padding: "12px", borderRadius: 14, background: cb, border: `1px solid ${border}`, color: tp, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <MessageCircle size={14}/> Ask Romey to refine this plan
          </motion.button>
        )}
        {plan?.error && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={reset}
            style={{ padding: "12px", borderRadius: 14, background: "linear-gradient(135deg, #FF2D55, #C9335C)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}>
            Try Again
          </motion.button>
        )}
      </div>

      {/* Chat Input */}
      {step === "chat" && (
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${border}`, display: "flex", gap: 8, flexShrink: 0 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Refine the plan..."
            style={{ flex: 1, padding: "10px 16px", borderRadius: 100, border: `1px solid ${border}`, background: cb, outline: "none", color: tp, fontFamily: "var(--font-body)", fontSize: 13 }}/>
          <motion.button whileTap={{ scale: 0.9 }} onClick={sendChat}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "#FF2D55", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={14} color="#fff"/>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: CITIES — Interactive COBE Globe + City Cards
// ═══════════════════════════════════════════════════════════════════════════

// City coordinates [lat, lon]
const CITY_COORDS = {
  "Las Vegas":     [36.17,  -115.14],
  "New York":      [40.71,   -74.01],
  "Los Angeles":   [34.05,  -118.24],
  "Miami":         [25.77,   -80.19],
  "Chicago":       [41.88,   -87.63],
  "Nashville":     [36.17,   -86.78],
  "Austin":        [30.27,   -97.74],
  "San Francisco": [37.77,  -122.42],
  "New Orleans":   [29.95,   -90.07],
  "Denver":        [39.74,  -104.99],
  "Seattle":       [47.61,  -122.33],
  "Honolulu":      [21.31,  -157.86],
};

function GlobeWithCities({ onCityHover, onCityClick, hoveredCity }) {
  const canvasRef  = useRef(null);
  const phiRef     = useRef(0);
  const globeRef   = useRef(null);
  const GLOBE_SIZE = 500;

  const markers = CITIES.map(city => {
    const [lat, lon] = CITY_COORDS[city.name] || [0, 0];
    return { location: [lat, lon], size: city.live ? 0.06 : 0.04 };
  });

  useEffect(() => {
    let animId;
    import("cobe").then(({ default: createGlobe }) => {
      if (!canvasRef.current) return;
      globeRef.current = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width:  GLOBE_SIZE * 2,
        height: GLOBE_SIZE * 2,
        phi: 0,
        theta: 0.3,
        dark: 1,
        diffuse: 1.4,
        mapSamples: 20000,
        mapBrightness: 5,
        baseColor:    [0.08, 0.08, 0.12],
        markerColor:  [0.25, 0.65, 1.0],
        glowColor:    [0.1,  0.35, 0.9],
        markers,
        onRender(state) {
          state.phi = phiRef.current;
          phiRef.current += 0.003;
        },
      });
    });
    return () => { globeRef.current?.destroy(); };
  }, []);

  // ── 2D projection for hover detection ──────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = GLOBE_SIZE / 2;
    const cy = GLOBE_SIZE / 2;
    const r  = GLOBE_SIZE * 0.46;           // visible radius (slightly less than half)
    const phi   = phiRef.current;
    const theta = 0.3;

    let best = null, bestDist = 28;         // 28px threshold

    CITIES.forEach(city => {
      const [lat, lon] = CITY_COORDS[city.name] || [0, 0];
      const latR = lat * Math.PI / 180;
      const lonR = lon * Math.PI / 180;

      // Rotate by phi (horizontal) + theta (tilt)
      const x0 =  Math.cos(latR) * Math.cos(lonR + phi);
      const y0 =  Math.sin(latR);
      const z0 =  Math.cos(latR) * Math.sin(lonR + phi);

      // Apply theta tilt around X axis
      const y1 =  y0 * Math.cos(theta) - z0 * Math.sin(theta);
      const z1 =  y0 * Math.sin(theta) + z0 * Math.cos(theta);

      if (z1 < 0) return; // behind the globe

      const sx = cx + x0 * r;
      const sy = cy - y1 * r;
      const dist = Math.hypot(mx - sx, my - sy);
      if (dist < bestDist) { bestDist = dist; best = city; }
    });

    onCityHover(best, e.clientX, e.clientY);
  }, [onCityHover]);

  const handleMouseLeave = useCallback(() => onCityHover(null, 0, 0), [onCityHover]);

  const handleClick = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = GLOBE_SIZE / 2;
    const cy = GLOBE_SIZE / 2;
    const r  = GLOBE_SIZE * 0.46;
    const phi   = phiRef.current;
    const theta = 0.3;

    let best = null, bestDist = 28;
    CITIES.forEach(city => {
      const [lat, lon] = CITY_COORDS[city.name] || [0, 0];
      const latR = lat * Math.PI / 180;
      const lonR = lon * Math.PI / 180;
      const x0 =  Math.cos(latR) * Math.cos(lonR + phi);
      const y0 =  Math.sin(latR);
      const z0 =  Math.cos(latR) * Math.sin(lonR + phi);
      const y1 =  y0 * Math.cos(theta) - z0 * Math.sin(theta);
      const z1 =  y0 * Math.sin(theta) + z0 * Math.cos(theta);
      if (z1 < 0) return;
      const sx = cx + x0 * r;
      const sy = cy - y1 * r;
      const dist = Math.hypot(mx - sx, my - sy);
      if (dist < bestDist) { bestDist = dist; best = city; }
    });
    if (best) onCityClick(best);
  }, [onCityClick]);

  return (
    <div style={{ position: "relative", width: GLOBE_SIZE, height: GLOBE_SIZE, cursor: hoveredCity ? "pointer" : "default" }}>
      <canvas
        ref={canvasRef}
        width={GLOBE_SIZE * 2}
        height={GLOBE_SIZE * 2}
        style={{ width: GLOBE_SIZE, height: GLOBE_SIZE }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {/* Outer glow ring */}
      <div style={{
        position: "absolute", inset: "10%", borderRadius: "50%", pointerEvents: "none",
        boxShadow: "0 0 80px rgba(40, 120, 255, 0.18), 0 0 160px rgba(40, 80, 255, 0.08)",
      }} />
    </div>
  );
}

function CitiesPage({ onEnter }) {
  const { dark } = useTheme();
  const [search, setSearch]         = useState("");
  const [region, setRegion]         = useState("All");
  const [hoveredCity, setHoveredCity] = useState(null);
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 });
  const [smoothPos, setSmoothPos]   = useState({ x: 0, y: 0 });
  const [previewVisible, setPreviewVisible] = useState(false);
  const animFrameRef = useRef(null);

  // ── Lerp hover preview (same as SurprisePage) ──────────────────────
  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t;
    const animate = () => {
      setSmoothPos(prev => ({
        x: lerp(prev.x, mousePos.x, 0.12),
        y: lerp(prev.y, mousePos.y, 0.12),
      }));
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [mousePos]);

  const handleCityHover = useCallback((city, cx, cy) => {
    if (city) {
      setHoveredCity(city);
      setMousePos({ x: cx, y: cy });
      setPreviewVisible(true);
    } else {
      setPreviewVisible(false);
      setHoveredCity(null);
    }
  }, []);

  const handleCityClick = useCallback((city) => {
    if (city.live && onEnter) onEnter(city);
  }, [onEnter]);

  const filtered = CITIES.filter(c => {
    const q = search.toLowerCase();
    return (c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
      && (region === "All" || c.region === region);
  });

  const regions = ["All", "West", "East", "South", "Midwest"];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <SectionHeader
        badge="12 Destinations"
        badgeColor="#5E5CE6"
        title="Explore Cities"
        subtitle="Spin the globe, discover your next adventure. Each city curated with AI-guided experiences."
      />

      {/* ── Globe + search row ──────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, marginBottom: 64 }}>

        {/* Globe */}
        <div style={{ position: "relative" }}>
          <GlobeWithCities
            onCityHover={handleCityHover}
            onCityClick={handleCityClick}
            hoveredCity={hoveredCity}
          />
          {/* Hovered city label below globe */}
          <AnimatePresence>
            {hoveredCity && (
              <motion.div
                key={hoveredCity.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                style={{
                  position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)",
                  display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#F5F5F7",
                }}
              >
                <span>{hoveredCity.icon}</span>
                {hoveredCity.name}
                {hoveredCity.live && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#30D158", letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 4 }}>LIVE</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "4px 4px 4px 18px", borderRadius: 16, width: "100%", maxWidth: 480,
          background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        }}>
          <Search size={15} color={dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cities…"
            style={{
              flex: 1, border: "none", background: "transparent", outline: "none",
              fontFamily: "var(--font-body)", fontSize: 14,
              color: dark ? "#F5F5F7" : "#1D1D1F", padding: "12px 0",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
              border: "none", borderRadius: 8, width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", flexShrink: 0
            }}><X size={13}/></button>
          )}
        </div>

        {/* Region filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {regions.map(r => (
            <button key={r} onClick={() => setRegion(r)} style={{
              padding: "8px 20px", borderRadius: 100,
              border: `1px solid ${region === r ? "#5E5CE6" : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              background: region === r ? "rgba(94,92,230,0.12)" : "transparent",
              color: region === r ? "#5E5CE6" : dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 0.2s",
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* ── City card grid ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
        {filtered.map((city, i) => (
          <motion.div
            key={city.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            style={{
              borderRadius: 20, overflow: "hidden",
              background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
              boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.06)",
              opacity: city.live ? 1 : 0.55,
              cursor: city.live ? "pointer" : "default",
            }}
            onClick={() => city.live && onEnter && onEnter(city)}
          >
            {/* Card photo */}
            <div style={{ position: "relative", height: 180 }}>
              <AIImage
                prompt={`${city.name} ${city.state} city skyline travel photo`}
                gradient={`linear-gradient(135deg, ${city.color}50, ${city.accent}30)`}
                icon={city.icon}
                label={city.name}
                kenBurns
              />
              {/* Gradient overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)",
              }} />
              {/* Icon + LIVE badge */}
              <div style={{ position: "absolute", top: 12, left: 14 }}>
                <span style={{ fontSize: 28 }}>{city.icon}</span>
              </div>
              {city.live && (
                <span style={{
                  position: "absolute", top: 12, right: 12,
                  padding: "3px 10px", borderRadius: 100,
                  background: "rgba(48,209,88,0.18)", border: "1px solid rgba(48,209,88,0.3)",
                  fontSize: 9, fontWeight: 700, color: "#30D158",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  fontFamily: "var(--font-body)",
                }}>LIVE</span>
              )}
              {/* City name on photo */}
              <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700,
                  fontSize: 20, color: "#fff", margin: 0,
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}>{city.name}</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>{city.state}</p>
              </div>
            </div>
            {/* Card footer */}
            <div style={{ padding: "14px 16px 16px" }}>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: 12,
                color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                fontStyle: "italic", margin: "0 0 12px",
              }}>"{city.tagline}"</p>
              {city.live ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={e => { e.stopPropagation(); onEnter && onEnter(city); }}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 12,
                    background: `linear-gradient(135deg, ${city.color}, ${city.accent})`,
                    color: "#fff", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: `0 4px 16px ${city.color}40`,
                  }}
                >
                  Enter City <ArrowRight size={13}/>
                </motion.button>
              ) : (
                <div style={{
                  width: "100%", padding: "10px 0", borderRadius: 12,
                  background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  color: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                  fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
                  textAlign: "center",
                }}>Coming Soon</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Floating city image preview (globe hover) ──────────────── */}
      <AnimatePresence>
        {previewVisible && hoveredCity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              left: smoothPos.x + 20,
              top:  smoothPos.y - 80,
              width: 200, height: 140,
              borderRadius: 16, overflow: "hidden",
              pointerEvents: "none", zIndex: 9999,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <AIImage
              prompt={`${hoveredCity.name} ${hoveredCity.state} city skyline travel photo`}
              gradient={`linear-gradient(135deg, ${hoveredCity.color}50, ${hoveredCity.accent}30)`}
              icon={hoveredCity.icon}
              label={hoveredCity.name}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
            }} />
            <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#fff", margin: 0 }}>
                {hoveredCity.icon} {hoveredCity.name}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
                {hoveredCity.state}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [cover, setCover] = useState(true);
  const [page, setPage] = useState("zero-list");

  return (
    <ThemeProvider>
      <FavoritesProvider>
        <MembershipProvider>
          <AppInner cover={cover} setCover={setCover} page={page} setPage={setPage} />
        </MembershipProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

function AppInner({ cover, setCover, page, setPage }) {
  const { dark } = useTheme();

  const pages = {
    cities:     <CitiesPage onEnter={() => setCover(false)} />,
    "zero-list": <ZeroListPage/>,
    gems:        <GemsPage/>,
    parks:       <ParksPage/>,
    events:      <EventsPage/>,
    romantic:    <SurprisePage type="romantic"/>,
    platonic:    <SurprisePage type="platonic"/>,
    midway:      <MidwayPage/>,
    favorites:   <FavoritesPage/>,
    membership:    <MembershipPage/>,
    infographics:  <InfographicsPage/>,
  };

  if (cover) return <CoverPage onEnter={() => setCover(false)} />;

  return (
    <div style={{
      minHeight: "100dvh",
      background: dark
        ? "radial-gradient(ellipse at 20% 0%, rgba(255,45,85,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(94,92,230,0.03) 0%, transparent 50%), #000"
        : "radial-gradient(ellipse at 20% 0%, rgba(255,45,85,0.03) 0%, transparent 50%), #FAFAFA"
    }}>
      <NavBar page={page} setPage={setPage} onHome={() => setCover(true)} />
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {pages[page] || <ZeroListPage/>}
        </motion.div>
      </AnimatePresence>
      <RomeyChatbot />
      <footer style={{ padding: "48px 24px", borderTop: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`, textAlign: "center", marginTop: 80 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 8 }}>
          <Globe size={17} color="#FF2D55"/>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: dark ? "#F5F5F7" : "#1D1D1F" }}>Go<span style={{ color: "#FF2D55" }}>Global</span></span>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>Curated by Roman · Powered by Passion · Las Vegas & Beyond</p>
      </footer>
    </div>
  );
}
