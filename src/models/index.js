const { sequelize } = require('../config/database');
const Supervisor = require('./Supervisor');

const db = { sequelize, Supervisor };
module.exports = db;
