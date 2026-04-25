const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');

function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET || 'una_home_secret',
        { expiresIn: '7d' }
    );
}

async function register(req, res) {
    try {
        const fullname = String(req.body.fullname || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!fullname || !email || password.length < 6) {
            return res.status(400).json({ message: 'Нэр, и-мэйл, 6-аас дээш тэмдэгттэй нууц үг оруулна уу.' });
        }

        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Энэ и-мэйл хаяг бүртгэлтэй байна.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (fullname, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [fullname, email, passwordHash, 'user']
        );

        const user = {
            id: result.insertId,
            fullname,
            email,
            role: 'user'
        };

        return res.status(201).json({
            message: 'Бүртгэл амжилттай үүслээ.',
            user,
            token: createToken(user)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Бүртгэл үүсгэх үед алдаа гарлаа.' });
    }
}

async function login(req, res) {
    try {
        const loginValue = String(req.body.email || req.body.username || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const defaultAdminEmail = String(process.env.DEFAULT_ADMIN_EMAIL || 'admin@unahome.mn').trim().toLowerCase();
        const email = loginValue === 'admin' ? defaultAdminEmail : loginValue;

        if (!email || !password) {
            return res.status(400).json({ message: 'И-мэйл болон нууц үг оруулна уу.' });
        }

        const [users] = await pool.query(
            'SELECT id, fullname, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'И-мэйл эсвэл нууц үг буруу байна.' });
        }

        const userRow = users[0];
        const passwordMatches = await bcrypt.compare(password, userRow.password_hash);

        if (!passwordMatches) {
            return res.status(401).json({ message: 'И-мэйл эсвэл нууц үг буруу байна.' });
        }

        const user = {
            id: userRow.id,
            fullname: userRow.fullname,
            email: userRow.email,
            role: userRow.role
        };

        return res.json({
            message: 'Амжилттай нэвтэрлээ.',
            user,
            token: createToken(user)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Нэвтрэх үед алдаа гарлаа.' });
    }
}

module.exports = {
    register,
    login
};
