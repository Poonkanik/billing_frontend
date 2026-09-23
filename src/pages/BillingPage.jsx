import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { masterAPI, billsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { C } from '../utils/theme';
import { Btn } from '../components/common/UI';
import { getProductRateBySalesMode, updateProductsRatesBySalesMode } from '../utils/productRateHelper';
import { getProductName } from '../utils/productName';
import { DepartmentFilter } from '../components/billing/DepartmentFilter';
import { MeasurementItemForm } from '../components/billing/MeasurementItemForm';
import { DynamicReceiptRenderer } from '../components/common/DynamicReceiptRenderer';

const GST_PCT = 5;  // default 5% GST (2.5% CGST + 2.5% SGST)
const PAY_MODES = ['Cash', 'UPI', 'Card'];
const MAX_BILLS = 10; // Maximum bill tabs allowed

// Default print template fields — used when no template is configured in Options > Sales Printer
const DEFAULT_PRINT_FIELDS = [
  { name: 'UnderLine', text: '', size: 'BOLD-8', align: 'CENTER', length: 48, nextLine: true, discontinue: false, print: true },
  { name: 'CompanyName', text: '', size: 'BOLD-12', align: 'CENTER', length: 48, nextLine: true, discontinue: false, print: true },
  { name: 'Address1', text: '', size: 'BOLD-9', align: 'CENTER', length: 48, nextLine: true, discontinue: false, print: true },
  { name: 'BillNo', text: 'Bill No:', size: 'BOLD-9', align: 'LEFT', length: 16, nextLine: false, discontinue: false, print: true },
  { name: 'Date', text: 'Date:', size: 'BOLD-9', align: 'LEFT', length: 16, nextLine: false, discontinue: false, print: true },
  { name: 'Time', text: 'Time:', size: 'BOLD-9', align: 'RIGHT', length: 16, nextLine: true, discontinue: false, print: true },
  { name: 'SalesMan', text: 'Waiter:', size: 'BOLD-9', align: 'LEFT', length: 24, nextLine: false, discontinue: false, print: true },
  { name: 'Table', text: 'Table:', size: 'BOLD-9', align: 'RIGHT', length: 24, nextLine: true, discontinue: false, print: true },
  { name: 'ItemName', text: 'Item', size: 'BOLD-9', align: 'LEFT', length: 20, nextLine: false, discontinue: false, print: true },
  { name: 'Rate', text: 'Price', size: 'BOLD-9', align: 'RIGHT', length: 8, nextLine: false, discontinue: false, print: true },
  { name: 'Qty', text: 'Qty', size: 'BOLD-9', align: 'RIGHT', length: 6, nextLine: false, discontinue: false, print: true },
  { name: 'Amount', text: 'Total', size: 'BOLD-9', align: 'RIGHT', length: 10, nextLine: true, discontinue: false, print: true },
];
const DEFAULT_TEMPLATE = { id: 1, name: 'Default', isDefault: true, fields: DEFAULT_PRINT_FIELDS };

// Helper to get a template from localStorage with default fallback
function getStoredTemplate(storageKey, templateId) {
  try {
    const s = localStorage.getItem(storageKey);
    if (s) {
      const ts = JSON.parse(s);
      if (ts.length) {
        const found = ts.find(t => t.id === templateId) || ts[0];
        if (found && found.fields) return found;
      }
    }
  } catch { }
  return DEFAULT_TEMPLATE;
}

// ── Calc totals ──────────────────────────────────────────────
function calcTotals(items, discount = 0, reduction = 0, gstPct = GST_PCT, additionalCharges = []) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const extraCharges = additionalCharges.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const gstAmt = subtotal * (gstPct / 100);
  const cgstTotal = gstAmt / 2;
  const sgstTotal = gstAmt / 2;
  const gross = subtotal + gstAmt + extraCharges - discount - reduction;
  const roundOff = Math.round(gross) - gross;
  const net = Math.round(gross + roundOff);
  return { subtotal, gstPct, cgstTotal, sgstTotal, discount, reduction, extraCharges, roundOff, net };
}

// ── Empty bill factory ───────────────────────────────────────
let _slotCounter = 0;
const newBill = (type = 'dine_in') => {
  _slotCounter += 1;
  return {
    _key: _slotCounter, label: `Bill ${_slotCounter}`,
    type, table: '', waiter: '', items: [],
    discount: 0, reduction: 0, paymentMode: 'Cash',
    cashReceived: 0, savedId: null,
    additionalCharges: [],
    onlinePlatform: '', onlineOrderId: '',
    bookingDate: '', bookingNote: '', partyName: '', guestCount: '',
    advanceAmount: 0, advanceMode: 'Cash',
    salesMode: null, // Add salesMode field
  };
};

