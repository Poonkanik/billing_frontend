import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  seed: () => api.post('/auth/seed'),
  getBranches: () => api.get('/auth/branches'),
};

export const usersAPI = {
  getAll: (params = '') => api.get('/users', { params: typeof params === 'object' ? params : { search: params } }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getBranchOverview: () => api.get('/users/branch-overview'),
  getMenuAccess: () => api.get('/users/menu-access'),
  lock: (id, reason = '') => api.put(`/users/${id}/lock`, { reason }),
  unlock: (id) => api.put(`/users/${id}/unlock`),
  getLocked: () => api.get('/users/locked'),
};

export const masterAPI = {
  getCompany: () => api.get('/master/company'),
  updateCompany: (data) => api.put('/master/company', data),

  getGroups: () => api.get('/master/groups'),
  createGroup: (data) => api.post('/master/groups', data),
  updateGroup: (id, data) => api.put(`/master/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/master/groups/${id}`),

  getDepartments: () => api.get('/master/departments'),
  createDepartment: (data) => api.post('/master/departments', data),
  updateDepartment: (id, data) => api.put(`/master/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/master/departments/${id}`),
  getDepartmentProducts: (id) => api.get(`/master/departments/${id}/products`),
  getDepartmentProductCounts: () => api.get('/master/departments/product-counts'),

  getProducts: (params) => api.get('/master/products', { params }),
  createProduct: (data) => api.post('/master/products', data),
  updateProduct: (id, data) => api.put(`/master/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/master/products/${id}`),
  updateProductRates: (data) => api.put('/master/products/rates', data),

  getTables: () => api.get('/master/tables'),
  createTable: (data) => api.post('/master/tables', data),
  updateTable: (id, data) => api.put(`/master/tables/${id}`, data),
  deleteTable: (id) => api.delete(`/master/tables/${id}`),

  getCustomers: () => api.get('/master/customers'),
  createCustomer: (data) => api.post('/master/customers', data),
  updateCustomer: (id, data) => api.put(`/master/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/master/customers/${id}`),

  getWaiters: () => api.get('/master/waiters'),
  createWaiter: (data) => api.post('/master/waiters', data),
  updateWaiter: (id, data) => api.put(`/master/waiters/${id}`, data),
  deleteWaiter: (id) => api.delete(`/master/waiters/${id}`),

  getCaptains: () => api.get('/master/captains'),
  createCaptain: (data) => api.post('/master/captains', data),
  updateCaptain: (id, data) => api.put(`/master/captains/${id}`, data),
  deleteCaptain: (id) => api.delete(`/master/captains/${id}`),

  getRateInfo: () => api.get('/master/rates'),
  createRate: (data) => api.post('/master/rates', data),
  updateRate: (id, data) => api.put(`/master/rates/${id}`, data),
  deleteRate: (id) => api.delete(`/master/rates/${id}`),

  getSalesModes: () => api.get('/master/salesmodes'),
  createSalesMode: (data) => api.post('/master/salesmodes', data),
  updateSalesMode: (id, data) => api.put(`/master/salesmodes/${id}`, data),
  deleteSalesMode: (id) => api.delete(`/master/salesmodes/${id}`),

  getProductsBySalesMode: (salesModeId) => api.get(`/master/products?salesMode=${salesModeId}`),
  bulkImportProducts: (data) => api.post('/master/products/bulk', data),

  getBranches: () => api.get('/master/branches'),
  createBranch: (data) => api.post('/master/branches', data),
  updateBranch: (id, data) => api.put(`/master/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/master/branches/${id}`),

  // Branch-specific pricing
  getBranchRates: () => api.get('/master/products/branch-rates'),
  updateBranchRates: (data) => api.put('/master/products/branch-rates', data),
};

export const billsAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getOne: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  cancel: (id, reason) => api.delete(`/bills/${id}`, { data: { reason } }),

  // NEW: Get today's bills
  getTodayBills: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.billType && filters.billType !== 'all') params.append('billType', filters.billType);
    if (filters.paymentMode && filters.paymentMode !== 'all') params.append('paymentMode', filters.paymentMode);
    if (filters.salesMode && filters.salesMode !== 'all') params.append('salesMode', filters.salesMode);

    return api.get(`/bills/today?${params.toString()}`);
  },

  // NEW: Cancel bill with reason (admin only)
  markDuplicated: (id) => api.put(`/bills/${id}/duplicate`),
  cancelBill: (id, reason) => {
    return api.put(`/bills/${id}/cancel`, { reason });
  },

  // NEW: Delete bill (admin only)
  deleteBill: (id) => {
    return api.delete(`/bills/${id}`);
  },

  // NEW: Get sales modes for dropdown
  getSalesModes: () => api.get('/bills/sales-modes'),
};

export const reportsAPI = {
  billWise: (params) => api.get('/reports/bill-wise', { params }),
  itemWise: (params) => api.get('/reports/item-wise', { params }),
  salesmanWise: (params) => api.get('/reports/salesman-wise', { params }),
  groupWise: (params) => api.get('/reports/group-wise', { params }),
  departmentWise: (params) => api.get('/reports/department-wise', { params }),
  timeWise: (params) => api.get('/reports/time-wise', { params }),
  cashierWise: (params) => api.get('/reports/cashier-wise', { params }),
  taxReport: (params) => api.get('/reports/tax-report', { params }),
  dashboard: () => api.get('/reports/dashboard'),
};

export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getSummary: () => api.get('/inventory/summary'),
  getLowStock: () => api.get('/inventory/low-stock'),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),

  stockIn: (data) => api.post('/inventory/stock-in', data),
  stockOut: (data) => api.post('/inventory/stock-out', data),
  adjust: (data) => api.post('/inventory/adjust', data),
  transfer: (data) => api.post('/inventory/transfer', data),

  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  syncProducts: (data) => api.post('/inventory/sync-products', data),

  getSuppliers: () => api.get('/inventory/suppliers'),
  createSupplier: (data) => api.post('/inventory/suppliers', data),
  updateSupplier: (id, data) => api.put(`/inventory/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/inventory/suppliers/${id}`),
};

export const cashRegisterAPI = {
  getCurrent: () => api.get('/cash-register/current'),
  open: (data) => api.post('/cash-register/open', data),
  addMovement: (data) => api.post('/cash-register/cash-movement', data),
  close: (data) => api.post('/cash-register/close', data),
  getHistory: (params) => api.get('/cash-register/history', { params }),
  getOne: (id) => api.get(`/cash-register/${id}`),
};

export const onlineOrdersAPI = {
  getAll: (params) => api.get('/online-orders', { params }),
  getStats: () => api.get('/online-orders/stats'),
  simulate: (data = {}) => api.post('/online-orders/simulate', data),
  updateStatus: (id, data) => api.put(`/online-orders/${id}/status`, data),
  convertToBill: (id) => api.post(`/online-orders/${id}/convert-to-bill`),
  getPlatformStatus: () => api.get('/online-orders/platforms/status'),
  updatePlatformStatus: (data) => api.put('/online-orders/platforms/status', data),
  loginPlatform: (data) => api.post('/online-orders/platforms/login', data),
  logoutPlatform: (data) => api.post('/online-orders/platforms/logout', data),
  extractPlatform: (data) => api.post('/online-orders/platforms/extract', data),
  extractAll: (data = {}) => api.post('/online-orders/platforms/extract-all', data),
  importPayload: (data) => api.post('/online-orders/platforms/import-payload', data),
  cleanupMockData: () => api.post('/online-orders/cleanup-mock-data'),
};

export default api;
