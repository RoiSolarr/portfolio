/* Reveal: shared scroll-triggered animation wrapper.
   Provides consistent fade/slide/stagger entrances across the whole site and
   automatically collapses to a simple opacity fade (or no motion at all) when
   the visitor has requested reduced motion. */

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";
type Tag = "div" | "span" | "li" | "article" | "aside" | "section" | "a" | "h2" | "h3" | "p";

const motionTags: Record<Tag, any> = {
  div: motion.div,
  span: motion.span,
  li: motion.li,
  article: motion.article,
  aside: motion.aside,
  section: motion.section,
  a: motion.a,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
};

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

interface RevealProps {
  children: ReactNode;
  /** Direction the element travels in from as it reveals. */
  direction?: Direction;
  /** Delay in seconds, useful for staggering sibling items. */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Distance in pixels for the slide portion of the animation. */
  distance?: number;
  /** Starting scale before the element reveals (e.g. 0.9). Omit for no scale animation. */
  scale?: number;
  /** Fraction of the element that must be visible before it triggers. */
  amount?: number;
  /** Replay the animation every time the element re-enters the viewport. */
  once?: boolean;
  /** Rendered element / component type. */
  as?: Tag;
  className?: string;
  [key: string]: unknown;
}

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  distance = 26,
  scale,
  amount = 0.22,
  once = false,
  as = "div",
  className,
  ...rest
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const MotionTag = motionTags[as];

  if (shouldReduceMotion) {
    // Reduced motion keeps the opacity fade (it isn't a transform/parallax effect) but drops
    // the slide/scale so nothing moves across the screen.
    return (
      <MotionTag
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, amount }}
        transition={{ duration: Math.min(duration, 0.5), delay }}
        {...rest}
      >
        {children}
      </MotionTag>
    );
  }

  const axis: "x" | "y" | null =
    direction === "left" || direction === "right" ? "x" : direction === "up" || direction === "down" ? "y" : null;
  const sign = direction === "down" || direction === "right" ? -1 : 1;

  const hidden: Record<string, number> = { opacity: 0 };
  if (axis) hidden[axis] = distance * sign;
  if (typeof scale === "number") hidden.scale = scale;

  const visible: Record<string, number> = { opacity: 1 };
  if (axis) visible[axis] = 0;
  if (typeof scale === "number") visible.scale = 1;

  return (
    <MotionTag
      className={className}
      initial={hidden}
      whileInView={visible}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
