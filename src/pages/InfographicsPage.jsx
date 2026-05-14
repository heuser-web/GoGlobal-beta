import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  TrendingUp, RefreshCw, Copy, Check, ChevronDown, ChevronRight,
  Sparkles, Database, Cpu, Clock, FileText, BarChart2, AlertCircle,
  BookOpen, Zap, MapPin, Home, Star, Printer, Layout, FileCode,
} from "lucide-react";

// ── Luxury Las Vegas home photos (Unsplash) ───────────────────────────────
const LV_PHOTOS = [
  { id: "1600596542815-ffad4c1539a9", alt: "Modern luxury home exterior in Las Vegas" },
  { id: "1580587771525-78b9dba3b914", alt: "Elegant estate with desert landscaping" },
  { id: "1564013799919-ab600027ffc6", alt: "Contemporary home in Summerlin, Nevada" },
  { id: "1512917774080-9991f1c4c750", alt: "Upscale property in Henderson" },
  { id: "1568605114967-8130f3a36994", alt: "Beautiful home in Green Valley Ranch" },
  { id: "1583608205776-bfd35f0d9f83", alt: "Luxury residence in Southern Highlands" },
  { id: "1600607687939-b0de0c5a7146", alt: "Premium home with pool in The Ridges" },
  { id: "1600047509807-ba8f99d2cdde", alt: "Spacious estate in MacDonald Highlands" },
  { id: "1613490493576-7fde63acd811", alt: "Luxury real estate in Clark County" },
  { id: "1560185893-a55cbc8c57e8", alt: "Designer interior of a Las Vegas luxury home" },
];

function photoForArticle(articleId) {
  if (!articleId) return LV_PHOTOS[0];
  let h = 0;
  for (let i = 0; i < articleId.length; i++) h = (h * 31 + articleId.charCodeAt(i)) | 0;
  return LV_PHOTOS[Math.abs(h) % LV_PHOTOS.length];
}

// ── Utilities ─────────────────────────────────────────────────────────────
function countWords(str) { return str.trim().split(/\s+/).filter(Boolean).length; }

