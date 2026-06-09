const STORAGE_KEY = "talent-survey:gz-transport-data-governance-2026";
const LIKERT_OPTIONS = ["非常同意", "同意", "一般", "不同意", "非常不同意"];
const SCORE_MAP = {
  "非常同意": 5,
  "同意": 4,
  "一般": 3,
  "不同意": 2,
  "非常不同意": 1
};

const QUESTIONS = [
  "我可以从宏观向他人讲解数据治理的“立法、司法、执法”的概念和区别，并用于指导实际的工作。",
  "我可以针对各类数据质量问题，通过“数据流、信息流、业务流”理论来定位分析质量问题、划分问题责任主体、追根溯源找到问题的根本原因。",
  "我理解数据治理委员会在数据治理中发挥的实际作用，例如涉及到重大的信息化系统改造、业务管理问题的解决，数据治理委员会要在“司法”中发挥重要的作用。",
  "我理解“支部建在连队上”的核心思想是要在业务线建立 Data Owner 的机制。",
  "培训前，我可能认为数据治理主要是信息技术部门（IT）的职责。培训后，我认识到业务部门（如规划、建管、运输、执法等）才是数据治理的责任主体和核心受益者。",
  "在今后的工作中，如果我分管或参与的领域出现数据质量问题，我会主动组织业务人员分析问题根因，并推动流程或标准优化，而不是仅仅要求IT人员处理。",
  "我愿意支持在处室/单位内部建立“数据质量巡检”或“数据责任人（Data Owner）”等管理机制，并将其纳入日常业务管理或考核。",
  "本次培训中的相关业务场景案例，对我启发较大，有助于我将方法应用到实际工作中，识别出哪些问题是数据质量的问题，应该纳入到数据治理流程中加以解决。",
  "我认为当前贵州省交通运输数据治理工作中，最迫切需要解决的一个业务数据质量问题是什么？",
  "我对以下其他数字化的培训也比较感兴趣（可多选）",
  "期望其他方面的培训"
];

const COURSES = [
  "课程一：数字化意识与数据思维（面向全体人员）",
  "课程二：数据治理体系全生命周期管理（面向数据管理专员）",
  "课程三：数据资产管理及价值化路径（面向资产管理与政策研究人员）",
  "课程四：BI与数据分析应用（面向业务分析骨干）",
  "课程五：AI 领导力（面向中高层管理干部）",
  "课程六：AI 落地工作坊（所有人）"
];

const exportExcelButton = document.querySelector("#exportExcelButton");

function loadSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN");
}

function normalizeAnswer(answer) {
  if (Array.isArray(answer)) return answer.join("；");
  return answer || "";
}

