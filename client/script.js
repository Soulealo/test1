const API_BASE = '/api';
const TOKEN_KEY = 'unaToken';
const PRODUCT_CATEGORIES = ['Буйдан', 'Ширээ', 'Сандал', 'Гэрэлтүүлэг', 'Чимэглэл', 'Зураг'];
const DEFAULT_PRODUCT_IMAGE = 'images/hero.jpg';

let selectedCategory = 'Бүгд';
let selectedSort = 'default';
let productsCache = [];
let productsLoaded = false;

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const responseText = await response.text();
    let data = null;

    try {
        data = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.message || 'Сервертэй холбогдох үед алдаа гарлаа.');
    }

    return data;
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
        category: product?.category || 'Чимэглэл',
        details: product?.details || product?.description || ''
    };
}

function normalizeProducts(products) {
    return Array.isArray(products) ? products.map((product, index) => normalizeProduct(product, index)) : [];
}

async function fetchProducts() {
    const products = await requestJson(`${API_BASE}/products`);
    return normalizeProducts(products);
}

async function ensureProductsLoaded() {
    if (!productsLoaded) {
        try {
            productsCache = await fetchProducts();
        } catch (error) {
            console.error(error);
            productsCache = [];
        }

        productsLoaded = true;
    }

    return productsCache;
}

async function fetchProduct(productId) {
    const product = await requestJson(`${API_BASE}/products/${productId}`);
    return normalizeProduct(product);
}

function formatPrice(price) {
    const numericPrice = Number(price);
    return Number.isFinite(numericPrice) ? `₮${numericPrice.toLocaleString()}` : String(price);
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
}

function shortenText(text, maxLength = 110) {
    const cleanText = String(text ?? '').trim();

    if (cleanText.length <= maxLength) {
        return cleanText;
    }

    return `${cleanText.slice(0, maxLength).trim()}...`;
}

function createProductCard(product, useShortDescription = false) {
    const productCard = document.createElement('div');
    const description = useShortDescription ? shortenText(product.description) : product.description;

    productCard.className = 'product-card';
    productCard.dataset.productId = String(product.id);
    productCard.innerHTML = `
        <div class="product-image">
            <img alt="${escapeHtml(product.name)}" src="${escapeHtml(getProductMainImage(product))}"/>
            <div class="product-overlay">
                <button class="view-details-btn" type="button" data-product-id="${product.id}">Дэлгэрэнгүй үзэх</button>
            </div>
        </div>
        <div class="product-info">
            <span class="product-category">${escapeHtml(product.category)}</span>
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(description)}</p>
            <div class="product-footer">
                <span class="product-price">${formatPrice(product.price)}</span>
                <button class="add-to-cart-btn" type="button" aria-label="Сагсанд нэмэх">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            </div>
        </div>
    `;

    return productCard;
}

function getProductCategories(products) {
    const productCategories = products.map(product => product.category).filter(Boolean);
    return ['Бүгд', ...new Set([...PRODUCT_CATEGORIES, ...productCategories])];
}

function getFilteredAndSortedProducts(products) {
    let visibleProducts = [...products];

    if (selectedCategory !== 'Бүгд') {
        visibleProducts = visibleProducts.filter(product => product.category === selectedCategory);
    }

    if (selectedSort === 'price-asc') {
        visibleProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (selectedSort === 'price-desc') {
        visibleProducts.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (selectedSort === 'name-asc') {
        visibleProducts.sort((a, b) => a.name.localeCompare(b.name, 'mn'));
    } else if (selectedSort === 'name-desc') {
        visibleProducts.sort((a, b) => b.name.localeCompare(a.name, 'mn'));
    }

    return visibleProducts;
}

function renderCategoryFilters(products) {
    const filterContainer = document.querySelector('.category-filter-buttons');

    if (!filterContainer) return;

    filterContainer.innerHTML = '';

    getProductCategories(products).forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `category-filter-btn${category === selectedCategory ? ' active' : ''}`;
        button.textContent = category;
        button.addEventListener('click', () => {
            selectedCategory = category;
            renderProducts();
        });
        filterContainer.appendChild(button);
    });
}

async function renderProducts() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '<p class="empty-products-message">Бүтээгдэхүүн уншиж байна...</p>';

    const products = await ensureProductsLoaded();
    const visibleProducts = getFilteredAndSortedProducts(products);
    const resultCount = document.getElementById('productsResultCount');

    renderCategoryFilters(products);
    productsGrid.innerHTML = '';

    if (resultCount) {
        resultCount.textContent = `${visibleProducts.length} бүтээгдэхүүн`;
    }

    if (visibleProducts.length === 0) {
        productsGrid.innerHTML = '<p class="empty-products-message">Энэ ангилалд бүтээгдэхүүн байхгүй байна.</p>';
        return;
    }

    visibleProducts.forEach(product => {
        productsGrid.appendChild(createProductCard(product));
    });
}

