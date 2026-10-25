const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(res.ok ? 'Invalid response from server' : `HTTP ${res.status}`);
  }
  if (!res.ok) throw new Error(data.error || data.detail || `HTTP ${res.status}`);
  return data;
}

export const api = {
  health: () => request('/health'),

  startCall: (prospect_name, prospect_role, prospect_company) =>
    request('/calls/start', {
      method: 'POST',
      body: JSON.stringify({ prospect_name, prospect_role, prospect_company }),
    }),

  saveStage: (callId, stage_number, what_happened, prospect_words) =>
    request(`/calls/${callId}/stage`, {
      method: 'POST',
      body: JSON.stringify({ stage_number, what_happened, prospect_words }),
    }),

  closeCall: (callId, outcome, current_stage) =>
    request(`/calls/${callId}/close`, {
      method: 'POST',
      body: JSON.stringify({ outcome, current_stage }),
    }),

  listCalls: () => request('/calls'),

  getCall: (callId) => request(`/calls/${callId}`),

  suggestStage: (prospect_words, current_stage) =>
    request('/ai/suggest-stage', {
      method: 'POST',
      body: JSON.stringify({ prospect_words, current_stage }),
    }),

  summariseCall: (prospect_name, prospect_company, stages, outcome) =>
    request('/ai/summarise-call', {
      method: 'POST',
      body: JSON.stringify({ prospect_name, prospect_company, stages, outcome }),
    }),

  sentiment: (prospect_words) =>
    request('/ai/sentiment', {
      method: 'POST',
      body: JSON.stringify({ prospect_words }),
    }),

  followUpEmail: (prospect_name, prospect_role, prospect_company, stages, outcome) =>
    request('/ai/follow-up-email', {
      method: 'POST',
      body: JSON.stringify({ prospect_name, prospect_role, prospect_company, stages, outcome }),
    }),

  scoreCall: (prospect_name, stages, outcome, current_stage) =>
    request('/ai/score-call', {
      method: 'POST',
      body: JSON.stringify({ prospect_name, stages, outcome, current_stage }),
    }),

  analyse: (prospect_words, current_stage) =>
    request('/ai/analyse', {
      method: 'POST',
      body: JSON.stringify({ prospect_words, current_stage }),
    }),

  reply: (customer_question, current_stage) =>
    request('/ai/reply', {
      method: 'POST',
      body: JSON.stringify({ customer_question, current_stage }),
    }),
};
