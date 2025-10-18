// src/models/Supervisor.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supervisor = sequelize.define('Supervisor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },

  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },

  // contraseña hasheada con bcrypt
  password: { type: DataTypes.STRING(200), allowNull: false },

  // términos/condiciones aceptados
  acceptedTermsAt: { type: DataTypes.DATE, allowNull: true },

  // verificación de correo
  emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  emailVerifyToken: { type: DataTypes.STRING(120), allowNull: true },
  emailVerifyTokenExpires: { type: DataTypes.DATE, allowNull: true },

  // recuperación de contraseña
  resetPasswordToken: { type: DataTypes.STRING(120), allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'supervisors',
  timestamps: true
});

module.exports = Supervisor;
