import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { STAGES, OUTCOME_LABELS } from '../stages';

function formatDateTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(start, end) {
  if (!start || !end) return '';
  const secs = Math.round((new Date(end) - new Date(start)) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function ScoreCircle({ score }) {
  const grade = score >= 9 ? 'A' : score >= 7 ? 'B' : score >= 5 ? 'C' : score >= 3 ? 'D' : 'F';
  const color = score >= 7 ? '#16a34a' : score >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{
      width: 72, height: 72, borderRadius: '50%',
      border: `4px solid ${color}`, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{grade}</span>
    </div>
  );
}

export default function CallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [email, setEmail] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const [score, setScore] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  useEffect(() => {
    api.getCall(id)
      .then(setCall)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function loadSummary() {
    if (!call) return;
    setSummaryLoading(true);
    try {
      const result = await api.summariseCall(call.prospect_name, call.prospect_company, call.stages, call.outcome);
      setAiSummary(result.summary);
    } catch {
      setAiSummary('Could not generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadEmail() {
    if (!call) return;
    setEmailLoading(true);
    try {
      const result = await api.followUpEmail(call.prospect_name, call.prospect_role, call.prospect_company, call.stages, call.outcome);
      setEmail(result);
    } catch {
      setEmail({ subject: 'Error', body: 'Could not generate email.' });
    } finally {
      setEmailLoading(false);
    }
  }

  async function loadScore() {
    if (!call) return;
    setScoreLoading(true);
    try {
      const result = await api.scoreCall(call.prospect_name, call.stages, call.outcome, call.current_stage);
      setScore(result);
    } catch {
      setScore(null);
    } finally {
      setScoreLoading(false);
    }
  }

  function copyEmail() {
    if (!email) return;
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Loading call…
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="loading-screen">
        <p style={{ color: '#ef4444' }}>{error || 'Call not found'}</p>
        <button onClick={() => navigate('/')} style={{ marginTop: 8, cursor: 'pointer', padding: '8px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}>
          Go back
        </button>
      </div>
    );
  }

  const stageName = call.current_stage ? STAGES[call.current_stage - 1]?.name : '—';

  return (
    <div className="page">
      {/* Top Bar */}
      <div className="topbar">
        <Link to="/" className="btn-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All calls
        </Link>
        <span className="topbar-brand">Call review</span>
      </div>

      {/* Prospect header */}
      <div className="prospect-header">
        <div className="prospect-name">{call.prospect_name}</div>
        <div className="prospect-meta">
          {[call.prospect_role, call.prospect_company].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div className="detail-body">
        {/* Call meta */}
        <div className="detail-section">
          <div className="detail-section-title">Call details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', fontSize: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 2 }}>Started</div>
              <div>{formatDateTime(call.started_at)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 2 }}>Duration</div>
              <div>{formatDuration(call.started_at, call.closed_at) || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 2 }}>Last stage</div>
              <div>{stageName}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 2 }}>Outcome</div>
              <div>{OUTCOME_LABELS[call.outcome] || call.outcome || '—'}</div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="detail-section">
          <div className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>AI summary</span>
            <button onClick={loadSummary} disabled={summaryLoading} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }} id="generate-summary-btn">
              {summaryLoading ? '…' : 'Generate'}
            </button>
          </div>
          {aiSummary ? (
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{aiSummary}</p>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tap Generate to get a Gemini summary of this call.</p>
          )}
        </div>

        {/* 🏆 Call Score */}
        <div className="detail-section">
          <div className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🏆 Call score</span>
            <button onClick={loadScore} disabled={scoreLoading} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }} id="score-call-btn">
              {scoreLoading ? '…' : 'Score Call'}
            </button>
          </div>
          {score ? (
            <div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
                <ScoreCircle score={score.score} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 8, fontStyle: 'italic', color: '#374151' }}>"{score.verdict}"</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>✅ Strengths</div>
                  {(score.strengths || []).map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 3 }}>· {s}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>⚠️ Improve</div>
                  {(score.improvements || []).map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 3 }}>· {s}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tap "Score Call" to get AI feedback on your performance.</p>
          )}
        </div>

        {/* 📄 Follow-Up Email */}
        <div className="detail-section">
          <div className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📄 Follow-up email</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {email && (
                <button onClick={copyEmail} style={{ background: emailCopied ? '#16a34a' : '#f3f4f6', color: emailCopied ? '#fff' : '#374151', border: '1px solid #e5e7eb', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                  {emailCopied ? '✓ Copied!' : 'Copy'}
                </button>
              )}
              <button onClick={loadEmail} disabled={emailLoading} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }} id="follow-up-email-btn">
                {emailLoading ? '…' : email ? 'Regenerate' : 'Generate'}
              </button>
            </div>
          </div>
          {email ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Subject:</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#111827' }}>{email.subject}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Body:</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap', background: '#f9fafb', padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                {email.body}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tap "Generate" to auto-write a professional follow-up email based on this call.</p>
          )}
        </div>

        {/* Stages */}
        {call.stages && call.stages.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Stages logged</div>
            {call.stages.map((s) => {
              const stageDef = STAGES[s.stage_number - 1];
              return (
                <div className="detail-stage-row" key={s.stage_number}>
                  <div className="detail-stage-num">{s.stage_number}</div>
                  <div className="detail-stage-content">
                    <div className="detail-stage-name">{stageDef?.name || `Stage ${s.stage_number}`}</div>
                    {s.what_happened && s.what_happened.length > 0 && (
                      <div className="detail-stage-happened">{s.what_happened.join(' · ')}</div>
                    )}
                    {s.prospect_words && (
                      <div className="detail-stage-words">"{s.prospect_words}"</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
