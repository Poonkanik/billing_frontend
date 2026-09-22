import { useState, useEffect } from 'react';
import { usersAPI, masterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Color Palette matching the reference UI design
const BRAND = {
  orange: '#DE6A26',       // Warm terracotta orange
  orangeHover: '#C8591A',
  orangeLight: '#FFF6EE',  // Soft cream orange bg
  orangeBorder: '#FCD9BD', // Subtle orange outline
  dark: '#0F172A',
  text: '#1E293B',
  muted: '#64748B',
  lightMuted: '#94A3B8',
  border: '#E2E8F0',
  surfaceBg: '#F8FAFC',
};

const ALL_MODULES = [
  { id: 'billing', label: 'Billing / POS' },
  { id: 'open-close', label: 'Open & Close Amount' },
  { id: 'online-orders', label: 'Online Orders' },
  { id: 'master', label: 'Master Catalog' },
  { id: 'departments', label: 'Departments' },
  { id: 'inventory', label: 'Inventory & Stock' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'options', label: 'Options / Settings' },
  { id: 'users', label: 'User Management' },
  { id: 'devices', label: 'Devices' },
];

const BILL_PERMISSIONS = [
  { key: 'allowDuplicateBill', label: 'Allow Duplicate Bill' },
  { key: 'allowLastBill', label: 'Allow Last Bill Print' },
  { key: 'allowBillCancel', label: 'Allow Bill Cancel' },
  { key: 'allowEditBill', label: 'Allow Edit Bill' },
  { key: 'allowBillDiscount', label: 'Allow Bill Discount' },
  { key: 'allowReduction', label: 'Allow Reduction' },
];

export default function UsersPage() {
  const { isRoot } = useAuth();

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [toast, setToast] = useState({ text: '', type: 'success' });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    employeeId: '',
    fullName: '',
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    role: 'cashier',
    password: '',
    branch: '',
    isActive: true,
    isLocked: false,
    menuAccess: ['billing'],
    permissions: {
      allowDuplicateBill: false,
      allowLastBill: false,
      allowBillCancel: false,
      allowEditBill: false,
      allowBillDiscount: false,
      allowReduction: false,
    },
  });

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: 'success' }), 4000);
  };

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll({
        search,
        role: selectedRole,
        status: selectedStatus,
        branch: selectedBranch,
      });
      const list = res.data?.users || res.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error fetching users', 'danger');
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await masterAPI.getBranches();
      setBranches(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [search, selectedRole, selectedStatus, selectedBranch]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setShowPassword(false);
    const nextNum = users.length + 1;
    setForm({
      employeeId: `EMP${String(nextNum).padStart(3, '0')}`,
      fullName: '',
      name: '',
      email: '',
      phone: '',
      designation: '',
      department: '',
      role: 'cashier',
      password: '',
      branch: branches[0]?._id || '',
      isActive: true,
      isLocked: false,
      menuAccess: ['billing', 'reports'],
      permissions: {
        allowDuplicateBill: false,
        allowLastBill: false,
        allowBillCancel: false,
        allowEditBill: false,
        allowBillDiscount: false,
        allowReduction: false,
      },
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setShowPassword(false);
    setForm({
      employeeId: u.employeeId || 'EMP001',
      fullName: u.fullName || u.name || '',
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      designation: u.designation || '',
      department: u.department || '',
      role: u.role || 'cashier',
      password: '',
      branch: u.branch?._id || u.branch || '',
      isActive: u.isActive !== false,
      isLocked: !!u.isLocked,
      menuAccess: u.menuAccess && u.menuAccess.length ? u.menuAccess : ['billing'],
      permissions: {
        allowDuplicateBill: !!u.permissions?.allowDuplicateBill,
        allowLastBill: !!u.permissions?.allowLastBill,
        allowBillCancel: !!u.permissions?.allowBillCancel,
        allowEditBill: !!u.permissions?.allowEditBill,
        allowBillDiscount: !!u.permissions?.allowBillDiscount,
        allowReduction: !!u.permissions?.allowReduction,
      },
    });
    setShowModal(true);
  };

  // Save User
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        name: form.name || form.fullName.toUpperCase().replace(/\s+/g, '_'),
        branch: ['root', 'developer', 'admin', 'head'].includes(form.role) ? null : (form.branch || null),
      };

      if (editingUser) {
        if (!payload.password) delete payload.password;
        await usersAPI.update(editingUser._id, payload);
        showToast('User profile and access updated successfully');
      } else {
        if (!payload.password) {
          showToast('Password is required for new user creation', 'danger');
          return;
        }
        await usersAPI.create(payload);
        showToast('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving user', 'danger');
    }
  };

  // Delete User
  const handleDelete = async (u) => {
    if (!window.confirm(`Are you sure you want to delete user "${u.fullName || u.name}"?`)) return;
    try {
      await usersAPI.delete(u._id);
      showToast(`User ${u.fullName || u.name} deleted`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting user', 'danger');
    }
  };

  // Unlock User
  const handleUnlock = async (u) => {
    try {
      await usersAPI.unlock(u._id);
      showToast(`User ${u.fullName || u.name} lock released successfully`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error unlocking user', 'danger');
    }
  };

  // Manually Lock User
  const handleLock = async (u) => {
    const reason = window.prompt(`Enter reason for locking account "${u.fullName || u.name}":`, 'Manually locked by administrator');
    if (reason === null) return;
    try {
      await usersAPI.lock(u._id, reason);
      showToast(`User ${u.fullName || u.name} has been locked`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error locking user', 'danger');
    }
  };

  // Toggle Module Access Checkbox
  const handleToggleModule = (moduleId) => {
    setForm(prev => {
      const exists = prev.menuAccess.includes(moduleId);
      const newAccess = exists
        ? prev.menuAccess.filter(m => m !== moduleId)
        : [...prev.menuAccess, moduleId];
      return { ...prev, menuAccess: newAccess };
    });
  };

  // Toggle Permission Checkbox
  const handleTogglePermission = (permKey) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions?.[permKey],
      },
    }));
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'root':
        return (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
            background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE'
          }}>
            Root
          </span>
        );
      case 'developer':
        return (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
            background: '#F5F3FF', color: '#6D28D9', border: '1px solid #C4B5FD'
          }}>
            Developer
          </span>
        );
      case 'head':
      case 'admin':
        return (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
            background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3'
          }}>
            {role === 'head' ? 'Head Owner' : 'Administrator'}
          </span>
        );
      case 'branch_admin':
        return (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
            background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE'
          }}>
            Manager
          </span>
        );
      case 'sales':
        return (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
            background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0'
          }}>
            Sales
          </span>
        );
      default:
        return (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
            background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0'
          }}>
            Employee
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: "'Inter','Segoe UI',sans-serif", color: BRAND.text }}>
      {/* Toast Notification */}
      {toast.text && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'danger' ? '#FEE2E2' : '#DCFCE7',
          color: toast.type === 'danger' ? '#991B1B' : '#166534',
          border: `1px solid ${toast.type === 'danger' ? '#F87171' : '#86EFAC'}`,
          fontWeight: 600, fontSize: 13, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>{toast.type === 'danger' ? '⚠️' : '✅'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: BRAND.dark, letterSpacing: -0.5 }}>
            User Management
          </h1>
          <p style={{ margin: '4px 0 0', color: BRAND.muted, fontSize: 13 }}>
            {users.length} users registered in the portal
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 22px', borderRadius: 8,
            background: BRAND.orange, border: 'none',
            color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(222, 106, 38, 0.3)',
            transition: 'background 0.15s ease',
          }}
          onMouseOver={e => e.currentTarget.style.background = BRAND.orangeHover}
          onMouseOut={e => e.currentTarget.style.background = BRAND.orange}
        >
          <span style={{ fontSize: 16 }}>+</span>
          <span>Add User</span>
        </button>
      </div>

      {/* Filter Row */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        marginBottom: 20,
      }}>
        {/* Search Bar */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: BRAND.lightMuted, fontSize: 14 }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search name, email or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 8,
              border: `1px solid ${BRAND.border}`, background: '#fff',
              fontSize: 13, color: BRAND.dark, outline: 'none',
              boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          />
        </div>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          style={{
            padding: '10px 16px', borderRadius: 8, border: `1px solid ${BRAND.border}`,
            background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer',
            outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <option value="all">All Roles</option>
          <option value="cashier">Employee (Cashier)</option>
          <option value="branch_admin">Manager (Branch Admin)</option>
          <option value="head">Head Owner</option>
          <option value="admin">Administrator</option>
          <option value="sales">Sales Staff</option>
          <option value="waiter">Waiter</option>
          {isRoot && (
            <>
              <option value="developer">Developer</option>
              <option value="root">Root</option>
            </>
          )}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          style={{
            padding: '10px 16px', borderRadius: 8, border: `1px solid ${BRAND.border}`,
            background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer',
            outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="locked">🔒 Locked Accounts Only</option>
        </select>

        {/* Branch Filter */}
        {branches.length > 1 && (
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            style={{
              padding: '10px 16px', borderRadius: 8, border: `1px solid ${BRAND.border}`,
              background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer',
              outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <option value="all">All Branches</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Users Table */}
      <div style={{
        background: '#fff', borderRadius: 12, border: `1px solid ${BRAND.border}`,
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BRAND.border}` }}>
              <th style={{ padding: '14px 20px', fontWeight: 700, color: BRAND.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                EMPLOYEE ↕
              </th>
              <th style={{ padding: '14px 20px', fontWeight: 700, color: BRAND.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ROLE ↕
              </th>
              <th style={{ padding: '14px 20px', fontWeight: 700, color: BRAND.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                MODULES
              </th>
              <th style={{ padding: '14px 20px', fontWeight: 700, color: BRAND.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                DEPARTMENT
              </th>
              <th style={{ padding: '14px 20px', fontWeight: 700, color: BRAND.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                STATUS ↕
              </th>
              <th style={{ padding: '14px 20px', fontWeight: 700, color: BRAND.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                JOINED ↕
              </th>
              <th style={{ padding: '14px 20px', fontWeight: 700, color: BRAND.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: BRAND.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark }}>No users found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Click "+ Add User" above to create your first user account.</div>
                </td>
              </tr>
            ) : (
              users.map(u => {
                const displayName = u.fullName || u.name || 'User';
                const initial = displayName.charAt(0).toUpperCase();
                const empId = u.employeeId || 'EMP001';
                const email = u.email || `${u.name.toLowerCase()}@resto.pos`;
                const joined = u.joinedDate || u.createdAt;
                const joinedFormatted = joined ? new Date(joined).toISOString().split('T')[0] : '—';
                const dept = u.department || u.branch?.name || '—';

                let modulesText = 'Default';
                if (u.menuAccess && u.menuAccess.length) {
                  if (u.menuAccess.includes('all') || ['admin', 'head', 'root', 'developer'].includes(u.role)) {
                    modulesText = 'All Modules';
                  } else {
                    modulesText = u.menuAccess.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
                  }
                }

                return (
                  <tr key={u._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Employee Info with Initial Avatar */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: BRAND.orange, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 800, flexShrink: 0,
                          boxShadow: '0 2px 5px rgba(222, 106, 38, 0.25)',
                        }}>
                          {initial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: BRAND.dark, fontSize: 13 }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 1 }}>
                            {email}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.orange, marginTop: 2 }}>
                            {empId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '14px 20px' }}>
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Modules */}
                    <td style={{ padding: '14px 20px', color: '#475569', fontSize: 12 }}>
                      <span style={{
                        maxWidth: 180, display: 'inline-block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }} title={modulesText}>
                        {modulesText}
                      </span>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '14px 20px', color: '#475569', fontSize: 13 }}>
                      {dept}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      {u.isLocked ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#DC2626' }} />
                          Locked
                        </span>
                      ) : u.isActive !== false ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#16A34A' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A' }} />
                          Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: BRAND.lightMuted }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND.lightMuted }} />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td style={{ padding: '14px 20px', color: BRAND.muted, fontSize: 12, whiteSpace: 'nowrap' }}>
                      {joinedFormatted}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          style={{
                            background: 'transparent', border: 'none',
                            color: BRAND.muted, cursor: 'pointer', fontSize: 15,
                            padding: 6, borderRadius: 6,
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.color = BRAND.dark; e.currentTarget.style.background = '#F1F5F9'; }}
                          onMouseOut={e => { e.currentTarget.style.color = BRAND.muted; e.currentTarget.style.background = 'transparent'; }}
                          title="Edit User Profile & Access"
                        >
                          ✏️
                        </button>

                        {/* Lock / Release Lock Button */}
                        {u.isLocked ? (
                          <button
                            onClick={() => handleUnlock(u)}
                            style={{
                              background: '#DCFCE7', border: '1px solid #86EFAC',
                              color: '#15803D', cursor: 'pointer', fontSize: 11,
                              padding: '4px 8px', borderRadius: 6, fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                            title="Release Account Lock"
                          >
                            <span>🔓</span>
                            <span>Release</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLock(u)}
                            style={{
                              background: '#FEF2F2', border: '1px solid #FECACA',
                              color: '#DC2626', cursor: 'pointer', fontSize: 11,
                              padding: '4px 8px', borderRadius: 6, fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                            title="Manually Lock Account"
                          >
                            <span>🔒</span>
                            <span>Lock</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        {!['root', 'developer'].includes(u.role) && (
                          <button
                            onClick={() => handleDelete(u)}
                            style={{
                              background: 'transparent', border: 'none',
                              color: BRAND.lightMuted, cursor: 'pointer', fontSize: 14,
                              padding: 6, borderRadius: 6,
                            }}
                            onMouseOver={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEF2F2'; }}
                            onMouseOut={e => { e.currentTarget.style.color = BRAND.lightMuted; e.currentTarget.style.background = 'transparent'; }}
                            title="Delete User"
                          >
                            🗑️
                          </button>
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

      {/* ─────────────────────────────────────────────────────────────
          EDIT / ADD USER MODAL (EXACT MATCH OF REFERENCE IMAGE)
          ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%',
            maxWidth: 780, maxHeight: '92vh', overflowY: 'auto',
            padding: '24px 28px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          }}>
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: BRAND.dark }}>
                  {editingUser ? 'Edit User' : 'Add User'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: BRAND.muted }}>
                  Update user profile and access
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: 'none', fontSize: 20,
                  cursor: 'pointer', color: BRAND.lightMuted, padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Top User Card Banner */}
            <div style={{
              background: '#FAFAFA', border: `1px solid ${BRAND.border}`,
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: BRAND.orange, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, flexShrink: 0,
                }}>
                  {(form.fullName || form.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: BRAND.dark }}>
                    {form.fullName || form.name || 'New Employee'}
                  </div>
                  <div style={{ fontSize: 12, color: BRAND.muted }}>
                    {form.email || (form.name ? `${form.name.toLowerCase()}@resto.pos` : 'user@resto.pos')}
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: 11, fontWeight: 700, color: BRAND.orange,
                padding: '3px 10px', background: BRAND.orangeLight,
                border: `1px solid ${BRAND.orangeBorder}`, borderRadius: 6,
              }}>
                {form.employeeId || 'EMP001'}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                
                {/* ── LEFT COLUMN: PROFILE ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Section Divider Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, color: BRAND.orange }}>👤</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      PROFILE
                    </span>
                    <div style={{ flex: 1, height: 1, background: BRAND.border, marginLeft: 6 }} />
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      EMPLOYEE ID
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>
                        🪪
                      </span>
                      <input
                        type="text"
                        value={form.employeeId}
                        onChange={e => setForm({ ...form, employeeId: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%', padding: '8px 10px 8px 30px', borderRadius: 6,
                          border: `1px solid ${BRAND.border}`, fontSize: 13, fontWeight: 600, color: BRAND.dark,
                          boxSizing: 'border-box', outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Poonkani K1"
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 6,
                        border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                        boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      EMAIL
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        placeholder="e.g. poonkanikannan@gmail.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        style={{
                          width: '100%', padding: '8px 28px 8px 10px', borderRadius: 6,
                          border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                          boxSizing: 'border-box', outline: 'none',
                        }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: BRAND.lightMuted, fontSize: 12 }}>
                        🔒
                      </span>
                    </div>
                    {editingUser && (
                      <span style={{ fontSize: 10, color: BRAND.lightMuted, marginTop: 3, display: 'block' }}>
                        Cannot be changed after account creation.
                      </span>
                    )}
                  </div>

                  {/* Phone & Designation Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                        PHONE
                      </label>
                      <input
                        type="text"
                        placeholder="+919900713234"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                          boxSizing: 'border-box', outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                        DESIGNATION
                      </label>
                      <input
                        type="text"
                        placeholder="Sales and Support"
                        value={form.designation}
                        onChange={e => setForm({ ...form, designation: e.target.value })}
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                          boxSizing: 'border-box', outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      DEPARTMENT
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Service & Billing / Counter"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 6,
                        border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                        boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                  </div>

                  {/* Username (Login ID) */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      USERNAME (LOGIN ID) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: BRAND.lightMuted }}>
                        👤
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. POONKANI"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%', padding: '8px 10px 8px 32px', borderRadius: 6,
                          border: `1px solid ${BRAND.border}`, fontSize: 13, fontWeight: 600, color: BRAND.dark,
                          boxSizing: 'border-box', outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Password with View Icon */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      {editingUser ? 'PASSWORD (optional - leave blank to keep)' : 'PASSWORD *'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: BRAND.lightMuted }}>
                        🔑
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingUser}
                        placeholder={editingUser ? '•••••••• (leave blank to keep current)' : 'Enter login password'}
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        style={{
                          width: '100%', padding: '8px 38px 8px 32px', borderRadius: 6,
                          border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                          boxSizing: 'border-box', outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 15, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0.8,
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: ACCESS & ROLE ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Section Divider Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, color: BRAND.orange }}>🛡️</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      ACCESS & ROLE
                    </span>
                    <div style={{ flex: 1, height: 1, background: BRAND.border, marginLeft: 6 }} />
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      ROLE
                    </label>
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 6,
                        border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                        background: '#fff', cursor: 'pointer', outline: 'none',
                      }}
                    >
                      <option value="cashier">Employee (Cashier / POS)</option>
                      <option value="branch_admin">Manager (Branch Admin)</option>
                      <option value="head">Head Owner</option>
                      <option value="admin">Administrator</option>
                      <option value="sales">Sales Staff</option>
                      <option value="waiter">Waiter</option>
                      {isRoot && (
                        <>
                          <option value="developer">Developer</option>
                          <option value="root">Root</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Modules Checkboxes Grid */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      MODULES
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {ALL_MODULES.map(m => {
                        const checked = form.menuAccess.includes(m.id) || form.menuAccess.includes('all');
                        return (
                          <label
                            key={m.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              fontSize: 12, fontWeight: 500, color: '#334155',
                              cursor: 'pointer', padding: '7px 10px', borderRadius: 6,
                              border: `1px solid ${checked ? BRAND.orangeBorder : BRAND.border}`,
                              background: checked ? BRAND.orangeLight : '#fff',
                              transition: 'all 0.1s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleModule(m.id)}
                              style={{ width: 14, height: 14, accentColor: BRAND.orange, cursor: 'pointer' }}
                            />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section Divider Employment */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: BRAND.orange }}>🏢</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      EMPLOYMENT & STATUS
                    </span>
                    <div style={{ flex: 1, height: 1, background: BRAND.border, marginLeft: 6 }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {/* Status */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                        STATUS
                      </label>
                      <select
                        value={form.isActive ? 'active' : 'inactive'}
                        onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                          background: '#fff', cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Branch Assignment */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                        ASSIGNED BRANCH
                      </label>
                      <select
                        value={form.branch || ''}
                        disabled={['root', 'developer', 'admin', 'head'].includes(form.role)}
                        onChange={e => setForm({ ...form, branch: e.target.value })}
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 6,
                          border: `1px solid ${BRAND.border}`, fontSize: 13, color: BRAND.dark,
                          background: ['root', 'developer', 'admin', 'head'].includes(form.role) ? '#F1F5F9' : '#fff',
                          cursor: ['root', 'developer', 'admin', 'head'].includes(form.role) ? 'not-allowed' : 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="">{['root', 'developer', 'admin', 'head'].includes(form.role) ? 'All Branches (Owner/Dev)' : '-- Select Branch --'}</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Account Lock Option */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: BRAND.muted, textTransform: 'uppercase', marginBottom: 5 }}>
                      ACCOUNT LOCK STATUS
                    </label>
                    <select
                      value={form.isLocked ? 'locked' : 'unlocked'}
                      onChange={e => setForm({ ...form, isLocked: e.target.value === 'locked' })}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 6,
                        border: `1px solid ${form.isLocked ? '#FCA5A5' : BRAND.border}`,
                        fontSize: 13, color: form.isLocked ? '#DC2626' : BRAND.dark,
                        background: form.isLocked ? '#FEF2F2' : '#fff',
                        fontWeight: form.isLocked ? 700 : 500,
                        cursor: 'pointer', outline: 'none',
                      }}
                    >
                      <option value="unlocked">Normal / Unlocked (Login Allowed)</option>
                      <option value="locked">🔒 Locked (Block Account Login)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── USER RIGHTS & POS BILL PERMISSIONS ── */}
              <div style={{
                background: '#FAFAFA', border: `1px solid ${BRAND.border}`,
                borderRadius: 10, padding: '14px 16px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span>⚙️</span>
                  <span>USER RIGHTS & POS BILL PERMISSIONS</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  {BILL_PERMISSIONS.map(p => {
                    const checked = !!form.permissions?.[p.key];
                    return (
                      <label
                        key={p.key}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: 12, fontWeight: 500, color: '#334155',
                          cursor: 'pointer', padding: '6px 10px', borderRadius: 6,
                          background: checked ? '#F0FDF4' : '#fff',
                          border: `1px solid ${checked ? '#86EFAC' : BRAND.border}`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleTogglePermission(p.key)}
                          style={{ width: 15, height: 15, accentColor: '#16A34A', cursor: 'pointer' }}
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                borderTop: `1px solid ${BRAND.border}`, paddingTop: 16,
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 22px', borderRadius: 8,
                    background: '#fff', border: `1px solid ${BRAND.border}`,
                    color: BRAND.muted, fontWeight: 600, fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 24px', borderRadius: 8,
                    background: BRAND.orange, border: 'none',
                    color: '#fff', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', boxShadow: '0 2px 6px rgba(222, 106, 38, 0.25)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = BRAND.orangeHover}
                  onMouseOut={e => e.currentTarget.style.background = BRAND.orange}
                >
                  <span>💾</span>
                  <span>{editingUser ? 'Save Changes' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
