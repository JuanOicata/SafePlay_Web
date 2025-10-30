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