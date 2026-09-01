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

  const token = localStorage.getItem('flavora_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
  clearAllOrders: () => request('/orders/all', { method: 'DELETE' }),

  // Tables API
  getTables: () => request('/tables'),
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
  seatWalkIn: (data) => request('/receptionist/walk-ins/seat', { method: 'POST', body: JSON.stringify(data) }),
  mergeTables: (primaryTableNum, secondaryTableNums) => request('/receptionist/tables/merge', { method: 'POST', body: JSON.stringify({ primaryTableNum, secondaryTableNums }) }),
  splitTables: (tableNum) => request('/receptionist/tables/split', { method: 'POST', body: JSON.stringify({ tableNum }) }),
  transferTable: (fromTableNum, toTableNum) => request('/receptionist/tables/transfer', { method: 'POST', body: JSON.stringify({ fromTableNum, toTableNum }) }),
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
  sendReceptionistNotification: (data) => request('/receptionist/notifications/send', { method: 'POST', body: JSON.stringify(data) })
};
