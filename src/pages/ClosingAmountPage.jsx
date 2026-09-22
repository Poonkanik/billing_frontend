import React, { useState, useEffect } from 'react';
import { cashRegisterAPI } from '../services/api';
import { C } from '../utils/theme';
import DenominationCounter, { DENOMINATIONS, fmtMoney } from '../components/cashRegister/DenominationCounter';
import { Spinner } from '../components/common/UI';
import { useNavigate } from 'react-router-dom';

export default function ClosingAmountPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState({ isOpen: false, session: null, liveStats: null });
  const [closingDenoms, setClosingDenoms] = useState({});
  const [closingNote, setClosingNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

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

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await cashRegisterAPI.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load shift history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchHistory();
  }, []);

  const totalClosingCash = DENOMINATIONS.reduce((sum, d) => sum + (d * (parseInt(closingDenoms[d], 10) || 0)), 0);
  const expectedCash = sessionState.liveStats?.expectedCash || 0;
  const variance = totalClosingCash - expectedCash;

  const handleCloseRegister = async () => {
    setSubmitting(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await cashRegisterAPI.close({
        denominations: closingDenoms,
        note: closingNote,
      });
      setMsg({ text: 'Cash register closed and reconciled successfully!', type: 'success' });
      setClosingDenoms({});
      setClosingNote('');
      if (res.data?.session) {
        setSelectedHistoryItem(res.data.session);
      }
      await fetchSession();
      await fetchHistory();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to close register', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Print Shift Report Receipt (Thermal 80mm or Window Print)
  const printShiftReceipt = (session) => {
    if (!session) return;
    const diff = session.cashDifference || 0;
    const diffLabel = diff === 0 ? 'BALANCED' : diff > 0 ? `EXCESS (+${fmtMoney(diff)})` : `SHORTAGE (${fmtMoney(diff)})`;

    const openDenomsHtml = (session.openingDenominations || [])
      .filter(d => d.count > 0)
      .map(d => `<tr><td>Rs.${d.denomination} x ${d.count}</td><td style="text-align:right">Rs.${d.amount.toFixed(2)}</td></tr>`)
      .join('');

    const closeDenomsHtml = (session.closingDenominations || [])
      .filter(d => d.count > 0)
      .map(d => `<tr><td>Rs.${d.denomination} x ${d.count}</td><td style="text-align:right">Rs.${d.amount.toFixed(2)}</td></tr>`)
      .join('');

    const html = `
      <div style="font-family:'Courier New', monospace; font-size:12px; line-height:1.4; color:#000; padding:5px;">
        <div style="text-align:center; font-weight:bold; font-size:14px; border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
          --- SHIFT / REGISTER REPORT ---<br/>
          <span style="font-size:11px;">RestoPOS Cash Register</span>
        </div>
        <div><strong>Status:</strong> ${session.status.toUpperCase()}</div>
        <div><strong>Opened:</strong> ${new Date(session.openedAt).toLocaleString('en-IN')}</div>
        <div><strong>Opened By:</strong> ${session.openedByName || 'Cashier'}</div>
        ${session.closedAt ? `<div><strong>Closed:</strong> ${new Date(session.closedAt).toLocaleString('en-IN')}</div>` : ''}
        ${session.closedByName ? `<div><strong>Closed By:</strong> ${session.closedByName}</div>` : ''}
        
        <div style="border-top:1px dashed #000; margin:6px 0;"></div>
        <div style="font-weight:bold;">OPENING CASH FLOAT: Rs.${(session.openingTotal || 0).toFixed(2)}</div>
        <table style="width:100%; font-size:11px; margin-bottom:4px;">
          ${openDenomsHtml || '<tr><td colspan="2">No denomination details</td></tr>'}
        </table>

        <div style="border-top:1px dashed #000; margin:6px 0;"></div>
        <div style="font-weight:bold;">SALES SUMMARY (${session.billsCount || 0} Bills)</div>
        <table style="width:100%; font-size:11px;">
          <tr><td>Cash Sales:</td><td style="text-align:right">Rs.${(session.totalCashSales || 0).toFixed(2)}</td></tr>
          <tr><td>UPI / QR Sales:</td><td style="text-align:right">Rs.${(session.totalUpiSales || 0).toFixed(2)}</td></tr>
          <tr><td>Card Sales:</td><td style="text-align:right">Rs.${(session.totalCardSales || 0).toFixed(2)}</td></tr>
          ${session.totalOtherSales ? `<tr><td>Other Sales:</td><td style="text-align:right">Rs.${session.totalOtherSales.toFixed(2)}</td></tr>` : ''}
          <tr style="font-weight:bold; border-top:1px solid #000;">
            <td>TOTAL SALES:</td><td style="text-align:right">Rs.${(session.totalSales || 0).toFixed(2)}</td>
          </tr>
        </table>

        <div style="border-top:1px dashed #000; margin:6px 0;"></div>
        <div style="font-weight:bold;">CASH RECONCILIATION</div>
        <table style="width:100%; font-size:11px;">
          <tr><td>Opening Float:</td><td style="text-align:right">+Rs.${(session.openingTotal || 0).toFixed(2)}</td></tr>
          <tr><td>Cash Sales:</td><td style="text-align:right">+Rs.${(session.totalCashSales || 0).toFixed(2)}</td></tr>
          <tr style="font-weight:bold; border-top:1px dashed #000;">
            <td>Expected in Drawer:</td><td style="text-align:right">Rs.${(session.expectedCash || 0).toFixed(2)}</td>
          </tr>
          ${session.status === 'closed' ? `
            <tr style="font-weight:bold;">
              <td>Actual Counted Cash:</td><td style="text-align:right">Rs.${(session.closingTotal || 0).toFixed(2)}</td>
            </tr>
            <tr style="font-weight:bold; font-size:12px;">
              <td>Variance:</td><td style="text-align:right">${diffLabel}</td>
            </tr>
          ` : ''}
        </table>

        ${session.status === 'closed' && closeDenomsHtml ? `
          <div style="border-top:1px dashed #000; margin:6px 0;"></div>
          <div style="font-weight:bold;">CLOSING CASH DENOMINATIONS:</div>
          <table style="width:100%; font-size:11px;">
            ${closeDenomsHtml}
          </table>
        ` : ''}

        ${session.closingNote ? `
          <div style="border-top:1px dashed #000; margin:6px 0; font-size:11px;">
            <strong>Note:</strong> ${session.closingNote}
          </div>
        ` : ''}

        <div style="border-top:1px dashed #000; margin-top:8px; padding-top:6px; text-align:center; font-size:10px;">
          Printed on ${new Date().toLocaleString('en-IN')}<br/>
          *** END OF REPORT ***
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
      win.document.write(`<html><head><title>Shift Report</title></head><body>${html}</body></html>`);
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
            <span style={{ fontSize: 26 }}>🌙</span>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
              Closing Cash Amount & Shift Reconciliation
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>
            Count end-of-shift drawer denominations and reconcile expected vs actual cash
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { fetchSession(); fetchHistory(); }}
            style={{
              padding: '9px 16px', background: '#fff', border: `1.5px solid ${C.border}`,
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.text, cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => navigate('/opening')}
            style={{
              padding: '9px 16px', background: C.surfaceAlt, border: `1.5px solid ${C.border}`,
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.text, cursor: 'pointer'
            }}
          >
            🌅 Go to Opening Amount →
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
          <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>Loading register state...</div>
        </div>
      ) : sessionState.isOpen ? (
        /* ACTIVE REGISTER READY FOR CLOSING COUNT */
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Card */}
          <div style={{
            background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: 16,
            padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: '#D97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff'
              }}>
                🌙
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#92400E' }}>
                  Ready to Close Active Shift
                </div>
                <div style={{ fontSize: 13, color: '#B45309', marginTop: 2 }}>
                  Count all cash notes and coins in the cash drawer to perform final shift reconciliation.
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700 }}>Expected in Drawer</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#92400E' }}>{fmtMoney(expectedCash)}</div>
            </div>
          </div>

          {/* Denominations Counter for Closing */}
          <DenominationCounter
            values={closingDenoms}
            onChange={setClosingDenoms}
          />

          {/* Reconciliation Dashboard Card */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1.5px solid ${C.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>
              📊 Cash Reconciliation & Variance Summary
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
              <div style={{ background: C.surfaceAlt, padding: 14, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Opening Float</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>
                  {fmtMoney(sessionState.session?.openingTotal)}
                </div>
              </div>

              <div style={{ background: '#EFF6FF', padding: 14, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>Cash Sales ({sessionState.liveStats?.billsCount || 0} bills)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>
                  +{fmtMoney(sessionState.liveStats?.totalCashSales)}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Expected Cash</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>
                  ={fmtMoney(expectedCash)}
                </div>
              </div>

              <div style={{
                background: variance === 0 ? '#F0FDF4' : variance > 0 ? '#EFF6FF' : '#FEF2F2',
                border: `1.5px solid ${variance === 0 ? '#86EFAC' : variance > 0 ? '#93C5FD' : '#FCA5A5'}`,
                padding: 14, borderRadius: 12
              }}>
                <div style={{ fontSize: 12, color: variance === 0 ? '#16A34A' : variance > 0 ? '#2563EB' : '#DC2626', fontWeight: 700 }}>
                  {variance === 0 ? 'Balanced (Exact Match)' : variance > 0 ? 'Excess Cash' : 'Cash Shortage'}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: variance === 0 ? '#16A34A' : variance > 0 ? '#2563EB' : '#DC2626', marginTop: 4 }}>
                  {variance > 0 ? `+${fmtMoney(variance)}` : fmtMoney(variance)}
                </div>
              </div>
            </div>

            {/* Closing Notes */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                Closing Remarks / Reason for Variance (Optional)
              </label>
              <input
                type="text"
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                placeholder="e.g. End of day shift, cash handed over to Manager"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={handleCloseRegister}
              disabled={submitting}
              style={{
                width: '100%', padding: '16px', background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 900,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)'
              }}
            >
              {submitting ? 'Closing Cash Register...' : `🔒 Confirm & Close Shift (${fmtMoney(totalClosingCash)})`}
            </button>
          </div>
        </div>
      ) : (
        /* REGISTER IS CURRENTLY CLOSED SCREEN */
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '24px 28px', border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14, background: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
              }}>
                🔒
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Cash Register is Currently Closed</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                  Start a new shift by recording your opening cash float under Opening Amount.
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/opening')}
              style={{
                padding: '12px 22px', background: C.success, color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer'
              }}
            >
              🌅 Open New Shift / Register →
            </button>
          </div>

          {/* Past Shifts History Table */}
          <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: C.surfaceAlt, borderBottom: `1px solid ${C.border}`, fontSize: 15, fontWeight: 800, color: C.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📜 Past Shifts & Register History</span>
              <button onClick={fetchHistory} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer' }}>
                🔄 Refresh
              </button>
            </div>

            {historyLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
            ) : history.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                No past shift records found.
              </div>
            ) : (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map((s) => {
                  const diff = s.cashDifference || 0;
                  return (
                    <div
                      key={s._id}
                      style={{
                        background: '#FAFAFA', border: `1px solid ${C.border}`, borderRadius: 12,
                        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                            {new Date(s.openedAt).toLocaleDateString('en-IN')} ({new Date(s.openedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})
                          </span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 800,
                            background: s.status === 'open' ? '#DCFCE7' : '#F1F5F9',
                            color: s.status === 'open' ? '#15803D' : '#475569'
                          }}>
                            {s.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                          Cashier: <strong>{s.openedByName}</strong> · Bills: {s.billsCount || 0} · Total Sales: {fmtMoney(s.totalSales)}
                          {s.closingNote && ` · Note: "${s.closingNote}"`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: C.textMuted }}>Opening → Closing</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                            {fmtMoney(s.openingTotal)} → {fmtMoney(s.closingTotal || s.expectedCash)}
                          </div>
                        </div>

                        {s.status === 'closed' && (
                          <div style={{ minWidth: 90, textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: C.textMuted }}>Variance</div>
                            <div style={{
                              fontSize: 13, fontWeight: 800,
                              color: diff === 0 ? '#16A34A' : diff > 0 ? '#2563EB' : '#DC2626'
                            }}>
                              {diff === 0 ? 'Balanced' : diff > 0 ? `+${fmtMoney(diff)}` : fmtMoney(diff)}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => printShiftReceipt(s)}
                          style={{
                            padding: '6px 12px', background: '#fff', border: `1px solid ${C.border}`,
                            borderRadius: 8, fontSize: 12, fontWeight: 700, color: C.text, cursor: 'pointer'
                          }}
                        >
                          🖨 Print
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
