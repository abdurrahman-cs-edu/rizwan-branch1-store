import { SIZES, SIZE_CHART } from "@/lib/config";

// Shirt size chart. Shown on every product page. The numbers come from the admin panel.
export default function SizeChart({ chart = SIZE_CHART }) {
  const { title = SIZE_CHART.title, unit = SIZE_CHART.unit, sizes, rows } = chart;
  const missing = SIZES.filter((s) => !sizes.includes(s));

  return (
    <section id="size-chart" className="mt-8 scroll-mt-28">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs text-stone-500">All measurements are in {unit}.</p>

      <div className="mt-2 overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full min-w-[320px] text-center text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">Size</th>
              {sizes.map((s) => (
                <th key={s} scope="col" className="px-3 py-2 font-semibold">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="px-3 py-2 text-left font-medium">{r.label}</th>
                {sizes.map((_, i) => (
                  <td key={i} className="px-3 py-2">{r.values?.[i] || "-"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-stone-500">
        {missing.length > 0
          ? `Want ${missing.join(", ")} measurements, or not sure about your size? `
          : "Not sure about your size? "}
        Message us on WhatsApp and we will help.
      </p>
    </section>
  );
}
