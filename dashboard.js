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
  "我认为当前贵州省交通运输数据治理工作中，最迫切需要解决的一个业务数据质量问题是什么？",
  "我对以下其他数字化的培训也比较感兴趣（可多选）",
  "其他方面的培训需求或者建议"
];

const SCORE_QUESTION_COUNT = 7;
const ROLE_OPTIONS = ["管理角色", "技术角色"];

const COURSES = [
  "课程一：AI 领导力（面向中高层管理干部）",
  "课程二：AI 落地工作坊（所有人）",
  "课程三：数字化意识与数据思维（面向全体人员）",
  "课程四：数据治理体系全生命周期管理（面向数据管理专员）",
  "课程五：数据资产管理及价值化路径（面向资产管理与政策研究人员）",
  "课程六：BI与数据分析应用（面向业务分析骨干）"
];

const LEGACY_COURSE_MAP = {
  "课程五：AI 领导力（面向中高层管理干部）": "课程一：AI 领导力（面向中高层管理干部）",
  "课程六：AI 落地工作坊（所有人）": "课程二：AI 落地工作坊（所有人）",
  "课程一：数字化意识与数据思维（面向全体人员）": "课程三：数字化意识与数据思维（面向全体人员）",
  "课程二：数据治理体系全生命周期管理（面向数据管理专员）": "课程四：数据治理体系全生命周期管理（面向数据管理专员）",
  "课程三：数据资产管理及价值化路径（面向资产管理与政策研究人员）": "课程五：数据资产管理及价值化路径（面向资产管理与政策研究人员）",
  "课程四：BI与数据分析应用（面向业务分析骨干）": "课程六：BI与数据分析应用（面向业务分析骨干）"
};

const exportExcelButton = document.querySelector("#exportExcelButton");
const dataStatus = document.querySelector("#dataStatus");
const tokenPanel = document.querySelector("#tokenPanel");
const adminTokenInput = document.querySelector("#adminTokenInput");
const loadDataButton = document.querySelector("#loadDataButton");
const appConfig = window.TALENT_CONFIG || {};
const urlParams = new URLSearchParams(window.location.search);
let dashboardToken = urlParams.get("token") || appConfig.adminToken || localStorage.getItem("talent-dashboard-token") || "";

if (urlParams.get("token")) {
  localStorage.setItem("talent-dashboard-token", urlParams.get("token"));
}

adminTokenInput.value = dashboardToken;

function loadSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

async function loadDashboardSubmissions() {
  if (!appConfig.apiUrl) {
    dataStatus.textContent = "当前为本地模式：只能看到本浏览器保存的数据。配置集中存储 API 后，电脑端可查看所有手机提交的数据。";
    hideTokenPanel();
    return loadSubmissions();
  }

  const url = new URL(appConfig.apiUrl, window.location.origin);
  url.searchParams.set("action", "list");

  const response = await fetch(url.toString(), { method: "GET" });
  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || "Load failed");
  }
  dataStatus.textContent = "当前为集中存储模式：看板数据来自远程存储，手机提交后电脑端可同步查看。删除明细需要管理员 token。";
  hideTokenPanel();
  return result.submissions || [];
}

function saveSubmissions(submissions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

async function deleteRemoteSubmission(id) {
  if (!dashboardToken) {
    showTokenPanel();
    adminTokenInput.focus();
    throw new Error("Missing admin token");
  }

  const response = await fetch(appConfig.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "delete",
      id,
      token: dashboardToken
    })
  });
  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || "Delete failed");
  }
}

function isLegacySubmission(item) {
  return LIKERT_OPTIONS.includes(item.answers?.q8) && Array.isArray(item.answers?.q10);
}

function getAnswer(item, questionId) {
  if (!isLegacySubmission(item)) return item.answers?.[questionId];

  const legacyMap = {
    q8: "q9",
    q9: "q10",
    q10: "q11"
  };
  return item.answers?.[legacyMap[questionId] || questionId];
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN");
}

function getRespondentLabel(item) {
  if (item.respondentId) return item.respondentId;
  if (item.id) return `历史-${item.id.slice(0, 8)}`;
  return "未知用户";
}

function getRoleLabel(item) {
  return item.role || "历史数据";
}

function getRoleCount(submissions) {
  return new Set(submissions.map(getRoleLabel).filter(Boolean)).size;
}

