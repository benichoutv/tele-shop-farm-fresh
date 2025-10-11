import { getDb } from './connection.js';

async function migrateRoulette() {
  try {
    console.log('🎰 Début de la migration roulette...');
    
    const db = await getDb();
    
    // Create roulette_settings table
    console.log('📋 Création de la table roulette_settings...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS roulette_settings (
        id INTEGER PRIMARY KEY,
        active INTEGER DEFAULT 0,
        max_spins_per_user INTEGER DEFAULT 1,
        require_code INTEGER DEFAULT 1
      )
    `);
    
    // Insert default settings if not exists
    const existingSettings = await db.get('SELECT * FROM roulette_settings WHERE id = 1');
    if (!existingSettings) {
      console.log('✅ Insertion des paramètres par défaut...');
      await db.run(
        'INSERT INTO roulette_settings (id, active, max_spins_per_user, require_code) VALUES (1, 0, 1, 1)'
      );
    }
    
    // Create roulette_prizes table
    console.log('📋 Création de la table roulette_prizes...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS roulette_prizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        probability REAL DEFAULT 1.0,
        color TEXT DEFAULT '#3b82f6'
      )
    `);
    
    // No default prizes inserted - admin will add custom prizes via the dashboard
    console.log('ℹ️ Table roulette_prizes créée (vide par défaut)');
    
    // Create roulette_codes table
    console.log('📋 Création de la table roulette_codes...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS roulette_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        used INTEGER DEFAULT 0,
        used_by TEXT,
        used_at TEXT,
        created_at TEXT
      )
    `);
    
    // Create roulette_spins table
    console.log('📋 Création de la table roulette_spins...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS roulette_spins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT NOT NULL,
        username TEXT,
        prize_id INTEGER,
        prize_name TEXT,
        code TEXT,
        spin_date TEXT
      )
    `);
    
    console.log('✅ Migration roulette terminée avec succès!');
    console.log('📊 Tables créées:');
    console.log('   - roulette_settings');
    console.log('   - roulette_prizes (avec 4 lots par défaut)');
    console.log('   - roulette_codes');
    console.log('   - roulette_spins');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrateRoulette();
