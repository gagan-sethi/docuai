"use client";

import { useEffect, useState } from "react";

/**
 * Left offset the dashboard content should leave for the sidebar.
 *
 * Reads the live width of the <aside> rendered by `Sidebar`, so it follows
 * both the desktop collapse (260px ↔ 72px) and the mobile drawer, where the
 * aside measures 0 and content goes full-width (CB-08 / M-01).
 *
 * Pages that previously hard-coded `ml-[260px]` were broken twice over: they
 * ignored the collapsed rail, and on a phone they pushed the whole page
 * 260px off-screen.
 */
export function useSidebarOffset(): number {
  const [offset, setOffset] = useState(260);

  useEffect(() => {
    const aside = document.querySelector("aside");
    if (!aside) return;

    const measure = () => setOffset(aside.getBoundingClientRect().width);
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(aside);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return offset;
}
