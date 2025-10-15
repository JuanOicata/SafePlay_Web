// models/Command.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Command = sequelize.define('Command', {
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
        action: {
            type: DataTypes.ENUM(
                'block',      // Bloquear juego inmediatamente
                'unblock',    // Desbloquear juego
                'set_timer',  // Establecer cronómetro
                'get_status'  // Solicitar estado actual
            ),
            allowNull: false
        },
        target: {
            type: DataTypes.STRING(255), // Nombre del juego/app
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER, // Minutos para el timer
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'executed', 'failed'),
            defaultValue: 'pending'
        },
        executedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'executed_at'
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'error_message'
        }
    }, {
        tableName: 'commands',
        timestamps: true, // createdAt, updatedAt
        underscored: true
    });

    return Command;
};