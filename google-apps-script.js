const SPREADSHEET_ID = "1vAdtW82msiGfwPivi4TFZE6aFIwmsUEwObmf62K9-ok";
const APPLICATION_SHEET_ID = 895118963;
const SPONSOR_SHEET_ID = 742379800;

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const source = String(data.source || "AI AX Academy landing page").trim();
    const submittedAt = data.submittedAt ? new Date(data.submittedAt) : new Date();

    if (!name || !email) {
      return jsonResponse({ ok: false, error: "Name and email are required." });
    }

    const sheet = getSheetById(APPLICATION_SHEET_ID);
    if (!sheet) return jsonResponse({ ok: false, error: "Application sheet was not found." });

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["\uc2e0\uccad\uc77c\uc2dc", "\uc774\ub984", "\uc774\uba54\uc77c", "\uc720\uc785\uacbd\ub85c"]);
    }

    sheet.appendRow([submittedAt, name, email, source]);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : "";
    if (action !== "sponsors") {
      return jsonResponse({ ok: true, message: "AI AX Academy API" });
    }

    const sheet = getSheetById(SPONSOR_SHEET_ID);
    if (!sheet) return jsonResponse({ ok: false, error: "Sponsor sheet was not found." });

    const values = sheet.getDataRange().getDisplayValues();
    const sponsors = values.slice(1)
      .map(function(row) {
        return { name: String(row[0] || "").trim(), amount: String(row[1] || "").trim() };
      })
      .filter(function(item) { return item.name; });

    return jsonResponse({ ok: true, sponsors: sponsors });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function getSheetById(sheetId) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = spreadsheet.getSheets();
  for (let index = 0; index < sheets.length; index += 1) {
    if (sheets[index].getSheetId() === sheetId) return sheets[index];
  }
  return null;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
