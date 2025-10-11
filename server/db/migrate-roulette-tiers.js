import { getDb } from './connection.js';

async function migrateRouletteTiers() {
  try {
    console.log('🎰 Migration des tiers de roulette...');
    
    const db = await getDb();
    
    // Check if tier column exists
    const tableInfo = await db.all('PRAGMA table_info(roulette_prizes)');
    const hasTierColumn = tableInfo.some(col => col.name === 'tier');
    
    if (!hasTierColumn) {
      console.log('📋 Ajout de la colonne tier...');
      await db.exec('ALTER TABLE roulette_prizes ADD COLUMN tier TEXT');
    }
    
    // Clear existing prizes (we'll recreate the 4 fixed tiers)
    console.log('🗑️ Nettoyage des anciens lots...');
    await db.exec('DELETE FROM roulette_prizes');
    
    // Insert 4 fixed tiers
    console.log('✅ Insertion des 4 niveaux fixes...');
    
    await db.run(
      'INSERT INTO roulette_prizes (name, probability, color, tier) VALUES (?, ?, ?, ?)',
      ['🏆 Jackpot', 5, '#f59e0b', 'jackpot']
    );
    
    await db.run(
      'INSERT INTO roulette_prizes (name, probability, color, tier) VALUES (?, ?, ?, ?)',
      ['🎁 Lot rare', 10, '#8b5cf6', 'rare']
    );
    
    await db.run(
      'INSERT INTO roulette_prizes (name, probability, color, tier) VALUES (?, ?, ?, ?)',
      ['🎉 Lot commun', 35, '#10b981', 'commun']
    );
    
    await db.run(
      'INSERT INTO roulette_prizes (name, probability, color, tier) VALUES (?, ?, ?, ?)',
      ['🎯 Lot standard', 50, '#3b82f6', 'standard']
    );
    
    console.log('✅ Migration terminée avec succès!');
    console.log('📊 4 niveaux créés:');
    console.log('   - 🏆 Jackpot (5%)');
    console.log('   - 🎁 Rare (10%)');
    console.log('   - 🎉 Commun (35%)');
    console.log('   - 🎯 Standard (50%)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrateRouletteTiers();
