import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { STAGES, OUTCOME_LABELS } from '../stages';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffMins = Math.floor((now - d) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `Today ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getStagePillClass(call) {
  if (!call.closed_at) return '';
  if (call.current_stage >= 7) return 'closed';
  if (call.current_stage <= 2) return 'early';
  return '';
}

export default function History() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.listCalls()
      .then(setCalls)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = calls.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.prospect_name?.toLowerCase().includes(q) ||
      c.prospect_company?.toLowerCase().includes(q) ||
      c.prospect_role?.toLowerCase().includes(q) ||
      (OUTCOME_LABELS[c.outcome] || c.outcome || '').toLowerCase().includes(q)
    );
  });

  // Quick stats
  const total = calls.length;
  const closed = calls.filter((c) => c.closed_at).length;
  const won = calls.filter((c) => c.outcome === 'booked' || c.outcome === 'meeting_booked').length;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Loading calls…
      </div>
    );
  }

  return (
    <div className="page">
      {/* Top Bar */}
      <div className="history-topbar">
        <span className="history-title">Meridian · Call Guide</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/analytics" className="btn-analytics" id="analytics-btn">
            📊 Analytics
          </Link>
          <Link to="/new" className="btn-new-call">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New call
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      {total > 0 && (
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Calls</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{closed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#16a34a' }}>{won}</div>
            <div className="stat-label">Booked</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{closed > 0 ? Math.round((won / closed) * 100) : 0}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {total > 0 && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="search-input"
              type="text"
              placeholder="Search by name, company, role, or outcome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 34px',
                border: '1.5px solid #e5e7eb', borderRadius: 8,
                fontSize: 14, fontFamily: 'var(--font)', outline: 'none',
                background: '#f9fafb', color: '#111827',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}>×</button>
            )}
          </div>
        </div>
      )}

      {error && <div className="error-banner">Could not load calls: {error}</div>}

      <div className="call-list">
        {filtered.length === 0 && !error ? (
          <div className="call-list-empty">
            {search ? (
              <>
                <h2>No results for "{search}"</h2>
                <p>Try a different name, company, or outcome.</p>
              </>
            ) : (
              <>
                <h2>No calls yet</h2>
                <p>Start your first call to see it here.</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((call) => {
            const stageName = call.current_stage ? STAGES[call.current_stage - 1]?.name : 'Opening';
            const outcome = OUTCOME_LABELS[call.outcome] || call.outcome || '';
            const pillClass = getStagePillClass(call);
            return (
              <Link
                key={call.id}
                to={call.closed_at ? `/call/${call.id}/review` : `/call/${call.id}`}
                className="call-card"
              >
                <div className="call-card-left">
                  <div className="call-card-name">{call.prospect_name}</div>
                  <div className="call-card-meta">
                    {[call.prospect_role, call.prospect_company].filter(Boolean).join(' · ')}
                  </div>
                  {outcome && <div className="call-card-outcome">{outcome}</div>}
                </div>
                <div className="call-card-right">
                  <span className="call-card-time">{formatTime(call.started_at)}</span>
                  <span className={`stage-pill ${pillClass}`}>{stageName}</span>
                  {!call.closed_at && (
                    <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>● Live</span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
