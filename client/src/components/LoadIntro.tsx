/* LoadIntro: brief name/logo reveal shown once per session before the hero settles in.
   Auto-dismisses after ~800ms, but is skippable at any time via click, tap, or key press.
   Reduced-motion visitors skip straight past it (no flash, no transform -- just gone). */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { portfolio } from "@/content/portfolio";

const SESSION_KEY = "sitd-intro-shown";
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

function alreadyShown() {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export default function LoadIntro() {
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(() => !alreadyShown());

  useEffect(() => {
    if (!visible) return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* sessionStorage unavailable (private mode, etc.) -- just show the intro once anyway */
    }

    // Reduced motion: skip the sequence entirely rather than flashing it instantly.
    if (shouldReduceMotion) {
      setVisible(false);
      return;
    }

    const dismiss = () => setVisible(false);
    const timeout = window.setTimeout(dismiss, 780);
    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", dismiss);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, [visible, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="load-intro"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: EASE_OUT } }}
        >
          <motion.span
            className="load-intro__mark"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            {portfolio.identity.name}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
