import { useState, useEffect } from 'react';
import api from '../services/api';
import { C } from '../utils/theme';
import { Spinner } from '../components/common/UI';

export default function DevicesPage() {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/auth/sessions');
      setSessions(r.data);
      setLastRefresh(new Date());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // auto refresh every 30s
    return () => clearInterval(t);
  }, []);

  const ROLE_COLORS = { root:'#7B1FA2', admin:'#1565C0', sales:'#2E7D32' };

  const timeAgo = (d) => {
    if (!d) return 'Never';
    const sec = Math.floor((Date.now() - new Date(d)) / 1000);
    if (sec < 60)  return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
    return `${Math.floor(sec/3600)}h ago`;
  };

  const totalUsageTime = (login, seen) => {
    if (!login || !seen) return '—';
    const sec = Math.floor((new Date(seen) - new Date(login)) / 1000);
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec/60)}m`;
    const h = Math.floor(sec/3600);
    const m = Math.floor((sec%3600)/60);
    return `${h}h ${m}m`;
  };

  return (
    <div style={{ padding:24, overflowY:'auto', height:'100%', boxSizing:'border-box', background:C.bg, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:24, fontWeight:900, color:'#1a1a2e' }}>🖥️ Active Devices / Sessions</div>
          <div style={{ fontSize:13, color:C.textMuted }}>Users active in last 5 minutes · Last updated: {lastRefresh.toLocaleTimeString('en-IN')}</div>
        </div>
        <button onClick={load} style={{ padding:'10px 18px', background:C.primary, color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}>
          🔄 Refresh
        </button>
      </div>

      {/* Count badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:C.primaryBg, border:`1.5px solid ${C.primary}`, borderRadius:12, padding:'10px 18px', marginBottom:20 }}>
        <span style={{ fontSize:28 }}>👥</span>
        <div>
          <div style={{ fontSize:13, color:C.textMuted }}>Active now</div>
          <div style={{ fontSize:24, fontWeight:900, color:C.primary }}>{sessions.length} device{sessions.length!==1?'s':''}</div>
        </div>
      </div>

      {loading ? <Spinner /> : !sessions.length ? (
        <div style={{ textAlign:'center', padding:60, color:C.textLight, fontSize:14 }}>No active sessions found</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:900 }}>
          {sessions.map((s, i) => {
            const rc = ROLE_COLORS[s.role] || C.primary;
            const lastSeenSec = Math.floor((Date.now() - new Date(s.lastSeen)) / 1000);
            const isLive = lastSeenSec < 60;
            return (
              <div key={i} style={{ background:'#fff', border:`1.5px solid ${isLive?C.success:C.border}`, borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:16 }}>
                {/* Avatar */}
                <div style={{ width:52, height:52, borderRadius:14, background:rc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, color:'#fff', fontWeight:900 }}>
                  {s.name?.[0]}
                </div>
                {/* Info */}
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                    <span style={{ fontSize:16, fontWeight:800, color:'#1a1a2e' }}>{s.name}</span>
                    <span style={{ fontSize:11, padding:'2px 9px', background:`${rc}20`, color:rc, borderRadius:100, fontWeight:700, textTransform:'capitalize' }}>{s.role}</span>
                    {isLive && <span style={{ fontSize:11, padding:'2px 9px', background:C.successBg, color:C.success, borderRadius:100, fontWeight:700 }}>● LIVE</span>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, fontSize:12, color:C.textMuted }}>
                    <span>🕐 Last Login: <strong style={{ color:'#1a1a2e' }}>{s.lastLogin ? new Date(s.lastLogin).toLocaleString('en-IN') : '—'}</strong></span>
                    <span>👁 Last Seen: <strong style={{ color:isLive?C.success:'#1a1a2e' }}>{timeAgo(s.lastSeen)}</strong></span>
                    <span>🌐 IP: <strong style={{ color:'#1a1a2e' }}>{s.ipAddress || '—'}</strong></span>
                    <span>⏱ Usage: <strong style={{ color:'#1a1a2e' }}>{totalUsageTime(s.lastLogin, s.lastSeen)}</strong></span>
                  </div>
                  <div style={{ marginTop:6, fontSize:11, color:C.textLight, wordBreak:'break-all' }}>
                    🖥 {s.deviceInfo ? s.deviceInfo.slice(0, 100) + (s.deviceInfo.length > 100 ? '...' : '') : '—'}
                  </div>
                </div>
                {/* Status indicator */}
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:28, marginBottom:4 }}>{isLive ? '🟢' : '🔵'}</div>
                  <div style={{ fontSize:10, color:isLive?C.success:C.textMuted, fontWeight:700 }}>{isLive?'Active':'Recent'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