function getRoleDistribution(submissions) {
  const counts = new Map([...ROLE_OPTIONS, "历史数据"].map((role) => [role, 0]));
  submissions.forEach((item) => {
    const role = getRoleLabel(item);
    counts.set(role, (counts.get(role) || 0) + 1);
  });
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([role, count]) => ({ role, count }));
}

function normalizeAnswer(answer) {
  if (Array.isArray(answer)) return answer.join("；");
  return answer || "";
}

function getRows(submissions) {
  return submissions.map((item) => [
    formatDate(item.submittedAt),
    getRespondentLabel(item),
    getRoleLabel(item),
    ...QUESTIONS.map((_, index) => {
      const questionId = `q${index + 1}`;
      return questionId === "q9" ? normalizeAnswer(normalizeCourseAnswers(item)) : normalizeAnswer(getAnswer(item, questionId));
    })
  ]);
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function roundNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(digits));
}

function getLikertScore(item, questionId) {
  const score = SCORE_MAP[getAnswer(item, questionId)];
  return Number.isFinite(score) ? score : null;
}

function getQuestionStats(submissions) {
  return Array.from({ length: SCORE_QUESTION_COUNT }, (_, index) => {
    const questionId = `q${index + 1}`;
    const scores = submissions.map((item) => getLikertScore(item, questionId)).filter(Number.isFinite);
    const counts = Object.fromEntries(LIKERT_OPTIONS.map((option) => [option, 0]));
    submissions.forEach((item) => {
      const answer = getAnswer(item, questionId);
      if (answer in counts) counts[answer] += 1;
    });

    return {
      questionId,
      index,
      title: QUESTIONS[index],
      avg: average(scores),
      validCount: scores.length,
      counts
    };
  });
}

function getCourseCounts(submissions) {
  const counts = new Map(COURSES.map((course) => [course, 0]));
  submissions.forEach((item) => {
    normalizeCourseAnswers(item).forEach((course) => {
      counts.set(course, (counts.get(course) || 0) + 1);
    });
  });
  return counts;
}

function getCourseRanking(submissions) {
  const counts = getCourseCounts(submissions);
  return COURSES
    .map((course) => ({ course, count: counts.get(course) || 0 }))
    .sort((a, b) => b.count - a.count || COURSES.indexOf(a.course) - COURSES.indexOf(b.course));
}

function getOverallScore(submissions) {
  const allScores = submissions.flatMap((item) =>
    Array.from({ length: SCORE_QUESTION_COUNT }, (_, index) => getLikertScore(item, `q${index + 1}`)).filter(Number.isFinite)
  );
  return average(allScores);
}

function getAgreementRate(stat) {
  if (!stat.validCount) return null;
  return ((stat.counts["非常同意"] || 0) + (stat.counts["同意"] || 0)) / stat.validCount;
}

function getScoreLevel(score) {
  if (!Number.isFinite(score)) return "暂无判断";
  if (score >= 4.5) return "高度认同";
  if (score >= 4) return "认同度较高";
  if (score >= 3.5) return "基本认同";
  if (score >= 3) return "存在分化";
  return "需要重点加强";
}

function getDetailedAnalysis(submissions) {
  const questionStats = getQuestionStats(submissions);
  const overallScore = getOverallScore(submissions);
  const roleCount = getRoleCount(submissions);
  const roleDistribution = getRoleDistribution(submissions);
  const sortedStats = questionStats
    .filter((stat) => Number.isFinite(stat.avg))
    .sort((a, b) => b.avg - a.avg);
  const topStat = sortedStats[0] || null;
  const lowStat = sortedStats[sortedStats.length - 1] || null;
  const weakStats = [...questionStats]
    .filter((stat) => Number.isFinite(stat.avg))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);
  const courseRanking = getCourseRanking(submissions);
  const selectedCourses = courseRanking.filter((item) => item.count > 0);
  const topCourses = selectedCourses.slice(0, 3);
  const qualityIssues = collectOpenAnswers(submissions, "q8");
  const trainingNeeds = collectOpenAnswers(submissions, "q10");
  const averageAgreement = average(questionStats.map(getAgreementRate).filter(Number.isFinite));
  const conclusion = buildConclusion(overallScore, lowStat, topCourses);
  const recommendations = buildRecommendations(overallScore, weakStats, topCourses, qualityIssues);

  return {
    questionStats,
    overallScore,
    roleCount,
    roleDistribution,
    topStat,
    lowStat,
    weakStats,
    courseRanking,
    selectedCourses,
    topCourses,
    qualityIssues,
    trainingNeeds,
    averageAgreement,
    conclusion,
    recommendations
  };
}

