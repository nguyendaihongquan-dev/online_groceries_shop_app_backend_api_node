const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '27102002',
  database: process.env.DB_NAME || 'groceries',
  port: process.env.DB_PORT || 3306,
  timezone: '+05:30',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  });

module.exports = pool; 