const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Helper function to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('auth_token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  verify: async () => {
    return fetchWithAuth('/auth/verify');
  },
};

// Products API
export const productsApi = {
  getAll: async (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return fetchWithAuth(`/products${query}`);
  },

  getById: async (id: number) => {
    return fetchWithAuth(`/products/${id}`);
  },

  create: async (formData: FormData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }

    return response.json();
  },

  update: async (id: number, formData: FormData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }

    return response.json();
  },

  delete: async (id: number) => {
    return fetchWithAuth(`/products/${id}`, { method: 'DELETE' });
  },
};

// Categories API
export const categoriesApi = {
  getAll: async () => {
    return fetchWithAuth('/categories');
  },

  create: async (name: string) => {
    return fetchWithAuth('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  delete: async (id: number) => {
    return fetchWithAuth(`/categories/${id}`, { method: 'DELETE' });
  },
};

// Orders API
export const ordersApi = {
  create: async (orderData: {
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    telegram_username?: string;
    items: any[];
    total: number;
  }) => {
    return fetchWithAuth('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getAll: async () => {
    return fetchWithAuth('/orders');
  },

  updateStatus: async (id: number, status: string) => {
    return fetchWithAuth(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Settings API
export const settingsApi = {
  getAll: async () => {
    return fetchWithAuth('/settings');
  },

  update: async (settings: Record<string, string>) => {
    return fetchWithAuth('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
