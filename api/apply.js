const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;

// 스프레드시트 수식 인젝션 방지: 수식 트리거 문자로 시작하면 작은따옴표로 무력화 (OWASP CSV injection)
function sanitizeCell(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "POST 요청만 가능합니다." });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return response.status(500).json({ ok: false, error: "구글 시트 연동 URL이 설정되지 않았습니다." });
  }

  // 잘못된 Content-Type로 body가 문자열/undefined인 경우까지 방어
  let body = request.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { name = "", email = "" } = body || {};
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim();

  if (!cleanName || !cleanEmail) {
    return response.status(400).json({ ok: false, error: "이름과 이메일을 모두 입력해 주세요." });
  }
  if (cleanName.length > MAX_NAME || cleanEmail.length > MAX_EMAIL) {
    return response.status(400).json({ ok: false, error: "입력값이 너무 깁니다." });
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    return response.status(400).json({ ok: false, error: "올바른 이메일 형식이 아닙니다." });
  }

  try {
    const sheetResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        name: sanitizeCell(cleanName),
        email: sanitizeCell(cleanEmail),
        source: "AI AX Academy landing page",
        submittedAt: new Date().toISOString()
      })
    });

    const text = await sheetResponse.text();
    let result = {};
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { raw: text };
    }

    // 명시적 성공(ok === true)만 성공으로 간주 — 웹훅이 비-JSON 200(로그인 HTML 등)을
    // 반환해 조용히 데이터가 유실되는 거짓 성공을 차단한다.
    if (!sheetResponse.ok || result.ok !== true) {
      console.error("apply: webhook did not confirm success", {
        status: sheetResponse.status,
        body: text ? text.slice(0, 200) : ""
      });
      return response.status(502).json({ ok: false, error: result.error || "구글 시트 저장에 실패했습니다." });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("apply: webhook request failed", error && error.name, error && error.message);
    return response.status(502).json({ ok: false, error: "구글 시트 연결 중 오류가 발생했습니다." });
  }
}
