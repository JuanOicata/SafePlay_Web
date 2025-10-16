const app = require('./app');
require('dotenv').config();
const { sequelize, testConnection } = require('./src/config/database');
require('./src/models'); // registra modelos

const electronRoutes = require('./src/routes/electron');
app.use('/api/electron', electronRoutes);

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await testConnection();

    // Controla el alter por variable de entorno (por defecto: false)
    const alter =
      String(process.env.DB_SYNC_ALTER || 'false').trim().toLowerCase() === 'true';

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
