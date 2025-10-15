const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;

// Detecta si debe usar SSL (Render lo necesita)
const mustUseSSL = dbUrl.includes('render.com');

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    idle: 10000
  },
  dialectOptions: mustUseSSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {}
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL OK');
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

module.exports = { sequelize, testConnection };
