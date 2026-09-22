import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Role hierarchy — higher index = more power
const ROLE_HIERARCHY = {
  waiter: 1,
  cashier: 2,
  sales: 3,
  branch_admin: 4,
  head: 5,
  admin: 5,
  developer: 6,
  root: 6,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('pos_token'); localStorage.removeItem('pos_user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (name, password, branchId) => {
    const res = await authAPI.login({ name, password, branchId });
    localStorage.setItem('pos_token', res.data.token);
    localStorage.setItem('pos_user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
  };

  // Permission helpers — safe to call even if user has no permissions array
  const hasPermission = (perm) => {
    if (!user) return false;
    const isDevUser = ['root', 'developer'].includes(user.role) || user.name?.toLowerCase().startsWith('root') || user.name?.toLowerCase() === 'developer';
    if (isDevUser) return true;
    return (user.menuAccess || []).includes(perm);
  };

  const hasBillPermission = (perm) => {
    if (!user) return false;
    const isDevUser = ['root', 'developer'].includes(user.role) || user.name?.toLowerCase().startsWith('root') || user.name?.toLowerCase() === 'developer';
    if (isDevUser) return true;
    return !!(user.permissions && user.permissions[perm]);
  };

  // ── Role checks ──
  const isRoot = user ? (['root', 'developer'].includes(user.role) || user.name?.toLowerCase().startsWith('root') || user.name?.toLowerCase() === 'developer') : false;
  const isAdmin = user ? ['admin', 'head'].includes(user.role) : false;
  const isBranchAdmin = user ? user.role === 'branch_admin' : false;
  const isCashier = user ? user.role === 'cashier' : false;
  const isWaiter = user ? user.role === 'waiter' : false;
  const isSales = user ? user.role === 'sales' : false;

  // Elevated role check: root, developer, admin, head, branch_admin
  const isElevated = user ? ['root', 'developer', 'admin', 'head', 'branch_admin'].includes(user.role) : false;

  // Staff roles — locked to a single branch, billing-focused
  const isStaff = user ? ['cashier', 'waiter', 'sales'].includes(user.role) : false;

  // Branch permission: can see/modify all branches?
  const canModifyAllBranches = user ? ['root', 'developer', 'admin', 'head'].includes(user.role) : false;
  // Can modify own branch only?
  const canModifyOwnBranch = user ? user.branch != null : false;

  // Get the user's branch info
  const userBranch = user?.activeBranch || user?.branch || null;
  const userBranchId = userBranch?._id || userBranch || null;
  const userBranchName = userBranch?.name || null;

  // Can this user manage other users?
  const canManageUsers = user ? ['root', 'developer', 'admin', 'head', 'branch_admin'].includes(user.role) : false;

  // Can this user access a specific branch?
  const canAccessBranch = (branchId) => {
    if (!user) return false;
    if (isRoot || isAdmin) return true; // Root/Developer/Admin/Head see all
    if (!branchId) return false;
    return userBranchId?.toString() === branchId?.toString();
  };

  // Check if user's role is at least as powerful as the given role
  const hasRoleLevel = (requiredRole) => {
    if (!user) return false;
    if (isRoot) return true;
    return (ROLE_HIERARCHY[user.role] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
  };

  // Role display label
  const roleLabel = (() => {
    if (!user) return '';
    const labels = {
      root: 'Root',
      developer: 'Developer',
      admin: 'Admin',
      head: 'Head Owner',
      branch_admin: 'Manager',
      sales: 'Sales',
      cashier: 'Cashier',
      waiter: 'Waiter',
    };
    return labels[user.role] || user.role;
  })();

  return (
    <AuthContext.Provider value={{
      user, login, logout, loading,
      hasPermission, hasBillPermission,
      isElevated, isRoot, isAdmin, isBranchAdmin, isCashier, isWaiter, isSales, isStaff,
      canModifyAllBranches, canModifyOwnBranch,
      canManageUsers, canAccessBranch, hasRoleLevel,
      userBranch, userBranchId, userBranchName, roleLabel,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
