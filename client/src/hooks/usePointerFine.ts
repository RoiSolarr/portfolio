/* usePointerFine: reports whether the visitor has a fine pointer (mouse/trackpad) attached.
   Used to gate hover-only affordances -- custom cursor, tilt-on-hover, magnetic pull -- so
   touch/coarse-pointer visitors get the plain tap/scroll-triggered experience instead. */

import { useEffect, useState } from "react";

export function usePointerFine() {
  const [isFine, setIsFine] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(pointer: fine)");
    const update = () => setIsFine(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isFine;
}
