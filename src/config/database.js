const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl) {
  console.error('❌ DATABASE_URL no está definida.');
  throw new Error('DATABASE_URL is missing');
}

const mustUseSSL =
  /render\.com/i.test(dbUrl) ||
  dbUrl.includes('sslmode=require') ||
  process.env.FORCE_DB_SSL === 'true';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: mustUseSSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

async function testConnection() {
  await sequelize.authenticate();
  console.log('✅ Conexión a PostgreSQL OK');
}

module.exports = { sequelize, testConnection };
