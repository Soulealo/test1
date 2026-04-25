const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const uploadRoutes = require('./routes/upload');
const { ensureDatabase } = require('./models/db');
const { ensureTables, ensureDefaultAdmin } = require('./models/schema');

const app = express();
const port = Number(process.env.PORT || 3000);
const clientPath = path.join(__dirname, '..', 'client');
const uploadsPath = path.join(__dirname, 'uploads');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(clientPath));
app.use('/api', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api', uploadRoutes);
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API endpoint олдсонгүй.' });
});
app.use((req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

async function startServer() {
    await ensureDatabase();
    await ensureTables();
    await ensureDefaultAdmin();

    app.listen(port, () => {
        console.log(`UNA Home & Furniture server http://localhost:${port}`);
    });
}

function getStartupErrorMessage(error) {
    const messages = [];
    const nestedErrors = Array.isArray(error?.errors) ? error.errors : [];
    const code = error?.code || nestedErrors.find(item => item?.code)?.code;
    const detail = error?.message || nestedErrors.map(item => item.message).filter(Boolean).join(' ');

    if (code === 'ECONNREFUSED') {
        messages.push('MySQL сервер асаагүй эсвэл 3306 порт дээр сонсохгүй байна.');
        messages.push('MySQL асаагаад .env доторх DB_HOST, DB_PORT, DB_USER, DB_PASSWORD утгуудаа шалгана уу.');
    } else if (code === 'ER_ACCESS_DENIED_ERROR') {
        messages.push('MySQL хэрэглэгчийн нэр эсвэл нууц үг буруу байна.');
        messages.push('.env доторх DB_USER болон DB_PASSWORD утгаа шалгана уу.');
    } else if (code === 'ER_BAD_DB_ERROR') {
        messages.push('Database олдсонгүй. Сервер database-ийг автоматаар үүсгэх гэж оролдсон ч амжилтгүй боллоо.');
    } else if (detail) {
        messages.push(detail);
    } else {
        messages.push('Тодорхойгүй startup алдаа гарлаа.');
    }

    if (code) {
        messages.push(`Код: ${code}`);
    }

    return messages.join('\n');
}

startServer().catch(error => {
    console.error(`Сервер эхлэх үед алдаа гарлаа:\n${getStartupErrorMessage(error)}`);
    process.exit(1);
});
