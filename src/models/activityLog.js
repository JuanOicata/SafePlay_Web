// models/ActivityLog.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        appName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        usageTime: {
            type: DataTypes.INTEGER, // segundos
            defaultValue: 0
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });
    return ActivityLog;
};