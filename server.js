const app = require('./app');
require('dotenv').config();
const { sequelize, testConnection } = require('./src/config/database');

// Cargar modelos
const CommandModel = require('./src/models/command');
const ActivityLogModel = require('./src/models/activityLog');
CommandModel(sequelize);
ActivityLogModel(sequelize);

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await testConnection();
    const alter = String(process.env.DB_SYNC_ALTER || 'false').trim().toLowerCase() === 'true';
    await sequelize.sync({ alter });
    console.log(`🔄 Tablas sincronizadas (alter=${alter})`);

    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar:', err);
    process.exit(1);
  }
})();