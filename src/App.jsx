import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BillingPage from './pages/BillingPage';
import MasterPage from './pages/MasterPage';
import DepartmentsPage from './pages/DepartmentsPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import OptionsPage from './pages/OptionsPage';
import UsersPage from './pages/UsersPage';
import DevicesPage from './pages/DevicesPage';
import OpenCloseAmountPage from './pages/OpenCloseAmountPage';
import OnlineOrdersPage from './pages/OnlineOrdersPage';
import { C } from './utils/theme';

function PrivateRoute({ children, allowRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 15 }}>🍽️</div>
        <div style={{ fontSize: 18, color: C.primary, fontWeight: 800 }}>Loading RestoPOS...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to='/login' replace />;
  const isRoot = user.role === 'root' || user.name?.toLowerCase() === 'root';
  if (isRoot) return children;

  if (allowRoles && !allowRoles.includes(user.role)) return <Navigate to='/billing' replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  // Staff roles (cashier, waiter, sales) land on billing; management roles land on dashboard
  const isStaff = user ? ['cashier', 'waiter', 'sales'].includes(user.role) : false;
  const landing = isStaff ? '/billing' : '/dashboard';
  return (
    <Routes>
      <Route path='/login' element={user ? <Navigate to={landing} replace /> : <LoginPage />} />
      <Route path='/' element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to={landing} replace />} />
        <Route path='dashboard' element={<PrivateRoute allowRoles={['root', 'admin', 'branch_admin']}><DashboardPage /></PrivateRoute>} />
        <Route path='open-close-amount' element={<PrivateRoute allowRoles={['root', 'admin', 'branch_admin', 'cashier', 'sales']}><OpenCloseAmountPage /></PrivateRoute>} />
        <Route path='opening' element={<Navigate to='/open-close-amount?tab=open' replace />} />
        <Route path='closing' element={<Navigate to='/open-close-amount?tab=close' replace />} />
        <Route path='billing' element={<BillingPage />} />
        <Route path='online-orders' element={<OnlineOrdersPage />} />
        <Route path='master' element={<PrivateRoute allowRoles={['root', 'admin', 'branch_admin']}><MasterPage /></PrivateRoute>} />
        <Route path='departments' element={<PrivateRoute allowRoles={['root', 'admin', 'branch_admin']}><DepartmentsPage /></PrivateRoute>} />
        <Route path='inventory' element={<PrivateRoute allowRoles={['root', 'admin', 'branch_admin']}><InventoryPage /></PrivateRoute>} />
        <Route path='reports' element={<PrivateRoute allowRoles={['root', 'admin', 'branch_admin', 'sales']}><ReportsPage /></PrivateRoute>} />
        <Route path='options' element={<PrivateRoute allowRoles={['root']}><OptionsPage /></PrivateRoute>} />
        <Route path='users' element={<PrivateRoute allowRoles={['root', 'admin', 'branch_admin']}><UsersPage /></PrivateRoute>} />
        <Route path='devices' element={<PrivateRoute allowRoles={['root']}><DevicesPage /></PrivateRoute>} />
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
