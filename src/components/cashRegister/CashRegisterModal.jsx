import React, { useState, useEffect } from 'react';
import { cashRegisterAPI } from '../../services/api';
import { C } from '../../utils/theme';
import DenominationCounter, { DENOMINATIONS, fmtMoney } from './DenominationCounter';
import { Spinner } from '../common/UI';

export default function CashRegisterModal({ isOpen, onClose, onSessionChange, initialMode = 'current' }) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState({ isOpen: false, session: null, liveStats: null });
  
  // Open Register Form State
  const [openingDenoms, setOpeningDenoms] = useState({});
  const [openingNote, setOpeningNote] = useState('');
  const [submittingOpen, setSubmittingOpen] = useState(false);

  // Close Register Mode State
  const [isClosingMode, setIsClosingMode] = useState(false);
  const [closingDenoms, setClosingDenoms] = useState({});
  const [closingNote, setClosingNote] = useState('');
  const [submittingClose, setSubmittingClose] = useState(false);

  // Cash Movement (Pay In / Pay Out) State
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState('out'); // 'in' | 'out'
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [submittingMovement, setSubmittingMovement] = useState(false);

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Error/Success messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load active session
  const fetchCurrentSession = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await cashRegisterAPI.getCurrent();
      setSessionState(res.data);
      onSessionChange?.(res.data);
    } catch (err) {
      console.error("Failed to load register session", err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch register session');
    } finally {
      setLoading(false);
    }
  };

  // Load history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await cashRegisterAPI.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'close') {
        setActiveTab('current');
        setIsClosingMode(true);
      } else if (initialMode === 'open') {
        setActiveTab('current');
        setIsClosingMode(false);
      } else if (initialMode === 'history') {
        setActiveTab('history');
      }
      fetchCurrentSession();
      if (activeTab === 'history' || initialMode === 'history') fetchHistory();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle Open Register Submit
  const handleOpenRegister = async () => {
    const total = DENOMINATIONS.reduce((sum, d) => sum + (d * (parseInt(openingDenoms[d], 10) || 0)), 0);
    setSubmittingOpen(true);
    setErrorMsg('');
    try {
      await cashRegisterAPI.open({
        denominations: openingDenoms,
        note: openingNote,
      });
      setSuccessMsg(`Cash Register opened with float of ${fmtMoney(total)}`);
      setOpeningDenoms({});
      setOpeningNote('');
      await fetchCurrentSession();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to open cash register');
    } finally {
      setSubmittingOpen(false);
    }
  };

  // Handle Cash Movement Submit
  const handleAddMovement = async () => {
    const amt = parseFloat(movementAmount);
    if (!amt || amt <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }
    setSubmittingMovement(true);
    setErrorMsg('');
    try {
      await cashRegisterAPI.addMovement({
        type: movementType,
        amount: amt,
        reason: movementReason,
      });
      setShowMovementModal(false);
      setMovementAmount('');
      setMovementReason('');
      setSuccessMsg(`Cash ${movementType === 'in' ? 'Added' : 'Removed'} recorded successfully`);
      await fetchCurrentSession();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record cash movement');
    } finally {
      setSubmittingMovement(false);
    }
  };

  // Handle Close Register Submit
  const handleCloseRegister = async () => {
    setSubmittingClose(true);
    setErrorMsg('');
    try {
      const res = await cashRegisterAPI.close({
        denominations: closingDenoms,
        note: closingNote,
      });
      setSuccessMsg('Cash register closed & reconciled successfully!');
      setIsClosingMode(false);
      setClosingDenoms({});
      setClosingNote('');
      
      // Auto-preview/print shift summary
      if (res.data?.session) {
        setSelectedHistoryItem(res.data.session);
      }
      
      await fetchCurrentSession();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to close register');
    } finally {
      setSubmittingClose(false);
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

  const calculatedClosingTotal = DENOMINATIONS.reduce((sum, d) => sum + (d * (parseInt(closingDenoms[d], 10) || 0)), 0);
  const liveExpectedCash = sessionState.liveStats?.expectedCash || 0;
  const calculatedDiff = calculatedClosingTotal - liveExpectedCash;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 880,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
        border: `1px solid ${C.border}`
      }}>
        {/* Modal Top Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
            }}>
              💰
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>
                Cash Register & Shift Management
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Track opening & closing denominations and cash drawer reconciliation
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 3, display: 'flex', gap: 4 }}>
              <button
                onClick={() => { setActiveTab('current'); setSelectedHistoryItem(null); }}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  background: activeTab === 'current' ? C.primary : 'transparent',
                  color: activeTab === 'current' ? '#fff' : '#94A3B8'
                }}
              >
                {sessionState.isOpen ? '🟢 Active Register' : '🟡 Open Register'}
              </button>
              <button
                onClick={() => { setActiveTab('history'); fetchHistory(); }}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  background: activeTab === 'history' ? C.primary : 'transparent',
                  color: activeTab === 'history' ? '#fff' : '#94A3B8'
                }}
              >
                📜 Past Shifts / History
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{ padding: '10px 24px', background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '10px 24px', background: '#F0FDF4', color: '#16A34A', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #86EFAC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#16A34A', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: C.bg }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Spinner />
              <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>Loading register state...</div>
            </div>
          ) : activeTab === 'current' ? (
            /* ACTIVE / OPEN REGISTER TAB */
            !sessionState.isOpen ? (
              /* SCREEN 1: OPEN REGISTER */
              <div>
                <div style={{
                  background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 14,
                  padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14
                }}>
                  <span style={{ fontSize: 32 }}>🌅</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1E40AF' }}>Start New Shift / Day Register</div>
                    <div style={{ fontSize: 13, color: '#3B82F6' }}>
                      Enter the opening cash float in the cash drawer broken down by currency denominations.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                  <DenominationCounter
                    values={openingDenoms}
                    onChange={setOpeningDenoms}
                  />

                  <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                      Opening Note / Shift Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      value={openingNote}
                      onChange={(e) => setOpeningNote(e.target.value)}
                      placeholder="e.g. Morning Shift Float, Cashier: Raj"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: `1.5px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleOpenRegister}
                    disabled={submittingOpen}
                    style={{
                      padding: '14px 24px', background: C.success, color: '#fff',
                      border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
                      cursor: submittingOpen ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    {submittingOpen ? 'Opening Register...' : `🔓 Open Register with Float (${fmtMoney(DENOMINATIONS.reduce((sum, d) => sum + (d * (parseInt(openingDenoms[d], 10) || 0)), 0))})`}
                  </button>
                </div>
              </div>
            ) : isClosingMode ? (
              /* SCREEN 2: CLOSE REGISTER / COUNT CLOSING CASH */
              <div>
                <div style={{
                  background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: 14,
                  padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 32 }}>🌙</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#92400E' }}>End Shift / Close Cash Register</div>
                      <div style={{ fontSize: 13, color: '#B45309' }}>
                        Count all physical cash currently in drawer by denominations for reconciliation.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsClosingMode(false)}
                    style={{
                      padding: '8px 14px', background: '#fff', border: '1px solid #D97706',
                      color: '#92400E', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    ← Back to Monitor
                  </button>
                </div>

                {/* Denomination Counter for Closing */}
                <DenominationCounter
                  values={closingDenoms}
                  onChange={setClosingDenoms}
                />

                {/* Reconciliation Summary Card */}
                <div style={{
                  background: '#fff', borderRadius: 14, padding: 20,
                  border: `1.5px solid ${C.border}`, marginTop: 20
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>
                    📊 Cash Reconciliation Preview
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: C.surfaceAlt, padding: 12, borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Opening Float</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{fmtMoney(sessionState.session?.openingTotal)}</div>
                    </div>
                    <div style={{ background: '#EFF6FF', padding: 12, borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>Cash Sales ({sessionState.liveStats?.billsCount || 0} bills)</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#2563EB' }}>+{fmtMoney(sessionState.liveStats?.totalCashSales)}</div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Expected in Drawer</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>={fmtMoney(liveExpectedCash)}</div>
                    </div>
                    <div style={{
                      background: calculatedDiff === 0 ? '#F0FDF4' : calculatedDiff > 0 ? '#EFF6FF' : '#FEF2F2',
                      border: `1px solid ${calculatedDiff === 0 ? '#86EFAC' : calculatedDiff > 0 ? '#93C5FD' : '#FCA5A5'}`,
                      padding: 12, borderRadius: 10
                    }}>
                      <div style={{ fontSize: 11, color: calculatedDiff === 0 ? '#16A34A' : calculatedDiff > 0 ? '#2563EB' : '#DC2626', fontWeight: 700 }}>
                        {calculatedDiff === 0 ? 'Exact Match' : calculatedDiff > 0 ? 'Excess Cash' : 'Cash Shortage'}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: calculatedDiff === 0 ? '#16A34A' : calculatedDiff > 0 ? '#2563EB' : '#DC2626' }}>
                        {calculatedDiff > 0 ? `+${fmtMoney(calculatedDiff)}` : fmtMoney(calculatedDiff)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                      Closing Notes / Reason for Discrepancy (Optional)
                    </label>
                    <input
                      type="text"
                      value={closingNote}
                      onChange={(e) => setClosingNote(e.target.value)}
                      placeholder="e.g. End of shift, cash handed to Manager"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: `1.5px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={handleCloseRegister}
                      disabled={submittingClose}
                      style={{
                        flex: 1, padding: '14px 20px', background: '#DC2626', color: '#fff',
                        border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
                        cursor: submittingClose ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                      }}
                    >
                      {submittingClose ? 'Closing Register...' : `🔒 Confirm & Close Shift (${fmtMoney(calculatedClosingTotal)})`}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SCREEN 3: LIVE ACTIVE REGISTER MONITOR */
              <div>
                {/* Active Shift Header */}
                <div style={{
                  background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 16,
                  padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: C.success,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff'
                    }}>
                      🟢
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                        Register ACTIVE & OPEN
                        <span style={{ fontSize: 11, padding: '2px 8px', background: '#DCFCE7', color: '#15803D', borderRadius: 100, fontWeight: 700 }}>
                          Since {new Date(sessionState.session?.openedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>
                        Opened by <strong>{sessionState.session?.openedByName}</strong> on {new Date(sessionState.session?.openedAt).toLocaleDateString('en-IN')}
                        {sessionState.session?.openingNote && ` · Note: "${sessionState.session.openingNote}"`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setShowMovementModal(true)}
                      style={{
                        padding: '9px 16px', background: '#fff', border: `1.5px solid ${C.border}`,
                        borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.text, cursor: 'pointer'
                      }}
                    >
                      💸 Pay-In / Pay-Out
                    </button>
                    <button
                      onClick={() => printShiftReceipt(sessionState.session)}
                      style={{
                        padding: '9px 16px', background: '#fff', border: `1.5px solid ${C.border}`,
                        borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.text, cursor: 'pointer'
                      }}
                    >
                      🖨 Print Current Summary
                    </button>
                    <button
                      onClick={() => setIsClosingMode(true)}
                      style={{
                        padding: '9px 18px', background: '#DC2626', border: 'none',
                        borderRadius: 10, fontSize: 13, fontWeight: 800, color: '#fff', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                      }}
                    >
                      🌙 End Shift & Close
                    </button>
                  </div>
                </div>

                {/* Stat Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: '#fff', padding: 18, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Opening Cash Float</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 4 }}>
                      {fmtMoney(sessionState.session?.openingTotal)}
                    </div>
                    <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                      {sessionState.session?.openingDenominations?.filter(d => d.count > 0).length || 0} denomination types
                    </div>
                  </div>

                  <div style={{ background: '#fff', padding: 18, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>Cash Sales (Drawer)</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#2563EB', marginTop: 4 }}>
                      +{fmtMoney(sessionState.liveStats?.totalCashSales)}
                    </div>
                    <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                      From {sessionState.liveStats?.billsCount || 0} billed orders
                    </div>
                  </div>

                  <div style={{ background: '#fff', padding: 18, borderRadius: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Cash Movements</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: (sessionState.liveStats?.cashIn - sessionState.liveStats?.cashOut) >= 0 ? '#16A34A' : '#DC2626', marginTop: 4 }}>
                      {fmtMoney((sessionState.liveStats?.cashIn || 0) - (sessionState.liveStats?.cashOut || 0))}
                    </div>
                    <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                      +{fmtMoney(sessionState.liveStats?.cashIn)} in / -{fmtMoney(sessionState.liveStats?.cashOut)} out
                    </div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', padding: 18, borderRadius: 14, color: '#fff' }}>
                    <div style={{ fontSize: 12, color: '#BFDBFE', fontWeight: 700 }}>Expected in Drawer</div>
                    <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>
                      {fmtMoney(sessionState.liveStats?.expectedCash)}
                    </div>
                    <div style={{ fontSize: 11, color: '#DBEAFE', marginTop: 4 }}>
                      Opening + Cash Sales ± Movements
                    </div>
                  </div>
                </div>

                {/* Digital Sales & Opening Float Breakdown in 2 Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Left Column: Non-Cash / Digital Sales Breakdown */}
                  <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>💳</span> Overall Shift Sales Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.surfaceAlt, borderRadius: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>💵 Cash Sales:</span>
                        <strong style={{ fontSize: 13, color: C.text }}>{fmtMoney(sessionState.liveStats?.totalCashSales)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.surfaceAlt, borderRadius: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>📱 UPI / QR Sales:</span>
                        <strong style={{ fontSize: 13, color: '#2563EB' }}>{fmtMoney(sessionState.liveStats?.totalUpiSales)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.surfaceAlt, borderRadius: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>💳 Card Sales:</span>
                        <strong style={{ fontSize: 13, color: '#7C3AED' }}>{fmtMoney(sessionState.liveStats?.totalCardSales)}</strong>
                      </div>
                      {sessionState.liveStats?.totalOtherSales > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.surfaceAlt, borderRadius: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>🏷️ Other / Credit:</span>
                          <strong style={{ fontSize: 13, color: C.text }}>{fmtMoney(sessionState.liveStats?.totalOtherSales)}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#EFF6FF', borderRadius: 8, borderTop: '2px solid #3B82F6' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#1E40AF' }}>Total Shift Revenue:</span>
                        <strong style={{ fontSize: 16, fontWeight: 900, color: '#1E40AF' }}>{fmtMoney(sessionState.liveStats?.totalSales)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Opening Denomination Breakdown */}
                  <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>💵</span> Opening Denominations Breakdown
                    </div>
                    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(sessionState.session?.openingDenominations || [])
                        .filter(d => d.count > 0)
                        .map(d => (
                          <div key={d.denomination} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: C.surfaceAlt, borderRadius: 8, fontSize: 12 }}>
                            <span style={{ fontWeight: 700, color: C.text }}>₹{d.denomination} × {d.count}</span>
                            <strong style={{ color: C.primary }}>{fmtMoney(d.amount)}</strong>
                          </div>
                        ))}
                      {(!sessionState.session?.openingDenominations || sessionState.session?.openingDenominations.filter(d => d.count > 0).length === 0) && (
                        <div style={{ textAlign: 'center', padding: 20, color: C.textMuted, fontSize: 12 }}>
                          No specific denomination breakdown recorded.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* PAST SHIFTS & HISTORY TAB */
            <div>
              {selectedHistoryItem ? (
                /* Inspection of a single shift record */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <button
                      onClick={() => setSelectedHistoryItem(null)}
                      style={{
                        padding: '8px 14px', background: '#fff', border: `1px solid ${C.border}`,
                        borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      ← Back to History List
                    </button>
                    <button
                      onClick={() => printShiftReceipt(selectedHistoryItem)}
                      style={{
                        padding: '8px 16px', background: C.primary, color: '#fff', border: 'none',
                        borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      🖨 Print Shift Receipt
                    </button>
                  </div>

                  <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 14, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>
                          Shift Report — {new Date(selectedHistoryItem.openedAt).toLocaleDateString('en-IN')}
                        </div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                          Opened: {new Date(selectedHistoryItem.openedAt).toLocaleTimeString('en-IN')} by {selectedHistoryItem.openedByName}
                          {selectedHistoryItem.closedAt && ` · Closed: ${new Date(selectedHistoryItem.closedAt).toLocaleTimeString('en-IN')} by ${selectedHistoryItem.closedByName}`}
                        </div>
                      </div>
                      <div>
                        <span style={{
                          padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 800,
                          background: selectedHistoryItem.status === 'open' ? '#DCFCE7' : '#F1F5F9',
                          color: selectedHistoryItem.status === 'open' ? '#15803D' : '#475569'
                        }}>
                          {selectedHistoryItem.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Reconciliation Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                      <div style={{ background: C.surfaceAlt, padding: 12, borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: C.textMuted }}>Opening Float</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{fmtMoney(selectedHistoryItem.openingTotal)}</div>
                      </div>
                      <div style={{ background: '#EFF6FF', padding: 12, borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: '#2563EB' }}>Cash Sales</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#2563EB' }}>{fmtMoney(selectedHistoryItem.totalCashSales)}</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: C.textMuted }}>Expected Cash</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{fmtMoney(selectedHistoryItem.expectedCash)}</div>
                      </div>
                      <div style={{
                        background: selectedHistoryItem.cashDifference === 0 ? '#F0FDF4' : selectedHistoryItem.cashDifference > 0 ? '#EFF6FF' : '#FEF2F2',
                        padding: 12, borderRadius: 10
                      }}>
                        <div style={{ fontSize: 11, color: selectedHistoryItem.cashDifference === 0 ? '#16A34A' : selectedHistoryItem.cashDifference > 0 ? '#2563EB' : '#DC2626', fontWeight: 700 }}>
                          Variance / Discrepancy
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: selectedHistoryItem.cashDifference === 0 ? '#16A34A' : selectedHistoryItem.cashDifference > 0 ? '#2563EB' : '#DC2626' }}>
                          {selectedHistoryItem.cashDifference > 0 ? `+${fmtMoney(selectedHistoryItem.cashDifference)}` : fmtMoney(selectedHistoryItem.cashDifference)}
                        </div>
                      </div>
                    </div>

                    {/* Denominations Tables Side-by-Side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>Opening Denominations</div>
                        {(selectedHistoryItem.openingDenominations || []).filter(d => d.count > 0).map(d => (
                          <div key={d.denomination} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '1px dashed #eee' }}>
                            <span>₹{d.denomination} × {d.count}</span>
                            <strong>{fmtMoney(d.amount)}</strong>
                          </div>
                        ))}
                      </div>

                      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>Closing Denominations</div>
                        {(selectedHistoryItem.closingDenominations || []).filter(d => d.count > 0).map(d => (
                          <div key={d.denomination} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '1px dashed #eee' }}>
                            <span>₹{d.denomination} × {d.count}</span>
                            <strong>{fmtMoney(d.amount)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* History list table */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Past Shifts & Registers</div>
                    <button
                      onClick={fetchHistory}
                      style={{
                        padding: '6px 12px', background: C.surfaceAlt, border: `1px solid ${C.border}`,
                        borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      🔄 Refresh
                    </button>
                  </div>

                  {historyLoading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
                  ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 50, color: C.textMuted, background: '#fff', borderRadius: 14 }}>
                      No past shift registers recorded yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {history.map((s) => {
                        const diff = s.cashDifference || 0;
                        return (
                          <div
                            key={s._id}
                            onClick={() => setSelectedHistoryItem(s)}
                            style={{
                              background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
                              padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              cursor: 'pointer', transition: 'all 0.15s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = C.primary}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = C.border}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, textAlign: 'right' }}>
                              <div>
                                <div style={{ fontSize: 11, color: C.textMuted }}>Opening / Closing</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                                  {fmtMoney(s.openingTotal)} → {fmtMoney(s.closingTotal || s.expectedCash)}
                                </div>
                              </div>

                              {s.status === 'closed' && (
                                <div style={{ minWidth: 90 }}>
                                  <div style={{ fontSize: 11, color: C.textMuted }}>Variance</div>
                                  <div style={{
                                    fontSize: 13, fontWeight: 800,
                                    color: diff === 0 ? '#16A34A' : diff > 0 ? '#2563EB' : '#DC2626'
                                  }}>
                                    {diff === 0 ? 'Balanced' : diff > 0 ? `+${fmtMoney(diff)}` : fmtMoney(diff)}
                                  </div>
                                </div>
                              )}

                              <span style={{ fontSize: 16, color: C.textMuted }}>➔</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pay-In / Pay-Out Submodal */}
        {showMovementModal && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10001,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Cash Pay-In / Pay-Out</div>
                <button onClick={() => setShowMovementModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setMovementType('in')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: movementType === 'in' ? '#DCFCE7' : C.surfaceAlt,
                    color: movementType === 'in' ? '#15803D' : C.text,
                    fontWeight: 700, fontSize: 13
                  }}
                >
                  ➕ Cash In (Add Float)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('out')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: movementType === 'out' ? '#FEE2E2' : C.surfaceAlt,
                    color: movementType === 'out' ? '#DC2626' : C.text,
                    fontWeight: 700, fontSize: 13
                  }}
                >
                  ➖ Cash Out (Expense / Drop)
                </button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 15, fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>Reason / Remarks</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="e.g. Paid for milk delivery, Petty cash added"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={handleAddMovement}
                disabled={submittingMovement}
                style={{
                  width: '100%', padding: '12px', background: C.primary, color: '#fff',
                  border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer'
                }}
              >
                {submittingMovement ? 'Saving...' : 'Save Cash Movement'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
