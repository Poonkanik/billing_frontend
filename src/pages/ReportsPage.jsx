import { useState, useEffect } from 'react';
import { reportsAPI, billsAPI, masterAPI } from '../services/api';
import { C, theme } from '../utils/theme';
import { Btn, Card, StatCard, Spinner } from '../components/common/UI';
import { DynamicReceiptRenderer } from '../components/common/DynamicReceiptRenderer';

const today = () => new Date().toISOString().slice(0, 10);
const fmtMoney = (v) => `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const REPORT_TYPES = [
  { key: 'bill-wise', label: 'Bill Wise Sales' },
  { key: 'item-wise', label: 'Item Wise Sales' },
  { key: 'salesman-wise', label: 'Salesman Wise Sales' },
  { key: 'group-wise', label: 'Group Wise Sales' },
  { key: 'department-wise', label: 'Department Wise Sales' },
  { key: 'cashier-wise', label: 'Cashier Wise Sales' },
  { key: 'time-wise', label: 'Time Wise Sales' },
  { key: 'tax-report', label: 'Sales Tax Report' },
];

const COLUMNS = {
  'bill-wise': [
    { key: 'billNo', label: 'Bill No', accent: true },
    { key: 'kotNo', label: 'KOT' },
    { key: 'table', label: 'Table' },
    { key: 'waiter', label: 'Waiter' },
    { key: 'paymentMode', label: 'Mode' },
    { key: 'subtotal', label: 'Amount', right: true, money: true },
    { key: 'cgstTotal', label: 'CGST', right: true, money: true },
    { key: 'sgstTotal', label: 'SGST', right: true, money: true },
    { key: 'discount', label: 'Discount', right: true, money: true },
    { key: 'printCount', label: 'Dup', right: true },
    { key: 'status', label: 'Status', right: true },
    { key: 'netAmount', label: 'Net Amt', right: true, money: true, bold: true },
  ],
  'item-wise': [
    { key: 'name', label: 'Product', accent: true },
    { key: 'qty', label: 'Qty', right: true },
    { key: 'rate', label: 'Rate', right: true, money: true },
    { key: 'amount', label: 'Amount', right: true, money: true, bold: true },
  ],
  'salesman-wise': [
    { key: 'name', label: 'Salesman', accent: true },
    { key: 'bills', label: 'Bills', right: true },
    { key: 'amount', label: 'Amount', right: true, money: true, bold: true },
  ],
  'group-wise': [
    { key: 'group', label: 'Group', accent: true },
    { key: 'qty', label: 'Qty', right: true },
    { key: 'amount', label: 'Amount', right: true, money: true, bold: true },
  ],
  'department-wise': [
    { key: 'department', label: 'Department', accent: true },
    { key: 'items', label: 'Items', right: true },
    { key: 'qty', label: 'Qty', right: true },
    { key: 'amount', label: 'Amount', right: true, money: true, bold: true },
  ],
  'cashier-wise': [
    { key: 'cashier', label: 'Cashier', accent: true },
    { key: 'bills', label: 'Bills', right: true },
    { key: 'amount', label: 'Amount', right: true, money: true, bold: true },
  ],
  'time-wise': [
    { key: 'time', label: 'Time', accent: true },
    { key: 'bills', label: 'Bills', right: true },
    { key: 'amount', label: 'Amount', right: true, money: true, bold: true },
  ],
};

const APIS = {
  'bill-wise': p => reportsAPI.billWise(p),
  'item-wise': p => reportsAPI.itemWise(p),
  'salesman-wise': p => reportsAPI.salesmanWise(p),
  'group-wise': p => reportsAPI.groupWise(p),
  'department-wise': p => reportsAPI.departmentWise(p),
  'cashier-wise': p => reportsAPI.cashierWise(p),
  'time-wise': p => reportsAPI.timeWise(p),
  'tax-report': p => reportsAPI.taxReport(p),
};

function getTotal(data, type) {
  if (!Array.isArray(data) || !data.length) return 0;
  const k = type === 'bill-wise' ? 'netAmount' : 'amount';
  return data.reduce((s, r) => s + (r.status === 'cancelled' ? 0 : (r[k] || 0)), 0);
}

// ── Bar Chart ─────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color = C.primary }) {
  if (!data?.length) return <div style={{ textAlign: 'center', padding: 20, color: C.textLight, fontSize: 12 }}>No data</div>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const showMax = Math.min(data.length, 15); // max 15 bars
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 220, padding: '10px 0', overflowX: 'auto' }}>
      {data.slice(0, showMax).map((d, i) => {
        const val = d[valueKey] || 0;
        const h = Math.max(8, (val / max) * 170);
        const lbl = String(d[labelKey] || '');
        return (
          <div key={i} style={{ flex: '1 1 0', minWidth: 56, maxWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ fontSize: 11, color: C.text, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${Math.round(val)}`}
            </div>
            <div style={{ width: '70%', minWidth: 30, height: h, background: `linear-gradient(180deg, ${color}, ${color}88)`, borderRadius: '6px 6px 0 0', transition: 'height 0.4s', boxShadow: `0 2px 6px ${color}25` }} />
            <div style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, padding: '0 2px' }} title={lbl}>
              {lbl.length > 8 ? lbl.slice(0, 7) + '…' : lbl}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Bill Detail Modal — FIX #1: proper useEffect, no infinite loop ──
