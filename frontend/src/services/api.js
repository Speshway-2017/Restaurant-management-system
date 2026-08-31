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
  updateTableStatus: (id, data) => request(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  generateTableQr: (tableNum, targetUrl) => request('/tables/generate-qr', {
    method: 'POST',
    body: JSON.stringify({ tableNum, targetUrl })
  }),
  updateTableStatusByNum: (tableNum, data) => request(`/tables/number/${tableNum}`, {
    method: 'PUT',
    body: JSON.stringify(data)
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
  })
};
