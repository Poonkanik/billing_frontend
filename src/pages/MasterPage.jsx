import React, { useState, useEffect, useCallback } from 'react';
import { masterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { C, theme } from '../utils/theme';
import { Input, Select, Checkbox, Card } from '../components/common/UI';
import MasterList from '../components/master/MasterList';
import PrinterSubForm from '../components/master/PrinterSubForm';

const TAB_LIST = [
  { name: 'Company', menuId: 'master-company' },
  { name: 'Branches', menuId: 'master-branches' },
  { name: 'Groups', menuId: 'master-groups' },
  { name: 'Products', menuId: 'master-products' },
  { name: 'Tables', menuId: 'master-tables' },
  { name: 'Customers', menuId: 'master-customers' },
  { name: 'Waiters', menuId: 'master-waiters' },
  { name: 'Captains', menuId: 'master-captains' },
  { name: 'Rate Info', menuId: 'master-rate-info' },
  { name: 'Sales Modes', menuId: 'master-sales-modes' },
];

export default function MasterPage() {
  const { hasPermission, user } = useAuth();
  const [tab, setTab] = useState('Company');

  // Filter tabs based on permissions — root, admin, and head see all tabs
  const isElevated = ['root', 'admin', 'branch_admin'].includes(user?.role);
  const TABS = isElevated
    ? TAB_LIST.map(t => t.name)
    : TAB_LIST.filter(t => hasPermission(t.menuId)).map(t => t.name);

  // Reset tab if current one is not accessible
  useEffect(() => {
    if (!TABS.includes(tab)) setTab(TABS[0] || 'Company');
  }, [TABS, tab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 16px', gap: 2 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '11px 16px', border: 'none', cursor: 'pointer', fontSize: theme.fontSize.sm, fontWeight: 700,
            background: 'transparent', color: tab === t ? C.primary : C.textMuted,
            borderBottom: tab === t ? `2.5px solid ${C.primary}` : '2.5px solid transparent',
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'Company' && <CompanyTab />}
        {tab === 'Branches' && <BranchesTab />}
        {tab === 'Groups' && <GroupsTab />}
        {tab === 'Products' && <ProductsTab />}
        {tab === 'Tables' && <TablesTab />}
        {tab === 'Customers' && <CustomersTab />}
        {tab === 'Waiters' && <StaffTab key='waiters' title='Waiters' getAll={masterAPI.getWaiters} create={masterAPI.createWaiter} update={masterAPI.updateWaiter} del={masterAPI.deleteWaiter} />}
        {tab === 'Captains' && <StaffTab key='captains' title='Captains' getAll={masterAPI.getCaptains} create={masterAPI.createCaptain} update={masterAPI.updateCaptain} del={masterAPI.deleteCaptain} />}
        {tab === 'Rate Info' && <RateInfoTab />}
        {tab === 'Sales Modes' && <SalesModesTab />}
      </div>
    </div>
  );
}

// ─────────────────────── COMPANY ───────────────────────────
function CompanyTab() {
  const [form, setForm] = useState({ name: '', address1: '', address2: '', address3: '', address4: '', address5: '', phone: '', mobile: '', email: '', web: '', langName: '', langAddr1: '', langAddr2: '', langAddr3: '', langAddr4: '', langAddr5: '', gstNo: '' });
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    masterAPI.getCompany().then(res => { if (res.data?._id) setForm(res.data); }).catch(() => { });
  }, []);

  const save = async () => {
    try { await masterAPI.updateCompany(form); notify('✅ Company saved'); }
    catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: theme.radius.md, padding: '8px 12px', marginBottom: 12, fontWeight: 700, fontSize: theme.fontSize.sm }}>{toast}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        <Card title='Basic Information'>
          <Input label='Company Name' value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required />
          <Input label='Address 1' value={form.address1} onChange={v => setForm(p => ({ ...p, address1: v }))} />
          <Input label='Address 2' value={form.address2} onChange={v => setForm(p => ({ ...p, address2: v }))} />
          <Input label='Address 3' value={form.address3} onChange={v => setForm(p => ({ ...p, address3: v }))} />
          <Input label='Address 4' value={form.address4} onChange={v => setForm(p => ({ ...p, address4: v }))} />
          <Input label='GST Number' value={form.gstNo} onChange={v => setForm(p => ({ ...p, gstNo: v }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input label='Phone' value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
            <Input label='Mobile' value={form.mobile} onChange={v => setForm(p => ({ ...p, mobile: v }))} />
            <Input label='Email' value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
            <Input label='Website' value={form.web} onChange={v => setForm(p => ({ ...p, web: v }))} />
          </div>
        </Card>
        <div>
          <Card title='Language / Display Name' style={{ marginBottom: 16 }}>
            <Input label='Display Name' value={form.langName} onChange={v => setForm(p => ({ ...p, langName: v }))} />
            <Input label='Address 1' value={form.langAddr1} onChange={v => setForm(p => ({ ...p, langAddr1: v }))} />
            <Input label='Address 2' value={form.langAddr2} onChange={v => setForm(p => ({ ...p, langAddr2: v }))} />
            <Input label='Address 3' value={form.langAddr3} onChange={v => setForm(p => ({ ...p, langAddr3: v }))} />
            <Input label='Address 4' value={form.langAddr4} onChange={v => setForm(p => ({ ...p, langAddr4: v }))} />
          </Card>
          {/* Preview */}
          <Card title='Software Header'>
            <div style={{ textAlign: 'center', padding: '12px 8px', fontFamily: 'monospace', background: C.surfaceAlt, borderRadius: theme.radius.md }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{form.langName || form.name || 'Company Name'}</div>
              {form.langAddr1 && <div style={{ fontSize: 12, color: C.textMuted }}>{form.langAddr1}</div>}
              {form.langAddr2 && <div style={{ fontSize: 12, color: C.textMuted }}>{form.langAddr2}</div>}
              {form.langAddr3 && <div style={{ fontSize: 12, color: C.textMuted }}>{form.langAddr3}</div>}
              {form.gstNo && <div style={{ fontSize: 11, color: C.textMuted }}>GST: {form.gstNo}</div>}
            </div>
          </Card>
        </div>
      </div>
      <div style={{ marginTop: 16, maxWidth: 900 }}>
        <button onClick={save} style={{ padding: '9px 24px', background: C.primary, color: '#fff', border: 'none', borderRadius: theme.radius.md, fontSize: theme.fontSize.sm, fontWeight: 700, cursor: 'pointer' }}>
          💾 Save Company Info
        </button>
      </div>
    </div>
  );
}

// ─────────────────────── BRANCHES ───────────────────────────
const emptyBranch = { name: '', address1: '', address2: '', address3: '', address4: '', phone: '', mobile: '', email: '', website: '', gstNo: '', manager: '', openingDate: '' };

function BranchesTab() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyBranch);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [companyName, setCompanyName] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([masterAPI.getBranches(), masterAPI.getCompany()]);
      setItems(r.data);
      if (c.data?.name) setCompanyName(c.data.name);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const select = (item) => {
    setSelected(item);
    setForm({
      ...item,
      openingDate: item.openingDate ? item.openingDate.substring(0, 10) : '',
    });
  };
  const newItem = () => { setSelected(null); setForm(emptyBranch); };

  const save = async () => {
    if (!form.name) return notify('❌ Branch name is required');
    try {
      if (selected?._id) {
        const r = await masterAPI.updateBranch(selected._id, form);
        setSelected(r.data); notify('✅ Branch updated');
      } else {
        const r = await masterAPI.createBranch(form);
        setSelected(r.data); notify('✅ Branch created');
      }
      load();
    } catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  const del = async () => {
    if (!selected?._id || !window.confirm('Delete this branch?')) return;
    try { await masterAPI.deleteBranch(selected._id); setSelected(null); setForm(emptyBranch); load(); notify('Deleted'); }
    catch (e) { notify('❌ Error'); }
  };

  return (
    <MasterList items={items} selected={selected} onSelect={select} onNew={newItem} onSave={save} onDelete={del} loading={loading} title='Branches'>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: theme.radius.md, padding: '7px 12px', marginBottom: 12, fontWeight: 700, fontSize: theme.fontSize.sm }}>{toast}</div>}
      {companyName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', background: 'linear-gradient(135deg, #E3F2FD, #F3E5F5)', borderRadius: theme.radius.md, border: '1px solid #BBDEFB' }}>
          <span style={{ fontSize: 18 }}>🏢</span>
          <div>
            <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Master Company</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{companyName}</div>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>
        <Card title={selected?._id ? `Edit: ${selected.name}` : 'New Branch'}>
          <Input label='Branch Name' value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required />
          <Input label='Address Line 1' value={form.address1} onChange={v => setForm(p => ({ ...p, address1: v }))} />
          <Input label='Address Line 2' value={form.address2} onChange={v => setForm(p => ({ ...p, address2: v }))} />
          <Input label='Address Line 3' value={form.address3} onChange={v => setForm(p => ({ ...p, address3: v }))} />
          <Input label='Address Line 4' value={form.address4} onChange={v => setForm(p => ({ ...p, address4: v }))} />
          <Input label='GST Number' value={form.gstNo} onChange={v => setForm(p => ({ ...p, gstNo: v }))} />
        </Card>
        <div>
          <Card title='Contact & Management'>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Input label='Phone' value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
              <Input label='Mobile' value={form.mobile} onChange={v => setForm(p => ({ ...p, mobile: v }))} />
            </div>
            <Input label='Email' value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
            <Input label='Website' value={form.website} onChange={v => setForm(p => ({ ...p, website: v }))} />
            <Input label='Branch Manager' value={form.manager} onChange={v => setForm(p => ({ ...p, manager: v }))} />
            <Input label='Opening Date' type='date' value={form.openingDate} onChange={v => setForm(p => ({ ...p, openingDate: v }))} />
          </Card>
          {/* Branch Preview Card */}
          {(form.name || selected) && (
            <Card title='Branch Preview' style={{ marginTop: 12 }}>
              <div style={{ padding: '12px 8px', background: C.surfaceAlt, borderRadius: theme.radius.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>🍽️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{form.name || 'Branch Name'}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{companyName && `Under ${companyName}`}</div>
                  </div>
                </div>
                {form.address1 && <div style={{ fontSize: 11, color: C.textMuted }}>📍 {[form.address1, form.address2, form.address3].filter(Boolean).join(', ')}</div>}
                {form.phone && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>📞 {form.phone}{form.mobile ? ` / ${form.mobile}` : ''}</div>}
                {form.manager && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>👤 Manager: {form.manager}</div>}
                {form.openingDate && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>📅 Opens: {form.openingDate}</div>}
                {form.gstNo && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>GST: {form.gstNo}</div>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </MasterList>
  );
}

// ─────────────────────── GROUPS ───────────────────────────
const emptyGroup = { name: '', languageName: '' };

function GroupsTab() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyGroup);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await masterAPI.getGroups(); setItems(r.data); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const select = (item) => { setSelected(item); setForm(item); };
  const newItem = () => { setSelected(null); setForm(emptyGroup); };

  const save = async () => {
    try {
      if (selected?._id) { const r = await masterAPI.updateGroup(selected._id, form); setSelected(r.data); notify('✅ Updated'); }
      else { const r = await masterAPI.createGroup(form); setSelected(r.data); notify('✅ Created'); }
      load();
    } catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  const del = async () => {
    if (!selected?._id || !window.confirm('Delete this group?')) return;
    try { await masterAPI.deleteGroup(selected._id); setSelected(null); setForm(emptyGroup); load(); notify('Deleted'); }
    catch (e) { notify('❌ Error'); }
  };

  return (
    <MasterList items={items} selected={selected} onSelect={select} onNew={newItem} onSave={save} onDelete={del} loading={loading} title='Groups'>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: theme.radius.md, padding: '7px 12px', marginBottom: 12, fontWeight: 700, fontSize: theme.fontSize.sm }}>{toast}</div>}
      <Card title={selected?._id ? `Edit: ${selected.name}` : 'New Group'}>
        <Input label='Group Name' value={form.name} onChange={v => setForm(p => ({ ...p, name: v.toUpperCase() }))} required />
        <Input label='Language Name' value={form.languageName} onChange={v => setForm(p => ({ ...p, languageName: v }))} />
      </Card>
      <PrinterSubForm form={form.printer || {}} onChange={v => setForm(p => ({ ...p, printer: v }))} />
    </MasterList>
  );
}

// ─────────────────────── PRODUCTS ───────────────────────────
const emptyProduct = { code: '', name: '', localNames: {}, rate: 0, cgst: 0, sgst: 0, cess: 0, groupName: '', departmentName: '', department: '', unitName: 'PCS', imageUrl: '', flags: { active: true, allowGst: false, maintainStock: false, fastMoving: false, barItem: false } };

// eslint-disable-next-line no-unused-vars
function ExcelImportModal({ groups, depts, onImported, onClose }) {
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState('');

  const parseExcel = async (file) => {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs');
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    setRows(json.slice(0, 200));
  };

  const doImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    let ok = 0, fail = 0;
    for (const row of rows) {
      try {
        const code = String(row.Code || row.code || row.CODE || '').trim();
        const name = String(row.Name || row.name || row.NAME || row.ITEM || '').trim().toUpperCase();
        const rate = parseFloat(row.Rate || row.rate || row.RATE || row.Price || 0) || 0;
        const group = String(row.Group || row.group || row.GROUP || '').trim().toUpperCase();
        if (!code || !name) { fail++; continue; }
        const { masterAPI } = await import('../services/api');
        await masterAPI.createProduct({ code, name, rate, groupName: group, unitName: 'PCS', flags: { active: true } });
        ok++;
      } catch { fail++; }
    }
    setResult(`✅ Imported ${ok} products. ${fail} failed/skipped.`);
    setImporting(false);
    if (ok > 0) setTimeout(onImported, 1500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #DDE3EA', background: '#F0F4F8', borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>📊 Import Products from Excel</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#90A4AE' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          <div style={{ background: '#E3F2FD', border: '1.5px solid #1565C0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#1565C0' }}>
            <strong>Excel column format:</strong> Code | Name | Rate | Group (optional)<br />
            Row 1 = header. Supports .xlsx, .xls, .csv files.
          </div>
          <div style={{ marginBottom: 16 }}>
            <input type='file' accept='.xlsx,.xls,.csv'
              onChange={e => { if (e.target.files[0]) parseExcel(e.target.files[0]); }}
              style={{ width: '100%', padding: '10px', border: '2px dashed #DDE3EA', borderRadius: 10, fontSize: 14, cursor: 'pointer' }} />
          </div>
          {rows.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: '#546E7A', marginBottom: 8 }}>Preview — {rows.length} rows found:</div>
              <div style={{ border: '1px solid #DDE3EA', borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#1565C0' }}>
                    {['Code', 'Name', 'Rate', 'Group'].map(h => <th key={h} style={{ padding: '7px 10px', color: '#fff', textAlign: 'left', fontWeight: 700 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F0F4F8', background: i % 2 === 0 ? '#fff' : '#F5F7FA' }}>
                        <td style={{ padding: '6px 10px' }}>{r.Code || r.code || r.CODE || '—'}</td>
                        <td style={{ padding: '6px 10px' }}>{r.Name || r.name || r.NAME || r.ITEM || '—'}</td>
                        <td style={{ padding: '6px 10px' }}>₹{r.Rate || r.rate || r.RATE || r.Price || 0}</td>
                        <td style={{ padding: '6px 10px' }}>{r.Group || r.group || r.GROUP || '—'}</td>
                      </tr>
                    ))}
                    {rows.length > 10 && <tr><td colSpan={4} style={{ padding: '6px 10px', color: '#90A4AE', textAlign: 'center' }}>...and {rows.length - 10} more</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {result && <div style={{ marginTop: 14, padding: '10px 14px', background: '#E8F5E9', border: '1px solid #2E7D32', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#2E7D32' }}>{result}</div>}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #DDE3EA', display: 'flex', gap: 10 }}>
          <button disabled={!rows.length || importing} onClick={doImport}
            style={{ flex: 1, padding: 12, background: rows.length && !importing ? '#2E7D32' : '#B0BEC5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: rows.length && !importing ? 'pointer' : 'not-allowed' }}>
            {importing ? 'Importing...' : `📥 Import ${rows.length} Products`}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: '#F0F4F8', border: '1px solid #DDE3EA', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#546E7A' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [depts, setDepts] = useState([]);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [showImport, setShowImport] = useState(false);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, g, d] = await Promise.all([masterAPI.getProducts(), masterAPI.getGroups(), masterAPI.getDepartments()]);
      setItems(p.data); setGroups(g.data); setDepts(d.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setFlag = (k, v) => setForm(p => ({ ...p, flags: { ...p.flags, [k]: v } }));

  const save = async () => {
    try {
      if (selected?._id) { await masterAPI.updateProduct(selected._id, form); notify('✅ Updated'); }
      else { const r = await masterAPI.createProduct(form); setSelected(r.data); notify('✅ Created'); }
      load();
    } catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  const del = async () => {
    if (!selected?._id || !window.confirm('Delete?')) return;
    try { await masterAPI.deleteProduct(selected._id); setSelected(null); setForm(emptyProduct); load(); } catch { }
  };

  return (
    <MasterList items={items} selected={selected} onSelect={i => { setSelected(i); setForm(i); }} onNew={() => { setSelected(null); setForm(emptyProduct); }} onSave={save} onDelete={del} loading={loading} title='Products'>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: theme.radius.md, padding: '7px 12px', marginBottom: 12, fontWeight: 700, fontSize: theme.fontSize.sm }}>{toast}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>
        <Card title='Product Details'>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input label='Code' value={form.code} onChange={v => setForm(p => ({ ...p, code: v }))} required />
            <Input label='Unit Name' value={form.unitName} onChange={v => setForm(p => ({ ...p, unitName: v }))} />
          </div>
          <Input label='Product Name (English)' value={form.name} onChange={v => setForm(p => ({ ...p, name: v.toUpperCase() }))} required />
          {/* Local Language Names */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              🌐 Local Language Names
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { code: 'ta', label: 'தமிழ் (Tamil)' },
                { code: 'hi', label: 'हिन्दी (Hindi)' },
                { code: 'te', label: 'తెలుగు (Telugu)' },
                { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
                { code: 'ml', label: 'മലയാളം (Malayalam)' },
              ].map(lang => (
                <Input
                  key={lang.code}
                  label={lang.label}
                  value={(form.localNames && (typeof form.localNames.get === 'function' ? form.localNames.get(lang.code) : form.localNames[lang.code])) || ''}
                  onChange={v => setForm(p => ({
                    ...p,
                    localNames: { ...(typeof p.localNames?.toJSON === 'function' ? p.localNames.toJSON() : (p.localNames || {})), [lang.code]: v }
                  }))}
                  placeholder={form.name || 'Enter name'}
                />
              ))}
            </div>
          </div>
          {/* FIX #8: Image upload */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Image</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {form.imageUrl && <img src={form.imageUrl} alt='preview' style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '6px', border: `1px solid ${C.border}` }} />}
              <input type='file' accept='image/*'
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  // Compress image to max 200x200 to keep payload small
                  const img = new Image();
                  img.onload = () => {
                    const MAX = 200;
                    let w = img.width, h = img.height;
                    if (w > MAX || h > MAX) {
                      if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                      else { w = Math.round(w * MAX / h); h = MAX; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const compressed = canvas.toDataURL('image/jpeg', 0.7);
                    setForm(p => ({ ...p, imageUrl: compressed }));
                    URL.revokeObjectURL(img.src);
                  };
                  img.src = URL.createObjectURL(file);
                }}
                style={{ flex: 1, fontSize: '12px', color: C.text }} />
              {form.imageUrl && <button onClick={() => setForm(p => ({ ...p, imageUrl: '' }))} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 14 }}>✕</button>}
            </div>
          </div>
          <Input label='Rate (₹)' type='number' value={form.rate} onChange={v => setForm(p => ({ ...p, rate: parseFloat(v) || 0 }))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Input label='CGST %' type='number' value={form.cgst} onChange={v => setForm(p => ({ ...p, cgst: parseFloat(v) || 0 }))} />
            <Input label='SGST %' type='number' value={form.sgst} onChange={v => setForm(p => ({ ...p, sgst: parseFloat(v) || 0 }))} />
            <Input label='CESS %' type='number' value={form.cess} onChange={v => setForm(p => ({ ...p, cess: parseFloat(v) || 0 }))} />
          </div>
          <Select label='Group' value={form.groupName} onChange={v => setForm(p => ({ ...p, groupName: v }))} options={groups.map(g => ({ value: g.name, label: g.name }))} />
          <Select label='Department' value={form.department || ''} onChange={v => {
            const dept = depts.find(d => d._id === v);
            setForm(p => ({ ...p, department: v, departmentName: dept?.name || '' }));
          }} options={depts.map(d => ({ value: d._id, label: `${d.name} (${d.quantityFormat})` }))} />

        </Card>
        <Card title='Flags & Options'>
          {[['active', 'Active'], ['allowGst', 'Allow GST'], ['maintainStock', 'Maintain Stock'], ['barItem', 'Bar Item'], ['fastMoving', 'Fast Moving']].map(([k, l]) => (
            <Checkbox key={k} label={l} checked={form.flags?.[k] || false} onChange={v => setFlag(k, v)} />
          ))}
          {selected && (
            <div style={{ marginTop: 12, padding: 10, background: C.surfaceAlt, borderRadius: theme.radius.md }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>PRODUCT PREVIEW</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{form.name}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>₹{form.rate}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {form.groupName && <span style={{ fontSize: 10, padding: '2px 8px', background: C.primaryBg, color: C.primary, borderRadius: 100, fontWeight: 600 }}>📁 {form.groupName}</span>}
                {form.departmentName && <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(99,102,241,0.1)', color: '#6366F1', borderRadius: 100, fontWeight: 600 }}>🏷️ {form.departmentName}</span>}
              </div>
            </div>
          )}
        </Card>
      </div>
    </MasterList>
  );
}

// ─────────────────────── TABLES ───────────────────────────
const emptyTable = { name: '', capacity: 4 };

function TablesTab() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyTable);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await masterAPI.getTables(); setItems(r.data); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (selected?._id) { await masterAPI.updateTable(selected._id, form); notify('✅ Updated'); }
      else { const r = await masterAPI.createTable(form); setSelected(r.data); notify('✅ Created'); }
      load();
    } catch (e) { notify('❌ Error'); }
  };

  const del = async () => {
    if (!selected?._id || !window.confirm('Delete?')) return;
    try { await masterAPI.deleteTable(selected._id); setSelected(null); setForm(emptyTable); load(); } catch { }
  };

  return (
    <MasterList items={items} selected={selected} onSelect={i => { setSelected(i); setForm(i); }} onNew={() => { setSelected(null); setForm(emptyTable); }} onSave={save} onDelete={del} loading={loading} title='Tables'>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: theme.radius.md, padding: '7px 12px', marginBottom: 12, fontWeight: 700, fontSize: theme.fontSize.sm }}>{toast}</div>}
      <Card title={selected?._id ? `Edit: ${selected.name}` : 'New Table'} style={{ maxWidth: 420 }}>
        <Input label='Table Name' value={form.name} onChange={v => setForm(p => ({ ...p, name: v.toUpperCase() }))} required />
        <Input label='Capacity (Persons)' type='number' value={form.capacity} onChange={v => setForm(p => ({ ...p, capacity: parseInt(v) || 0 }))} />
        <Select label='Status' value={form.status || 'available'} onChange={v => setForm(p => ({ ...p, status: v }))}
          options={['available', 'occupied', 'reserved'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
      </Card>
    </MasterList>
  );
}

// ─────────────────────── CUSTOMERS ───────────────────────────
const emptyCustomer = { name: '', phone: '', mobile: '', address: '', email: '' };

function CustomersTab() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await masterAPI.getCustomers(); setItems(r.data); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (selected?._id) { await masterAPI.updateCustomer(selected._id, form); notify('✅ Updated'); }
      else { const r = await masterAPI.createCustomer(form); setSelected(r.data); notify('✅ Created'); }
      load();
    } catch (e) { notify('❌ Error'); }
  };

  const del = async () => {
    if (!selected?._id || !window.confirm('Delete?')) return;
    try { await masterAPI.deleteCustomer(selected._id); setSelected(null); setForm(emptyCustomer); load(); } catch { }
  };

  return (
    <MasterList items={items} selected={selected} onSelect={i => { setSelected(i); setForm(i); }} onNew={() => { setSelected(null); setForm(emptyCustomer); }} onSave={save} onDelete={del} loading={loading} title='Customers'>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: theme.radius.md, padding: '7px 12px', marginBottom: 12, fontWeight: 700, fontSize: theme.fontSize.sm }}>{toast}</div>}
      <Card title={selected?._id ? `Edit: ${selected.name}` : 'New Customer'} style={{ maxWidth: 480 }}>
        <Input label='Customer Name' value={form.name} onChange={v => setForm(p => ({ ...p, name: v.toUpperCase() }))} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Input label='Phone' value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          <Input label='Mobile' value={form.mobile} onChange={v => setForm(p => ({ ...p, mobile: v }))} />
        </div>
        <Input label='Email' value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
        <Input label='Address' value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />
      </Card>
    </MasterList>
  );
}

