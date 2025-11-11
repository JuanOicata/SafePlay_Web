// routes/electron.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { sequelize } = require('../config/database');

// Inicializar modelos (ajusta la ruta según tu estructura)
const CommandModel = require('../models/command');
const ActivityLogModel = require('../models/activityLog');
const Command = CommandModel(sequelize);
const ActivityLog = ActivityLogModel(sequelize);

// ==================== ENDPOINTS PARA ELECTRON ====================

/**
 * GET /api/electron/commands/pending
 * El ejecutable consulta comandos pendientes para ejecutar
 */
router.get('/commands/pending', authenticateToken, async (req, res) => {
    try {
        const commands = await Command.findAll({
            where: {
                userId: req.user.id,
                status: 'pending'
            },
            order: [['createdAt', 'ASC']],
            limit: 50 // Máximo 50 comandos por consulta
        });

        res.json({
            success: true,
            commands: commands.map(c => ({
                id: c.id,
                action: c.action,
                target: c.target,
                duration: c.duration,
                createdAt: c.createdAt
            }))
        });
    } catch (error) {
        console.error('Error obteniendo comandos:', error);
        res.status(500).json({ error: 'Error al obtener comandos' });
    }
});

/**
 * PATCH /api/electron/commands/:id/executed
 * El ejecutable marca un comando como ejecutado
 */
router.patch('/commands/:id/executed', authenticateToken, async (req, res) => {
    try {
        const command = await Command.findByPk(req.params.id);

        if (!command) {
            return res.status(404).json({ error: 'Comando no encontrado' });
        }

        if (command.userId !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        command.status = 'executed';
        command.executedAt = new Date();
        await command.save();

        res.json({ success: true, command });
    } catch (error) {
        console.error('Error marcando comando ejecutado:', error);
        res.status(500).json({ error: 'Error al actualizar comando' });
    }
});

/**
 * PATCH /api/electron/commands/:id/failed
 * El ejecutable marca un comando como fallido
 */
router.patch('/commands/:id/failed', authenticateToken, async (req, res) => {
    try {
        const { errorMessage } = req.body;
        const command = await Command.findByPk(req.params.id);

        if (!command) {
            return res.status(404).json({ error: 'Comando no encontrado' });
        }

        if (command.userId !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        command.status = 'failed';
        command.executedAt = new Date();
        command.errorMessage = errorMessage || 'Error desconocido';
        await command.save();

        res.json({ success: true, command });
    } catch (error) {
        console.error('Error marcando comando fallido:', error);
        res.status(500).json({ error: 'Error al actualizar comando' });
    }
});

/**
 * POST /api/electron/activity
 * El ejecutable envía logs de actividad (juegos iniciados, cerrados, etc)
 */
router.post('/activity', authenticateToken, async (req, res) => {
    try {
        const { gameName, action, duration, details } = req.body;

        if (!gameName || !action) {
            return res.status(400).json({ error: 'gameName y action son requeridos' });
        }

        const log = await ActivityLog.create({
            userId: req.user.id,
            gameName,
            action,
            duration: duration || null,
            details: details || {}
        });

        res.json({ success: true, log });
    } catch (error) {
        console.error('Error registrando actividad:', error);
        res.status(500).json({ error: 'Error al registrar actividad' });
    }
});

/**
 * POST /api/electron/activity/batch
 * El ejecutable envía múltiples logs de una vez (optimización)
 */
router.post('/activity/batch', authenticateToken, async (req, res) => {
    try {
        const { activities } = req.body;

        if (!Array.isArray(activities) || activities.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de activities' });
        }

        const logs = activities.map(a => ({
            userId: req.user.id,
            gameName: a.gameName,
            action: a.action,
            duration: a.duration || null,
            details: a.details || {}
        }));

        await ActivityLog.bulkCreate(logs);

        res.json({ success: true, count: logs.length });
    } catch (error) {
        console.error('Error registrando actividades batch:', error);
        res.status(500).json({ error: 'Error al registrar actividades' });
    }
});

// ==================== ENDPOINTS PARA WEB (SUPERVISOR) ====================

/**
 * POST /api/electron/commands
 * La web crea un comando para que el ejecutable lo ejecute
 */
router.post('/commands', authenticateToken, async (req, res) => {
    try {
        const { action, target, duration } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'action es requerido' });
        }

        const command = await Command.create({
            userId: req.user.id,
            action,
            target: target || null,
            duration: duration || null,
            status: 'pending'
        });

        res.json({ success: true, command });
    } catch (error) {
        console.error('Error creando comando:', error);
        res.status(500).json({ error: 'Error al crear comando' });
    }
});

/**
 * GET /api/electron/activity
 * La web consulta el historial de actividad
 */
router.get('/activity', authenticateToken, async (req, res) => {
    try {
        const { limit = 100, offset = 0, gameName } = req.query;

        const where = { userId: req.user.id };
        if (gameName) {
            where.gameName = gameName;
        }

        const logs = await ActivityLog.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const total = await ActivityLog.count({ where });

        res.json({
            success: true,
            logs,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error obteniendo actividad:', error);
        res.status(500).json({ error: 'Error al obtener actividad' });
    }
});

/**
 * GET /api/electron/commands/history
 * La web consulta historial de comandos ejecutados
 */
router.get('/commands/history', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, status } = req.query;

        const where = { userId: req.user.id };
        if (status) {
            where.status = status;
        }

        const commands = await Command.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json({ success: true, commands });
    } catch (error) {
        console.error('Error obteniendo historial de comandos:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});
/**
 * POST /api/electron/activity/send-email
 * Envía el historial de actividad de las últimas 24 horas al correo del supervisor
 */
router.post('/activity/send-email', authenticateToken, async (req, res) => {
    try {
        const { sendActivityHistoryEmail } = require('../services/email');
        const { Supervisor } = require('../models');

        // Obtener datos del supervisor
        const supervisor = await Supervisor.findByPk(req.user.id);
        if (!supervisor) {
            return res.status(404).json({ error: 'Supervisor no encontrado' });
        }

        // Calcular fecha de hace 24 horas
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // Obtener actividad de las últimas 24 horas
        const { Op } = require('sequelize');
        const activities = await ActivityLog.findAll({
            where: {
                userId: req.user.id,
                createdAt: {
                    [Op.gte]: twentyFourHoursAgo
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 500 // Máximo 500 registros
        });

        // Enviar el email
        await sendActivityHistoryEmail({
            to: supervisor.email,
            fullName: supervisor.fullName,
            activities: activities.map(a => ({
                gameName: a.gameName,
                action: a.action,
                duration: a.duration,
                details: a.details,
                createdAt: a.createdAt
            }))
        });

        res.json({
            success: true,
            message: 'Historial enviado exitosamente',
            count: activities.length
        });
    } catch (error) {
        console.error('Error enviando historial por email:', error);
        res.status(500).json({ error: 'Error al enviar el historial' });
    }
});
module.exports = router;