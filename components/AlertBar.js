"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/Icons";
import { SPEED_VALUES, colorsOf } from "@/lib/announcements";

// ONE announcement bar. Used on the website (inside AnnouncementBar) and, with preview, in the admin panel.
// The look (colour, size) and the movement (ticker, rotating, blinking ...) come from the saved settings.

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduce(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return reduce;
}

const SIZE = {
  small: "py-1.5 text-[11px] sm:text-xs",
  normal: "py-2 text-xs sm:text-sm",
  large: "py-2.5 text-sm sm:text-base",
};

// One message. With a link it is underlined and clickable (in the admin preview it only looks like a link).
function Msg({ m, preview, hidden }) {
  const text = m.text || (preview ? "Type your message…" : "");
  if (!m.link) return <span>{text}</span>;
  const cls = "underline underline-offset-2";
  if (preview) return <span className={cls}>{text}</span>;
  const tab = hidden ? -1 : undefined;
  if (/^https?:\/\//i.test(m.link)) {
    return (
      <a href={m.link} target="_blank" rel="noopener noreferrer" className={cls} tabIndex={tab}>
        {text}
      </a>
    );
  }
  return (
    <Link href={m.link} className={cls} tabIndex={tab}>
      {text}
    </Link>
  );
}

// "Ends in 2d 04h 15m 10s" (counts down to a date the admin chose)
function Countdown({ end, label }) {
  const [left, setLeft] = useState(null); // milliseconds left; null until the page is ready
  useEffect(() => {
    const endMs = Date.parse(end);
    const tick = () => setLeft(endMs - Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [end]);

  if (left !== null && left <= 0) return null;
  const s = Math.max(0, Math.floor((left ?? 0) / 1000));
  const d = Math.floor(s / 86400);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <span
      className="num inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-[0.92em] tabular-nums"
      style={{ background: "color-mix(in srgb, currentColor 16%, transparent)", opacity: left === null ? 0 : 1 }}
    >
      {label && <span className="opacity-90">{label}</span>}
      <b className="font-semibold">
        {d > 0 && `${d}d `}
        {pad(Math.floor((s % 86400) / 3600))}h {pad(Math.floor((s % 3600) / 60))}m {pad(s % 60)}s
      </b>
    </span>
  );
}

// Plain text; messages sit side by side with a thin line between them.
function Still({ messages, blink, preview }) {
  return (
    <span className={blink ? "ann-blink" : ""}>
      {messages.map((m, i) => (
        <span key={i}>
          {i > 0 && (
            <span className="mx-3 opacity-50" aria-hidden="true">
              |
            </span>
          )}
          <Msg m={m} preview={preview} />
        </span>
      ))}
    </span>
  );
}

// News ticker: the messages are repeated until they fill the bar, then slide left (or right) forever.
function Ticker({ messages, speed, direction, preview }) {
  const viewRef = useRef(null);
  const setRef = useRef(null);
  const [copies, setCopies] = useState(2); // always an even number: the track moves exactly half of itself
  const [dur, setDur] = useState(30);
  const pps = (SPEED_VALUES[speed] || SPEED_VALUES.normal).pxPerSec;
  const key = messages.map((m) => m.text).join("|");

  useEffect(() => {
    const view = viewRef.current;
    const set = setRef.current;
    if (!view || !set) return;
    const measure = () => {
      const w = set.offsetWidth; // width of one round of messages
      const c = view.offsetWidth; // width of the bar
      if (!w || !c) return;
      const k = Math.max(1, Math.ceil(c / w));
      setCopies(2 * k);
      setDur(Math.max(5, (k * w) / pps)); // the same speed whether the text is short or long
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(view);
    ro.observe(set);
    return () => ro.disconnect();
  }, [key, pps]);

  return (
    <div ref={viewRef} className="ann-ticker">
      <div
        className="ann-track"
        style={{ animationDuration: `${dur}s`, animationDirection: direction === "right" ? "reverse" : "normal" }}
      >
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} ref={i === 0 ? setRef : undefined} aria-hidden={i > 0 ? "true" : undefined} className="flex shrink-0 items-center">
            {messages.map((m, j) => (
              <span key={j} className="inline-flex items-center whitespace-nowrap">
                <Msg m={m} preview={preview} hidden={i > 0} />
                <span className="mx-6 opacity-60" aria-hidden="true">
                  •
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// One message at a time. All messages are placed invisibly on top of each other so the bar never changes height.
function Rotator({ messages, mode, seconds, preview }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false); // stops while the mouse is over it
  const n = messages.length;

  useEffect(() => {
    if (n < 2 || hold) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), seconds * 1000);
    return () => clearInterval(t);
  }, [n, seconds, hold]);

  const cur = messages[i % n];
  return (
    <div
      className="grid"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
    >
      {messages.map((m, idx) => (
        <div key={idx} className="invisible col-start-1 row-start-1" aria-hidden="true">
          {m.text || (preview ? "Type your message…" : "")}
        </div>
      ))}
      <div key={i} className={`col-start-1 row-start-1 ${mode === "slide" ? "ann-slide-in" : "ann-fade-in"}`}>
        <Msg m={cur} preview={preview} />
      </div>
    </div>
  );
}

export default function AlertBar({ alert, onClose, preview = false }) {
  const prefersReduced = useReducedMotion();
  // People who turned animations off get plain text (the admin preview still shows the movement)
  const style = prefersReduced && !preview ? "still" : alert.style;
  const { bg, fg, light } = colorsOf(alert);
  const v = SPEED_VALUES[alert.speed] || SPEED_VALUES.normal;
  const dur = style === "blink" ? v.blink : style === "pulse" ? v.pulse : v.shine;
  const ticker = style === "ticker";
  const messages = alert.messages.length ? alert.messages : [{ text: "", link: "" }];

  let body;
  if (ticker) {
    body = <Ticker messages={messages} speed={alert.speed} direction={alert.direction} preview={preview} />;
  } else if (style === "fade" || style === "slide") {
    body = <Rotator messages={messages} mode={style} seconds={v.rotate} preview={preview} />;
  } else {
    body = <Still messages={messages} blink={style === "blink"} preview={preview} />;
  }

  const classes = [
    "relative",
    SIZE[alert.size] || SIZE.normal,
    alert.bold ? "font-semibold" : "",
    alert.upper ? "uppercase tracking-[0.04em]" : "",
    style === "pulse" ? "ann-pulse" : "",
    style === "shine" ? "ann-shine" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="region"
      aria-label="Announcement"
      className={classes}
      style={{
        background: bg,
        color: fg,
        borderBottom: light ? "1px solid #e7e5e4" : undefined,
        "--ann-dur": `${dur}s`,
      }}
    >
      <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${alert.closable ? "px-9" : "px-4"}`}>
        {/* On a phone a ticker takes the whole row, so the countdown sits under it instead of squeezing it */}
        <div className={ticker ? "min-w-0 basis-full sm:flex-1 sm:basis-0" : "min-w-0 text-center"}>{body}</div>
        {alert.countdownOn && alert.countdownEnd && (
          <div className="shrink-0">
            <Countdown end={alert.countdownEnd} label={alert.countdownLabel} />
          </div>
        )}
      </div>
      {alert.closable && (
        <button
          type="button"
          onClick={preview ? undefined : onClose}
          aria-label="Close announcement"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 opacity-80 hover:opacity-100"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
