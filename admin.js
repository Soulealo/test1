const PRODUCT_CATEGORIES = ['Буйдан', 'Ширээ', 'Сандал', 'Гэрэлтүүлэг', 'Чимэглэл', 'Зураг'];
const DEFAULT_PRODUCT_IMAGE = 'images/hero.jpg';

const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: "Орчин үеийн буйдан",
        description: "Итали арьсан бүрээстэй, гар урласан модон хүрээтэй тансаг буйдан",
        price: 16500000,
        images: [DEFAULT_PRODUCT_IMAGE],
        category: "Буйдан",
        details: "Зочны өрөөнд тохиромжтой, бат бөх модон хүрээтэй, өдөр тутмын хэрэглээнд тав тухтай загвар."
    },
    {
        id: 2,
        name: "Гантиг кофений ширээ",
        description: "Цагаан гантиг дээвэртэй, алтан өнгийн хөлтэй — зочны өрөөний гол цэг",
        price: 6600000,
        images: [DEFAULT_PRODUCT_IMAGE],
        category: "Ширээ",
        details: "Гантиг гадаргуу нь цэвэрлэхэд хялбар, алтан өнгийн суурь нь интерьерийг тансаг харагдуулна."
    },
    {
        id: 3,
        name: "Орчин үеийн тоногт сандал",
        description: "Хилэн бүрээстэй, дунд зууны загварын скульптур сандал",
        price: 4900000,
        images: [DEFAULT_PRODUCT_IMAGE],
        category: "Сандал",
        details: "Уншлагын булан, унтлагын өрөө, зочны өрөөнд тавихад тохиромжтой зөөлөн суудалтай."
    },
    {
        id: 4,
        name: "Минималист шалны чийдэн",
        description: "Алтан өнгийн нуман чийдэн, маалинган бүрхүүлтэй — амгалан гэрэлтүүлэг",
        price: 2300000,
        images: [DEFAULT_PRODUCT_IMAGE],
        category: "Гэрэлтүүлэг",
        details: "Зөөлөн гэрэлтэй тул амрах хэсэг, буйдангийн хажуу, унтлагын өрөөнд уур амьсгал бүрдүүлнэ."
    },
    {
        id: 5,
        name: "Абстракт хананы зураг",
        description: "Гар зурсан орчин үеийн абстракт бүтээл, тусгай зотон дээр",
        price: 3200000,
        images: [DEFAULT_PRODUCT_IMAGE],
        category: "Зураг",
        details: "Зочны өрөө, коридор, оффисын хананд өнгө нэмэх гоёмсог абстракт бүтээл."
    },
    {
        id: 6,
        name: "Гар урласан шаазан ваар",
        description: "Уран дархны гараар хийсэн органик хэлбэртэй шаазан ваар — интерьерийн сонгодог чимэглэл",
        price: 1750000,
        images: [DEFAULT_PRODUCT_IMAGE],
        category: "Чимэглэл",
        details: "Тавиур, ширээ, консоль дээр байрлуулахад тохиромжтой, ганцаараа ч гоёмсог харагдах ваар."
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
});

