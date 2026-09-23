import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branchId, setBranchId] = useState('none');
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load branches for the dropdown
  useEffect(() => {
    authAPI.getBranches()
      .then(r => setBranches(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBranches([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(name, password, branchId !== 'none' ? branchId : null);
      navigate(['cashier', 'waiter', 'sales'].includes(user.role) ? '/billing' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally { setLoading(false); }
  };

  const inputStyle = (field) => ({
    width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 14,
    border: `1.5px solid ${focusField === field ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, outline: 'none', color: '#F8FAFC',
    background: 'rgba(255,255,255,0.05)', transition: 'border-color 0.2s',
    fontWeight: 500, letterSpacing: 0.5,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 10%, #0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: 20 }}>
      <style>{`input::-ms-reveal,input::-ms-clear{display:none!important}input::-webkit-credentials-auto-fill-button{display:none!important}`}</style>
      {/* Subtle background pattern */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(37,99,235,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(22,163,74,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />

      <div style={{ width: 400, maxWidth: '100%', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #2563EB, #3B82F6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 8px 32px rgba(37,99,235,0.3)', marginBottom: 16 }}>🍽️</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#F8FAFC', letterSpacing: -0.5 }}>RestoPOS</div>
          <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', marginTop: 4 }}>Restaurant Point of Sale</div>
        </div>

        {/* Login Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <div style={{ padding: '32px 32px 28px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Welcome back</div>
            <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginBottom: 24 }}>Sign in to continue</div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>⚠</span>{error}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete='off'>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</label>
                <input value={name} onChange={e => setName(e.target.value.toUpperCase())} required autoFocus
                  autoComplete='new-password'
                  placeholder='Enter username'
                  onFocus={() => setFocusField('name')} onBlur={() => setFocusField(null)}
                  style={inputStyle('name')} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    autoComplete='new-password'
                    placeholder='Enter password'
                    onFocus={() => setFocusField('pass')} onBlur={() => setFocusField(null)}
                    style={{ ...inputStyle('pass'), paddingRight: 44 }} />
                  <button type='button' onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: showPassword ? '#3B82F6' : 'rgba(148,163,184,0.5)',
                      transition: 'color 0.2s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = '#3B82F6')}
                    onMouseOut={e => (e.currentTarget.style.color = showPassword ? '#3B82F6' : 'rgba(148,163,184,0.5)')}
                  >
                    {showPassword ? (
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                        <circle cx='12' cy='12' r='3' />
                      </svg>
                    ) : (
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' />
                        <path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' />
                        <path d='M14.12 14.12a3 3 0 1 1-4.24-4.24' />
                        <line x1='1' y1='1' x2='23' y2='23' />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Branch Dropdown — always visible, non-mandatory */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Branch <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(148,163,184,0.5)' }}>(optional)</span>
                </label>
                <select
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  onFocus={() => setFocusField('branch')} onBlur={() => setFocusField(null)}
                  style={{
                    ...inputStyle('branch'),
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: 36,
                  }}
                >
                  <option value='none' style={{ background: '#1E293B', color: '#F8FAFC' }}>None</option>
                  {Array.isArray(branches) && branches.map(b => (
                    <option key={b._id} value={b._id} style={{ background: '#1E293B', color: '#F8FAFC' }}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type='submit' disabled={loading}
                style={{ width: '100%', padding: '13px', background: loading ? '#1D4ED8' : 'linear-gradient(135deg, #2563EB, #3B82F6)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(37,99,235,0.3)', letterSpacing: 0.3 }}
                onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>
          RestoPOS v2.0 © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