// ─────────────────────── WAITERS / CAPTAINS (generic staff tab) ───────────────────────────
function StaffTab({ title, getAll, create, update, del }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getAll(); setItems(r.data); } finally { setLoading(false); }
  }, [getAll]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name) return notify('Name required');
    try {
      if (selected?._id) { await update(selected._id, form); notify('✅ Updated'); }
      else { const r = await create(form); setSelected(r.data); notify('✅ Created'); }
      load();
    } catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  const doDelete = async () => {
    if (!selected?._id || !window.confirm('Delete?')) return;
    try { await del(selected._id); setSelected(null); setForm({ name: '', phone: '' }); load(); }
    catch { notify('❌ Error'); }
  };

  return (
    <MasterList items={items} selected={selected} onSelect={i => { setSelected(i); setForm(i); }}
      onNew={() => { setSelected(null); setForm({ name: '', phone: '' }); }}
      onSave={save} onDelete={doDelete} loading={loading} title={title}>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: '6px', padding: '7px 12px', marginBottom: 12, fontWeight: 700, fontSize: '12px' }}>{toast}</div>}
      <Card title={selected?._id ? `Edit: ${selected.name}` : `New ${title}`} style={{ maxWidth: 420 }}>
        <Input label='Name' value={form.name || ''} onChange={v => setForm(p => ({ ...p, name: v.toUpperCase() }))} required />
        <Input label='Phone' value={form.phone || ''} onChange={v => setForm(p => ({ ...p, phone: v }))} />
      </Card>
    </MasterList>
  );
}

