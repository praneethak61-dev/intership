require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const productKB = require('./productKnowledge');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Clients ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// gemini-1.5-flash was shut down in 2025 and causes "Could not generate reply"
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

function getGeminiModel() {
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

function parseGeminiJson(text) {
  const cleaned = String(text || '')
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI returned invalid JSON');
    return JSON.parse(match[0]);
  }
}

// ── Stage definitions (used by AI prompt) ───────────────────────────────────
const STAGE_NAMES = [
  '', // index 0 unused
  'Opening',
  'Purpose',
  'Permission',
  'Their Business',
  'Their Need',
  'Objection',
  'Next Step',
  'Close',
];

// ── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start a new call
app.post('/calls/start', async (req, res) => {
  const { prospect_name, prospect_role, prospect_company } = req.body;

  if (!prospect_name) {
    return res.status(400).json({ error: 'prospect_name is required' });
  }

  const { data, error } = await supabase
    .from('calls')
    .insert([{ prospect_name, prospect_role, prospect_company, current_stage: 1 }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Save / update a stage result
app.post('/calls/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { stage_number, what_happened, prospect_words } = req.body;

  if (!stage_number) {
    return res.status(400).json({ error: 'stage_number is required' });
  }

  // Upsert the stage row
  const { data: stageData, error: stageErr } = await supabase
    .from('call_stages')
    .upsert(
      [{ call_id: id, stage_number, what_happened, prospect_words }],
      { onConflict: 'call_id,stage_number' }
    )
    .select()
    .single();

  if (stageErr) return res.status(500).json({ error: stageErr.message });

  // Update the current_stage on the call
  const { error: callErr } = await supabase
    .from('calls')
    .update({ current_stage: stage_number })
    .eq('id', id);

  if (callErr) return res.status(500).json({ error: callErr.message });

  res.json(stageData);
});

// Close a call
app.post('/calls/:id/close', async (req, res) => {
  const { id } = req.params;
  const { outcome, current_stage } = req.body;

  const { data, error } = await supabase
    .from('calls')
    .update({ outcome, current_stage, closed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// List all calls with their stages
app.get('/calls', async (req, res) => {
  const { data: calls, error: callsErr } = await supabase
    .from('calls')
    .select('*')
    .order('started_at', { ascending: false });

  if (callsErr) return res.status(500).json({ error: callsErr.message });

  // Attach stages for each call
  const callIds = calls.map((c) => c.id);
  if (callIds.length === 0) return res.json([]);

  const { data: stages, error: stagesErr } = await supabase
    .from('call_stages')
    .select('*')
    .in('call_id', callIds)
    .order('stage_number', { ascending: true });

  if (stagesErr) return res.status(500).json({ error: stagesErr.message });

  const callsWithStages = calls.map((call) => ({
    ...call,
    stages: stages.filter((s) => s.call_id === call.id),
  }));

  res.json(callsWithStages);
});

// Get a single call with its stages
app.get('/calls/:id', async (req, res) => {
  const { id } = req.params;

  const { data: call, error: callErr } = await supabase
    .from('calls')
    .select('*')
    .eq('id', id)
    .single();

  if (callErr) return res.status(404).json({ error: 'Call not found' });

  const { data: stages, error: stagesErr } = await supabase
    .from('call_stages')
    .select('*')
    .eq('call_id', id)
    .order('stage_number', { ascending: true });

  if (stagesErr) return res.status(500).json({ error: stagesErr.message });

  res.json({ ...call, stages: stages || [] });
});

// AI: suggest next stage based on prospect's words
app.post('/ai/suggest-stage', async (req, res) => {
  const { prospect_words, current_stage } = req.body;

  if (!prospect_words || !prospect_words.trim()) {
    return res.status(400).json({ error: 'prospect_words is required' });
  }

  try {
    const model = getGeminiModel();

    const prompt = `You are a cold-call coach analysing a call for Meridian Growth Partners, a Hyderabad-based growth consulting firm that calls Indian manufacturers and company founders.

The 8 stages of a cold call are:
1. Opening – reach the right person, introduce yourself
2. Purpose – explain why you called in one or two sentences
3. Permission – check if they are willing to talk now
4. Their Business – ask about their company before pitching
5. Their Need – hear what they are trying to do, in their own words
6. Objection – hear the reason for a no or hesitation
7. Next Step – agree one concrete next action (WhatsApp, email, meeting)
8. Close – end the call and record the outcome

The caller is currently on stage ${current_stage} (${STAGE_NAMES[current_stage] || 'Unknown'}).

The prospect just said: "${prospect_words}"

Based on what the prospect said, which stage does this call appear to be at now?
Reply with ONLY a JSON object in this format (no markdown, no explanation):
{"suggested_stage": <number 1-8>, "stage_name": "<name>", "reason": "<one sentence>"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    res.json(parseGeminiJson(text));
  } catch (err) {
    console.error('Gemini error:', err.message);
    res.status(500).json({ error: 'AI suggestion failed', detail: err.message });
  }
});

// AI: summarise a completed call
app.post('/ai/summarise-call', async (req, res) => {
  const { prospect_name, prospect_company, stages, outcome } = req.body;

  try {
    const model = getGeminiModel();

    const stageText = (stages || [])
      .map(
        (s) =>
          `Stage ${s.stage_number} (${STAGE_NAMES[s.stage_number] || ''}): happened=[${(s.what_happened || []).join(', ')}], prospect said="${s.prospect_words || ''}"`
      )
      .join('\n');

    const prompt = `Summarise this cold call in one clear sentence for a sales log.

Prospect: ${prospect_name} at ${prospect_company}
Outcome: ${outcome || 'not recorded'}
Stages:
${stageText}

Reply with ONLY the summary sentence. No bullet points, no markdown.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    res.json({ summary });
  } catch (err) {
    console.error('Gemini summary error:', err.message);
    res.status(500).json({ error: 'Summary failed', detail: err.message });
  }
});

// AI: analyze prospect sentiment
app.post('/ai/sentiment', async (req, res) => {
  const { prospect_words } = req.body;
  if (!prospect_words?.trim()) return res.status(400).json({ error: 'prospect_words required' });
  try {
    const model = getGeminiModel();
    const prompt = `Analyze the sentiment of this prospect statement in a sales cold call.
Statement: "${prospect_words}"
Reply ONLY with JSON (no markdown): {"sentiment": "positive" or "neutral" or "negative", "score": number 1-10, "signal": "short phrase describing their attitude"}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    res.json(parseGeminiJson(text));
  } catch (err) {
    console.error('Sentiment error:', err.message);
    res.status(500).json({ error: 'Sentiment analysis failed' });
  }
});

// AI: generate follow-up email
app.post('/ai/follow-up-email', async (req, res) => {
  const { prospect_name, prospect_role, prospect_company, stages, outcome } = req.body;
  try {
    const model = getGeminiModel();
    const stageText = (stages || [])
      .map(s => `Stage ${s.stage_number} (${STAGE_NAMES[s.stage_number] || ''}): ${(s.what_happened || []).join(', ')}. Prospect said: "${s.prospect_words || ''}"`)
      .join('\n');
    const prompt = `Write a professional follow-up email after a cold call.
Prospect: ${prospect_name}${prospect_role ? ', ' + prospect_role : ''}${prospect_company ? ' at ' + prospect_company : ''}
Outcome: ${outcome || 'not recorded'}
Call notes:
${stageText}

Write a warm, professional follow-up email referencing specifics from the call.
Reply in this exact format:
Subject: <subject line>
Body: <email body only>`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const subjectMatch = text.match(/Subject:\s*(.+)/);
    const bodyMatch = text.match(/Body:\s*([\s\S]+)/);
    res.json({
      subject: subjectMatch?.[1]?.trim() || 'Following up on our conversation',
      body: bodyMatch?.[1]?.trim() || text,
    });
  } catch (err) {
    console.error('Email gen error:', err.message);
    res.status(500).json({ error: 'Email generation failed', detail: err.message });
  }
});

// AI: score the call
app.post('/ai/score-call', async (req, res) => {
  const { prospect_name, stages, outcome, current_stage } = req.body;
  try {
    const model = getGeminiModel();
    const stageText = (stages || [])
      .map(s => `Stage ${s.stage_number} (${STAGE_NAMES[s.stage_number] || ''}): ${(s.what_happened || []).join(', ')}. Words: "${s.prospect_words || ''}"`)
      .join('\n');
    const prompt = `Score this cold call performance from 1-10.
Stages completed: ${current_stage} of 8
Outcome: ${outcome || 'not recorded'}
Stage notes:
${stageText}

Evaluate: progression through stages, objection handling, securing next steps, and communication quality.
Reply ONLY with JSON (no markdown):
{"score": <1-10>, "grade": "A" or "B" or "C" or "D" or "F", "strengths": ["point1", "point2"], "improvements": ["point1", "point2"], "verdict": "one sentence overall assessment"}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    res.json(parseGeminiJson(text));
  } catch (err) {
    console.error('Score error:', err.message);
    res.status(500).json({ error: 'Scoring failed', detail: err.message });
  }
});

// ── Unified AI Analyse: intent + sentiment + stage + response suggestions ────
app.post('/ai/analyse', async (req, res) => {
  const { prospect_words, current_stage } = req.body;
  if (!prospect_words?.trim()) return res.status(400).json({ error: 'prospect_words required' });

  try {
    const model = getGeminiModel();

    // Build a compact KB summary for the prompt
    const kbSummary = `
COMPANY: ${productKB.company} — ${productKB.tagline}
WHAT WE DO: ${productKB.whatWeDo}
SERVICES: ${productKB.services.map(s => `${s.name} (${s.duration}): ${s.desc}`).join(' | ')}
PRICING: ${productKB.pricing.range}. ${productKB.pricing.roi}. Free Growth Research Report with zero commitment.
KEY BENEFITS: ${productKB.keyBenefits.join('; ')}
PROOF: ${productKB.proofPoints.slice(0, 3).join('; ')}
OBJECTION HANDLERS:
${productKB.commonObjections.map(o => `- "${o.objection}" → "${o.response}"`).join('\n')}
CALL SCRIPT SNIPPETS:
- Purpose: "${productKB.coldCallScript.purpose}"
- Permission: "${productKB.coldCallScript.permission}"
- Next Step Ask: "${productKB.coldCallScript.nextStepAsk}"`.trim();

    const stageName = STAGE_NAMES[current_stage] || 'Unknown';

    const prompt = `You are a live AI sales copilot for ${productKB.company}.
You help sales representatives respond to prospects in real time during cold calls.

PRODUCT KNOWLEDGE BASE:
${kbSummary}

CURRENT CALL CONTEXT:
- Stage: ${current_stage} of 8 (${stageName})
- Prospect just said: "${prospect_words}"

YOUR TASK — analyse the prospect's statement and return the following in ONE JSON object:

1. intent — classify as ONE of: price_concern, feature_question, objection, positive_signal, competitor_mention, not_interested, wants_more_info, general
2. intent_label — short human-readable label (e.g. "Price Concern", "Showing Interest")
3. sentiment — "positive", "neutral", or "negative"
4. sentiment_score — number 1-10 (10 = very positive)
5. sentiment_signal — short phrase describing their mood (e.g. "cautiously open", "clearly resistant")
6. suggested_stage — which stage 1-8 this call appears to be at now
7. stage_name — name of that stage
8. stage_reason — one sentence why
9. suggestions — array of exactly 3 strings: specific, natural things the SALESPERSON should say RIGHT NOW, using the product knowledge above to be accurate and relevant. Each response should be 1-3 sentences, conversational Indian English, referencing the product specifics where helpful.

Reply ONLY with a valid JSON object. No markdown, no explanation outside the JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    res.json(parseGeminiJson(text));
  } catch (err) {
    console.error('Analyse error:', err.message);
    res.status(500).json({ error: 'Analysis failed', detail: err.message });
  }
});

// ── AI Reply: direct answer to customer's question ───────────────────────────
app.post('/ai/reply', async (req, res) => {
  const { customer_question, current_stage } = req.body;
  if (!customer_question?.trim()) return res.status(400).json({ error: 'customer_question required' });

  try {
    const model = getGeminiModel();

    const kbSummary = `
COMPANY: ${productKB.company} — ${productKB.tagline}
WHAT WE DO: ${productKB.whatWeDo}
SERVICES:
${productKB.services.map(s => `- ${s.name} (${s.duration}): ${s.desc} Best for: ${s.bestFor}`).join('\n')}
PRICING: ${productKB.pricing.range}. ROI: ${productKB.pricing.roi}. Payment: ${productKB.pricing.paymentTerms}. ${productKB.pricing.note}
KEY BENEFITS: ${productKB.keyBenefits.join('; ')}
SUCCESS STORIES: ${productKB.proofPoints.join('; ')}
IDEAL CUSTOMER: ${productKB.idealCustomer}
COMMON OBJECTION HANDLERS:
${productKB.commonObjections.map(o => `Q: "${o.objection}" → A: "${o.response}"`).join('\n')}`.trim();

    const stageName = STAGE_NAMES[current_stage] || 'Unknown';

    const prompt = `You are a helpful AI assistant for a salesperson at ${productKB.company}.
A customer on a cold call just asked a question or made a statement. You must generate a DIRECT REPLY that the salesperson can say to the customer.

PRODUCT KNOWLEDGE:
${kbSummary}

CALL CONTEXT:
- Current stage: ${current_stage} of 8 (${stageName})
- Customer said: "${customer_question}"

INSTRUCTIONS:
1. Write a direct, natural reply the salesperson should say to the customer RIGHT NOW
2. The reply must be specific, helpful, and reference actual product details from the knowledge base
3. Keep it conversational (2-4 sentences), in friendly Indian English
4. If the customer asked a question, ANSWER it clearly
5. If the customer raised an objection, ADDRESS it with empathy and facts
6. If the customer showed interest, ENCOURAGE them and suggest a next step

Also classify the customer's intent.

Reply ONLY with this JSON (no markdown):
{
  "reply": "the exact words the salesperson should say to the customer",
  "intent": "price_concern" or "feature_question" or "objection" or "positive_signal" or "competitor_mention" or "not_interested" or "wants_more_info" or "general",
  "intent_label": "short label like Price Concern or Feature Question",
  "sentiment": "positive" or "neutral" or "negative",
  "tip": "one short coaching tip for the salesperson (not to be said aloud)"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    res.json(parseGeminiJson(text));
  } catch (err) {
    console.error('Reply error:', err.message);
    res.status(500).json({ error: 'Reply generation failed', detail: err.message });
  }
});

// Start ───────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Cold-Call Copilot backend running on port ${PORT} (Gemini: ${GEMINI_MODEL})`);
});
