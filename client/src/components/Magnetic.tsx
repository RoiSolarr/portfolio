/* Magnetic: wraps a button/link so it gently pulls toward the cursor while hovered, within a small
   radius, then springs back on mouse-leave. Skips the effect for reduced-motion and touch/coarse-pointer
   visitors, where it just renders the child untouched. */

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";

interface MagneticProps {
  children: ReactNode;
  className?: string;
  /** Max pull distance in pixels. */
  strength?: number;
}

export default function Magnetic({ children, className, strength = 16 }: MagneticProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 16, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 220, damping: 16, mass: 0.35 });

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    x.set((relX / (rect.width / 2)) * strength);
    y.set((relY / (rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY, display: "inline-flex" }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
}
