const SPREADSHEET_ID = "REPLACE_WITH_YOUR_SPREADSHEET_ID";
const SHEET_NAME = "submissions";
const ADMIN_TOKEN = "REPLACE_WITH_A_LONG_RANDOM_ADMIN_TOKEN";

const HEADERS = [
  "id",
  "deleted",
  "submittedAt",
  "surveyId",
  "surveyTitle",
  "unit",
  "name",
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "rawJson"
];

function doGet(event) {
  const action = event.parameter.action || "list";
  const token = event.parameter.token || "";

  if (action !== "list") {
    return jsonResponse({ ok: false, error: "Unsupported action" });
  }

  if (token !== ADMIN_TOKEN) {
    return jsonResponse({ ok: false, error: "Unauthorized" });
  }

  return jsonResponse({ ok: true, submissions: listSubmissions() });
}

function doPost(event) {
  const payload = parsePayload(event);

  if (payload.action === "create") {
    const submission = payload.submission || {};
    const saved = appendSubmission(submission);
    return jsonResponse({ ok: true, submission: saved });
  }

  if (payload.action === "delete") {
    if (payload.token !== ADMIN_TOKEN) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }
    const deleted = markDeleted(payload.id);
    return jsonResponse({ ok: deleted });
  }

  return jsonResponse({ ok: false, error: "Unsupported action" });
}

function parsePayload(event) {
  try {
    return JSON.parse(event.postData.contents || "{}");
  } catch (error) {
    return {};
  }
}

function appendSubmission(submission) {
  const sheet = getSheet();
  const saved = {
    id: Utilities.getUuid(),
    surveyId: submission.surveyId || "",
    surveyTitle: submission.surveyTitle || "",
    submittedAt: submission.submittedAt || new Date().toISOString(),
    unit: submission.unit || "",
    name: submission.name || "",
    answers: submission.answers || {}
  };

  sheet.appendRow([
    saved.id,
    "",
    saved.submittedAt,
    saved.surveyId,
    saved.surveyTitle,
    saved.unit,
    saved.name,
    saved.answers.q1 || "",
    saved.answers.q2 || "",
    saved.answers.q3 || "",
    saved.answers.q4 || "",
    saved.answers.q5 || "",
    saved.answers.q6 || "",
    saved.answers.q7 || "",
    saved.answers.q8 || "",
    JSON.stringify(saved.answers.q9 || []),
    saved.answers.q10 || "",
    JSON.stringify(saved)
  ]);

  return saved;
}

function listSubmissions() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1)
    .filter((row) => !row[1])
    .map((row) => {
      const raw = row[17];
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (error) {
          // Fall through to row reconstruction.
        }
      }
      return {
        id: row[0],
        submittedAt: row[2],
        surveyId: row[3],
        surveyTitle: row[4],
        unit: row[5],
        name: row[6],
        answers: {
          q1: row[7],
          q2: row[8],
          q3: row[9],
          q4: row[10],
          q5: row[11],
          q6: row[12],
          q7: row[13],
          q8: row[14],
          q9: parseJsonArray(row[15]),
          q10: row[16]
        }
      };
    });
}

function markDeleted(id) {
  if (!id) return false;

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  for (let index = 1; index < values.length; index++) {
    if (values[index][0] === id) {
      sheet.getRange(index + 1, 2).setValue(new Date().toISOString());
      return true;
    }
  }
  return false;
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
