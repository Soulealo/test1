const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productsController');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

module.exports = router;
