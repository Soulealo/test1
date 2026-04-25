# UNA Home & Furniture

UNA Home & Furniture нь luxury dark brown/gold өнгө төрхтэй тавилга, интерьер бүтээгдэхүүний full-stack вэб сайт юм. Frontend нь HTML, CSS, JavaScript хэвээр үлдсэн бөгөөд бүтээгдэхүүн, хэрэглэгч, зураг upload-ийн өгөгдөл backend API болон MySQL database-аас ажиллана.

## Ашигласан технологи

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- MySQL
- Multer
- bcrypt
- JWT

## Файлын бүтэц

```text
.
├── client/
│   ├── index.html
│   ├── products.html
│   ├── login.html
│   ├── signup.html
│   ├── admin.html
│   ├── styles.css
│   ├── admin-styles.css
│   ├── script.js
│   ├── admin.js
│   └── images/
├── server/
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── upload.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productsController.js
│   │   └── uploadController.js
│   ├── models/
│   │   ├── db.js
│   │   └── schema.js
│   ├── middleware/
│   │   └── auth.js
│   └── uploads/
├── schema.sql
├── package.json
├── .env.example
└── README.md
```

## Database тохируулах

MySQL ажиллаж байх ёстой. macOS дээр Homebrew ашиглаж байгаа бол:

```bash
brew install mysql
brew services start mysql
```

MySQL аль хэдийн суусан бол зөвхөн асаана.

```bash
brew services start mysql
```

Дараа нь `.env.example` файлыг `.env` болгож хуулна.

```bash
cp .env.example .env
```

`.env` дотор өөрийн MySQL тохиргоог оруулна.

```text
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=una_home
JWT_SECRET=una_home_change_me
DEFAULT_ADMIN_EMAIL=admin@unahome.mn
DEFAULT_ADMIN_PASSWORD=1234
DEFAULT_ADMIN_FULLNAME=UNA Admin
```

Database schema нь `schema.sql` файлд байгаа. Сервер асах үед database болон table-уудыг мөн автоматаар шалгаж үүсгэнэ.

Хэрвээ `ECONNREFUSED` алдаа гарвал MySQL асаагүй байна гэсэн үг. MySQL-ээ асаагаад `.env` доторх `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` утгуудаа шалгана.

## SQL schema

```sql
CREATE DATABASE IF NOT EXISTS una_home CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE una_home;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    category VARCHAR(80) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

## Ажиллуулах

Төслийн root хавтас дотор:

```bash
npm install
npm run dev
```

Browser дээр:

```text
http://localhost:3000
```

## API endpoints

```text
POST /api/register
POST /api/login
GET /api/products
GET /api/products/:id
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
POST /api/upload
```

`POST`, `PUT`, `DELETE`, `POST /api/upload` endpoint-ууд admin JWT token шаарддаг.

## Админ нэвтрэлт

Сервер анх асах үед `.env` дээрх default admin хэрэглэгчийг үүсгэнэ.

```text
Хэрэглэгчийн нэр: admin
Нууц үг: 1234
```

Мөн дараах email-ээр нэвтэрч болно.

```text
admin@unahome.mn
```

## Бүтээгдэхүүний бүтэц

Backend API дараах бүтэцтэй product object буцаана.

```json
{
  "id": 1,
  "name": "Бүтээгдэхүүний нэр",
  "description": "Товч тайлбар",
  "price": 1000000,
  "category": "Буйдан",
  "details": "Нэмэлт мэдээлэл",
  "images": ["/uploads/image-name.webp"]
}
```

## Зураг upload

Админ самбар дээр бүтээгдэхүүн нэмэх эсвэл засах үед олон зураг upload хийж болно.

Дэмжих формат:

- JPG
- JPEG
- PNG
- WEBP

Upload хийсэн зургууд `server/uploads/` дотор хадгалагдаж, database дотор `/uploads/...` path хэлбэрээр бичигдэнэ. Бүтээгдэхүүний card дээр эхний зураг харагдана. Дэлгэрэнгүй modal дээр бүх зураг thumbnail хэлбэрээр солигдож харагдана.

## Frontend ажиллагаа

- `products.html` нь `/api/products` endpoint-оос бүтээгдэхүүн уншина.
- `index.html` дээрх онцлох бүтээгдэхүүн мөн ижил API-аас уншина.
- Админ самбар нь бүтээгдэхүүн нэмэх, засах, устгахдаа API request илгээнэ.
- Login амжилттай бол JWT token browser-ийн `localStorage` дотор `unaToken` нэрээр хадгалагдана.
- Product data browser storage-д хадгалагдахгүй.
