const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

/**
 * Inbox — one row per disposable email session.
 * expiresAt is checked by the cron job (no MySQL TTL equivalent).
 */
const Inbox = sequelize.define('Inbox', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  inboxId: {
    type: DataTypes.STRING(36),   // UUID
    allowNull: false,
    unique: true,
  },
  address: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  domain: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  isCustom: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  emailCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'inboxes',
  timestamps: true,   // adds createdAt / updatedAt
  indexes: [
    { fields: ['inboxId'] },
    { fields: ['address'] },
    { fields: ['expiresAt'] },
  ],
});

module.exports = Inbox;
