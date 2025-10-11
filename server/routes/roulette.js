import express from 'express';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Helper: Ensure roulette_settings table and columns exist
async function ensureSettingsSchema(db) {
  try {
    // Create table if not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS roulette_settings (
        id INTEGER PRIMARY KEY,
        active INTEGER DEFAULT 0,
        max_spins_per_user INTEGER DEFAULT 1,
        require_code INTEGER DEFAULT 1
      )
    `);

    // Get existing columns
    let columns = [];
    try {
      const columnInfo = await db.all('PRAGMA table_info(roulette_settings)');
      columns = columnInfo.map(col => col.name);
    } catch (e) {
      // Fallback for PostgreSQL
      const columnInfo = await db.all(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='roulette_settings'
      `);
      columns = columnInfo.map(col => col.column_name);
    }

    // Add missing columns
    const requiredColumns = {
      active: 'INTEGER DEFAULT 0',
      max_spins_per_user: 'INTEGER DEFAULT 1',
      require_code: 'INTEGER DEFAULT 1'
    };

    for (const [colName, colType] of Object.entries(requiredColumns)) {
      if (!columns.includes(colName)) {
        try {
          await db.exec(`ALTER TABLE roulette_settings ADD COLUMN ${colName} ${colType}`);
          console.log(`✅ Colonne ${colName} ajoutée`);
        } catch (err) {
          // Ignore if column already exists
          if (!err.message.includes('duplicate column')) {
            console.warn(`⚠️ Impossible d'ajouter ${colName}:`, err.message);
          }
        }
      }
    }

    // Ensure row id=1 exists
    const existing = await db.get('SELECT id FROM roulette_settings WHERE id = 1');
    if (!existing) {
      await db.run(
        'INSERT INTO roulette_settings (id, active, max_spins_per_user, require_code) VALUES (1, 0, 1, 1)'
      );
      console.log('✅ Ligne settings id=1 créée');
    }

    return { success: true, columns };
  } catch (error) {
    console.error('❌ Erreur ensureSettingsSchema:', error);
    throw error;
  }
}

