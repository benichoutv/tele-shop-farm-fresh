import bcrypt from 'bcrypt';
import { getDb } from './connection.js';

export async function initDatabase() {
  const db = await getDb();
  
  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      variety TEXT,
      category_id INTEGER,
      farm TEXT,
      description TEXT,
      image_url TEXT,
      video_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS product_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      weight TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      telegram_username TEXT,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      weight TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roulette_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      is_active BOOLEAN DEFAULT FALSE,
      CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS roulette_prizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT,
      probability INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roulette_spins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      prize_id INTEGER REFERENCES roulette_prizes(id),
      telegram_username TEXT NOT NULL,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default settings if not exists
    INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('welcome_message', 'Bienvenue sur l''app RSLiv'),
      ('telegram_contact', '@rsliv_contact'),
      ('contact_link', ''),
      ('facebook_url', ''),
      ('instagram_url', ''),
      ('tiktok_url', '');

    -- Initialiser la configuration de la roulette par défaut
    INSERT OR IGNORE INTO roulette_settings (id, is_active) VALUES (1, FALSE);

    -- Lots par défaut (exemples)
    INSERT OR IGNORE INTO roulette_prizes (id, name, type, value, probability) VALUES
      (1, '5% de réduction', 'discount', '5', 50),
      (2, '10% de réduction', 'discount', '10', 30),
      (3, 'Produit offert', 'free_product', '', 15),
      (4, '20% de réduction', 'discount', '20', 5);

  `);
  // Ensure default admin user exists with a valid bcrypt hash
  const admin = await db.get('SELECT id, password_hash FROM admin_users WHERE username = ?', ['admin']);
  if (!admin) {
    const hash = await bcrypt.hash('Admin123!', 10);
    await db.run('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)', ['admin', hash]);
    console.log('Seeded default admin user with password: Admin123!');
  } else if (typeof admin.password_hash !== 'string' || admin.password_hash.length !== 60 || !admin.password_hash.startsWith('$2')) {
    const hash = await bcrypt.hash('Admin123!', 10);
    await db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, admin.id]);
    console.log('Fixed invalid admin password hash.');
  }

  console.log('Database initialized successfully');
}
