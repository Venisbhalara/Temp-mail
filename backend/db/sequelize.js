const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Sequelize instance — MySQL connection.
 * All models import from this file.
 */
const sequelize = new Sequelize(
  process.env.DB_NAME     || 'tempvault',
  process.env.DB_USER     || 'root',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false,          // set to console.log to see SQL
    pool: {
      max: 10, min: 0,
      acquire: 30000,
      idle:    10000,
    },
  }
);

module.exports = sequelize;
