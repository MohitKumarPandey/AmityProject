import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';

const GoogleSignInSection: React.FC = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const { loginWithGoogle } = useAuth();
  const [authError, setAuthError] = useState('');

  if (!clientId || clientId === 'UNCONFIGURED') {
    return (
      <div style={{
        background: 'var(--bg-main)',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Google OAuth Not Configured
        </div>
        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          Set VITE_GOOGLE_CLIENT_ID in your environment to enable single sign-on.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {authError && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {authError}
        </div>
      )}
      <GoogleLogin
        onSuccess={credentialResponse => {
          if (credentialResponse.credential) {
            loginWithGoogle(credentialResponse.credential).catch(err => {
              setAuthError(err?.response?.data?.detail || "Google authentication failed on server.");
            });
          }
        }}
        onError={() => {
          setAuthError('Google sign-in popup was cancelled or failed.');
        }}
        theme="outline"
        size="large"
        width="100%"
        shape="rectangular"
      />
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* LEFT SIDE BRANDING */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        background: '#FFFFFF',
        borderRight: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="sidebar-logo-icon" style={{ width: 56, height: 56, marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
            CityPulse
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem' }}>
            Civic Intelligence for a Living City
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Monitor environmental conditions, civic events, anomalies, and disaster alerts from one intelligent dashboard.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>✓ Live Civic Data</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Real-time telemetry feeds</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>✓ Environmental AI</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>ML anomaly detection</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>✓ Disaster Awareness</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Geospatial alert engine</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>✓ Community Input</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Human-in-the-loop ML</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 700 }}>Welcome back</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Sign in to your CityPulse account</p>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #FCA5A5', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@citypulse.gov"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <a href="#" style={{ color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }} onClick={e => { e.preventDefault(); setError('Password reset is not configured in this environment.'); }}>
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <GoogleSignInSection />

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
