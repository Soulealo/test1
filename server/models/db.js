const mysql = require('mysql2/promise');

const database = String(process.env.DB_NAME || 'una_home').replace(/[^a-zA-Z0-9_]/g, '') || 'una_home';

const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10
};

const pool = mysql.createPool({
    ...baseConfig,
    database
});

async function ensureDatabase() {
    const connection = await mysql.createConnection(baseConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
}

module.exports = {
    pool,
    ensureDatabase,
    database
};
