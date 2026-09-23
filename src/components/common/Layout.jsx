import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { C } from '../../utils/theme';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
];

function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const { lang: selected, setLang, t } = useLanguage();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code) => {
    setLang(code);
    setOpen(false);
  };

  const current = LANGUAGES.find(l => l.code === selected) || LANGUAGES[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 100,
          border: `1px solid ${open ? C.primary : C.border}`,
          background: open ? C.primaryBg : C.surfaceAlt,
          color: C.text, cursor: 'pointer', fontSize: 11, fontWeight: 600,
          transition: 'all 0.15s',
        }}
        onMouseOver={e => { if (!open) e.currentTarget.style.borderColor = C.primary; }}
        onMouseOut={e => { if (!open) e.currentTarget.style.borderColor = C.border; }}
      >
        <span style={{ fontSize: 14 }}>🌐</span>
        <span>{current.label}</span>
        <span style={{ fontSize: 9, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 160, zIndex: 999, overflow: 'hidden',
          animation: 'fadeInDown 0.15s ease',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('header.selectLanguage')}
          </div>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 12px', border: 'none', cursor: 'pointer',
                background: selected === lang.code ? C.primaryBg : 'transparent',
                color: selected === lang.code ? C.primary : C.text,
                fontSize: 12, fontWeight: selected === lang.code ? 700 : 500,
                transition: 'background 0.1s',
                textAlign: 'left',
              }}
              onMouseOver={e => { if (selected !== lang.code) e.currentTarget.style.background = C.surfaceAlt; }}
              onMouseOut={e => { if (selected !== lang.code) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 15 }}>{lang.flag}</span>
              <span>{lang.label}</span>
              {selected === lang.code && <span style={{ marginLeft: 'auto', fontSize: 13 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ALL_NAV = [
  { path: '/dashboard', icon: '📈', label: 'Dashboard', tKey: 'nav.dashboard', roles: ['root', 'developer', 'admin', 'head', 'branch_admin'] },
  { path: '/open-close-amount', icon: '💰', label: 'Open & Close Amount', tKey: 'nav.openClose', roles: ['root', 'developer', 'admin', 'head', 'branch_admin', 'cashier', 'waiter', 'sales'], altMenuIds: ['open-close', 'opening', 'closing'] },
  { path: '/billing', icon: '🧾', label: 'Billing', tKey: 'nav.billing', roles: ['root', 'developer', 'admin', 'head', 'branch_admin', 'cashier', 'waiter', 'sales'] },
  { path: '/online-orders', icon: '🛵', label: 'Online Orders', tKey: 'nav.onlineOrders', roles: ['root', 'developer', 'admin', 'head', 'branch_admin', 'cashier', 'waiter', 'sales'] },
  { path: '/master', icon: '📋', label: 'Master', tKey: 'nav.master', roles: ['root', 'developer', 'admin', 'head', 'branch_admin'] },
  { path: '/departments', icon: '🏪', label: 'Departments', tKey: 'nav.departments', roles: ['root', 'developer', 'admin', 'head', 'branch_admin'], altMenuIds: ['master-departments'] },
  { path: '/inventory', icon: '📦', label: 'Inventory', tKey: 'nav.inventory', roles: ['root', 'developer', 'admin', 'head', 'branch_admin'], altMenuIds: ['inventory'] },
  { path: '/reports', icon: '📊', label: 'Reports', tKey: 'nav.reports', roles: ['root', 'developer', 'admin', 'head', 'branch_admin', 'sales'] },
  { path: '/options', icon: '⚙️', label: 'Options', tKey: 'nav.options', roles: ['root', 'developer'] },
  { path: '/users', icon: '👥', label: 'Users', tKey: 'nav.users', roles: ['root', 'developer', 'admin', 'head', 'branch_admin'] },
  { path: '/devices', icon: '🖥️', label: 'Devices', tKey: 'nav.devices', roles: ['root', 'developer'] },
];

const ROLE_COLORS = {
  root: '#7C3AED', developer: '#7C3AED', head: '#2563EB', admin: '#2563EB', branch_admin: '#F59E0B',
  sales: '#16A34A', waiter: '#EAB308', cashier: '#06B6D4', dev: '#06B6D4',
};
const ROLE_ICONS = {
  root: '👑', developer: '💻', head: '👑', admin: '🔑', branch_admin: '🏢',
  sales: '💼', waiter: '🍽️', cashier: '💰',
};

export default function Layout() {
  const { user, logout, isRoot, userBranchName, roleLabel } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());

  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isRoot) {
      import('../../services/api').then(({ default: api }) => {
        const fetchSessions = () => api.get('/auth/sessions').then(r => setDeviceCount(r.data.length)).catch(() => { });
        fetchSessions();
        const intv = setInterval(fetchSessions, 15000);
        return () => clearInterval(intv);
      });
    }
  }, [isRoot]);

  const nav = ALL_NAV.filter(n => {
    if (isRoot) return true;
    // Check role-based access
    if (n.roles && !n.roles.includes(user?.role)) return false;
    // Also check menuAccess if available
    const menuId = n.path.substring(1);
    if (user?.menuAccess) {
      if (user.menuAccess.includes('all')) return true;
      if (user.menuAccess.includes(menuId)) return true;
      return (n.altMenuIds || []).some(id => user.menuAccess.includes(id));
    }
    return false;
  });
  const rc = ROLE_COLORS[user?.role] || C.primary;

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: collapsed ? 62 : 200, flexShrink: 0, background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', display: 'flex', flexDirection: 'column', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '18px 0' : '18px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : undefined }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${rc}, ${rc}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: `0 2px 8px ${rc}40` }}>🍽️</div>
          {!collapsed && <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>RestoPOS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>v2.0</div>
          </div>}
        </div>
        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {nav.map(item => (
            <NavLink key={item.path} to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '11px 0' : '11px 18px',
                justifyContent: collapsed ? 'center' : undefined,
                textDecoration: 'none', margin: collapsed ? '2px 0' : '2px 8px',
                background: isActive ? 'rgba(37,99,235,0.15)' : 'transparent',
                color: isActive ? '#60A5FA' : 'rgba(148,163,184,0.85)',
                borderRadius: isActive ? 10 : 10,
                transition: 'all 0.2s', fontSize: 13, fontWeight: isActive ? 700 : 500,
                borderLeft: isActive && !collapsed ? `3px solid #60A5FA` : '3px solid transparent',
              })}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && t(item.tKey)}
            </NavLink>
          ))}

        </nav>
        {/* User + branch + logout */}
        <div style={{ padding: collapsed ? '12px 0' : '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!collapsed && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{t('header.loggedInAs')}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{user?.name}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', background: `${rc}cc`, color: '#fff', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                  {ROLE_ICONS[user?.role] || ''} {roleLabel}
                </span>
                {userBranchName && (
                  <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(99,102,241,0.3)', color: '#A5B4FC', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                    🏢 {userBranchName}
                  </span>
                )}
              </div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ width: '100%', padding: collapsed ? '8px 0' : '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'rgba(148,163,184,0.8)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : undefined, gap: 7, transition: 'background 0.15s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <span>🚪</span>{!collapsed && t('header.logout')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: 48, background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setCollapsed(v => !v)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, transition: 'all 0.15s' }}
            onMouseOver={e => e.currentTarget.style.background = C.surfaceAlt}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            {collapsed ? '▶' : '◀'}
          </button>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.primary, letterSpacing: -0.3 }}>
            {user?.role === 'sales' ? `🧾 ${t('nav.billing')}` : '🍽️ RestoPOS'}
          </div>
          {/* Branch indicator in topbar for branch-locked users */}
          {userBranchName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 100,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              fontSize: 11, fontWeight: 700, color: '#6366F1',
            }}>
              🏢 {userBranchName}
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Language Dropdown */}
            <LanguageDropdown />
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>📅 {time.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>🕐 {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <span style={{ fontSize: 12, padding: '3px 10px', background: C.surfaceAlt, color: C.text, borderRadius: 100, fontWeight: 600, border: `1px solid ${C.border}` }}>{user?.name}</span>
            <span style={{ fontSize: 11, padding: '3px 10px', background: C.successBg, color: C.success, borderRadius: 100, fontWeight: 700 }}>
              {isRoot && deviceCount > 0 ? `● ${deviceCount} ${t('header.devices')}` : `● ${t('header.online')}`}
            </span>
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
