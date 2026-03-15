// ───────────────────────────────────────────────
//  APP.JS  – POS Billing Logic
// ───────────────────────────────────────────────

let cart = [];  // { item, qty }

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderCategoryTabs();
    renderMenu();
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('printBtn').addEventListener('click', printBill);
    document.getElementById('clearBtn').addEventListener('click', clearCart);
});

// ── Category Tabs ─────────────────────────────
function renderCategoryTabs() {
    const menu = getMenu();
    const cats = ['All', ...new Set(menu.map(m => m.category))];
    const container = document.getElementById('catTabs');
    container.innerHTML = cats.map((c, i) =>
        `<button class="cat-tab${i === 0 ? ' active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    container.querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMenu(btn.dataset.cat, document.getElementById('searchInput').value);
        });
    });
}

// ── Render Menu ───────────────────────────────
function renderMenu(filterCat = 'All', search = '') {
    const menu = getMenu();
    const container = document.getElementById('menuContainer');
    const q = search.toLowerCase().trim();

    // Group by category
    const categories = {};
    menu.forEach(item => {
        if (filterCat !== 'All' && item.category !== filterCat) return;
        if (q && !item.name.toLowerCase().includes(q)) return;
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
    });

    if (Object.keys(categories).length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔍</div><p>No items found</p></div>`;
        return;
    }

    container.innerHTML = Object.entries(categories).map(([cat, items]) => `
    <div class="category-section">
      <div class="category-label">${cat}</div>
      <div class="menu-grid">
        ${items.map(item => menuCardHTML(item)).join('')}
      </div>
    </div>
  `).join('');

    // Add click listeners
    container.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => addToCart(card.dataset.id));
    });

    updateCartBadges();
}

function menuCardHTML(item) {
    const inCart = cart.find(c => c.item.id === item.id);
    const badge = inCart ? `<div class="menu-card__badge">${inCart.qty}</div>` : '';
    const imgEl = item.image
        ? `<img class="menu-card__img" src="${item.image}" alt="${item.name}" />`
        : `<div class="menu-card__placeholder">${item.name.charAt(0).toUpperCase()}</div>`;
    return `
    <div class="menu-card${inCart ? ' in-cart' : ''}" data-id="${item.id}">
      ${badge}
      ${imgEl}
      <div class="menu-card__name">${item.name}</div>
      <div class="menu-card__price">${item.price > 0 ? '₹' + item.price.toFixed(2) : '—'}</div>
    </div>
  `;
}

function handleSearch(e) {
    const activeCat = document.querySelector('.cat-tab.active')?.dataset.cat || 'All';
    renderMenu(activeCat, e.target.value);
}

// ── Cart Logic ────────────────────────────────
function addToCart(itemId) {
    const item = getMenu().find(m => m.id === itemId);
    if (!item) return;
    const existing = cart.find(c => c.item.id === itemId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ item, qty: 1 });
    }
    renderCart();
    updateCartBadges();
    showToast(`${item.name} added!`, 'success');
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.item.id !== itemId);
    renderCart();
    updateCartBadges();
}

function changeQty(itemId, delta) {
    const entry = cart.find(c => c.item.id === itemId);
    if (!entry) return;
    entry.qty = Math.max(1, entry.qty + delta);
    renderCart();
    updateCartBadges();
}

function setQty(itemId, val) {
    const entry = cart.find(c => c.item.id === itemId);
    if (!entry) return;
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) entry.qty = n;
    renderCart();
    updateCartBadges();
}

function clearCart() {
    if (cart.length === 0) return;
    if (!confirm('Clear all items from the cart?')) return;
    cart = [];
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    renderCart();
    updateCartBadges();
    showToast('Cart cleared', 'success');
}

// ── Render Cart ───────────────────────────────
function renderCart() {
    const container = document.getElementById('cartItems');
    const count = document.getElementById('cartCount');
    count.textContent = cart.reduce((s, c) => s + c.qty, 0);

    if (cart.length === 0) {
        container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon">🛒</div>
        <div class="cart-empty__text">Tap an item to add it to the cart</div>
      </div>`;
        updateTotals();
        return;
    }

    container.innerHTML = cart.map(({ item, qty }) => {
        const lineTotal = item.price * qty;
        return `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item__info">
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__price-unit">₹${item.price.toFixed(2)} each</div>
          <div class="cart-item__qty">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
            <input class="qty-val" type="number" min="1" value="${qty}"
              onchange="setQty('${item.id}', this.value)"
              onfocus="this.select()" />
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <button class="remove-btn" onclick="removeFromCart('${item.id}')" title="Remove">✕</button>
          <div class="cart-item__total">₹${lineTotal.toFixed(2)}</div>
        </div>
      </div>`;
    }).join('');

    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
    document.getElementById('subtotal').textContent = '₹' + subtotal.toFixed(2);
    document.getElementById('grandTotal').textContent = '₹' + subtotal.toFixed(2);
}

function updateCartBadges() {
    // Re-render badges on menu cards
    document.querySelectorAll('.menu-card').forEach(card => {
        const id = card.dataset.id;
        const entry = cart.find(c => c.item.id === id);
        // Update in-cart class
        card.classList.toggle('in-cart', !!entry);
        // Update badge
        let badge = card.querySelector('.menu-card__badge');
        if (entry) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'menu-card__badge';
                card.prepend(badge);
            }
            badge.textContent = entry.qty;
        } else if (badge) {
            badge.remove();
        }
    });
}

// ── Print Bill ────────────────────────────────
function printBill() {
    if (cart.length === 0) {
        showToast('Cart is empty!', 'error');
        return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();

    document.getElementById('pb-datetime').textContent = `Date: ${dateStr}  |  Time: ${timeStr}  |  Bill #${Date.now().toString().slice(-6)}`;
    document.getElementById('pb-customer').innerHTML =
        customerName
            ? `<strong>Customer:</strong> ${customerName}${customerPhone ? '<br><strong>📞 Phone:</strong> ' + customerPhone : ''}`
            : customerPhone
                ? `<strong>📞 Phone:</strong> ${customerPhone}`
                : '';

    const tbody = document.getElementById('pb-items');
    let total = 0;
    tbody.innerHTML = cart.map((c, i) => {
        const amt = c.item.price * c.qty;
        total += amt;
        return `<tr>
      <td>${i + 1}</td>
      <td>${c.item.name}</td>
      <td class="right">${c.qty}</td>
      <td class="right">₹${c.item.price.toFixed(2)}</td>
      <td class="right">₹${amt.toFixed(2)}</td>
    </tr>`;
    }).join('');
    document.getElementById('pb-total').textContent = '₹' + total.toFixed(2);

    // Save the bill to sales
    saveSale({
        items: cart.map(c => ({ name: c.item.name, id: c.item.id, qty: c.qty, price: c.item.price })),
        total,
        customer: customerName,
        phone: customerPhone
    });

    window.print();
}

// ── Toast ─────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = (type === 'success' ? '✅ ' : '❌ ') + message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}
