const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
        return res.status(401).json({ message: 'Нэвтрэх шаардлагатай.' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'una_home_secret');
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Нэвтрэх хугацаа дууссан байна.' });
    }
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Админ эрх шаардлагатай.' });
        }

        next();
    });
}

module.exports = {
    requireAuth,
    requireAdmin
};
