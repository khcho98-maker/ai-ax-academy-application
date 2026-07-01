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
  // 후원자 추가/삭제가 하루씩 지연되던 문제를 줄이기 위해 CDN 캐시를 5분으로 단축
  response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  response.setHeader("CDN-Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
  response.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "GET requests only." });
  }

  const csvUrl = process.env.SPONSORS_CSV_URL;
  const scriptUrl = process.env.SPONSORS_WEBHOOK_URL || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  try {
    if (csvUrl) {
      const csvResponse = await fetch(csvUrl, { signal: AbortSignal.timeout(8000) });
      if (!csvResponse.ok) throw new Error("CSV fetch failed");
      return response.status(200).json({ ok: true, sponsors: sponsorsFromRows(parseCsv(await csvResponse.text())) });
    }

    if (!scriptUrl) {
      return response.status(200).json({ ok: true, sponsors: [] });
    }

    const url = new URL(scriptUrl);
    url.searchParams.set("action", "sponsors");
    const scriptResponse = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    const result = await scriptResponse.json();

    if (!scriptResponse.ok || !result.ok) {
      // \uc7a5\uc560\ub97c \ube48 \ubaa9\ub85d\uc73c\ub85c \uac10\ucd94\ub418, \uc6b4\uc601\uc790\uac00 Vercel \ub85c\uadf8\uc5d0\uc11c \uad6c\ubd84\ud560 \uc218 \uc788\uac8c \uae30\ub85d
      console.error("sponsors: backend returned failure", { status: scriptResponse.status, ok: result && result.ok });
      return response.status(200).json({ ok: true, sponsors: [] });
    }

    return response.status(200).json({ ok: true, sponsors: result.sponsors || [] });
  } catch (error) {
    console.error("sponsors: fetch failed", error && error.name, error && error.message);
    if (csvUrl) {
      // sponsors \ud544\ub4dc\ub97c \ud568\uaed8 \ubc18\ud658\ud574 \ud504\ub860\ud2b8\uc5d4\ub4dc\uc758 undefined.length \ud06c\ub798\uc2dc\ub97c \ubc29\uc9c0
      return response.status(502).json({ ok: false, sponsors: [], error: "\ud6c4\uc6d0\uc790 \ub9ac\uc2a4\ud2b8\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4." });
    }
    return response.status(200).json({ ok: true, sponsors: [] });
  }
}
