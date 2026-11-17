"use client";

import { useEffect, useRef, useState } from "react";
import AlertBar from "@/components/AlertBar";
import { AnimatedRow, useLeaving } from "@/components/RowAnim";
import { isLive, signature } from "@/lib/announcements";

const CLOSED_KEY = "rc_ann_closed_v1";

// The bars at the very top (chosen in the admin panel, "Announcements"). Several bars stack under each other.
// It also tells the page how tall it is (--ann-h), so the home page photo can fill exactly the rest of the
// screen, with no white strip below it.
// "alerts" are the bars that are switched on; the start / end dates are checked here, so a bar appears
// and disappears on time even when the page itself was saved a while ago.
export default function AnnouncementBar({ alerts, serverNow }) {
  const ref = useRef(null);
  const [now, setNow] = useState(serverNow); // first the server's time (so both sides agree), then the real time
  const [closed, setClosed] = useState([]); // bars the customer closed during this visit
  const { leaving, start } = useLeaving(280);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(CLOSED_KEY) || "[]");
      if (Array.isArray(saved)) setClosed(saved);
    } catch {}
  }, []);

  const shown = alerts.filter((a) => isLive(a, now) && !closed.includes(signature(a)));
  const hasBars = shown.length > 0;

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!el) {
      root.style.setProperty("--ann-h", "0px");
      return;
    }
    const set = () => root.style.setProperty("--ann-h", `${el.getBoundingClientRect().height}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasBars]);

  function close(a) {
    const sig = signature(a);
    start(a.id, () => {
      const next = [...closed, sig];
      setClosed(next);
      try {
        sessionStorage.setItem(CLOSED_KEY, JSON.stringify(next));
      } catch {}
    });
  }

  if (!hasBars) return null;

  return (
    <div ref={ref}>
      {shown.map((a) => (
        <AnimatedRow key={a.id} leaving={!!leaving[a.id]}>
          <AlertBar alert={a} onClose={() => close(a)} />
        </AnimatedRow>
      ))}
    </div>
  );
}
