const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'phanta.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          wallet_address TEXT UNIQUE NOT NULL,
          user_type TEXT NOT NULL DEFAULT 'investor',
          portfolio_tag TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Portfolio snapshots table
      db.run(`
        CREATE TABLE IF NOT EXISTS portfolios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portfolio_tag TEXT UNIQUE NOT NULL,
          balance_usd REAL DEFAULT 0.0,
          balance_tokens REAL DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Orders table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_address TEXT NOT NULL,
          order_type TEXT NOT NULL,
          strategy TEXT NOT NULL,
          sell_amount REAL NOT NULL,
          sell_currency TEXT NOT NULL,
          buy_amount_estimated REAL,
          buy_currency TEXT NOT NULL,
          max_price REAL,
          schedule_day INTEGER,
          status TEXT NOT NULL DEFAULT 'PENDING',
          series_id TEXT,
          time_condition_met BOOLEAN DEFAULT 0,
          price_condition_met BOOLEAN DEFAULT 0,
          can_execute BOOLEAN DEFAULT 0,
          last_execution_time INTEGER DEFAULT 0,
          next_execution_time INTEGER DEFAULT 0,
          execution_count INTEGER DEFAULT 0,
          total_executed_amount REAL DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          executed_at DATETIME,
          FOREIGN KEY (user_address) REFERENCES users(wallet_address)
        )
      `);

      // Add new columns to existing users table if they don't exist
      db.run(`ALTER TABLE users ADD COLUMN email TEXT UNIQUE`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding email column:', err);
        }
      });

      db.run(`ALTER TABLE users ADD COLUMN user_type TEXT NOT NULL DEFAULT 'investor'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding user_type column:', err);
        }
      });

      db.run(`ALTER TABLE users ADD COLUMN portfolio_tag TEXT UNIQUE`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding portfolio_tag column:', err);
        }
      });

      // Groups table
      db.run(`
        CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_address TEXT UNIQUE NOT NULL,
          join_code TEXT UNIQUE NOT NULL,
          owner TEXT NOT NULL,
          name TEXT NOT NULL,
          required_deposit REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add join_code column to existing groups table if it doesn't exist
      db.run(`ALTER TABLE groups ADD COLUMN join_code TEXT UNIQUE`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding join_code column:', err);
        } else {
          // Generate join codes for existing groups that don't have one
          db.all(`SELECT id FROM groups WHERE join_code IS NULL`, [], (err, rows) => {
            if (!err && rows) {
              rows.forEach(row => {
                const joinCode = `PHANTA-${row.id.toString().padStart(6, '0')}`;
                db.run(`UPDATE groups SET join_code = ? WHERE id = ?`, [joinCode, row.id]);
              });
            }
          });
        }
      });

      // Group members table
      db.run(`
        CREATE TABLE IF NOT EXISTS group_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL,
          member_address TEXT NOT NULL,
          email TEXT,
          deposit REAL NOT NULL DEFAULT 0,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES groups(id),
          UNIQUE(group_id, member_address)
        )
      `);

      // Database initialized successfully
      console.log('Database initialized successfully');
      resolve();
    });
  });
};

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to run single row queries
const runQuerySingle = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to run insert/update/delete queries
const runQueryExecute = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Function to clear all data from the database
const clearAllData = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('DELETE FROM users', (err) => {
        if (err) {
          console.error('Error clearing users table:', err);
          reject(err);
          return;
        }
        
        db.run('DELETE FROM portfolios', (err) => {
          if (err) {
            console.error('Error clearing portfolios table:', err);
            reject(err);
            return;
          }
          
          console.log('All data cleared from database');
          resolve();
        });
      });
    });
  });
};

module.exports = {
  db,
  initDatabase,
  runQuery,
  runQuerySingle,
  runQueryExecute,
  clearAllData
}; 