function getRows(submissions) {
  return submissions.map((item) => [
    formatDate(item.submittedAt),
    item.unit || "",
    item.name || "",
    ...QUESTIONS.map((_, index) => normalizeAnswer(item.answers?.[`q${index + 1}`]))
  ]);
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function renderMetrics(submissions) {
  document.querySelector("#totalCount").textContent = submissions.length;
  document.querySelector("#unitCount").textContent = new Set(submissions.map((item) => item.unit).filter(Boolean)).size;
  const latest = submissions[submissions.length - 1];
  document.querySelector("#latestTime").textContent = latest ? formatDate(latest.submittedAt) : "-";

  const allScores = submissions.flatMap((item) =>
    Array.from({ length: 8 }, (_, index) => SCORE_MAP[item.answers?.[`q${index + 1}`]]).filter(Boolean)
  );
  const avg = average(allScores);
  document.querySelector("#avgScore").textContent = avg ? avg.toFixed(2) : "-";
}

function renderScoreBars(submissions) {
  const root = document.querySelector("#scoreBars");
  root.innerHTML = "";

  if (submissions.length === 0) {
    root.innerHTML = '<p class="empty-state">暂无数据</p>';
    return;
  }

  Array.from({ length: 8 }, (_, index) => {
    const scores = submissions.map((item) => SCORE_MAP[item.answers?.[`q${index + 1}`]]);
    const avg = average(scores);
    root.append(createBar(`第${index + 1}题`, avg ? `${avg.toFixed(2)} / 5` : "-", avg ? (avg / 5) * 100 : 0));
  });
}

function renderCourseBars(submissions) {
  const root = document.querySelector("#courseBars");
  root.innerHTML = "";

  if (submissions.length === 0) {
    root.innerHTML = '<p class="empty-state">暂无数据</p>';
    return;
  }

  const counts = new Map(COURSES.map((course) => [course, 0]));
  submissions.forEach((item) => {
    const answers = item.answers?.q10 || [];
    answers.forEach((course) => counts.set(course, (counts.get(course) || 0) + 1));
  });

  const max = Math.max(1, ...counts.values());
  COURSES.forEach((course) => {
    const count = counts.get(course) || 0;
    root.append(createBar(course.replace(/（.*?）/g, ""), `${count} 人`, (count / max) * 100));
  });
}

function createBar(label, value, percent) {
  const row = document.createElement("div");
  row.className = "bar-row";
  row.innerHTML = `
    <div class="bar-label"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>
    <div class="bar-track"><div class="bar-fill" style="width: ${Math.max(0, Math.min(100, percent))}%"></div></div>
  `;
  return row;
}

function renderOpenList(id, submissions, questionId) {
  const root = document.querySelector(id);
  root.innerHTML = "";
  const items = submissions
    .map((item) => ({
      text: normalizeAnswer(item.answers?.[questionId]).trim(),
      unit: item.unit || "",
      name: item.name || "",
      time: item.submittedAt
    }))
    .filter((item) => item.text);

  if (items.length === 0) {
    root.innerHTML = '<p class="empty-state">暂无数据</p>';
    return;
  }

  items.forEach((item) => {
    const node = document.createElement("article");
    node.className = "open-item";
    node.innerHTML = `
      <p>${escapeHtml(item.text)}</p>
      <div class="open-meta">${escapeHtml(item.unit)} · ${escapeHtml(item.name)} · ${escapeHtml(formatDate(item.time))}</div>
    `;
    root.append(node);
  });
}

function renderDetails(submissions) {
  const headers = ["提交时间", "单位", "姓名", ...QUESTIONS.map((_, index) => `Q${index + 1}`)];
  const rows = getRows(submissions);
  document.querySelector("#detailCount").textContent = `${rows.length} 条`;
  document.querySelector("#detailHead").innerHTML = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>`;
  document.querySelector("#detailBody").innerHTML = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
}

function renderDashboard() {
  const submissions = loadSubmissions();
  renderMetrics(submissions);
  renderScoreBars(submissions);
  renderCourseBars(submissions);
  renderOpenList("#qualityIssues", submissions, "q9");
  renderOpenList("#trainingNeeds", submissions, "q11");
  renderDetails(submissions);
}

function exportExcel(submissions) {
  const detailHeaders = ["提交时间", "单位", "姓名", ...QUESTIONS.map((text, index) => `${index + 1}.${text}`)];
  const detailRows = [detailHeaders, ...getRows(submissions)];
  const scoreRows = [["题目", "平均分", "满分"]];

  Array.from({ length: 8 }, (_, index) => {
    const scores = submissions.map((item) => SCORE_MAP[item.answers?.[`q${index + 1}`]]);
    const avg = average(scores);
    scoreRows.push([`第${index + 1}题`, avg ? avg.toFixed(2) : "", "5"]);
  });

  const courseRows = [["课程", "选择人数"]];
  COURSES.forEach((course) => {
    const count = submissions.filter((item) => (item.answers?.q10 || []).includes(course)).length;
    courseRows.push([course, String(count)]);
  });

  const workbook = createXlsx([
    { name: "分析概览", rows: [["指标", "值"], ["提交总数", String(submissions.length)], ["参与单位数", String(new Set(submissions.map((item) => item.unit).filter(Boolean)).size)], ["导出时间", formatDate(new Date().toISOString())]] },
    { name: "1-8题得分", rows: scoreRows },
    { name: "课程兴趣", rows: courseRows },
    { name: "提交明细", rows: detailRows }
  ]);

  downloadBlob(workbook, `talent-survey-analysis-${Date.now()}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

function createXlsx(sheets) {
  const entries = [
    { name: "[Content_Types].xml", content: contentTypesXml(sheets.length) },
    { name: "_rels/.rels", content: rootRelsXml() },
    { name: "xl/workbook.xml", content: workbookXml(sheets) },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml(sheets.length) },
    { name: "xl/styles.xml", content: stylesXml() },
    ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: worksheetXml(sheet.rows) }))
  ];
  return zipStore(entries);
}

function contentTypesXml(sheetCount) {
  const sheets = Array.from({ length: sheetCount }, (_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets}</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
}

function workbookXml(sheets) {
  const nodes = sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${nodes}</sheets></workbook>`;
}

function workbookRelsXml(sheetCount) {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRels}<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`;
}

function worksheetXml(rows) {
  const body = rows.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      const ref = `${columnName(colIndex + 1)}${rowIndex + 1}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

function columnName(number) {
  let name = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }
  return name;
}

function zipStore(entries) {
  const encoder = new TextEncoder();
  const files = entries.map((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const data = encoder.encode(entry.content);
    return { ...entry, nameBytes, data, crc: crc32(data) };
  });

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const localHeader = zipLocalHeader(file);
    localParts.push(localHeader, file.nameBytes, file.data);
    centralParts.push(zipCentralHeader(file, offset), file.nameBytes);
    offset += localHeader.length + file.nameBytes.length + file.data.length;
  });

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = zipEnd(files.length, centralSize, centralOffset);
  return concatBytes([...localParts, ...centralParts, eocd]);
}

function zipLocalHeader(file) {
  const view = new DataView(new ArrayBuffer(30));
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, file.crc, true);
  view.setUint32(18, file.data.length, true);
  view.setUint32(22, file.data.length, true);
  view.setUint16(26, file.nameBytes.length, true);
  view.setUint16(28, 0, true);
  return new Uint8Array(view.buffer);
}

function zipCentralHeader(file, offset) {
  const view = new DataView(new ArrayBuffer(46));
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, file.crc, true);
  view.setUint32(20, file.data.length, true);
  view.setUint32(24, file.data.length, true);
  view.setUint16(28, file.nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  return new Uint8Array(view.buffer);
}

function zipEnd(fileCount, centralSize, centralOffset) {
  const view = new DataView(new ArrayBuffer(22));
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return new Uint8Array(view.buffer);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = (() => {
  const table = [];
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table.push(value >>> 0);
  }
  return table;
})();

function concatBytes(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function downloadBlob(bytes, filename, type) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

exportExcelButton.addEventListener("click", () => {
  exportExcel(loadSubmissions());
});

renderDashboard();
