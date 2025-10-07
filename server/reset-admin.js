import bcrypt from 'bcrypt';
import { getDb } from './db/connection.js';

async function resetAdmin() {
  try {
    console.log('🔄 Réinitialisation du mot de passe admin...');
    
    const db = await getDb();
    const password = 'Admin123!';
    const hash = await bcrypt.hash(password, 10);
    
    // Créer la table si elle n'existe pas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Supprimer l'ancien admin s'il existe
    await db.run('DELETE FROM admin_users WHERE username = ?', ['admin']);
    
    // Créer le nouvel admin
    await db.run(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      ['admin', hash]
    );
    
    console.log('✅ Mot de passe réinitialisé avec succès !');
    console.log('');
    console.log('📝 Identifiants de connexion :');
    console.log('   Username: admin');
    console.log('   Password: Admin123!');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

resetAdmin();
