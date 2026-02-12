const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'identity-db',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'identity_service_db',
  username: process.env.DB_USER || 'identity_user',
  password: process.env.DB_PASSWORD || 'identity_password',
  dialectOptions: {
    multipleStatements: true,
  },
  logging: false, // set to console.log to see SQL queries
});

module.exports = sequelize;