function formatVolume(n) {
  if (!n) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function extractTitle(markdown) {
  const line = (markdown ?? "").split("\n").find((l) => l.startsWith("# "));
  return line ? line.replace(/^#\s+/, "") : "";
}

function bodyWithoutTitle(markdown) {
  const lines = (markdown ?? "").split("\n");
  const idx   = lines.findIndex((l) => l.startsWith("# "));
  return idx >= 0 ? lines.slice(idx + 1).join("\n").trimStart() : markdown;
}

function getAdminToken() {
  try {
    return sessionStorage.getItem("gg_admin_token") || "";
  } catch {
    return "";
  }
}

function adminHeaders(extra = {}) {
  const token = getAdminToken();
  return token ? { ...extra, "X-GoGlobal-Admin-Token": token } : extra;
}

// ── API helpers ───────────────────────────────────────────────────────────
async function fetchWeeklyQuestions() {
  const r = await fetch("/api/questions/weekly");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function fetchHistory() {
  const r = await fetch("/api/questions/history");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function fetchArticles() {
  const r = await fetch("/api/articles");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function fetchTop3() {
  const r = await fetch("/api/top3");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function generateArticle(question) {
  const r = await fetch("/api/synthesize", {
    method:  "POST",
    headers: adminHeaders({ "Content-Type": "application/json" }),
    body:    JSON.stringify({
      prompt:  question.keyword,
      context: { volume: question.volume, difficulty: question.difficulty },
    }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function triggerAutoGenerate() {
  const r = await fetch("/api/auto-generate", { method: "POST", headers: adminHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function refreshQuestions() {
  const r = await fetch("/api/questions/refresh", { method: "POST", headers: adminHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── CSS variable scope (passed as inline style to wrapper) ────────────────
const SCOPE_VARS = {
  "--ig-bg":        "#0a0a0c",
  "--ig-panel":     "#0e0e11",
  "--ig-card":      "#141416",
  "--ig-card-h":    "#1a1a1e",
  "--ig-gold":      "#C9A84C",
  "--ig-gold-l":    "#e8c97a",
  "--ig-gold-dim":  "rgba(201,168,76,0.10)",
  "--ig-gold-bdr":  "rgba(201,168,76,0.18)",
  "--ig-tp":        "#ede8df",
  "--ig-ts":        "#8a847c",
  "--ig-tm":        "#4a4642",
  "--ig-bdr":       "rgba(255,255,255,0.05)",
};

// ── Sub-components ────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const map = {
    online:  { bg: "#10b981", glow: "0 0 6px rgba(16,185,129,0.5)" },
    loading: { bg: "#F59E0B", glow: "none" },
    error:   { bg: "#EF4444", glow: "none" },
  };
  const s = map[status] ?? map.online;
  return (
    <span
      className={status === "loading" ? "ig-pulse-gold" : ""}
      style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: s.bg, boxShadow: s.glow }}
    />
  );
}

function VolumeBar({ volume }) {
  const pct = Math.min(((volume ?? 0) / 200) * 100, 100);
  return (
    <div style={{ height: 2, borderRadius: 2, overflow: "hidden", background: "var(--ig-card-h)", width: 48, flexShrink: 0 }}>
      <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: "var(--ig-gold)", transition: "width 0.6s ease" }} />
    </div>
  );
}

function QuestionItem({ q, index, isActive, isGenerating, isTop3Pick, onSelect }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onSelect(q)}
      disabled={isGenerating}
      style={{
        width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10,
        border: `1px solid ${isActive ? "var(--ig-gold-bdr)" : "transparent"}`,
        background: isActive ? "var(--ig-gold-dim)" : "transparent",
        cursor: isGenerating ? "not-allowed" : "pointer",
        transition: "all 0.2s", position: "relative",
      }}
      whileHover={{ background: isActive ? "var(--ig-gold-dim)" : "var(--ig-card)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10, marginTop: 2,
          width: 20, flexShrink: 0, textAlign: "right",
          color: isActive ? "var(--ig-gold)" : "var(--ig-tm)",
        }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, lineHeight: 1.45, marginBottom: 6,
            color: isActive ? "var(--ig-tp)" : "var(--ig-ts)",
            fontWeight: isActive ? 500 : 400,
            fontFamily: "var(--font-body)",
          }}>
            {q.keyword}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <VolumeBar volume={q.volume} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ig-tm)" }}>
              {formatVolume(q.volume)}/mo
            </span>
            {q.difficulty > 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ig-tm)" }}>
                KD {q.difficulty}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {isTop3Pick && <Star size={11} style={{ color: "var(--ig-gold)", fill: "var(--ig-gold)" }} />}
          {isActive && <Sparkles size={11} style={{ color: "var(--ig-gold)" }} />}
        </div>
      </div>
      {isActive && isGenerating && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 10,
          border: "1px solid var(--ig-gold-bdr)", pointerEvents: "none",
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.06), transparent)",
          backgroundSize: "200% 100%",
          animation: "ig-shimmer 1.5s infinite",
        }} />
      )}
    </motion.button>
  );
}

function Top3Item({ item, index, isActive, onSelect }) {
  const { question: q, article } = item;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => onSelect(q, article, "infographic")}
      style={{
        width: "100%", textAlign: "left", borderRadius: 12, overflow: "hidden",
        border: `1px solid ${isActive ? "var(--ig-gold)" : "var(--ig-gold-bdr)"}`,
        background: isActive ? "var(--ig-gold-dim)" : "rgba(201,168,76,0.05)",
        cursor: "pointer",
      }}
      whileHover={{ borderColor: "var(--ig-gold)" }}
    >
      {article && (
        <div style={{ position: "relative", height: 64, overflow: "hidden" }}>
          <img
            src={`https://images.unsplash.com/photo-${photoForArticle(article.id).id}?auto=format&fit=crop&w=400&q=70`}
            alt="Las Vegas home"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }} />
          <div style={{ position: "absolute", bottom: 6, left: 10 }}>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ig-gold)" }}>
              ★ AI Pick {index + 1}
            </span>
          </div>
        </div>
      )}
      <div style={{ padding: "10px 12px" }}>
        <p style={{ fontSize: 11, lineHeight: 1.45, fontWeight: 500, color: "var(--ig-tp)", fontFamily: "var(--font-body)" }}>
          {q.keyword}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>
            {formatVolume(q.volume)}/mo
          </span>
          {article ? (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
              Ready
            </span>
          ) : (
            <span style={{ fontSize: 10, color: "var(--ig-tm)" }}>Pending</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function HistoryWeek({ week, data, isOpen, onToggle }) {
  return (
    <div style={{ border: "1px solid var(--ig-bdr)", borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer",
        }}
      >
        <div>
          <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ig-gold)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {week}
          </p>
          <p style={{ fontSize: 10, marginTop: 2, color: "var(--ig-tm)", fontFamily: "var(--font-body)" }}>
            {data.questions?.length ?? 0} questions · {data.articlesGenerated ?? 0} articles
          </p>
        </div>
        {isOpen
          ? <ChevronDown  size={13} style={{ color: "var(--ig-tm)", flexShrink: 0 }} />
          : <ChevronRight size={13} style={{ color: "var(--ig-tm)", flexShrink: 0 }} />
        }
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--ig-bdr)" }}
          >
            <div style={{ padding: "8px 12px 10px" }}>
              {data.questions?.slice(0, 5).map((q, i) => (
                <p key={i} style={{ fontSize: 11, padding: "4px 0", color: "var(--ig-ts)", fontFamily: "var(--font-body)" }}>
                  <span style={{ color: "var(--ig-tm)" }}>{i + 1}.</span> {q.keyword}
                </p>
              ))}
              {(data.questions?.length ?? 0) > 5 && (
                <p style={{ fontSize: 10, color: "var(--ig-tm)" }}>+{data.questions.length - 5} more</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="ig-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ig-skeleton" style={{ height: 32, width: "75%" }} />
      <div className="ig-skeleton" style={{ height: 16, width: "33%" }} />
      <div className="ig-gold-divider" style={{ margin: "16px 0" }} />
      {[100, 90, 95, 85, 100].map((w, i) => (
        <div key={i} className="ig-skeleton" style={{ height: 16, width: `${w}%` }} />
      ))}
      <div className="ig-skeleton" style={{ height: 20, width: "50%", marginTop: 24 }} />
      {[92, 88, 96].map((w, i) => (
        <div key={i} className="ig-skeleton" style={{ height: 16, width: `${w}%` }} />
      ))}
    </div>
  );
}

function AutoGenSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}
    >
      <div className="ig-pulse-gold" style={{
        width: 64, height: 64, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24,
        background: "var(--ig-gold-dim)", border: "1px solid var(--ig-gold-bdr)",
      }}>
        <Star size={32} style={{ color: "var(--ig-gold)" }} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--ig-tp)" }}>
        AI Agent Running
      </h2>
      <p style={{ fontSize: 14, marginBottom: 28, color: "var(--ig-ts)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>
        Analyzing this week's questions, selecting the top 3,<br />and writing your infographic articles…
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
        {["Evaluating 10 questions…", "Selecting top 3 by purchase intent…", "Generating articles via Venice AI…"].map((step, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
            borderRadius: 12, background: "var(--ig-card)",
          }}>
            <div className="ig-pulse-gold" style={{
              width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              background: "var(--ig-gold-dim)", border: "1px solid var(--ig-gold-bdr)",
            }}>
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--ig-gold)" }}>{i + 1}</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--ig-ts)", fontFamily: "var(--font-body)" }}>{step}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function WelcomeScreen({ questionCount, articleCount, top3Count }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 32px" }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24,
        background: "var(--ig-gold-dim)", border: "1px solid var(--ig-gold-bdr)",
      }}>
        <Home size={32} style={{ color: "var(--ig-gold)" }} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 12, color: "var(--ig-tp)" }}>
        Las Vegas Luxury Market
      </h2>
      <p style={{ fontSize: 14, marginBottom: 32, maxWidth: 420, lineHeight: 1.65, color: "var(--ig-ts)", fontFamily: "var(--font-body)" }}>
        Click <strong style={{ color: "var(--ig-gold)" }}>Generate Top 3</strong> to let the AI agent automatically select
        the highest-impact questions and write beautiful infographic articles — or pick any question manually from the left.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: "100%", maxWidth: 360, marginBottom: 32 }}>
        {[
          { label: "Questions This Week", value: questionCount, icon: BarChart2 },
          { label: "Top 3 Infographics",  value: top3Count,     icon: Star      },
          { label: "Articles Generated",  value: articleCount,  icon: FileText  },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={{
            borderRadius: 16, padding: "16px 12px", textAlign: "center",
            background: "var(--ig-card)", border: "1px solid var(--ig-bdr)",
          }}>
            <Icon size={16} style={{ color: "var(--ig-gold)", marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, color: "var(--ig-tp)" }}>{value}</div>
            <div style={{ fontSize: 10, marginTop: 4, color: "var(--ig-tm)", fontFamily: "var(--font-body)" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{
        padding: "10px 18px", borderRadius: 100, fontSize: 12,
        background: "var(--ig-gold-dim)", border: "1px solid var(--ig-gold-bdr)", color: "var(--ig-gold)",
        fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 6,
      }}>
        <MapPin size={12} />
        Summerlin · Henderson · Seven Hills · Green Valley Ranch · Southern Highlands
      </div>
    </motion.div>
  );
}

// ── View toggle + toolbar ─────────────────────────────────────────────────
function Toolbar({ wordCount, article, viewMode, onViewMode, onCopy, copied, onPrint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          padding: "4px 10px", borderRadius: 6, fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em",
          background: "var(--ig-gold-dim)", color: "var(--ig-gold)", border: "1px solid var(--ig-gold-bdr)",
        }}>
          {wordCount} words
        </span>
        <span style={{ fontSize: 11, color: "var(--ig-tm)", display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-body)" }}>
          <Clock size={11} />
          {new Date(article.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        {article.isTop3 && (
          <span style={{
            display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 100, fontSize: 10, fontFamily: "var(--font-mono)",
            background: "rgba(201,168,76,0.12)", color: "var(--ig-gold)", border: "1px solid var(--ig-gold-bdr)",
          }}>
            <Star size={9} style={{ fill: "var(--ig-gold)" }} /> AI Top Pick
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--ig-bdr)" }}>
          {[
            { id: "article",     label: "Article",     icon: <FileCode size={12} /> },
            { id: "infographic", label: "Infographic", icon: <Layout   size={12} /> },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => onViewMode(id)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 11,
              background: viewMode === id ? (id === "infographic" ? "var(--ig-gold-dim)" : "var(--ig-card)") : "transparent",
              color: viewMode === id ? (id === "infographic" ? "var(--ig-gold)" : "var(--ig-tp)") : "var(--ig-tm)",
              border: "none", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s",
            }}>
              {icon} {label}
            </button>
          ))}
        </div>
        {onPrint && (
          <button onClick={onPrint} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, fontSize: 12,
            background: "var(--ig-card)", border: "1px solid var(--ig-bdr)", color: "var(--ig-ts)", cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}>
            <Printer size={13} /> Print
          </button>
        )}
        <button onClick={onCopy} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, fontSize: 12,
          background: copied ? "rgba(16,185,129,0.08)" : "var(--ig-card)",
          border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "var(--ig-bdr)"}`,
          color: copied ? "#10b981" : "var(--ig-ts)", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s",
        }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy to CMS"}
        </button>
      </div>
    </div>
  );
}

// ── Article View ──────────────────────────────────────────────────────────
function ArticleView({ article, onCopy, copied, viewMode, onViewMode }) {
  const wordCount = countWords(article.content);
  return (
    <motion.div key={article.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar
        wordCount={wordCount} article={article} viewMode={viewMode}
        onViewMode={onViewMode} onCopy={onCopy} copied={copied}
      />
      <div className="ig-gold-divider" style={{ marginBottom: 32, flexShrink: 0 }} />
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
        <article className="ig-article" style={{ maxWidth: 680 }}>
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </article>
      </div>
    </motion.div>
  );
}

// ── Infographic View ──────────────────────────────────────────────────────
function InfographicView({ article, onCopy, copied, viewMode, onViewMode }) {
  const photo     = photoForArticle(article.id);
  const wordCount = countWords(article.content);
  const title     = extractTitle(article.content) || article.keyword;
  const body      = bodyWithoutTitle(article.content);
  const photoUrl  = `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=1200&q=80`;

  return (
    <motion.div key={article.id + "-ig"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar
        wordCount={wordCount} article={article} viewMode={viewMode}
        onViewMode={onViewMode} onCopy={onCopy} copied={copied}
        onPrint={() => window.print()}
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div id="ig-print-target" className="ig-infographic-card" style={{
          maxWidth: 680, margin: "0 auto", borderRadius: 20, overflow: "hidden",
          border: "1px solid var(--ig-bdr)", background: "var(--ig-panel)",
        }}>
          {/* Hero photo */}
          <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
            <img
              src={photoUrl} alt={photo.alt}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; e.target.parentElement.style.background = "linear-gradient(135deg,#0a0a0c,#141416)"; }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 100%)" }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 32px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: 100, fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em",
                    background: "var(--ig-gold)", color: "#0a0a0c", fontWeight: 700,
                  }}>
                    Las Vegas · Clark County
                  </span>
                  {article.isTop3 && (
                    <span style={{
                      padding: "4px 12px", borderRadius: 100, fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em",
                      background: "rgba(255,255,255,0.12)", color: "#fff", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)",
                    }}>
                      ★ AI Top Pick
                    </span>
                  )}
                </div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.55rem", fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>
                  {title}
                </h1>
                <p style={{ fontSize: 11, marginTop: 8, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-body)" }}>
                  GoRealestate · Las Vegas, NV · Buyers &amp; Sellers · $500K–$1.5M Market
                </p>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--ig-card)", borderBottom: "1px solid var(--ig-bdr)" }}>
            {[
              { label: "Monthly Searches", value: formatVolume(article.volume ?? 0) },
              { label: "Word Count",       value: wordCount                          },
              { label: "Market Range",     value: "$500K–$1.5M"                      },
              { label: "Territory",        value: "Las Vegas, NV"                    },
            ].map(({ label, value }, i) => (
              <div key={label} style={{
                padding: "12px 8px", textAlign: "center",
                borderLeft: i > 0 ? "1px solid var(--ig-bdr)" : "none",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--ig-gold)" }}>{value}</div>
                <div style={{ fontSize: 10, marginTop: 3, color: "var(--ig-tm)", fontFamily: "var(--font-body)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div style={{ padding: "32px 32px 40px", background: "var(--ig-bg)" }}>
            <article className="ig-article ig-infographic-content">
              <ReactMarkdown>{body}</ReactMarkdown>
            </article>
          </div>

          {/* Footer */}
          <div style={{
            padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            background: "var(--ig-panel)", borderTop: "1px solid var(--ig-bdr)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--ig-gold-dim)", border: "1px solid var(--ig-gold-bdr)",
              }}>
                <Home size={16} style={{ color: "var(--ig-gold)" }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ig-tp)", fontFamily: "var(--font-body)" }}>GoRealestate</p>
                <p style={{ fontSize: 10, color: "var(--ig-tm)", fontFamily: "var(--font-body)" }}>Las Vegas · Henderson · Summerlin · Clark County</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>
                {new Date(article.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
              <p style={{ fontSize: 10, color: "var(--ig-tm)", fontFamily: "var(--font-body)" }}>Photo: {photo.alt}</p>
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 10, marginTop: 12, paddingBottom: 24, color: "var(--ig-tm)", fontFamily: "var(--font-body)" }}>
          Photo via Unsplash · {photo.alt}
        </p>
      </div>
    </motion.div>
  );
}

// ── Hero Section (reference: Tom & Serena Heuser / Summerlin) ────────────
function InfographicsHero() {
  const heroPhoto = "1600596542815-ffad4c1539a9"; // Summerlin-style luxury home
  return (
    <div style={{ position: "relative", width: "100%", height: 340, overflow: "hidden", flexShrink: 0 }}>
      {/* Background photo */}
      <img
        src={`https://images.unsplash.com/photo-${heroPhoto}?auto=format&fit=crop&w=1800&q=85`}
        alt="Las Vegas luxury home"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
      />
      {/* Deep dark overlay matching reference site */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,8,18,0.72) 0%, rgba(5,8,18,0.6) 50%, rgba(5,8,18,0.88) 100%)" }} />

      {/* Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{
            fontSize: 11, fontFamily: "var(--font-mono)", textTransform: "uppercase",
            letterSpacing: "0.18em", color: "#C9A84C", marginBottom: 16,
          }}
        >
          Las Vegas · Clark County · $500K–$1.5M Market
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 14,
            textShadow: "0 2px 24px rgba(0,0,0,0.5)",
          }}
        >
          Infographics
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.6 }}
          style={{
            fontSize: 15, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-body)",
            fontWeight: 400, marginBottom: 28, maxWidth: 480, lineHeight: 1.6,
          }}
        >
          Nevada's Premier AI-Powered Real Estate Market Intelligence
        </motion.p>

        {/* Trust stats bar — mirrors "346+ Summerlin Sales | 22+ Years..." from reference */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          style={{
            display: "flex", alignItems: "center", gap: 0,
            background: "rgba(10,10,14,0.65)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(201,168,76,0.2)", borderRadius: 100,
            padding: "0 4px", overflow: "hidden",
          }}
        >
          {[
            "346+ Summerlin Sales",
            "22+ Years Las Vegas Locals",
            "900+ Five-Star Reviews",
          ].map((stat, i) => (
            <div key={stat} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <span style={{ width: 1, height: 20, background: "rgba(201,168,76,0.25)", margin: "0 2px" }} />
              )}
              <span style={{
                padding: "10px 18px", fontSize: 12, fontFamily: "var(--font-body)", fontWeight: 600,
                color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap",
              }}>
                <span style={{ color: "#C9A84C" }}>{stat.split(" ").slice(0, 2).join(" ")}</span>{" "}
                {stat.split(" ").slice(2).join(" ")}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function InfographicsPage() {
  const [questions,       setQuestions]       = useState([]);
  const [history,         setHistory]         = useState({});
  const [articles,        setArticles]        = useState([]);
  const [top3,            setTop3]            = useState([]);
  const [activeQuestion,  setActiveQuestion]  = useState(null);
  const [activeArticle,   setActiveArticle]   = useState(null);
  const [viewMode,        setViewMode]        = useState("article");
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [isRefreshing,    setIsRefreshing]    = useState(false);
  const [isAutoGen,       setIsAutoGen]       = useState(false);
  const [qLoading,        setQLoading]        = useState(true);
  const [error,           setError]           = useState(null);
  const [openHistoryWeek, setOpenHistoryWeek] = useState(null);
  const [copied,          setCopied]          = useState(false);
  const [totalTokens,     setTotalTokens]     = useState(0);
  const [semrushStatus,   setSemrushStatus]   = useState("online");
  const [veniceStatus,    setVeniceStatus]    = useState("online");
  const [weekLabel,       setWeekLabel]       = useState("");
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [hasAdminToken,   setHasAdminToken]   = useState(() => !!getAdminToken());

  useEffect(() => { loadAll(); }, []);

  function saveAdminToken(e) {
    e.preventDefault();
    const token = adminTokenInput.trim();
    if (!token) return;
    sessionStorage.setItem("gg_admin_token", token);
    setHasAdminToken(true);
    setAdminTokenInput("");
    setError(null);
  }

  async function loadAll() {
    setQLoading(true);
    setError(null);
    try {
      const [qs, hist, arts, t3] = await Promise.all([
        fetchWeeklyQuestions(),
        fetchHistory(),
        fetchArticles(),
        fetchTop3(),
      ]);
      setQuestions(qs.questions ?? []);
      setWeekLabel(qs.week ?? "");
      setHistory(hist ?? {});
      setArticles(arts ?? []);
      setTop3(t3.top3 ?? []);
      setTotalTokens((arts ?? []).reduce((s, a) => s + (a.tokens ?? 0), 0));
    } catch (e) {
      setError(e.message);
      setSemrushStatus("error");
    } finally {
      setQLoading(false);
    }
  }

  async function handleSelectQuestion(q, preloadedArticle, preferredView) {
    setActiveQuestion(q);
    const existing = preloadedArticle
      ?? articles.find((a) => a.keyword.toLowerCase() === q.keyword.toLowerCase());
    if (existing) {
      setActiveArticle(existing);
      if (preferredView) setViewMode(preferredView);
      return;
    }
    setActiveArticle(null);
    if (!getAdminToken()) {
      setError("Admin token required to generate articles.");
      return;
    }
    setIsGenerating(true);
    setVeniceStatus("loading");
    try {
      const result     = await generateArticle(q);
      const newArticle = result.article;
      setActiveArticle(newArticle);
      setArticles((prev) => [newArticle, ...prev]);
      setTotalTokens((t) => t + (newArticle.tokens ?? 0));
      const hist = await fetchHistory();
      setHistory(hist ?? {});
    } catch (e) {
      setError(`Generation failed: ${e.message}`);
      setVeniceStatus("error");
    } finally {
      setIsGenerating(false);
      setVeniceStatus("online");
    }
  }

  async function handleAutoGenerate() {
    if (!getAdminToken()) {
      setError("Admin token required to run the weekly generator.");
      return;
    }
    setIsAutoGen(true);
    setError(null);
    setSemrushStatus("loading");
    setVeniceStatus("loading");
    try {
      const result = await triggerAutoGenerate();
      await loadAll();
      const first = result.results?.find((r) => r.article && !r.skipped);
      if (first?.article) {
        setActiveArticle(first.article);
        setActiveQuestion({ keyword: first.article.keyword });
        setViewMode("infographic");
      }
      setSemrushStatus("online");
      setVeniceStatus("online");
    } catch (e) {
      setError(`Auto-generate failed: ${e.message}`);
      setSemrushStatus("error");
      setVeniceStatus("error");
    } finally {
      setIsAutoGen(false);
    }
  }

  async function handleRefresh() {
    if (!getAdminToken()) {
      setError("Admin token required to refresh SEMrush questions.");
      return;
    }
    setIsRefreshing(true);
    setSemrushStatus("loading");
    setError(null);
    try {
      await refreshQuestions();
      await loadAll();
      setSemrushStatus("online");
    } catch (e) {
      setError(`Refresh failed: ${e.message}`);
      setSemrushStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleCopy() {
    if (!activeArticle) return;
    navigator.clipboard.writeText(activeArticle.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const top3Keywords     = new Set(top3.map((t) => t.question?.keyword?.toLowerCase()));
  const historyEntries   = Object.entries(history).sort(([a], [b]) => b.localeCompare(a));
  const top3ArticleCount = top3.filter((t) => t.article).length;
  const showInfographic  = activeArticle && viewMode === "infographic";
  const showArticle      = activeArticle && viewMode === "article";

  return (
    <div style={{ ...SCOPE_VARS, display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 56px)" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <InfographicsHero />

      {/* ── Status header strip ──────────────────────────────────────── */}
      <div className="ig-no-print" style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 24px", background: "var(--ig-panel)",
        borderBottom: "1px solid var(--ig-bdr)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusDot status={semrushStatus} />
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>SEMrush</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusDot status={veniceStatus} />
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>Venice AI</span>
          </div>
          <div style={{ width: 1, height: 16, background: "var(--ig-bdr)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Cpu size={13} style={{ color: "var(--ig-tm)" }} />
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>
              {totalTokens.toLocaleString()} tokens
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <FileText size={13} style={{ color: "var(--ig-tm)" }} />
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>
              {articles.length} articles
            </span>
          </div>
        </div>
        {hasAdminToken ? (
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ig-gold)" }}>
            Admin unlocked · Pipeline: SEMrush → AI Agent → Venice AI
          </span>
        ) : (
          <form onSubmit={saveAdminToken} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              value={adminTokenInput}
              onChange={(e) => setAdminTokenInput(e.target.value)}
              placeholder="Admin token"
              type="password"
              style={{
                width: 132, padding: "6px 9px", borderRadius: 8,
                border: "1px solid var(--ig-bdr)", background: "var(--ig-card)",
                color: "var(--ig-tp)", fontSize: 11, fontFamily: "var(--font-mono)", outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "6px 10px", borderRadius: 8, border: "1px solid var(--ig-gold-bdr)",
                background: "var(--ig-gold-dim)", color: "var(--ig-gold)",
                fontSize: 10, fontFamily: "var(--font-mono)", cursor: "pointer",
              }}
            >
              Unlock
            </button>
          </form>
        )}
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="ig-no-print"
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", fontSize: 12,
              background: "rgba(239,68,68,0.07)", borderBottom: "1px solid rgba(239,68,68,0.14)", color: "#f87171",
              fontFamily: "var(--font-body)",
            }}
          >
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: "auto", opacity: 0.6, background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14 }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Three-Panel Workspace ─────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* LEFT: Weekly Questions + Top 3 */}
        <aside className="ig-no-print" style={{
          display: "flex", flexDirection: "column", width: 280, flexShrink: 0, overflow: "hidden",
          borderRight: "1px solid var(--ig-bdr)", background: "var(--ig-panel)",
        }}>
          {/* Panel header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", flexShrink: 0, borderBottom: "1px solid var(--ig-bdr)",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={13} style={{ color: "var(--ig-gold)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ig-tp)", fontFamily: "var(--font-body)" }}>
                  Weekly Questions
                </span>
              </div>
              {weekLabel && (
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 2, color: "var(--ig-tm)" }}>
                  {weekLabel}
                </p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || qLoading}
              title="Refresh from SEMrush"
              style={{
                padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer",
                opacity: isRefreshing || qLoading ? 0.4 : 1, transition: "all 0.2s",
              }}
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} style={{ color: "var(--ig-tm)" }} />
            </button>
          </div>

          {/* Generate Top 3 Button */}
          <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
            <motion.button
              onClick={handleAutoGenerate}
              disabled={isAutoGen || isGenerating || qLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "11px 0", borderRadius: 14, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: isAutoGen ? "var(--ig-gold-dim)" : "var(--ig-gold)",
                color: isAutoGen ? "var(--ig-gold)" : "#0a0a0c",
                border: "1px solid var(--ig-gold-bdr)",
                opacity: isAutoGen || isGenerating || qLoading ? 0.6 : 1,
                fontFamily: "var(--font-body)",
              }}
            >
              {isAutoGen
                ? <><Sparkles size={13} className="ig-pulse-gold" /> AI Agent Running…</>
                : <><Star     size={13} /> Generate Weekly Top 3</>
              }
            </motion.button>
          </div>

          {/* Top 3 AI Picks */}
          {top3.length > 0 && (
            <div style={{ padding: "0 12px 8px", flexShrink: 0 }}>
              <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ig-gold)", marginBottom: 8, paddingLeft: 2 }}>
                ★ AI Top Picks This Week
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {top3.map((item, i) => (
                  <Top3Item
                    key={item.question?.keyword}
                    item={item}
                    index={i}
                    isActive={activeQuestion?.keyword === item.question?.keyword}
                    onSelect={(q, article) => handleSelectQuestion(q, article, "infographic")}
                  />
                ))}
              </div>
              <div className="ig-gold-divider" style={{ margin: "12px 0 4px" }} />
              <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ig-tm)", paddingLeft: 2, marginBottom: 4 }}>
                All Questions
              </p>
            </div>
          )}

          {/* Questions list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {qLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="ig-skeleton" style={{ height: 58, borderRadius: 10 }} />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 16px" }}>
                <Database size={32} style={{ color: "var(--ig-tm)", marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: "var(--ig-ts)", fontFamily: "var(--font-body)" }}>No questions yet</p>
                <p style={{ fontSize: 11, marginTop: 4, color: "var(--ig-tm)", fontFamily: "var(--font-body)" }}>Click refresh to pull from SEMrush</p>
              </div>
            ) : (
              questions.map((q, i) => (
                <QuestionItem
                  key={q.keyword}
                  q={q}
                  index={i}
                  isActive={activeQuestion?.keyword === q.keyword}
                  isGenerating={isGenerating && activeQuestion?.keyword === q.keyword}
                  isTop3Pick={top3Keywords.has(q.keyword?.toLowerCase())}
                  onSelect={(q) => handleSelectQuestion(q)}
                />
              ))
            )}
          </div>

          <div style={{ flexShrink: 0, padding: "10px 16px", borderTop: "1px solid var(--ig-bdr)" }}>
            <p style={{ fontSize: 10, textAlign: "center", fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>
              SEMrush → AI Agent → Venice AI · Auto-refreshes weekly
            </p>
          </div>
        </aside>

        {/* CENTER: Workspace */}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--ig-bg)" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
            {isAutoGen ? (
              <AutoGenSkeleton />
            ) : isGenerating ? (
              <ArticleSkeleton />
            ) : showInfographic ? (
              <InfographicView
                article={activeArticle}
                onCopy={handleCopy}
                copied={copied}
                viewMode={viewMode}
                onViewMode={setViewMode}
              />
            ) : showArticle ? (
              <ArticleView
                article={activeArticle}
                onCopy={handleCopy}
                copied={copied}
                viewMode={viewMode}
                onViewMode={setViewMode}
              />
            ) : (
              <WelcomeScreen
                questionCount={questions.length}
                articleCount={articles.length}
                top3Count={top3ArticleCount}
              />
            )}
          </div>

          {/* Generating status */}
          <AnimatePresence>
            {(isGenerating || isAutoGen) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="ig-no-print"
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "10px 40px",
                  borderTop: "1px solid var(--ig-bdr)", background: "var(--ig-panel)",
                }}
              >
                <Zap size={13} className="ig-pulse-gold" style={{ color: "var(--ig-gold)" }} />
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ig-gold)" }}>
                  {isAutoGen
                    ? "AI Agent: selecting top 3 questions + generating infographic articles…"
                    : `Venice AI synthesizing article for "${activeQuestion?.keyword}"…`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="ig-no-print" style={{
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 40px",
            borderTop: "1px solid var(--ig-bdr)", background: "var(--ig-panel)",
          }}>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>
              Pipeline: SEMrush → AI Agent → Venice AI → Infographic · Las Vegas $500K–$1.5M
            </span>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ig-tm)" }}>GoRealestate Intelligence v2.0</span>
          </div>
        </main>

        {/* RIGHT: History */}
        <aside className="ig-no-print" style={{
          display: "flex", flexDirection: "column", width: 240, flexShrink: 0, overflow: "hidden",
          borderLeft: "1px solid var(--ig-bdr)", background: "var(--ig-panel)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", flexShrink: 0, borderBottom: "1px solid var(--ig-bdr)" }}>
            <BookOpen size={13} style={{ color: "var(--ig-gold)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ig-tp)", fontFamily: "var(--font-body)" }}>
              Research History
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {historyEntries.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 16px", paddingTop: 32 }}>
                <Clock size={28} style={{ color: "var(--ig-tm)", marginBottom: 10 }} />
                <p style={{ fontSize: 11, color: "var(--ig-tm)", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
                  History builds week by week. Check back after the first automated pull.
                </p>
              </div>
            ) : (
              historyEntries.map(([week, data]) => (
                <HistoryWeek
                  key={week}
                  week={week}
                  data={data}
                  isOpen={openHistoryWeek === week}
                  onToggle={() => setOpenHistoryWeek(openHistoryWeek === week ? null : week)}
                />
              ))
            )}
          </div>

          {articles.length > 0 && (
            <div style={{ flexShrink: 0, padding: "12px 16px", borderTop: "1px solid var(--ig-bdr)" }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, color: "var(--ig-tm)", fontFamily: "var(--font-body)" }}>
                Generated Articles
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 180, overflowY: "auto" }}>
                {articles.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setActiveArticle(a);
                      setActiveQuestion({ keyword: a.keyword });
                      setViewMode(a.isTop3 ? "infographic" : "article");
                    }}
                    style={{
                      width: "100%", textAlign: "left", padding: "5px 8px", borderRadius: 6, fontSize: 11,
                      display: "flex", alignItems: "center", gap: 6,
                      background: activeArticle?.id === a.id ? "var(--ig-gold-dim)" : "transparent",
                      color: activeArticle?.id === a.id ? "var(--ig-gold)" : "var(--ig-ts)",
                      border: "none", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s",
                    }}
                  >
                    {a.isTop3 && <Star size={9} style={{ color: "var(--ig-gold)", fill: "var(--ig-gold)", flexShrink: 0 }} />}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.keyword.length > 32 ? a.keyword.slice(0, 32) + "…" : a.keyword}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
