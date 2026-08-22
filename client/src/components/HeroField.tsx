/* HeroField: animated gradient-mesh + particle layer that replaces the static hero background image.
   Built from blurred SVG blobs that drift on a slow loop and nudge toward the cursor, plus a lightweight
   CSS particle field. Fully respects prefers-reduced-motion by freezing the drift and particle motion. */

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import type { CSSProperties } from "react";

interface HeroFieldProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

const blobs = [
  { cx: 640, cy: 150, r: 220, color: "rgba(56,189,248,0.24)", depth: 22, duration: 15 },
  { cx: 200, cy: 400, r: 170, color: "rgba(125,211,252,0.16)", depth: 14, duration: 19 },
  { cx: 880, cy: 440, r: 200, color: "rgba(14,165,233,0.16)", depth: 18, duration: 17 },
] as const;

function HeroBlob({
  blob,
  mouseX,
  mouseY,
  reduceMotion,
}: {
  blob: (typeof blobs)[number];
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const dx = useTransform(mouseX, [-1, 1], [-blob.depth, blob.depth]);
  const dy = useTransform(mouseY, [-1, 1], [-blob.depth, blob.depth]);

  return (
    <motion.circle
      cx={blob.cx}
      cy={blob.cy}
      r={blob.r}
      fill={blob.color}
      filter="url(#hero-field-blur)"
      style={{ x: dx, y: dy }}
      animate={
        reduceMotion
          ? undefined
          : {
              cx: [blob.cx - 34, blob.cx + 34, blob.cx - 34],
              cy: [blob.cy + 22, blob.cy - 22, blob.cy + 22],
            }
      }
      transition={reduceMotion ? undefined : { duration: blob.duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function HeroField({ mouseX, mouseY }: HeroFieldProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <div className="hero-field" aria-hidden="true">
      <svg
        className="hero-field__mesh"
        viewBox="0 0 1080 640"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <defs>
          <filter id="hero-field-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        {blobs.map((blob, index) => (
          <HeroBlob key={index} blob={blob} mouseX={mouseX} mouseY={mouseY} reduceMotion={shouldReduceMotion} />
        ))}
      </svg>
      <div className="hero-field__grid" />
      {!shouldReduceMotion && (
        <div className="hero-field__particles">
          {Array.from({ length: 24 }).map((_, index) => (
            <span key={index} style={{ ["--i" as string]: index } as CSSProperties} />
          ))}
        </div>
      )}
    </div>
  );
}
