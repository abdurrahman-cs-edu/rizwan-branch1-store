import { ANNOUNCEMENTS } from "@/lib/config";

export default function AnnouncementBar() {
  return (
    <div className="bg-[var(--brand)] px-4 py-2 text-center text-xs text-[var(--brand-contrast)] sm:text-sm">
      {ANNOUNCEMENTS.map((text, i) => (
        <span key={text}>
          {i > 0 && <span className="mx-3 opacity-50">|</span>}
          {text}
        </span>
      ))}
    </div>
  );
}
