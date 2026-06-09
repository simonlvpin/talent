const LIKERT_OPTIONS = ["非常同意", "同意", "一般", "不同意", "非常不同意"];

const survey = {
  id: "gz-transport-data-governance-2026",
  title: "贵州省交通运输厅数据治理专题培训调查问卷",
  questions: [
    {
      id: "q1",
      type: "likert",
      required: true,
      text: "我可以从宏观向他人讲解数据治理的“立法、司法、执法”的概念和区别，并用于指导实际的工作。"
    },
    {
      id: "q2",
      type: "likert",
      required: true,
      text: "我可以针对各类数据质量问题，通过“数据流、信息流、业务流”理论来定位分析质量问题、划分问题责任主体、追根溯源找到问题的根本原因。"
    },
    {
      id: "q3",
      type: "likert",
      required: true,
      text: "我理解数据治理委员会在数据治理中发挥的实际作用，例如涉及到重大的信息化系统改造、业务管理问题的解决，数据治理委员会要在“司法”中发挥重要的作用。"
    },
    {
      id: "q4",
      type: "likert",
      required: true,
      text: "我理解“支部建在连队上”的核心思想是要在业务线建立 Data Owner 的机制。"
    },
    {
      id: "q5",
      type: "likert",
      required: true,
      text: "培训前，我可能认为数据治理主要是信息技术部门（IT）的职责。培训后，我认识到业务部门（如规划、建管、运输、执法等）才是数据治理的责任主体和核心受益者。"
    },
    {
      id: "q6",
      type: "likert",
      required: true,
      text: "在今后的工作中，如果我分管或参与的领域出现数据质量问题，我会主动组织业务人员分析问题根因，并推动流程或标准优化，而不是仅仅要求IT人员处理。"
    },
    {
      id: "q7",
      type: "likert",
      required: true,
      text: "我愿意支持在处室/单位内部建立“数据质量巡检”或“数据责任人（Data Owner）”等管理机制，并将其纳入日常业务管理或考核。"
    },
    {
      id: "q8",
      type: "textarea",
      required: true,
      text: "我认为当前贵州省交通运输数据治理工作中，最迫切需要解决的一个业务数据质量问题是什么？",
      placeholder: "请填写一个最迫切需要解决的业务数据质量问题"
    },
    {
      id: "q9",
      type: "checkbox",
      required: true,
      text: "我对以下其他数字化的培训也比较感兴趣（可多选）",
      options: [
        {
          title: "课程一：数字化意识与数据思维（面向全体人员）",
          desc: "数据驱动决策的基本理念、从经验管理到数据管理的思维转变"
        },
        {
          title: "课程二：数据治理体系全生命周期管理（面向数据管理专员）",
          desc: "数据采集、存储、集成、归档全流程规范、元数据管理与主数据治理、数据质量闭环控制"
        },
        {
          title: "课程三：数据资产管理及价值化路径（面向资产管理与政策研究人员）",
          desc: "数据资产确权与入表操作、交通公共数据授权运营、数据价值评估与交易模式"
        },
        {
          title: "课程四：BI与数据分析应用（面向业务分析骨干）",
          desc: "交通指标体系构建、BI可视化仪表盘设计、从报表分析到业务洞察的实践"
        },
        {
          title: "课程五：AI 领导力（面向中高层管理干部）",
          desc: "AI 发展的趋势、AI 时代下组织进化的要点"
        },
        {
          title: "课程六：AI 落地工作坊（所有人）",
          desc: "快速 AI 场景和 AI Demo 产出，真价值真落地，掌握未来最流行的 DORA AI 智能分析、AI 智能体"
        }
      ]
    },
    {
      id: "q10",
      type: "textarea",
      required: false,
      text: "期望其他方面的培训",
      placeholder: "如有其他期望培训方向，请填写"
    }
  ]
};

const form = document.querySelector("#surveyForm");
const questionsRoot = document.querySelector("#questions");
const resultPanel = document.querySelector("#resultPanel");
const resetButton = document.querySelector("#resetButton");
const closeButton = document.querySelector("#closeButton");
const closeHelp = document.querySelector("#closeHelp");
const identitySection = document.querySelector(".identity-section");

function createQuestionCard(question, index) {
  const card = document.createElement("article");
  card.className = "question-card";
  card.dataset.questionId = question.id;

  const title = document.createElement("div");
  title.className = "question-title";
  title.innerHTML = `${index + 1}、${escapeHtml(question.text)}${question.required ? ' <span class="required">*</span>' : ""}`;
  card.append(title);

  if (question.type === "likert") {
    card.append(createOptions(question, LIKERT_OPTIONS, "radio"));
  }

  if (question.type === "checkbox") {
    card.append(createCourseOptions(question));
  }

  if (question.type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.className = "open-answer";
    textarea.name = question.id;
    textarea.placeholder = question.placeholder || "";
    textarea.required = question.required;
    card.append(textarea);
  }

  return card;
}