// ── Payment calculator modal ─────────────────────────────────
function PaymentModal({ bill, totals, onConfirm, onClose }) {
  const [mode, setMode] = useState(bill.paymentMode || 'Cash');
  const [received, setReceived] = useState('');
  const net = totals.net;
  const change = parseFloat(received || 0) - net;

  const suggestions = [net, Math.ceil(net / 10) * 10, Math.ceil(net / 50) * 50, Math.ceil(net / 100) * 100].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: C.surface, borderRadius: 20, width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ background: C.primary, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>💳 Payment</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 16, width: 30, height: 30 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 16, padding: 14, background: C.primaryBg, borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>NET AMOUNT</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: C.primary }}>₹{net.toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {PAY_MODES.map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${mode === m ? C.primary : C.border}`,
                background: mode === m ? C.primaryBg : C.surface, color: mode === m ? C.primary : C.textMuted,
                cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
              }}>{m === 'Cash' ? '💵' : m === 'UPI' ? '📱' : '💳'} {m}</button>
            ))}
          </div>

          {mode === 'Cash' && (
            <>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>Cash Received (₹)</label>
              <input type='number' value={received} onChange={e => setReceived(e.target.value)} placeholder={`Enter amount (min ₹${net})`} autoFocus
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', fontSize: 18, fontWeight: 700, border: `2px solid ${parseFloat(received || 0) < net && received ? C.danger : C.border}`, borderRadius: 10, outline: 'none', color: C.text, marginBottom: 10, textAlign: 'right' }}
                onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = parseFloat(received || 0) < net && received ? C.danger : C.border)} />
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => setReceived(String(s))} style={{ flex: 1, padding: '7px 4px', background: parseFloat(received) === s ? C.primary : C.surfaceAlt, color: parseFloat(received) === s ? '#fff' : C.text, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>₹{s}</button>
                ))}
              </div>
              {parseFloat(received || 0) > 0 && (
                <div style={{ padding: 12, borderRadius: 10, background: change >= 0 ? C.successBg : C.dangerBg, border: `1.5px solid ${change >= 0 ? C.success : C.danger}`, textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: change >= 0 ? C.success : C.danger, fontWeight: 600 }}>
                    {change > 0 ? '💚 CHANGE TO RETURN' : change === 0 ? '✅ EXACT AMOUNT' : '❌ INSUFFICIENT AMOUNT'}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: change >= 0 ? C.success : C.danger }}>₹{Math.abs(change).toFixed(2)}</div>
                </div>
              )}
            </>
          )}
          {(mode === 'UPI' || mode === 'Card') && (
            <div style={{ textAlign: 'center', padding: '16px 0', color: C.textMuted, fontSize: 13 }}>
              {mode === 'UPI' ? '📱 Scan QR or enter UPI ID' : '💳 Swipe / Tap card'}<br />
              <strong style={{ color: C.text, fontSize: 16 }}>₹{net.toFixed(2)}</strong>
            </div>
          )}

          <button
            disabled={mode === 'Cash' && (parseFloat(received || 0) < net)}
            onClick={() => onConfirm({ mode, cashReceived: parseFloat(received || net), changeReturned: Math.max(0, change) })}
            style={{ width: '100%', padding: 14, background: (mode === 'Cash' && parseFloat(received || 0) < net) ? C.border : C.success, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: (mode === 'Cash' && parseFloat(received || 0) < net) ? 'not-allowed' : 'pointer' }}>
            ✅ Confirm Payment · ₹{net.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Online Order Modal ───────────────────────────────────────
function OnlineOrderModal({ form, setForm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: C.surface, borderRadius: 16, width: 380, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: C.text }}>📱 Online Order Details</div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Platform</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['zomato', 'swiggy', 'other'].map(p => (
              <button key={p} onClick={() => setForm(f => ({ ...f, onlinePlatform: p }))} style={{ flex: 1, padding: '9px 4px', borderRadius: 8, border: `2px solid ${form.onlinePlatform === p ? C.primary : C.border}`, background: form.onlinePlatform === p ? C.primaryBg : C.surface, color: form.onlinePlatform === p ? C.primary : C.textMuted, cursor: 'pointer', fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>
                {p === 'zomato' ? '🔴' : p === 'swiggy' ? '🟠' : '📦'} {p}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Order ID</label>
          <input value={form.onlineOrderId} onChange={e => setForm(f => ({ ...f, onlineOrderId: e.target.value }))} placeholder='e.g. ZOM-123456'
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', color: C.text }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn label='Done' variant='primary' fullWidth onClick={onClose} />
          <Btn label='Cancel' variant='ghost' fullWidth onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

// ── Prebooking Modal ─────────────────────────────────────────
function PrebookingModal({ form, setForm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: C.surface, borderRadius: 16, width: 400, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: C.text }}>📅 Prebooking / Event Details</div>
        {[['Party / Customer Name', 'partyName', 'text'], ['Booking Date', 'bookingDate', 'date'], ['No. of Guests', 'guestCount', 'number'], ['Note / Occasion', 'bookingNote', 'text']].map(([l, k, t]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>{l}</label>
            <input type={t} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={l}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', color: C.text }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn label='Save' variant='primary' fullWidth onClick={onClose} />
          <Btn label='Cancel' variant='ghost' fullWidth onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

// ── Advance Bill Modal ───────────────────────────────────────
function AdvanceModal({ form, setForm, onClose, onSave }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: C.surface, borderRadius: 16, width: 380, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: C.text }}>💳 Advance Payment</div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Customer Name</label>
          <input value={form.partyName || ''} onChange={e => setForm(f => ({ ...f, partyName: e.target.value }))} placeholder='Customer / Party name'
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', color: C.text }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Advance Amount (₹)</label>
          <input type='number' value={form.advanceAmount || ''} onChange={e => setForm(f => ({ ...f, advanceAmount: parseFloat(e.target.value) || 0 }))} placeholder='0.00'
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 18, fontWeight: 700, outline: 'none', color: C.primary, textAlign: 'right' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Payment Mode</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PAY_MODES.map(m => (
              <button key={m} onClick={() => setForm(f => ({ ...f, advanceMode: m }))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${form.advanceMode === m ? C.primary : C.border}`, background: form.advanceMode === m ? C.primaryBg : C.surface, color: form.advanceMode === m ? C.primary : C.textMuted, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn label='Save Advance Bill' variant='warning' fullWidth onClick={onSave} />
          <Btn label='Cancel' variant='ghost' fullWidth onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

// ── View Today's Bills Drawer ─────────────────────────────────
function ViewBillsDrawer({ onClose, onReload, onEditBill, onPrintDuplicate }) {
  const { user, hasBillPermission } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const canEditBill = hasBillPermission('allowEditBill');
  const canCancelBill = hasBillPermission('allowBillCancel');
  const canDeleteBill = user?.role === 'admin' || user?.role === 'root';

  useEffect(() => {
    billsAPI.getAll({ today: 'true' })
      .then(r => { setBills(r.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleEditBill = (bill) => {
    onEditBill(bill);
    onClose();
  };

  const handleCancelBill = async (bill) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      await billsAPI.cancel(bill._id, reason);
      setBills(prev => prev.map(b => b._id === bill._id ? { ...b, status: 'cancelled', cancelReason: reason } : b));
      onReload?.();
    } catch (e) {
      alert(e.response?.data?.message || 'Cancel failed');
    }
  };

  const handleDeleteBill = async (bill) => {
    if (!canDeleteBill) return;
    if (deleting === bill._id) {
      try {
        await billsAPI.cancel(bill._id, 'Admin deleted');
        setBills(prev => prev.filter(b => b._id !== bill._id));
        onReload?.();
        setDeleting(null);
      } catch (e) {
        alert(e.response?.data?.message || 'Delete failed');
      }
    } else {
      setDeleting(bill._id);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 2000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 600, height: '100vh', background: '#fff', boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e' }}>📋 Today's Bills</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textMuted }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</div>
          ) : !bills.length ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textLight, fontSize: 14 }}>No bills today</div>
          ) : bills.map(b => (
            <div key={b._id} style={{ padding: '16px', border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 12, background: b.status === 'cancelled' ? C.dangerBg + '15' : '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>{b.billNo}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>KOT: {b.kotNo}</div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: b.status === 'cancelled' ? C.dangerBg : b.isEdited ? C.warningBg : C.successBg,
                  color: b.status === 'cancelled' ? C.danger : b.isEdited ? C.warning : C.success
                }}>
                  {b.status === 'cancelled' ? 'Cancelled' : b.isEdited ? 'Edited' : 'Billed'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                <span>🪑 <strong>{b.table || 'N/A'}</strong></span>
                <span>👨‍💼 <strong>{b.waiter || 'N/A'}</strong></span>
                <span>📦 <strong>{b.items?.length || 0} items</strong></span>
                <span>💳 <strong>{b.paymentMode}</strong></span>
                <span>📊 ₹{(b.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span style={{ fontWeight: 900, color: C.success }}>💰 ₹{(b.netAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {b.cancelReason && <div style={{ fontSize: 11, color: C.danger, marginBottom: 10 }}>❌ Reason: {b.cancelReason}</div>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { onPrintDuplicate?.(b); billsAPI.markDuplicated(b._id).catch(() => { }); onClose(); }} style={{ flex: 1, padding: '8px', background: C.successBg, color: C.success, border: `1px solid ${C.success}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  📑 Duplicate
                </button>
                {canEditBill && b.status !== 'cancelled' && (
                  <button onClick={() => handleEditBill(b)} style={{ flex: 1, padding: '8px', background: C.primaryBg, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ✏️ Edit
                  </button>
                )}
                {canCancelBill && b.status !== 'cancelled' && (
                  <button onClick={() => handleCancelBill(b)} style={{ flex: 1, padding: '8px', background: C.warningBg, color: C.warning, border: `1px solid ${C.warning}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ⚠️ Cancel
                  </button>
                )}
                {canDeleteBill && (
                  <button onClick={() => handleDeleteBill(b)} style={{ padding: '8px 12px', background: deleting === b._id ? C.danger : C.dangerBg, color: deleting === b._id ? '#fff' : C.danger, border: `1px solid ${C.danger}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {deleting === b._id ? '⚠️ Confirm?' : '🗑️ Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// DynamicReceiptRenderer is imported from ../components/common/DynamicReceiptRenderer

// ── Main BillingPage ─────────────────────────────────────────
export default function BillingPage() {
  const location = useLocation();
  const { hasPermission, user, userBranchId } = useAuth();
  const { lang } = useLanguage();
  const urlType = new URLSearchParams(location.search).get('type') || 'dine_in';

  // State declarations
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [company, setCompany] = useState(null);
  const [runningBills, setRunningBills] = useState([]);
  const [bills, setBills] = useState([newBill(urlType)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selGroup, setSelGroup] = useState('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [productCounts, setProductCounts] = useState({});

  // Sales mode related states
  const [salesModes, setSalesModes] = useState([]);
  const [showViewBills, setShowViewBills] = useState(false);
  const [productsWithRates, setProductsWithRates] = useState([]);

  // Measurement form modal
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [selectedProductForMeasurement, setSelectedProductForMeasurement] = useState(null);

  // Modals
  const [showPayment, setShowPayment] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const [showPrebook, setShowPrebook] = useState(false);
  const [showAdvance, setShowAdvance] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewRunningBill, setViewRunningBill] = useState(null);
  const [printBill, setPrintBill] = useState(null);
  const [printKotWithBill, setPrintKotWithBill] = useState(false); // Flag to print both KOT + Bill
  const [toast, setToast] = useState({ msg: '', type: 'info' });

  const codeRef = useRef(null);
  const bill = bills[activeIdx] || bills[0];
  const totals = calcTotals(bill.items, bill.discount, bill.reduction, GST_PCT, bill.additionalCharges || []);

  const notify = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'info' }), 3000);
  }, []);

  const upd = (field, val) => setBills(prev => prev.map((b, i) => i === activeIdx ? { ...b, [field]: val } : b));

  const canCreateBill = user?.role === 'root' || hasPermission('create-bill');
  const canViewRunningBills = user?.role === 'root' || hasPermission('billing-running');
  const canViewBilling = user?.role === 'root' || hasPermission('billing-view') || hasPermission('billing-running') || hasPermission('create-bill');
  const canAnybilling = canCreateBill || canViewBilling;

  // Load master data (use getBranchRates to include branch pricing overrides)
  useEffect(() => {
    Promise.all([
      masterAPI.getBranchRates(),
      masterAPI.getGroups(),
      masterAPI.getTables(),
      masterAPI.getWaiters().catch(() => ({ data: [] })),
      masterAPI.getCompany().catch(() => ({ data: null })),
      masterAPI.getDepartments().catch(() => ({ data: [] })),
    ]).then(([p, g, t, w, c, d]) => {
      // Build department lookup for populating names
      const deptMap = {};
      const depts = d.data || [];
      depts.forEach(dept => { deptMap[dept._id] = dept.name; });
      // Ensure products have departmentName populated
      // Also infer measurementType from department quantityFormat
      const unitToMeasurementType = (unit) => {
        if (!unit) return null;
        const u = unit.toLowerCase();
        if (['g', 'kg', 'gram', 'kilogram'].includes(u)) return 'KG/GM';
        if (['ml', 'l', 'litre', 'liter', 'millilitre'].includes(u)) return 'Litre/ML';
        if (['box'].includes(u)) return 'Box';
        if (['packet', 'pkt'].includes(u)) return 'Packet';
        return null;
      };
      const unitToBaseMeasurement = (unit) => {
        if (!unit) return 'Piece';
        const u = unit.toLowerCase();
        if (['g', 'kg', 'gram', 'kilogram'].includes(u)) return 'KG';
        if (['ml', 'l', 'litre', 'liter', 'millilitre'].includes(u)) return 'Litre';
        if (['box'].includes(u)) return 'Box';
        if (['packet', 'pkt'].includes(u)) return 'Packet';
        return 'Piece';
      };

      // Build department lookup including quantityFormat
      const deptLookup = {};
      depts.forEach(dept => { deptLookup[dept._id] = dept; });

      const prods = (p.data || []).map(prod => {
        const dept = prod.department ? deptLookup[prod.department] || deptLookup[typeof prod.department === 'object' ? prod.department._id : prod.department] : null;
        const deptName = prod.departmentName || (dept ? dept.name : '') || '';
        const deptUnit = dept ? dept.quantityFormat : null;
        // Infer measurementType from department's quantityFormat if product doesn't have one
        const inferredMeasurement = !prod.measurementType || prod.measurementType === 'Piece'
          ? unitToMeasurementType(prod.unitName) || unitToMeasurementType(deptUnit)
          : null;
        // Normalize department to string ID for filtering
        const deptId = typeof prod.department === 'object' && prod.department !== null
          ? prod.department._id
          : prod.department;
        return {
          ...prod,
          department: deptId,
          departmentName: deptName,
          measurementType: prod.measurementType || inferredMeasurement || null,
          baseMeasurement: prod.baseMeasurement || (inferredMeasurement ? unitToBaseMeasurement(deptUnit || prod.unitName) : 'Piece'),
          pricePerUnit: prod.pricePerUnit || prod.rate || 0,
        };
      });
      setProducts(prods);
      setProductsWithRates(prods);
      setGroups([{ name: 'ALL' }, ...g.data]);
      setDepartments(depts);
      setTables(t.data);
      setWaiters(w.data || []);
      setCompany(c.data);

      // Calculate product counts by department
      const counts = {};
      depts.forEach(dept => {
        counts[dept._id] = prods.filter(p => p.department === dept._id).length;
      });
      setProductCounts(counts);
    }).catch(() => { });
    loadRunning();
  }, []);

  // Load sales modes
  useEffect(() => {
    masterAPI.getSalesModes()
      .then(r => {
        const modes = r.data || [];
        setSalesModes(modes);
        if (modes.length > 0) {
          setBills(prev => prev.map((b, i) => {
            if (i === 0 && !b.salesMode) {
              // Respect the URL type parameter (e.g. ?type=parcel) instead of always defaulting to dine_in
              const defaultMode = modes.find(m => m.type === b.type) || modes.find(m => m.type === 'dine_in') || modes[0];
              return { ...b, salesMode: defaultMode._id, type: defaultMode.type };
            }
            return b;
          }));
        }
      })
      .catch(() => { });
  }, []);

  // Update product rates when sales mode or branch changes
  useEffect(() => {
    if (products.length > 0 && bill.salesMode) {
      const updatedProducts = updateProductsRatesBySalesMode(products, bill.salesMode, userBranchId);
      setProductsWithRates(updatedProducts);
    } else if (products.length > 0 && userBranchId) {
      // Even without sales mode, apply branch base rates if available
      const updatedProducts = updateProductsRatesBySalesMode(products, null, userBranchId);
      setProductsWithRates(updatedProducts);
    } else {
      setProductsWithRates(products);
    }
  }, [bill.salesMode, products, userBranchId]);

  const loadRunning = async () => {
    try { const r = await billsAPI.getAll({ status: 'kot_saved' }); setRunningBills(r.data); } catch { }
  };

  const handleTableSelect = (tableName) => {
    upd('table', tableName);
    if (tableName) {
      const rb = runningBills.find(r => r.table === tableName);
      if (rb) {
        setBills(prev => prev.map((b, i) => i !== activeIdx ? b : {
          ...b, table: tableName, waiter: rb.waiter || b.waiter,
          items: rb.items.map(it => ({ ...it })), discount: rb.discount || 0, reduction: rb.reduction || 0, savedId: rb._id,
        }));
        notify(`Loaded running bill for ${tableName}`, 'info');
      }
    }
  };

  // Add item with sales mode rate
  const addItem = (product) => {
    // If product has measurement-based pricing, show measurement form
    if (product.measurementType && product.measurementType !== 'Piece') {
      setSelectedProductForMeasurement(product);
      setShowMeasurementForm(true);
      return;
    }

    // Otherwise, add directly for piece-based items
    setBills(prev => prev.map((b, i) => {
      if (i !== activeIdx) return b;

      // Get the current rate based on sales mode + branch
      const currentRate = product.currentRate || getProductRateBySalesMode(product, b.salesMode, userBranchId);

      const idx = b.items.findIndex(it => it.productCode === product.code);
      const items = idx >= 0
        ? b.items.map((it, j) => j === idx ? { ...it, qty: it.qty + 1, amount: (it.qty + 1) * currentRate } : it)
        : [...b.items, {
          productCode: product.code,
          productName: getProductName(product, lang),
          rate: currentRate,
          qty: 1,
          amount: currentRate,
          group: product.groupName,
          department: product.departmentName || '',
          imageUrl: product.imageUrl || ''
        }];
      return { ...b, items };
    }));
  };

  const handleAddMeasurementItem = (item) => {
    setBills(prev => prev.map((b, i) => {
      if (i !== activeIdx) return b;

      const idx = b.items.findIndex(it => it.productCode === item.productCode);
      const items = idx >= 0
        ? b.items.map((it, j) => j === idx ? { ...it, qty: it.qty + item.qty, amount: it.amount + item.amount } : it)
        : [...b.items, item];
      return { ...b, items };
    }));
  };

  const updateQty = (code, delta) => {
    setBills(prev => prev.map((b, i) => {
      if (i !== activeIdx) return b;
      const items = b.items.map(it => {
        if (it.productCode !== code) return it;
        const q = it.qty + delta;
        return q <= 0 ? null : { ...it, qty: q, amount: q * it.rate };
      }).filter(Boolean);
      return { ...b, items };
    }));
  };

  const handleCodeEnter = (e) => {
    if (e.key !== 'Enter') return;
    const val = e.target.value.trim();
    const p = products.find(p => p.code === val || p.name.toLowerCase() === val.toLowerCase());
    if (p) { addItem(p); e.target.value = ''; } else notify(`"${val}" not found`, 'error');
  };

  const handleKOTSave = async (printBothOverride) => {
    const isPrintBoth = typeof printBothOverride === 'boolean' ? printBothOverride : (bill.type !== 'dine_in');
    if (!bill.items.length) return notify('Add items first', 'error');
    setLoading(true);
    try {
      const data = { ...totals, ...buildBillPayload(), status: 'kot_saved' };
      let saved;
      if (bill.savedId) {
        const r = await billsAPI.update(bill.savedId, data);
        saved = r.data;
        notify('KOT Updated ✓', 'success');
      } else {
        const r = await billsAPI.create(data);
        saved = r.data;
        upd('savedId', r.data._id);
        notify(`KOT Saved — ${r.data.kotNo}`, 'success');
      }

      if (isPrintBoth) {
        setPrintKotWithBill(true);
        setPrintBill(saved);
      } else {
        setShowKOTPrint(saved);
      }

      loadRunning();
    } catch (e) { notify(e.response?.data?.message || 'Error', 'error'); }
    finally { setLoading(false); }
  };

  const handleFinalBill = () => {
    if (!bill.items.length) return notify('Add items first', 'error');
    setShowPayment(true);
  };

  const buildBillPayload = () => ({
    table: bill.table,
    waiter: bill.waiter,
    items: bill.items,
    paymentMode: bill.paymentMode,
    billType: bill.type,
    salesMode: bill.salesMode,
    onlinePlatform: bill.onlinePlatform,
    onlineOrderId: bill.onlineOrderId,
    bookingDate: bill.bookingDate,
    bookingNote: bill.bookingNote,
    partyName: bill.partyName,
    guestCount: bill.guestCount,
    advanceAmount: bill.advanceAmount,
    advanceMode: bill.advanceMode,
    additionalCharges: bill.additionalCharges || [],
    extraCharges: (bill.additionalCharges || []).reduce((s, ch) => s + (parseFloat(ch.amount) || 0), 0),
  });

  const confirmPayment = async ({ mode, cashReceived, changeReturned }) => {
    setShowPayment(false);
    setLoading(true);
    try {
      const t = calcTotals(bill.items, bill.discount, bill.reduction);
      const data = { ...t, ...buildBillPayload(), paymentMode: mode, cashReceived, changeReturned, status: 'billed' };
      let saved;
      if (bill.savedId) { const r = await billsAPI.update(bill.savedId, data); saved = r.data; }
      else { const r = await billsAPI.create(data); saved = r.data; }
      setPrintBill(saved);
      clearBill();
      loadRunning();
      notify('Bill Saved ✓', 'success');
    } catch (e) { notify(e.response?.data?.message || 'Error', 'error'); }
    finally { setLoading(false); }
  };

  const saveAdvanceBill = async () => {
    setShowAdvance(false);
    setLoading(true);
    try {
      const data = { ...calcTotals(bill.items, bill.discount, bill.reduction), ...buildBillPayload(), billType: 'advance', status: 'billed' };
      const r = await billsAPI.create(data);
      setPrintBill(r.data);
      clearBill();
      notify('Advance Bill Saved ✓', 'success');
    } catch (e) { notify(e.response?.data?.message || 'Error', 'error'); }
    finally { setLoading(false); }
  };

  const clearBill = () => {
    setBills(prev => prev.map((b, i) => i === activeIdx ? {
      ...b, items: [], table: '', waiter: '', discount: 0, reduction: 0, savedId: null,
      onlinePlatform: '', onlineOrderId: '', advanceAmount: 0, partyName: '',
      bookingDate: '', bookingNote: '', guestCount: ''
    } : b));
  };

  const loadRunningIntoSlot = (rb) => {
    setBills(prev => prev.map((b, i) => i !== activeIdx ? b : {
      ...b, table: rb.table, waiter: rb.waiter || '', items: rb.items.map(it => ({ ...it })),
      discount: rb.discount || 0, reduction: rb.reduction || 0, savedId: rb._id,
    }));
    notify(`Loaded ${rb.table} for editing`, 'info');
  };

  const deleteRunning = async (id) => {
    try {
      await billsAPI.cancel(id, 'Deleted');
      loadRunning();
      setBills(prev => prev.map(b => b.savedId === id ? { ...b, items: [], table: '', waiter: '', savedId: null } : b));
      notify('Deleted', 'info');
    } catch { notify('Error', 'error'); }
    setConfirmDel(null);
  };

  // Build set of department IDs marked as "separateInBilling"
  const separateDeptIds = new Set(departments.filter(d => d.separateInBilling).map(d => d._id));

  const filteredProducts = productsWithRates.filter(p => {
    const mg = selGroup === 'ALL' || p.groupName === selGroup;
    const md = !selectedDeptId || p.department === selectedDeptId;
    // When "All" is selected, hide products from departments marked separateInBilling
    const mSep = selectedDeptId || !separateDeptIds.has(p.department);
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search);
    return mg && md && mSep && ms;
  });

  const toastStyle = { success: { bg: C.successBg, color: C.success }, error: { bg: C.dangerBg, color: C.danger }, info: { bg: C.primaryBg, color: C.primary } }[toast.type] || { bg: C.primaryBg, color: C.primary };
  const typeBadge = { dine_in: '🍽️ Dine-In', takeaway: '📦 Takeaway', parcel: '📦 Parcel', delivery: '🚚 Delivery', online: '📱 Online', prebooking: '📅 Prebook', advance: '💳 Advance' };

  // Read available print templates from localStorage (set by OptionsPage > Sales Printer)
  const availableTemplates = (() => {
    try { const s = localStorage.getItem('printTemplates'); if (s) { const t = JSON.parse(s); if (t.length) return t; } } catch { }
    return [{ id: 1, name: 'Template 1' }, { id: 2, name: 'Template 2' }];
  })();
  const [receiptTemplate, setReceiptTemplate] = useState(() => parseInt(localStorage.getItem('salesPrinter_activeTemplate')) || availableTemplates[0]?.id || 1);
  const [showKOTPrint, setShowKOTPrint] = useState(null);

  const cycleReceiptTemplate = () => {
    const ids = availableTemplates.map(t => t.id);
    const curIdx = ids.indexOf(receiptTemplate);
    const nextIdx = (curIdx + 1) % ids.length;
    setReceiptTemplate(ids[nextIdx]);
    localStorage.setItem('salesPrinter_activeTemplate', ids[nextIdx]);
  };
  const currentTemplateName = availableTemplates.find(t => t.id === receiptTemplate)?.name || `Template ${receiptTemplate}`;

  const availableKotTemplates = (() => {
    try { const s = localStorage.getItem('kotTemplates'); if (s) { const t = JSON.parse(s); if (t.length) return t; } } catch { }
    return [{ id: 1, name: 'Template 1' }, { id: 2, name: 'Template 2' }];
  })();

  const [kotTemplate, setKotTemplate] = useState(() => parseInt(localStorage.getItem('salesPrinter_activeKotTemplate')) || availableKotTemplates[0]?.id || 1);
  const cycleKotTemplate = () => {
    const ids = availableKotTemplates.map(t => t.id);
    const curIdx = ids.indexOf(kotTemplate);
    const nextIdx = (curIdx + 1) % ids.length;
    setKotTemplate(ids[nextIdx]);
    localStorage.setItem('salesPrinter_activeKotTemplate', ids[nextIdx]);
  };
  const currentKotTemplateName = availableKotTemplates.find(t => t.id === kotTemplate)?.name || `Template ${kotTemplate}`;

  const getUserPermissions = () => {
    const perms = [];
    if (user?.role === 'root') {
      perms.push({ icon: '🎛️', label: 'Full System Access', desc: 'All features enabled' });
    } else if (user?.menuAccess?.length > 0) {
      const menuMap = {
        'dashboard': { icon: '📊', label: 'Dashboard', desc: 'View sales overview' },
        'billing-running': { icon: '📝', label: 'Running Bills', desc: 'Create and manage bills' },
        'billing-view': { icon: '👁️', label: 'View Bills', desc: 'View bill history' },
        'billing-cash': { icon: '💵', label: 'Cash Entry', desc: 'Record cash transactions' },
        'master-products': { icon: '📦', label: 'Products', desc: 'Manage product catalog' },
        'master-company': { icon: '🏢', label: 'Company', desc: 'Company information' },
        'reports-sales': { icon: '📈', label: 'Sales Reports', desc: 'Sales analytics' },
        'users-menu-access': { icon: '👥', label: 'User Management', desc: 'Manage user access' },
      };
      user.menuAccess.forEach(access => {
        const menu = menuMap[access];
        if (menu) perms.push({ ...menu, id: access });
      });
    }
    return perms;
  };

  if (!canAnybilling) {
    const permissions = getUserPermissions();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: C.bg, padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Access Restricted</div>
          <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 24 }}>You don't have permission to access billing operations.</div>
          {permissions.length > 0 && (
            <div style={{ background: C.surface, borderRadius: 12, padding: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 12, textTransform: 'uppercase' }}>Your Permissions:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {permissions.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 20, marginTop: 2 }}>{p.icon}</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!canCreateBill && canViewBilling) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
        <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 2 }}>📋 Running Bills</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>View only - You don't have permission to create or modify bills</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {runningBills.length > 0 ? runningBills.map((bill, idx) => (
              <div key={idx} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>KOT #{bill.kotNo}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Bill #{bill.billNo}</div>
                  </div>
                  <div style={{ background: C.primaryBg, color: C.primary, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{typeBadge[bill.billType] || 'Standard'}</div>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                  <div>🪑 Table: {bill.table || 'N/A'}</div>
                  <div>👨‍💼 Waiter: {bill.waiter || 'N/A'}</div>
                  <div>📅 {new Date(bill.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 6 }}>Items ({bill.items?.length || 0})</div>
                  {bill.items?.slice(0, 3).map((item, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.text, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.productName}</span>
                      <span style={{ color: C.textMuted }}>×{item.qty}</span>
                    </div>
                  ))}
                  {bill.items?.length > 3 && <div style={{ fontSize: 11, color: C.primary, fontWeight: 700 }}>+{bill.items.length - 3} more...</div>}
                </div>
                <div style={{ background: C.primaryBg, padding: 10, borderRadius: 8, textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Recent Total</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.primary }}>₹{(bill.net || bill.subtotal || 0).toFixed(2)}</div>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: C.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
                <div style={{ fontSize: 14 }}>No running bills at the moment</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: C.bg, position: 'relative', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {toast.msg && (
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: toastStyle.bg, color: toastStyle.color, border: `1.5px solid ${toastStyle.color}`, padding: '8px 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 24, width: 300, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: C.text }}>Delete Bill?</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 18 }}>Table {confirmDel.table} — ₹{confirmDel.netAmount}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn label='Delete' variant='danger' fullWidth onClick={() => deleteRunning(confirmDel._id)} />
              <Btn label='Cancel' variant='ghost' fullWidth onClick={() => setConfirmDel(null)} />
            </div>
          </div>
        </div>
      )}

      {showPayment && <PaymentModal bill={bill} totals={totals} onConfirm={confirmPayment} onClose={() => setShowPayment(false)} />}
      {showOnline && <OnlineOrderModal form={bill} setForm={(fn) => setBills(prev => prev.map((b, i) => i === activeIdx ? fn(b) : b))} onClose={() => setShowOnline(false)} />}
      {showPrebook && <PrebookingModal form={bill} setForm={(fn) => setBills(prev => prev.map((b, i) => i === activeIdx ? fn(b) : b))} onClose={() => setShowPrebook(false)} />}
      {showAdvance && <AdvanceModal form={bill} setForm={(fn) => setBills(prev => prev.map((b, i) => i === activeIdx ? fn(b) : b))} onClose={() => setShowAdvance(false)} onSave={saveAdvanceBill} />}

      {/* Measurement Item Form Modal */}
      {showMeasurementForm && selectedProductForMeasurement && (
        <MeasurementItemForm
          product={selectedProductForMeasurement}
          onAdd={handleAddMeasurementItem}
          onClose={() => {
            setShowMeasurementForm(false);
            setSelectedProductForMeasurement(null);
          }}
          userBranchId={userBranchId}
          getProductRate={getProductRateBySalesMode}
        />
      )}

      {/* KOT Print Modal */}
      {showKOTPrint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: C.surface, borderRadius: 20, width: 360, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, flexWrap: 'nowrap' }}>
              <span style={{ fontWeight: 700, fontSize: 15, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📋 KOT Print</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <button onClick={cycleKotTemplate} style={{ padding: '3px 10px', borderRadius: 20, border: `1.5px solid ${C.secondary}`, background: C.secondaryBg, color: C.secondary, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>{currentKotTemplateName}</button>
                <span style={{ padding: '3px 10px', borderRadius: 20, border: `1.5px solid ${C.primary}`, background: C.primaryBg, color: C.primary, fontSize: 10, fontWeight: 700 }}>{templateVariant.toUpperCase()}</span>
                <button onClick={() => setShowKOTPrint(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.textMuted }}>✕</button>
              </div>
            </div>
            <div id='kot-print-area' style={{ minHeight: 300, background: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
              <DynamicReceiptRenderer
                tpl={getStoredTemplate('kotTemplates', kotTemplate)}
                data={showKOTPrint} isKot={true} company={company}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C.border}` }}>
              <Btn label='🖨 Print KOT' variant='warning' fullWidth onClick={() => {
                const el = document.getElementById('kot-print-area');
                const html = `<html><head><style>
                  body { margin: 0; padding: 10px; display: flex; justify-content: center; background: #f0f0f0; }
                  #print-content { width: 80mm; background: #fff; color: #000; padding: 10px; font-family: 'Courier New', Courier, monospace; }
                  @media print { body { background: #fff; padding: 0; } #print-content { width: 100%; padding: 0; box-shadow: none; border: none; } }
                </style></head><body><div id="print-content">${el.innerHTML}</div></body></html>`;
                if (window.electronAPI?.printReceipt) {
                  let printerName = '';
                  try { const pConf = JSON.parse(localStorage.getItem('printerConfig_kot')); if (pConf?.win) printerName = pConf.win; } catch { }
                  window.electronAPI.printReceipt(html, printerName).catch(console.error);
                } else {
                  const w = window.open('', '', 'width=380,height=600');
                  if (!w) { alert('Popup blocked! Please allow popups for this site.'); return; }
                  w.document.write(html);
                  w.document.close(); setTimeout(() => { w.print(); w.close(); }, 500);
                }
              }} />
              <Btn label='Close' variant='ghost' fullWidth onClick={() => setShowKOTPrint(null)} />
            </div>
          </div>
        </div>
      )}

      {printBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: C.surface, borderRadius: 20, width: printKotWithBill ? 780 : 400, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', transition: 'width 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, flexWrap: 'nowrap' }}>
              <span style={{ fontWeight: 700, fontSize: 15, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{printKotWithBill ? '🧾 Bill + 📋 KOT Print' : '🧾 Bill Print'}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <button onClick={cycleReceiptTemplate} style={{ padding: '3px 10px', paddingLeft: '10px', borderRadius: 20, border: `1.5px solid ${C.secondary}`, background: C.secondaryBg, color: C.secondary, cursor: 'pointer', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{currentTemplateName}</button>
                {printKotWithBill && <button onClick={cycleKotTemplate} style={{ padding: '3px 10px', paddingLeft: '10px', borderRadius: 20, border: `1.5px solid #E65100`, background: '#FFF3E0', color: '#E65100', cursor: 'pointer', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>KOT: {currentKotTemplateName}</button>}
                <span style={{ padding: '3px 10px', paddingLeft: '10px', borderRadius: 20, border: `1.5px solid ${C.primary}`, background: C.primaryBg, color: C.primary, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{templateVariant.toUpperCase()}</span>
                <button onClick={() => { setPrintBill(null); setPrintKotWithBill(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.textMuted }}>✕</button>
              </div>
            </div>
            <div style={{ gap: printKotWithBill ? 0 : undefined }}>
              {/* Bill Receipt */}
              <div style={{ flex: printKotWithBill ? 1 : undefined, borderRight: printKotWithBill ? `1px solid ${C.border}` : undefined }}>
                {printKotWithBill && <div style={{ textAlign: 'center', padding: '8px', background: C.primaryBg, fontWeight: 700, fontSize: 12, color: C.primary, borderBottom: `1px solid ${C.border}` }}>🧾 BILL RECEIPT</div>}
                <div id='receipt-area' style={{ minHeight: 300, background: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
                  <DynamicReceiptRenderer
                    tpl={getStoredTemplate('printTemplates', receiptTemplate)}
                    data={printBill} isKot={false} company={company}
                  />
                </div>
              </div>
              {/* KOT Receipt (shown when KOT+Bill) */}
              {printKotWithBill && (
                <div style={{ flex: 1 }}>
                  <div style={{ textAlign: 'center', padding: '8px', background: '#FFF3E0', fontWeight: 700, fontSize: 12, color: '#E65100', borderBottom: `1px solid ${C.border}` }}>📋 KOT RECEIPT</div>
                  <div id='kot-print-area-combo' style={{ minHeight: 300, background: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
                    <DynamicReceiptRenderer
                      tpl={getStoredTemplate('kotTemplates', kotTemplate)}
                      data={printBill} isKot={true} company={company}
                    />
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C.border}`, flexWrap: 'nowrap' }}>
              {printKotWithBill ? (
                <>
                  <Btn label='🖨 Print Both' variant='primary' fullWidth onClick={() => {
                    const billEl = document.getElementById('receipt-area');
                    const kotEl = document.getElementById('kot-print-area-combo');
                    if (!billEl || !kotEl) return;
                    if (window.electronAPI?.printReceipt) {
                      // Electron: send to separate printers
                      const makePrintHtml = (innerHTML) => `<html><head><style>
                        body { margin: 0; padding: 10px; display: flex; justify-content: center; background: #f0f0f0; }
                        #print-content { width: 80mm; background: #fff; color: #000; padding: 10px; font-family: 'Courier New', Courier, monospace; }
                        @media print { body { background: #fff; padding: 0; } #print-content { width: 100%; padding: 0; box-shadow: none; border: none; } }
                      </style></head><body><div id="print-content">${innerHTML}</div></body></html>`;
                      let billPrinter = '', kotPrinter = '';
                      try { const p = JSON.parse(localStorage.getItem('printerConfig_sales')); if (p?.win) billPrinter = p.win; } catch { }
                      try { const p = JSON.parse(localStorage.getItem('printerConfig_kot')); if (p?.win) kotPrinter = p.win; } catch { }
                      window.electronAPI.printReceipt(makePrintHtml(billEl.innerHTML), billPrinter).catch(console.error);
                      setTimeout(() => window.electronAPI.printReceipt(makePrintHtml(kotEl.innerHTML), kotPrinter).catch(console.error), 500);
                    } else {
                      // Browser: combine both into single print window with page break
                      const html = `<html><head><style>
                        body { margin: 0; padding: 0; background: #fff; }
                        .receipt-section { width: 80mm; margin: 0 auto; padding: 10px; font-family: 'Courier New', Courier, monospace; color: #000; background: #fff; }
                        .page-break { page-break-after: always; margin: 0; }
                        @media print { body { background: #fff; } .receipt-section { width: 100%; padding: 0; } }
                      </style></head><body>
                        <div class="receipt-section">${billEl.innerHTML}</div>
                        <div class="page-break"></div>
                        <div class="receipt-section">${kotEl.innerHTML}</div>
                      </body></html>`;
                      const w = window.open('', '', 'width=380,height=800');
                      if (!w) { alert('Popup blocked! Please allow popups for this site.'); return; }
                      w.document.write(html);
                      w.document.close();
                      setTimeout(() => { w.print(); w.close(); }, 500);
                    }
                  }} />
                  <Btn label='🧾 Bill Only' variant='secondary' onClick={() => {
                    const el = document.getElementById('receipt-area');
                    const html = `<html><head><style>
                      body { margin: 0; padding: 10px; display: flex; justify-content: center; background: #f0f0f0; }
                      #print-content { width: 80mm; background: #fff; color: #000; padding: 10px; font-family: 'Courier New', Courier, monospace; }
                      @media print { body { background: #fff; padding: 0; } #print-content { width: 100%; padding: 0; box-shadow: none; border: none; } }
                    </style></head><body><div id="print-content">${el.innerHTML}</div></body></html>`;
                    if (window.electronAPI?.printReceipt) {
                      let printerName = '';
                      try { const pConf = JSON.parse(localStorage.getItem('printerConfig_sales')); if (pConf?.win) printerName = pConf.win; } catch { }
                      window.electronAPI.printReceipt(html, printerName).catch(console.error);
                    } else {
                      const w = window.open('', '', 'width=380,height=600');
                      if (!w) { alert('Popup blocked! Please allow popups for this site.'); return; }
                      w.document.write(html);
                      w.document.close(); setTimeout(() => { w.print(); w.close(); }, 500);
                    }
                  }} />
                  <Btn label='📋 KOT Only' variant='warning' onClick={() => {
                    const el = document.getElementById('kot-print-area-combo');
                    const html = `<html><head><style>
                      body { margin: 0; padding: 10px; display: flex; justify-content: center; background: #f0f0f0; }
                      #print-content { width: 80mm; background: #fff; color: #000; padding: 10px; font-family: 'Courier New', Courier, monospace; }
                      @media print { body { background: #fff; padding: 0; } #print-content { width: 100%; padding: 0; box-shadow: none; border: none; } }
                    </style></head><body><div id="print-content">${el.innerHTML}</div></body></html>`;
                    if (window.electronAPI?.printReceipt) {
                      let printerName = '';
                      try { const pConf = JSON.parse(localStorage.getItem('printerConfig_kot')); if (pConf?.win) printerName = pConf.win; } catch { }
                      window.electronAPI.printReceipt(html, printerName).catch(console.error);
                    } else {
                      const w = window.open('', '', 'width=380,height=600');
                      if (!w) { alert('Popup blocked! Please allow popups for this site.'); return; }
                      w.document.write(html);
                      w.document.close(); setTimeout(() => { w.print(); w.close(); }, 500);
                    }
                  }} />
                </>
              ) : (
                <Btn label='🖨 Print' variant='primary' fullWidth onClick={() => {
                  const el = document.getElementById('receipt-area');
                  const html = `<html><head><style>
                    body { margin: 0; padding: 10px; display: flex; justify-content: center; background: #f0f0f0; }
                    #print-content { width: 80mm; background: #fff; color: #000; padding: 10px; font-family: 'Courier New', Courier, monospace; }
                    @media print { body { background: #fff; padding: 0; } #print-content { width: 100%; padding: 0; box-shadow: none; border: none; } }
                  </style></head><body><div id="print-content">${el.innerHTML}</div></body></html>`;
                  if (window.electronAPI?.printReceipt) {
                    let printerName = '';
                    try { const pConf = JSON.parse(localStorage.getItem('printerConfig_sales')); if (pConf?.win) printerName = pConf.win; } catch { }
                    window.electronAPI.printReceipt(html, printerName).catch(console.error);
                  } else {
                    const w = window.open('', '', 'width=380,height=600');
                    if (!w) { alert('Popup blocked! Please allow popups for this site.'); return; }
                    w.document.write(html);
                    w.document.close(); setTimeout(() => { w.print(); w.close(); }, 500);
                  }
                }} />
              )}
              <Btn label='Close' variant='ghost' onClick={() => { setPrintBill(null); setPrintKotWithBill(false); }} />
            </div>
          </div>
        </div>
      )}

      {/* LEFT: Bill Panel */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, background: C.surface }}>
        {company?.name && (
          <div style={{ textAlign: 'center', padding: '4px 0', background: C.primary, color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
            {company.langName || company.name}
          </div>
        )}

        <div style={{ display: 'flex', background: C.surfaceAlt, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
          {bills.map((b, i) => {
            const tabLabel = b.type !== 'dine_in' ? (typeBadge[b.type] || b.type) : (b.table ? `🍽 ${b.table}` : `#${i + 1}`);
            return (
              <button key={b._key} onClick={() => setActiveIdx(i)} style={{ flex: '0 0 auto', padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: activeIdx === i ? C.primary : 'transparent', color: activeIdx === i ? '#fff' : C.textMuted, borderBottom: activeIdx === i ? `2px solid ${C.primaryDark}` : '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.15s', borderRadius: activeIdx === i ? '8px 8px 0 0' : 0 }}>
                {tabLabel}{b.items.length > 0 ? ` · ₹${calcTotals(b.items, b.discount, b.reduction).net}` : ''}
              </button>
            );
          })}
          {bills.length < MAX_BILLS && (
            <button onClick={() => { setBills(prev => [...prev, newBill()]); setActiveIdx(bills.length); }} style={{ padding: '8px 12px', border: 'none', cursor: 'pointer', background: 'transparent', color: C.textMuted, fontSize: 16 }} title='Add new bill tab'>＋</button>
          )}
          {bills.length >= MAX_BILLS && (
            <span style={{ padding: '8px 12px', fontSize: 10, color: C.textLight, alignSelf: 'center' }}>Max {MAX_BILLS}</span>
          )}
        </div>

        {/* Sales Mode Selector */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', alignItems: 'center' }}>
          {salesModes.map(mode => (
            <button
              key={mode._id}
              onClick={() => {
                setBills(prev => prev.map((b, i) => {
                  if (i !== activeIdx) return b;
                  // Recalculate existing item rates for the new sales mode
                  const updatedItems = b.items.map(it => {
                    const product = products.find(p => p.code === it.productCode);
                    if (product) {
                      const newRate = getProductRateBySalesMode(product, mode._id);
                      return { ...it, rate: newRate, amount: newRate * it.qty };
                    }
                    return it;
                  });
                  return { ...b, salesMode: mode._id, type: mode.type, items: updatedItems };
                }));
              }}
              style={{
                padding: '4px 9px',
                borderRadius: 20,
                border: `1.5px solid ${bill.salesMode === mode._id ? C.primary : C.border}`,
                background: bill.salesMode === mode._id ? C.primaryBg : 'transparent',
                color: bill.salesMode === mode._id ? C.primary : C.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
            >
              {mode.type === 'dine_in' ? '🍽️' : mode.type === 'parcel' ? '📦' : mode.type === 'delivery' ? '🚚' : '📱'} {mode.name}
            </button>
          ))}

          {/* View Bills Button */}
          <button
            onClick={() => setShowViewBills(true)}
            style={{
              marginLeft: 'auto',
              padding: '4px 12px',
              borderRadius: 20,
              border: `1.5px solid ${C.primary}`,
              background: C.primaryBg,
              color: C.primary,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700
            }}
          >
            📋 View Today's Bills
          </button>
        </div>

        {/* Table / Waiter / Code */}
        <div style={{ display: 'flex', gap: 6, padding: '7px 8px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexWrap: 'wrap' }}>
          {(bill.type === 'dine_in' || bill.type === 'parcel') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{bill.type === 'dine_in' ? 'TABLE' : 'PARCEL'}</span>
              <select value={bill.table} onChange={e => handleTableSelect(e.target.value)}
                style={{ padding: '4px 6px', fontSize: 12, border: `1.5px solid ${bill.table ? C.primary : C.border}`, borderRadius: 6, background: bill.table ? C.primaryBg : C.surface, color: bill.table ? C.primary : C.text, fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
                <option value=''>—Select</option>
                {[1, 2, 3, 4, 5].map(v => {
                  const tName = (bill.type === 'dine_in' ? 'D-' : 'P-') + v;
                  const has = runningBills.some(rb => rb.table === tName && rb.savedId !== bill.savedId);
                  return <option key={tName} value={tName}>{tName}{has ? ' 🔴' : ''}</option>;
                })}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>WAITER</span>
            <select value={bill.waiter} onChange={e => upd('waiter', e.target.value)}
              style={{ padding: '4px 6px', fontSize: 12, border: `1.5px solid ${C.border}`, borderRadius: 6, outline: 'none', cursor: 'pointer', color: C.text, minWidth: 80 }}>
              <option value=''>—Waiter</option>
              {waiters.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
            </select>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>CODE</span>
            <input ref={codeRef} placeholder='Scan / Enter' onKeyDown={handleCodeEnter}
              style={{ padding: '4px 8px', fontSize: 12, border: `1.5px solid ${C.border}`, borderRadius: 6, outline: 'none', width: 130, color: C.text }}
              onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: C.surfaceAlt, borderBottom: `2px solid ${C.border}` }}>
                {['#', 'Item', 'Rate', 'Qty', 'Amt', ''].map((h, j) => (
                  <th key={j} style={{ padding: '6px 7px', textAlign: j >= 2 ? 'center' : 'left', fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bill.items.map((it, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.surfaceAlt }}>
                  <td style={{ padding: '6px 7px', color: C.textLight, width: 22, fontSize: 10 }}>{i + 1}</td>
                  <td style={{ padding: '6px 7px', color: C.text, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {it.imageUrl && <img src={it.imageUrl} alt='' style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                      <span style={{ wordBreak: 'break-word', lineHeight: 1.3 }}>{it.productName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '6px 7px', color: C.textMuted, textAlign: 'center' }}>₹{it.rate}</td>
                  <td style={{ padding: '4px 7px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <button onClick={() => updateQty(it.productCode, -1)} style={{ width: 20, height: 20, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', background: C.surface, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700 }}>{it.qty}</span>
                      <button onClick={() => updateQty(it.productCode, 1)} style={{ width: 20, height: 20, border: `1px solid ${C.primary}`, borderRadius: 4, cursor: 'pointer', background: C.primaryBg, color: C.primary, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </td>
                  <td style={{ padding: '6px 7px', textAlign: 'center', fontWeight: 700, color: C.success }}>₹{it.amount?.toFixed(2)}</td>
                  <td style={{ padding: '4px 5px', textAlign: 'center' }}>
                    <button onClick={() => updateQty(it.productCode, -it.qty)} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 14 }}>🗑</button>
                  </td>
                </tr>
              ))}
              {!bill.items.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28, color: C.textLight, fontSize: 13 }}>
                  {(bill.type === 'dine_in' || bill.type === 'parcel') && !bill.table ? `← Select a ${bill.type === 'dine_in' ? 'table' : 'parcel'} first` : 'Add items from the grid →'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Discount / Reduction row */}
        {showDiscount && (
          <div style={{ display: 'flex', gap: 6, padding: '7px 8px', borderTop: `1px solid ${C.border}`, background: C.warningBg }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: C.warning, fontWeight: 700, display: 'block', marginBottom: 2 }}>DISCOUNT ₹</label>
              <input type='number' min='0' value={bill.discount} onChange={e => upd('discount', parseFloat(e.target.value) || 0)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '5px 7px', border: `1.5px solid ${C.warning}`, borderRadius: 6, fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: C.danger, fontWeight: 700, display: 'block', marginBottom: 2 }}>REDUCTION ₹</label>
              <input type='number' min='0' value={bill.reduction} onChange={e => upd('reduction', parseFloat(e.target.value) || 0)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '5px 7px', border: `1.5px solid ${C.danger}`, borderRadius: 6, fontSize: 13, outline: 'none' }} />
            </div>
          </div>
        )}

        {/* Additional charges row for Parcel */}
        {bill.type === 'takeaway' && (
          <div style={{ padding: '6px 8px', borderTop: `1px solid ${C.border}`, background: '#FFF8E1' }}>
            <div style={{ fontSize: 10, color: '#E65100', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>📦 Parcel Additional Charges</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {(bill.additionalCharges || []).map((ch, ci) => (
                <div key={ci} style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: 6, padding: '4px 8px' }}>
                  <input value={ch.name} onChange={e => { const ac = [...(bill.additionalCharges || [])]; ac[ci] = { ...ac[ci], name: e.target.value }; upd('additionalCharges', ac); }}
                    placeholder='e.g. Packing' style={{ width: 80, border: 'none', background: 'transparent', fontSize: 11, outline: 'none', color: '#E65100' }} />
                  <span style={{ color: '#E65100' }}>₹</span>
                  <input type='number' value={ch.amount} onChange={e => { const ac = [...(bill.additionalCharges || [])]; ac[ci] = { ...ac[ci], amount: parseFloat(e.target.value) || 0 }; upd('additionalCharges', ac); }}
                    style={{ width: 50, border: 'none', background: 'transparent', fontSize: 11, fontWeight: 700, outline: 'none', color: '#E65100', textAlign: 'right' }} />
                  <button onClick={() => upd('additionalCharges', (bill.additionalCharges || []).filter((_, j) => j !== ci))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E53935', fontSize: 14, padding: 0 }}>✕</button>
                </div>
              ))}
              <button onClick={() => upd('additionalCharges', [...(bill.additionalCharges || []), { name: 'Packing', amount: 0 }])} style={{ padding: '4px 10px', background: '#E65100', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                + Add Charge
              </button>
            </div>
          </div>
        )}

        {/* Totals bar */}
        <div style={{ borderTop: `2px solid ${C.border}`, background: C.surface }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', padding: '6px 8px', gap: 3, borderBottom: `1px solid ${C.border}` }}>
            {[
              ['Amount', totals.subtotal.toFixed(2), C.text],
              ['CGST', totals.cgstTotal.toFixed(2), C.textMuted],
              ['SGST', totals.sgstTotal.toFixed(2), C.textMuted],
              ['Disc', totals.discount.toFixed(2), C.warning],
              ['Round', totals.roundOff.toFixed(2), C.textLight],
              ['NET', `₹${totals.net}`, C.primary],
            ].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: 'center', background: l === 'NET' ? C.primaryBg : C.surfaceAlt, borderRadius: 6, padding: '4px 3px', border: l === 'NET' ? `1.5px solid ${C.primary}` : `1px solid ${C.border}` }}>
                <div style={{ fontSize: 8, color: C.textLight, fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: l === 'NET' ? 13 : 11, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5, padding: '7px 8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn label='Discount' variant='ghost' size='sm' onClick={() => setShowDiscount(v => !v)} />

            {bill.type === 'dine_in' ? (
              <>
                <span style={{ display: 'inline-block' }}>
                  <Btn label='F5 Bill' variant='success' size='sm' onClick={handleFinalBill} disabled={loading} />
                </span>
                <span style={{ display: 'inline-block' }}>
                  <Btn label='Bill Only' variant='secondary' size='sm' onClick={() => {
                    if (!bill.items.length) return notify('Add items first', 'error');
                    upd('skipKOT', true);
                    setShowPayment(true);
                  }} disabled={loading} />
                </span>
              </>
            ) : (
              <>
                <Btn label='F11 KOT+Bill' variant='warning' size='sm' onClick={() => handleKOTSave(true)} disabled={loading} />
                <Btn label='F5 Bill' variant='success' size='sm' onClick={handleFinalBill} disabled={loading} />
                <Btn label='Bill Only' variant='secondary' size='sm' onClick={() => {
                  if (!bill.items.length) return notify('Add items first', 'error');
                  upd('skipKOT', true);
                  setShowPayment(true);
                }} disabled={loading} />
              </>
            )}

            {bill.type === 'advance' && <Btn label='Save Advance' variant='warning' size='sm' onClick={() => setShowAdvance(true)} />}
            <Btn label='Clear' variant='outlineDanger' size='sm' onClick={clearBill} />
          </div>
        </div>
      </div>

      {/* CENTER: Product Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, background: C.bg, overflow: 'hidden' }}>
        {/* Search Bar */}
        <div style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder='🔍 Search product...'
            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: 12, border: `1.5px solid ${C.border}`, borderRadius: 8, outline: 'none', marginBottom: 6, color: C.text }}
            onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
            {groups.map(g => (
              <button key={g.name} onClick={() => setSelGroup(g.name)} style={{ padding: '3px 9px', borderRadius: 100, border: `1.5px solid ${selGroup === g.name ? C.primary : C.border}`, background: selGroup === g.name ? C.primary : 'transparent', color: selGroup === g.name ? '#fff' : C.textMuted, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{g.name}</button>
            ))}
          </div>
        </div>

        {/* Department Filter */}
        <DepartmentFilter
          departments={departments}
          selectedDeptId={selectedDeptId}
          onSelectDepartment={setSelectedDeptId}
          productCounts={productCounts}
        />

        {/* Products Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 7, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 6, alignContent: 'start' }}>
          {filteredProducts.map(p => {
            const inBill = bill.items.find(it => it.productCode === p.code);
            const displayRate = p.currentRate || p.rate;
            return (
              <button key={p._id} onClick={() => addItem(p)} style={{ background: inBill ? C.primaryBg : C.surface, border: `1.5px solid ${inBill ? C.primary : C.border}`, borderRadius: 10, padding: '8px 7px', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${C.secondary}` }}>
                {p.imageUrl && <img src={p.imageUrl} alt={getProductName(p, lang)} style={{ width: '100%', height: 48, objectFit: 'cover', borderRadius: 6, marginBottom: 4 }} />}
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600, background: C.surfaceAlt, padding: '1px 4px', borderRadius: 4, display: 'inline-block', marginBottom: 2 }}>{p.code}</div>
                <div style={{ fontSize: 11, color: C.text, fontWeight: 700, lineHeight: 1.3, marginBottom: 3, minHeight: 28, wordBreak: 'break-word', overflow: 'visible', whiteSpace: 'normal' }}>{getProductName(p, lang)}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: C.primary, fontWeight: 800 }}>₹{displayRate}</span>
                  {inBill && <span style={{ fontSize: 10, background: C.primary, color: '#fff', borderRadius: 100, padding: '1px 5px', fontWeight: 700 }}>×{inBill.qty}</span>}
                </div>
              </button>
            );
          })}
          {!filteredProducts.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 28, color: C.textLight }}>No products</div>}
        </div>
      </div>

      {/* RIGHT: Running Bills */}
      {
        canViewRunningBills && (
          <div style={{ width: 205, display: 'flex', flexDirection: 'column', background: C.surface }}>
            <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Running</span>
              <span style={{ fontSize: 11, background: C.dangerBg, color: C.danger, borderRadius: 100, padding: '1px 7px', fontWeight: 700 }}>{runningBills.length}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 5 }}>
              {runningBills.map(rb => (
                <div key={rb._id} style={{ background: bill.savedId === rb._id ? C.primaryBg : C.surfaceAlt, border: `1px solid ${bill.savedId === rb._id ? C.primary : C.border}`, borderRadius: 10, padding: '8px 9px', marginBottom: 5, borderLeft: `3px solid ${C.primary}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{rb.table || rb.kotNo || 'N/A'}</span>
                    <span style={{ fontSize: 10, color: C.textLight }}>{rb.kotNo}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>{rb.waiter || 'No waiter'} · {rb.items?.length || 0} items</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.success, marginBottom: 5 }}>₹{rb.netAmount}</div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <button onClick={() => setViewRunningBill(rb)} style={{ flex: 1, padding: '3px 0', fontSize: 10, fontWeight: 700, background: '#E3F2FD', border: '1px solid #1976D2', color: '#1976D2', borderRadius: 5, cursor: 'pointer' }}>👁 View</button>
                    <button onClick={() => loadRunningIntoSlot(rb)} style={{ flex: 1, padding: '3px 0', fontSize: 10, fontWeight: 700, background: C.primaryBg, border: `1px solid ${C.primary}`, color: C.primary, borderRadius: 5, cursor: 'pointer' }}>📝 Edit</button>
                    <button onClick={() => setPrintBill(rb)} style={{ flex: 1, padding: '3px 0', fontSize: 10, fontWeight: 700, background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: 5, cursor: 'pointer' }}>🖨 Print</button>
                    <button onClick={() => setConfirmDel(rb)} style={{ padding: '3px 6px', fontSize: 10, fontWeight: 700, background: C.dangerBg, border: `1px solid ${C.danger}`, color: C.danger, borderRadius: 5, cursor: 'pointer' }}>🗑 Del</button>
                  </div>
                </div>
              ))}
              {!runningBills.length && <div style={{ textAlign: 'center', padding: 16, color: C.textLight, fontSize: 11 }}>No running bills</div>}
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '7px 9px', background: C.surfaceAlt }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>Bill Summary</div>
              {[['Items', bill.items.length], ['Qty', bill.items.reduce((s, i) => s + i.qty, 0)], ['Sub', `₹${totals.subtotal.toFixed(2)}`], ['GST', `₹${(totals.cgstTotal + totals.sgstTotal).toFixed(2)}`], ['NET', `₹${totals.net}`]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2, fontWeight: l === 'NET' ? 800 : 400 }}>
                  <span style={{ color: C.textMuted }}>{l}</span><span style={{ color: l === 'NET' ? C.primary : C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* View Running Bill Modal */}
      {viewRunningBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => e.target === e.currentTarget && setViewRunningBill(null)}>
          <div style={{ background: C.surface, borderRadius: 20, width: 420, maxHeight: '85vh', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: C.primary, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>👁️ Running Bill — {viewRunningBill.table || 'N/A'}</div>
              <button onClick={() => setViewRunningBill(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 16, width: 30, height: 30 }}>✕</button>
            </div>
            <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1 }}>
              {/* Bill Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, padding: '10px 12px', background: C.surfaceAlt, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: C.textMuted }}><span style={{ fontWeight: 700 }}>KOT:</span> {viewRunningBill.kotNo || '—'}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}><span style={{ fontWeight: 700 }}>Bill:</span> {viewRunningBill.billNo || '—'}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}><span style={{ fontWeight: 700 }}>Table:</span> {viewRunningBill.table || '—'}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}><span style={{ fontWeight: 700 }}>Waiter:</span> {viewRunningBill.waiter || '—'}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}><span style={{ fontWeight: 700 }}>Type:</span> {viewRunningBill.billType || '—'}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}><span style={{ fontWeight: 700 }}>Time:</span> {viewRunningBill.createdAt ? new Date(viewRunningBill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
              </div>

              {/* Items Table */}
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>Items ({viewRunningBill.items?.length || 0})</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
                <thead>
                  <tr style={{ background: C.surfaceAlt, borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMuted }}>#</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMuted }}>Item</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted }}>Rate</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted }}>Qty</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: C.textMuted }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewRunningBill.items || []).map((it, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.surfaceAlt }}>
                      <td style={{ padding: '6px 8px', color: C.textLight, fontSize: 10 }}>{i + 1}</td>
                      <td style={{ padding: '6px 8px', color: C.text, fontWeight: 600, fontSize: 12 }}>{it.productName}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: C.textMuted, fontSize: 11 }}>₹{it.rate}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: C.primary, fontSize: 12 }}>{it.qty}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: C.text, fontSize: 12 }}>₹{(it.rate * it.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ background: C.primaryBg, borderRadius: 10, padding: '10px 14px', border: `1.5px solid ${C.primary}30` }}>
                {[['Subtotal', `₹${(viewRunningBill.subtotal || 0).toFixed(2)}`],
                ['GST', `₹${((viewRunningBill.cgstTotal || 0) + (viewRunningBill.sgstTotal || 0)).toFixed(2)}`],
                ['Net Amount', `₹${(viewRunningBill.netAmount || viewRunningBill.net || 0).toFixed(2)}`]
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: l === 'Net Amount' ? 14 : 12, fontWeight: l === 'Net Amount' ? 900 : 400, color: l === 'Net Amount' ? C.primary : C.text, marginBottom: l === 'Net Amount' ? 0 : 4 }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, background: C.surfaceAlt }}>
              <button onClick={() => { loadRunningIntoSlot(viewRunningBill); setViewRunningBill(null); }} style={{ flex: 1, padding: '10px', background: C.primaryBg, border: `1.5px solid ${C.primary}`, color: C.primary, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📝 Edit Bill</button>
              <button onClick={() => { setPrintBill(viewRunningBill); setViewRunningBill(null); }} style={{ flex: 1, padding: '10px', background: C.successBg, border: `1.5px solid ${C.success}`, color: C.success, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🖨 Print</button>
              <button onClick={() => setViewRunningBill(null)} style={{ padding: '10px 16px', background: C.surfaceAlt, border: `1.5px solid ${C.border}`, color: C.textMuted, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Bills Drawer */}
      {
        showViewBills && (
          <ViewBillsDrawer
            onClose={() => setShowViewBills(false)}
            onReload={loadRunning}
            onPrintDuplicate={(b) => setPrintBill(b)}
            onEditBill={(bill) => {
              setBills(prev => prev.map((b, i) => i === activeIdx ? {
                ...b,
                items: bill.items.map(it => ({ ...it })),
                table: bill.table,
                waiter: bill.waiter,
                discount: bill.discount || 0,
                reduction: bill.reduction || 0,
                savedId: bill._id,
                type: bill.billType,
                salesMode: bill.salesMode,
                paymentMode: bill.paymentMode,
                onlinePlatform: bill.onlinePlatform,
                onlineOrderId: bill.onlineOrderId,
                bookingDate: bill.bookingDate,
                bookingNote: bill.bookingNote,
                partyName: bill.partyName,
                guestCount: bill.guestCount,
                advanceAmount: bill.advanceAmount,
                advanceMode: bill.advanceMode,
                additionalCharges: bill.additionalCharges || []
              } : b));
            }}
          />
        )
      }

      <style>{`
        @media print { body * { visibility:hidden; } #receipt-area, #receipt-area * { visibility:visible; } #receipt-area { position:fixed; top:0; left:0; width:100%; font-size:11pt; } }
        @media (max-width: 1024px) {
          .billing-left-panel { width: 100% !important; min-width: 0 !important; }
          .billing-center-panel { flex: 1 !important; min-width: 0 !important; }
          .billing-right-panel { display: none !important; }
          .billing-main-row { flex-direction: column !important; }
        }
        @media (max-width: 768px) {
          .billing-left-panel { width: 100% !important; max-height: 50vh !important; }
          .billing-center-panel { width: 100% !important; max-height: 50vh !important; }
          .billing-main-row { flex-direction: column !important; height: auto !important; }
        }
      `}</style>
    </div >
  );
}