// Announcement bars (the strip at the very top of the website).
// The admin panel saves them in "site_settings" (key "announcements"); this file holds the choices
// (styles, colours, speeds) and the cleaning-up that is used by BOTH the website and the admin panel.

import { ANNOUNCEMENTS } from "@/lib/config";

export const MAX_ALERTS = 5;
export const MAX_MESSAGES = 6;
export const MAX_TEXT = 160;

// How the text moves
export const STYLES = [
  { key: "still", label: "Still text", hint: "Plain centred text (the usual way)." },
  { key: "ticker", label: "News ticker", hint: "Text scrolls across the bar, like TV news." },
  { key: "fade", label: "Rotating (fade)", hint: "One message at a time, fading in and out." },
  { key: "slide", label: "Rotating (slide)", hint: "One message at a time, sliding up." },
  { key: "blink", label: "Blinking", hint: "The text blinks softly to get attention." },
  { key: "pulse", label: "Glowing pulse", hint: "The whole bar glows gently." },
  { key: "shine", label: "Shine sweep", hint: "A streak of light sweeps across the bar." },
];

export const SPEEDS = [
  { key: "slow", label: "Slow" },
  { key: "normal", label: "Normal" },
  { key: "fast", label: "Fast" },
];

// Real numbers behind Slow / Normal / Fast
export const SPEED_VALUES = {
  slow: { pxPerSec: 40, rotate: 7, blink: 1.8, pulse: 3.2, shine: 5 },
  normal: { pxPerSec: 70, rotate: 4.5, blink: 1.2, pulse: 2.2, shine: 3.4 },
  fast: { pxPerSec: 110, rotate: 3, blink: 0.8, pulse: 1.4, shine: 2.2 },
};

export const SIZES = [
  { key: "small", label: "Small" },
  { key: "normal", label: "Normal" },
  { key: "large", label: "Large" },
];

// Colour choices. "brand" follows the shop colour of the whole website.
export const COLOR_PRESETS = [
  { key: "brand", label: "Dark", bg: "var(--brand)", fg: "var(--brand-contrast)" },
  { key: "gold", label: "Gold", bg: "#d4af37", fg: "#1a1a1a" },
  { key: "red", label: "Red", bg: "#c1121f", fg: "#ffffff" },
  { key: "green", label: "Green", bg: "#0b6e4f", fg: "#ffffff" },
  { key: "navy", label: "Navy", bg: "#0a2540", fg: "#ffffff" },
  { key: "maroon", label: "Maroon", bg: "#6b1d3a", fg: "#ffffff" },
  { key: "white", label: "White", bg: "#ffffff", fg: "#111111" },
];

const HEX = /^#[0-9a-f]{6}$/i;
const safeHex = (v, fallback) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim().toLowerCase() : fallback);
const pick = (v, list, fallback) => (list.some((x) => x.key === v) ? v : fallback);
const iso = (v) => {
  if (typeof v !== "string" || !v) return "";
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : "";
};

// Only shop pages ("/collections") and web links ("https://…") are allowed as a link.
export function cleanLink(v) {
  if (typeof v !== "string") return "";
  let s = v.trim().slice(0, 300);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(s)) return "https://" + s; // "rizwanclothing.com" -> https://…
  return "";
}

// Colours of one bar, ready to use in a style attribute.
export function colorsOf(alert) {
  const preset = COLOR_PRESETS.find((p) => p.key === alert.color);
  if (preset) return { bg: preset.bg, fg: preset.fg, light: preset.key === "white" };
  return { bg: safeHex(alert.bg, "#1f2937"), fg: safeHex(alert.fg, "#ffffff"), light: false };
}

// How readable the text is on the background (1 = invisible, 21 = black on white). Used for a warning in the admin.
export function contrastRatio(a, b) {
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [l1, l2] = [lum(a), lum(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function newId() {
  return "a" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

// A fresh bar (used by "Add announcement" in the admin panel).
export function blankAlert() {
  return normalizeAlert({ id: newId(), enabled: true, messages: [{ text: "", link: "" }] }, { keepEmpty: true });
}

// Cleans one bar read from the database (or typed in the admin panel).
// keepEmpty: keep empty message rows (while the admin is still typing).
export function normalizeAlert(raw, { keepEmpty = false } = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  let messages = (Array.isArray(r.messages) ? r.messages : [])
    .map((m) => ({
      text: typeof m?.text === "string" ? m.text.slice(0, MAX_TEXT) : "",
      link: cleanLink(m?.link),
    }))
    .slice(0, MAX_MESSAGES);
  if (!keepEmpty) messages = messages.map((m) => ({ ...m, text: m.text.trim() })).filter((m) => m.text);
  const label = typeof r.countdownLabel === "string" ? r.countdownLabel.slice(0, 30) : "Ends in";
  return {
    id: typeof r.id === "string" && /^[\w-]{1,24}$/.test(r.id) ? r.id : newId(),
    enabled: r.enabled !== false,
    messages,
    style: pick(r.style, STYLES, "still"),
    speed: pick(r.speed, SPEEDS, "normal"),
    direction: r.direction === "right" ? "right" : "left",
    color: r.color === "custom" ? "custom" : pick(r.color, COLOR_PRESETS, "brand"),
    bg: safeHex(r.bg, "#1f2937"),
    fg: safeHex(r.fg, "#ffffff"),
    size: pick(r.size, SIZES, "normal"),
    bold: r.bold === true,
    upper: r.upper === true,
    closable: r.closable === true,
    countdownOn: r.countdownOn === true && !!iso(r.countdownEnd),
    countdownEnd: iso(r.countdownEnd),
    countdownLabel: label,
    start: iso(r.start),
    end: iso(r.end),
  };
}

// The saved value -> a list of bars. Returns null when nothing was ever saved.
export function normalizeAnnouncements(value) {
  if (!value || !Array.isArray(value.alerts)) return null;
  return value.alerts
    .map((a) => normalizeAlert(a))
    .filter((a) => a.messages.length > 0)
    .slice(0, MAX_ALERTS);
}

// What the website shows until the admin saves something (the old fixed messages).
export function defaultAlerts() {
  return [
    normalizeAlert({
      id: "default",
      messages: ANNOUNCEMENTS.map((text) => ({ text })),
      style: "still",
      color: "brand",
    }),
  ];
}

// Is this bar allowed to show right now? (switched on, and inside its start/end dates)
export function isLive(alert, nowMs) {
  if (!alert.enabled) return false;
  if (alert.start && nowMs < Date.parse(alert.start)) return false;
  if (alert.end && nowMs >= Date.parse(alert.end)) return false;
  return true;
}

// A short code that changes when the bar is edited, so a bar that a customer closed comes back after a change.
export function signature(alert) {
  const s = alert.id + "|" + alert.style + "|" + alert.messages.map((m) => m.text).join("¦");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return alert.id + ":" + (h >>> 0).toString(36);
}

// The admin's date boxes use the computer's own time (Pakistan time on the shop computer).
export function toLocalInput(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(v) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