function buildConclusion(overallScore, lowStat, topCourses) {
  const level = getScoreLevel(overallScore);
  const lowText = lowStat ? `短板主要集中在第${lowStat.index + 1}题相关能力` : "暂未形成可判断的短板";
  const courseText = topCourses.length
    ? `后续培训需求集中在${topCourses.map((item) => item.course.replace(/（.*?）/g, "")).join("、")}`
    : "后续培训需求仍需继续收集";
  return `本次调研显示，参训人员对数据治理专题培训的整体反馈处于“${level}”水平，说明培训已经在认知转变和方法理解上形成基础共识；同时，${lowText}，提示后续需要从概念理解继续走向场景化应用和机制化落地。${courseText}，建议将后续培训从单次宣贯升级为“认知提升、方法演练、机制建设、成果复盘”的连续培养路径。`;
}

function buildRecommendations(overallScore, weakStats, topCourses, qualityIssues) {
  const weakText = weakStats.length
    ? weakStats.map((stat) => `第${stat.index + 1}题`).join("、")
    : "低分题项";
  const courseText = topCourses.length
    ? topCourses.map((item) => item.course.replace(/（.*?）/g, "")).join("、")
    : "数字化能力提升课程";
  const issueText = qualityIssues.length
    ? "以开放题中提到的真实数据质量问题为样本建立案例库"
    : "持续收集各处室真实数据质量问题并建立案例库";

  return [
    `围绕${weakText}开展二次强化培训，把抽象概念转化为交通运输业务中的流程、岗位、标准和数据源责任分析。`,
    `${issueText}，每个案例明确问题现象、责任主体、源头原因、整改动作和闭环验收口径。`,
    `优先安排${courseText}等需求较集中的课程，采用“短讲授+小组工作坊+现场产出”的形式，让参训人员带着本单位问题形成可执行清单。`,
    "推动建立 Data Owner、数据质量巡检和问题台账机制，将培训成果固化到日常业务管理，而不是停留在一次性学习反馈。"
  ];
}

function renderMetrics(submissions) {
  document.querySelector("#totalCount").textContent = submissions.length;
  document.querySelector("#unitCount").textContent = getRoleCount(submissions);
  const latest = submissions[submissions.length - 1];
  document.querySelector("#latestTime").textContent = latest ? formatDate(latest.submittedAt) : "-";

  const avg = getOverallScore(submissions);
  document.querySelector("#avgScore").textContent = avg ? avg.toFixed(2) : "-";
}

function renderScoreBars(submissions) {
  const root = document.querySelector("#scoreBars");
  root.innerHTML = "";

  if (submissions.length === 0) {
    root.innerHTML = '<p class="empty-state">暂无数据</p>';
    return;
  }

  getQuestionStats(submissions).forEach((stat) => {
    root.append(createBar(`第${stat.index + 1}题`, stat.avg ? `${stat.avg.toFixed(2)} / 5` : "-", stat.avg ? (stat.avg / 5) * 100 : 0));
  });
}

