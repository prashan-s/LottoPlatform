const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Outbox = sequelize.define('Outbox', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  eventId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'event_id'
  },
  eventType: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'event_type'
  },
  aggregateId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'aggregate_id'
  },
  payload: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'outbox',
  timestamps: false
});

module.exports = Outbox;
