import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { STAGES, OUTCOME_LABELS } from '../stages';

function formatDuration(start, end) {
  if (!start || !end) return null;
  const secs = Math.round((new Date(end) - new Date(start)) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function Bar({ value, max, color = '#1a00ff' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', minWidth: 24, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function Analytics() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listCalls()
      .then(setCalls)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Loading analytics…
      </div>
    );
  }

  const total = calls.length;
  const closed = calls.filter((c) => c.closed_at);
  const open = calls.filter((c) => !c.closed_at);
  const won = closed.filter((c) => c.outcome === 'booked' || c.outcome === 'meeting_booked');
  const winRate = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;

  // Average duration of closed calls
  const durations = closed.map((c) => (new Date(c.closed_at) - new Date(c.started_at)) / 1000).filter((d) => d > 0);
  const avgSecs = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const avgDur = avgSecs > 0 ? `${Math.floor(avgSecs / 60)}m ${avgSecs % 60}s` : '—';

  // Stage reach counts
  const stageReach = Array.from({ length: 8 }, (_, i) => calls.filter((c) => c.current_stage >= i + 1).length);

  // Outcome breakdown
  const outcomeCounts = {};
  closed.forEach((c) => {
    const label = OUTCOME_LABELS[c.outcome] || c.outcome || 'Unknown';
    outcomeCounts[label] = (outcomeCounts[label] || 0) + 1;
  });
  const maxOutcome = Math.max(...Object.values(outcomeCounts), 1);

  // Average stage reached (closed calls)
  const avgStage = closed.length > 0
    ? (closed.reduce((a, c) => a + (c.current_stage || 1), 0) / closed.length).toFixed(1)
    : '—';

  return (
    <div className="page">
      {/* Top Bar */}
      <div className="history-topbar">
        <Link to="/" className="btn-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        <span className="history-title">📊 Analytics</span>
        <div />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-body">
        {total === 0 ? (
          <div className="call-list-empty">
            <h2>No data yet</h2>
            <p>Complete some calls to see analytics here.</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Total Calls', value: total, color: '#1a00ff' },
                { label: 'Completed', value: closed.length, color: '#374151' },
                { label: '🟢 Booked', value: won.length, color: '#16a34a' },
                { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 30 ? '#16a34a' : '#f59e0b' },
                { label: 'Avg Stage Reached', value: avgStage, color: '#374151' },
                { label: 'Avg Duration', value: avgDur, color: '#374151' },
              ].map(({ label, value, color }) => (
                <div key={label} className="detail-section" style={{ marginBottom: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Stage Funnel */}
            <div className="detail-section">
              <div className="detail-section-title">Stage funnel — how far calls progress</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STAGES.map((s, i) => (
                  <div key={s.number}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 3 }}>
                      <span><strong style={{ color: '#111827' }}>S{s.number}</strong> {s.name}</span>
                      <span style={{ color: '#374151' }}>{Math.round((stageReach[i] / (total || 1)) * 100)}%</span>
                    </div>
                    <Bar value={stageReach[i]} max={total} color={i < 3 ? '#60a5fa' : i < 6 ? '#1a00ff' : '#7c3aed'} />
                  </div>
                ))}
              </div>
            </div>

            {/* Outcome Breakdown */}
            {Object.keys(outcomeCounts).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">Outcome breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(outcomeCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
                    <div key={label}>
                      <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{label}</div>
                      <Bar value={count} max={maxOutcome} color="#1a00ff" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open vs Closed */}
            <div className="detail-section">
              <div className="detail-section-title">Open vs closed calls</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0369a1' }}>{open.length}</div>
                  <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>In Progress</div>
                </div>
                <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{closed.length}</div>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Completed</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
