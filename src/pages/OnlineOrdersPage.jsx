import { useState, useEffect, useRef } from 'react';
import { onlineOrdersAPI } from '../services/api';
import { C } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

export default function OnlineOrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [platforms, setPlatforms] = useState({ swiggy: null, zomato: null });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const prevNewCountRef = useRef(0);

  // Modals
  const [loginModal, setLoginModal] = useState({ open: false, platform: 'swiggy' });
  const [loginForm, setLoginForm] = useState({
    authType: 'portal_login',
    merchantId: '',
    outletName: '',
    username: '',
    password: '',
    apiKey: '',
    sessionToken: '',
  });

  const [importModal, setImportModal] = useState(false);
  const [rawPayload, setRawPayload] = useState('');

  const [webhookModal, setWebhookModal] = useState(false);

  // Sound alert on new incoming order
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch { }
  };

  const showToast = (text, type = 'info') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'info' }), 4000);
  };

  // Thermal Slip & KOT isolated printer function
  const printOnlineOrderSlip = (order) => {
    if (!order) return;

    let printerName = '';
    let printerWidth = 80;
    try {
      const pConf = JSON.parse(localStorage.getItem('printerConfig_sales') || localStorage.getItem('printerConfig_kot') || '{}');
      if (pConf?.win) printerName = pConf.win;
      if (pConf?.width) printerWidth = parseInt(pConf.width) || 80;
    } catch { }

    const printWidthMm = printerWidth === 58 ? 48 : 72;
    const isSwiggy = order.platform === 'swiggy';
    const platformLabel = isSwiggy ? 'SWIGGY' : 'ZOMATO';
    const formattedDate = new Date(order.placedAt || order.createdAt || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'medium'
    });

    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="padding: 3px 0; vertical-align: top; text-align: left; font-weight: 600;">
          ${item.productName || item.name || 'Item'}
          ${item.variant ? `<div style="font-size: 10px; font-weight: normal; color: #555;">[${item.variant}]</div>` : ''}
        </td>
        <td style="padding: 3px 0; vertical-align: top; text-align: center; white-space: nowrap;">
          ${item.qty} x ${item.rate}
        </td>
        <td style="padding: 3px 0; vertical-align: top; text-align: right; white-space: nowrap; font-weight: 600;">
          Rs.${Number(item.amount || (item.qty * item.rate)).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Order Slip #${order.orderId}</title>
  <style>
    @page {
      size: ${printerWidth}mm auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: 'Courier New', Courier, monospace;
      color: #000;
    }
    .receipt-container {
      width: ${printWidthMm}mm;
      max-width: ${printWidthMm}mm;
      margin: 0 auto;
      padding: 6px 4px;
      font-size: 12px;
      line-height: 1.35;
      background: #fff;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: 800; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 2px solid #000; margin: 6px 0; }
    .flex-between { display: flex; justify-content: space-between; align-items: flex-start; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .badge {
      display: inline-block;
      border: 1.5px solid #000;
      padding: 2px 8px;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .inst-box {
      border: 1px solid #000;
      padding: 4px 6px;
      margin-top: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .otp-box {
      border: 1.5px dashed #000;
      padding: 6px;
      margin-top: 8px;
      text-align: center;
      font-size: 12px;
    }
    @media print {
      html, body {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
      .receipt-container {
        width: ${printWidthMm}mm !important;
        max-width: ${printWidthMm}mm !important;
        margin: 0 auto !important;
        padding: 4px 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="center">
      <div class="badge">${platformLabel} ORDER SLIP</div>
      <div style="font-size: 14px; font-weight: 800;">RESTORANT POS</div>
      <div style="font-size: 10px;">Online Delivery (KOT & Invoice)</div>
    </div>

    <div class="double-divider"></div>

    <div class="flex-between">
      <span class="bold">ORDER ID:</span>
      <span class="bold" style="font-size: 13px;">#${order.orderId}</span>
    </div>
    <div class="flex-between" style="font-size: 10px; margin-top: 2px;">
      <span>DATE & TIME:</span>
      <span>${formattedDate}</span>
    </div>
    <div class="flex-between" style="font-size: 10px;">
      <span>STATUS:</span>
      <span class="bold">${(order.status || 'NEW').toUpperCase()}</span>
    </div>
    <div class="flex-between" style="font-size: 10px;">
      <span>CHANNEL:</span>
      <span>${order.channel || 'Delivery'}</span>
    </div>

    <div class="divider"></div>

    <!-- CUSTOMER DETAILS -->
    <div style="font-size: 11px;">
      <div><span class="bold">Customer:</span> ${order.customer?.name || 'Walk-in / Online'}</div>
      ${order.customer?.phone ? `<div><span class="bold">Phone:</span> ${order.customer.phone}</div>` : ''}
      ${order.customer?.address ? `<div><span class="bold">Address:</span> ${order.customer.address}</div>` : ''}
      ${order.customer?.instructions ? `
        <div class="inst-box">
          ⚠️ NOTE: ${order.customer.instructions}
        </div>
      ` : ''}
    </div>

    <div class="double-divider"></div>

    <!-- ITEMS TABLE -->
    <table>
      <thead>
        <tr style="border-bottom: 1px solid #000; font-size: 11px;">
          <th style="text-align: left; padding-bottom: 3px;">ITEM</th>
          <th style="text-align: center; padding-bottom: 3px;">QTY</th>
          <th style="text-align: right; padding-bottom: 3px;">AMT (Rs.)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="divider"></div>

    <!-- BILL TOTALS -->
    <div style="font-size: 11px;">
      <div class="flex-between">
        <span>Item Subtotal:</span>
        <span>Rs.${Number(order.subtotal || 0).toFixed(2)}</span>
      </div>
      ${order.gstTotal > 0 ? `
        <div class="flex-between">
          <span>GST (5%):</span>
          <span>Rs.${Number(order.gstTotal || 0).toFixed(2)}</span>
        </div>
      ` : ''}
      ${order.packagingCharge > 0 ? `
        <div class="flex-between">
          <span>Packaging Charges:</span>
          <span>Rs.${Number(order.packagingCharge || 0).toFixed(2)}</span>
        </div>
      ` : ''}
      ${order.deliveryFee > 0 ? `
        <div class="flex-between">
          <span>Delivery Fee:</span>
          <span>Rs.${Number(order.deliveryFee || 0).toFixed(2)}</span>
        </div>
      ` : ''}
      ${order.discount > 0 ? `
        <div class="flex-between">
          <span>Discount:</span>
          <span>-Rs.${Number(order.discount || 0).toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="divider"></div>
      <div class="flex-between bold" style="font-size: 13px;">
        <span>TOTAL PAID:</span>
        <span>Rs.${Number(order.netAmount || 0).toFixed(2)}</span>
      </div>
      ${order.payoutAmount ? `
        <div class="flex-between" style="font-size: 10px; margin-top: 2px;">
          <span>Est. Resto Payout:</span>
          <span>Rs.${Number(order.payoutAmount).toFixed(2)}</span>
        </div>
      ` : ''}
    </div>

    <!-- RIDER & OTP -->
    ${order.rider?.name || order.rider?.otp ? `
      <div class="otp-box">
        ${order.rider?.name ? `<div>Rider: <span class="bold">${order.rider.name}</span></div>` : ''}
        ${order.rider?.phone ? `<div>Rider Phone: ${order.rider.phone}</div>` : ''}
        ${order.rider?.otp ? `<div style="font-size: 14px; margin-top: 2px;"><span class="bold">OTP: ${order.rider.otp}</span></div>` : ''}
      </div>
    ` : ''}

    <div class="divider"></div>
    <div class="center" style="font-size: 10px; margin-top: 4px;">
      *** THANK YOU FOR ORDERING ***<br/>
      Printed at ${new Date().toLocaleTimeString('en-IN')}
    </div>
  </div>
</body>
</html>`;

    if (window.electronAPI?.printReceipt) {
      window.electronAPI.printReceipt(html, printerName).catch(err => {
        console.error('Electron print receipt error:', err);
        showToast('Printing failed: ' + err.message, 'error');
      });
    } else {
      const win = window.open('', '_blank', `width=380,height=650,left=200,top=100`);
      if (!win) {
        alert('Popup window was blocked by browser. Please allow popups to print receipt.');
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        try {
          win.focus();
          win.print();
          setTimeout(() => win.close(), 500);
        } catch (e) {
          console.error(e);
        }
      }, 350);
    }
  };

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [ordersRes, statsRes, platformsRes] = await Promise.all([
        onlineOrdersAPI.getAll({
          platform: platformFilter,
          status: statusFilter,
          search: search.trim() || undefined,
          today: 'true',
        }),
        onlineOrdersAPI.getStats(),
        onlineOrdersAPI.getPlatformStatus(),
      ]);

      const fetchedOrders = ordersRes.data || [];
      setOrders(fetchedOrders);
      setStats(statsRes.data || null);
      setPlatforms(platformsRes.data || { swiggy: null, zomato: null });

      // Check if new incoming orders arrived
      const currentNew = (statsRes.data?.newCount || 0);
      if (currentNew > prevNewCountRef.current && prevNewCountRef.current !== 0) {
        playAlertSound();
      }
      prevNewCountRef.current = currentNew;
    } catch (err) {
      console.error('Error fetching online orders:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, platformFilter]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto polling every 12 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, statusFilter, platformFilter, search]);

  // Step 1: Open Login Modal
  const openLoginModal = (platform) => {
    const current = platforms[platform] || {};
    setLoginForm({
      authType: current.authType || 'portal_login',
      merchantId: current.merchantId || '',
      outletName: current.outletName || '',
      username: current.username || '',
      password: '',
      apiKey: current.apiKey || '',
      sessionToken: current.sessionToken || '',
    });
    setLoginModal({ open: true, platform });
  };

  // Step 1: Submit Platform Login
  const handlePlatformLoginSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('login');
    try {
      const res = await onlineOrdersAPI.loginPlatform({
        platform: loginModal.platform,
        ...loginForm,
      });
      showToast(`✅ ${res.data.message || 'Logged in successfully!'}`, 'success');
      setLoginModal({ open: false, platform: 'swiggy' });
      await loadData(true);
    } catch (err) {
      showToast(`❌ Login Failed: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 1: Platform Logout
  const handlePlatformLogout = async (platform) => {
    setActionLoading(`logout-${platform}`);
    try {
      await onlineOrdersAPI.logoutPlatform({ platform });
      showToast(`🚪 Logged out from ${platform.toUpperCase()}`, 'info');
      await loadData(true);
    } catch (err) {
      showToast('Failed to logout platform', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 2: Extract Live Orders from Delivery Platform
  const handleExtractPlatform = async (platform) => {
    if (!platforms[platform]?.isLoggedIn) {
      showToast(`⚠️ Please login to ${platform.toUpperCase()} Partner first.`, 'error');
      openLoginModal(platform);
      return;
    }

    setActionLoading(`extract-${platform}`);
    try {
      const res = await onlineOrdersAPI.extractPlatform({ platform });
      if (res.data.extractedCount > 0) {
        showToast(`📥 Synced ${res.data.extractedCount} live order(s) from ${platform.toUpperCase()}!`, 'success');
        playAlertSound();
      } else {
        showToast(`✅ ${res.data.message || `Connected to ${platform.toUpperCase()}. No new pending orders.`}`, 'info');
      }
      await loadData(true);
    } catch (err) {
      showToast(`❌ Extraction Error: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 2: Extract Live Orders from ALL Connected Platforms
  const handleExtractAll = async () => {
    const isSwiggyConnected = platforms.swiggy?.isLoggedIn;
    const isZomatoConnected = platforms.zomato?.isLoggedIn;

    if (!isSwiggyConnected && !isZomatoConnected) {
      showToast('⚠️ No delivery partner account connected. Please login to Swiggy or Zomato first.', 'error');
      openLoginModal('swiggy');
      return;
    }

    setActionLoading('extract-all');
    try {
      const res = await onlineOrdersAPI.extractAll();
      if (res.data.totalExtracted > 0) {
        showToast(`📥 ${res.data.message || 'Live delivery orders synced!'}`, 'success');
        playAlertSound();
      } else {
        showToast(`✅ ${res.data.message || 'Connected to partners. 0 new pending orders.'}`, 'info');
      }
      await loadData(true);
    } catch (err) {
      showToast(`Extraction Failed: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Clear mock / test data
  const handleCleanupMockData = async () => {
    if (!window.confirm('Are you sure you want to clear old unbilled/test orders from the database?')) {
      return;
    }
    setActionLoading('cleanup');
    try {
      const res = await onlineOrdersAPI.cleanupMockData();
      showToast(`🧹 ${res.data.message || 'Old test data cleared successfully!'}`, 'success');
      await loadData(true);
    } catch (err) {
      showToast(`Cleanup Failed: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 2: Import Raw Payload (Paste JSON / Order Slip text)
  const handleImportPayload = async () => {
    if (!rawPayload.trim()) {
      showToast('Please paste order JSON or text payload first', 'error');
      return;
    }
    setActionLoading('import-payload');
    try {
      const res = await onlineOrdersAPI.importPayload({ payload: rawPayload });
      showToast(`✅ Order #${res.data.order?.orderId || 'New'} extracted and imported into POS!`, 'success');
      playAlertSound();
      setRawPayload('');
      setImportModal(false);
      await loadData(true);
    } catch (err) {
      showToast(`Import Error: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle store online/offline
  const handleTogglePlatformStatus = async (platformName, currentOnline) => {
    try {
      const res = await onlineOrdersAPI.updatePlatformStatus({
        platform: platformName,
        isOnline: !currentOnline,
        storeStatusMessage: !currentOnline ? 'Accepting Orders' : 'Store Offline / Closed',
      });
      setPlatforms(prev => ({ ...prev, [platformName]: res.data }));
      showToast(`${platformName.toUpperCase()} store is now ${!currentOnline ? 'ONLINE (Accepting Orders)' : 'OFFLINE (Paused)'}`, 'info');
    } catch {
      showToast('Failed to update platform status', 'error');
    }
  };

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus, prepMinutes = 20) => {
    setActionLoading(orderId);
    try {
      await onlineOrdersAPI.updateStatus(orderId, { status: newStatus, prepTimeMinutes: prepMinutes });
      showToast(`Order status updated to ${newStatus}`, 'success');
      await loadData(true);
    } catch {
      showToast('Failed to update order status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Convert to POS Bill
  const handleConvertToBill = async (order) => {
    setActionLoading(`bill-${order._id}`);
    try {
      const res = await onlineOrdersAPI.convertToBill(order._id);
      showToast(`🧾 POS Bill #${res.data.bill?.billNo || 'Created'} generated! Inventory updated.`, 'success');
      await loadData(true);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to convert to bill', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Helper formatting
  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      NEW: { bg: '#FEF3C7', color: '#92400E', label: '🔔 New / Attention', border: '#FCD34D' },
      ACCEPTED: { bg: '#EFF6FF', color: '#1E40AF', label: '👨‍🍳 Accepted (Prep)', border: '#BFDBFE' },
      PREPARING: { bg: '#EFF6FF', color: '#1E40AF', label: '🍳 In Kitchen', border: '#BFDBFE' },
      FOOD_READY: { bg: '#ECFDF5', color: '#065F46', label: '✨ Food Ready', border: '#A7F3D0' },
      DISPATCHED: { bg: '#F5F3FF', color: '#5B21B6', label: '🛵 On the Way', border: '#DDD6FE' },
      DELIVERED: { bg: '#F0FDF4', color: '#166534', label: '✅ Delivered', border: '#BBF7D0' },
      CANCELLED: { bg: '#FEF2F2', color: '#991B1B', label: '❌ Cancelled', border: '#FECACA' },
      REJECTED: { bg: '#FEF2F2', color: '#991B1B', label: '🚫 Rejected', border: '#FECACA' },
    };
    return badges[status] || { bg: '#F1F5F9', color: '#475569', label: status, border: '#CBD5E1' };
  };

  return (
    <div style={{ padding: 20, overflowY: 'auto', height: '100%', boxSizing: 'border-box', background: C.bg, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🛵</span>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
              Online Delivery Orders & Aggregators
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
            Step 1: Login to Swiggy / Zomato merchant account • Step 2: Extract live orders directly into POS
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Extract Live Orders Button */}
          <button
            onClick={handleExtractAll}
            disabled={actionLoading === 'extract-all'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', border: 'none',
              padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 800, boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              transition: 'all 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}
          >
            <span>{actionLoading === 'extract-all' ? '⏳' : '📥'}</span>
            <span>{actionLoading === 'extract-all' ? 'Extracting from Apps...' : 'Fetch / Extract Live Orders'}</span>
          </button>

          {/* Paste Order Payload */}
          <button
            onClick={() => setImportModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', color: C.text, border: `1.5px solid ${C.border}`,
              padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, transition: 'all 0.15s'
            }}
          >
            <span>📋</span> Paste Payload / Slip
          </button>

          {/* Webhook & API Config */}
          <button
            onClick={() => setWebhookModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', color: '#2563EB', border: `1.5px solid #BFDBFE`,
              padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, transition: 'all 0.15s'
            }}
          >
            <span>🔗</span> Webhook URLs
          </button>

          {/* Clear Old Data / Reset */}
          <button
            onClick={handleCleanupMockData}
            disabled={actionLoading === 'cleanup'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFF1F2', color: '#E11D48', border: '1.5px solid #FECDD3',
              padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, transition: 'all 0.15s'
            }}
            title="Purge old test/unbilled orders"
          >
            <span>🧹</span> {actionLoading === 'cleanup' ? 'Clearing...' : 'Clear Test Data'}
          </button>

          {/* Auto refresh switch */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: C.surface, border: `1px solid ${C.border}`,
            padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', color: C.text
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Auto Sync (12s)</span>
          </label>
        </div>
      </div>

      {/* Toast Notification */}
      {msg.text && (
        <div style={{
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: msg.type === 'error' ? '#FEF2F2' : msg.type === 'success' ? '#F0FDF4' : '#EFF6FF',
          color: msg.type === 'error' ? '#DC2626' : msg.type === 'success' ? '#16A34A' : '#1D4ED8',
          border: `1.5px solid ${msg.type === 'error' ? '#FCA5A5' : msg.type === 'success' ? '#86EFAC' : '#93C5FD'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: 'info' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Aggregator Connection Cards (Swiggy Partner & Zomato Merchant) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
        {/* SWIGGY PARTNER CARD */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #FED7AA',
          boxShadow: '0 4px 14px rgba(252,128,25,0.06)', display: 'flex', flexDirection: 'column', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#FFF7ED',
                border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22
              }}>
                🟠
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#9A3412', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Swiggy Partner App
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 100,
                    background: platforms.swiggy?.isLoggedIn ? '#ECFDF5' : '#FEF2F2',
                    color: platforms.swiggy?.isLoggedIn ? '#059669' : '#DC2626',
                    fontWeight: 800
                  }}>
                    {platforms.swiggy?.isLoggedIn ? '● Connected' : '○ Logged Out'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {platforms.swiggy?.merchantId ? `Merchant: ${platforms.swiggy.merchantId}` : 'No account linked'} • {platforms.swiggy?.outletName || 'Main Outlet'}
                </div>
              </div>
            </div>

            {/* Online / Offline Status Button */}
            {platforms.swiggy?.isLoggedIn && (
              <button
                onClick={() => handleTogglePlatformStatus('swiggy', platforms.swiggy?.isOnline)}
                style={{
                  padding: '5px 12px', borderRadius: 100,
                  border: `1.5px solid ${platforms.swiggy?.isOnline ? '#86EFAC' : '#CBD5E1'}`,
                  background: platforms.swiggy?.isOnline ? '#F0FDF4' : '#F8FAFC',
                  color: platforms.swiggy?.isOnline ? '#15803D' : '#64748B',
                  cursor: 'pointer', fontSize: 11, fontWeight: 800
                }}
              >
                {platforms.swiggy?.isOnline ? '🟢 ONLINE' : '⚪ OFFLINE'}
              </button>
            )}
          </div>

          {/* Actions & Metrics Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 12 }}>
            <div>
              <span style={{ color: C.textMuted }}>Orders: </span>
              <strong style={{ color: C.text }}>{stats?.swiggy?.count || 0}</strong>
              <span style={{ color: C.textMuted, marginLeft: 8 }}>Vol: </span>
              <strong style={{ color: '#EA580C' }}>₹{(stats?.swiggy?.revenue || 0).toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {platforms.swiggy?.isLoggedIn ? (
                <>
                  <button
                    onClick={() => handleExtractPlatform('swiggy')}
                    disabled={actionLoading === 'extract-swiggy'}
                    style={{
                      padding: '5px 10px', background: '#FC8019', color: '#fff', border: 'none',
                      borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {actionLoading === 'extract-swiggy' ? 'Extracting...' : '📥 Fetch'}
                  </button>
                  <button
                    onClick={() => openLoginModal('swiggy')}
                    style={{ padding: '5px 8px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => handlePlatformLogout('swiggy')}
                    style={{ padding: '5px 8px', background: '#FEF2F2', color: '#DC2626', border: `1px solid #FECACA`, borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openLoginModal('swiggy')}
                  style={{
                    padding: '6px 14px', background: '#FC8019', color: '#fff', border: 'none',
                    borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(252,128,25,0.3)'
                  }}
                >
                  🔑 Step 1: Login Swiggy App
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ZOMATO MERCHANT CARD */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #FECACA',
          boxShadow: '0 4px 14px rgba(226,55,68,0.06)', display: 'flex', flexDirection: 'column', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#FEF2F2',
                border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22
              }}>
                🔴
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Zomato Merchant App
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 100,
                    background: platforms.zomato?.isLoggedIn ? '#ECFDF5' : '#FEF2F2',
                    color: platforms.zomato?.isLoggedIn ? '#059669' : '#DC2626',
                    fontWeight: 800
                  }}>
                    {platforms.zomato?.isLoggedIn ? '● Connected' : '○ Logged Out'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {platforms.zomato?.merchantId ? `Outlet: ${platforms.zomato.merchantId}` : 'No account linked'} • {platforms.zomato?.outletName || 'Main Kitchen'}
                </div>
              </div>
            </div>

            {/* Online / Offline Status Button */}
            {platforms.zomato?.isLoggedIn && (
              <button
                onClick={() => handleTogglePlatformStatus('zomato', platforms.zomato?.isOnline)}
                style={{
                  padding: '5px 12px', borderRadius: 100,
                  border: `1.5px solid ${platforms.zomato?.isOnline ? '#86EFAC' : '#CBD5E1'}`,
                  background: platforms.zomato?.isOnline ? '#F0FDF4' : '#F8FAFC',
                  color: platforms.zomato?.isOnline ? '#15803D' : '#64748B',
                  cursor: 'pointer', fontSize: 11, fontWeight: 800
                }}
              >
                {platforms.zomato?.isOnline ? '🟢 ONLINE' : '⚪ OFFLINE'}
              </button>
            )}
          </div>

          {/* Actions & Metrics Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 12 }}>
            <div>
              <span style={{ color: C.textMuted }}>Orders: </span>
              <strong style={{ color: C.text }}>{stats?.zomato?.count || 0}</strong>
              <span style={{ color: C.textMuted, marginLeft: 8 }}>Vol: </span>
              <strong style={{ color: '#DC2626' }}>₹{(stats?.zomato?.revenue || 0).toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {platforms.zomato?.isLoggedIn ? (
                <>
                  <button
                    onClick={() => handleExtractPlatform('zomato')}
                    disabled={actionLoading === 'extract-zomato'}
                    style={{
                      padding: '5px 10px', background: '#E23744', color: '#fff', border: 'none',
                      borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {actionLoading === 'extract-zomato' ? 'Extracting...' : '📥 Fetch'}
                  </button>
                  <button
                    onClick={() => openLoginModal('zomato')}
                    style={{ padding: '5px 8px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => handlePlatformLogout('zomato')}
                    style={{ padding: '5px 8px', background: '#FEF2F2', color: '#DC2626', border: `1px solid #FECACA`, borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openLoginModal('zomato')}
                  style={{
                    padding: '6px 14px', background: '#E23744', color: '#fff', border: 'none',
                    borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(226,55,68,0.3)'
                  }}
                >
                  🔑 Step 1: Login Zomato App
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10
      }}>
        {[
          { label: 'Total Today', value: stats?.totalOrders || 0, color: '#4F46E5', icon: '📦' },
          { label: 'New / Attention', value: stats?.newCount || 0, color: '#D97706', icon: '🔔', highlight: (stats?.newCount || 0) > 0 },
          { label: 'In Kitchen', value: stats?.preparingCount || 0, color: '#2563EB', icon: '👨‍🍳' },
          { label: 'Food Ready', value: stats?.readyCount || 0, color: '#059669', icon: '🍳' },
          { label: 'Dispatched', value: stats?.dispatchedCount || 0, color: '#7C3AED', icon: '🛵' },
          { label: 'Delivered', value: stats?.deliveredCount || 0, color: '#16A34A', icon: '✅' },
          { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, color: '#0F172A', icon: '💰' },
        ].map((item, idx) => (
          <div key={idx} style={{
            background: item.highlight ? '#FFFBEB' : C.surface,
            border: `1.5px solid ${item.highlight ? '#FCD34D' : C.border}`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', flexDirection: 'column', gap: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{item.icon}</span> {item.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        background: C.surface, borderRadius: 10, padding: '10px 14px',
        border: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap',
        justifyContent: 'space-between', alignItems: 'center', gap: 10
      }}>
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'NEW', label: `🔔 New (${stats?.newCount || 0})`, highlight: (stats?.newCount || 0) > 0 },
            { id: 'PREPARING_ALL', label: `👨‍🍳 Kitchen (${stats?.preparingCount || 0})` },
            { id: 'FOOD_READY', label: `🍳 Ready (${stats?.readyCount || 0})` },
            { id: 'DISPATCHED', label: '🛵 Dispatched' },
            { id: 'DELIVERED', label: '✅ Delivered' },
            { id: 'CANCELLED', label: '❌ Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: statusFilter === tab.id ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`,
                background: statusFilter === tab.id ? C.primaryBg : (tab.highlight ? '#FEF3C7' : 'transparent'),
                color: statusFilter === tab.id ? C.primary : (tab.highlight ? '#B45309' : C.textMuted),
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Platform Selector & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text, fontSize: 12, fontWeight: 600, outline: 'none'
            }}
          >
            <option value="all">All Platforms</option>
            <option value="swiggy">🟠 Swiggy Only</option>
            <option value="zomato">🔴 Zomato Only</option>
          </select>

          <input
            type="text"
            placeholder="🔍 Search Order ID, Customer, Phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text, fontSize: 12, minWidth: 220, outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Loading Online Orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', background: C.surface,
          borderRadius: 12, border: `1px dashed ${C.border}`
        }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>🍽️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No Online Orders Found</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, marginBottom: 16 }}>
            Click "Fetch / Extract Live Orders" to extract active orders from your connected food delivery applications.
          </div>
          <button
            onClick={handleExtractAll}
            style={{
              padding: '10px 20px', background: C.primary, color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            📥 Fetch Live Orders Now
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 16
        }}>
          {orders.map(order => {
            const isSwiggy = order.platform === 'swiggy';
            const brandColor = isSwiggy ? '#FC8019' : '#E23744';
            const brandBg = isSwiggy ? '#FFF7ED' : '#FEF2F2';
            const isBilled = !!order.posBill || order.isConvertedToBill;
            const badge = getStatusBadge(order.status);

            return (
              <div
                key={order._id}
                style={{
                  background: C.surface,
                  borderRadius: 12,
                  border: `1.5px solid ${order.status === 'NEW' ? '#F59E0B' : C.border}`,
                  boxShadow: order.status === 'NEW' ? '0 4px 14px rgba(245,158,11,0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'transform 0.15s',
                }}
              >
                {/* Order Top Bar */}
                <div style={{
                  padding: '10px 14px', background: brandBg, borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      background: brandColor, color: '#fff', fontSize: 10, fontWeight: 900,
                      padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5
                    }}>
                      {order.platform?.toUpperCase()}
                    </span>
                    <strong style={{ fontSize: 13, color: C.text }}>#{order.orderId}</strong>
                    <span style={{ fontSize: 11, color: C.textMuted }}>⏱ {getTimeAgo(order.placedAt || order.createdAt)}</span>
                  </div>

                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                    background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                  }}>
                    {badge.label}
                  </span>
                </div>

                {/* Customer Details */}
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>👤 {order.customer?.name}</span>
                      <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>📞 {order.customer?.phone}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      📍 {order.customer?.address || 'Delivery Address Provided'}
                    </div>
                  </div>

                  {order.customer?.instructions && (
                    <div style={{
                      fontSize: 11, background: '#FFFBEB', color: '#B45309', padding: '6px 10px',
                      borderRadius: 6, border: '1px solid #FCD34D'
                    }}>
                      🔔 Note: {order.customer.instructions}
                    </div>
                  )}

                  {/* Items List */}
                  <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {order.items?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.text }}>
                          <strong>{it.qty}x</strong> {it.productName}
                          {it.addons?.length > 0 && <span style={{ color: '#059669', fontSize: 10 }}> ({it.addons.join(', ')})</span>}
                        </span>
                        <span style={{ fontWeight: 700, color: C.text }}>₹{it.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial & Rider Details */}
                <div style={{ padding: '8px 14px', background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {order.rider?.name ? (
                      <span style={{ color: C.textMuted }}>
                        🛵 Rider: <strong>{order.rider.name}</strong> (OTP: {order.rider.otp})
                      </span>
                    ) : (
                      <span style={{ color: C.textMuted }}>🛵 Assigning Rider...</span>
                    )}

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 10, color: C.textMuted }}>Order Total: </span>
                      <strong style={{ fontSize: 14, color: C.text }}>₹{order.netAmount}</strong>
                    </div>
                  </div>

                  {isBilled && (
                    <div style={{ marginTop: 4, color: '#059669', fontWeight: 700, fontSize: 10 }}>
                      ✓ Billed on POS: #{order.posBillNo || 'Generated'}
                    </div>
                  )}
                </div>

                {/* Action Controls Bar */}
                <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {order.status === 'NEW' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'ACCEPTED')}
                        disabled={actionLoading === order._id}
                        style={{
                          flex: 1, padding: '8px 12px', background: '#16A34A', color: '#fff',
                          border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        Accept (20m)
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'REJECTED')}
                        disabled={actionLoading === order._id}
                        style={{
                          padding: '8px 10px', background: '#FEF2F2', color: '#DC2626',
                          border: '1px solid #FECACA', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {['ACCEPTED', 'PREPARING'].includes(order.status) && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'FOOD_READY')}
                      disabled={actionLoading === order._id}
                      style={{
                        flex: 1, padding: '8px 12px', background: '#059669', color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      🍳 Mark Food Ready
                    </button>
                  )}

                  {order.status === 'FOOD_READY' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'DISPATCHED')}
                      disabled={actionLoading === order._id}
                      style={{
                        flex: 1, padding: '8px 12px', background: '#7C3AED', color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      🛵 Handover to Rider
                    </button>
                  )}

                  {order.status === 'DISPATCHED' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                      disabled={actionLoading === order._id}
                      style={{
                        flex: 1, padding: '8px 12px', background: '#16A34A', color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      ✅ Mark Delivered
                    </button>
                  )}

                  {/* Punch to POS Bill Button */}
                  {!isBilled && !['CANCELLED', 'REJECTED'].includes(order.status) && (
                    <button
                      onClick={() => handleConvertToBill(order)}
                      disabled={actionLoading === `bill-${order._id}`}
                      style={{
                        padding: '8px 10px', background: '#F1F5F9', color: '#0F172A',
                        border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}
                      title="Convert to POS Bill and auto-deduct inventory stock"
                    >
                      <span>🧾</span> Bill POS
                    </button>
                  )}

                  {/* Print Slip Button */}
                  <button
                    onClick={() => printOnlineOrderSlip(order)}
                    style={{
                      padding: '8px 10px', background: '#F8FAFC', color: '#0F172A',
                      border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                    title="Print isolated 80mm/58mm thermal KOT / receipt slip"
                  >
                    <span>🖨️</span> Print
                  </button>

                  {/* View Details / KOT Button */}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      padding: '8px 10px', background: C.surface, color: C.textMuted,
                      border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View Slip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STEP 1 MODAL: LOGIN FOOD DELIVERY APP */}
      {/* ───────────────────────────────────────────────────────────── */}
      {loginModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: loginModal.platform === 'swiggy'
                ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
                : 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{loginModal.platform === 'swiggy' ? '🟠' : '🔴'}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>
                    Login {loginModal.platform === 'swiggy' ? 'Swiggy Partner' : 'Zomato Merchant'}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>
                    Step 1: Connect your outlet account to extract live orders
                  </div>
                </div>
              </div>
              <button onClick={() => setLoginModal({ open: false, platform: 'swiggy' })} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Form Body */}
            <form onSubmit={handlePlatformLoginSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Instructions banner */}
              <div style={{
                background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10,
                padding: '10px 14px', fontSize: 12, color: '#0369A1', lineHeight: 1.4
              }}>
                ℹ️ <strong>Partner Authentication:</strong> Enter your official {loginModal.platform === 'swiggy' ? 'Swiggy Partner' : 'Zomato Merchant'} Restaurant ID / Store Code and credentials to establish a secure live session.
              </div>

              {/* Outlet / Merchant ID */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                  {loginModal.platform === 'swiggy' ? 'Swiggy Restaurant ID / Merchant ID *' : 'Zomato Restaurant ID / Res ID *'}
                </label>
                <input
                  type="text"
                  required
                  value={loginForm.merchantId}
                  onChange={e => setLoginForm(prev => ({ ...prev, merchantId: e.target.value }))}
                  placeholder={loginModal.platform === 'swiggy' ? 'e.g. 582910 or SW-BLR-01' : 'e.g. 19283011 or ZT-DEL-01'}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Outlet Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                  Restaurant / Outlet Name
                </label>
                <input
                  type="text"
                  value={loginForm.outletName}
                  onChange={e => setLoginForm(prev => ({ ...prev, outletName: e.target.value }))}
                  placeholder="e.g. Main Kitchen / Downtown Branch"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Username / Registered Mobile */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                  Registered Mobile / Partner Username *
                </label>
                <input
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g. 9845123049 or merchant_admin"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Password / PIN */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                  Password / Partner PIN *
                </label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter partner portal password or PIN"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Optional API Key / Token */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                  API Key / Access Token (Optional)
                </label>
                <input
                  type="text"
                  value={loginForm.apiKey}
                  onChange={e => setLoginForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Paste aggregator API key if using direct API integration"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={actionLoading === 'login'}
                style={{
                  padding: '12px 18px', background: loginModal.platform === 'swiggy' ? '#EA580C' : '#DC2626',
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800,
                  cursor: actionLoading === 'login' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <span>🔐</span>
                <span>{actionLoading === 'login' ? 'Authenticating...' : 'Authenticate & Connect Store'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STEP 2 MODAL: PASTE RAW ORDER PAYLOAD / SLIP */}
      {/* ───────────────────────────────────────────────────────────── */}
      {importModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px', background: '#0F172A', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>📋 Extract & Import Delivery Order Payload</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Paste JSON payload or raw text slip from Swiggy / Zomato</div>
              </div>
              <button onClick={() => setImportModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Sample payload buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setRawPayload(JSON.stringify({
                      platform: 'swiggy',
                      orderId: `SW-${Math.floor(100000 + Math.random() * 900000)}`,
                      customer_name: 'Ananya Iyer',
                      customer_phone: '9820194827',
                      delivery_address: 'B-704, Skyline Residency, Outer Ring Road',
                      special_instructions: 'Extra spicy, please add extra cutlery.',
                      items: [
                        { name: 'Chicken Biryani (Family Pack)', rate: 450, qty: 1, addons: ['Extra Raita'] },
                        { name: 'Butter Naan', rate: 45, qty: 2 }
                      ],
                      packagingCharge: 35,
                      netAmount: 565,
                      rider: { name: 'Abdul Rahman', phone: '9944332211', otp: '4921' }
                    }, null, 2));
                  }}
                  style={{
                    flex: 1, padding: '6px 10px', background: '#FFF7ED', color: '#EA580C',
                    border: '1px solid #FED7AA', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  🟠 Sample Swiggy JSON
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRawPayload(JSON.stringify({
                      platform: 'zomato',
                      orderId: `ZT-${Math.floor(100000 + Math.random() * 900000)}`,
                      customer_name: 'Priya Patel',
                      customer_phone: '9845123049',
                      delivery_address: 'Flat 402, Green Valley Apts, Sector 14',
                      special_instructions: 'Please don\'t ring bell, baby sleeping.',
                      items: [
                        { name: 'Paneer Butter Masala', rate: 240, qty: 1 },
                        { name: 'Garlic Butter Naan', rate: 50, qty: 2 }
                      ],
                      packagingCharge: 30,
                      netAmount: 370,
                      rider: { name: 'Suresh Babu', phone: '9871122334', otp: '8818' }
                    }, null, 2));
                  }}
                  style={{
                    flex: 1, padding: '6px 10px', background: '#FEF2F2', color: '#DC2626',
                    border: '1px solid #FECACA', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  🔴 Sample Zomato JSON
                </button>
              </div>

              <textarea
                rows={9}
                value={rawPayload}
                onChange={e => setRawPayload(e.target.value)}
                placeholder="Paste Swiggy/Zomato JSON payload or raw text slip here..."
                style={{
                  width: '100%', padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`,
                  fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box'
                }}
              />

              <button
                onClick={handleImportPayload}
                disabled={actionLoading === 'import-payload'}
                style={{
                  padding: '12px 18px', background: C.primary, color: '#fff', border: 'none',
                  borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <span>🚀</span>
                <span>{actionLoading === 'import-payload' ? 'Extracting Order...' : 'Extract & Import Into POS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* WEBHOOK & INTEGRATION MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {webhookModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px', background: '#1E3A8A', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>🔗 Real-time Webhook Receiver URLs</div>
                <div style={{ fontSize: 11, color: '#BFDBFE' }}>Configure these in Swiggy Partner / Zomato Merchant webhook settings</div>
              </div>
              <button onClick={() => setWebhookModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#EA580C', marginBottom: 4 }}>Swiggy Webhook Endpoint:</div>
                <input
                  readOnly
                  value="http://localhost:5001/api/online-orders/webhook/swiggy"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: 'monospace', background: '#F8FAFC', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#DC2626', marginBottom: 4 }}>Zomato Webhook Endpoint:</div>
                <input
                  readOnly
                  value="http://localhost:5001/api/online-orders/webhook/zomato"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: 'monospace', background: '#F8FAFC', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.4, background: '#EFF6FF', padding: 12, borderRadius: 8 }}>
                💡 <strong>How it works:</strong> Delivery aggregators send live incoming order events to these endpoints. The POS automatically accepts, processes KOT, and updates stock!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ORDER SLIP / KOT RECEIPT MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px', background: selectedOrder.platform === 'swiggy' ? '#FC8019' : '#E23744',
              color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  {selectedOrder.platform?.toUpperCase()} ORDER SLIP
                </div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>
                  #{selectedOrder.orderId} • {new Date(selectedOrder.placedAt || selectedOrder.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Thermal Receipt Style) */}
            <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #CBD5E1', paddingBottom: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>RESTORANT POS</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Online Delivery Order (KOT / Tax Invoice)</div>
              </div>

              {/* Customer */}
              <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                <div><strong>Customer:</strong> {selectedOrder.customer?.name}</div>
                <div><strong>Phone:</strong> {selectedOrder.customer?.phone || 'N/A'}</div>
                <div><strong>Address:</strong> {selectedOrder.customer?.address || 'N/A'}</div>
                {selectedOrder.customer?.instructions && (
                  <div style={{ marginTop: 4, color: '#B45309' }}><strong>Instructions:</strong> {selectedOrder.customer.instructions}</div>
                )}
              </div>

              <div style={{ borderBottom: '1px dashed #CBD5E1' }} />

              {/* Items Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span>Item</span>
                  <span>Qty x Rate = Total</span>
                </div>
                {selectedOrder.items?.map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.productName}</span>
                    <span>{it.qty} x ₹{it.rate} = ₹{it.amount}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderBottom: '1px dashed #CBD5E1' }} />

              {/* Financial Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST (5%):</span>
                  <span>₹{selectedOrder.gstTotal}</span>
                </div>
                {selectedOrder.packagingCharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Packaging:</span>
                    <span>₹{selectedOrder.packagingCharge}</span>
                  </div>
                )}
                {selectedOrder.deliveryFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery Fee:</span>
                    <span>₹{selectedOrder.deliveryFee}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                    <span>Discount:</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, marginTop: 4 }}>
                  <span>NET PAID:</span>
                  <span>₹{selectedOrder.netAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontSize: 11 }}>
                  <span>Est. Restaurant Payout:</span>
                  <span>₹{selectedOrder.payoutAmount || selectedOrder.netAmount}</span>
                </div>
              </div>

              {/* Rider Section */}
              {selectedOrder.rider?.name && (
                <div style={{
                  background: '#F1F5F9', padding: 8, borderRadius: 6, fontSize: 11,
                  display: 'flex', justifyContent: 'space-between'
                }}>
                  <span>Rider: <strong>{selectedOrder.rider.name}</strong></span>
                  <span>OTP: <strong>{selectedOrder.rider.otp}</strong></span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ padding: 14, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8 }}>
              <button
                onClick={() => printOnlineOrderSlip(selectedOrder)}
                style={{
                  flex: 1, padding: '10px 14px', background: '#0F172A', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <span>🖨️</span> Print KOT / Slip
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  padding: '10px 16px', background: C.surface, color: C.text,
                  border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
