import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, billsAPI } from '../services/api';
import { C } from '../utils/theme';
import { Spinner } from '../components/common/UI';

const fm = (v) => `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fn = (v) => (v || 0).toLocaleString('en-IN');

// ── Clickable stat card ───────────────────────────────────────
function StatCard({ label, value, icon, color, bg, onClick, badge }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)}
      style={{ background: hover && onClick ? bg : '#fff', border: `1.5px solid ${hover && onClick ? color : C.border}`, borderRadius: 14, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.18s', boxShadow: hover && onClick ? `0 4px 16px ${color}30` : '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
          {badge && <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 1 }}>{badge}</div>}
        </div>
        {onClick && <div style={{ color: C.textLight, fontSize: 16, flexShrink: 0, transition: 'transform 0.15s', transform: hover ? 'translateX(3px)' : 'none' }}>›</div>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign: 'center', padding: '30px 0', color: C.textLight, fontSize: 14 }}>No sales data for last 7 days. Create some bills!</div>
  );
  const max = Math.max(...data.map(d => d.sales || 0), 1);
  const total = data.reduce((s, d) => s + (d.sales || 0), 0);
  const avg = total / data.length;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, padding: '0 4px', marginBottom: 12 }}>
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          const h = Math.max(8, ((d.sales || 0) / max) * 120);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>₹{Math.round(d.sales || 0).toLocaleString('en-IN')}</div>
              <div style={{ width: '100%', maxWidth: 60, height: h, background: isToday ? `linear-gradient(180deg, ${C.success}, ${C.success}88)` : `linear-gradient(180deg, ${C.primary}, ${C.primary}88)`, borderRadius: '6px 6px 0 0', opacity: 1, transition: 'height 0.5s', boxShadow: `0 2px 8px ${isToday ? C.success : C.primary}30` }} />
              <div style={{ fontSize: 11, color: isToday ? C.success : C.textMuted, fontWeight: isToday ? 700 : 500, textAlign: 'center' }}>
                {String(d._id || '').replace(/^\d{4}-/, '').slice(0, 5)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 20, fontSize: 13, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
        <span>Total: <strong style={{ color: C.primary }}>{fm(total)}</strong></span>
        <span>Avg/day: <strong style={{ color: C.secondary }}>{fm(avg)}</strong></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 12, color: C.textMuted }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: C.success, borderRadius: 2, marginRight: 4 }} />Today</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: C.primary, borderRadius: 2, marginRight: 4, opacity: 0.65 }} />Other days</span>
        </div>
      </div>
    </div>
  );
}

// ── Payment progress bars ─────────────────────────────────────
function PaymentBars({ data }) {
  const total = data.reduce((s, d) => s + (d.amount || 0), 0);
  const ICONS = { Cash: '💵', UPI: '📱', Card: '💳' };
  const COLORS = { Cash: C.success, UPI: C.primary, Card: '#6A1B9A' };
  return (
    <div>
      {data.map((d, i) => {
        const pct = total > 0 ? (d.amount || 0) / total * 100 : 0;
        const c = COLORS[d._id] || C.textMuted;
        return (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 14 }}>
              <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{ICONS[d._id] || '💰'} {d._id}</span>
              <span style={{ fontWeight: 800, color: c }}>{fm(d.amount)} <span style={{ color: C.textMuted, fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
            </div>
            <div style={{ height: 10, background: C.surfaceAlt, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 5, transition: 'width 0.6s' }} />
            </div>
          </div>
        );
      })}
      {!total && <div style={{ textAlign: 'center', padding: 14, color: C.textLight, fontSize: 13 }}>No payments today</div>}
      <div style={{ marginTop: 10, padding: '10px 14px', background: C.primaryBg, borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: C.textMuted }}>Total Collected</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: C.primary }}>{fm(total)}</span>
      </div>
    </div>
  );
}

// ── Bill Detail Drawer ────────────────────────────────────────
function BillsDrawer({ title, filter, onClose }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    billsAPI.getAll(filter).then(r => { setBills(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 2000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, height: '100vh', background: '#fff', boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e' }}>{title}</span>
            {filter?.isDuplicated === 'true' && (
              <button
                onClick={() => {
                  setLoading(true);
                  billsAPI.getAll({ isDuplicated: 'true' }).then(r => {
                    setBills(r.data);
                    setLoading(false);
                  }).catch(() => setLoading(false));
                }}
                style={{ padding: '6px 12px', background: C.primary, color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                View All Time
              </button>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textMuted }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? <Spinner /> : !bills.length ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textLight, fontSize: 14 }}>No bills found</div>
          ) : bills.map((b, i) => (
            <div key={b._id} style={{ padding: '14px 16px', border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 10, background: i % 2 === 0 ? '#fff' : C.surfaceAlt }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>{b.billNo}</span>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 100, background: b.status === 'cancelled' ? C.dangerBg : b.isEdited ? C.warningBg : C.successBg, color: b.status === 'cancelled' ? C.danger : b.isEdited ? C.warning : C.success, fontWeight: 700 }}>
                  {b.status === 'cancelled' ? 'Cancelled' : b.isEdited ? 'Edited' : 'Billed'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 13 }}>
                <span style={{ color: C.textMuted }}>Table: <strong style={{ color: '#1a1a2e' }}>{b.table || '—'}</strong></span>
                <span style={{ color: C.textMuted }}>Waiter: <strong style={{ color: '#1a1a2e' }}>{b.waiter || '—'}</strong></span>
                <span style={{ color: C.textMuted }}>Mode: <strong style={{ color: '#1a1a2e' }}>{b.paymentMode}</strong></span>
                <span style={{ color: C.textMuted }}>Items: <strong style={{ color: '#1a1a2e' }}>{b.items?.length || 0}</strong></span>
                <span style={{ color: C.textMuted }}>Subtotal: <strong style={{ color: '#1a1a2e' }}>{fm(b.subtotal)}</strong></span>
                <span style={{ color: C.textMuted }}>NET: <strong style={{ color: C.success, fontSize: 14 }}>{fm(b.netAmount)}</strong></span>
              </div>
              {b.cancelReason && <div style={{ marginTop: 6, fontSize: 12, color: C.danger }}>Reason: {b.cancelReason}</div>}
              {b.isEdited && b.editHistory?.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: C.warning }}>
                  Edited {b.editHistory.length}× — last by {b.editHistory[b.editHistory.length - 1]?.editedBy}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => setExpandedId(expandedId === b._id ? null : b._id)}
                  style={{ flex: 1, padding: '8px', background: C.primaryBg, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {expandedId === b._id ? '👀 Hide Details' : '📋 View Details'}
                </button>
              </div>

              {expandedId === b._id && (
                <div style={{ marginTop: 10, padding: 12, background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: C.text }}>Bill Details</div>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 8 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ textAlign: 'left', padding: '4px 0', color: C.textMuted }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '4px 0', color: C.textMuted }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '4px 0', color: C.textMuted }}>Rate</th>
                        <th style={{ textAlign: 'right', padding: '4px 0', color: C.textMuted }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(b.items || []).map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px dashed ${C.border}` }}>
                          <td style={{ padding: '6px 0', fontWeight: 600 }}>{it.productName}</td>
                          <td style={{ textAlign: 'center', padding: '6px 0' }}>{it.qty}</td>
                          <td style={{ textAlign: 'right', padding: '6px 0' }}>₹{it.rate}</td>
                          <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 700 }}>₹{it.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ textAlign: 'right', fontSize: 12, color: C.textMuted }}>Subtotal: ₹{b.subtotal?.toFixed(2)}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: C.textMuted }}>GST: ₹{((b.cgstTotal || 0) + (b.sgstTotal || 0)).toFixed(2)}</div>
                  {b.discount > 0 && <div style={{ textAlign: 'right', fontSize: 12, color: C.warning }}>Discount: -₹{b.discount?.toFixed(2)}</div>}
                  <div style={{ textAlign: 'right', marginTop: 4, fontWeight: 900, fontSize: 14, color: C.primary }}>Net Total: ₹{b.netAmount?.toFixed(2)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null); // { title, filter }
  const [showOnlineComingSoon, setShowOnlineComingSoon] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    reportsAPI.dashboard().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ padding: 60 }}><Spinner /></div>;

  const d = data || {};
  const ts = d.todaySales || {};
  const chart = d.chart || [];
  const payment = d.paymentBreakdown || [];
  const online = d.onlineSales || [];
  const disc = d.discountToday || { count: 0 };
  const _totalDiscountAmount = (disc.dSum || 0) + (disc.rSum || 0) + (disc.totalDiscount || 0);
  const canc = d.cancelledToday || { count: 0 };
  const edit = d.editedToday || { count: 0 };
  const dupl = d.duplicatedToday || { count: 0 };
  
  const past7Days = Array.from({length: 7}).map((_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - (6 - i));
    const localDt = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return localDt.toISOString().slice(0, 10);
  });
  
  const chartPadded = past7Days.map(date => {
    return chart.find(c => c._id === date) || { _id: date, sales: 0, count: 0 };
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', boxSizing: 'border-box', background: C.bg, fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {drawer && <BillsDrawer title={drawer.title} filter={drawer.filter} onClose={() => setDrawer(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#1a1a2e' }}>📈 Dashboard</div>
          <div style={{ fontSize: 14, color: C.textMuted }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ padding: '10px 18px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, color: C.textMuted, fontWeight: 600 }}>🔄 Refresh</button>
          <button onClick={() => navigate('/billing')} style={{ padding: '10px 22px', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>➕ New Bill</button>
        </div>
      </div>

      {/* Stat Cards — all clickable → drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Today's Sales" value={fm(ts.total)} icon='💰' color={C.success} bg={C.successBg}
          onClick={() => setDrawer({ title: "Today's Bills", filter: { today: 'true', status: 'billed' } })} badge={`${ts.count || 0} bills`} />
        <StatCard label="Bills Today" value={fn(ts.count)} icon='🧾' color={C.primary} bg={C.primaryBg}
          onClick={() => setDrawer({ title: 'All Bills Today', filter: { today: 'true' } })} />
        <StatCard label="Running Bills" value={fn(d.runningBills)} icon='⏳' color={C.warning} bg={C.warningBg}
          onClick={() => setDrawer({ title: 'Running Bills (KOT Saved)', filter: { status: 'kot_saved' } })} />
        <StatCard label={`Prebook (${d.prebookToday?.count || 0})`} value={fn(d.prebookToday?.count || 0)} icon='📅' color='#6A1B9A' bg='#F3E5F5'
          onClick={() => setDrawer({ title: 'Prebookings Today', filter: { today: 'true', billType: 'prebooking' } })} />
        <StatCard label="GST Today" value={fm((ts.cgst || 0) + (ts.sgst || 0))} icon='🏷️' color='#6A1B9A' bg='#F3E5F5' />
        <StatCard label={`Discounts (${disc.count || 0} bills)`} value={fm(_totalDiscountAmount)} icon='🎫' color={C.danger} bg={C.dangerBg}
          onClick={() => setDrawer({ title: 'Bills with Discount Today', filter: { today: 'true', hasDiscount: 'true' } })} />
        <StatCard label={`Cancelled (${canc.count})`} value={fn(canc.count)} icon='🚫' color='#E53935' bg='#FFEBEE'
          onClick={() => setDrawer({ title: 'Cancelled Bills Today', filter: { today: 'true', status: 'cancelled' } })} />
        <StatCard label={`Edited (${edit.count})`} value={fn(edit.count)} icon='✏️' color='#F57C00' bg='#FFF3E0'
          onClick={() => setDrawer({ title: 'Edited Bills Today', filter: { today: 'true', status: 'edited' } })} />
        <StatCard label={`Duplicated (${dupl.count})`} value={fn(dupl.count)} icon='📑' color='#0288D1' bg='#E1F5FE'
          onClick={() => setDrawer({ title: 'Duplicated Bills Today', filter: { today: 'true', isDuplicated: 'true' } })} />
        <StatCard label="All-time Bills" value={fn(d.totalBillsAll)} icon='📊' color={C.secondary} bg={C.secondaryBg}
          onClick={() => navigate('/reports')} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 14 }}>Sales — Last 7 Days</div>
          <BarChart data={chartPadded} />
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 14 }}>Payment Modes Today</div>
          <PaymentBars data={payment} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Online Orders */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 14 }}>Online Orders Today</div>
          {online.length ? online.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < online.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>{o._id === 'zomato' ? '🔴' : o._id === 'swiggy' ? '🟠' : '📦'}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', textTransform: 'capitalize' }}>{o._id || 'Other'}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{o.count} orders</div>
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.primary }}>{fm(o.amount)}</div>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '24px 0', color: C.textLight, fontSize: 14 }}>No online orders today</div>}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Dine-In Bill', icon: '🍽️', path: '/billing', color: C.primary },
              { label: 'Parcel Order', icon: '📦', path: '/billing?type=parcel', color: '#795548' },
              { label: 'Online Order', icon: '📱', path: null, color: '#E53935', comingSoon: true },
              { label: 'Prebooking', icon: '📅', path: '/billing?type=prebooking', color: '#6A1B9A' }

            ].map(a => (
              <button key={a.label} onClick={() => a.comingSoon ? setShowOnlineComingSoon(true) : navigate(a.path)}
                style={{ padding: '14px 10px', background: `${a.color}10`, border: `1.5px solid ${a.color}30`, borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', position: 'relative', opacity: a.comingSoon ? 0.85 : 1 }}
                onMouseOver={e => { e.currentTarget.style.background = `${a.color}20`; e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseOut={e => { e.currentTarget.style.background = `${a.color}10`; e.currentTarget.style.transform = 'scale(1)'; }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{a.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.label}</div>
                {a.comingSoon && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: '#FF9800', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 6, letterSpacing: '0.3px' }}>COMING SOON</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Online Order Coming Soon Modal */}
        {showOnlineComingSoon && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
            onClick={e => e.target === e.currentTarget && setShowOnlineComingSoon(false)}>
            <div style={{ background: '#fff', borderRadius: 20, width: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ background: 'linear-gradient(135deg, #E53935, #FF5722)', padding: '24px 24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>Online Order Integration</div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>Coming Soon!</div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6, marginBottom: 16 }}>
                  Online order integration with popular food delivery platforms is under development.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    { name: 'Zomato', icon: '🔴', color: '#E23744', desc: 'Auto-fetch orders from Zomato' },
                    { name: 'Swiggy', icon: '🟠', color: '#FC8019', desc: 'Auto-fetch orders from Swiggy' },
                  ].map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: `${p.color}08`, border: `1.5px solid ${p.color}25`, borderRadius: 12 }}>
                      <div style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: p.color }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#777' }}>{p.desc}</div>
                      </div>
                      <div style={{ background: `${p.color}15`, color: p.color, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800 }}>PLANNED</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 14px', background: '#FFF3E0', borderRadius: 10, border: '1px solid #FFE0B2', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#E65100', fontWeight: 700 }}>💡 What to expect</div>
                  <div style={{ fontSize: 12, color: '#795548', marginTop: 4, lineHeight: 1.5 }}>
                    Orders from Zomato & Swiggy will be automatically fetched and appear in your billing system for easy management.
                  </div>
                </div>
                <button onClick={() => setShowOnlineComingSoon(false)} style={{ width: '100%', padding: '12px', background: '#E53935', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#C62828'}
                  onMouseOut={e => e.currentTarget.style.background = '#E53935'}>
                  Got it 👍
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
