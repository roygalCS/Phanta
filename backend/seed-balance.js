const { runQueryExecute } = require('./database');

const seedBalance = async () => {
  try {
    // Update portfolio balances for existing users
    const updateQueries = [
      {
        sql: `UPDATE portfolios SET balance_usd = 150.00, balance_tokens = 1000.00 WHERE portfolio_tag = 'growth-fund-x'`,
        description: 'Updated balance for portfolio growth-fund-x'
      },
      {
        sql: `UPDATE portfolios SET balance_usd = 75.50, balance_tokens = 500.00 WHERE portfolio_tag = 'founders-treasury'`,
        description: 'Updated balance for portfolio founders-treasury'
      },
      {
        sql: `UPDATE portfolios SET balance_usd = 200.00, balance_tokens = 1500.00 WHERE portfolio_tag = 'family-office-alpha'`,
        description: 'Updated balance for portfolio family-office-alpha'
      }
    ];

    for (const query of updateQueries) {
      await runQueryExecute(query.sql);
      console.log(`✅ ${query.description}`);
    }

    console.log('✅ Portfolio balances seeded successfully!');
    console.log('📊 Updated balances:');
    console.log('   - growth-fund-x: $150.00 USD, 1000.00 tokens');
    console.log('   - founders-treasury: $75.50 USD, 500.00 tokens');
    console.log('   - family-office-alpha: $200.00 USD, 1500.00 tokens');
  } catch (error) {
    console.error('❌ Error seeding balances:', error);
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedBalance();
}

module.exports = { seedBalance }; 
