export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "POST 요청만 가능합니다." });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return response.status(500).json({ ok: false, error: "구글 시트 연동 URL이 설정되지 않았습니다." });
  }

  const { name = "", email = "" } = request.body || {};
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim();

  if (!cleanName || !cleanEmail) {
    return response.status(400).json({ ok: false, error: "이름과 이메일을 모두 입력해 주세요." });
  }

  try {
    const sheetResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
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

    if (!sheetResponse.ok || result.ok === false) {
      return response.status(502).json({ ok: false, error: result.error || "구글 시트 저장에 실패했습니다." });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(502).json({ ok: false, error: "구글 시트 연결 중 오류가 발생했습니다." });
  }
}
