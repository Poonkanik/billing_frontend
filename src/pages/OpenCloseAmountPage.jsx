import React, { useState, useEffect } from 'react';
import { cashRegisterAPI } from '../services/api';
import { C } from '../utils/theme';
import DenominationCounter, { DENOMINATIONS, fmtMoney } from '../components/cashRegister/DenominationCounter';
import { Spinner } from '../components/common/UI';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OpenCloseAmountPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'open'; // 'open', 'close', 'history'
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState({ isOpen: false, session: null, liveStats: null });

  // Opening State
  const [openingDenoms, setOpeningDenoms] = useState({});
  const [openingNote, setOpeningNote] = useState('');
  const [submittingOpen, setSubmittingOpen] = useState(false);

  // Closing State
  const [closingDenoms, setClosingDenoms] = useState({});
  const [closingNote, setClosingNote] = useState('');
  const [submittingClose, setSubmittingClose] = useState(false);

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Message alert
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await cashRegisterAPI.getCurrent();
      setSessionState(res.data);
      // Auto-set sensible default tab if not explicitly navigated with param
      if (!searchParams.get('tab')) {
        if (res.data?.isOpen) {
          setActiveTab('close');
        } else {
          setActiveTab('open');
        }
      }
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
      console.error('Failed to load shift history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchHistory();
  }, []);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Opening Totals
  const totalOpeningFloat = DENOMINATIONS.reduce((sum, d) => sum + (d * (parseInt(openingDenoms[d], 10) || 0)), 0);

  // Closing Totals
  const totalClosingCash = DENOMINATIONS.reduce((sum, d) => sum + (d * (parseInt(closingDenoms[d], 10) || 0)), 0);
  const expectedCash = sessionState.liveStats?.expectedCash || (sessionState.session?.openingTotal || 0);
  const variance = totalClosingCash - expectedCash;

  // Handle Open
  const handleOpenRegister = async () => {
    setSubmittingOpen(true);
    setMsg({ text: '', type: '' });
    try {
      await cashRegisterAPI.open({
        denominations: openingDenoms,
        note: openingNote,
      });
      setMsg({ text: `Cash Register opened successfully with starting float of ${fmtMoney(totalOpeningFloat)}!`, type: 'success' });
      setOpeningDenoms({});
      setOpeningNote('');
      await fetchSession();
      await fetchHistory();
      changeTab('close');
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to open register', type: 'error' });
    } finally {
      setSubmittingOpen(false);
    }
  };

  // Handle Close
  const handleCloseRegister = async () => {
    setSubmittingClose(true);
    setMsg({ text: '', type: '' });
    try {
      await cashRegisterAPI.close({
        denominations: closingDenoms,
        note: closingNote,
      });
      setMsg({ text: 'Cash register closed and shift reconciled successfully!', type: 'success' });
      setClosingDenoms({});
      setClosingNote('');
      await fetchSession();
      await fetchHistory();
      changeTab('history');
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to close register', type: 'error' });
    } finally {
      setSubmittingClose(false);
    }
  };

  // Print Slip
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
      {/* Top Header Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>💰</span>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
              Open & Close Amount
            </div>
            <span style={{
              fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 100,
              background: sessionState.isOpen ? '#DCFCE7' : '#F1F5F9',
              color: sessionState.isOpen ? '#15803D' : '#64748B',
              border: `1px solid ${sessionState.isOpen ? '#86EFAC' : '#CBD5E1'}`,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span>{sessionState.isOpen ? '🟢' : '🔒'}</span>
              <span>{sessionState.isOpen ? 'Active Shift Open' : 'Register Closed'}</span>
            </span>
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
            Manage drawer cash float denominations, shift closing reconciliation, and daily shift records.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { fetchSession(); fetchHistory(); }}
            style={{
              padding: '9px 16px', background: '#fff', border: `1.5px solid ${C.border}`,
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.text, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => navigate('/billing')}
            style={{
              padding: '9px 16px', background: C.primary, border: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🧾 Go to Billing Counter
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex', gap: 8, borderBottom: `1.5px solid ${C.border}`, paddingBottom: 12, marginBottom: 20
      }}>
        <button
          onClick={() => changeTab('open')}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
            background: activeTab === 'open' ? C.primary : C.surfaceAlt,
            color: activeTab === 'open' ? '#fff' : C.textMuted,
            boxShadow: activeTab === 'open' ? '0 3px 10px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          <span>🌅</span>
          <span>Opening Amount</span>
          {sessionState.isOpen && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: 100 }}>Active</span>}
        </button>

        <button
          onClick={() => changeTab('close')}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
            background: activeTab === 'close' ? '#DC2626' : C.surfaceAlt,
            color: activeTab === 'close' ? '#fff' : C.textMuted,
            boxShadow: activeTab === 'close' ? '0 3px 10px rgba(220, 38, 38, 0.25)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          <span>🌙</span>
          <span>Closing Amount & Reconcile</span>
          {sessionState.isOpen && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: 100 }}>Ready</span>}
        </button>

        <button
          onClick={() => changeTab('history')}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
            background: activeTab === 'history' ? '#0F172A' : C.surfaceAlt,
            color: activeTab === 'history' ? '#fff' : C.textMuted,
            boxShadow: activeTab === 'history' ? '0 3px 10px rgba(15, 23, 42, 0.2)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          <span>📜</span>
          <span>Shift History ({history.length})</span>
        </button>
      </div>

      {/* Feedback Messages */}
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
          <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>Loading cash drawer session...</div>
        </div>
      ) : (
        <div>
          {/* TAB 1: OPENING AMOUNT */}
          {activeTab === 'open' && (
            <div>
              {sessionState.isOpen ? (
                /* Session already open */
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                          Shift Register is Currently Open
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                          Opened by <strong>{sessionState.session?.openedByName}</strong> at {new Date(sessionState.session?.openedAt).toLocaleString('en-IN')}
                          {sessionState.session?.openingNote && ` · Note: "${sessionState.session.openingNote}"`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={printOpeningSlip}
                        style={{
                          padding: '10px 18px', background: '#fff', color: '#166534',
                          border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        🖨 Print Opening Slip
                      </button>
                      <button
                        onClick={() => changeTab('close')}
                        style={{
                          padding: '10px 18px', background: '#DC2626', color: '#fff',
                          border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        🌙 Close Shift →
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Total Opening Float</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: C.primary, marginTop: 6 }}>
                        {fmtMoney(sessionState.session?.openingTotal)}
                      </div>
                      <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                        Recorded starting physical cash
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

                  {/* Denominations Breakdown */}
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
                </div>
              ) : (
                /* Form to open register */
                <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                        Enter the count of each currency note/coin present in the cash drawer to start today's shift.
                      </div>
                    </div>
                  </div>

                  <DenominationCounter
                    values={openingDenoms}
                    onChange={setOpeningDenoms}
                  />

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

                  <button
                    onClick={handleOpenRegister}
                    disabled={submittingOpen}
                    style={{
                      padding: '16px 28px', background: C.success, color: '#fff',
                      border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 900,
                      cursor: submittingOpen ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: '0 6px 16px rgba(22, 163, 74, 0.3)', transition: 'all 0.15s'
                    }}
                  >
                    {submittingOpen ? 'Opening Cash Register...' : `🔓 Confirm & Open Register Float (${fmtMoney(totalOpeningFloat)})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLOSING AMOUNT & RECONCILIATION */}
          {activeTab === 'close' && (
            <div>
              {sessionState.isOpen ? (
                /* Active Shift ready to close */
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                          Close Active Shift & Reconcile Cash
                        </div>
                        <div style={{ fontSize: 13, color: '#B45309', marginTop: 2 }}>
                          Count physical cash notes and coins in the drawer to complete final shift reconciliation.
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700 }}>Expected in Drawer</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#92400E' }}>{fmtMoney(expectedCash)}</div>
                    </div>
                  </div>

                  <DenominationCounter
                    values={closingDenoms}
                    onChange={setClosingDenoms}
                  />

                  {/* Summary Card */}
                  <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1.5px solid ${C.border}` }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>
                      📊 Cash Reconciliation Summary
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
                          {variance === 0 ? 'Balanced (Exact)' : variance > 0 ? 'Excess Cash' : 'Cash Shortage'}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: variance === 0 ? '#16A34A' : variance > 0 ? '#2563EB' : '#DC2626', marginTop: 4 }}>
                          {variance > 0 ? `+${fmtMoney(variance)}` : fmtMoney(variance)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                        Closing Remarks / Handover Notes (Optional)
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
                      disabled={submittingClose}
                      style={{
                        width: '100%', padding: '16px', background: '#DC2626', color: '#fff',
                        border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 900,
                        cursor: submittingClose ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)'
                      }}
                    >
                      {submittingClose ? 'Closing Cash Register...' : `🔒 Confirm & Close Shift (${fmtMoney(totalClosingCash)})`}
                    </button>
                  </div>
                </div>
              ) : (
                /* Closed message */
                <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                        <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>No Active Shift is Currently Open</div>
                        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                          Open a new shift drawer float first to start billing and enable closing reconciliation.
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => changeTab('open')}
                      style={{
                        padding: '12px 22px', background: C.success, color: '#fff',
                        border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      🌅 Go to Opening Amount →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SHIFT HISTORY */}
          {activeTab === 'history' && (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: C.surfaceAlt, borderBottom: `1px solid ${C.border}`, fontSize: 15, fontWeight: 800, color: C.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📜 Shift Register History</span>
                  <button onClick={fetchHistory} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer' }}>
                    🔄 Refresh List
                  </button>
                </div>

                {historyLoading ? (
                  <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
                ) : history.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                    No shift history records found.
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
                              🖨 Print Report
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
      )}
    </div>
  );
}