function createOptions(question, options, inputType) {
  const list = document.createElement("div");
  list.className = "option-list";

  options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "option-item";

    const input = document.createElement("input");
    input.type = inputType;
    input.name = question.id;
    input.value = option;
    input.required = question.required && inputType === "radio";

    const text = document.createElement("span");
    text.textContent = option;

    label.append(input, text);
    list.append(label);
  });

  return list;
}

function createCourseOptions(question) {
  const list = document.createElement("div");
  list.className = "option-list";

  question.options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "option-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = question.id;
    input.value = option.title;

    const text = document.createElement("span");
    text.innerHTML = `<span class="course-title">${escapeHtml(option.title)}</span><span class="course-desc">${escapeHtml(option.desc)}</span>`;

    label.append(input, text);
    list.append(label);
  });

  return list;
}

function renderSurvey() {
  questionsRoot.innerHTML = "";
  survey.questions.forEach((question, index) => {
    questionsRoot.append(createQuestionCard(question, index));
  });
}

function collectSubmission() {
  const data = new FormData(form);
  const answers = {};

  survey.questions.forEach((question) => {
    if (question.type === "checkbox") {
      answers[question.id] = data.getAll(question.id);
    } else {
      answers[question.id] = (data.get(question.id) || "").toString().trim();
    }
  });

  return {
    surveyId: survey.id,
    surveyTitle: survey.title,
    submittedAt: new Date().toISOString(),
    unit: (data.get("unit") || "").toString().trim(),
    name: (data.get("name") || "").toString().trim(),
    answers
  };
}

function showError(card, message) {
  const oldError = card.querySelector(".error-message");
  if (oldError) oldError.remove();

  const error = document.createElement("div");
  error.className = "error-message";
  error.textContent = message;
  card.append(error);
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach((error) => error.remove());
  document.querySelectorAll("[aria-invalid='true']").forEach((field) => {
    field.setAttribute("aria-invalid", "false");
  });
}

function validateIdentity() {
  const unitInput = document.querySelector("#unit");
  const nameInput = document.querySelector("#name");
  const missing = [];

  if (!unitInput.value.trim()) {
    missing.push("单位");
    unitInput.setAttribute("aria-invalid", "true");
  }

  if (!nameInput.value.trim()) {
    missing.push("姓名");
    nameInput.setAttribute("aria-invalid", "true");
  }

  if (missing.length > 0) {
    showError(identitySection, `请填写${missing.join("和")}后再提交。`);
    const target = missing.includes("单位") ? unitInput : nameInput;
    target.focus();
    identitySection.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }

  return true;
}

function validateForm() {
  clearErrors();
  const data = new FormData(form);

  if (!validateIdentity()) {
    return false;
  }

  if (!form.reportValidity()) {
    return false;
  }

  for (const question of survey.questions) {
    if (!question.required) continue;

    const card = document.querySelector(`[data-question-id="${question.id}"]`);
    if (question.type === "checkbox" && data.getAll(question.id).length === 0) {
      card.querySelectorAll(`input[name="${question.id}"]`).forEach((input) => {
        input.setAttribute("aria-invalid", "true");
      });
      showError(card, "请至少选择一个感兴趣的培训课程后再提交。");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    const value = data.get(question.id);
    if (!value || !value.toString().trim()) {
      showError(card, "请完成此题后再提交。");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
  }

  return true;
}

function saveSubmission(submission) {
  const key = `talent-survey:${survey.id}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(submission);
  localStorage.setItem(key, JSON.stringify(existing));
}

function closeSurveyPage() {
  if (window.WeixinJSBridge) {
    window.WeixinJSBridge.call("closeWindow");
    return;
  }

  document.addEventListener("WeixinJSBridgeReady", () => {
    window.WeixinJSBridge.call("closeWindow");
  }, { once: true });

  window.close();

  setTimeout(() => {
    closeHelp.hidden = false;
  }, 500);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateForm()) return;

  saveSubmission(collectSubmission());
  form.hidden = true;
  resultPanel.hidden = false;
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

resetButton.addEventListener("click", () => {
  form.reset();
  clearErrors();
  resultPanel.hidden = true;
});

closeButton.addEventListener("click", closeSurveyPage);

renderSurvey();
