import express from 'express';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/roulette/status - Récupérer le statut (actif/inactif)
router.get('/status', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.get('SELECT is_active FROM roulette_settings WHERE id = 1');
    res.json({ is_active: settings?.is_active || false });
  } catch (error) {
    console.error('Error fetching roulette status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/roulette/prizes - Récupérer tous les lots
router.get('/prizes', async (req, res) => {
  try {
    const db = await getDb();
    const prizes = await db.all('SELECT * FROM roulette_prizes ORDER BY probability DESC');
    res.json(prizes);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/roulette/spin - Lancer la roue
router.post('/spin', async (req, res) => {
  try {
    const { code, telegram_username } = req.body;
    const db = await getDb();

    // 1. Vérifier que la roulette est active
    const settings = await db.get('SELECT is_active FROM roulette_settings WHERE id = 1');
    if (!settings?.is_active) {
      return res.status(403).json({ error: 'La roulette est actuellement désactivée' });
    }

    // 2. Vérifier que le code existe et n'est pas déjà utilisé
    const existingSpin = await db.get('SELECT * FROM roulette_spins WHERE code = ?', [code]);
    if (existingSpin) {
      return res.status(400).json({ error: 'Ce code a déjà été utilisé' });
    }

    // 3. Tirer un lot selon les probabilités
    const prizes = await db.all('SELECT * FROM roulette_prizes');
    const totalProb = prizes.reduce((sum, p) => sum + p.probability, 0);
    const rand = Math.random() * totalProb;
    
    let cumulative = 0;
    let winningPrize = prizes[0];
    
    for (const prize of prizes) {
      cumulative += prize.probability;
      if (rand <= cumulative) {
        winningPrize = prize;
        break;
      }
    }

    // 4. Enregistrer le tirage
    await db.run(
      'INSERT INTO roulette_spins (code, prize_id, telegram_username) VALUES (?, ?, ?)',
      [code, winningPrize.id, telegram_username]
    );

    // 5. Calculer l'index de la section gagnante (0-7)
    const prizeIndex = calculatePrizeIndex(prizes, winningPrize);

    res.json({ 
      prize: winningPrize,
      sectionIndex: prizeIndex 
    });
  } catch (error) {
    console.error('Error spinning wheel:', error);
    res.status(500).json({ error: 'Erreur lors du tirage' });
  }
});

// Helper: Calculer l'index visuel de la section gagnante
function calculatePrizeIndex(prizes, winningPrize) {
  // Créer un tableau de 8 sections basé sur les probabilités
  const sections = [];
  const sortedPrizes = [...prizes].sort((a, b) => b.probability - a.probability);
  
  sortedPrizes.forEach(prize => {
    const slots = Math.round((prize.probability / 100) * 8);
    for (let i = 0; i < slots; i++) {
      sections.push(prize.id);
    }
  });
  
  // Trouver toutes les positions du lot gagné
  const positions = sections.reduce((acc, id, idx) => {
    if (id === winningPrize.id) acc.push(idx);
    return acc;
  }, []);
  
  // Retourner une position aléatoire parmi les possibles
  return positions[Math.floor(Math.random() * positions.length)] || 0;
}

// === ROUTES ADMIN (protégées) ===

// PUT /api/roulette/settings - Activer/désactiver
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { is_active } = req.body;
    const db = await getDb();
    await db.run('UPDATE roulette_settings SET is_active = ? WHERE id = 1', [is_active]);
    res.json({ message: 'Statut mis à jour', is_active });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/roulette/prizes - Créer un lot
router.post('/prizes', authMiddleware, async (req, res) => {
  try {
    const { name, type, value, probability } = req.body;
    const db = await getDb();
    
    const result = await db.run(
      'INSERT INTO roulette_prizes (name, type, value, probability) VALUES (?, ?, ?, ?)',
      [name, type, value, probability]
    );
    
    res.json({ id: result.lastID, name, type, value, probability });
  } catch (error) {
    console.error('Error creating prize:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/roulette/prizes/:id - Modifier un lot
router.put('/prizes/:id', authMiddleware, async (req, res) => {
  try {
    const { name, type, value, probability } = req.body;
    const db = await getDb();
    
    await db.run(
      'UPDATE roulette_prizes SET name = ?, type = ?, value = ?, probability = ? WHERE id = ?',
      [name, type, value, probability, req.params.id]
    );
    
    res.json({ message: 'Lot mis à jour' });
  } catch (error) {
    console.error('Error updating prize:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/roulette/prizes/:id - Supprimer un lot
router.delete('/prizes/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM roulette_prizes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lot supprimé' });
  } catch (error) {
    console.error('Error deleting prize:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/roulette/codes/generate - Générer des codes
router.post('/codes/generate', authMiddleware, async (req, res) => {
  try {
    const { count } = req.body;
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      codes.push(`RSLIV-${randomNum}`);
    }
    
    res.json({ codes });
  } catch (error) {
    console.error('Error generating codes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/roulette/history - Historique des tirages
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const history = await db.all(`
      SELECT 
        rs.id,
        rs.code,
        rs.telegram_username,
        rp.name as prize_name,
        rs.used_at
      FROM roulette_spins rs
      JOIN roulette_prizes rp ON rs.prize_id = rp.id
      ORDER BY rs.used_at DESC
    `);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
