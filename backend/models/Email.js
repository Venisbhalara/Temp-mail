const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

/**
 * Email — stores individual messages tied to an inbox via inboxId (UUID).
 * Compound index on (inboxId, createdAt) for fast sorted inbox queries.
 */
const Email = sequelize.define('Email', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  inboxId: {
    type: DataTypes.STRING(36),   // references Inbox.inboxId (UUID)
    allowNull: false,
  },
  messageId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  from: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  fromName: {
    type: DataTypes.STRING(150),
    defaultValue: '',
  },
  to: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(500),
    defaultValue: '(No Subject)',
  },
  bodyText: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  bodyHtml: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  otpCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  size: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
  },
}, {
  tableName: 'emails',
  timestamps: true,
  indexes: [
    { fields: ['inboxId'] },
    { fields: ['inboxId', 'createdAt'] },
  ],
});

module.exports = Email;
