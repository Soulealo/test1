const bcrypt = require('bcrypt');
const { pool } = require('./db');

async function ensureTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fullname VARCHAR(150) NOT NULL,
            email VARCHAR(180) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(180) NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(12, 2) NOT NULL,
            category VARCHAR(80) NOT NULL,
            details TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS product_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    `);
}

async function ensureDefaultAdmin() {
    const email = String(process.env.DEFAULT_ADMIN_EMAIL || 'admin@unahome.mn').trim().toLowerCase();
    const password = String(process.env.DEFAULT_ADMIN_PASSWORD || '1234');
    const fullname = String(process.env.DEFAULT_ADMIN_FULLNAME || 'UNA Admin').trim();
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);

    if (rows.length > 0) return;

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
        'INSERT INTO users (fullname, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [fullname, email, passwordHash, 'admin']
    );
}

module.exports = {
    ensureTables,
    ensureDefaultAdmin
};