// Get roulette settings (public)
router.get('/settings', async (req, res) => {
  try {
    console.log('📖 GET /settings appelé');
    const db = await getDb();
    
    // Auto-repair schema
    await ensureSettingsSchema(db);

    const settings = await db.get('SELECT * FROM roulette_settings WHERE id = 1');
    
    if (!settings) {
      console.log('⚠️ Aucun settings trouvé, retour des défauts');
      return res.json({ 
        active: false,
        max_spins_per_user: 1,
        require_code: true 
      });
    }
    
    console.log('✅ Settings trouvés:', settings);
    // Normalize response (handle old column names if any)
    res.json({ 
      active: Boolean(settings.active ?? 0),
      max_spins_per_user: Number(settings.max_spins_per_user ?? 1),
      require_code: true
    });
  } catch (error) {
    console.error('❌ Error fetching roulette settings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all prizes (public) - ordered by probability DESC
router.get('/prizes', async (req, res) => {
  try {
    const db = await getDb();
    const prizes = await db.all('SELECT * FROM roulette_prizes ORDER BY probability ASC');
    res.json(prizes);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Verify code (public)
router.post('/verify-code', async (req, res) => {
  try {
    const { code, telegram_id } = req.body;
    
    if (!code || !telegram_id) {
      return res.status(400).json({ error: 'Code et Telegram ID requis' });
    }

    const db = await getDb();
    
    // Check if code exists and is not used
    const codeEntry = await db.get(
      'SELECT * FROM roulette_codes WHERE code = ? AND used = 0',
      [code]
    );
    
    if (!codeEntry) {
      return res.status(404).json({ error: 'Code invalide ou déjà utilisé' });
    }
    
    // Check if user already spun with this code
    const existingSpin = await db.get(
      'SELECT * FROM roulette_spins WHERE telegram_id = ? AND code = ?',
      [telegram_id, code]
    );
    
    if (existingSpin) {
      return res.status(400).json({ error: 'Code déjà utilisé par cet utilisateur' });
    }
    
    res.json({ valid: true, code: codeEntry.code });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Spin the wheel (public)
router.post('/spin', async (req, res) => {
  try {
    const { telegram_id, username, code } = req.body;
    
    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID requis' });
    }

    const db = await getDb();
    
    // Get settings
    const settings = await db.get('SELECT * FROM roulette_settings WHERE id = 1');
    
    if (!settings || !settings.active) {
      return res.status(403).json({ error: 'Roulette désactivée' });
    }
    
    // If code required, verify it
    if (settings.require_code) {
      if (!code) {
        return res.status(400).json({ error: 'Code requis' });
      }
      
      const codeEntry = await db.get(
        'SELECT * FROM roulette_codes WHERE code = ? AND used = 0',
        [code]
      );
      
      if (!codeEntry) {
        return res.status(404).json({ error: 'Code invalide ou déjà utilisé' });
      }
    }
    
    // Check user spin count
    const spinCount = await db.get(
      'SELECT COUNT(*) as count FROM roulette_spins WHERE telegram_id = ?',
      [telegram_id]
    );
    
    if (spinCount.count >= settings.max_spins_per_user) {
      return res.status(403).json({ error: 'Limite de tours atteinte' });
    }
    
    // Get all prizes with probabilities
    const prizes = await db.all('SELECT * FROM roulette_prizes ORDER BY probability DESC');
    
    if (prizes.length === 0) {
      return res.status(500).json({ error: 'Aucun lot configuré' });
    }
    
    // Select a prize based on probabilities
    const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);
    let random = Math.random() * totalProbability;
    let selectedPrize = prizes[prizes.length - 1]; // Default to last prize
    
    for (const prize of prizes) {
      random -= prize.probability;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }
    
    // Record the spin
    await db.run(
      'INSERT INTO roulette_spins (telegram_id, username, prize_id, prize_name, code, spin_date) VALUES (?, ?, ?, ?, ?, datetime("now"))',
      [telegram_id, username || 'Anonyme', selectedPrize.id, selectedPrize.name, code || null]
    );
    
    // Mark code as used if provided
    if (code) {
      await db.run(
        'UPDATE roulette_codes SET used = 1, used_by = ?, used_at = datetime("now") WHERE code = ?',
        [telegram_id, code]
      );
    }
    
    res.json({
      prize: {
        id: selectedPrize.id,
        name: selectedPrize.name,
        color: selectedPrize.color
      }
    });
  } catch (error) {
    console.error('Error spinning wheel:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== ADMIN ENDPOINTS (protected) =====

// Update roulette settings
router.put('/admin/settings', authMiddleware, async (req, res) => {
  try {
    console.log('📝 PUT /admin/settings appelé');
    console.log('Body reçu:', req.body);
    const { active, max_spins_per_user } = req.body;
    
    const db = await getDb();
    
    // Auto-repair schema before update
    await ensureSettingsSchema(db);

    // Update settings
    await db.run(
      'UPDATE roulette_settings SET active = ?, max_spins_per_user = ?, require_code = 1 WHERE id = 1',
      [active ? 1 : 0, (typeof max_spins_per_user === 'number' ? max_spins_per_user : 1)]
    );
    
    console.log('✅ Settings mis à jour');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Get all prizes (admin) - ordered by tier
router.get('/admin/prizes', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const prizes = await db.all(`
      SELECT * FROM roulette_prizes 
      ORDER BY 
        CASE tier 
          WHEN 'jackpot' THEN 1
          WHEN 'rare' THEN 2
          WHEN 'commun' THEN 3
          WHEN 'standard' THEN 4
        END
    `);
    res.json(prizes);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create prize
router.post('/admin/prizes', authMiddleware, async (req, res) => {
  try {
    const { name, probability, color } = req.body;
    
    if (!name || probability === undefined) {
      return res.status(400).json({ error: 'Nom et probabilité requis' });
    }
    
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO roulette_prizes (name, probability, color) VALUES (?, ?, ?)',
      [name, probability, color || '#3b82f6']
    );
    
    res.json({ id: result.lastID, name, probability, color });
  } catch (error) {
    console.error('Error creating prize:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update prize (name and color only, tier and probability are fixed)
router.put('/admin/prizes/:id', authMiddleware, async (req, res) => {
  try {
    console.log(`📝 PUT /admin/prizes/${req.params.id} appelé`);
    const { id } = req.params;
    const { name, color } = req.body;
    console.log('Body:', { name, color });
    
    if (!name) {
      return res.status(400).json({ error: 'Nom requis' });
    }
    
    const db = await getDb();
    await db.run(
      'UPDATE roulette_prizes SET name = ?, color = ? WHERE id = ?',
      [name, color || '#3b82f6', id]
    );
    
    console.log('✅ Prize mis à jour');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating prize:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete prize
router.delete('/admin/prizes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDb();
    await db.run('DELETE FROM roulette_prizes WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prize:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Generate codes
router.post('/admin/codes/generate', authMiddleware, async (req, res) => {
  try {
    console.log('🎟️ POST /admin/codes/generate appelé');
    const { count } = req.body;
    console.log('Count demandé:', count);
    
    if (!count || count < 1 || count > 100) {
      return res.status(400).json({ error: 'Le nombre doit être entre 1 et 100' });
    }
    
    const db = await getDb();
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      const code = generateCode();
      await db.run(
        'INSERT INTO roulette_codes (code, created_at) VALUES (?, datetime("now"))',
        [code]
      );
      codes.push(code);
    }
    
    console.log(`✅ ${codes.length} codes générés`);
    res.json({ codes });
  } catch (error) {
    console.error('❌ Error generating codes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all codes
router.get('/admin/codes', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const codes = await db.all('SELECT * FROM roulette_codes ORDER BY created_at DESC LIMIT 100');
    res.json(codes);
  } catch (error) {
    console.error('Error fetching codes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all spins
router.get('/admin/spins', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const spins = await db.all('SELECT * FROM roulette_spins ORDER BY spin_date DESC LIMIT 100');
    res.json(spins);
  } catch (error) {
    console.error('Error fetching spins:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Diagnostic endpoint (admin)
router.get('/admin/diag', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    
    // Get columns
    let columns = [];
    try {
      const columnInfo = await db.all('PRAGMA table_info(roulette_settings)');
      columns = columnInfo.map(col => ({ name: col.name, type: col.type }));
    } catch (e) {
      const columnInfo = await db.all(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name='roulette_settings'
      `);
      columns = columnInfo.map(col => ({ name: col.column_name, type: col.data_type }));
    }
    
    // Get settings row
    const settings = await db.get('SELECT * FROM roulette_settings WHERE id = 1');
    
    // Count records
    const prizesCount = await db.get('SELECT COUNT(*) as count FROM roulette_prizes');
    const codesCount = await db.get('SELECT COUNT(*) as count FROM roulette_codes');
    const spinsCount = await db.get('SELECT COUNT(*) as count FROM roulette_spins');
    
    res.json({
      schema_ok: true,
      columns,
      settings_row: settings,
      counts: {
        prizes: prizesCount?.count || 0,
        codes: codesCount?.count || 0,
        spins: spinsCount?.count || 0
      }
    });
  } catch (error) {
    console.error('Error in diagnostic:', error);
    res.status(500).json({ 
      error: 'Erreur diagnostic',
      details: error.message,
      schema_ok: false
    });
  }
});

// Helper function to generate unique code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans O, I, 0, 1 pour éviter confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default router;
