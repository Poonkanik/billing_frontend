import React, { useState, useEffect } from 'react';
import { cashRegisterAPI } from '../services/api';
import { C } from '../utils/theme';
import DenominationCounter, { DENOMINATIONS, fmtMoney } from '../components/cashRegister/DenominationCounter';
import { Spinner } from '../components/common/UI';
import { useNavigate } from 'react-router-dom';

export default function OpeningAmountPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState({ isOpen: false, session: null, liveStats: null });
  const [openingDenoms, setOpeningDenoms] = useState({});
  const [openingNote, setOpeningNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await cashRegisterAPI.getCurrent();
      setSessionState(res.data);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to load register state', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const totalFloat = DENOMINATIONS.reduce((sum, d) => sum + (d * (parseInt(openingDenoms[d], 10) || 0)), 0);

  const handleOpenRegister = async () => {
    setSubmitting(true);
    setMsg({ text: '', type: '' });
    try {
      await cashRegisterAPI.open({
        denominations: openingDenoms,
        note: openingNote,
      });
      setMsg({ text: `Cash Register opened successfully with float of ${fmtMoney(totalFloat)}!`, type: 'success' });
      setOpeningDenoms({});
      setOpeningNote('');
      await fetchSession();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to open register', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Print Opening Slip
  const printOpeningSlip = () => {
    const s = sessionState.session;
    if (!s) return;
    const denomsHtml = (s.openingDenominations || [])
      .filter(d => d.count > 0)
      .map(d => `<tr><td>Rs.${d.denomination} x ${d.count}</td><td style="text-align:right">Rs.${d.amount.toFixed(2)}</td></tr>`)
      .join('');

    const html = `
      <div style="font-family:'Courier New', monospace; font-size:12px; line-height:1.4; color:#000; padding:5px;">
        <div style="text-align:center; font-weight:bold; font-size:14px; border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
          --- SHIFT OPENING SLIP ---<br/>
          <span style="font-size:11px;">RestoPOS Cash Register</span>
        </div>
        <div><strong>Status:</strong> REGISTER OPEN</div>
        <div><strong>Opened:</strong> ${new Date(s.openedAt).toLocaleString('en-IN')}</div>
        <div><strong>Cashier:</strong> ${s.openedByName || 'User'}</div>
        ${s.openingNote ? `<div><strong>Note:</strong> ${s.openingNote}</div>` : ''}
        
        <div style="border-top:1px dashed #000; margin:6px 0;"></div>
        <div style="font-weight:bold; font-size:13px;">TOTAL OPENING FLOAT: Rs.${(s.openingTotal || 0).toFixed(2)}</div>
        
        <div style="border-top:1px dashed #000; margin:6px 0;"></div>
        <div style="font-weight:bold;">DENOMINATION BREAKDOWN:</div>
        <table style="width:100%; font-size:11px; margin-top:4px;">
          ${denomsHtml || '<tr><td colspan="2">No denomination counts</td></tr>'}
        </table>
        
        <div style="border-top:1px dashed #000; margin-top:10px; padding-top:6px; text-align:center; font-size:10px;">
          Printed on ${new Date().toLocaleString('en-IN')}<br/>
          *** SAFE CUSTODY ACKNOWLEDGEMENT ***
        </div>
      </div>
    `;

    if (window.electronAPI?.printReceipt) {
      let printerName = '';
      try {
        const pConf = JSON.parse(localStorage.getItem('printerConfig_sales'));
        if (pConf?.win) printerName = pConf.win;
      } catch (e) { }
      window.electronAPI.printReceipt(html, printerName).catch(console.error);
    } else {
      const win = window.open('', '_blank', 'width=350,height=600');
      win.document.write(`<html><head><title>Opening Slip</title></head><body>${html}</body></html>`);
      win.document.close();
      setTimeout(() => { win.print(); win.close(); }, 400);
    }
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', boxSizing: 'border-box', background: C.bg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>🌅</span>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
              Opening Cash Amount / Shift Float
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
            Count and record starting physical cash in the drawer by currency denominations
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchSession}
            style={{
              padding: '9px 16px', background: '#fff', border: `1.5px solid ${C.border}`,
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.text, cursor: 'pointer'
            }}
          >
            🔄 Refresh Status
          </button>
          <button
            onClick={() => navigate('/closing')}
            style={{
              padding: '9px 16px', background: C.surfaceAlt, border: `1.5px solid ${C.border}`,
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.text, cursor: 'pointer'
            }}
          >
            🌙 Go to Closing Amount →
          </button>
        </div>
      </div>

      {/* Notifications */}
      {msg.text && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 20, fontSize: 13, fontWeight: 700,
          background: msg.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          color: msg.type === 'error' ? '#DC2626' : '#16A34A',
          border: `1.5px solid ${msg.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{msg.type === 'error' ? '⚠️' : '✅'} {msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spinner />
          <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>Loading cash register state...</div>
        </div>
      ) : sessionState.isOpen ? (
        /* REGISTER IS ALREADY OPEN SCREEN */
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Active Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)', color: '#fff',
            borderRadius: 16, padding: '22px 28px', boxShadow: '0 10px 25px -5px rgba(22, 101, 52, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
              }}>
                🟢
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>
                  Shift Register is Active & Open
                </div>
                <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                  Opened by <strong>{sessionState.session?.openedByName}</strong> at {new Date(sessionState.session?.openedAt).toLocaleString('en-IN')}
                  {sessionState.session?.openingNote && ` · Note: "${sessionState.session.openingNote}"`}
                </div>
              </div>
            </div>

            <button
              onClick={printOpeningSlip}
              style={{
                padding: '10px 20px', background: '#fff', color: '#166534',
                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              🖨 Print Opening Slip
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Total Opening Float</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.primary, marginTop: 6 }}>
                {fmtMoney(sessionState.session?.openingTotal)}
              </div>
              <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                Recorded cash in drawer
              </div>
            </div>

            <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>Live Cash Sales</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#2563EB', marginTop: 6 }}>
                +{fmtMoney(sessionState.liveStats?.totalCashSales)}
              </div>
              <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                From {sessionState.liveStats?.billsCount || 0} billed orders
              </div>
            </div>

            <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Live Digital Sales</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED', marginTop: 6 }}>
                {fmtMoney((sessionState.liveStats?.totalUpiSales || 0) + (sessionState.liveStats?.totalCardSales || 0))}
              </div>
              <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                UPI: {fmtMoney(sessionState.liveStats?.totalUpiSales)} | Card: {fmtMoney(sessionState.liveStats?.totalCardSales)}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', padding: 20, borderRadius: 14, color: '#fff' }}>
              <div style={{ fontSize: 12, color: '#BFDBFE', fontWeight: 700 }}>Expected in Drawer</div>
              <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>
                {fmtMoney(sessionState.liveStats?.expectedCash)}
              </div>
              <div style={{ fontSize: 11, color: '#DBEAFE', marginTop: 4 }}>
                Opening Float + Cash Sales
              </div>
            </div>
          </div>

          {/* Denominations Breakdown Table */}
          <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: C.surfaceAlt, borderBottom: `1px solid ${C.border}`, fontSize: 15, fontWeight: 800, color: C.text }}>
              💵 Opening Denomination Breakdown
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {(sessionState.session?.openingDenominations || []).map((d) => (
                <div key={d.denomination} style={{
                  padding: '12px 16px', borderRadius: 10, background: d.count > 0 ? '#F0FDF4' : '#F8FAFC',
                  border: `1.5px solid ${d.count > 0 ? '#86EFAC' : C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: d.count > 0 ? '#15803D' : C.textMuted }}>
                      ₹{d.denomination} Note/Coin
                    </div>
                    <div style={{ fontSize: 11, color: C.textLight }}>
                      Quantity: <strong>{d.count}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: d.count > 0 ? '#15803D' : C.textMuted }}>
                    {fmtMoney(d.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate('/billing')}
              style={{
                padding: '12px 24px', background: C.primary, color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer'
              }}
            >
              🧾 Go to Billing Counter
            </button>
            <button
              onClick={() => navigate('/closing')}
              style={{
                padding: '12px 24px', background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer'
              }}
            >
              🌙 End Shift & Close Register →
            </button>
          </div>
        </div>
      ) : (
        /* REGISTER CLOSED - READY TO OPEN */
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info Banner */}
          <div style={{
            background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 14,
            padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16
          }}>
            <span style={{ fontSize: 36 }}>🌅</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1E40AF' }}>
                Open Cash Register & Count Starting Float
              </div>
              <div style={{ fontSize: 13, color: '#3B82F6', marginTop: 2 }}>
                Enter the number of each currency note/coin in your cash drawer (e.g. ₹500 × 20, ₹5 × 10, ₹1 × 10).
              </div>
            </div>
          </div>

          {/* Interactive Denomination Counter Component */}
          <DenominationCounter
            values={openingDenoms}
            onChange={setOpeningDenoms}
          />

          {/* Opening Notes */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Opening Notes / Shift Remarks (Optional)
            </label>
            <input
              type="text"
              value={openingNote}
              onChange={(e) => setOpeningNote(e.target.value)}
              placeholder="e.g. Morning Shift Float, Cashier: Raj"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: `1.5px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Open Register Submit Button */}
          <button
            onClick={handleOpenRegister}
            disabled={submitting}
            style={{
              padding: '16px 28px', background: C.success, color: '#fff',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 900,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 6px 16px rgba(22, 163, 74, 0.3)', transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
          >
            {submitting ? 'Opening Cash Register...' : `🔓 Confirm & Open Register Float (${fmtMoney(totalFloat)})`}
          </button>
        </div>
      )}
    </div>
  );
}
