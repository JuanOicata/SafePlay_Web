const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supervisor = sequelize.define('Supervisor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(120), allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING(120), allowNull: false },
  fullName: { type: DataTypes.STRING(120), allowNull: false },
  phone: { type: DataTypes.STRING(30) },
  acceptedTermsAt: { type: DataTypes.DATE },
  emailVerified:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  verifyTokenHash: { type: DataTypes.STRING(128), allowNull: true },
  verifyExpires:   { type: DataTypes.DATE, allowNull: true }
  
  
}, {
  tableName: 'supervisors',
  timestamps: true
});

module.exports = Supervisor;
