const db = require('../config/db');

async function createTable() {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS codigos_recuperacion (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      codigo VARCHAR(32) NOT NULL,
      expiracion DATETIME NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('Tabla codigos_recuperacion creada o ya existente.');
    process.exit(0);
  } catch (err) {
    console.error('Error creando la tabla codigos_recuperacion:', err);
    process.exit(1);
  }
}

createTable();
