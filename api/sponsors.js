function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function isHeader(row) {
  const first = String(row[0] || "").toLowerCase();
  return first.includes("name") || first.includes("\uc774\ub984") || first.includes("\ud6c4\uc6d0");
}

function sponsorsFromRows(rows) {
  const dataRows = rows.length && isHeader(rows[0]) ? rows.slice(1) : rows;
  return dataRows
    .map((row) => ({ name: row[0] || "", amount: row[1] || "" }))
    .filter((item) => item.name)
    .slice(0, 100);
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  response.setHeader("CDN-Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
  response.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "GET requests only." });
  }

  const csvUrl = process.env.SPONSORS_CSV_URL;
  const scriptUrl = process.env.SPONSORS_WEBHOOK_URL || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  try {
    if (csvUrl) {
      const csvResponse = await fetch(csvUrl);
      if (!csvResponse.ok) throw new Error("CSV fetch failed");
      return response.status(200).json({ ok: true, sponsors: sponsorsFromRows(parseCsv(await csvResponse.text())) });
    }

    if (!scriptUrl) {
      return response.status(200).json({ ok: true, sponsors: [] });
    }

    const url = new URL(scriptUrl);
    url.searchParams.set("action", "sponsors");
    const scriptResponse = await fetch(url.toString());
    const result = await scriptResponse.json();

    if (!scriptResponse.ok || !result.ok) {
      return response.status(200).json({ ok: true, sponsors: [] });
    }

    return response.status(200).json({ ok: true, sponsors: result.sponsors || [] });
  } catch (error) {
    if (csvUrl) {
      return response.status(502).json({ ok: false, error: "\ud6c4\uc6d0\uc790 \ub9ac\uc2a4\ud2b8\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4." });
    }
    return response.status(200).json({ ok: true, sponsors: [] });
  }
}
