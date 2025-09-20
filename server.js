const app = require('./app');
require('dotenv').config();
const { sequelize, testConnection } = require('./src/config/database');
require('./src/models'); // registra modelos

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    console.log('🔄 Tablas sincronizadas');

    const server = app.listen(PORT, () => {
      console.log('🚀 Servidor iniciado');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('📅 Fecha:', new Date().toLocaleString());
    });

    const shutdown = (signal) => {
      console.log(`🛑 ${signal} recibido`);
      server.close(async () => {
        try { await sequelize.close(); } catch {}
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (e) {
    console.error('❌ No se pudo iniciar:', e.message);
    process.exit(1);
  }
}

bootstrap();
