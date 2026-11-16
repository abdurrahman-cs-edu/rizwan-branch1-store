"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A row (for example a suit in the cart) that folds away smoothly before it is really removed.
export function AnimatedRow({ leaving = false, className = "", children }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

// start(key, action): marks the row as leaving, and runs "action" when the fold-away is over.
export function useLeaving(ms = 300) {
  const [leaving, setLeaving] = useState({});
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = useCallback(
    (key, action) => {
      setLeaving((s) => ({ ...s, [key]: true }));
      timers.current.push(
        setTimeout(() => {
          action();
          setLeaving((s) => {
            const n = { ...s };
            delete n[key];
            return n;
          });
        }, ms)
      );
    },
    [ms]
  );

  return { leaving, start };
}
