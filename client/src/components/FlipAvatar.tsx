/* FlipAvatar: 3D flip-card portrait for the hero panel. Auto-flips between two photos on a
   timer, pauses while the panel is hovered/focused (so it doesn't distract someone actively
   reading the hero copy), and falls back to a plain crossfade for prefers-reduced-motion
   visitors — mirroring the shouldReduceMotion pattern already used elsewhere in Home.tsx. */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FlipAvatarProps {
  /** Used as the front-face alt text. */
  name: string;
  /** Pauses the auto-flip timer while true (panel hover/focus). */
  paused: boolean;
}

const FLIP_INTERVAL_MS = 2000;
const FLIP_DURATION_S = 0.7;
const CROSSFADE_DURATION_S = 0.5;
const FLIP_EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

export default function FlipAvatar({ name, paused }: FlipAvatarProps) {
  const [flipped, setFlipped] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused) return;
    const intervalId = window.setInterval(() => setFlipped((prev) => !prev), FLIP_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [paused]);

  if (shouldReduceMotion) {
    return (
      <div className="flip-avatar flip-avatar--crossfade">
        <motion.img
          src="/profile1.png"
          alt={name}
          className="flip-avatar__face"
          animate={{ opacity: flipped ? 0 : 1 }}
          transition={{ duration: CROSSFADE_DURATION_S, ease: "easeInOut" }}
        />
        <motion.img
          src="/profile2.png"
          alt=""
          aria-hidden="true"
          className="flip-avatar__face"
          animate={{ opacity: flipped ? 1 : 0 }}
          transition={{ duration: CROSSFADE_DURATION_S, ease: "easeInOut" }}
        />
      </div>
    );
  }

  return (
    <div className="flip-avatar">
      <motion.div
        className="flip-avatar__inner"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: FLIP_DURATION_S, ease: FLIP_EASE }}
      >
        <img src="/profile1.png" alt={name} className="flip-avatar__face flip-avatar__face--front" />
        <img src="/profile2.png" alt="" aria-hidden="true" className="flip-avatar__face flip-avatar__face--back" />
      </motion.div>
    </div>
  );
}
