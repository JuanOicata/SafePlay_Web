const app = require('./app');
require('dotenv').config();
const { sequelize, testConnection } = require('./src/config/database');
require('./src/models');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    console.log('🔄 Tablas sincronizadas');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar:', err);
    process.exit(1);
  }
})();
