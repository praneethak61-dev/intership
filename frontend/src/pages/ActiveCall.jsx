import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { STAGES, OUTCOME_OPTIONS, OUTCOME_LABELS } from '../stages';

// ── Timer ────────────────────────────────────────────────────────────────────
function useTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  const color = elapsed > 600 ? '#ef4444' : elapsed > 300 ? '#f59e0b' : '#6b7280';
  return { display: `${m}:${s}`, color };
}

// ── Speak text aloud ─────────────────────────────────────────────────────────
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-IN';
  utt.rate = 0.92;
  window.speechSynthesis.speak(utt);
}

// ── Intent Config ────────────────────────────────────────────────────────────
const INTENT_CONFIG = {
  price_concern:    { emoji: '💰', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  feature_question: { emoji: '❓', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  objection:        { emoji: '🚫', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  positive_signal:  { emoji: '✅', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  competitor_mention:{ emoji: '⚔️', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  not_interested:   { emoji: '🔕', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  wants_more_info:  { emoji: '🔍', color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
  general:          { emoji: '💬', color: '#374151', bg: '#f9fafb', border: '#e5e7eb' },
};

// ── Coaching Tips ─────────────────────────────────────────────────────────────
const COACHING_TIPS = {
  1: '🎯 State your name and company clearly. Slow down.',
  2: '🎯 One sentence on WHY you called. About them, not you.',
  3: '🎯 Ask permission gently. Confirm exact day & time if they say later.',
  4: '🎯 Ask about their business first. Listen more than you speak.',
  5: '🎯 Note their exact words. These become your pitch language.',
  6: '🎯 Don\'t argue. Agree first, then answer with a proof point.',
  7: '🎯 Get ONE concrete next step — WhatsApp, time, or meeting.',
  8: '🎯 End cleanly. Confirm what was agreed. Thank them by name.',
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function ActiveCall() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentStage, setCurrentStage] = useState(1);
  const [stageSelections, setStageSelections] = useState({});
  const [prospectWords, setProspectWords] = useState('');
  const [saving, setSaving] = useState(false);

  const [showEndModal, setShowEndModal] = useState(false);
  const [outcome, setOutcome] = useState(OUTCOME_OPTIONS[0]);
  const [closing, setClosing] = useState(false);

  // ── AI Reply state ─────────────────────────────────────────────────────────
  const [aiReply, setAiReply] = useState(null);       // { reply, intent, intent_label, sentiment, tip }
  const [loadingReply, setLoadingReply] = useState(false);
  const [replyCopied, setReplyCopied] = useState(false);

  // ── Voice state ────────────────────────────────────────────────────────────
  const [listening, setListening] = useState(false);
  const [voicePhase, setVoicePhase] = useState('');    // '' | 'listening' | 'thinking' | 'ready'
  const [autoListen, setAutoListen] = useState(false); // continuous listen mode
  const recRef = useRef(null);
  const autoRef = useRef(false);
  const pendingRef = useRef('');
  const debounceRef = useRef(null);

  const timer = useTimer(call?.started_at);

  // ── Get AI Reply (called by voice flow OR button) ──────────────────────────
  async function getReply(question) {
    if (!question || question.trim().length < 3) return;
    setLoadingReply(true);
    setAiReply(null);
    setVoicePhase('thinking');
    try {
      const result = await api.reply(question, currentStage);
      setAiReply(result);
      setVoicePhase('ready');
    } catch (err) {
      setAiReply({ reply: 'Could not generate reply. Please try again.', intent: 'general', intent_label: 'Error', sentiment: 'neutral', tip: '' });
      setVoicePhase('');
    } finally {
      setLoadingReply(false);
    }
  }

  // ── Start mic listening ────────────────────────────────────────────────────
  function startMic(continuous) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported. Use Chrome or Edge.'); return; }
    try { recRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = !continuous; // if auto-listen: single sentence, else continuous
    rec.interimResults = false;
    recRef.current = rec;

    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript + ' ';
      }
      if (text.trim()) {
        const newWords = text.trim();
        pendingRef.current = newWords;
        setProspectWords((prev) => prev ? `${prev} ${newWords}` : newWords);
      }
    };

    rec.onend = () => {
      if (autoRef.current && pendingRef.current) {
        // Auto mode: customer stopped speaking → get AI reply
        const question = pendingRef.current;
        pendingRef.current = '';
        getReply(question).then(() => {
          // After reply is ready, resume listening
          setTimeout(() => {
            if (autoRef.current) {
              setVoicePhase('listening');
              startMic(true);
            }
          }, 2000);
        });
      } else {
        setListening(false);
        if (!autoRef.current) setVoicePhase('');
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech' && autoRef.current) {
        setTimeout(() => { if (autoRef.current) startMic(true); }, 500);
        return;
      }
      setListening(false);
      if (!autoRef.current) setVoicePhase('');
    };

    setListening(true);
    setVoicePhase('listening');
    rec.start();
  }

  // ── Toggle auto-listen mode ────────────────────────────────────────────────
  function toggleAutoListen() {
    if (autoListen) {
      autoRef.current = false;
      setAutoListen(false);
      setListening(false);
      setVoicePhase('');
      try { recRef.current?.stop(); } catch {}
      window.speechSynthesis?.cancel();
    } else {
      autoRef.current = true;
      setAutoListen(true);
      pendingRef.current = '';
      startMic(true);
    }
  }

  // ── Toggle manual mic ──────────────────────────────────────────────────────
  function toggleManualMic() {
    if (listening && !autoListen) {
      try { recRef.current?.stop(); } catch {}
      setListening(false);
      setVoicePhase('');
    } else {
      startMic(false);
    }
  }

  // ── Debounced AI reply for manual typing ───────────────────────────────────
  useEffect(() => {
    if (autoListen) return; // auto mode handles it via rec.onend
    if (!prospectWords || prospectWords.trim().length < 10) {
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      getReply(prospectWords);
    }, 1800);
    return () => clearTimeout(debounceRef.current);
  }, [prospectWords, currentStage, autoListen]);

  // ── "Get Reply" button handler ─────────────────────────────────────────────
  function handleGetReply() {
    if (!prospectWords.trim()) return;
    getReply(prospectWords);
  }

  // ── Copy reply ─────────────────────────────────────────────────────────────
  function copyReply() {
    if (!aiReply?.reply) return;
    navigator.clipboard.writeText(aiReply.reply);
    setReplyCopied(true);
    setTimeout(() => setReplyCopied(false), 2000);
  }

  // ── Load call ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.getCall(id)
      .then((data) => {
        if (data.closed_at) { navigate(`/call/${id}/review`, { replace: true }); return; }
        setCall(data);
        setCurrentStage(data.current_stage || 1);
        const saved = {};
        (data.stages || []).forEach((s) => { saved[s.stage_number] = s.what_happened || []; });
        setStageSelections(saved);
        const last = data.stages?.find((s) => s.stage_number === (data.current_stage || 1));
        if (last?.prospect_words) setProspectWords(last.prospect_words);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Cleanup
  useEffect(() => {
    return () => {
      autoRef.current = false;
      try { recRef.current?.stop(); } catch {}
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Stage handlers ─────────────────────────────────────────────────────────
  function toggleOption(option) {
    setStageSelections((prev) => {
      const cur = prev[currentStage] || [];
      return { ...prev, [currentStage]: cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option] };
    });
  }

  async function handleNext() {
    setSaving(true);
    try {
      await api.saveStage(id, currentStage, stageSelections[currentStage] || [], prospectWords);
      if (currentStage < 8) {
        setCurrentStage((s) => s + 1);
        setProspectWords('');
        setAiReply(null);
      } else { setShowEndModal(true); }
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleClose() {
    setClosing(true);
    try {
      await api.saveStage(id, currentStage, stageSelections[currentStage] || [], prospectWords);
      await api.closeCall(id, outcome, currentStage);
      navigate('/', { replace: true });
    } catch (err) { setError(err.message); }
    finally { setClosing(false); setShowEndModal(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="loading-screen"><div className="spinner" />Opening call…</div>;
  if (error && !call) return (
    <div className="loading-screen">
      <p style={{ color: '#ef4444' }}>{error}</p>
      <button onClick={() => navigate('/')} style={{ marginTop: 8, cursor: 'pointer', padding: '8px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}>Go back</button>
    </div>
  );

  const stage = STAGES[currentStage - 1];
  if (!stage) return null;
  const nextStage = STAGES[currentStage];
  const selected = stageSelections[currentStage] || [];

  const intentCfg = aiReply ? (INTENT_CONFIG[aiReply.intent] || INTENT_CONFIG.general) : null;

  return (
    <div className="page">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="topbar">
        <span className="topbar-brand">VoiceAssist AI</span>
        <div className="topbar-right">
          <span className="topbar-timer" style={{ color: timer.color }}>{timer.display}</span>
          <button className="btn-icon" onClick={() => navigate('/')} title="Back" id="back-btn">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 5L7 9l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Prospect Header ─────────────────────────────────── */}
      <div className="prospect-header">
        <div className="prospect-name">{call.prospect_name}</div>
        <div className="prospect-meta">
          {[call.prospect_role, call.prospect_company].filter(Boolean).join(' · ')}
          {(call.prospect_role || call.prospect_company) ? ' · ' : ''}
          <span className="badge">first call</span>
        </div>
      </div>

      {/* ══════ VOICE CONTROL BAR ══════ */}
      <div className="auto-answer-bar">
        <button onClick={toggleAutoListen} id="auto-answer-btn" className={`auto-answer-btn ${autoListen ? 'active' : ''}`}>
          <span className="auto-answer-icon">{autoListen ? '⏹' : '🎙️'}</span>
          <span className="auto-answer-label">{autoListen ? 'Stop Listening' : 'Listen & Get Reply'}</span>
        </button>
        {!autoListen && (
          <button onClick={toggleManualMic} className={`mic-only-btn ${listening ? 'active' : ''}`}>
            {listening ? '⏸ Stop' : '🎤 Mic Only'}
          </button>
        )}
      </div>

      {/* Voice Phase Status */}
      {voicePhase && (
        <div className={`voice-status ${voicePhase}`}>
          <span className="voice-dot" />
          <span>
            {voicePhase === 'listening' && '🎤 Listening… Speak your question.'}
            {voicePhase === 'thinking' && '🧠 Generating reply…'}
            {voicePhase === 'ready' && '✅ Reply is ready! See below.'}
          </span>
        </div>
      )}

      {/* ── Stage Tabs ──────────────────────────────────────── */}
      <div className="stage-tabs">
        {STAGES.map((s) => (
          <button
            key={s.number}
            className={`stage-tab ${s.number === currentStage ? 'active' : s.number < currentStage ? 'done' : ''}`}
            onClick={() => { if (s.number < currentStage) { setCurrentStage(s.number); setAiReply(null); } }}
            title={s.name} id={`stage-tab-${s.number}`}
          >
            {s.number}
          </button>
        ))}
      </div>

      {/* ── Stage Body ──────────────────────────────────────── */}
      <div className="stage-body">
        {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="stage-label">Stage {currentStage} of 8</div>
        <h1 className="stage-name">{stage.name}</h1>
        <p className="stage-purpose">{stage.purpose}</p>

        {COACHING_TIPS[currentStage] && (
          <div className="coaching-tip">{COACHING_TIPS[currentStage]}</div>
        )}

        <div className="section-heading">They may say</div>
        <div className="quotes-list">
          {stage.theyMaySay.map((q, i) => <div key={i} className="quote-item">{q}</div>)}
        </div>

        <div className="section-heading">What happened</div>
        <div className="what-happened-grid">
          {stage.whatHappenedOptions.map((opt) => (
            <button key={opt} className={`happened-btn ${selected.includes(opt) ? 'selected' : ''}`}
              onClick={() => toggleOption(opt)} id={`happened-${opt.replace(/\s+/g, '-').toLowerCase()}`}>
              {opt}
            </button>
          ))}
        </div>

        {/* ══════ CUSTOMER'S QUESTION ══════ */}
        <div className="their-words-section">
          <div className="section-heading">🎤 Customer's Question</div>
          <textarea
            className="their-words-textarea"
            placeholder="Type the customer's question here, or click 'Listen & Get Reply' above to use voice…"
            value={prospectWords}
            onChange={(e) => { setProspectWords(e.target.value); setAiReply(null); }}
            id="their-words-input"
            rows={3}
          />
          {/* Manual "Get Reply" button */}
          <button
            onClick={handleGetReply}
            disabled={loadingReply || !prospectWords.trim()}
            id="get-reply-btn"
            style={{
              marginTop: 8, width: '100%', padding: '10px 16px',
              background: loadingReply ? '#9ca3af' : '#1a00ff',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: loadingReply ? 'wait' : 'pointer',
              fontFamily: 'var(--font)', transition: 'background .15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loadingReply ? (
              <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating Reply…</>
            ) : (
              <>🤖 Get AI Reply</>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            ██  AI REPLY BOX — THE MAIN ANSWER  ██
            ══════════════════════════════════════════════════════ */}
        {aiReply && (
          <div className="ai-reply-box" id="ai-reply-box">
            {/* Header with intent badge */}
            <div className="ai-reply-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>AI Reply</span>
              </div>
              {intentCfg && (
                <span style={{
                  padding: '3px 10px', borderRadius: 16,
                  background: intentCfg.bg, border: `1px solid ${intentCfg.border}`,
                  color: intentCfg.color, fontSize: 11, fontWeight: 700,
                }}>
                  {intentCfg.emoji} {aiReply.intent_label}
                </span>
              )}
            </div>

            {/* THE REPLY TEXT */}
            <div className="ai-reply-text">
              {aiReply.reply}
            </div>

            {/* Action buttons: Copy and Speak */}
            <div className="ai-reply-actions">
              <button onClick={copyReply} className="ai-reply-btn" id="copy-reply-btn">
                {replyCopied ? '✅ Copied!' : '📋 Copy Reply'}
              </button>
              <button onClick={() => speakText(aiReply.reply)} className="ai-reply-btn ai-reply-btn-speak" id="speak-reply-btn">
                🔊 Speak Reply
              </button>
            </div>

            {/* Coaching tip (small, for the salesperson only) */}
            {aiReply.tip && (
              <div className="ai-reply-tip">
                💡 <strong>Tip for you:</strong> {aiReply.tip}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      {/* ── Action Bar ──────────────────────────────────────── */}
      <div className="action-bar">
        <button className="btn-next" onClick={handleNext} disabled={saving} id="next-stage-btn">
          {saving ? 'Saving…' : currentStage < 8 ? `Next: ${nextStage?.name}` : 'Finish call'}
        </button>
        <button className="btn-end" onClick={() => setShowEndModal(true)} id="end-call-btn">End call</button>
      </div>

      {/* ── End Call Modal ──────────────────────────────────── */}
      {showEndModal && (
        <div className="modal-overlay" onClick={() => setShowEndModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">End call</div>
            <div className="modal-subtitle">Ending at stage {currentStage} – {stage.name}</div>
            <select className="modal-select" value={outcome} onChange={(e) => setOutcome(e.target.value)} id="outcome-select">
              {OUTCOME_OPTIONS.map((o) => <option key={o} value={o}>{OUTCOME_LABELS[o] || o}</option>)}
            </select>
            <div className="modal-btn-row">
              <button className="btn-cancel" onClick={() => setShowEndModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleClose} disabled={closing} id="save-close-btn">
                {closing ? 'Saving…' : 'Save & close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
