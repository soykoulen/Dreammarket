// Загрузка товаров
fetch('dreammarket.json')
  .then(res => res.json())
  .then(products => {
    window.products = products;
    window.cart = loadCartFromStorage(); // Load cart from localStorage
    renderProducts(products);
    setupEventListeners(products);
    renderCart(); // Render the cart immediately
  });

// Load cart from localStorage
function loadCartFromStorage() {
  const saved = localStorage.getItem('dreamcoreCart');
  return saved ? JSON.parse(saved) : [];
}

// Save cart to localStorage
function saveCartToStorage() {
  localStorage.setItem('dreamcoreCart', JSON.stringify(window.cart));
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price) + ' ⏳';
}

// Render product cards
function renderProducts(items) {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');

  if (items.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  grid.innerHTML = items.map(product => {
    const isElite = product.price > 1000;
    const rarityClass = product.rarity.toLowerCase();
    return `
      <div class="product-card ${isElite ? 'elite' : ''}" 
           data-id="${product.id}" 
           data-rarity="${product.rarity}">
        <div class="product-img">${product.image ? `<img src="${product.image}" alt="${product.name}">` : ''}</div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-desc">${product.description}</div>
          <div class="product-price">${formatPrice(product.price)}</div>
        </div>
      </div>
    `;
  }).join('');

  // Event delegation for product cards
  grid.addEventListener('click', e => {
    const card = e.target.closest('.product-card');
    if (!card) return;

    const id = parseInt(card.dataset.id);
    const product = window.products.find(p => p.id === id);
    addToCart(product);
  });
}

// Add to cart
function addToCart(product) {
  const existingItem = window.cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    window.cart.push({ ...product, quantity: 1 });
  }

  saveCartToStorage();
  renderCart();

  // Animate cart button
  const cartBtn = document.getElementById('cartBtn');
  cartBtn.classList.add('bounce');
  setTimeout(() => cartBtn.classList.remove('bounce'), 300);
}

// Render cart
function renderCart() {
  const cartItemsEl = document.getElementById('cartItems');
  const totalSumEl = document.getElementById('totalSum');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const emptyCartMsg = document.getElementById('emptyCartMsg');
  const cartCountEl = document.getElementById('cartCount');

  if (window.cart.length === 0) {
    cartItemsEl.innerHTML = '';
    totalSumEl.textContent = 'Total: 0';
    checkoutBtn.disabled = true;
    checkoutBtn.classList.add('hidden');
    emptyCartMsg.classList.add('visible');
    cartCountEl.textContent = `(0)`;
    return;
  }

  // Updating the counter in the cart button
  const totalQuantity = window.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = `(${totalQuantity})`;

  // Render the products
  cartItemsEl.innerHTML = window.cart.map(item => {
    const subTotal = item.price * item.quantity;
    return `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-quantity">
          <button class="quantity-btn minus">-</button>
          <span class="quantity-value">${item.quantity}</span>
          <button class="quantity-btn plus">+</button>
        </div>
        <div class="cart-item-total">${formatPrice(subTotal)}</div>
        <button class="delete-btn">×</button>
      </div>
    `;
  }).join('');

  // Calculate total
  const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  totalSumEl.textContent = `Total: ${formatPrice(total)}`;

  // Enable checkout button
  checkoutBtn.disabled = false;
  checkoutBtn.classList.remove('hidden');
  emptyCartMsg.classList.remove('visible');

  // Event listeners for quantity buttons and delete buttons
  cartItemsEl.querySelectorAll('.minus').forEach(btn => {
    btn.addEventListener('click', e => {
      const itemEl = e.target.closest('.cart-item');
      const id = parseInt(itemEl.dataset.id);
      changeQuantity(id, -1);
    });
  });

  cartItemsEl.querySelectorAll('.plus').forEach(btn => {
    btn.addEventListener('click', e => {
      const itemEl = e.target.closest('.cart-item');
      const id = parseInt(itemEl.dataset.id);
      changeQuantity(id, 1);
    });
  });

  cartItemsEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const itemEl = e.target.closest('.cart-item');
      const id = parseInt(itemEl.dataset.id);
      removeFromCart(id);
    });
  });
}

