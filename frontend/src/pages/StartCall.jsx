import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function StartCall() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prospect_name: '',
    prospect_role: '',
    prospect_company: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleStart(e) {
    e.preventDefault();
    if (!form.prospect_name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const call = await api.startCall(
        form.prospect_name.trim(),
        form.prospect_role.trim(),
        form.prospect_company.trim()
      );
      navigate(`/call/${call.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <span className="topbar-brand">Meridian · Call Guide</span>
      </div>

      <form className="start-call-body" onSubmit={handleStart}>
        <div>
          <Link to="/" className="btn-back" style={{ display: 'inline-flex' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>
          <h1 className="start-call-heading" style={{ marginTop: 12 }}>New call</h1>
          <p className="start-call-sub">Fill in the prospect's details to start tracking the call.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="prospect_name">Name *</label>
          <input
            id="prospect_name"
            name="prospect_name"
            type="text"
            className="form-input"
            placeholder="e.g. Rakesh Mehta"
            value={form.prospect_name}
            onChange={handleChange}
            autoFocus
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="prospect_role">Role</label>
          <input
            id="prospect_role"
            name="prospect_role"
            type="text"
            className="form-input"
            placeholder="e.g. CEO, Director, Co-Founder"
            value={form.prospect_role}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="prospect_company">Company</label>
          <input
            id="prospect_company"
            name="prospect_company"
            type="text"
            className="form-input"
            placeholder="e.g. Apex Industries"
            value={form.prospect_company}
            onChange={handleChange}
          />
          <span className="form-hint">Leave blank if unknown — you can update after the call.</span>
        </div>

        <button
          type="submit"
          className="btn-start"
          disabled={loading || !form.prospect_name.trim()}
          id="start-call-btn"
        >
          {loading ? 'Starting…' : 'Start call'}
        </button>
      </form>
    </div>
  );
}
