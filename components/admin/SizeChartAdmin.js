"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SIZE_CHART } from "@/lib/config";

const MAX_SIZES = 8;
const MAX_ROWS = 15;

// Edit the size chart shown on every product page. Add a size column (like XXL) here.
export default function SizeChartAdmin() {
  const [unit, setUnit] = useState("inches");
  const [sizes, setSizes] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "size_chart").maybeSingle();
      const v = data?.value && Array.isArray(data.value.sizes) && Array.isArray(data.value.rows) ? data.value : SIZE_CHART;
      setUnit(v.unit || "inches");
      setSizes(v.sizes);
      setRows(v.rows.map((r) => ({ label: r.label, values: v.sizes.map((_, i) => r.values?.[i] ?? "") })));
      setLoading(false);
    })();
  }, []);

  function addSize(name = "") {
    if (sizes.length >= MAX_SIZES) return setMessage(`You can have at most ${MAX_SIZES} sizes.`);
    setSizes((s) => [...s, name]);
    setRows((rs) => rs.map((r) => ({ ...r, values: [...r.values, ""] })));
  }

  function removeSize(i) {
    setSizes((s) => s.filter((_, idx) => idx !== i));
    setRows((rs) => rs.map((r) => ({ ...r, values: r.values.filter((_, idx) => idx !== i) })));
  }

  function setSizeName(i, value) {
    setSizes((s) => s.map((x, idx) => (idx === i ? value.toUpperCase() : x)));
  }

  function setValue(r, i, value) {
    setRows((rs) =>
      rs.map((row, ri) =>
        ri === r ? { ...row, values: row.values.map((v, vi) => (vi === i ? value : v)) } : row
      )
    );
  }

  function setLabel(r, value) {
    setRows((rs) => rs.map((row, ri) => (ri === r ? { ...row, label: value } : row)));
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return setMessage(`You can have at most ${MAX_ROWS} measurements.`);
    setRows((rs) => [...rs, { label: "", values: sizes.map(() => "") }]);
  }

  function removeRow(r) {
    setRows((rs) => rs.filter((_, ri) => ri !== r));
  }

  async function onSave() {
    setMessage("");
    const cleanSizes = sizes.map((s) => s.trim());
    if (cleanSizes.length === 0 || cleanSizes.some((s) => !s)) return setMessage("Every size column needs a name, like S or XXL.");
    if (new Set(cleanSizes.map((s) => s.toLowerCase())).size !== cleanSizes.length) return setMessage("Two size columns have the same name.");
    if (rows.length === 0) return setMessage("Add at least one measurement row.");
    const cleanRows = rows.map((r) => ({ label: r.label.trim(), values: r.values.map((v) => v.trim()) }));
    if (cleanRows.some((r) => !r.label)) return setMessage("Every row needs a name, like Chest.");
    if (new Set(cleanRows.map((r) => r.label.toLowerCase())).size !== cleanRows.length) return setMessage("Two rows have the same name.");

    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "size_chart",
        value: { unit: unit.trim() || "inches", sizes: cleanSizes, rows: cleanRows },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    setSaving(false);
    setMessage(error ? "Could not save the size chart." : "Saved. Product pages will show it within about a minute.");
  }

  if (loading) return <p className="text-sm text-stone-500">Loading…</p>;

  const cell = "w-16 rounded border border-stone-300 px-2 py-1.5 text-center text-sm";

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-bold">Size chart</h2>
      <p className="mt-1 text-sm text-stone-600">
        This one chart is shown on every product page. To add XXL, press “Add XXL column”, then type its measurements.
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <label htmlFor="unit" className="font-medium">Measurements are in</label>
        <input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-28 rounded border border-stone-300 px-2 py-1.5" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="px-1 py-1 text-left font-medium">Measurement</th>
              {sizes.map((s, i) => (
                <th key={i} className="px-1 py-1">
                  <input value={s} onChange={(e) => setSizeName(i, e.target.value)} className={cell + " font-semibold"} aria-label="Size name" maxLength={5} />
                  <button type="button" onClick={() => removeSize(i)} className="block w-full text-xs text-red-600 underline">Remove</button>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                <td className="px-1 py-1">
                  <input value={r.label} onChange={(e) => setLabel(ri, e.target.value)} className="w-32 rounded border border-stone-300 px-2 py-1.5 text-sm" aria-label="Measurement name" />
                </td>
                {r.values.map((v, i) => (
                  <td key={i} className="px-1 py-1">
                    <input value={v} onChange={(e) => setValue(ri, i, e.target.value)} className={cell} inputMode="decimal" maxLength={8} aria-label={`${r.label || "Row"} for ${sizes[i] || "size"}`} />
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button type="button" onClick={() => removeRow(ri)} className="text-xs text-red-600 underline">Remove row</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {!sizes.some((s) => s.trim().toUpperCase() === "XXL") && (
          <button type="button" onClick={() => addSize("XXL")} className="rounded border border-stone-300 px-3 py-2">Add XXL column</button>
        )}
        <button type="button" onClick={() => addSize("")} className="rounded border border-stone-300 px-3 py-2">+ Add another size</button>
        <button type="button" onClick={addRow} className="rounded border border-stone-300 px-3 py-2">+ Add measurement row</button>
      </div>

      {message && <p className={"mt-4 text-sm " + (message.startsWith("Saved") ? "text-green-700" : "text-red-600")}>{message}</p>}

      <button onClick={onSave} disabled={saving} className="mt-4 rounded bg-[var(--brand)] px-6 py-2 text-[var(--brand-contrast)] disabled:opacity-60">
        {saving ? "Saving…" : "Save size chart"}
      </button>
    </div>
  );
}
