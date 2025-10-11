const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Demo mode disabled for production deployment
const DEMO_MODE = false;

type DemoProduct = {
  id: number;
  name: string;
  category_name: string;
  farm: string;
  description: string;
  image_url?: string;
  video_url?: string;
  prices: { weight: string; price: number }[];
};

type DemoCategory = { id: number; name: string };

type DemoDB = {
  products: DemoProduct[];
  categories: DemoCategory[];
  settings: { welcome_message: string; telegram_contact: string };
};

function demoLoad(): DemoDB {
  const db = JSON.parse(localStorage.getItem('demo_db') || 'null');
  if (db) return db;
  const seeded: DemoDB = {
    products: [
      {
        id: 1,
        name: 'Fleur Premium',
        category_name: 'Indica',
        farm: 'RS Farm',
        description: 'Arômes intenses, qualité supérieure.',
        image_url: '',
        prices: [
          { weight: '1g', price: 10 },
          { weight: '3.5g', price: 30 }
        ]
      }
    ],
    categories: [
      { id: 1, name: 'Indica' },
      { id: 2, name: 'Sativa' },
      { id: 3, name: 'Hybride' }
    ],
    settings: { welcome_message: "Bienvenue sur l'app RSLiv", telegram_contact: '@rsliv_contact' }
  };
  localStorage.setItem('demo_db', JSON.stringify(seeded));
  return seeded;
}

function demoSave(db: DemoDB) {
  localStorage.setItem('demo_db', JSON.stringify(db));
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Helper function to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  if (DEMO_MODE) {
    // Demo router
    const db = demoLoad();
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : undefined;

    // Auth verify
    if (url === '/auth/verify') {
      const token = getAuthToken();
      if (token === 'DEMO_TOKEN') return { valid: true, username: 'admin' };
      throw new Error('Token invalide');
    }

    // Settings
    if (url === '/settings') {
      if (method === 'GET') return db.settings;
      if (method === 'PUT') {
        db.settings = { ...db.settings, ...body };
        demoSave(db);
        return { success: true };
      }
    }

    // Categories
    if (url === '/categories') {
      if (method === 'GET') return db.categories;
      if (method === 'POST') {
        const nextId = (db.categories.at(-1)?.id || 0) + 1;
        const newCat = { id: nextId, name: body.name } as DemoCategory;
        db.categories.push(newCat);
        demoSave(db);
        return newCat;
      }
    }

    // Products
    if (url.startsWith('/products')) {
      if (method === 'GET' && url === '/products') return db.products;
      if (method === 'DELETE') {
        const id = Number(url.split('/')[2]);
        db.products = db.products.filter(p => p.id !== id);
        demoSave(db);
        return { success: true };
      }
    }

    // Fallback
    return { success: true };
  }

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
    if (DEMO_MODE) {
      // Accept demo credentials only
      if (username.trim() === 'admin' && password === 'Admin123!') {
        localStorage.setItem('auth_token', 'DEMO_TOKEN');
        return { token: 'DEMO_TOKEN', username: 'admin' };
      }
      throw new Error('Identifiants incorrects');
    }

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
    if (DEMO_MODE) {
      const db = demoLoad();
      const nextId = (db.products.at(-1)?.id || 0) + 1;
      const name = formData.get('name') as string;
      const variety = (formData.get('variety') as string) || '';
      const farm = (formData.get('farm') as string) || '';
      const description = (formData.get('description') as string) || '';
      const prices = JSON.parse((formData.get('prices') as string) || '[]');
      const newP = {
        id: nextId,
        name,
        category_name: variety,
        farm,
        description,
        image_url: '',
        video_url: '',
        prices,
      } as DemoProduct;
      db.products.push(newP);
      demoSave(db);
      return newP;
    }

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
    if (DEMO_MODE) {
      const db = demoLoad();
      const idx = db.products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Produit introuvable');
      const name = (formData.get('name') as string) ?? db.products[idx].name;
      const variety = (formData.get('variety') as string) ?? db.products[idx].category_name;
      const farm = (formData.get('farm') as string) ?? db.products[idx].farm;
      const description = (formData.get('description') as string) ?? db.products[idx].description;
      const prices = JSON.parse((formData.get('prices') as string) || JSON.stringify(db.products[idx].prices));
      db.products[idx] = { ...db.products[idx], name, category_name: variety, farm, description, prices };
      demoSave(db);
      return db.products[idx];
    }

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
