// ───────────────────────────────────────────────
//  MENU.JS  – Menu CRUD Logic
// ───────────────────────────────────────────────

let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    populateCatFilter();
    renderMenuTable();

    document.getElementById('addItemBtn').addEventListener('click', () => openModal(null));
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalSaveBtn').addEventListener('click', handleSave);
    document.getElementById('menuSearch').addEventListener('input', renderMenuTable);
    document.getElementById('catFilter').addEventListener('change', renderMenuTable);

    // Close modal on overlay click
    document.getElementById('modalOverlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });
});

// ── Populate category filter ──────────────────
function populateCatFilter() {
    const menu = getMenu();
    const cats = [...new Set(menu.map(m => m.category))];
    const sel = document.getElementById('catFilter');
    sel.innerHTML = '<option value="All">All Categories</option>' +
        cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

// ── Render Table ──────────────────────────────
function renderMenuTable() {
    const menu = getMenu();
    const q = document.getElementById('menuSearch').value.toLowerCase().trim();
    const cat = document.getElementById('catFilter').value;
    const tbody = document.getElementById('menuTableBody');

    const filtered = menu.filter(m =>
        (cat === 'All' || m.category === cat) &&
        (!q || m.name.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3);">No items found</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => `
    <tr data-id="${item.id}">
      <td class="item-emoji-cell">
        ${item.image
            ? `<img class="item-img-thumb" src="${item.image}" alt="${item.name}" />`
            : `<div class="item-img-placeholder">${item.name.charAt(0).toUpperCase()}</div>`}
      </td>
      <td style="font-weight:600;">${item.name}</td>
      <td><span class="cat-badge">${item.category}</span></td>
      <td>
        <input class="price-input-sm" type="number" min="0" step="0.01"
          value="${item.price}" data-id="${item.id}"
          onchange="inlineUpdatePrice('${item.id}', this.value)"
          title="Edit price inline" />
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-sm btn-edit" onclick="openModal('${item.id}')">✏️ Edit</button>
          <button class="btn-sm btn-del"  onclick="handleDelete('${item.id}')">🗑️ Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Inline price update ───────────────────────
function inlineUpdatePrice(id, val) {
    const price = parseFloat(val);
    if (isNaN(price) || price < 0) return;
    updateMenuItem(id, { price });
    showToast('Price updated!', 'success');
}

// ── Modal ─────────────────────────────────────
function openModal(id) {
    editingId = id;
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = id ? 'Edit Item' : 'Add New Item';

    if (id) {
        const item = getMenu().find(m => m.id === id);
        if (!item) return;
        document.getElementById('fi-name').value = item.name;
        document.getElementById('fi-category').value = item.category;
        document.getElementById('fi-price').value = item.price;
        document.getElementById('fi-image').value = '';
    } else {
        document.getElementById('fi-name').value = '';
        document.getElementById('fi-category').value = 'Furniture';
        document.getElementById('fi-price').value = '';
        document.getElementById('fi-image').value = '';
    }

    overlay.style.display = 'flex';
    document.getElementById('fi-name').focus();
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    editingId = null;
}

async function handleSave() {
    const name = document.getElementById('fi-name').value.trim();
    const category = document.getElementById('fi-category').value;
    const price = parseFloat(document.getElementById('fi-price').value) || 0;
    const fileInput = document.getElementById('fi-image');

    if (!name) { showToast('Item name is required', 'error'); return; }

    let image = null;
    if (fileInput.files[0]) {
        image = await fileToBase64(fileInput.files[0]);
    } else if (editingId) {
        // keep existing image
        const existing = getMenu().find(m => m.id === editingId);
        image = existing?.image || null;
    }

    if (editingId) {
        updateMenuItem(editingId, { name, category, price, image });
        showToast('Item updated!', 'success');
    } else {
        addMenuItem({ name, category, price, image });
        showToast('Item added!', 'success');
    }

    closeModal();
    populateCatFilter();
    renderMenuTable();
}

function handleDelete(id) {
    const item = getMenu().find(m => m.id === id);
    if (!item) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    deleteMenuItem(id);
    showToast(`"${item.name}" deleted`, 'success');
    populateCatFilter();
    renderMenuTable();
}

// ── Helpers ───────────────────────────────────
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = (type === 'success' ? '✅ ' : '❌ ') + message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}
