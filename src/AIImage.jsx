import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { generateImage } from "./imageService";

/**
 * AIImage — Drop-in image component powered by Gemini image generation.
 *
 * - Generates a real AI photo from `prompt` on mount (lazy, cached in sessionStorage)
 * - Ken Burns: slow continuous zoom loop on the image while displayed
 * - Parallax: optional vertical offset based on scroll position
 * - Hover zoom: gentle scale-up on parent hover (set via CSS or parent whileHover)
 * - Falls back to gradient + icon if generation fails
 *
 * The component fills `position: absolute, inset: 0` of its parent.
 * Wrap in a container with `position: relative; overflow: hidden`.
 */
export function AIImage({
  prompt,
  gradient = "linear-gradient(135deg, #1a1a2e, #16213e)",
  icon = "📸",
  label,
  kenBurns = true,
  parallax = false,
}) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(!!prompt);
  const containerRef = useRef(null);

  // Parallax scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const yShift = useTransform(
    scrollYProgress,
    [0, 1],
    parallax ? ["-12%", "12%"] : ["0%", "0%"]
  );

  useEffect(() => {
    if (!prompt) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setSrc(null);

    generateImage(prompt).then((result) => {
      if (!cancelled) {
        setSrc(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [prompt]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: gradient,
      }}
    >
      {/* Shimmer skeleton while generating */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background:
              "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s linear infinite",
          }}
        />
      )}

      {/* AI-generated image */}
      {src && (
        <motion.div
          style={{
            position: "absolute",
            inset: "-10%",
            y: yShift,
          }}
        >
          <motion.img
            src={src}
            alt={label || ""}
            initial={{ opacity: 0, scale: 1.0 }}
            animate={
              kenBurns
                ? { opacity: 1, scale: 1.1 }
                : { opacity: 1, scale: 1.0 }
            }
            transition={
              kenBurns
                ? {
                    opacity: { duration: 0.9, ease: "easeOut" },
                    scale: {
                      duration: 10,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    },
                  }
                : { opacity: { duration: 0.9 } }
            }
            style={{
              width: "120%",
              height: "120%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </motion.div>
      )}

      {/* Gradient overlay for text legibility — always rendered */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Fallback icon — shown when no image loaded */}
      {!loading && !src && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            zIndex: 2,
          }}
        >
          <span style={{ fontSize: 36, opacity: 0.8 }}>{icon}</span>
          {label && (
            <span
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
