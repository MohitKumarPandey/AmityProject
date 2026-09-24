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

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName);
      navigate('/');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Signup failed. Please check your details.');
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
            Join the Civic Intelligence Network
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Get personalized disaster alerts, access predictive environmental telemetry, and submit ground-truth feedback.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
              ✓ Real-time environmental tracking across 5+ major cities
            </div>
            <div style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
              ✓ Automated disaster awareness & proximity alerts
            </div>
            <div style={{ padding: '0.85rem 1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
              ✓ Human-in-the-loop feature validation for ML models
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 700 }}>Create account</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Sign up to access your civic intelligence dashboard</p>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #FCA5A5', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Jane Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
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
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <GoogleSignInSection />

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
