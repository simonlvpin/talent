const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json;charset=utf-8"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response("", { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    try {
      if (request.method === "POST") {
        const payload = await request.json();
        if (payload.action === "create") {
          return json(await createSubmission(env, payload.submission));
        }
        if (payload.action === "delete") {
          assertAdmin(payload.token, env.ADMIN_TOKEN);
          await deleteSubmission(env, payload.id);
          return json({ ok: true });
        }
      }

      if (request.method === "GET" && action === "list") {
        assertAdmin(url.searchParams.get("token"), env.ADMIN_TOKEN);
        return json({ ok: true, submissions: await listSubmissions(env) });
      }

      return json({ ok: false, error: "Unsupported action" }, 400);
    } catch (error) {
      return json({ ok: false, error: error.message }, error.status || 500);
    }
  }
};

async function createSubmission(env, submission = {}) {
  const id = crypto.randomUUID();
  const saved = {
    id,
    surveyId: submission.surveyId || "",
    surveyTitle: submission.surveyTitle || "",
    submittedAt: submission.submittedAt || new Date().toISOString(),
    unit: submission.unit || "",
    name: submission.name || "",
    answers: submission.answers || {}
  };

  await env.SURVEY_KV.put(`submission:${id}`, JSON.stringify(saved));
  const ids = await getIndex(env);
  ids.push(id);
  await env.SURVEY_KV.put("submission:index", JSON.stringify(ids));
  return { ok: true, submission: saved };
}

async function listSubmissions(env) {
  const ids = await getIndex(env);
  const rows = await Promise.all(ids.map(async (id) => {
    const raw = await env.SURVEY_KV.get(`submission:${id}`);
    return raw ? JSON.parse(raw) : null;
  }));
  return rows.filter(Boolean);
}

async function deleteSubmission(env, id) {
  if (!id) throw Object.assign(new Error("Missing id"), { status: 400 });

  await env.SURVEY_KV.delete(`submission:${id}`);
  const ids = await getIndex(env);
  await env.SURVEY_KV.put("submission:index", JSON.stringify(ids.filter((item) => item !== id)));
}

async function getIndex(env) {
  const raw = await env.SURVEY_KV.get("submission:index");
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function assertAdmin(token, expected) {
  if (!expected || token !== expected) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}
