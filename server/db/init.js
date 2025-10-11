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


    -- Insert default settings if not exists
    INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('welcome_message', 'Bienvenue sur l''app RSLiv'),
      ('telegram_contact', '@rsliv_contact'),
      ('contact_link', ''),
      ('facebook_url', ''),
      ('instagram_url', ''),
      ('tiktok_url', '');


  `);

  // ===== Ensure Roulette schema exists (idempotent) =====
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS roulette_settings (
        id INTEGER PRIMARY KEY,
        active INTEGER DEFAULT 0,
        max_spins_per_user INTEGER DEFAULT 1,
        require_code INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS roulette_prizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        probability REAL DEFAULT 1.0,
        color TEXT DEFAULT '#3b82f6'
      );

      CREATE TABLE IF NOT EXISTS roulette_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        used INTEGER DEFAULT 0,
        used_by TEXT,
        used_at TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS roulette_spins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT NOT NULL,
        username TEXT,
        prize_id INTEGER,
        prize_name TEXT,
        code TEXT,
        spin_date TEXT
      );
    `);

    // Ensure default settings row
    const rs = await db.get('SELECT id FROM roulette_settings WHERE id = 1');
    if (!rs) {
      await db.run('INSERT INTO roulette_settings (id, active, max_spins_per_user, require_code) VALUES (1, 0, 1, 1)');
    }

    // Ensure tier column exists
    const info = await db.all('PRAGMA table_info(roulette_prizes)');
    const hasTier = info.some((c) => c.name === 'tier');
    if (!hasTier) {
      await db.exec('ALTER TABLE roulette_prizes ADD COLUMN tier TEXT');
    }

    // Seed the 4 fixed tiers if missing
    const seedTiers = [
      { tier: 'jackpot', name: '🏆 Jackpot', probability: 5, color: '#f59e0b' },
      { tier: 'rare', name: '🎁 Lot rare', probability: 10, color: '#8b5cf6' },
      { tier: 'commun', name: '🎉 Lot commun', probability: 35, color: '#10b981' },
      { tier: 'standard', name: '🎯 Lot standard', probability: 50, color: '#3b82f6' },
    ];

    for (const t of seedTiers) {
      const exists = await db.get('SELECT id FROM roulette_prizes WHERE tier = ?', [t.tier]);
      if (!exists) {
        await db.run(
          'INSERT INTO roulette_prizes (name, probability, color, tier) VALUES (?, ?, ?, ?)',
          [t.name, t.probability, t.color, t.tier]
        );
      }
    }

    console.log('Roulette schema ensured (settings, prizes with tiers, codes, spins).');
  } catch (e) {
    console.error('Failed to ensure roulette schema:', e);
  }

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
