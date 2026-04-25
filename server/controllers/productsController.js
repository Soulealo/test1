const { pool } = require('../models/db');

function groupProductRows(rows) {
    const products = new Map();

    rows.forEach(row => {
        if (!products.has(row.id)) {
            products.set(row.id, {
                id: row.id,
                name: row.name,
                description: row.description,
                price: Number(row.price),
                category: row.category,
                details: row.details,
                images: []
            });
        }

        if (row.image_path) {
            products.get(row.id).images.push(row.image_path);
        }
    });

    return [...products.values()];
}

async function findProductById(productId) {
    const [rows] = await pool.query(
        `SELECT p.id, p.name, p.description, p.price, p.category, p.details, pi.image_path
         FROM products p
         LEFT JOIN product_images pi ON pi.product_id = p.id
         WHERE p.id = ?
         ORDER BY pi.id ASC`,
        [productId]
    );

    return groupProductRows(rows)[0] || null;
}

function cleanProductInput(body) {
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim();
    const details = String(body.details || '').trim();
    const category = String(body.category || '').trim();
    const price = Number(body.price);
    const images = Array.isArray(body.images)
        ? body.images.map(image => String(image || '').trim()).filter(Boolean)
        : [];

    return {
        name,
        description,
        details,
        category,
        price,
        images
    };
}

function validateProduct(product) {
    if (!product.name || !product.description || !product.details || !product.category) {
        return 'Бүх талбарыг бөглөнө үү.';
    }

    if (!Number.isFinite(product.price) || product.price <= 0) {
        return 'Үнэ 0-ээс их байх ёстой.';
    }

    return '';
}

async function replaceProductImages(productId, images) {
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [productId]);

    for (const imagePath of images) {
        await pool.query(
            'INSERT INTO product_images (product_id, image_path) VALUES (?, ?)',
            [productId, imagePath]
        );
    }
}

async function getProducts(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT p.id, p.name, p.description, p.price, p.category, p.details, pi.image_path
             FROM products p
             LEFT JOIN product_images pi ON pi.product_id = p.id
             ORDER BY p.id DESC, pi.id ASC`
        );

        return res.json(groupProductRows(rows));
    } catch (error) {
        return res.status(500).json({ message: 'Бүтээгдэхүүн унших үед алдаа гарлаа.' });
    }
}

async function getProduct(req, res) {
    try {
        const product = await findProductById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Бүтээгдэхүүн олдсонгүй.' });
        }

        return res.json(product);
    } catch (error) {
        return res.status(500).json({ message: 'Бүтээгдэхүүн унших үед алдаа гарлаа.' });
    }
}

async function createProduct(req, res) {
    try {
        const product = cleanProductInput(req.body);
        const validationMessage = validateProduct(product);

        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        if (product.images.length === 0) {
            return res.status(400).json({ message: 'Бүтээгдэхүүний зураг оруулна уу.' });
        }

        const [result] = await pool.query(
            'INSERT INTO products (name, description, price, category, details) VALUES (?, ?, ?, ?, ?)',
            [product.name, product.description, product.price, product.category, product.details]
        );

        await replaceProductImages(result.insertId, product.images);

        return res.status(201).json(await findProductById(result.insertId));
    } catch (error) {
        return res.status(500).json({ message: 'Бүтээгдэхүүн нэмэх үед алдаа гарлаа.' });
    }
}

async function updateProduct(req, res) {
    try {
        const productId = Number(req.params.id);
        const existingProduct = await findProductById(productId);

        if (!existingProduct) {
            return res.status(404).json({ message: 'Бүтээгдэхүүн олдсонгүй.' });
        }

        const product = cleanProductInput(req.body);
        const validationMessage = validateProduct(product);

        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        if (Array.isArray(req.body.images) && product.images.length === 0) {
            return res.status(400).json({ message: 'Бүтээгдэхүүний зураг оруулна уу.' });
        }

        await pool.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category = ?, details = ? WHERE id = ?',
            [product.name, product.description, product.price, product.category, product.details, productId]
        );

        if (Array.isArray(req.body.images)) {
            await replaceProductImages(productId, product.images);
        }

        return res.json(await findProductById(productId));
    } catch (error) {
        return res.status(500).json({ message: 'Бүтээгдэхүүн засах үед алдаа гарлаа.' });
    }
}

async function deleteProduct(req, res) {
    try {
        const productId = Number(req.params.id);
        const existingProduct = await findProductById(productId);

        if (!existingProduct) {
            return res.status(404).json({ message: 'Бүтээгдэхүүн олдсонгүй.' });
        }

        await pool.query('DELETE FROM products WHERE id = ?', [productId]);
        return res.json({ message: 'Бүтээгдэхүүн устгагдлаа.' });
    } catch (error) {
        return res.status(500).json({ message: 'Бүтээгдэхүүн устгах үед алдаа гарлаа.' });
    }
}

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};
