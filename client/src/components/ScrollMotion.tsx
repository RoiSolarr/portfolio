/* ScrollMotion: scroll-linked transform helpers built on useScroll + useTransform.
   - ScrollParallax: drifts a decorative background layer as the page scrolls past it.
   - useHeroScrub: scale/opacity/translate values for the hero as the user scrolls away from it.
   - ScrollDrawLine: wraps a container and draws a glowing line down its side as it scrolls into view,
     used for the experience timeline. */

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, type ReactNode, type RefObject } from "react";

interface ScrollParallaxProps {
  children?: ReactNode;
  className?: string;
  /** Total travel distance in pixels; the layer moves from +speed to -speed as it crosses the viewport. */
  speed?: number;
}

/** Decorative background layer that drifts vertically as the section scrolls through the viewport. */
export function ScrollParallax({ children, className, speed = 60 }: ScrollParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className} aria-hidden="true">
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ y }} aria-hidden="true">
      {children}
    </motion.div>
  );
}

/** Scale/opacity/translate scrub for the hero section as the visitor scrolls past it. */
export function useHeroScrub(target: RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 46]);
  return { scale, opacity, y, scrollYProgress };
}

/** Parallax drift for the hero visual layer, slightly slower than the foreground copy. */
export function useHeroFieldDrift(target: RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.84, 0.2]);
  return { y, opacity };
}

interface ScrollDrawLineProps {
  children: ReactNode;
  className?: string;
}

/** Wraps a container (e.g. the experience timeline) and draws a glowing accent line
    down its left edge in sync with scroll progress through the section. */
export function ScrollDrawLine({ children, className }: ScrollDrawLineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.6"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className={className} style={{ position: "relative" }}>
      {!shouldReduceMotion && (
        <motion.div className="timeline-draw-line" style={{ scaleY }} aria-hidden="true" />
      )}
      {children}
    </div>
  );
}

export type { MotionValue };
