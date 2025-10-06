import express from 'express';
import { getDb } from '../db/connection.js';
import { sendOrderNotification } from '../services/telegram.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Create order
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { customer_name, customer_phone, customer_address, telegram_username, items, total } = req.body;
    
    if (!customer_name || !customer_phone || !customer_address || !items || !total) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    // Create order
    const orderResult = await db.run(
      `INSERT INTO orders (customer_name, customer_phone, customer_address, telegram_username, total)
       VALUES (?, ?, ?, ?, ?)`,
      [customer_name, customer_phone, customer_address, telegram_username, total]
    );
    
    const orderId = orderResult.lastID;
    
    // Insert order items
    for (const item of items) {
      await db.run(
        `INSERT INTO order_items (order_id, product_id, product_name, weight, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.weight, item.quantity, item.price]
      );
    }
    
    // Send Telegram notification
    await sendOrderNotification({
      orderId,
      customer_name,
      customer_phone,
      customer_address,
      telegram_username,
      items,
      total
    });
    
    res.status(201).json({ id: orderId, message: 'Commande créée avec succès' });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

// Get all orders (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.all(`
      SELECT o.*,
        (SELECT json_group_array(json_object(
          'id', id,
          'product_name', product_name,
          'weight', weight,
          'quantity', quantity,
          'price', price
        ))
        FROM order_items WHERE order_id = o.id) as items
      FROM orders o
      ORDER BY created_at DESC
    `);
    
    res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items || '[]') })));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    
    await db.run(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

export default router;
