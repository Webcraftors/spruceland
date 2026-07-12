export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => {
    const s = String(c ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Opens a printable window pre-loaded with rows for save-as-PDF. */
export function printPDF(title: string, sections: { heading: string; rows: (string | number)[][] }[]) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  const style = `
    body { font-family: Inter, system-ui, sans-serif; padding: 32px; color: #111; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    h2 { margin: 24px 0 8px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f5f5f5; }
    .meta { color: #666; font-size: 11px; }
  `;
  const body = sections.map(s => {
    const [head, ...rest] = s.rows;
    return `<h2>${s.heading}</h2><table><thead><tr>${head.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rest.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }).join("");
  w.document.write(`<html><head><title>${title}</title><style>${style}</style></head><body><h1>${title}</h1><div class="meta">Spruceland Technologies — Generated ${new Date().toLocaleString()}</div>${body}<script>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
}