function BillDetailModal({ billId, onClose, company }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  // FIXED: use useEffect, not useState/useCallback called immediately
  useEffect(() => {
    setLoading(true);
    setBill(null);
    billsAPI.getOne(billId)
      .then(r => { setBill(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [billId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div id="bill-detail-modal" style={{ background: C.surface, borderRadius: 16, width: 540, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>🧾 Bill Detail — {bill?.billNo || '...'}{bill?.printCount > 1 ? ` (Duplicate ${bill.printCount - 1})` : ''}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.textMuted, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? <Spinner /> : !bill ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Bill not found</div>
          ) : (
            <>
              {/* Bill info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  ['Bill No', bill.billNo],
                  ['KOT No', bill.kotNo],
                  ['Date', fmtDate(bill.date)],
                  ['Time', fmtTime(bill.date)],
                  ['Table', bill.table || '—'],
                  ['Waiter', bill.waiter || '—'],
                  ['Cashier', bill.cashier || '—'],
                  ['Payment', bill.paymentMode],
                  ['Type', bill.billType || 'dine_in'],
                  ['Status', bill.status],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: C.surfaceAlt, borderRadius: 8, padding: '7px 10px' }}>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Items ({bill.items?.length || 0})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: C.primary }}>
                    {['#', 'Product', 'Rate', 'Qty', 'Amount'].map((h, j) => (
                      <th key={j} style={{ padding: '8px 10px', textAlign: j >= 2 ? 'right' : 'left', color: '#fff', fontWeight: 700, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((it, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.surfaceAlt }}>
                      <td style={{ padding: '7px 10px', color: C.textLight, width: 28 }}>{i + 1}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: C.text }}>{it.productName}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: C.textMuted }}>₹{it.rate}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: C.text }}>{it.qty}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: C.success }}>{fmtMoney(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals — FIX: correct net amount calculation */}
              <div style={{ background: C.primaryBg, border: `1.5px solid ${C.primary}`, borderRadius: 12, padding: '14px 16px' }}>
                {[
                  ['Subtotal', bill.subtotal, C.textMuted, false],
                  ['CGST 2.5%', bill.cgstTotal, C.textMuted, false],
                  ['SGST 2.5%', bill.sgstTotal, C.textMuted, false],
                  bill.discount > 0 && ['Discount', -bill.discount, C.danger, false],
                  bill.reduction > 0 && ['Reduction', -bill.reduction, C.warning, false],
                  ['Round Off', bill.roundOff || 0, C.textLight, false],
                ].filter(Boolean).map(([l, v, c]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: c }}>
                    <span>{l}</span>
                    <span>{v < 0 ? `- ${fmtMoney(Math.abs(v))}` : fmtMoney(v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: C.primary, borderTop: `2px solid ${C.primary}`, paddingTop: 10, marginTop: 6 }}>
                  <span>NET AMOUNT</span>
                  <span>{fmtMoney(bill.netAmount)}</span>
                </div>
                {bill.cashReceived > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted }}>
                      <span>Cash Received ({bill.paymentMode})</span>
                      <span>{fmtMoney(bill.cashReceived)}</span>
                    </div>
                    {(bill.changeReturned || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: C.success }}>
                        <span>Change Returned</span>
                        <span>{fmtMoney(bill.changeReturned)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {bill && (
          <div id='thermal-receipt-area' style={{ display: 'none' }}>
            <DynamicReceiptRenderer
              tpl={(() => { try { const ts = JSON.parse(localStorage.getItem('printTemplates') || '[]'); return ts.find(t => t.isDefault) || ts[0]; } catch (e) { return null; } })()}
              data={bill} isKot={false} company={company}
            />
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, borderRadius: '0 0 16px 16px' }}>
          <Btn label='🖨 Print' variant='primary' fullWidth onClick={() => {
            billsAPI.markDuplicated(billId).then(() => {
              setBill(p => ({ ...p, printCount: (p?.printCount || 1) + 1 }));
              setTimeout(() => {
                const el = document.getElementById('thermal-receipt-area');
                if (!el) { window.print(); return; }
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
                  w.document.close();
                  setTimeout(() => { w.print(); w.close(); }, 500);
                }
              }, 100);
            }).catch(() => window.print());
          }} />
          <Btn label='Close' variant='ghost' fullWidth onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────
function exportCSV(data, cols, name) {
  const hdr = cols.map(c => c.label).join(',');
  const rows = data.map(r => cols.map(c => {
    const v = r[c.key];
    return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '');
  }).join(','));
  const blob = new Blob([[hdr, ...rows].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.csv'; a.click();
}

function exportExcel(data, cols, name) {
  const h = cols.map(c => `<th style="background:#1565C0;color:#fff;padding:6px 10px">${c.label}</th>`).join('');
  const r = data.map((row, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#f5f7fa'}">${cols.map(c => `<td style="padding:5px 10px;border-bottom:1px solid #eee">${row[c.key] ?? ''}</td>`).join('')}</tr>`).join('');
  const html = `<html><head><meta charset="utf-8"></head><body><table border="0" cellspacing="0">${h}${r}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.xls'; a.click();
}

function exportPDF(data, cols, name, total, company) {
  const h = cols.map(c => `<th style="background:#1565C0;color:#fff;padding:8px 12px;text-align:${c.right ? 'right' : 'left'};font-size:11px;white-space:nowrap">${c.label}</th>`).join('');
  const r = data.map((row, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#f5f7fa'}">${cols.map(c => {
    const v = row[c.key]; const val = c.money && typeof v === 'number' ? '\u20b9' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (v ?? '\u2014');
    return `<td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:${c.right ? 'right' : 'left'};font-weight:${c.bold ? '700' : '400'};word-break:break-word">${val}</td>`;
  }).join('')}</tr>`).join('');
  const compNameStr = company ? `<div style="text-align:center;margin-bottom:15px"><h1 style="color:#1565C0;margin:0">${company.langName || company.name || ''}</h1><div style="color:#444;font-size:13px">${company.address || ''}</div></div>` : '';
  const html = `<html><head><meta charset="utf-8"><title>${name}</title><style>body{font-family:'Segoe UI',sans-serif;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}h2{color:#1565C0;margin-bottom:4px;border-bottom:1px solid #eee;padding-bottom:5px}@page{margin:10mm}@media print{body{padding:0}}</style></head><body>${compNameStr}<h2>${name}</h2><p style="color:#666;margin-bottom:12px">Generated on ${new Date().toLocaleString('en-IN')}</p><table>${h}${r}<tr style="background:#E3F2FD;border-top:2px solid #1565C0"><td colspan="${cols.length}" style="padding:10px 12px;text-align:right;font-weight:900;font-size:14px;color:#1565C0">Grand Total: \u20b9${(total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr></table></body></html>`;
  const w = window.open('', '', 'width=900,height=700');
  w.document.write(html); w.document.close();
  setTimeout(() => { w.print(); w.close(); }, 500);
}

// ── Main ReportsPage ──────────────────────────────────────────
export default function ReportsPage() {
  const [reportType, setReportType] = useState('bill-wise');
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewBillId, setViewBillId] = useState(null);
  const [chartView, setChartView] = useState(true);
  const [company, setCompany] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selBranch, setSelBranch] = useState('all');

  // Detect user role from localStorage
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('pos_user')); } catch { return null; } })();
  const isAdmin = currentUser && ['root', 'admin'].includes(currentUser.role);
  const userBranchName = currentUser?.branch?.name || currentUser?.activeBranch?.name || null;

  useEffect(() => {
    masterAPI.getCompany().then(r => setCompany(r.data)).catch(() => { });
    // Fetch branches for admin filter
    if (isAdmin) {
      masterAPI.getBranches().then(r => setBranches(r.data || [])).catch(() => { });
    }
  }, []);

  const runReport = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const params = { from: fromDate, to: toDate };
      // Pass branch filter for admin users
      if (isAdmin && selBranch !== 'all') {
        params.branch = selBranch;
      }
      const r = await APIS[reportType](params);
      setData(r.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const cols = COLUMNS[reportType] || [];
  const total = getTotal(data || [], reportType);
  const label = REPORT_TYPES.find(r => r.key === reportType)?.label || '';
  const selBranchName = selBranch !== 'all' ? branches.find(b => b._id === selBranch)?.name : null;

  const chartValueKey = reportType === 'bill-wise' ? 'netAmount' : 'amount';
  const chartLabelKey = { 'bill-wise': 'billNo', 'item-wise': 'name', 'salesman-wise': 'name', 'group-wise': 'group', 'department-wise': 'department', 'cashier-wise': 'cashier', 'time-wise': 'time' }[reportType] || 'name';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      {/* Bill Detail Modal — FIX: no infinite loop */}
      {viewBillId && (
        <BillDetailModal billId={viewBillId} onClose={() => setViewBillId(null)} company={company} />
      )}

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 220px' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Report Type</label>
            <select value={reportType} onChange={e => { setReportType(e.target.value); setData(null); }}
              style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: `1.5px solid ${C.border}`, borderRadius: 10, background: '#fff', color: C.text, fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'auto', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border}>
              {REPORT_TYPES.filter(r => !r.adminOnly || isAdmin).map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          {/* Branch filter — admin/root only */}
          {isAdmin && branches.length > 0 && (
            <div style={{ flex: '0 0 180px' }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Branch</label>
              <select value={selBranch} onChange={e => { setSelBranch(e.target.value); setData(null); }}
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: `1.5px solid ${C.border}`, borderRadius: 10, background: '#fff', color: C.text, fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'auto', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border}>
                <option value="all">All Branches</option>
                {branches.filter(b => b.isActive).map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}
          {/* Show branch badge for non-admin users */}
          {!isAdmin && userBranchName && (
            <div style={{ padding: '10px 14px', background: C.primaryBg, border: `1.5px solid ${C.primary}30`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.primary, display: 'flex', alignItems: 'center', gap: 5, alignSelf: 'flex-end' }}>
              🏢 {userBranchName}
            </div>
          )}
          {[['From', fromDate, setFromDate], ['To', toDate, setToDate]].map(([l, v, s]) => (
            <div key={l}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{l}</label>
              <input type='date' value={v} onChange={e => s(e.target.value)}
                style={{ padding: '10px 12px', fontSize: 13, border: `1.5px solid ${C.border}`, borderRadius: 10, outline: 'none', color: C.text, background: '#fff', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={runReport} disabled={loading}
              style={{ padding: '10px 20px', background: loading ? C.primaryLight : C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: `0 2px 8px ${C.primary}30`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
              📊 {loading ? 'Loading...' : 'View Report'}
            </button>
            {data && Array.isArray(data) && data.length > 0 && <>
              {['CSV', 'Excel', 'PDF'].map(type => (
                <button key={type} onClick={() => type === 'CSV' ? exportCSV(data, cols, label) : type === 'Excel' ? exportExcel(data, cols, label) : exportPDF(data, cols, label, total, company)}
                  style={{ padding: '10px 14px', background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.background = C.primaryBg; e.currentTarget.style.color = C.primary; }}
                  onMouseOut={e => { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.textMuted; }}>
                  {type}
                </button>
              ))}
              <button onClick={() => setChartView(v => !v)}
                style={{ padding: '10px 14px', background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {chartView ? 'Table Only' : '+ Chart'}
              </button>
            </>}
          </div>
        </div>
      </div>

      {/* Results area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {!data && !loading && !error && (
          <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textMuted }}>Select a report type and click View Report</div>
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>Tip: Click any Bill No in Bill Wise report to see item details</div>
          </div>
        )}
        {loading && <Spinner />}
        {error && (
          <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}`, color: C.danger, borderRadius: 8, padding: '12px 16px', fontWeight: 700 }}>
            ❌ {error}
          </div>
        )}

        {/* Tax Report special layout */}
        {data && reportType === 'tax-report' && !Array.isArray(data) && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16 }}>
              Sales Tax Report — {fromDate} to {toDate}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
              <StatCard label='Total Bills' value={data.bills || 0} icon='🧾' color={C.primary} bg={C.primaryBg} />
              <StatCard label='Subtotal' value={fmtMoney(data.subtotal)} icon='💰' color={C.text} bg={C.surfaceAlt} />
              <StatCard label='CGST 2.5%' value={fmtMoney(data.cgst)} icon='📋' color={C.warning} bg={C.warningBg} />
              <StatCard label='SGST 2.5%' value={fmtMoney(data.sgst)} icon='📋' color={C.warning} bg={C.warningBg} />
              <StatCard label='Total GST' value={fmtMoney((data.cgst || 0) + (data.sgst || 0))} icon='🏷️' color={'#6A1B9A'} bg={'#F3E5F5'} />
              <StatCard label='Total Discount' value={fmtMoney(data.discount)} icon='🎫' color={C.danger} bg={C.dangerBg} />
              <StatCard label='Net Amount' value={fmtMoney(data.net)} icon='✅' color={C.success} bg={C.successBg} />
            </div>
          </div>
        )}

        {/* Tabular report */}
        {data && Array.isArray(data) && (
          <Card noPad>
            {company && (
              <div style={{ textAlign: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: '#f8f9fa' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{company.langName || company.name || 'Company Name'}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{company.address || 'Company Address'}</div>
              </div>
            )}
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{label}</span>
                <span style={{ fontSize: 12, color: C.textMuted }}>{fromDate} → {toDate}</span>
                {selBranchName && reportType !== 'branch-wise' && (
                  <span style={{ padding: '3px 10px', background: C.primaryBg, border: `1px solid ${C.primary}30`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: C.primary }}>🏢 {selBranchName}</span>
                )}
                {!isAdmin && userBranchName && (
                  <span style={{ padding: '3px 10px', background: C.primaryBg, border: `1px solid ${C.primary}30`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: C.primary }}>🏢 {userBranchName}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>Records: <strong>{data.length}</strong></span>
                <div style={{ padding: '5px 14px', background: C.successBg, border: `1px solid ${C.success}`, borderRadius: 100, fontSize: 13, fontWeight: 800, color: C.success }}>
                  Grand Total: {fmtMoney(total)}
                </div>
              </div>
            </div>

            {/* Summary stats row */}
            {data.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                <StatCard label='Records' value={data.length} icon='📋' color={C.primary} bg={C.primaryBg} />
                <StatCard label='Grand Total' value={fmtMoney(total)} icon='💰' color={C.success} bg={C.successBg} />
                {reportType === 'bill-wise' && <>
                  <StatCard label='Total GST' value={fmtMoney(data.reduce((s, r) => s + (r.status === 'cancelled' ? 0 : (r.cgstTotal || 0) + (r.sgstTotal || 0)), 0))} icon='🏷️' color={C.warning} bg={C.warningBg} />
                  <StatCard label='Total Disc' value={fmtMoney(data.reduce((s, r) => s + (r.status === 'cancelled' ? 0 : (r.discount || 0)), 0))} icon='🎫' color={C.danger} bg={C.dangerBg} />
                  <StatCard label='Avg Bill' value={fmtMoney(data.length ? total / (data.filter(r => r.status !== 'cancelled').length || 1) : 0)} icon='📊' color={C.secondary} bg={C.secondaryBg} />
                </>}

              </div>
            )}

            {/* Bar chart */}
            {chartView && data.length > 0 && (
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Sales Chart</div>
                <BarChart data={data.slice(0, 15)} valueKey={chartValueKey} labelKey={chartLabelKey} color={C.primary} />
              </div>
            )}

            {/* Data table */}
            <div style={{ overflowX: 'auto' }} id='report-table' className={viewBillId ? 'hidden-print' : ''}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.surfaceAlt, borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>#</th>
                    {cols.map(col => (
                      <th key={col.key} style={{ padding: '8px 12px', textAlign: col.right ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}
                      style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.surfaceAlt, cursor: reportType === 'bill-wise' ? 'pointer' : undefined, transition: 'background 0.1s' }}
                      onClick={() => reportType === 'bill-wise' && row._id && setViewBillId(row._id)}
                      onMouseOver={e => reportType === 'bill-wise' && (e.currentTarget.style.background = C.primaryBg)}
                      onMouseOut={e => (e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.surfaceAlt)}>
                      <td style={{ padding: '7px 12px', color: C.textLight, fontSize: 11 }}>{i + 1}</td>
                      {cols.map(col => {
                        const isCan = row.status === 'cancelled';
                        const isMoneyWrap = col.money && typeof row[col.key] === 'number';
                        const textC = isCan ? C.danger : (col.accent ? C.primary : col.bold ? C.success : C.text);
                        return (
                          <td key={col.key} style={{ padding: '7px 12px', textAlign: col.right ? 'right' : 'left', color: textC, fontWeight: col.bold ? 700 : 400, whiteSpace: col.key === 'name' || col.key === 'group' || col.key === 'cashier' ? 'normal' : 'nowrap', wordBreak: col.key === 'name' ? 'break-word' : undefined, textDecoration: isCan && isMoneyWrap ? 'line-through' : 'none' }}>
                            {col.key === 'status' ? (isCan ? 'Deleted' : 'Billed') : col.key === 'printCount' ? ((row.printCount || 1) > 1 ? `Dup ${(row.printCount || 1) - 1}` : '') : isMoneyWrap ? fmtMoney(row[col.key]) : (row[col.key] ?? '—')}
                            {col.key === 'billNo' && <span style={{ fontSize: 10, color: C.textLight, marginLeft: 5 }}>↗</span>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: C.primaryBg, borderTop: `2px solid ${C.primary}` }}>
                    <td colSpan={cols.length} style={{ padding: '9px 12px', textAlign: 'right', fontSize: 14, fontWeight: 900, color: C.primary }}>
                      Grand Total: {fmtMoney(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {!data.length && <div style={{ textAlign: 'center', padding: 32, color: C.textLight }}>No data for selected period</div>}
          </Card>
        )}
      </div>

      <style>{`
        @media print { 
          body * { visibility:hidden; } 
          #report-table:not(.hidden-print), #report-table:not(.hidden-print) * { visibility:visible; } 
          #report-table:not(.hidden-print) { position:fixed; top:0; left:0; width:100%; } 
          #bill-detail-modal, #bill-detail-modal * { visibility:visible; }
          #bill-detail-modal { position:fixed; top:0; left:0; width:100%; height:100%; max-height:none; box-shadow:none; overflow:visible; }
        }
      `}</style>
    </div>
  );
}
