const express = require('express');
const router = express.Router();
const { runQuery, runQuerySingle, runQueryExecute } = require('../database');

// Get all orders for a user
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { status } = req.query;
    
    let sql = `
      SELECT * FROM orders 
      WHERE user_address = ? 
      ORDER BY created_at DESC
    `;
    let params = [address];
    
    if (status) {
      sql = sql.replace('ORDER BY', 'AND status = ? ORDER BY');
      params.push(status);
    }
    
    const orders = await runQuery(sql, params);
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new order
router.post('/', async (req, res) => {
  try {
    const {
      user_address,
      order_type,
      strategy,
      sell_amount,
      sell_currency,
      buy_amount_estimated,
      buy_currency,
      max_price,
      schedule_day,
      series_id
    } = req.body;

    const sql = `
      INSERT INTO orders (
        user_address, order_type, strategy, sell_amount, sell_currency,
        buy_amount_estimated, buy_currency, max_price, schedule_day, series_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      user_address, order_type, strategy, sell_amount, sell_currency,
      buy_amount_estimated, buy_currency, max_price, schedule_day, series_id
    ];

    const result = await runQueryExecute(sql, params);
    res.json({ success: true, orderId: result.id });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      time_condition_met,
      price_condition_met,
      can_execute,
      last_execution_time,
      next_execution_time,
      execution_count,
      total_executed_amount,
      executed_at
    } = req.body;

    const sql = `
      UPDATE orders SET 
        status = ?,
        time_condition_met = ?,
        price_condition_met = ?,
        can_execute = ?,
        last_execution_time = ?,
        next_execution_time = ?,
        execution_count = ?,
        total_executed_amount = ?,
        executed_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [
      status, time_condition_met, price_condition_met, can_execute,
      last_execution_time, next_execution_time, execution_count,
      total_executed_amount, executed_at, id
    ];

    await runQueryExecute(sql, params);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await runQuerySingle('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQueryExecute('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 