// Quantity change
function changeQuantity(id, delta) {
  const item = window.cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    window.cart = window.cart.filter(i => i.id !== id);
  }

  saveCartToStorage();
  renderCart();
}

// Remove from cart
function removeFromCart(id) {
  window.cart = window.cart.filter(item => item.id !== id);
  saveCartToStorage();
  renderCart();
}

// Open product modal
function openModal(product) {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  const closeBtn = document.querySelector('.close');

  modalContent.innerHTML = `
    <h2>${product.name}</h2>
    <div class="modal-desc">${product.description}</div>
    <div class="modal-price">Price: ${formatPrice(product.price)}</div>
    <div style="margin-top: 16px;">
      <button class="add-to-cart-btn">Add to Black Bag</button>
    </div>
  `;

  modal.style.display = 'block';

  closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = e => {
    if (e.target === modal) modal.style.display = 'none';
  };

  // Add to cart from modal
  document.querySelector('.add-to-cart-btn').onclick = (e) => {
    addToCart(product);
    modal.style.display = 'none';
    alert("Product added... but it already knows your name.");
  };
}

// Search
function filterBySearch(query) {
  return window.products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );
}

// Filter by category and price
function filterProducts() {
  const query = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('categoryFilter').value;
  const maxPrice = parseInt(document.getElementById('priceSlider').value);

  let filtered = window.products;

  if (query) {
    filtered = filterBySearch(query);
  }
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  filtered = filtered.filter(p => p.price <= maxPrice);

  // Sorting
  filtered = sortProducts(filtered);

  renderProducts(filtered);
}

// Sorting
function sortProducts(items) {
  switch (currentSort) {
    case 'price-asc':
      return [...items].sort((a, b) => a.price - b.price);
    case 'price-desc':
      return [...items].sort((a, b) => b.price - a.price);
    default:
      return items;
  }
}

// Setup event listeners
function setupEventListeners(products) {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const priceSlider = document.getElementById('priceSlider');
  const priceLabel = document.getElementById('priceLabel');
  const sortBtn = document.getElementById('sortBtn');
  const cartBtn = document.getElementById('cartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // Load saved sort option
  const savedSort = localStorage.getItem('dreamcoreSort') || 'default';
  currentSort = savedSort;
  if (savedSort === 'price-asc') sortBtn.textContent = 'Price: high to low';
  else sortBtn.textContent = 'Price: low to high';

  // Event listeners for filters
  searchInput.addEventListener('input', filterProducts);
  categoryFilter.addEventListener('change', filterProducts);
  priceSlider.addEventListener('input', () => {
    priceLabel.textContent = `To: ${priceSlider.value} `;
    filterProducts();
  });

  // Sorting button
  sortBtn.addEventListener('click', () => {
    if (currentSort === 'price-asc') {
      currentSort = 'price-desc';
      sortBtn.textContent = 'Price: low to high';
    } else {
      currentSort = 'price-asc';
      sortBtn.textContent = 'Price: high to low';
    }
    localStorage.setItem('dreamcoreSort', currentSort);
    filterProducts();
  });

  // Cart button
  cartBtn.addEventListener('click', () => {
    if (window.cart.length === 0) {
      alert("The Black Bag is empty... or is it already filled with your fears?");
    } else {
      alert(`In bag: ${window.cart.length} unique items. They are waiting for you in your dreams.`);
    }
  });

  // Checkout button
  checkoutBtn.addEventListener('click', () => {
    if (window.cart.length === 0) return;
    alert("Order placed. It will arrive to you... in the next dream.");
    window.cart = [];
    saveCartToStorage();
    renderCart();
  });

  // Initial render with filters applied
  filterProducts();
}