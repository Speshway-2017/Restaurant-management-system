const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

    const data = await response.json();
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
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Tables API
  getTables: () => request('/tables'),
  updateTableStatus: (id, status, currentOrder = '') => request(`/tables/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, currentOrder })
  }),

  // Reservations API
  getReservations: () => request('/reservations'),
  createReservation: (data) => request('/reservations', { method: 'POST', body: JSON.stringify(data) }),

  // Staff API
  getStaff: () => request('/staff'),
  createStaff: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  deleteStaff: (id) => request(`/staff/${id}`, { method: 'DELETE' }),

  // Inventory API
  getInventory: () => request('/inventory'),
  updateInventory: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Coupons API
  getCoupons: () => request('/coupons'),
  createCoupon: (data) => request('/coupons', { method: 'POST', body: JSON.stringify(data) }),

  // Settings API
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) })
};
