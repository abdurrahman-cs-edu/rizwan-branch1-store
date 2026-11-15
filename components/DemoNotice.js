// Shown only while the database has no website products yet.
export default function DemoNotice({ show }) {
  if (!show) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
      Preview mode: these are demo products. Real designs will appear after the website database is set up.
    </div>
  );
}
