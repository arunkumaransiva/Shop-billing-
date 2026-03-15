// ───────────────────────────────────────────────
//  REPORT.JS  – Monthly Sales Report Logic
// ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    populateYears();
    setCurrentMonth();
    loadReport();
});

function populateYears() {
    const sel = document.getElementById('yearSel');
    const now = new Date();
    for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) {
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        sel.appendChild(opt);
    }
}

function setCurrentMonth() {
    const now = new Date();
    document.getElementById('monthSel').value = now.getMonth();
    document.getElementById('yearSel').value = now.getFullYear();
}

// ── Load & Render Report ──────────────────────
function loadReport() {
    const month = parseInt(document.getElementById('monthSel').value, 10);
    const year = parseInt(document.getElementById('yearSel').value, 10);
    const bills = getSalesByMonth(year, month);

    renderStats(bills);
    renderChart(bills, year, month);
    renderBillsTable(bills);
}

// ── Stats ─────────────────────────────────────
function renderStats(bills) {
    const total = bills.reduce((s, b) => s + b.total, 0);
    const allItems = bills.flatMap(b => b.items);
    const totalQty = allItems.reduce((s, i) => s + (i.qty || 1), 0);

    // Top item by qty
    const qtyMap = {};
    allItems.forEach(i => { qtyMap[i.name] = (qtyMap[i.name] || 0) + (i.qty || 1); });
    const topEntry = Object.entries(qtyMap).sort((a, b) => b[1] - a[1])[0];

    document.getElementById('statRevenue').textContent = '₹' + total.toFixed(2);
    document.getElementById('statBills').textContent = bills.length;
    document.getElementById('statItems').textContent = totalQty;
    document.getElementById('statTop').textContent = topEntry ? `${topEntry[0]} (${topEntry[1]})` : '—';
}

// ── Chart ─────────────────────────────────────
function renderChart(bills, year, month) {
    const canvas = document.getElementById('salesChart');
    const ctx = canvas.getContext('2d');

    // Days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyTotals = Array(daysInMonth).fill(0);

    bills.forEach(b => {
        const day = new Date(b.date).getDate() - 1;
        if (day >= 0 && day < daysInMonth) dailyTotals[day] += b.total;
    });

    // Draw
    const W = canvas.offsetWidth || 800;
    const H = 200;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...dailyTotals, 1);
    const barW = (W - 40) / daysInMonth;
    const barGap = barW * 0.2;

    // Gridlines
    ctx.strokeStyle = '#333d55';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = H - (i / 4) * (H - 24) - 4;
        ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 4, y); ctx.stroke();
        ctx.fillStyle = '#596480'; ctx.font = '10px Inter';
        ctx.fillText('₹' + Math.round(maxVal * i / 4), 2, y + 4);
    }

    // Bars
    dailyTotals.forEach((val, i) => {
        const x = 34 + i * barW + barGap / 2;
        const bH = val > 0 ? Math.max(4, ((val / maxVal) * (H - 28))) : 0;
        const y = H - bH - 4;

        const grad = ctx.createLinearGradient(0, y, 0, H);
        grad.addColorStop(0, '#f5c842');
        grad.addColorStop(1, '#e8a80055');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW - barGap, bH, [4, 4, 0, 0]);
        ctx.fill();

        // Day label
        if (daysInMonth <= 31) {
            ctx.fillStyle = '#596480'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
            ctx.fillText(i + 1, x + (barW - barGap) / 2, H);
        }
    });
}

// ── Bills Table ───────────────────────────────
function renderBillsTable(bills) {
    const tbody = document.getElementById('billsTableBody');

    if (bills.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text3);">No bills found for this period</td></tr>`;
        return;
    }

    // Sort newest first
    const sorted = [...bills].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map(bill => {
        const d = new Date(bill.date);
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const itemsSummary = bill.items.map(i => `${i.name}${i.qty > 1 ? ' ×' + i.qty : ''}`).join(', ');
        return `
      <tr>
        <td style="white-space:nowrap;">${dateStr} ${timeStr}</td>
        <td style="color:var(--text2);">${bill.customer || '—'}</td>
        <td style="font-size:0.8rem;color:var(--text2);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${itemsSummary}">${itemsSummary}</td>
        <td class="text-gold fw-bold">₹${bill.total.toFixed(2)}</td>
      </tr>`;
    }).join('');
}

// ── Export CSV ────────────────────────────────
function exportCSV() {
    const month = parseInt(document.getElementById('monthSel').value, 10);
    const year = parseInt(document.getElementById('yearSel').value, 10);
    const bills = getSalesByMonth(year, month);

    if (bills.length === 0) { showToast('No data to export', 'error'); return; }

    const monthName = new Date(year, month).toLocaleString('en-IN', { month: 'long' });
    let csv = 'Date,Time,Customer,Phone,Items,Total\n';

    bills.forEach(b => {
        const d = new Date(b.date);
        const dateStr = d.toLocaleDateString('en-IN');
        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const items = b.items.map(i => `${i.name}${i.qty > 1 ? ' x' + i.qty : ''}`).join('; ');
        csv += `"${dateStr}","${timeStr}","${b.customer || ''}","${b.phone || ''}","${items}","${b.total.toFixed(2)}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ArunachalaKadai_${monthName}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('CSV exported!', 'success');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = (type === 'success' ? '✅ ' : '❌ ') + message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}
