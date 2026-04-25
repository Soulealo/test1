const API_BASE = '/api';
const TOKEN_KEY = 'unaToken';
const PRODUCT_CATEGORIES = ['Буйдан', 'Ширээ', 'Сандал', 'Гэрэлтүүлэг', 'Чимэглэл', 'Зураг'];
const DEFAULT_PRODUCT_IMAGE = 'images/hero.jpg';

let editingProductId = null;
let productCache = [];
let currentProductImages = [];
let selectedImageFiles = [];
let previewImages = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
});

function initializeAdmin() {
    setupEventListeners();

    if (tokenIsAdmin()) {
        showDashboard();
    } else {
        showLoginScreen();
    }
}

function setupEventListeners() {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', handleSidebarMenuClick);
    });

    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddProductModal);
    }

    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProductModal);
    }

    const cancelFormBtn = document.getElementById('cancelFormBtn');
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', closeProductModal);
    }

    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }

    const productImage = document.getElementById('productImage');
    if (productImage) {
        productImage.addEventListener('change', previewImage);
    }

    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('data-action');

            if (action === 'addProduct') {
                openAddProductModal();
                switchView('products');
            } else if (action === 'viewProducts') {
                switchView('products');
            }
        });
    });

    const modal = document.getElementById('productModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProductModal();
            }
        });
    }
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function getTokenPayload() {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = token.split('.')[1];
        const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(normalizedPayload));
    } catch (error) {
        return null;
    }
}

function tokenIsAdmin() {
    return getTokenPayload()?.role === 'admin';
}

async function requestJson(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };
    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });
    const responseText = await response.text();
    let data = null;

    try {
        data = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            removeToken();
            showLoginScreen();
        }

        throw new Error(data?.message || 'Сервертэй холбогдох үед алдаа гарлаа.');
    }

    return data;
}

async function handleAdminLogin(e) {
    e.preventDefault();

    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';

    try {
        const data = await requestJson(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: username,
                username,
                password
            })
        });

        if (data.user.role !== 'admin') {
            errorDiv.textContent = 'Админ эрхтэй хэрэглэгчээр нэвтэрнэ үү.';
            errorDiv.classList.add('show');
            return;
        }

        saveToken(data.token);
        document.getElementById('adminLoginForm').reset();
        showDashboard();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('show');
    }
}

function handleLogout() {
    const confirmLogout = confirm('Та системээс гарах уу?');

    if (confirmLogout) {
        removeToken();
        showLoginScreen();
        document.getElementById('adminLoginForm').reset();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('dashboardScreen').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');
    switchView('dashboard');
}

function handleSidebarMenuClick(e) {
    e.preventDefault();

    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });

    e.currentTarget.classList.add('active');
    switchView(e.currentTarget.getAttribute('data-menu'));
}

async function switchView(viewType) {
    const dashboardView = document.getElementById('dashboardView');
    const productsView = document.getElementById('productsView');
    const pageTitle = document.getElementById('pageTitle');

    dashboardView.classList.remove('active');
    productsView.classList.remove('active');
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });

    if (viewType === 'dashboard') {
        dashboardView.classList.add('active');
        pageTitle.textContent = 'Админ Самбар';
        document.querySelector('[data-menu="dashboard"]').classList.add('active');
        await updateDashboard();
    } else if (viewType === 'products') {
        productsView.classList.add('active');
        pageTitle.textContent = 'Бүтээгдэхүүн Удирдах';
        document.querySelector('[data-menu="products"]').classList.add('active');
        await loadProductsTable();
    }
}

async function updateDashboard() {
    const products = await fetchProducts();
    const totalProductsElement = document.getElementById('totalProducts');

    if (totalProductsElement) {
        totalProductsElement.textContent = products.length;
    }
}

async function fetchProducts() {
    const products = await requestJson(`${API_BASE}/products`);
    productCache = normalizeProducts(products);
    return productCache;
}

async function fetchProduct(productId) {
    const product = await requestJson(`${API_BASE}/products/${productId}`);
    return normalizeProduct(product);
}

function getSafeProductImage(image) {
    const imageValue = String(image || '').trim();

    if (imageValue.startsWith('/uploads/')) return imageValue;
    if (imageValue.startsWith('uploads/')) return `/${imageValue}`;
    if (imageValue.startsWith('images/') || imageValue.startsWith('./images/')) return imageValue;
    if (imageValue.startsWith('data:image/')) return imageValue;

    return DEFAULT_PRODUCT_IMAGE;
}

function getSafeProductImages(images, fallbackImage = DEFAULT_PRODUCT_IMAGE) {
    const imageList = Array.isArray(images) ? images : [];
    const safeImages = imageList.map(image => getSafeProductImage(image)).filter(Boolean);

    if (safeImages.length > 0) return safeImages;

    return [getSafeProductImage(fallbackImage)];
}

function getProductMainImage(product) {
    return getSafeProductImages(product?.images, product?.image)[0];
}

function normalizeProduct(product, index = 0) {
    const numericPrice = Number(product?.price);

    return {
        id: Number.isFinite(Number(product?.id)) ? Number(product.id) : index + 1,
        name: product?.name || 'Бүтээгдэхүүн',
        description: product?.description || '',
        price: Number.isFinite(numericPrice) ? numericPrice : 0,
        images: getSafeProductImages(product?.images, product?.image),
        category: product?.category || PRODUCT_CATEGORIES[0],
        details: product?.details || product?.description || ''
    };
}

function normalizeProducts(products) {
    return Array.isArray(products) ? products.map((product, index) => normalizeProduct(product, index)) : [];
}

