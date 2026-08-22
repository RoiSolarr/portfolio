/* CustomCursor: a small dot-and-ring cursor that follows the pointer with spring physics and scales
   up with a glow when hovering interactive elements (links, buttons, cards). Only activates for
   fine-pointer (mouse/trackpad) visitors who haven't requested reduced motion — touch devices and
   reduced-motion visitors keep their native cursor and see nothing extra rendered. */

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const INTERACTIVE_SELECTOR =
  'a, button, .project-card, .value-card, .skill-list span, .tech-tag, [data-cursor-hover]';

export default function CustomCursor() {
  const shouldReduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const cx = useMotionValue(-100);
  const cy = useMotionValue(-100);
  const springConfig = { stiffness: 320, damping: 30, mass: 0.4 };
  const sx = useSpring(cx, springConfig);
  const sy = useSpring(cy, springConfig);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    setEnabled(fine && !shouldReduceMotion);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!enabled) return;

    document.body.classList.add("custom-cursor-active");

    const handleMove = (event: globalThis.MouseEvent) => {
      cx.set(event.clientX);
      cy.set(event.clientY);
    };
    const handleOver = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      setHovering(!!target?.closest(INTERACTIVE_SELECTOR));
    };
    const handleLeaveWindow = () => {
      cx.set(-100);
      cy.set(-100);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseover", handleOver, { passive: true });
    window.addEventListener("mouseout", handleLeaveWindow);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
      window.removeEventListener("mouseout", handleLeaveWindow);
    };
  }, [enabled, cx, cy]);

  if (!enabled) return null;

  return (
    <motion.div
      className={`custom-cursor${hovering ? " custom-cursor--hover" : ""}`}
      style={{ left: sx, top: sy }}
      aria-hidden="true"
    />
  );
}
