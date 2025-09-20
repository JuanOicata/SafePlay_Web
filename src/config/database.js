const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || '';

const mustUseSSL =
  process.env.FORCE_DB_SSL === 'true' ||
  /render\.com/i.test(dbUrl) ||
  /renderusercontent\.com/i.test(dbUrl);

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: mustUseSSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

async function testConnection() {
  await sequelize.authenticate();
  console.log('✅ Conexión a PostgreSQL OK');
}

module.exports = { sequelize, testConnection };
