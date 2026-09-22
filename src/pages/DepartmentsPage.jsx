import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { masterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { C, theme } from '../utils/theme';
import { Input, Select, Card } from '../components/common/UI';
import MasterList from '../components/master/MasterList';
import PrinterSubForm from '../components/master/PrinterSubForm';

const UNIT_OPTIONS = [
  'g', 'kg', 'ml', 'l', 'pieces', 'box', 'packet',
  'plate', 'cup', 'glass', 'bottle', 'dozen', 'tray',
  'pack', 'bundle', 'pair', 'set', 'nos',
];
const emptyDept = { name: '', languageName: '', quantityFormat: 'pcs', printer: {} };





export default function DepartmentsPage() {
  const { hasPermission, user } = useAuth();
  const isElevated = ['root', 'admin', 'branch_admin'].includes(user?.role);
  const canAccess = isElevated || hasPermission('departments') || hasPermission('master-departments');

  if (!canAccess) return <Navigate to='/dashboard' replace />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <DepartmentsPanel />
    </div>
  );
}

const emptyNewProduct = { code: '', name: '', rate: 0, unitName: 'pieces' };

function DepartmentsPanel() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyDept);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [deptProducts, setDeptProducts] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(emptyNewProduct);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, pc] = await Promise.all([masterAPI.getDepartments(), masterAPI.getDepartmentProductCounts().catch(() => ({ data: [] }))]);
      setItems(r.data);
      const countMap = {};
      (pc.data || []).forEach(c => { countMap[c._id] = c.count; });
      setProductCounts(countMap);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const select = async (item) => {
    setSelected(item);
    setForm({ ...item, printer: item.printer || {} });
    setNewProduct({ ...emptyNewProduct, unitName: item.quantityFormat || 'pieces' });
    try {
      const r = await masterAPI.getDepartmentProducts(item._id);
      setDeptProducts(r.data || []);
    } catch { setDeptProducts([]); }
  };
  const newItem = () => { setSelected(null); setForm(emptyDept); setDeptProducts([]); setShowAddProduct(false); };

  // Quick add product to current department
  const addProductToDept = async () => {
    if (!newProduct.name) return notify('❌ Product name required');
    if (!newProduct.code) return notify('❌ Product code required');
    setSavingProduct(true);
    try {
      if (editingProduct) {
        // Update existing product
        await masterAPI.updateProduct(editingProduct._id, {
          ...newProduct,
          name: newProduct.name.toUpperCase(),
          unitName: (newProduct.unitName || selected.quantityFormat || 'pieces').toUpperCase(),
          department: selected._id,
          departmentName: selected.name,
        });
        notify('✅ Product updated');
        setEditingProduct(null);
      } else {
        // Create new product
        await masterAPI.createProduct({
          ...newProduct,
          name: newProduct.name.toUpperCase(),
          unitName: (newProduct.unitName || selected.quantityFormat || 'pieces').toUpperCase(),
          department: selected._id,
          departmentName: selected.name,
          flags: { active: true, allowGst: false, maintainStock: false, fastMoving: false, barItem: false },
        });
        notify('✅ Product added to ' + selected.name);
      }
      setNewProduct({ ...emptyNewProduct, unitName: selected.quantityFormat || 'pieces' });
      setShowAddProduct(false);
      // Refresh product list
      const r = await masterAPI.getDepartmentProducts(selected._id);
      setDeptProducts(r.data || []);
      load();
    } catch (e) {
      notify('❌ ' + (e.response?.data?.message || 'Error saving product'));
    } finally { setSavingProduct(false); }
  };

  // Edit a product - load into form
  const startEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      code: product.code || '',
      name: product.name || '',
      rate: product.rate || 0,
      unitName: (product.unitName || 'pieces').toLowerCase(),
    });
    setShowAddProduct(true);
  };

  // Delete a product
  const deleteProductFromDept = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await masterAPI.deleteProduct(product._id);
      notify('✅ Product deleted');
      const r = await masterAPI.getDepartmentProducts(selected._id);
      setDeptProducts(r.data || []);
      load();
    } catch (e) {
      notify('❌ ' + (e.response?.data?.message || 'Error deleting product'));
    }
  };

  const save = async () => {
    if (!form.name) return notify('❌ Department name required');
    try {
      if (selected?._id) { const r = await masterAPI.updateDepartment(selected._id, form); setSelected(r.data); notify('✅ Updated'); }
      else { const r = await masterAPI.createDepartment(form); setSelected(r.data); notify('✅ Created'); }
      load();
    } catch (e) { notify('❌ ' + (e.response?.data?.message || 'Error')); }
  };

  const del = async () => {
    if (!selected?._id || !window.confirm('Delete this department?')) return;
    try { await masterAPI.deleteDepartment(selected._id); setSelected(null); setForm(emptyDept); setDeptProducts([]); load(); notify('Deleted'); }
    catch (e) { notify('❌ Error'); }
  };



  return (
    <MasterList items={items} selected={selected} onSelect={select} onNew={newItem} onSave={save} onDelete={del} loading={loading} title='Departments'
      renderItem={(item, index) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
            {index + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: selected?._id === item._id ? 700 : 500, color: selected?._id === item._id ? C.primary : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(99,102,241,0.1)', color: '#6366F1', borderRadius: 3, fontWeight: 600 }}>{item.quantityFormat}</span>
              {productCounts[item._id] > 0 && (
                <span style={{ fontSize: 9, padding: '1px 5px', background: C.successBg, color: C.success, borderRadius: 3, fontWeight: 600 }}>{productCounts[item._id]} items</span>
              )}
            </div>
          </div>
        </div>
      )}
    >
      {toast && <div style={{ background: C.successBg, border: `1px solid ${C.success}`, color: C.success, borderRadius: theme.radius.md, padding: '7px 12px', marginBottom: 12, fontWeight: 700, fontSize: theme.fontSize.sm }}>{toast}</div>}



      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <Card title={selected?._id ? `Edit: ${selected.name}` : 'New Department'}>
          <Input label='Department Name' value={form.name} onChange={v => setForm(p => ({ ...p, name: v.toUpperCase() }))} required />
          <Select label='Default Measurement Unit' value={form.quantityFormat || 'pieces'} onChange={v => setForm(p => ({ ...p, quantityFormat: v }))}
            options={UNIT_OPTIONS.map(u => ({ value: u, label: u.toUpperCase() }))} />
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Quick Presets</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {UNIT_OPTIONS.map(u => (
                <button key={u} onClick={() => setForm(p => ({ ...p, quantityFormat: u }))}
                  style={{
                    padding: '3px 10px', fontSize: 11, borderRadius: 100, cursor: 'pointer', fontWeight: 600,
                    background: form.quantityFormat === u ? 'rgba(99,102,241,0.15)' : C.surfaceAlt,
                    border: `1px solid ${form.quantityFormat === u ? '#6366F1' : C.border}`,
                    color: form.quantityFormat === u ? '#6366F1' : C.textMuted,
                    transition: 'all 0.15s',
                  }}>{u.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {/* Separate in Billing toggle */}
          <div style={{ marginTop: 10, padding: '8px 10px', background: form.separateInBilling ? 'rgba(245,158,11,0.08)' : C.surfaceAlt, borderRadius: theme.radius.md, border: `1px solid ${form.separateInBilling ? '#F59E0B' : C.border}`, transition: 'all 0.2s' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
              <input type='checkbox' checked={!!form.separateInBilling} onChange={e => setForm(p => ({ ...p, separateInBilling: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: '#F59E0B', cursor: 'pointer' }} />
              <div>
                <div style={{ fontWeight: 700, color: C.text }}>Separate in Billing</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>Items only show when this department tab is selected, hidden from "All"</div>
              </div>
            </label>
          </div>
        </Card>

        <div >
          {(form.name || selected) && (
            <Card title='Department Preview'>
              <div style={{ padding: '14px 12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))', borderRadius: theme.radius.md, border: '1px solid rgba(99,102,241,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 800 }}>
                    {selected?._id ? items.findIndex(it => it._id === selected._id) + 1 : '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{form.name || 'Department Name'}</div>
                    {form.languageName && <div style={{ fontSize: 11, color: C.textMuted }}>{form.languageName}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(99,102,241,0.12)', color: '#6366F1', borderRadius: 100, fontWeight: 700 }}>
                    📐 Unit: {(form.quantityFormat || 'pieces').toUpperCase()}
                  </span>
                  {deptProducts.length > 0 && (
                    <span style={{ fontSize: 11, padding: '3px 10px', background: C.successBg, color: C.success, borderRadius: 100, fontWeight: 700 }}>
                      📦 {deptProducts.length} Products
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )}

          {selected?._id && (
            <Card title={`Products in ${selected.name}`} style={{ marginTop: 12 }}
              actions={
                <button onClick={() => {
                  setShowAddProduct(p => !p);
                  if (showAddProduct) { setEditingProduct(null); setNewProduct({ ...emptyNewProduct, unitName: selected.quantityFormat || 'pieces' }); }
                }} style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                  background: showAddProduct ? C.danger : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  border: 'none', color: '#fff', transition: 'all 0.2s',
                }}>{showAddProduct ? '✕ Cancel' : '＋ Add Product'}</button>
              }
            >
              {/* Quick Add Product Form */}
              {showAddProduct && (
                <div style={{
                  padding: 12, marginBottom: 10, fontSize: 12, borderRadius: theme.radius.md,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: editingProduct ? '#F59E0B' : '#6366F1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {editingProduct ? '✏️ Edit Product' : '＋ Add Product to ' + selected.name}
                  </div>
                  <Input label='Product Name *' value={newProduct.name} onChange={v => setNewProduct(p => ({ ...p, name: v.toUpperCase() }))} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <Input label='Product Code *' value={newProduct.code} onChange={v => setNewProduct(p => ({ ...p, code: v }))} />
                    <Input label='Price (₹)' type='number' value={newProduct.rate} onChange={v => setNewProduct(p => ({ ...p, rate: parseFloat(v) || 0 }))} />
                  </div>
                  <Select label='Measurement Unit' value={newProduct.unitName} onChange={v => setNewProduct(p => ({ ...p, unitName: v }))}
                    options={UNIT_OPTIONS.map(u => ({ value: u, label: u.toUpperCase() }))} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={addProductToDept} disabled={savingProduct} style={{
                      flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                      background: savingProduct ? C.textMuted : 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none', color: '#fff', transition: 'all 0.2s',
                    }}>✅ {editingProduct ? 'Update Product' : 'Save Product'}</button>
                    <button onClick={() => { setNewProduct({ ...emptyNewProduct, unitName: selected.quantityFormat || 'pieces' }); setEditingProduct(null); }} style={{
                      padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                      background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textMuted,
                    }}>Clear</button>
                  </div>
                </div>
              )}

              {deptProducts.length === 0 && !showAddProduct ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: C.textLight, fontSize: theme.fontSize.xs }}>
                  <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.5 }}>📦</div>
                  No products in this department yet.
                  <div style={{ fontSize: 10, marginTop: 4, color: C.textMuted }}>Click <strong>＋ Add Product</strong> above to add products.</div>
                </div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {deptProducts.map((p, i) => (
                    <div key={p._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '7px 10px', borderRadius: 6, fontSize: theme.fontSize.xs,
                      background: editingProduct?._id === p._id ? 'rgba(245,158,11,0.08)' : i % 2 === 0 ? C.surface : C.surfaceAlt,
                      borderBottom: `1px solid ${C.border}`,
                      borderLeft: editingProduct?._id === p._id ? '3px solid #F59E0B' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: C.textLight, fontWeight: 600, minWidth: 18 }}>{i + 1}.</span>
                          <span style={{ fontWeight: 600, color: C.text }}>{p.name}</span>
                          <span style={{ fontSize: 10, color: C.textLight }}>({p.code})</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 2, marginLeft: 24 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.primary }}>₹{p.rate}</span>
                          {p.unitName && <span style={{ fontSize: 9, padding: '0px 5px', background: 'rgba(99,102,241,0.1)', color: '#6366F1', borderRadius: 3, fontWeight: 600 }}>{p.unitName}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => startEditProduct(p)} title='Edit'
                          style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = '#6366F1'; }}
                          onMouseOut={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}
                        >✏️</button>
                        <button onClick={() => deleteProductFromDept(p)} title='Delete'
                          style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = '#EF4444'; }}
                          onMouseOut={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}
                        >🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Department Role Info Banner */}
      <div style={{
        marginTop: 18,
        maxWidth: 800,
        padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(59,130,246,0.06))',
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: theme.radius.md,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>ℹ️</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 4 }}>
            Configuration & Billing – Print Calculations
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
            The <strong style={{ color: '#6366F1' }}>Configuration</strong> department defines calculation parameters — tax rates, discount rules, and pricing structures.
            The <strong style={{ color: '#6366F1' }}>Billing</strong> department applies those rules to produce finalized calculations.
            When a calculation is <em>taken in print</em>, it has been processed through Billing using Configuration-defined rules and is now a permanent, documented record.
          </div>
        </div>
      </div>


    </MasterList >
  );
}
