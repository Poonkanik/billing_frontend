import { useState, useEffect, useMemo } from 'react';
import { inventoryAPI, masterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../utils/theme';

export default function InventoryPage() {
  const { user, isRoot } = useAuth();

  // Active tab: 'overview' | 'stockin' | 'stockout' | 'adjust' | 'transfers' | 'ledger' | 'suppliers'
  const [activeTab, setActiveTab] = useState('overview');

  // Core data states
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  // Filters for Overview tab
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Filters for Ledger tab
  const [ledgerType, setLedgerType] = useState('all');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    itemCode: '',
    itemName: '',
    category: 'General',
    unit: 'PCS',
    currentStock: 0,
    minStockAlert: 5,
    costPrice: 0,
    sellingPrice: 0,
    location: 'Main Store',
    supplier: '',
    autoDeductOnBill: true,
  });

  const [showStockInModal, setShowStockInModal] = useState(false);
  const [stockInForm, setStockInForm] = useState({
    itemId: '',
    qty: '',
    unitCost: '',
    supplierId: '',
    invoiceNo: '',
    notes: '',
  });

  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [stockOutForm, setStockOutForm] = useState({
    itemId: '',
    qty: '',
    category: 'Spoilage',
    reason: '',
  });

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    itemId: '',
    actualCount: '',
    reason: '',
  });

  const [transferForm, setTransferForm] = useState({
    itemId: '',
    toBranchId: '',
    qty: '',
    notes: '',
  });

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    contactPerson: '',
  });

  const isManagement = ['root', 'admin', 'branch_admin'].includes(user?.role);

  // Show Toast
  const showToast = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000);
  };

  // Initial Load
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [itemsRes, sumRes, supRes, branchRes] = await Promise.all([
        inventoryAPI.getAll({
          search,
          category: selectedCategory,
          stockStatus: selectedStockStatus,
          branch: selectedBranch,
        }),
        inventoryAPI.getSummary(),
        inventoryAPI.getSuppliers(),
        masterAPI.getBranches().catch(() => ({ data: [] })),
      ]);
      setItems(itemsRes.data || []);
      setSummary(sumRes.data || null);
      setSuppliers(supRes.data || []);
      setBranches(branchRes.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error loading inventory data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await inventoryAPI.getTransactions({
        type: ledgerType,
        search: ledgerSearch,
      });
      setTransactions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStockStatus, selectedBranch]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, ledgerType, ledgerSearch]);

  // Categories list derived from current items
  const categories = useMemo(() => {
    const set = new Set(['General', 'Raw Material', 'Finished Goods', 'Beverage', 'Grocery', 'Dairy', 'Meat', 'Packaging']);
    items.forEach(i => { if (i.category) set.add(i.category); });
    return Array.from(set);
  }, [items]);

  // Filtered items in memory for instant search
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = item.itemName?.toLowerCase().includes(q);
        const matchCode = item.itemCode?.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [items, search]);

  // Save Item (Create or Update)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem._id, itemForm);
        showToast('Item updated successfully');
      } else {
        await inventoryAPI.create(itemForm);
        showToast('Item created successfully');
      }
      setShowItemModal(false);
      setEditingItem(null);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving item', 'danger');
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate item "${name}"?`)) return;
    try {
      await inventoryAPI.delete(id);
      showToast(`Item "${name}" deactivated`);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting item', 'danger');
    }
  };

  // 1-Click Sync from Product Catalog
  const handleSyncProducts = async () => {
    if (!window.confirm('Sync all active menu products into inventory items?')) return;
    try {
      setLoading(true);
      const res = await inventoryAPI.syncProducts({});
      showToast(res.data.message || 'Product catalog synced!');
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Sync failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Stock In
  const handleStockIn = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.stockIn(stockInForm);
      showToast('Stock received successfully');
      setShowStockInModal(false);
      setStockInForm({ itemId: '', qty: '', unitCost: '', supplierId: '', invoiceNo: '', notes: '' });
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing Stock In', 'danger');
    }
  };

  // Stock Out / Wastage
  const handleStockOut = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.stockOut(stockOutForm);
      showToast('Wastage logged successfully');
      setShowStockOutModal(false);
      setStockOutForm({ itemId: '', qty: '', category: 'Spoilage', reason: '' });
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing Wastage', 'danger');
    }
  };

  // Adjust / Audit
  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.adjust(adjustForm);
      showToast('Stock count adjusted successfully');
      setShowAdjustModal(false);
      setAdjustForm({ itemId: '', actualCount: '', reason: '' });
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error adjusting stock', 'danger');
    }
  };

  // Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.transfer(transferForm);
      showToast('Stock transferred successfully');
      setShowTransferModal(false);
      setTransferForm({ itemId: '', toBranchId: '', qty: '', notes: '' });
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error transferring stock', 'danger');
    }
  };

  // Supplier Save
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await inventoryAPI.updateSupplier(editingSupplier._id, supplierForm);
        showToast('Supplier updated successfully');
      } else {
        await inventoryAPI.createSupplier(supplierForm);
        showToast('Supplier created successfully');
      }
      setShowSupplierModal(false);
      setEditingSupplier(null);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving supplier', 'danger');
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      await inventoryAPI.deleteSupplier(id);
      showToast(`Supplier "${name}" deleted`);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting supplier', 'danger');
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Toast Alert */}
      {msg.text && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: msg.type === 'danger' ? '#FEE2E2' : '#DCFCE7',
          color: msg.type === 'danger' ? '#991B1B' : '#166534',
          border: `1px solid ${msg.type === 'danger' ? '#F87171' : '#86EFAC'}`,
          fontWeight: 600, fontSize: 13, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>{msg.type === 'danger' ? '⚠️' : '✅'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>📦</span>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
              Inventory & Stock Management
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', color: C.textMuted, fontSize: 13 }}>
            Track real-time ingredients, materials, sales consumption, inward purchases, and multi-branch stock levels.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isManagement && (
            <>
              <button
                onClick={handleSyncProducts}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 15px', borderRadius: 8,
                  background: '#F1F5F9', border: '1px solid #CBD5E1',
                  color: '#334155', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'}
                onMouseOut={e => e.currentTarget.style.background = '#F1F5F9'}
                title="Automatically import all active POS menu items into inventory"
              >
                <span>🔄</span>
                <span>Sync Menu Products</span>
              </button>

              <button
                onClick={() => {
                  setStockInForm({ itemId: '', qty: '', unitCost: '', supplierId: '', invoiceNo: '', notes: '' });
                  setShowStockInModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 15px', borderRadius: 8,
                  background: '#10B981', border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#059669'}
                onMouseOut={e => e.currentTarget.style.background = '#10B981'}
              >
                <span>📥</span>
                <span>+ Stock In (Purchase)</span>
              </button>

              <button
                onClick={() => {
                  setStockOutForm({ itemId: '', qty: '', category: 'Spoilage', reason: '' });
                  setShowStockOutModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 15px', borderRadius: 8,
                  background: '#EF4444', border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#DC2626'}
                onMouseOut={e => e.currentTarget.style.background = '#EF4444'}
              >
                <span>📤</span>
                <span>- Log Wastage</span>
              </button>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemForm({
                    itemCode: `ITM${String(items.length + 1).padStart(3, '0')}`,
                    itemName: '',
                    category: 'General',
                    unit: 'PCS',
                    currentStock: 0,
                    minStockAlert: 5,
                    costPrice: 0,
                    sellingPrice: 0,
                    location: 'Main Store',
                    supplier: '',
                    autoDeductOnBill: true,
                  });
                  setShowItemModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 8,
                  background: C.primary, border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = C.primaryDark}
                onMouseOut={e => e.currentTarget.style.background = C.primary}
              >
                <span>➕</span>
                <span>Add Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Total Items */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Items</span>
              <span style={{ fontSize: 20 }}>🏷️</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginTop: 6 }}>{summary.totalItems || 0}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Catalog & Raw Materials</div>
          </div>

          {/* Stock Valuation (@ Cost) */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Valuation (Cost)</span>
              <span style={{ fontSize: 20 }}>💰</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 6 }}>
              ₹{(summary.totalCostValuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Total purchase cost in stock</div>
          </div>

          {/* Retail Valuation (@ Selling) */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Retail Value</span>
              <span style={{ fontSize: 20 }}>🏪</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.primary, marginTop: 6 }}>
              ₹{(summary.totalRetailValuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Potential revenue value</div>
          </div>

          {/* Low Stock Alerts */}
          <div style={{
            background: summary.lowStockCount > 0 ? '#FFFBEB' : '#fff',
            borderRadius: 12, padding: '16px 20px',
            border: `1px solid ${summary.lowStockCount > 0 ? '#FDE68A' : C.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: summary.lowStockCount > 0 ? '#B45309' : C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Low Stock Alerts</span>
              <span style={{ fontSize: 20 }}>⚠️</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: summary.lowStockCount > 0 ? '#D97706' : C.text, marginTop: 6 }}>
              {summary.lowStockCount || 0}
            </div>
            <div style={{ fontSize: 11, color: summary.lowStockCount > 0 ? '#B45309' : C.textMuted, marginTop: 4 }}>
              Items below min threshold
            </div>
          </div>

          {/* Out of Stock */}
          <div style={{
            background: summary.outOfStockCount > 0 ? '#FEF2F2' : '#fff',
            borderRadius: 12, padding: '16px 20px',
            border: `1px solid ${summary.outOfStockCount > 0 ? '#FECACA' : C.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: summary.outOfStockCount > 0 ? '#991B1B' : C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Out of Stock</span>
              <span style={{ fontSize: 20 }}>🚫</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: summary.outOfStockCount > 0 ? '#DC2626' : C.text, marginTop: 6 }}>
              {summary.outOfStockCount || 0}
            </div>
            <div style={{ fontSize: 11, color: summary.outOfStockCount > 0 ? '#991B1B' : C.textMuted, marginTop: 4 }}>
              Zero quantity remaining
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${C.border}`, marginBottom: 20, gap: 8, overflowX: 'auto' }}>
        {[
          { id: 'overview', icon: '📦', label: 'Stock List' },
          { id: 'stockin', icon: '📥', label: 'Stock Inward' },
          { id: 'stockout', icon: '📤', label: 'Wastage & Loss' },
          { id: 'adjust', icon: '⚖️', label: 'Stock Audit / Adjust' },
          { id: 'transfers', icon: '🔄', label: 'Branch Transfers' },
          { id: 'ledger', icon: '📜', label: 'Movement Ledger' },
          { id: 'suppliers', icon: '🏢', label: 'Suppliers' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 18px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? C.primary : C.textMuted,
              borderBottom: activeTab === tab.id ? `3px solid ${C.primary}` : '3px solid transparent',
              marginBottom: -2, whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'overview' && summary?.lowStockCount > 0 && (
              <span style={{ fontSize: 10, background: '#F59E0B', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                {summary.lowStockCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: STOCK LIST & OVERVIEW
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            background: '#fff', padding: '14px 18px', borderRadius: 12,
            border: `1px solid ${C.border}`, marginBottom: 16,
          }}>
            {/* Search */}
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }}>🔍</span>
              <input
                type="text"
                placeholder="Search by Item Name or Code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8,
                  border: `1px solid ${C.border}`, fontSize: 13, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Category:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Status:</span>
              <select
                value={selectedStockStatus}
                onChange={e => setSelectedStockStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">All Status</option>
                <option value="normal">In Stock (Good)</option>
                <option value="low">⚠️ Low Stock Only</option>
                <option value="out">🚫 Out of Stock Only</option>
              </select>
            </div>

            {/* Branch Filter (Root/Admin only) */}
            {(isRoot || user?.role === 'admin') && branches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">All Branches</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Table of Items */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Code</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Item Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Location</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Cost</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Selling</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Current Stock</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Valuation</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center', color: C.textMuted }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>No inventory items found</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Click "Add Item" or "Sync Menu Products" above to populate your inventory.</div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const stock = item.currentStock || 0;
                    const min = item.minStockAlert || 5;
                    const isOut = stock <= 0;
                    const isLow = stock > 0 && stock <= min;

                    let statusBadge = (
                      <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                        In Stock
                      </span>
                    );
                    if (isOut) {
                      statusBadge = (
                        <span style={{ fontSize: 11, background: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                          Out of Stock
                        </span>
                      );
                    } else if (isLow) {
                      statusBadge = (
                        <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                          Low ({stock}/{min})
                        </span>
                      );
                    }

                    const val = stock * (item.costPrice || 0);

                    return (
                      <tr
                        key={item._id}
                        style={{ borderBottom: `1px solid ${C.border}`, background: isOut ? '#FEF2F233' : isLow ? '#FFFBEB33' : 'transparent' }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 12 }}>
                          {item.itemCode}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: C.text }}>{item.itemName}</div>
                          {item.supplier && (
                            <div style={{ fontSize: 11, color: C.textMuted }}>🏢 {item.supplier.name}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: C.textMuted, fontSize: 12 }}>
                          📍 {item.location || 'Main Store'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                          ₹{(item.costPrice || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: C.primary }}>
                          ₹{(item.sellingPrice || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: isOut ? '#DC2626' : isLow ? '#D97706' : C.text }}>
                              {stock} <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted }}>{item.unit}</span>
                            </div>
                            {statusBadge}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                          ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              onClick={() => {
                                setStockInForm({
                                  itemId: item._id,
                                  qty: '',
                                  unitCost: item.costPrice || '',
                                  supplierId: item.supplier?._id || '',
                                  invoiceNo: '',
                                  notes: '',
                                });
                                setShowStockInModal(true);
                              }}
                              style={{
                                padding: '4px 8px', borderRadius: 6, background: '#DCFCE7',
                                color: '#15803D', border: '1px solid #86EFAC', fontSize: 11,
                                fontWeight: 700, cursor: 'pointer',
                              }}
                              title="Stock In"
                            >
                              + In
                            </button>

                            <button
                              onClick={() => {
                                setAdjustForm({
                                  itemId: item._id,
                                  actualCount: item.currentStock || 0,
                                  reason: '',
                                });
                                setShowAdjustModal(true);
                              }}
                              style={{
                                padding: '4px 8px', borderRadius: 6, background: '#EFF6FF',
                                color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: 11,
                                fontWeight: 700, cursor: 'pointer',
                              }}
                              title="Audit / Adjust Count"
                            >
                              ⚖️
                            </button>

                            {isManagement && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setItemForm({
                                      itemCode: item.itemCode,
                                      itemName: item.itemName,
                                      category: item.category || 'General',
                                      unit: item.unit || 'PCS',
                                      currentStock: item.currentStock || 0,
                                      minStockAlert: item.minStockAlert || 5,
                                      costPrice: item.costPrice || 0,
                                      sellingPrice: item.sellingPrice || 0,
                                      location: item.location || 'Main Store',
                                      supplier: item.supplier?._id || '',
                                      autoDeductOnBill: item.autoDeductOnBill !== false,
                                    });
                                    setShowItemModal(true);
                                  }}
                                  style={{
                                    padding: '4px 8px', borderRadius: 6, background: '#F1F5F9',
                                    color: '#475569', border: '1px solid #CBD5E1', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer',
                                  }}
                                  title="Edit Item"
                                >
                                  ✏️
                                </button>

                                <button
                                  onClick={() => handleDeleteItem(item._id, item.itemName)}
                                  style={{
                                    padding: '4px 8px', borderRadius: 6, background: '#FEE2E2',
                                    color: '#B91C1C', border: '1px solid #FCA5A5', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer',
                                  }}
                                  title="Deactivate Item"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: STOCK INWARD (PURCHASES)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'stockin' && (
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 28, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 24 }}>📥</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Record Stock Inward (Purchase / Receipt)</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textMuted }}>Receive raw materials, ingredients or catalog items from suppliers into stock.</p>
            </div>
          </div>

          <form onSubmit={handleStockIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Select Inventory Item *</label>
              <select
                required
                value={stockInForm.itemId}
                onChange={e => {
                  const id = e.target.value;
                  const itm = items.find(i => i._id === id);
                  setStockInForm(prev => ({
                    ...prev,
                    itemId: id,
                    unitCost: itm ? itm.costPrice : prev.unitCost,
                    supplierId: itm?.supplier?._id || prev.supplierId,
                  }));
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
              >
                <option value="">-- Choose Item to Receive --</option>
                {items.map(i => (
                  <option key={i._id} value={i._id}>
                    [{i.itemCode}] {i.itemName} (Current: {i.currentStock} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Quantity Received *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 50"
                  value={stockInForm.qty}
                  onChange={e => setStockInForm({ ...stockInForm, qty: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Unit Purchase Rate (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 120"
                  value={stockInForm.unitCost}
                  onChange={e => setStockInForm({ ...stockInForm, unitCost: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Supplier / Vendor</label>
                <select
                  value={stockInForm.supplierId}
                  onChange={e => setStockInForm({ ...stockInForm, supplierId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Invoice / Bill Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-9042"
                  value={stockInForm.invoiceNo}
                  onChange={e => setStockInForm({ ...stockInForm, invoiceNo: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Notes / Batch details</label>
              <textarea
                rows={2}
                placeholder="Optional supplier notes, expiry date, batch number..."
                value={stockInForm.notes}
                onChange={e => setStockInForm({ ...stockInForm, notes: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {stockInForm.qty && stockInForm.unitCost && (
              <div style={{ background: '#F0FDF4', padding: '12px 16px', borderRadius: 8, border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Total Purchase Cost:</span>
                <span style={{ fontSize: 18, color: '#15803D', fontWeight: 800 }}>
                  ₹{(parseFloat(stockInForm.qty || 0) * parseFloat(stockInForm.unitCost || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <button
              type="submit"
              style={{
                padding: '12px 20px', borderRadius: 8, background: '#10B981',
                color: '#fff', fontWeight: 700, fontSize: 14, border: 'none',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                marginTop: 6,
              }}
            >
              📥 Confirm Stock Inward
            </button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: WASTAGE & DAMAGE LOG
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'stockout' && (
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 28, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 24 }}>📤</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Record Wastage, Spoilage & Damages</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textMuted }}>Deduct damaged, expired, burnt or dropped items from stock with cost impact tracking.</p>
            </div>
          </div>

          <form onSubmit={handleStockOut} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Select Inventory Item *</label>
              <select
                required
                value={stockOutForm.itemId}
                onChange={e => setStockOutForm({ ...stockOutForm, itemId: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
              >
                <option value="">-- Choose Item --</option>
                {items.map(i => (
                  <option key={i._id} value={i._id}>
                    [{i.itemCode}] {i.itemName} (Available: {i.currentStock} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Quantity Lost / Wasted *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 2.5"
                  value={stockOutForm.qty}
                  onChange={e => setStockOutForm({ ...stockOutForm, qty: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Wastage Reason Category *</label>
                <select
                  value={stockOutForm.category}
                  onChange={e => setStockOutForm({ ...stockOutForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                >
                  <option value="Spoilage / Expired">Spoilage / Expired</option>
                  <option value="Kitchen Burnt / Overcooked">Kitchen Burnt / Overcooked</option>
                  <option value="Dropped / Broken">Dropped / Broken</option>
                  <option value="Quality Rejection">Quality Rejection</option>
                  <option value="Staff Meal / Tasting">Staff Meal / Tasting</option>
                  <option value="Theft / Unaccounted">Theft / Unaccounted</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Specific Details / Incident Notes</label>
              <textarea
                rows={2}
                placeholder="Details of what happened..."
                value={stockOutForm.reason}
                onChange={e => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 20px', borderRadius: 8, background: '#EF4444',
                color: '#fff', fontWeight: 700, fontSize: 14, border: 'none',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                marginTop: 6,
              }}
            >
              📤 Confirm Wastage Deduction
            </button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: STOCK ADJUSTMENT / AUDIT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'adjust' && (
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 28, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 24 }}>⚖️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Physical Stock Audit & Count Adjustment</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textMuted }}>Reconcile system balance with physically counted stock on the floor.</p>
            </div>
          </div>

          <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Select Item to Reconcile *</label>
              <select
                required
                value={adjustForm.itemId}
                onChange={e => {
                  const id = e.target.value;
                  const itm = items.find(i => i._id === id);
                  setAdjustForm({
                    itemId: id,
                    actualCount: itm ? itm.currentStock : '',
                    reason: '',
                  });
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
              >
                <option value="">-- Choose Item --</option>
                {items.map(i => (
                  <option key={i._id} value={i._id}>
                    [{i.itemCode}] {i.itemName} (Current System Stock: {i.currentStock} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            {adjustForm.itemId && (
              <>
                {(() => {
                  const itm = items.find(i => i._id === adjustForm.itemId);
                  const cur = itm ? itm.currentStock || 0 : 0;
                  const act = parseFloat(adjustForm.actualCount) || 0;
                  const diff = act - cur;

                  return (
                    <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: C.textMuted }}>System Balance:</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{cur} {itm?.unit}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: C.textMuted }}>Physically Counted:</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{act} {itm?.unit}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${C.border}`, paddingTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Variance / Delta:</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: diff === 0 ? '#64748B' : diff > 0 ? '#16A34A' : '#DC2626' }}>
                          {diff > 0 ? `+${diff}` : diff} {itm?.unit}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Actual Physically Counted Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Enter physical floor count"
                    value={adjustForm.actualCount}
                    onChange={e => setAdjustForm({ ...adjustForm, actualCount: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Audit Reason / Explanation</label>
                  <input
                    type="text"
                    placeholder="e.g. End of month physical inventory audit correction"
                    value={adjustForm.reason}
                    onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '12px 20px', borderRadius: 8, background: C.primary,
                    color: '#fff', fontWeight: 700, fontSize: 14, border: 'none',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                    marginTop: 6,
                  }}
                >
                  ⚖️ Apply Stock Count Adjustment
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: STOCK TRANSFERS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'transfers' && (
        <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 28, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 24 }}>🔄</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Branch to Branch Stock Transfer</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textMuted }}>Transfer ingredients or stock items across different restaurant branches.</p>
            </div>
          </div>

          {branches.length < 2 ? (
            <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: 10, textAlign: 'center', color: C.textMuted }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🏢</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Multi-Branch Transfer requires at least 2 branches.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Configure additional branches in Master &gt; Branches to use this feature.</div>
            </div>
          ) : (
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Select Item to Transfer *</label>
                <select
                  required
                  value={transferForm.itemId}
                  onChange={e => setTransferForm({ ...transferForm, itemId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                >
                  <option value="">-- Choose Item --</option>
                  {items.map(i => (
                    <option key={i._id} value={i._id}>
                      [{i.itemCode}] {i.itemName} (Available: {i.currentStock} {i.unit} @ {i.branch?.name || 'Main'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Destination Branch *</label>
                  <select
                    required
                    value={transferForm.toBranchId}
                    onChange={e => setTransferForm({ ...transferForm, toBranchId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                  >
                    <option value="">-- Select Destination Branch --</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Quantity to Transfer *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="e.g. 10"
                    value={transferForm.qty}
                    onChange={e => setTransferForm({ ...transferForm, qty: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>Transfer Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Replenishment for Weekend rush"
                  value={transferForm.notes}
                  onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '12px 20px', borderRadius: 8, background: '#6366F1',
                  color: '#fff', fontWeight: 700, fontSize: 14, border: 'none',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                  marginTop: 6,
                }}
              >
                🔄 Confirm Branch Transfer
              </button>
            </form>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: MOVEMENT LEDGER (AUDIT TRAIL)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <div>
          {/* Ledger Filter Bar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            background: '#fff', padding: '14px 18px', borderRadius: 12,
            border: `1px solid ${C.border}`, marginBottom: 16,
          }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }}>🔍</span>
              <input
                type="text"
                placeholder="Search Item, Invoice # or Bill #..."
                value={ledgerSearch}
                onChange={e => setLedgerSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Type:</span>
              <select
                value={ledgerType}
                onChange={e => setLedgerType(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">All Movements</option>
                <option value="PURCHASE_IN">📥 Purchase / Stock In</option>
                <option value="SALE_OUT">🧾 POS Sale Deductions</option>
                <option value="WASTAGE_OUT">📤 Wastage & Damage</option>
                <option value="ADJUSTMENT">⚖️ Audit Adjustments</option>
                <option value="TRANSFER_IN">🔄 Transfers Received</option>
                <option value="TRANSFER_OUT">🔄 Transfers Sent</option>
                <option value="RETURN_IN">↩️ Bill Cancel Returns</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Date & Time</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Item</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Qty Changed</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Stock (Before → After)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Cost Impact</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Reason / Ref</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>User</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: C.textMuted }}>
                      <div style={{ fontSize: 32, marginBottom: 6 }}>📜</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>No stock movement transactions logged yet</div>
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => {
                    const isPositive = ['PURCHASE_IN', 'TRANSFER_IN', 'RETURN_IN'].includes(t.type) || (t.type === 'ADJUSTMENT' && t.newStock >= t.previousStock);

                    let badgeColor = '#10B981';
                    let badgeBg = '#DCFCE7';
                    let badgeText = t.type;

                    if (t.type === 'PURCHASE_IN') { badgeText = '📥 Stock In'; badgeColor = '#059669'; badgeBg = '#D1FAE5'; }
                    else if (t.type === 'SALE_OUT') { badgeText = '🧾 POS Sale'; badgeColor = '#2563EB'; badgeBg = '#DBEAFE'; }
                    else if (t.type === 'WASTAGE_OUT') { badgeText = '📤 Wastage'; badgeColor = '#DC2626'; badgeBg = '#FEE2E2'; }
                    else if (t.type === 'ADJUSTMENT') { badgeText = '⚖️ Audit'; badgeColor = '#7C3AED'; badgeBg = '#EDE9FE'; }
                    else if (t.type === 'TRANSFER_IN' || t.type === 'TRANSFER_OUT') { badgeText = '🔄 Transfer'; badgeColor = '#D97706'; badgeBg = '#FEF3C7'; }
                    else if (t.type === 'RETURN_IN') { badgeText = '↩️ Restock'; badgeColor = '#059669'; badgeBg = '#D1FAE5'; }

                    return (
                      <tr key={t._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap' }}>
                          {new Date(t.date || t.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: badgeBg, color: badgeColor, whiteSpace: 'nowrap' }}>
                            {badgeText}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: C.text }}>{t.itemName}</div>
                          <div style={{ fontSize: 11, color: C.textMuted }}>{t.itemCode}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: isPositive ? '#16A34A' : '#DC2626' }}>
                          {isPositive ? `+${t.qty}` : `-${t.qty}`} <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted }}>{t.unit}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: C.textMuted }}>
                          <span style={{ fontWeight: 600, color: C.text }}>{t.previousStock}</span> → <span style={{ fontWeight: 700, color: isPositive ? '#16A34A' : '#DC2626' }}>{t.newStock}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                          ₹{(t.totalCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: C.text }}>
                          {t.reason || t.invoiceNo || t.billNo || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>
                          👤 {t.performedBy || 'System'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 7: SUPPLIERS DIRECTORY
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'suppliers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Suppliers & Vendors Directory</h2>
            {isManagement && (
              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setSupplierForm({ name: '', phone: '', email: '', gstin: '', address: '', contactPerson: '' });
                  setShowSupplierModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, background: C.primary,
                  color: '#fff', fontWeight: 700, fontSize: 12, border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span>➕</span>
                <span>Add Supplier</span>
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {suppliers.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', background: '#fff', padding: 40, borderRadius: 12, textAlign: 'center', color: C.textMuted, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>No suppliers configured yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Add your vegetable, meat, dairy and grocery suppliers here.</div>
              </div>
            ) : (
              suppliers.map(s => (
                <div key={s._id} style={{ background: '#fff', borderRadius: 12, padding: 18, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{s.name}</div>
                      {s.contactPerson && <div style={{ fontSize: 12, color: C.textMuted }}>👤 {s.contactPerson}</div>}
                    </div>
                    {isManagement && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => {
                            setEditingSupplier(s);
                            setSupplierForm({
                              name: s.name,
                              phone: s.phone || '',
                              email: s.email || '',
                              gstin: s.gstin || '',
                              address: s.address || '',
                              contactPerson: s.contactPerson || '',
                            });
                            setShowSupplierModal(true);
                          }}
                          style={{ border: 'none', background: '#F1F5F9', borderRadius: 4, cursor: 'pointer', padding: '4px 6px', fontSize: 11 }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s._id, s.name)}
                          style={{ border: 'none', background: '#FEE2E2', borderRadius: 4, cursor: 'pointer', padding: '4px 6px', fontSize: 11 }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    {s.phone && <div style={{ color: '#334155' }}>📞 <strong>Phone:</strong> {s.phone}</div>}
                    {s.email && <div style={{ color: '#334155' }}>✉️ <strong>Email:</strong> {s.email}</div>}
                    {s.gstin && <div style={{ color: '#334155' }}>📄 <strong>GSTIN:</strong> {s.gstin}</div>}
                    {s.address && <div style={{ color: '#64748B' }}>📍 {s.address}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT INVENTORY ITEM
          ───────────────────────────────────────────────────────────── */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              <button onClick={() => setShowItemModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Item Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    placeholder="e.g. ITM001"
                    value={itemForm.itemCode}
                    onChange={e => setItemForm({ ...itemForm, itemCode: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basmati Rice 25kg / Chicken Breast"
                    value={itemForm.itemName}
                    onChange={e => setItemForm({ ...itemForm, itemName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Category</label>
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                  >
                    <option value="General">General</option>
                    <option value="Raw Material">Raw Material / Ingredient</option>
                    <option value="Finished Goods">Finished Goods / Menu Item</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Meat">Meat & Poultry</option>
                    <option value="Grocery">Grocery & Spices</option>
                    <option value="Packaging">Packaging Material</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Unit of Measure</label>
                  <select
                    value={itemForm.unit}
                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="KG">KG (Kilogram)</option>
                    <option value="GM">GM (Gram)</option>
                    <option value="LTR">LTR (Litre)</option>
                    <option value="ML">ML (Millilitre)</option>
                    <option value="BOX">BOX</option>
                    <option value="PACK">PACK</option>
                    <option value="CAN">CAN</option>
                    <option value="BOTTLE">BOTTLE</option>
                    <option value="PORTION">PORTION</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {!editingItem && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Opening Stock</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={itemForm.currentStock}
                      onChange={e => setItemForm({ ...itemForm, currentStock: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Min Stock Alert</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={itemForm.minStockAlert}
                    onChange={e => setItemForm({ ...itemForm, minStockAlert: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={itemForm.costPrice}
                    onChange={e => setItemForm({ ...itemForm, costPrice: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Selling Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={itemForm.sellingPrice}
                    onChange={e => setItemForm({ ...itemForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Default Supplier</label>
                  <select
                    value={itemForm.supplier}
                    onChange={e => setItemForm({ ...itemForm, supplier: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                  >
                    <option value="">-- None --</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Store / Walk-in Freezer"
                    value={itemForm.location}
                    onChange={e => setItemForm({ ...itemForm, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="autoDeduct"
                  checked={itemForm.autoDeductOnBill}
                  onChange={e => setItemForm({ ...itemForm, autoDeductOnBill: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="autoDeduct" style={{ fontSize: 12, fontWeight: 600, color: C.text, cursor: 'pointer' }}>
                  Auto-deduct stock when billed in POS
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: QUICK STOCK IN
          ───────────────────────────────────────────────────────────── */}
      {showStockInModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>📥 Quick Stock Inward</h3>
              <button onClick={() => setShowStockInModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
            </div>

            <form onSubmit={handleStockIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Item *</label>
                <select
                  required
                  value={stockInForm.itemId}
                  onChange={e => {
                    const id = e.target.value;
                    const itm = items.find(i => i._id === id);
                    setStockInForm(prev => ({
                      ...prev,
                      itemId: id,
                      unitCost: itm ? itm.costPrice : prev.unitCost,
                      supplierId: itm?.supplier?._id || prev.supplierId,
                    }));
                  }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                >
                  <option value="">-- Choose Item --</option>
                  {items.map(i => <option key={i._id} value={i._id}>[{i.itemCode}] {i.itemName}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="Qty"
                    value={stockInForm.qty}
                    onChange={e => setStockInForm({ ...stockInForm, qty: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Cost"
                    value={stockInForm.unitCost}
                    onChange={e => setStockInForm({ ...stockInForm, unitCost: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Supplier</label>
                  <select
                    value={stockInForm.supplierId}
                    onChange={e => setStockInForm({ ...stockInForm, supplierId: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                  >
                    <option value="">-- None --</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Invoice No</label>
                  <input
                    type="text"
                    placeholder="Invoice #"
                    value={stockInForm.invoiceNo}
                    onChange={e => setStockInForm({ ...stockInForm, invoiceNo: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <button type="button" onClick={() => setShowStockInModal(false)} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#10B981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Receive Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: QUICK WASTAGE
          ───────────────────────────────────────────────────────────── */}
      {showStockOutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>📤 Log Wastage / Damage</h3>
              <button onClick={() => setShowStockOutModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
            </div>

            <form onSubmit={handleStockOut} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Item *</label>
                <select
                  required
                  value={stockOutForm.itemId}
                  onChange={e => setStockOutForm({ ...stockOutForm, itemId: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                >
                  <option value="">-- Choose Item --</option>
                  {items.map(i => <option key={i._id} value={i._id}>[{i.itemCode}] {i.itemName} (In stock: {i.currentStock} {i.unit})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Quantity Lost *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="Qty"
                    value={stockOutForm.qty}
                    onChange={e => setStockOutForm({ ...stockOutForm, qty: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Reason Category</label>
                  <select
                    value={stockOutForm.category}
                    onChange={e => setStockOutForm({ ...stockOutForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff' }}
                  >
                    <option value="Spoilage">Spoilage</option>
                    <option value="Expired">Expired</option>
                    <option value="Burnt">Kitchen Burnt</option>
                    <option value="Broken">Dropped / Broken</option>
                    <option value="Staff Meal">Staff Meal</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Notes</label>
                <input
                  type="text"
                  placeholder="Additional explanation..."
                  value={stockOutForm.reason}
                  onChange={e => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <button type="button" onClick={() => setShowStockOutModal(false)} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Confirm Wastage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: QUICK AUDIT / ADJUST
          ───────────────────────────────────────────────────────────── */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>⚖️ Quick Stock Audit</h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
            </div>

            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Actual Floor Count *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="Counted quantity"
                  value={adjustForm.actualCount}
                  onChange={e => setAdjustForm({ ...adjustForm, actualCount: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Reason for Correction</label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory discrepancy reconciliation"
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Adjusted Count</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT SUPPLIER
          ───────────────────────────────────────────────────────────── */}
      {showSupplierModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setShowSupplierModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.textMuted }}>✕</button>
            </div>

            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Cash & Carry / Green Valley Farms"
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={supplierForm.contactPerson}
                    onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    placeholder="e.g. sales@vendor.com"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    value={supplierForm.gstin}
                    onChange={e => setSupplierForm({ ...supplierForm, gstin: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Address</label>
                <textarea
                  rows={2}
                  placeholder="Supplier warehouse / office address"
                  value={supplierForm.address}
                  onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <button type="button" onClick={() => setShowSupplierModal(false)} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{editingSupplier ? 'Save Changes' : 'Create Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
