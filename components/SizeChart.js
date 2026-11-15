import { SIZE_CHART } from "@/lib/config";

// Shirt size chart. Shown on every product page.
export default function SizeChart() {
  const { title, unit, sizes, rows } = SIZE_CHART;

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
                {r.values.map((v, i) => (
                  <td key={i} className="px-3 py-2">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-stone-500">
        Not sure about your size, or want XXL measurements? Message us on WhatsApp and we will help.
      </p>
    </section>
  );
}
