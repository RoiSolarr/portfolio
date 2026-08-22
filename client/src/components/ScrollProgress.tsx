/* ScrollProgress: thin fixed bar at the top of the viewport that fills as the
   visitor scrolls through the page. Purely decorative wayfinding, so it is
   hidden from assistive tech and skipped entirely for reduced-motion users. */

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.2,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX: shouldReduceMotion ? scrollYProgress : smoothProgress }}
      aria-hidden="true"
    />
  );
}
