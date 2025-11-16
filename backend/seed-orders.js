const { runQueryExecute } = require('./database');

const seedOrders = async () => {
  const sampleOrders = []

  // Create 30 TWAP orders for series_001 (100 USDC total, split into 30 parts)
  const totalAmount = 100
  const amountPerOrder = totalAmount / 30
  const buyAmountPerOrder = amountPerOrder * 0.00029 // Convert to ETH

  for (let day = 1; day <= 30; day++) {
    let status = 'PENDING'
    let time_condition_met = 0
    let price_condition_met = 0
    let can_execute = 0
    let last_execution_time = 0
    let next_execution_time = 0
    let execution_count = 0
    let total_executed_amount = 0.0
    let executed_at = null

    if (day <= 4) {
      status = 'FILLED'
      time_condition_met = 1
      price_condition_met = 1
      can_execute = 1
      last_execution_time = Math.floor(Date.now() / 1000)
      execution_count = 1
      total_executed_amount = amountPerOrder
      executed_at = new Date().toISOString()
    } else if (day === 5) {
      status = 'ACTIVE'
      time_condition_met = 1
      price_condition_met = 0
      can_execute = 0
      next_execution_time = Math.floor(Date.now() / 1000) + 3600
    } else {
      status = 'PENDING'
      time_condition_met = 0
      price_condition_met = 0
      can_execute = 0
      next_execution_time = Math.floor(Date.now() / 1000) + (day * 3600)
    }

    sampleOrders.push({
      user_address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      order_type: 'TWAP',
      strategy: 'Dollar Cost Average (TWAP)',
      sell_amount: amountPerOrder,
      sell_currency: 'USDC',
      buy_amount_estimated: buyAmountPerOrder,
      buy_currency: 'ETH',
      max_price: null,
      schedule_day: day,
      status: status,
      series_id: 'series_001',
      time_condition_met: time_condition_met,
      price_condition_met: price_condition_met,
      can_execute: can_execute,
      last_execution_time: last_execution_time,
      next_execution_time: next_execution_time,
      execution_count: execution_count,
      total_executed_amount: total_executed_amount,
      executed_at: executed_at
    })
  }

  // Create 30 TWAP orders for series_002 (50 USDC total, split into 30 parts)
  const totalAmount2 = 50
  const amountPerOrder2 = totalAmount2 / 30
  const buyAmountPerOrder2 = amountPerOrder2 * 0.00029

  for (let day = 1; day <= 30; day++) {
    let status = 'PENDING'
    let time_condition_met = 0
    let price_condition_met = 0
    let can_execute = 0
    let last_execution_time = 0
    let next_execution_time = 0
    let execution_count = 0
    let total_executed_amount = 0.0
    let executed_at = null

    if (day <= 2) {
      status = 'FILLED'
      time_condition_met = 1
      price_condition_met = 1
      can_execute = 1
      last_execution_time = Math.floor(Date.now() / 1000)
      execution_count = 1
      total_executed_amount = amountPerOrder2
      executed_at = new Date().toISOString()
    } else {
      status = 'PENDING'
      time_condition_met = 0
      price_condition_met = 0
      can_execute = 0
      next_execution_time = Math.floor(Date.now() / 1000) + (day * 7200)
    }

    sampleOrders.push({
      user_address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      order_type: 'TWAP',
      strategy: 'Dollar Cost Average (TWAP)',
      sell_amount: amountPerOrder2,
      sell_currency: 'USDC',
      buy_amount_estimated: buyAmountPerOrder2,
      buy_currency: 'ETH',
      max_price: null,
      schedule_day: day,
      status: status,
      series_id: 'series_002',
      time_condition_met: time_condition_met,
      price_condition_met: price_condition_met,
      can_execute: can_execute,
      last_execution_time: last_execution_time,
      next_execution_time: next_execution_time,
      execution_count: execution_count,
      total_executed_amount: total_executed_amount,
      executed_at: executed_at
    })
  }

  // Add a few non-TWAP orders for variety
  sampleOrders.push(
    {
      user_address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      order_type: 'MARKET',
      strategy: 'Market Buy',
      sell_amount: 25.00,
      sell_currency: 'USDC',
      buy_amount_estimated: 0.007,
      buy_currency: 'ETH',
      max_price: null,
      schedule_day: null,
      status: 'FILLED',
      series_id: 'market_001',
      time_condition_met: 1,
      price_condition_met: 1,
      can_execute: 1,
      last_execution_time: Math.floor(Date.now() / 1000),
      next_execution_time: 0,
      execution_count: 1,
      total_executed_amount: 25.00,
      executed_at: new Date().toISOString()
    },
    {
      user_address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      order_type: 'LIMIT',
      strategy: 'Limit Order',
      sell_amount: 15.00,
      sell_currency: 'USDC',
      buy_amount_estimated: 0.004,
      buy_currency: 'ETH',
      max_price: 3500.00,
      schedule_day: null,
      status: 'PENDING',
      series_id: 'limit_001',
      time_condition_met: 0,
      price_condition_met: 0,
      can_execute: 0,
      last_execution_time: 0,
      next_execution_time: 0,
      execution_count: 0,
      total_executed_amount: 0.0
    }
  )

  try {
    // Clear existing orders first
    await runQueryExecute('DELETE FROM orders');
    console.log('🗑️  Cleared existing orders');
    
    for (const order of sampleOrders) {
      const sql = `
        INSERT INTO orders (
          user_address, order_type, strategy, sell_amount, sell_currency,
          buy_amount_estimated, buy_currency, max_price, schedule_day, status,
          series_id, time_condition_met, price_condition_met, can_execute,
          last_execution_time, next_execution_time, execution_count,
          total_executed_amount, executed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        order.user_address, order.order_type, order.strategy, order.sell_amount,
        order.sell_currency, order.buy_amount_estimated, order.buy_currency,
        order.max_price, order.schedule_day, order.status, order.series_id,
        order.time_condition_met, order.price_condition_met, order.can_execute,
        order.last_execution_time, order.next_execution_time, order.execution_count,
        order.total_executed_amount, order.executed_at
      ];

      await runQueryExecute(sql, params);
    }
    
    console.log(`✅ ${sampleOrders.length} sample orders seeded successfully!`);
    console.log('📊 Created:');
    console.log(`   - 30 TWAP orders for series_001 (100 USDC total)`);
    console.log(`   - 30 TWAP orders for series_002 (50 USDC total)`);
    console.log(`   - 1 Market order (25 USDC)`);
    console.log(`   - 1 Limit order (15 USDC)`);
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedOrders();
}

module.exports = { seedOrders }; 