function setupProductControls() {
    const sortSelect = document.getElementById('productSort');

    if (!sortSelect) return;

    sortSelect.addEventListener('change', (e) => {
        selectedSort = e.target.value;
        renderProducts();
    });
}

function createProductDetailModal() {
    if (document.getElementById('productDetailModal')) return;

    const modal = document.createElement('div');
    modal.id = 'productDetailModal';
    modal.className = 'product-detail-modal';
    modal.innerHTML = `
        <div class="product-detail-content" role="dialog" aria-modal="true" aria-labelledby="detailProductName">
            <button class="product-detail-close" type="button" aria-label="Хаах">
                <i class="fas fa-times"></i>
            </button>
            <div class="product-detail-layout">
                <div class="product-detail-gallery">
                    <div class="product-detail-main-image-wrap">
                        <button class="product-gallery-arrow product-gallery-prev" type="button" aria-label="Өмнөх зураг">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <img id="detailProductImage" src="" alt="">
                        <button class="product-gallery-arrow product-gallery-next" type="button" aria-label="Дараах зураг">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div id="detailProductThumbs" class="product-detail-thumbs"></div>
                </div>
                <div class="product-detail-info">
                    <span id="detailProductCategory" class="product-detail-category"></span>
                    <h2 id="detailProductName"></h2>
                    <div class="product-detail-rating">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                        <span>4.8</span>
                    </div>
                    <p id="detailProductPrice" class="product-detail-price"></p>
                    <p id="detailProductDescription" class="product-detail-description"></p>
                    <div class="product-detail-extra">
                        <h3>Нэмэлт мэдээлэл</h3>
                        <p id="detailProductExtra"></p>
                    </div>
                    <div class="product-detail-purchase">
                        <div class="quantity-selector">
                            <button class="quantity-btn quantity-minus" type="button" aria-label="Тоо хасах">-</button>
                            <span id="detailQuantity">1</span>
                            <button class="quantity-btn quantity-plus" type="button" aria-label="Тоо нэмэх">+</button>
                        </div>
                        <div class="product-action-buttons">
                            <button class="cart-action-btn" type="button">Сагслах</button>
                            <button class="buy-action-btn" type="button">Худалдан авах</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function setDetailMainImage(index) {
    const modal = document.getElementById('productDetailModal');
    const image = document.getElementById('detailProductImage');
    const thumbs = [...document.querySelectorAll('.product-detail-thumb')];
    const images = JSON.parse(modal?.dataset.images || '[]');

    if (!image || images.length === 0) return;

    const nextIndex = (index + images.length) % images.length;
    image.classList.remove('loaded');
    image.src = images[nextIndex];
    modal.dataset.activeImage = String(nextIndex);

    thumbs.forEach((thumb, thumbIndex) => {
        thumb.classList.toggle('active', thumbIndex === nextIndex);
    });

    requestAnimationFrame(() => {
        image.classList.add('loaded');
    });
}

function renderDetailThumbnails(images) {
    const thumbsContainer = document.getElementById('detailProductThumbs');
    if (!thumbsContainer) return;

    thumbsContainer.innerHTML = '';

    images.forEach((image, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `product-detail-thumb${index === 0 ? ' active' : ''}`;
        button.dataset.imageIndex = String(index);
        button.innerHTML = `<img src="${escapeHtml(image)}" alt="Бүтээгдэхүүний зураг ${index + 1}">`;
        thumbsContainer.appendChild(button);
    });
}

async function openProductDetail(productId) {
    const modal = document.getElementById('productDetailModal');
    if (!modal) return;

    await ensureProductsLoaded();

    let product = productsCache.find(item => item.id === Number(productId));

    if (!product) {
        try {
            product = await fetchProduct(productId);
        } catch (error) {
            alert('Бүтээгдэхүүний мэдээлэл унших үед алдаа гарлаа.');
            return;
        }
    }

    const images = getSafeProductImages(product.images, product.image);
    const image = document.getElementById('detailProductImage');
    image.alt = product.name;
    modal.dataset.images = JSON.stringify(images);
    modal.dataset.activeImage = '0';

    document.getElementById('detailProductCategory').textContent = product.category;
    document.getElementById('detailProductName').textContent = product.name;
    document.getElementById('detailProductDescription').textContent = product.description;
    document.getElementById('detailProductPrice').textContent = formatPrice(product.price);
    document.getElementById('detailProductExtra').textContent = product.details;
    document.getElementById('detailQuantity').textContent = '1';
    renderDetailThumbnails(images);
    setDetailMainImage(0);

    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeProductDetail() {
    const modal = document.getElementById('productDetailModal');

    if (!modal) return;

    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

function setupProductDetailModal() {
    createProductDetailModal();

    document.addEventListener('click', (e) => {
        const detailsButton = e.target.closest('.view-details-btn');
        const productCard = e.target.closest('.product-card');
        const closeButton = e.target.closest('.product-detail-close');
        const thumbButton = e.target.closest('.product-detail-thumb');
        const previousButton = e.target.closest('.product-gallery-prev');
        const nextButton = e.target.closest('.product-gallery-next');
        const minusButton = e.target.closest('.quantity-minus');
        const plusButton = e.target.closest('.quantity-plus');
        const cartButton = e.target.closest('.cart-action-btn');
        const buyButton = e.target.closest('.buy-action-btn');
        const modal = document.getElementById('productDetailModal');

        if (detailsButton) {
            openProductDetail(detailsButton.getAttribute('data-product-id'));
        }

        if (productCard && !e.target.closest('button')) {
            openProductDetail(productCard.dataset.productId);
        }

        if (thumbButton) {
            setDetailMainImage(Number(thumbButton.dataset.imageIndex));
        }

        if (previousButton || nextButton) {
            const activeIndex = Number(modal?.dataset.activeImage || 0);
            setDetailMainImage(previousButton ? activeIndex - 1 : activeIndex + 1);
        }

        if (minusButton || plusButton) {
            const quantity = document.getElementById('detailQuantity');
            const currentValue = Number(quantity.textContent);
            const nextValue = plusButton ? currentValue + 1 : Math.max(1, currentValue - 1);
            quantity.textContent = String(nextValue);
        }

        if (cartButton) {
            alert('Бүтээгдэхүүн сагсанд нэмэгдлээ.');
        }

        if (buyButton) {
            alert('Худалдан авах хүсэлт хүлээн авлаа.');
        }

        if (closeButton || e.target === modal) {
            closeProductDetail();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProductDetail();
        }
    });
}

async function renderFeaturedProducts() {
    const featuredGrid = document.querySelector('.featured-products-grid');
    if (!featuredGrid) return;

    featuredGrid.innerHTML = '<p class="empty-products-message">Бүтээгдэхүүн уншиж байна...</p>';

    const featuredProducts = (await ensureProductsLoaded()).slice(0, 4);
    featuredGrid.innerHTML = '';

    if (featuredProducts.length === 0) {
        featuredGrid.innerHTML = '<p class="empty-products-message">Бүтээгдэхүүн одоогоор байхгүй байна.</p>';
        return;
    }

    featuredProducts.forEach(product => {
        featuredGrid.appendChild(createProductCard(product, true));
    });
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

        try {
            const data = await requestJson(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            saveToken(data.token);
            alert(`Тавтай морил, ${data.user.fullname}!`);
            loginForm.reset();
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            alert('Нууц үг таарахгүй байна!');
            return;
        }

        if (password.length < 6) {
            alert('Нууц үг дор хаяж 6 тэмдэгт байх ёстой!');
            return;
        }

        try {
            await requestJson(`${API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullname, email, password })
            });

            alert(`UNA Home & Furniture-д тавтай морил, ${fullname}! Таны бүртгэл амжилттай үүслээ.`);
            signupForm.reset();
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1200);
        } catch (error) {
            alert(error.message);
        }
    });
}

