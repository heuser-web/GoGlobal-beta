import { useState, useRef, useId } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Map, Navigation, ExternalLink } from "lucide-react";

/**
 * LocationMap — expand-on-click map card.
 *
 * Props:
 *   location      {string}  — display name, e.g. "Las Vegas, NV"
 *   coordinates   {string}  — formatted coords, e.g. "36.1699° N, 115.1398° W"
 *   label         {string}  — small badge above card, e.g. "Location A"
 *   accentColor   {string}  — pin + underline color, default "#FF2D55"
 *   directionsHref {string} — if set, shows a "Get Directions" button (midpoint map)
 *   className     {string}  — extra class names
 */
export function LocationMap({
  location = "Unknown Location",
  coordinates = "",
  label = "",
  accentColor = "#FF2D55",
  directionsHref = null,
  className = "",
}) {
  const uid           = useId().replace(/:/g, "");
  const [isHovered, setIsHovered]   = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef  = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-50, 50], [8, -8]);
  const rotateY = useTransform(mouseX, [-50, 50], [-8, 8]);
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect    = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width  / 2;
    const centerY = rect.top  + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  // ── GoGlobal dark colour palette (inline — no Tailwind class dependency) ─
  const bg          = "rgba(255,255,255,0.04)";
  const bgExpanded  = "rgba(18,18,22,0.96)";
  const borderCol   = "rgba(255,255,255,0.07)";
  const textPrimary = "#F5F5F7";
  const textMuted   = "rgba(255,255,255,0.38)";
  const roadMain    = "rgba(255,255,255,0.18)";
  const roadSec     = "rgba(255,255,255,0.07)";
  const buildingFill= "rgba(255,255,255,0.10)";
  const buildingBdr = "rgba(255,255,255,0.06)";

  return (
    <div className={`relative select-none ${className}`} style={{ display: "inline-block" }}>
      {/* Optional label above */}
      {label && (
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600,
          color: accentColor, textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: 8, textAlign: "center",
        }}>
          {label}
        </p>
      )}

      <motion.div
        ref={containerRef}
        style={{ perspective: 1000, cursor: "pointer" }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsExpanded(p => !p)}
      >
        <motion.div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            background: bg,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isExpanded ? accentColor + "40" : borderCol}`,
            boxShadow: isExpanded ? `0 0 32px ${accentColor}18` : "0 4px 24px rgba(0,0,0,0.25)",
            rotateX: springRotateX,
            rotateY: springRotateY,
            transformStyle: "preserve-3d",
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}
          animate={{
            width:  isExpanded ? 280 : 200,
            height: isExpanded ? 240 : 120,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        >

          {/* ── Expanded map interior ──────────────────────────────── */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                {/* Map base */}
                <div style={{ position: "absolute", inset: 0, background: bgExpanded }} />

                {/* Roads SVG */}
                <svg
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                  preserveAspectRatio="none"
                >
                  {/* Main horizontals */}
                  {["35%", "65%"].map((y, i) => (
                    <motion.line
                      key={`mh-${i}`}
                      x1="0%" y1={y} x2="100%" y2={y}
                      stroke={roadMain} strokeWidth="3"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.1 }}
                    />
                  ))}
                  {/* Main verticals */}
                  {["30%", "70%"].map((x, i) => (
                    <motion.line
                      key={`mv-${i}`}
                      x1={x} y1="0%" x2={x} y2="100%"
                      stroke={roadMain} strokeWidth="2.5"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                    />
                  ))}
                  {/* Secondary horizontals */}
                  {[15, 50, 80].map((y, i) => (
                    <motion.line
                      key={`sh-${i}`}
                      x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`}
                      stroke={roadSec} strokeWidth="1.5"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.45 + i * 0.08 }}
                    />
                  ))}
                  {/* Secondary verticals */}
                  {[15, 45, 55, 85].map((x, i) => (
                    <motion.line
                      key={`sv-${i}`}
                      x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%"
                      stroke={roadSec} strokeWidth="1.5"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.53 + i * 0.08 }}
                    />
                  ))}
                </svg>

                {/* Buildings */}
                {[
                  { t: "40%", l: "10%", w: "15%", h: "20%", d: 0.5 },
                  { t: "15%", l: "35%", w: "12%", h: "15%", d: 0.6 },
                  { t: "70%", l: "75%", w: "18%", h: "18%", d: 0.65 },
                  { t: "20%", r: "10%", w: "10%", h: "25%", d: 0.55 },
                  { t: "55%", l:  "5%", w:  "8%", h: "12%", d: 0.7  },
                  { t:  "8%", l: "72%", w: "14%", h: "10%", d: 0.75 },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    style={{
                      position: "absolute",
                      top: b.t, left: b.l, right: b.r,
                      width: b.w, height: b.h,
                      borderRadius: 3,
                      background: buildingFill,
                      border: `1px solid ${buildingBdr}`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: b.d }}
                  />
                ))}

                {/* Pin */}
                <motion.div
                  style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ scale: 0, y: -16 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 20, delay: 0.25 }}
                >
                  <svg
                    width="28" height="28" viewBox="0 0 24 24" fill="none"
                    style={{ filter: `drop-shadow(0 0 10px ${accentColor}80)` }}
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill={accentColor}
                    />
                    <circle cx="12" cy="9" r="2.5" fill="rgba(0,0,0,0.55)" />
                  </svg>
                </motion.div>

                {/* Bottom gradient scrim */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)",
                }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Grid pattern when collapsed ───────────────────────── */}
          <motion.div
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            animate={{ opacity: isExpanded ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <pattern
                  id={`grid-${uid}`}
                  width="20" height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${uid})`} />
            </svg>
          </motion.div>

          {/* ── Gradient overlay ────────────────────────────────────── */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)",
          }} />

          {/* ── Card content ────────────────────────────────────────── */}
          <div style={{
            position: "relative", zIndex: 10,
            height: "100%", display: "flex", flexDirection: "column",
            justifyContent: "space-between", padding: "16px 18px",
          }}>
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <motion.div animate={{ opacity: isExpanded ? 0 : 1 }} transition={{ duration: 0.25 }}>
                <motion.div
                  animate={{
                    filter: isHovered
                      ? `drop-shadow(0 0 8px ${accentColor}99)`
                      : `drop-shadow(0 0 4px ${accentColor}55)`,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Map size={16} color={accentColor} />
                </motion.div>
              </motion.div>

              {/* Live pill */}
              <motion.div
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 9px", borderRadius: 100,
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 600,
                  color: textMuted, letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                  Live
                </span>
              </motion.div>
            </div>

            {/* Bottom row */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <motion.h3
                style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
                  color: textPrimary, margin: 0, lineHeight: 1.3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
                animate={{ x: isHovered ? 3 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {location}
              </motion.h3>

              <AnimatePresence>
                {isExpanded && coordinates && (
                  <motion.p
                    style={{
                      fontFamily: "var(--font-mono, monospace)", fontSize: 10,
                      color: textMuted, margin: 0,
                    }}
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {coordinates}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Accent underline */}
              <motion.div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, ${accentColor}70, ${accentColor}30, transparent)`,
                  transformOrigin: "left",
                }}
                animate={{ scaleX: isHovered || isExpanded ? 1 : 0.25 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Click hint */}
        <motion.p
          style={{
            position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)",
            fontFamily: "var(--font-body)", fontSize: 10, color: textMuted,
            whiteSpace: "nowrap", pointerEvents: "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered && !isExpanded ? 1 : 0, y: isHovered ? 0 : 4 }}
          transition={{ duration: 0.2 }}
        >
          Click to expand
        </motion.p>
      </motion.div>

      {/* Directions button — only on midpoint map */}
      <AnimatePresence>
        {directionsHref && isExpanded && (
          <motion.a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              marginTop: 12, padding: "9px 0",
              borderRadius: 100,
              background: accentColor,
              color: "#fff",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
              textDecoration: "none",
              boxShadow: `0 4px 16px ${accentColor}40`,
              width: "100%",
            }}
          >
            <Navigation size={12} /> Get Directions <ExternalLink size={11} style={{ opacity: 0.7 }} />
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