function initializeAdmin() {
    const legacyProducts = localStorage.getItem('una_products');
    if (legacyProducts && !localStorage.getItem('unaProducts')) {
        localStorage.setItem('unaProducts', legacyProducts);
        localStorage.removeItem('una_products');
    }
    if (!localStorage.getItem('unaProducts')) {
        saveProducts(normalizeProducts(DEFAULT_PRODUCTS));
    }
    const adminSession = localStorage.getItem('una_admin_session');
    if (adminSession) {
        showDashboard();
    } else {
        showLoginScreen();
    }

    setupEventListeners();
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

function handleAdminLogin(e) {
    e.preventDefault();

    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';
    if (username === 'admin' && password === '1234') {
        localStorage.setItem('una_admin_session', JSON.stringify({
            username: username,
            loginTime: new Date().getTime()
        }));
        document.getElementById('adminLoginForm').reset();
        showDashboard();
    } else {
        errorDiv.textContent = 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна!';
        errorDiv.classList.add('show');
    }
}

function handleLogout() {
    const confirmLogout = confirm('Та системээс гарах уу?');
    if (confirmLogout) {
        localStorage.removeItem('una_admin_session');
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
    updateDashboard();
}

function handleSidebarMenuClick(e) {
    e.preventDefault();
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    e.currentTarget.classList.add('active');
    
    const menuType = e.currentTarget.getAttribute('data-menu');
    switchView(menuType);
}

function switchView(viewType) {
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
        updateDashboard();
        document.querySelector('[data-menu="dashboard"]').classList.add('active');
    } else if (viewType === 'products') {
        productsView.classList.add('active');
        pageTitle.textContent = 'Бүтээгдэхүүн Удирдах';
        loadProductsTable();
        document.querySelector('[data-menu="products"]').classList.add('active');
    }
}

function updateDashboard() {
    const products = getProducts();
    const totalProductsElement = document.getElementById('totalProducts');
    if (totalProductsElement) {
        totalProductsElement.textContent = products.length;
    }
}

function getProducts() {
    const products = localStorage.getItem('unaProducts');

    if (!products) {
        const defaultProducts = normalizeProducts(DEFAULT_PRODUCTS);
        saveProducts(defaultProducts);
        return defaultProducts;
    }

    try {
        const parsedProducts = JSON.parse(products);
        if (!Array.isArray(parsedProducts)) {
            const defaultProducts = normalizeProducts(DEFAULT_PRODUCTS);
            saveProducts(defaultProducts);
            return defaultProducts;
        }

        const normalizedProducts = normalizeProducts(parsedProducts);
        if (JSON.stringify(parsedProducts) !== JSON.stringify(normalizedProducts)) {
            saveProducts(normalizedProducts);
        }
        return normalizedProducts;
    } catch (error) {
        const defaultProducts = normalizeProducts(DEFAULT_PRODUCTS);
        saveProducts(defaultProducts);
        return defaultProducts;
    }
}

function saveProducts(products) {
    localStorage.setItem('unaProducts', JSON.stringify(products));
}

function getSafeProductImage(image) {
    const imageValue = String(image || '').trim();

    if (imageValue.startsWith('data:image/')) return imageValue;
    if (imageValue.startsWith('images/') || imageValue.startsWith('./images/')) return imageValue;

    return DEFAULT_PRODUCT_IMAGE;
}

function getSafeProductImages(images, fallbackImage = DEFAULT_PRODUCT_IMAGE) {
    const imageList = Array.isArray(images) ? images : [];
    const safeImages = imageList
        .map(image => getSafeProductImage(image))
        .filter(Boolean);

    if (safeImages.length > 0) return safeImages;

    return [getSafeProductImage(fallbackImage)];
}

function getProductMainImage(product) {
    return getSafeProductImages(product?.images, product?.image)[0];
}

function normalizeProduct(product, index = 0) {
    const fallback = DEFAULT_PRODUCTS.find(item => item.id === Number(product?.id)) || DEFAULT_PRODUCTS[index] || DEFAULT_PRODUCTS[0];
    const numericPrice = Number(product?.price ?? fallback.price);
    const fallbackImage = fallback.images?.[0] || fallback.image || DEFAULT_PRODUCT_IMAGE;

    return {
        id: Number.isFinite(Number(product?.id)) ? Number(product.id) : Date.now() + index,
        name: product?.name || fallback.name,
        description: product?.description || fallback.description,
        price: Number.isFinite(numericPrice) ? numericPrice : fallback.price,
        images: getSafeProductImages(product?.images, product?.image || fallbackImage),
        category: product?.category || fallback.category || PRODUCT_CATEGORIES[0],
        details: product?.details || product?.description || fallback.details || fallback.description
    };
}

function normalizeProducts(products) {
    return products.map((product, index) => normalizeProduct(product, index));
}

function getNextProductId() {
    const products = getProducts();
    return products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

let editingProductId = null;
let selectedProductImages = [];

function openAddProductModal() {
    editingProductId = null;
    selectedProductImages = [];
    document.getElementById('modalTitle').textContent = 'Шинэ бүтээгдэхүүн нэмэх';
    document.getElementById('productForm').reset();
    document.getElementById('productCategory').value = '';
    document.getElementById('productImage').value = '';
    renderImagePreview();
    document.getElementById('productModal').classList.add('show');
}

function openEditProductModal(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);

    if (product) {
        editingProductId = productId;
        selectedProductImages = [...product.images];
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
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    editingProductId = null;
    selectedProductImages = [];
    document.getElementById('productForm').reset();
    renderImagePreview();
}

function previewImage(e) {
    const files = [...e.target.files];
    const previousImages = [...selectedProductImages];

    if (files.length === 0) {
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFile = files.find(file => {
        const allowedExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
        return !allowedTypes.includes(file.type) && !allowedExtension;
    });

    if (invalidFile) {
        alert('Зөвхөн JPG, JPEG, PNG, WEBP зураг оруулна уу!');
        e.target.value = '';
        return;
    }

    Promise.all(files.map(readFileAsDataUrl))
        .then(images => {
            selectedProductImages = images;
            renderImagePreview();
        })
        .catch(() => {
            alert('Зургийг унших үед алдаа гарлаа. Дахин оролдоно уу.');
            e.target.value = '';
            selectedProductImages = previousImages;
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

    preview.innerHTML = '';

    selectedProductImages.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image;
        img.alt = `Зургийн урьдчилсан харагдац ${index + 1}`;
        preview.appendChild(img);
    });
}

function handleProductFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const details = document.getElementById('productDetails').value.trim();
    const price = Number(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const images = selectedProductImages;

    if (!name || !description || !details || !Number.isFinite(price) || !category || images.length === 0) {
        alert('Бүх талбарыг бөглөнө үү!');
        return;
    }

    if (price <= 0) {
        alert('Үнэ 0-ээс их байх ёстой!');
        return;
    }

    const products = getProducts();

    if (editingProductId) {
        const productIndex = products.findIndex(p => p.id === editingProductId);
        if (productIndex !== -1) {
            products[productIndex] = {
                id: editingProductId,
                name,
                description,
                price,
                images,
                category,
                details
            };
            alert('Бүтээгдэхүүн амжилттай шинэчлэгдлээ!');
        }
    } else {
        const newProduct = {
            id: getNextProductId(),
            name,
            description,
            price,
            images,
            category,
            details
        };
        products.push(newProduct);
        alert('Бүтээгдэхүүн амжилттай нэмэгдлээ!');
    }

    saveProducts(products);
    closeProductModal();
    loadProductsTable();
    updateDashboard();
}

function loadProductsTable() {
    const products = getProducts();
    const tableBody = document.getElementById('productsTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('productsTable');

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

function deleteProduct(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);

    if (!product) return;

    const confirmDelete = confirm(`"${product.name}" бүтээгдэхүүнийг устгах уу?`);
    
    if (confirmDelete) {
        const updatedProducts = products.filter(p => p.id !== productId);
        saveProducts(updatedProducts);
        alert('Бүтээгдэхүүн амжилттай устгагдлаа!');
        loadProductsTable();
        updateDashboard();
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
