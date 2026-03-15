// ───────────────────────────────────────────────
//  DATA.JS  – Shared localStorage helpers
// ───────────────────────────────────────────────

const DEFAULT_MENU = [
  // Furniture
  { id: 'char', name: 'சேர்', category: 'Furniture', price: 0, image: 'images/char.jpg' },
  { id: 'table', name: 'மேஜை', category: 'Furniture', price: 0, image: 'images/table.jpg' },
  { id: 'vali', name: 'வாலி', category: 'Furniture', price: 0, image: 'images/vali.jpg' },
  { id: 'annakudi', name: 'அண்ணாக்குடி', category: 'Furniture', price: 0, image: 'images/annakudi.jpg' },

  // Stoves
  { id: 'ii_adupu', name: 'II அடுப்பு', category: 'Stoves', price: 0, image: 'images/ii_adupu.jpg' },
  { id: 'i_adupu', name: 'I அடுப்பு', category: 'Stoves', price: 0, image: 'images/i_adupu.jpg' },
  { id: 'dosa_adupu', name: 'தோசை அடுப்பு', category: 'Stoves', price: 0, image: 'images/dosa_adupu.jpg' },

  // Vatta
  { id: 'vatta_50', name: 'வட்டா (50கி.கி)', category: 'Vatta', price: 0, image: 'images/vatta_50.jpg' },
  { id: 'vatta_40', name: 'வட்டா (40கி.கி)', category: 'Vatta', price: 0, image: 'images/vatta_40.jpg' },
  { id: 'vatta_20', name: 'வட்டா (20கி.கி)', category: 'Vatta', price: 0, image: 'images/vatta_20.jpg' },
  { id: 'vatta_15', name: 'வட்டா (15கி.கி)', category: 'Vatta', price: 0, image: 'images/vatta_15.jpg' },
  { id: 'vatta_10', name: 'வட்டா (10கி.கி)', category: 'Vatta', price: 0, image: 'images/vatta_10.jpg' },
  { id: 'vatta_5', name: 'வட்டா (5கி.கி)', category: 'Vatta', price: 0, image: 'images/vatta_5.jpg' },

  // Others
  { id: 'tea_ken', name: 'தேநீர் கேன்', category: 'Others', price: 0, image: 'images/tea_ken.jpg' },
  { id: 'jakku', name: 'ஜாக்கு', category: 'Others', price: 0, image: 'images/jakku.jpg' },
  { id: 'pechen', name: 'பேசன்', category: 'Others', price: 0, image: 'images/pechen.jpg' },

  // Koththu
  { id: 'koththu_i', name: 'கொத்து (I)', category: 'Koththu', price: 0, image: 'images/koththu_i.jpg' },
  { id: 'koththu_ii', name: 'கொத்து (II)', category: 'Koththu', price: 0, image: 'images/koththu_ii.jpg' },

  // Betchti
  { id: 'betchit', name: 'பெட்சிட்', category: 'Betchit', price: 0, image: 'images/betchti.jpg' },

  // Tent
  { id: 'tent_10x10', name: 'கூடாரம் 10×10', category: 'Tent', price: 0, image: 'images/tent_10x10.jpg' },
  { id: 'tent_10x12', name: 'கூடாரம் 10×12', category: 'Tent', price: 0, image: 'images/tent_10x12.jpg' },
  { id: 'tent_10x15', name: 'கூடாரம் 10×15', category: 'Tent', price: 0, image: 'images/tent_10x15.jpg' },
  { id: 'tent_15x20', name: 'கூடாரம் 15×20', category: 'Tent', price: 0, image: 'images/tent_15x20.jpg' },
  { id: 'tent_20x20', name: 'கூடாரம் 20×20', category: 'Tent', price: 0, image: 'images/tent_20x20.jpg' },
  { id: 'tent_20x30', name: 'கூடாரம் 20×30', category: 'Tent', price: 0, image: 'images/tent_20x30.jpg' },
  { id: 'tent_15x30', name: 'கூடாரம் 15×30', category: 'Tent', price: 0, image: 'images/tent_15x30.jpg' },

  // Marppu
  { id: 'marppu', name: 'மாற்பு', category: 'Marppu', price: 0, image: 'images/marppu.jpg' },
];

// ── Menu helpers ──────────────────────────────
function getMenu() {
  const raw = localStorage.getItem('ak_menu');
  if (raw) return JSON.parse(raw);
  saveMenu(DEFAULT_MENU);
  return DEFAULT_MENU;
}

function saveMenu(menu) {
  localStorage.setItem('ak_menu', JSON.stringify(menu));
}

function addMenuItem(item) {
  const menu = getMenu();
  item.id = 'item_' + Date.now();
  menu.push(item);
  saveMenu(menu);
  return item;
}

function updateMenuItem(id, updates) {
  const menu = getMenu().map(m => m.id === id ? { ...m, ...updates } : m);
  saveMenu(menu);
}

function deleteMenuItem(id) {
  const menu = getMenu().filter(m => m.id !== id);
  saveMenu(menu);
}

// ── Sales helpers ─────────────────────────────
function getSales() {
  const raw = localStorage.getItem('ak_sales');
  return raw ? JSON.parse(raw) : [];
}

function saveSale(bill) {
  const sales = getSales();
  bill.id = 'bill_' + Date.now();
  bill.date = new Date().toISOString();
  sales.push(bill);
  localStorage.setItem('ak_sales', JSON.stringify(sales));
  return bill;
}

function getSalesByMonth(year, month) {
  return getSales().filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}
