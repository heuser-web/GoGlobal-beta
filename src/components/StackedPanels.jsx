import { useRef, useCallback } from "react";
import { motion, useSpring } from "framer-motion";

const PANEL_COUNT = 12;
const WAVE_SPRING = { stiffness: 160, damping: 22, mass: 0.6 };
const SCENE_SPRING = { stiffness: 80, damping: 22, mass: 1 };
const Z_SPREAD = 42;
const SIGMA = 2.8;

// National park photos for the Las Vegas area parks — ordered to match NATIONAL_PARKS
const PANEL_IMAGES = [
  "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=400&q=80", // Red Rock Canyon
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&q=80", // Lake Mead
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80", // Valley of Fire
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80", // Mount Charleston
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", // Zion
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80", // Death Valley
  "https://images.unsplash.com/photo-1615551043360-33de8b5f410c?w=400&q=80", // Grand Canyon
  "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80", // Mojave
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80", // Joshua Tree
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80", // Bryce Canyon
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80", // Great Basin
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&q=80", // Grand Staircase
];

const PARK_NAMES = [
  "Red Rock Canyon",
  "Lake Mead NRA",
  "Valley of Fire",
  "Mt. Charleston",
  "Zion NP",
  "Death Valley NP",
  "Grand Canyon",
  "Mojave Preserve",
  "Joshua Tree NP",
  "Bryce Canyon NP",
  "Great Basin NP",
  "Grand Staircase",
];

const GRADIENT_OVERLAYS = [
  "linear-gradient(135deg, rgba(99,55,255,0.45) 0%, rgba(236,72,153,0.35) 100%)",
  "linear-gradient(135deg, rgba(6,182,212,0.45) 0%, rgba(59,130,246,0.35) 100%)",
  "linear-gradient(135deg, rgba(245,158,11,0.45) 0%, rgba(239,68,68,0.35) 100%)",
  "linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(6,182,212,0.45) 100%)",
  "linear-gradient(135deg, rgba(236,72,153,0.45) 0%, rgba(245,158,11,0.35) 100%)",
  "linear-gradient(135deg, rgba(59,130,246,0.45) 0%, rgba(99,55,255,0.35) 100%)",
  "linear-gradient(135deg, rgba(239,68,68,0.35) 0%, rgba(236,72,153,0.45) 100%)",
  "linear-gradient(135deg, rgba(6,182,212,0.35) 0%, rgba(16,185,129,0.45) 100%)",
  "linear-gradient(135deg, rgba(99,55,255,0.35) 0%, rgba(6,182,212,0.45) 100%)",
  "linear-gradient(135deg, rgba(245,158,11,0.35) 0%, rgba(16,185,129,0.45) 100%)",
  "linear-gradient(135deg, rgba(239,68,68,0.45) 0%, rgba(245,158,11,0.35) 100%)",
  "linear-gradient(135deg, rgba(99,55,255,0.45) 0%, rgba(59,130,246,0.35) 100%)",
];

function Panel({ index, total, waveY, scaleY }) {
  const t = index / (total - 1);
  const baseZ = (index - (total - 1)) * Z_SPREAD;

  const w = 200 + t * 80;
  const h = 280 + t * 120;

  const opacity = 0.25 + t * 0.75;
  const imageUrl = PANEL_IMAGES[index % PANEL_IMAGES.length];
  const gradient = GRADIENT_OVERLAYS[index % GRADIENT_OVERLAYS.length];
  const name = PARK_NAMES[index % PARK_NAMES.length];

  return (
    <motion.div
      style={{
        position: "absolute",
        borderRadius: 16,
        pointerEvents: "none",
        overflow: "hidden",
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        translateZ: baseZ,
        y: waveY,
        scaleY,
        transformOrigin: "bottom center",
        opacity,
      }}
    >
      {/* Background photo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Color gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: gradient,
          mixBlendMode: "multiply",
        }}
      />
      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Park name label at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-display, 'Syne', sans-serif)",
          fontSize: Math.max(9, 8 + t * 4),
          fontWeight: 700,
          color: "rgba(255,255,255,0.9)",
          letterSpacing: "0.04em",
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          padding: "0 8px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </div>
      {/* Border glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          border: `1px solid rgba(255,255,255,${0.08 + t * 0.22})`,
          boxSizing: "border-box",
        }}
      />
    </motion.div>
  );
}

export default function StackedPanels() {
  const containerRef = useRef(null);
  const isHovering = useRef(false);

  const waveYSprings = Array.from({ length: PANEL_COUNT }, () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpring(0, WAVE_SPRING)
  );

  const scaleYSprings = Array.from({ length: PANEL_COUNT }, () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSpring(1, WAVE_SPRING)
  );

  const rotY = useSpring(-42, SCENE_SPRING);
  const rotX = useSpring(18, SCENE_SPRING);

  const handleMouseMove = useCallback(
    (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      isHovering.current = true;

      const cx = (e.clientX - rect.left) / rect.width;
      const cy = (e.clientY - rect.top) / rect.height;

      rotY.set(-42 + (cx - 0.5) * 14);
      rotX.set(18 + (cy - 0.5) * -10);

      const cursorCardPos = cx * (PANEL_COUNT - 1);

      waveYSprings.forEach((spring, i) => {
        const dist = Math.abs(i - cursorCardPos);
        const influence = Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA));
        spring.set(-influence * 70);
      });

      scaleYSprings.forEach((spring, i) => {
        const dist = Math.abs(i - cursorCardPos);
        const influence = Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA));
        spring.set(0.35 + influence * 0.65);
      });
    },
    [rotY, rotX, waveYSprings, scaleYSprings]
  );

  const handleMouseLeave = useCallback(() => {
    isHovering.current = false;
    rotY.set(-42);
    rotX.set(18);
    waveYSprings.forEach((s) => s.set(0));
    scaleYSprings.forEach((s) => s.set(1));
  }, [rotY, rotX, waveYSprings, scaleYSprings]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        perspective: "900px",
      }}
    >
      <motion.div
        style={{
          rotateY: rotY,
          rotateX: rotX,
          transformStyle: "preserve-3d",
          position: "relative",
          width: 0,
          height: 0,
        }}
      >
        {Array.from({ length: PANEL_COUNT }).map((_, i) => (
          <Panel
            key={i}
            index={i}
            total={PANEL_COUNT}
            waveY={waveYSprings[i]}
            scaleY={scaleYSprings[i]}
          />
        ))}
      </motion.div>
    </div>
  );
}
