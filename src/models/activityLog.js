// src/models/ActivityLog.js
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
            allowNull: false,
            field: 'user_id'
        },
        gameName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'game_name'
        },
        action: {
            type: DataTypes.ENUM(
                'started',
                'closed',
                'blocked',
                'timer_set'
            ),
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        details: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        }
    }, {
        tableName: 'activity_logs',
        timestamps: true,
        underscored: true
    });

    return ActivityLog;
};