function renderCourseBars(submissions) {
  const root = document.querySelector("#courseBars");
  root.innerHTML = "";

  if (submissions.length === 0) {
    root.innerHTML = '<p class="empty-state">暂无数据</p>';
    return;
  }

  const counts = getCourseCounts(submissions);
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
      text: normalizeAnswer(getAnswer(item, questionId)).trim(),
      respondent: getRespondentLabel(item),
      role: getRoleLabel(item),
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
      <div class="open-meta">${escapeHtml(item.role)} · ${escapeHtml(item.respondent)} · ${escapeHtml(formatDate(item.time))}</div>
    `;
    root.append(node);
  });
}

function renderDetails(submissions) {
  const headers = ["操作", "提交时间", "用户编号", "身份", ...QUESTIONS.map((_, index) => `Q${index + 1}`)];
  const rows = getRows(submissions);
  document.querySelector("#detailCount").textContent = `${rows.length} 条`;
  document.querySelector("#detailHead").innerHTML = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>`;
  document.querySelector("#detailBody").innerHTML = rows
    .map((row, index) => `<tr><td><button class="delete-row-button" type="button" data-delete-index="${index}">删除</button></td>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
}

function renderAnalysisSummary(submissions) {
  const root = document.querySelector("#analysisSummary");
  if (!root) return;

  if (submissions.length === 0) {
    root.innerHTML = '<p class="empty-state">暂无数据</p>';
    return;
  }

  const analysis = getDetailedAnalysis(submissions);

  root.innerHTML = `
    <article class="analysis-card">
      <h3>一、总体判断</h3>
      <p>本次共回收 <span class="analysis-highlight">${submissions.length}</span> 份问卷，覆盖 <span class="analysis-highlight">${analysis.roleCount}</span> 类身份。1-7题按“非常同意=5分、同意=4分、一般=3分、不同意=2分、非常不同意=1分”换算后，整体平均分为 <span class="analysis-highlight">${analysis.overallScore ? analysis.overallScore.toFixed(2) : "-"}</span> 分，整体处于 <span class="analysis-highlight">${escapeHtml(getScoreLevel(analysis.overallScore))}</span> 区间。</p>
      <p>从平均认同率看，1-7题中选择“非常同意/同意”的平均占比为 <span class="analysis-highlight">${analysis.averageAgreement ? `${Math.round(analysis.averageAgreement * 100)}%` : "-"}</span>，说明培训对“数据治理不是单纯IT问题，而是业务管理问题”的核心导向已经形成一定接受度。</p>
      <p>身份分布：${analysis.roleDistribution.map((item) => `${escapeHtml(item.role)} ${item.count} 人`).join("；") || "暂无"}。</p>
    </article>
    <article class="analysis-card">
      <h3>二、核心发现</h3>
      <ul>
        <li>优势项：第${analysis.topStat ? analysis.topStat.index + 1 : "-"}题得分最高，平均分 ${analysis.topStat?.avg ? analysis.topStat.avg.toFixed(2) : "-"}，对应主题为“${analysis.topStat ? escapeHtml(shortenQuestion(analysis.topStat.title, 42)) : "暂无"}”。</li>
        <li>短板项：第${analysis.lowStat ? analysis.lowStat.index + 1 : "-"}题得分最低，平均分 ${analysis.lowStat?.avg ? analysis.lowStat.avg.toFixed(2) : "-"}，对应主题为“${analysis.lowStat ? escapeHtml(shortenQuestion(analysis.lowStat.title, 42)) : "暂无"}”。</li>
        <li>低分优先关注题项为：${analysis.weakStats.map((stat) => `第${stat.index + 1}题 ${stat.avg ? stat.avg.toFixed(2) : "-"}分`).join("；") || "暂无"}。</li>
      </ul>
    </article>
    <article class="analysis-card">
      <h3>三、培训需求洞察</h3>
      <ul>
        ${analysis.topCourses.length > 0 ? analysis.topCourses.map((item) => `<li>${escapeHtml(item.course.replace(/（.*?）/g, ""))}：${item.count} 人选择，占比 ${Math.round((item.count / submissions.length) * 100)}%。</li>`).join("") : "<li>暂无课程选择数据。</li>"}
        <li>课程选择结果表明，参训人员对 AI 领导力、AI 落地工作坊和数据资产/价值化类内容关注度较高，后续培训应兼顾管理认知、工具实操和业务场景产出。</li>
      </ul>
    </article>
    <article class="analysis-card">
      <h3>四、开放反馈研判</h3>
      <ul>
        <li>数据质量问题有效反馈 ${analysis.qualityIssues.length} 条${analysis.qualityIssues.length ? `，代表性反馈包括：${escapeHtml(analysis.qualityIssues.slice(0, 3).join("；"))}` : "。后续建议继续引导填写具体业务场景，提升问题颗粒度。"}。</li>
        <li>其他方面的培训需求或者建议有效反馈 ${analysis.trainingNeeds.length} 条${analysis.trainingNeeds.length ? `，代表性反馈包括：${escapeHtml(analysis.trainingNeeds.slice(0, 3).join("；"))}` : "。"}。</li>
        <li>开放题反馈应进一步沉淀为“问题清单-责任主体-治理动作-验收标准”的闭环台账，用于指导后续数据治理专项推进。</li>
      </ul>
    </article>
    <article class="analysis-card">
      <h3>五、建议</h3>
      <ol>
        ${analysis.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </article>
    <article class="analysis-card analysis-conclusion">
      <h3>六、结论</h3>
      <p>${escapeHtml(analysis.conclusion)}</p>
      <p>总体来看，本次培训已经具备继续深化的基础，下一阶段重点不应只是增加知识点，而应转向“用真实业务问题检验数据治理能力”，通过机制建设和持续复盘把培训成果转化为可执行、可追踪、可考核的数据治理行动。</p>
    </article>
    <article class="analysis-card">
      <h3>七、注意事项</h3>
      <ul>
        <li>当前样本量为 ${submissions.length} 份，分析结论更适合作为阶段性反馈参考；随着样本增加，看板会自动更新判断。</li>
        <li>若存在测试数据，可在明细中删除后重新观察分析结果，底部结论会随数据变化自动刷新。</li>
      </ul>
    </article>
  `;
}

async function renderDashboard() {
  let submissions = [];
  try {
    submissions = await loadDashboardSubmissions();
  } catch (error) {
    dataStatus.textContent = "读取远程数据失败，请检查 API 地址或管理员 token。";
  }
  renderMetrics(submissions);
  renderScoreBars(submissions);
  renderCourseBars(submissions);
  renderOpenList("#qualityIssues", submissions, "q8");
  renderOpenList("#trainingNeeds", submissions, "q10");
  renderDetails(submissions);
  renderAnalysisSummary(submissions);
}

function exportExcel(submissions) {
  const detailRows = getExportDetailRows(submissions);
  const scoreRows = [["题号", "题目", "平均分", "非常同意(5分)", "同意(4分)", "一般(3分)", "不同意(2分)", "非常不同意(1分)", "有效答卷数"]];

  getQuestionStats(submissions).forEach((stat) => {
    scoreRows.push([
      `第${stat.index + 1}题`,
      stat.title,
      stat.avg ? roundNumber(stat.avg) : "",
      stat.counts["非常同意"],
      stat.counts["同意"],
      stat.counts["一般"],
      stat.counts["不同意"],
      stat.counts["非常不同意"],
      stat.validCount
    ]);
  });

  const courseRows = [["课程", "选择人数"]];
  COURSES.forEach((course) => {
    const count = submissions.filter((item) => normalizeCourseAnswers(item).includes(course)).length;
    courseRows.push([course, count]);
  });

  const workbook = createXlsx([
    { name: "分析概览", rows: getAnalysisRows(submissions) },
    { name: "1-7题得分", rows: scoreRows },
    { name: "课程兴趣", rows: courseRows },
    { name: "提交明细", rows: detailRows }
  ]);

  downloadBlob(workbook, `talent-survey-analysis-${Date.now()}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

function getExportDetailRows(submissions) {
  const headers = ["提交时间", "用户编号", "身份"];
  Array.from({ length: SCORE_QUESTION_COUNT }, (_, index) => {
    headers.push(`Q${index + 1}选项`, `Q${index + 1}分值`);
  });
  headers.push(`Q8.${QUESTIONS[7]}`, `Q9.${QUESTIONS[8]}`, `Q10.${QUESTIONS[9]}`);

  const rows = submissions.map((item) => {
    const row = [formatDate(item.submittedAt), getRespondentLabel(item), getRoleLabel(item)];
    Array.from({ length: SCORE_QUESTION_COUNT }, (_, index) => {
      const questionId = `q${index + 1}`;
      const score = getLikertScore(item, questionId);
      row.push(normalizeAnswer(getAnswer(item, questionId)), score ?? "");
    });
    row.push(
      normalizeAnswer(getAnswer(item, "q8")),
      normalizeAnswer(normalizeCourseAnswers(item)),
      normalizeAnswer(getAnswer(item, "q10"))
    );
    return row;
  });

  return [headers, ...rows];
}

function getAnalysisRows(submissions) {
  const analysis = getDetailedAnalysis(submissions);
  const rows = [
    ["指标", "值"],
    ["提交总数", submissions.length],
    ["身份类型数", analysis.roleCount],
    ["身份分布", analysis.roleDistribution.map((item) => `${item.role}：${item.count}人`).join("；")],
    ["评分规则", "非常同意=5分；同意=4分；一般=3分；不同意=2分；非常不同意=1分"],
    ["1-7题整体平均分", analysis.overallScore ? roundNumber(analysis.overallScore) : ""],
    ["整体评价等级", getScoreLevel(analysis.overallScore)],
    ["平均认同率", analysis.averageAgreement ? `${Math.round(analysis.averageAgreement * 100)}%` : ""],
    ["最高得分题项", analysis.topStat ? `第${analysis.topStat.index + 1}题 ${roundNumber(analysis.topStat.avg)}分：${analysis.topStat.title}` : ""],
    ["最低得分题项", analysis.lowStat ? `第${analysis.lowStat.index + 1}题 ${roundNumber(analysis.lowStat.avg)}分：${analysis.lowStat.title}` : ""],
    ["低分优先关注题项", analysis.weakStats.map((stat) => `第${stat.index + 1}题 ${roundNumber(stat.avg)}分`).join("；")],
    ["数据质量问题有效反馈数", analysis.qualityIssues.length],
    ["数据质量问题代表反馈", analysis.qualityIssues.slice(0, 5).join("；")],
    ["其他方面的培训需求或者建议有效反馈数", analysis.trainingNeeds.length],
    ["其他方面的培训需求或者建议代表反馈", analysis.trainingNeeds.slice(0, 5).join("；")],
    ["分析结论", analysis.conclusion],
    ["改进建议1", analysis.recommendations[0] || ""],
    ["改进建议2", analysis.recommendations[1] || ""],
    ["改进建议3", analysis.recommendations[2] || ""],
    ["改进建议4", analysis.recommendations[3] || ""],
    ["导出时间", formatDate(new Date().toISOString())]
  ];

  analysis.courseRanking.forEach((item, index) => {
    rows.push([`课程兴趣第${index + 1}名`, `${item.course}：${item.count}人`]);
  });

  return rows;
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
      if (typeof cell === "number" && Number.isFinite(cell)) {
        return `<c r="${ref}"><v>${cell}</v></c>`;
      }
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

function collectOpenAnswers(submissions, questionId) {
  return submissions
    .map((item) => normalizeAnswer(getAnswer(item, questionId)).trim())
    .filter(isMeaningfulOpenAnswer);
}

function isMeaningfulOpenAnswer(text) {
  if (!text) return false;
  return !["无", "暂无", "没有", "好", "好的", "非常好", "无。", "暂无。", "没有。", "好。", "好的。", "非常好。"].includes(text);
}

function shortenQuestion(text, length = 34) {
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function normalizeCourseAnswers(item) {
  const answers = getAnswer(item, "q9");
  return Array.isArray(answers) ? answers.map(normalizeCourseTitle) : [];
}

function normalizeCourseTitle(course) {
  return LEGACY_COURSE_MAP[course] || course;
}

function showTokenPanel() {
  tokenPanel.hidden = false;
  tokenPanel.style.display = "grid";
}

function hideTokenPanel() {
  tokenPanel.hidden = true;
  tokenPanel.style.display = "none";
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
  loadDashboardSubmissions()
    .then(exportExcel)
    .catch(() => alert("读取数据失败，暂时无法导出 Excel。"));
});

loadDataButton.addEventListener("click", async () => {
  dashboardToken = adminTokenInput.value.trim();
  if (dashboardToken) {
    localStorage.setItem("talent-dashboard-token", dashboardToken);
  }
  await renderDashboard();
});

document.querySelector("#detailBody").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-index]");
  if (!button) return;

  const index = Number(button.dataset.deleteIndex);
  const submissions = appConfig.apiUrl ? await loadDashboardSubmissions() : loadSubmissions();
  const target = submissions[index];
  if (!target) return;

  const label = `${getRoleLabel(target)} ${getRespondentLabel(target)} ${formatDate(target.submittedAt)}`;
  if (!confirm(`确定删除这条明细数据吗？\n${label}`)) return;

  try {
    if (appConfig.apiUrl) {
      await deleteRemoteSubmission(target.id);
    } else {
      submissions.splice(index, 1);
      saveSubmissions(submissions);
    }
    await renderDashboard();
  } catch (error) {
    alert("删除失败，请检查网络或管理员 token。");
  }
});

renderDashboard();