function setupPasswordToggles() {
    const passwordToggles = [
        ['togglePasswordSignup', 'signup-password'],
        ['togglePassword', 'password'],
        ['togglePasswordConfirm', 'confirm-password']
    ];

    passwordToggles.forEach(([buttonId, inputId]) => {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);

        if (!button || !input) return;

        button.addEventListener('click', (e) => {
            e.preventDefault();
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            button.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-logo').forEach(logo => {
        logo.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    });

    document.querySelectorAll('.hamburger').forEach(hamburger => {
        hamburger.addEventListener('click', () => {
            const navMenu = hamburger.closest('.nav-container')?.querySelector('.nav-menu');
            navMenu?.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    });

    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-menu.active').forEach(menu => menu.classList.remove('active'));
            document.querySelectorAll('.hamburger.active').forEach(hamburger => hamburger.classList.remove('active'));
        });
    });
}

function setupStaticActions() {
    document.querySelectorAll('.google-signup-btn, .google-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Google-ийн нэвтрэлт удахгүй нэмэгдэх болно.');
        });
    });

    document.querySelectorAll('.forgot-password').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Нууц үг сэргээх хэсэг удахгүй нэмэгдэх болно.');
        });
    });

    document.querySelectorAll('.terms-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Үйлчилгээний нөхцөл болон нууцлалын бодлого удахгүй нэмэгдэх болно.');
        });
    });

    document.querySelectorAll('.social-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Сошиал холбоос удахгүй нэмэгдэх болно.');
        });
    });

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Таны зурвас амжилттай илгээгдлээ.');
            contactForm.reset();
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupStaticActions();
    setupPasswordToggles();
    setupLoginForm();
    setupSignupForm();
    setupProductControls();
    setupProductDetailModal();
    await renderProducts();
    await renderFeaturedProducts();
});
