const { sequelize } = require('../config/database');
const Supervisor = require('./Supervisor');

const db = { sequelize, Supervisor };

// future: relaciones aquí (db.Supervisor.associate?.(db);)

module.exports = db;