function openAddProductModal() {
    editingProductId = null;
    currentProductImages = [];
    selectedImageFiles = [];
    previewImages = [];
    document.getElementById('modalTitle').textContent = 'Шинэ бүтээгдэхүүн нэмэх';
    document.getElementById('productForm').reset();
    document.getElementById('productCategory').value = '';
    document.getElementById('productImage').value = '';
    renderImagePreview();
    document.getElementById('productModal').classList.add('show');
}

async function openEditProductModal(productId) {
    let product = productCache.find(item => item.id === Number(productId));

    if (!product) {
        product = await fetchProduct(productId);
    }

    editingProductId = product.id;
    currentProductImages = [...product.images];
    selectedImageFiles = [];
    previewImages = [];
    document.getElementById('modalTitle').textContent = 'Бүтээгдэхүүн засварлах';
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productDetails').value = product.details;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productImage').value = '';
    renderImagePreview();
    document.getElementById('productModal').classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    editingProductId = null;
    currentProductImages = [];
    selectedImageFiles = [];
    previewImages = [];
    document.getElementById('productForm').reset();
    renderImagePreview();
}

function previewImage(e) {
    const files = [...e.target.files];

    if (files.length === 0) {
        selectedImageFiles = [];
        previewImages = [];
        renderImagePreview();
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFile = files.find(file => {
        const allowedExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
        return !allowedTypes.includes(file.type) || !allowedExtension;
    });

    if (invalidFile) {
        alert('Зөвхөн JPG, JPEG, PNG, WEBP зураг оруулна уу!');
        e.target.value = '';
        selectedImageFiles = [];
        previewImages = [];
        renderImagePreview();
        return;
    }

    selectedImageFiles = files;

    Promise.all(files.map(readFileAsDataUrl))
        .then(images => {
            previewImages = images;
            renderImagePreview();
        })
        .catch(() => {
            alert('Зургийг унших үед алдаа гарлаа. Дахин оролдоно уу.');
            e.target.value = '';
            selectedImageFiles = [];
            previewImages = [];
            renderImagePreview();
        });
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderImagePreview() {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;

    const images = previewImages.length > 0 ? previewImages : currentProductImages;
    preview.innerHTML = '';

    images.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image;
        img.alt = `Зургийн урьдчилсан харагдац ${index + 1}`;
        preview.appendChild(img);
    });
}

async function uploadImages(files) {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('images', file);
    });

    const token = getToken();
    const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });
    const responseText = await response.text();
    let data = null;

    try {
        data = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.message || 'Зураг upload хийх үед алдаа гарлаа.');
    }

    return Array.isArray(data.images) ? data.images : [];
}

async function handleProductFormSubmit(e) {
    e.preventDefault();

    const saveButton = document.getElementById('saveProductBtn');
    const originalButtonText = saveButton.textContent;
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const details = document.getElementById('productDetails').value.trim();
    const price = Number(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;

    if (!name || !description || !details || !Number.isFinite(price) || !category) {
        alert('Бүх талбарыг бөглөнө үү!');
        return;
    }

    if (price <= 0) {
        alert('Үнэ 0-ээс их байх ёстой!');
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Хадгалж байна...';

    try {
        const images = selectedImageFiles.length > 0 ? await uploadImages(selectedImageFiles) : currentProductImages;

        if (images.length === 0) {
            alert('Бүтээгдэхүүний зураг оруулна уу!');
            return;
        }

        const productData = {
            name,
            description,
            price,
            category,
            details,
            images
        };

        if (editingProductId) {
            await requestJson(`${API_BASE}/products/${editingProductId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            alert('Бүтээгдэхүүн амжилттай шинэчлэгдлээ!');
        } else {
            await requestJson(`${API_BASE}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            alert('Бүтээгдэхүүн амжилттай нэмэгдлээ!');
        }

        closeProductModal();
        await loadProductsTable();
        await updateDashboard();
    } catch (error) {
        alert(error.message);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalButtonText;
    }
}

async function loadProductsTable() {
    const tableBody = document.getElementById('productsTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('productsTable');

    tableBody.innerHTML = '<tr><td colspan="6">Бүтээгдэхүүн уншиж байна...</td></tr>';

    let products = [];

    try {
        products = await fetchProducts();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';

    if (products.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${escapeHtml(getProductMainImage(product))}" alt="${escapeHtml(product.name)}" class="product-image-thumb"></td>
            <td class="product-cell-name">${escapeHtml(product.name)}</td>
            <td class="product-cell-description">${escapeHtml(product.description)}</td>
            <td><span class="admin-category-badge">${escapeHtml(product.category)}</span></td>
            <td class="product-cell-price">${formatPrice(product.price)}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit-btn" onclick="openEditProductModal(${product.id})">
                        <i class="fas fa-edit"></i> Засварлах
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Устгах
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function deleteProduct(productId) {
    const product = productCache.find(item => item.id === Number(productId)) || await fetchProduct(productId);

    if (!product) return;

    const confirmDelete = confirm(`"${product.name}" бүтээгдэхүүнийг устгах уу?`);

    if (!confirmDelete) return;

    try {
        await requestJson(`${API_BASE}/products/${productId}`, {
            method: 'DELETE'
        });
        alert('Бүтээгдэхүүн амжилттай устгагдлаа!');
        await loadProductsTable();
        await updateDashboard();
    } catch (error) {
        alert(error.message);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
}

function formatPrice(price) {
    const numericPrice = Number(price);
    return Number.isFinite(numericPrice) ? `₮${numericPrice.toLocaleString()}` : String(price);
}

window.openEditProductModal = openEditProductModal;
window.deleteProduct = deleteProduct;
