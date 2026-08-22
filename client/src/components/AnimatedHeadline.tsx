/* AnimatedHeadline: single-line entrance for the hero title (the name), using a Framer Motion
   variant so it fades/slides/blurs in on load. Reduced-motion visitors still get the opacity
   fade, just without the slide/blur. */

import { motion, useReducedMotion, type Variants } from "framer-motion";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const container: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.1 } },
};

const line: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE_OUT } },
};

// Reduced-motion variant keeps the opacity fade (still communicates the reveal) but drops the
// y-translate and blur, since both read as transform/parallax rather than a plain fade.
const reducedLine: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

export default function AnimatedHeadline({ id }: { id?: string }) {
  const shouldReduceMotion = useReducedMotion();
  const activeLine = shouldReduceMotion ? reducedLine : line;

  return (
    <motion.h1 id={id} variants={container} initial="hidden" animate="visible">
      <motion.span className="headline-line headline-line--single" variants={activeLine}>
        Roi Vincent P. Solar
      </motion.span>
    </motion.h1>
  );
}