// ─────────────────────── RATE INFO (Hybrid Pricing) ───────────────────────────
function RateInfoTab() {
  const [products, setProducts] = useState([]);
  const [salesModes, setSalesModes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [pricingMode, setPricingMode] = useState('common'); // 'common' or 'branch'
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchProducts, setBranchProducts] = useState([]);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, sm, br] = await Promise.all([
        masterAPI.getBranchRates(),
        masterAPI.getSalesModes(),
        masterAPI.getBranches(),
      ]);
      setProducts(p.data);
      setSalesModes(sm.data);
      setBranches(br.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // ── Common pricing helpers ──
  const getRate = (product, salesModeId) => {
    const r = product.rates?.find(r => (r.salesMode?._id || r.salesMode) === salesModeId);
    return r ? r.rate : 0;
  };

  const setRate = (productId, salesModeId, rate) => {
    setProducts(prev => prev.map(p => {
      if (p._id === productId) {
        let rates = [...(p.rates || [])];
        const idx = rates.findIndex(r => (r.salesMode?._id || r.salesMode) === salesModeId);
        if (idx >= 0) {
          rates[idx] = { ...rates[idx], rate: parseFloat(rate) || 0 };
        } else {
          rates.push({ salesMode: salesModeId, rate: parseFloat(rate) || 0 });
        }
        return { ...p, rates };
      }
      return p;
    }));
  };

  const saveCommon = async () => {
    try {
      const data = products.map(p => ({
        _id: p._id,
        rates: (p.rates || []).map(r => ({
          salesMode: r.salesMode?._id || r.salesMode,
          rate: r.rate
        }))
      }));
      await masterAPI.updateProductRates(data);
      notify('✅ Common rates updated for all branches');
    } catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  // ── Branch pricing helpers ──
  useEffect(() => {
    if (selectedBranch && products.length > 0) {
      setBranchProducts(products.map(p => {
        const branchEntry = (p.branchRates || []).find(br => {
          const brId = br.branch?._id || br.branch;
          return brId?.toString() === selectedBranch;
        });
        return {
          ...p,
          _branchRate: branchEntry?.rate || 0,
          _branchSalesModeRates: branchEntry?.salesModeRates || [],
          _hasOverride: !!branchEntry && (branchEntry.rate > 0 || (branchEntry.salesModeRates || []).some(smr => smr.rate > 0)),
        };
      }));
    }
  }, [selectedBranch, products]);

  const getBranchRate = (product, salesModeId) => {
    const smRate = product._branchSalesModeRates?.find(smr => {
      const smId = smr.salesMode?._id || smr.salesMode;
      return smId?.toString() === salesModeId;
    });
    return smRate?.rate || 0;
  };

  const setBranchRate = (productId, salesModeId, rate) => {
    setBranchProducts(prev => prev.map(p => {
      if (p._id !== productId) return p;
      if (salesModeId === '__base__') {
        return { ...p, _branchRate: parseFloat(rate) || 0, _hasOverride: true };
      }
      let smRates = [...(p._branchSalesModeRates || [])];
      const idx = smRates.findIndex(smr => (smr.salesMode?._id || smr.salesMode)?.toString() === salesModeId);
      if (idx >= 0) {
        smRates[idx] = { ...smRates[idx], rate: parseFloat(rate) || 0 };
      } else {
        smRates.push({ salesMode: salesModeId, rate: parseFloat(rate) || 0 });
      }
      return { ...p, _branchSalesModeRates: smRates, _hasOverride: true };
    }));
  };

  const clearBranchOverride = (productId) => {
    setBranchProducts(prev => prev.map(p => {
      if (p._id !== productId) return p;
      return { ...p, _branchRate: 0, _branchSalesModeRates: [], _hasOverride: false };
    }));
  };

  const saveBranch = async () => {
    if (!selectedBranch) return notify('❌ Select a branch first');
    try {
      const data = {
        branchId: selectedBranch,
        products: branchProducts.map(p => ({
          _id: p._id,
          rate: p._branchRate || 0,
          salesModeRates: (p._branchSalesModeRates || []).map(smr => ({
            salesMode: smr.salesMode?._id || smr.salesMode,
            rate: smr.rate || 0,
          }))
        }))
      };
      await masterAPI.updateBranchRates(data);
      notify(`✅ Branch pricing saved for ${branches.find(b => b._id === selectedBranch)?.name || 'branch'}`);
      load(); // Reload to get updated data
    } catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  // Group products by department
  const groupByDept = (items) => {
    const groups = {};
    items.forEach(p => {
      const dept = p.departmentName || 'Uncategorized';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(p);
    });
    // Sort departments alphabetically, but put 'Uncategorized' last
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
  };

  const [collapsedDepts, setCollapsedDepts] = useState({});
  const toggleDept = (dept) => setCollapsedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const thStyle = { padding: '8px 12px', border: `1px solid ${C.border}`, textAlign: 'center', fontWeight: 700, fontSize: theme.fontSize.xs };
  const tdStyle = { padding: '6px 10px', border: `1px solid ${C.border}`, textAlign: 'center' };

  // Distinct department colors for visual grouping
  const deptColors = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#BE185D'];
  const getDeptColor = (idx) => deptColors[idx % deptColors.length];

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: theme.radius.md, padding: '8px 12px', marginBottom: 12, fontWeight: 700, fontSize: theme.fontSize.sm }}>{toast}</div>}

      {/* Pricing Mode Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `2px solid ${C.border}` }}>
        {[
          { key: 'common', icon: '🌐', label: 'Common Pricing', desc: 'All Branches' },
          { key: 'branch', icon: '🏢', label: 'Branch Pricing', desc: 'Per Branch Override' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setPricingMode(tab.key)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: theme.fontSize.sm, fontWeight: 700,
            background: pricingMode === tab.key ? C.primaryBg : 'transparent',
            color: pricingMode === tab.key ? C.primary : C.textMuted,
            borderBottom: pricingMode === tab.key ? `3px solid ${C.primary}` : '3px solid transparent',
            borderRadius: '8px 8px 0 0', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div>{tab.label}</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{tab.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── COMMON PRICING TAB ── */}
      {pricingMode === 'common' && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            padding: '12px 16px', borderRadius: theme.radius.md,
            background: 'rgba(37,99,235,0.06)', border: `1.5px solid ${C.primary}`,
          }}>
            <span style={{ fontSize: 24 }}>🌐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 800, color: C.primary }}>Common Pricing — All Branches</div>
              <div style={{ fontSize: theme.fontSize.xs, color: C.textMuted }}>
                These rates apply to ALL branches by default. Branch-specific overrides (if any) take priority.
              </div>
            </div>
            <button onClick={saveCommon} style={{ padding: '9px 24px', background: C.primary, color: '#fff', border: 'none', borderRadius: theme.radius.md, fontSize: theme.fontSize.sm, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              💾 Save Common Rates
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
              <thead>
                <tr style={{ background: C.surfaceAlt }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Code</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Name</th>
                  <th style={{ ...thStyle, background: 'rgba(37,99,235,0.08)' }}>Base ₹</th>
                  {salesModes.map(sm => (
                    <th key={sm._id} style={thStyle}>{sm.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupByDept(products).map(([deptName, deptProducts], deptIdx) => {
                  const color = getDeptColor(deptIdx);
                  const isCollapsed = collapsedDepts[`common_${deptName}`];
                  const colCount = 3 + salesModes.length;
                  return (
                    <React.Fragment key={deptName}>
                      <tr
                        onClick={() => toggleDept(`common_${deptName}`)}
                        style={{
                          background: `${color}11`,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <td colSpan={colCount} style={{
                          padding: '10px 14px',
                          border: `1px solid ${C.border}`,
                          borderLeft: `4px solid ${color}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 22, height: 22, borderRadius: 6, background: `${color}18`,
                              fontSize: 12, fontWeight: 800, color,
                              transition: 'transform 0.2s',
                              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            }}>▾</span>
                            <span style={{ fontWeight: 800, fontSize: theme.fontSize.sm, color }}>{deptName}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: '#fff', background: color,
                              borderRadius: 10, padding: '1px 8px', marginLeft: 4,
                            }}>{deptProducts.length}</span>
                          </div>
                        </td>
                      </tr>
                      {!isCollapsed && deptProducts.map(p => (
                        <tr key={p._id} style={{ background: (p.branchRates?.length > 0) ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                          <td style={{ ...tdStyle, textAlign: 'left', fontSize: theme.fontSize.xs }}>{p.code}</td>
                          <td style={{ ...tdStyle, textAlign: 'left' }}>
                            {p.name}
                            {p.branchRates?.length > 0 && (
                              <span title={`${p.branchRates.length} branch override(s)`} style={{ marginLeft: 6, fontSize: 10, color: '#F59E0B' }}>
                                🏢 {p.branchRates.length}
                              </span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, background: 'rgba(37,99,235,0.04)' }}>
                            <span style={{ fontWeight: 700, color: C.primary }}>₹{p.rate}</span>
                          </td>
                          {salesModes.map(sm => (
                            <td key={sm._id} style={tdStyle}>
                              <input
                                type="number"
                                value={getRate(p, sm._id)}
                                onChange={e => setRate(p._id, sm._id, e.target.value)}
                                style={{ width: 65, padding: '4px 6px', border: `1px solid ${C.border}`, borderRadius: 4, textAlign: 'center', fontSize: theme.fontSize.xs }}
                                placeholder="0"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── BRANCH PRICING TAB ── */}
      {pricingMode === 'branch' && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            padding: '12px 16px', borderRadius: theme.radius.md,
            background: 'rgba(99,102,241,0.06)', border: `1.5px solid #6366F1`,
          }}>
            <span style={{ fontSize: 24 }}>🏢</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 800, color: '#6366F1' }}>Branch-Specific Pricing</div>
              <div style={{ fontSize: theme.fontSize.xs, color: C.textMuted }}>
                Override prices for a specific branch. Leave at 0 to use common pricing. Non-zero values override the common rate.
              </div>
            </div>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              style={{
                padding: '9px 14px', border: `2px solid ${selectedBranch ? '#6366F1' : C.border}`, borderRadius: theme.radius.md,
                fontSize: theme.fontSize.sm, fontWeight: 700, cursor: 'pointer', minWidth: 180,
                background: selectedBranch ? 'rgba(99,102,241,0.06)' : C.surface,
                color: C.text,
              }}
            >
              <option value="">— Select Branch —</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            {selectedBranch && (
              <button onClick={saveBranch} style={{ padding: '9px 24px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: theme.radius.md, fontSize: theme.fontSize.sm, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                💾 Save Branch Rates
              </button>
            )}
          </div>

          {!selectedBranch ? (
            <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Select a Branch</div>
              <div style={{ fontSize: 13 }}>Choose a branch from the dropdown above to set branch-specific prices.</div>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: theme.fontSize.xs, color: C.textMuted }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.4)' }}></span>
                  Branch override active
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: C.surfaceAlt, border: `1px solid ${C.border}` }}></span>
                  Using common price
                </span>
                <span style={{ fontWeight: 600 }}>💡 Enter 0 = use common price</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
                  <thead>
                    <tr style={{ background: C.surfaceAlt }}>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Code</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Product</th>
                      <th style={{ ...thStyle, background: 'rgba(37,99,235,0.08)' }}>Common ₹</th>
                      <th style={{ ...thStyle, background: 'rgba(99,102,241,0.08)' }}>🏢 Branch Base ₹</th>
                      {salesModes.map(sm => (
                        <th key={sm._id} style={thStyle}>
                          <div>{sm.name}</div>
                          <div style={{ fontSize: 9, fontWeight: 400, color: C.textMuted }}>(common → branch)</div>
                        </th>
                      ))}
                      <th style={{ ...thStyle, width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupByDept(branchProducts).map(([deptName, deptProducts], deptIdx) => {
                      const color = getDeptColor(deptIdx);
                      const isCollapsed = collapsedDepts[`branch_${deptName}`];
                      const colCount = 5 + salesModes.length;
                      return (
                        <React.Fragment key={deptName}>
                          <tr
                            onClick={() => toggleDept(`branch_${deptName}`)}
                            style={{
                              background: `${color}11`,
                              cursor: 'pointer',
                              userSelect: 'none',
                            }}
                          >
                            <td colSpan={colCount} style={{
                              padding: '10px 14px',
                              border: `1px solid ${C.border}`,
                              borderLeft: `4px solid ${color}`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: 22, height: 22, borderRadius: 6, background: `${color}18`,
                                  fontSize: 12, fontWeight: 800, color,
                                  transition: 'transform 0.2s',
                                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                }}>▾</span>
                                <span style={{ fontWeight: 800, fontSize: theme.fontSize.sm, color }}>{deptName}</span>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, color: '#fff', background: color,
                                  borderRadius: 10, padding: '1px 8px', marginLeft: 4,
                                }}>{deptProducts.length}</span>
                              </div>
                            </td>
                          </tr>
                          {!isCollapsed && deptProducts.map(p => {
                            const hasOverride = p._hasOverride;
                            return (
                              <tr key={p._id} style={{ background: hasOverride ? 'rgba(22,163,74,0.03)' : 'transparent' }}>
                                <td style={{ ...tdStyle, textAlign: 'left', fontSize: theme.fontSize.xs }}>{p.code}</td>
                                <td style={{ ...tdStyle, textAlign: 'left' }}>
                                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                                  {hasOverride && <span style={{ fontSize: 9, color: '#16A34A', fontWeight: 700 }}>🏢 BRANCH OVERRIDE</span>}
                                </td>
                                {/* Common base rate (read-only) */}
                                <td style={{ ...tdStyle, background: 'rgba(37,99,235,0.04)', color: C.textMuted }}>
                                  ₹{p.rate}
                                </td>
                                {/* Branch base rate */}
                                <td style={{
                                  ...tdStyle,
                                  background: p._branchRate > 0 ? 'rgba(22,163,74,0.08)' : 'transparent',
                                  border: p._branchRate > 0 ? '1px solid rgba(22,163,74,0.3)' : `1px solid ${C.border}`,
                                }}>
                                  <input
                                    type="number"
                                    value={p._branchRate || ''}
                                    onChange={e => setBranchRate(p._id, '__base__', e.target.value)}
                                    placeholder={String(p.rate)}
                                    style={{
                                      width: 65, padding: '4px 6px',
                                      border: `1px solid ${p._branchRate > 0 ? 'rgba(22,163,74,0.4)' : C.border}`,
                                      borderRadius: 4, textAlign: 'center', fontSize: theme.fontSize.xs,
                                      background: p._branchRate > 0 ? 'rgba(22,163,74,0.06)' : 'transparent',
                                      fontWeight: p._branchRate > 0 ? 700 : 400,
                                    }}
                                  />
                                </td>
                                {/* Sales mode rates */}
                                {salesModes.map(sm => {
                                  const commonSmRate = getRate(p, sm._id);
                                  const branchSmRate = getBranchRate(p, sm._id);
                                  const isOverridden = branchSmRate > 0;
                                  return (
                                    <td key={sm._id} style={{
                                      ...tdStyle,
                                      background: isOverridden ? 'rgba(22,163,74,0.08)' : 'transparent',
                                    }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <span style={{ fontSize: 9, color: C.textMuted }}>
                                          {commonSmRate > 0 ? `₹${commonSmRate}` : `₹${p.rate}`}
                                        </span>
                                        <input
                                          type="number"
                                          value={branchSmRate || ''}
                                          onChange={e => setBranchRate(p._id, sm._id, e.target.value)}
                                          placeholder="0"
                                          style={{
                                            width: 65, padding: '3px 5px',
                                            border: `1px solid ${isOverridden ? 'rgba(22,163,74,0.4)' : C.border}`,
                                            borderRadius: 4, textAlign: 'center', fontSize: theme.fontSize.xs,
                                            background: isOverridden ? 'rgba(22,163,74,0.06)' : 'transparent',
                                            fontWeight: isOverridden ? 700 : 400,
                                          }}
                                        />
                                      </div>
                                    </td>
                                  );
                                })}
                                {/* Clear override */}
                                <td style={tdStyle}>
                                  {hasOverride && (
                                    <button
                                      onClick={() => clearBranchOverride(p._id)}
                                      title="Clear branch override — use common pricing"
                                      style={{
                                        background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)',
                                        borderRadius: 4, cursor: 'pointer', fontSize: 12, padding: '2px 6px',
                                        color: C.danger,
                                      }}
                                    >✕</button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────── SALES MODES ───────────────────────────
function SalesModesTab() {
  const [items, setItems] = useState([]);
  const [rates, setRates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'dine_in', rateInfo: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sm, r] = await Promise.all([masterAPI.getSalesModes(), masterAPI.getRateInfo()]);
      setItems(sm.data); setRates(r.data);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name) return notify('Name required');
    try {
      if (selected?._id) { await masterAPI.updateSalesMode(selected._id, form); notify('✅ Updated'); }
      else { const r = await masterAPI.createSalesMode(form); setSelected(r.data); notify('✅ Created'); }
      load();
    } catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  const MODE_TYPES = [
    { value: 'dine_in', label: 'Dine In' },
    { value: 'parcel', label: 'Parcel' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'online', label: 'Online (Swiggy/Zomato)' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <MasterList items={items} selected={selected} onSelect={i => { setSelected(i); setForm(i); }}
      onNew={() => { setSelected(null); setForm({ name: '', type: 'dine_in', rateInfo: '' }); }}
      onSave={save} onDelete={async () => { if (!selected?._id || !window.confirm('Delete?')) return; await masterAPI.deleteSalesMode(selected._id); setSelected(null); load(); }}
      loading={loading} title='Sales Modes'>
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: '6px', padding: '7px 12px', marginBottom: 12, fontWeight: 700, fontSize: '12px' }}>{toast}</div>}
      <Card title={selected?._id ? `Edit: ${selected.name}` : 'New Sales Mode'} style={{ maxWidth: 480 }}>
        <Input label='Mode Name (e.g. Dine In, Parcel, Swiggy, Zomato)' value={form.name || ''} onChange={v => setForm(p => ({ ...p, name: v }))} required />
        <Select label='Mode Type' value={form.type || 'dine_in'} onChange={v => setForm(p => ({ ...p, type: v }))} options={MODE_TYPES} />
        <Select label='Rate Info (optional price tier)' value={form.rateInfo || ''} onChange={v => setForm(p => ({ ...p, rateInfo: v }))}
          options={rates.map(r => ({ value: r._id, label: `${r.name} (×${r.multiplier})` }))} />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Dine In', 'Parcel', 'Swiggy', 'Zomato', 'Uber Eats', 'Drive-through'].map(preset => (
            <button key={preset} onClick={() => setForm(p => ({ ...p, name: preset }))}
              style={{ padding: '4px 10px', fontSize: '11px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: '20px', cursor: 'pointer', color: C.text }}>
              {preset}
            </button>
          ))}
        </div>
      </Card>
    </MasterList>
  );
}
