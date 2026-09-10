const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${hostname}:5000/api`;
};

const API_BASE = getApiBaseUrl();

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = sessionStorage.getItem('flavora_auth_token') || localStorage.getItem('flavora_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const deviceToken = typeof localStorage !== 'undefined' ? localStorage.getItem('flavora_device_id') : null;
  if (deviceToken) {
    headers['x-device-token'] = deviceToken;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(response.status === 404 ? `Endpoint ${endpoint} returned 404 Not Found. Please restart your backend server (npm start) so newly mounted routes take effect.` : `Server error (${response.status})`);
      }
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || 'API Request Failed');
    }
    return data.data || data;
  } catch (error) {
    console.warn(`API call failed for ${endpoint}:`, error.message);
    throw error;
  }
};

export const api = {
  // Auth API
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  resetPassword: (email, otp, newPassword) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword })
  }),
  getMe: () => request('/auth/me'),
  updateMyProfile: (data) => request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  getMySettings: () => request('/auth/me/settings'),
  updateMySettings: (data) => request('/auth/me/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getMyNotifications: () => request('/auth/me/notifications'),
  markMyNotificationsRead: () => request('/auth/me/notifications/read', { method: 'PATCH' }),
  getMyActivities: () => request('/auth/me/activities'),
  addMyActivity: (data) => request('/auth/me/activities', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: (id) => request(`/auth/profile/${id}`),

  // Menu API
  getMenuItems: () => request('/menu'),
  createMenuItem: (data) => request('/menu', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: 'DELETE' }),

  // Orders API
  getOrders: () => request('/orders'),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status, extra = {}) => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/i, '').trim());
    return request(`/orders/${cleanId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra })
    });
  },
  updateOrderItemStatus: (id, itemIds, status = 'DELIVERED') => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/i, '').trim());
    return request(`/orders/${cleanId}/items/status`, {
      method: 'PATCH',
      body: JSON.stringify({ itemIds, status })
    });
  },
  claimOrder: (id) => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/i, '').trim());
    return request(`/orders/${cleanId}/claim`, { method: 'PATCH' });
  },
  chefAcceptOrder: (id) => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/i, '').trim());
    return request(`/orders/${cleanId}/chef-accept`, { method: 'PATCH' });
  },
  chefUpdateStatus: (id, status, extraData = {}) => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/i, '').trim());
    return request(`/orders/${cleanId}/chef-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extraData })
    });
  },
  waiterAcceptOrder: (id) => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/i, '').trim());
    return request(`/orders/${cleanId}/waiter-accept`, { method: 'PATCH' });
  },
  waiterUpdateStatus: (id, status) => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/i, '').trim());
    return request(`/orders/${cleanId}/waiter-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  clearAllOrders: () => request('/orders/all', { method: 'DELETE' }),

  // Tables API
  getTables: () => request('/tables'),
  assignTableWaiter: (tableNum, data = {}) => {
    const cleanNum = encodeURIComponent(String(tableNum || '').trim());
    return request(`/tables/assign-waiter/${cleanNum}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  updateTableStatus: (id, statusData, currentOrder = '') => {
    let payload = {};
    if (typeof statusData === 'object' && statusData !== null) {
      payload = statusData;
    } else {
      payload = { status: String(statusData || 'Available'), currentOrder };
    }
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/i, '').trim());
    return request(`/tables/${cleanId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  clearTable: (id) => request(`/tables/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'Available', currentOrder: '' })
  }),

  // Reservations API
  getReservations: () => request('/reservations'),
  createReservation: (data) => request('/reservations', { method: 'POST', body: JSON.stringify(data) }),

  // Staff API
  getStaff: () => request('/staff'),
  createStaff: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id, data) => request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStaff: (id) => request(`/staff/${id}`, { method: 'DELETE' }),

  // Inventory API
  getInventory: () => request('/inventory'),
  updateInventory: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Coupons API
  getCoupons: () => request('/coupons'),
  validateCoupon: async (code, subtotal) => {
    try {
      return await request('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) });
    } catch (err) {
      if (err.message && (err.message.includes('404') || err.message.includes('Not Found'))) {
        // Fallback: fetch coupons list from GET /coupons and validate locally!
        const allCoupons = await request('/coupons').catch(() => []);
        let localSaved = [];
        try {
          const raw = localStorage.getItem('flavora_coupons');
          if (raw) localSaved = JSON.parse(raw);
        } catch (e) {}

        const combined = [...(Array.isArray(allCoupons) ? allCoupons : []), ...(Array.isArray(localSaved) ? localSaved : [])];
        const cleanCode = String(code).trim().toUpperCase();
        const found = combined.find(c => c && String(c.code || '').trim().toUpperCase() === cleanCode);

        if (!found) {
          return { valid: false, message: 'Invalid or expired coupon' };
        }

        const isInactive = found.isActive === false || found.status === 'Inactive' || found.status === 'INACTIVE';
        if (isInactive) {
          return { valid: false, message: 'Coupon is currently inactive' };
        }

        // Check validity date if configured
        if (found.validTill && found.validTill !== 'Never') {
          const expiry = new Date(found.validTill);
          if (!isNaN(expiry.getTime()) && new Date() > expiry) {
            return { valid: false, message: 'Coupon has expired' };
          }
        }
        if (found.expiryDate && new Date() > new Date(found.expiryDate)) {
          return { valid: false, message: 'Coupon has expired' };
        }

        const orderTotal = Number(subtotal || 0);
        const minOrderVal = Number(found.minOrder || found.minOrderAmount || 0);
        if (minOrderVal > 0 && orderTotal < minOrderVal) {
          return { valid: false, message: `Coupon is valid only for orders above ₹${minOrderVal}.` };
        }

        let discountAmount = 0;
        const discountVal = Number(found.discount || found.discountValue || 0);
        const discountType = String(found.discountType || (discountVal <= 100 ? 'PERCENTAGE' : 'FIXED')).toUpperCase();

        if (discountType === 'PERCENTAGE' || discountType === 'PERCENT') {
          discountAmount = Math.round((orderTotal * discountVal) / 100);
          const maxCap = Number(found.maxDiscount || found.maxDiscountLimit || 0);
          if (maxCap > 0 && discountAmount > maxCap) {
            discountAmount = maxCap;
          }
        } else {
          discountAmount = Math.min(discountVal, orderTotal);
        }

        const finalAmount = Math.max(0, orderTotal - discountAmount);

        return {
          valid: true,
          code: found.code,
          discountType,
          discountVal,
          discountAmount,
          finalAmount,
          message: `✓ Coupon ${found.code} applied successfully!`
        };
      }
      throw err;
    }
  },
  createCoupon: (data) => request('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id, data) => request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),

  // Settings API
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Upload API (Cloudinary)
  uploadImage: (fileDataUrl, folder = 'flavora_resto') => request('/upload', {
    method: 'POST',
    body: JSON.stringify({ file: fileDataUrl, folder })
  }),

  // Table QR & Management API
  getTables: () => request('/tables'),
  generateTableQr: (tableNum, targetUrl) => request('/tables/generate-qr', {
    method: 'POST',
    body: JSON.stringify({ tableNum, targetUrl })
  }),
  updateTableStatusByNum: (tableNum, data) => {
    const payload = typeof data === 'object' && data !== null ? data : { status: String(data || 'Available') };
    const cleanNum = encodeURIComponent(String(tableNum || '').replace(/^#/i, '').trim());
    return request(`/tables/number/${cleanNum}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  updateTableByNumber: (tableNum, data) => {
    const payload = typeof data === 'object' && data !== null ? data : { status: String(data || 'Available') };
    const cleanNum = encodeURIComponent(String(tableNum || '').replace(/^#/i, '').trim());
    return request(`/tables/number/${cleanNum}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  createTable: (tableData) => request('/tables', {
    method: 'POST',
    body: JSON.stringify(tableData)
  }),
  deleteTable: (tableId) => request(`/tables/${tableId}`, {
    method: 'DELETE'
  }),

  // Reports & Analytics API
  getReportAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/analytics${query ? `?${query}` : ''}`);
  },
  getReportBranches: () => request('/reports/branches'),

  // Payments & Settlements API
  getPaymentsSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/payments/summary${query ? `?${query}` : ''}`);
  },
  updateRefundStatus: (id, action) => request(`/admin/payments/refunds/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action })
  }),
  getPaymentGateways: () => request('/admin/payments/gateways'),
  updatePaymentGateway: (gatewayId, data) => request(`/admin/payments/gateways/${gatewayId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  testPaymentGateway: (gatewayId) => request(`/admin/payments/gateways/${gatewayId}/test`, {
    method: 'POST'
  }),

  // Receptionist & Host Dashboard API
  getReceptionistKPIs: () => request('/receptionist/kpis'),
  getFloorPlan: () => request('/receptionist/floor-plan'),
  getActiveTableSession: (tableNum, deviceToken, sessionToken) => {
    const extraHeaders = {};
    if (deviceToken) extraHeaders['x-device-token'] = deviceToken;
    if (sessionToken) extraHeaders['x-session-token'] = sessionToken;
    return request(`/receptionist/active-session/${encodeURIComponent(tableNum)}`, { headers: extraHeaders });
  },
  claimTableSession: async (tableNum, sessionToken, deviceToken) => {
    const extraHeaders = {};
    if (deviceToken) extraHeaders['x-device-token'] = deviceToken;
    if (sessionToken) extraHeaders['x-session-token'] = sessionToken;
    try {
      const token = sessionStorage.getItem('flavora_auth_token') || localStorage.getItem('flavora_auth_token');
      if (token) extraHeaders['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/receptionist/claim-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...extraHeaders
        },
        body: JSON.stringify({ tableNum, sessionToken, deviceToken })
      });
      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        ...data
      };
    } catch (err) {
      return {
        status: 0,
        ok: false,
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Server connection error.'
      };
    }
  },
  seatWalkIn: (data) => request('/receptionist/walk-ins/seat', { method: 'POST', body: JSON.stringify(data) }),
  mergeTables: (primaryTableNum, secondaryTableNums) => request('/receptionist/tables/merge', { method: 'POST', body: JSON.stringify({ primaryTableNum, secondaryTableNums }) }),
  splitTables: (tableNum) => request('/receptionist/tables/split', { method: 'POST', body: JSON.stringify({ tableNum }) }),
  transferTable: (fromTableNum, toTableNum) => request('/receptionist/tables/transfer', { method: 'POST', body: JSON.stringify({ fromTableNum, toTableNum }) }),
  vacateTable: (tableNum) => request('/receptionist/tables/vacate', { method: 'POST', body: JSON.stringify({ tableNum }) }),
  getWaitlist: () => request('/receptionist/waitlist'),
  createWaitlistToken: (data) => request('/receptionist/waitlist', { method: 'POST', body: JSON.stringify(data) }),
  callWaitlistToken: (id) => request(`/receptionist/waitlist/${id}/call`, { method: 'POST' }),
  seatWaitlistToken: (id, tableNum, mergedTableNums = []) => request(`/receptionist/waitlist/${id}/seat`, { method: 'POST', body: JSON.stringify({ tableNum, mergedTableNums }) }),
  updateWaitlistStatus: (id, status) => request(`/receptionist/waitlist/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getReceptionistReservations: () => request('/receptionist/reservations'),
  createReceptionistReservation: (data) => request('/receptionist/reservations', { method: 'POST', body: JSON.stringify(data) }),
  checkInReservation: (id, tableNo) => request(`/receptionist/reservations/${id}/check-in`, { method: 'POST', body: JSON.stringify({ tableNo }) }),
  updateReservationStatus: (id, status, tableNo) => request(`/receptionist/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, tableNo }) }),
  getGuests: (search = '') => request(`/receptionist/guests${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  updateGuestPreferences: (id, data) => request(`/receptionist/guests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  sendReceptionistNotification: (data) => request('/receptionist/notifications/send', { method: 'POST', body: JSON.stringify(data) }),

  // Customer Module & Waiter Assistance API
  callWaiter: (table, requestType = 'Assistance', note = '') => request('/orders/call-waiter', {
    method: 'POST',
    body: JSON.stringify({ table, requestType, note })
  }),
  getAssistanceRequests: () => request('/orders/assistance'),
  updateAssistanceStatus: (id, status) => request(`/orders/assistance/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  requestOrderCancellation: (id, reason, itemIds = null) => request(`/orders/${id}/cancel-request`, {
    method: 'POST',
    body: JSON.stringify({
      reason,
      itemIds: Array.isArray(itemIds) ? itemIds : (itemIds ? [itemIds] : []),
      itemId: typeof itemIds === 'string' ? itemIds : null
    })
  }),
  submitFeedback: (feedbackData) => request('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedbackData)
  }),
  getFeedback: () => request('/feedback'),
  getFeedbacks: () => request('/feedback'),
  getPublicReviews: () => request('/feedback/public'),
  toggleFeedbackLanding: (id, showOnLanding) => request(`/feedback/${encodeURIComponent(id)}/toggle-landing`, {
    method: 'PATCH',
    body: JSON.stringify({ showOnLanding })
  }),
  deleteFeedback: (id) => request(`/feedback/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),
  getGuestLoyalty: (phone) => request(`/receptionist/guests?search=${encodeURIComponent(phone || '')}`),
  redeemLoyaltyPoints: (phone, points) => Promise.resolve({ success: true, redeemed: points, discount: Math.round(points * 0.5) }),

  // Multi-Waiter & Multi-Chef Workload Management API
  assignTableWaiter: (tableId, waiterId, waiterName) => request(`/tables/${encodeURIComponent(tableId)}/assign-waiter`, {
    method: 'PUT',
    body: JSON.stringify({ waiterId, waiterName })
  }),
  claimChefOrder: (orderId, chefId, chefName) => request(`/orders/${encodeURIComponent(orderId)}/claim-chef`, {
    method: 'POST',
    body: JSON.stringify({ chefId, chefName })
  }),
  reassignChefOrder: (orderId, chefId, chefName) => request(`/orders/${encodeURIComponent(orderId)}/reassign-chef`, {
    method: 'POST',
    body: JSON.stringify({ chefId, chefName })
  }),
  getStaffWorkload: () => request('/staff/workload'),

  // Staff Management API
  getStaff: () => request('/staff'),
  createStaff: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id, data) => request(`/staff/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStaff: (id) => request(`/staff/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  checkStaffPhone: (phone, excludeId = '') => request(`/staff/check-phone?phone=${encodeURIComponent(phone)}${excludeId ? `&excludeId=${encodeURIComponent(excludeId)}` : ''}`)
};

