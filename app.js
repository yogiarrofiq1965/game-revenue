'use strict';

/* ===== Konstanta domain ===== */
const FEE = 1800;
const RATE = { first: 0.5, repeat: 0.4 };
const STORE = 'game-revenue-v1';

/* ===== State ===== */
const blank = () => ({ admins: [], members: [], costs: [], payout: 0, lock: null });
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? { ...blank(), ...JSON.parse(raw) } : blank();
  } catch { return blank(); }
}
const save = () => localStorage.setItem(STORE, JSON.stringify(state));
const id = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
const rp = n => 'Rp' + (n || 0).toLocaleString('id-ID');
const isLocked = () => state.lock !== null;

/* ===== Rumus murni ===== */
const salaryOf = m => Math.round(m.deposit * RATE[m.type]);

function metrics() {
  const gross = state.members.reduce((s, m) => s + m.deposit, 0);
  const salary = state.members.reduce((s, m) => s + salaryOf(m), 0);
  const ops = state.costs.reduce((s, c) => s + c.amount, 0);
  const fee = state.payout > 0 ? FEE : 0;
  return { gross, salary, ops, fee, net: gross - fee - ops - salary };
}

/* ===== Render ===== */
const $ = sel => document.querySelector(sel);
const setText = (sel, v) => { if($(sel)) $(sel).textContent = v; };

const charts = { deposit: null, composition: null };
const textColor = () => getComputedStyle(document.body).color;

function drawStats() {
  const m = state.lock || metrics();
  setText('#sGross', rp(m.gross));
  setText('#sFee', rp(m.fee));
  setText('#sOps', rp(m.ops));
  setText('#sSalary', rp(m.salary));
  setText('#sNet', rp(m.net));
  
  // Update teks di header HP
  setText('#mobileNet', rp(m.net)); 

  $('#lockBadge').classList.toggle('hidden', !isLocked());
  setText('#pageDate', new Date().toLocaleDateString('id-ID',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
}

function drawSalaryRows() {
  const rows = state.members.map(m => {
    const admin = state.admins.find(a => a.id === m.adminId);
    return `<tr>
      <td>${admin?.name ?? '—'}</td>
      <td>${m.name}</td>
      <td>${m.type === 'first' ? 'Deposit Pertama' : 'Redeposit'}</td>
      <td class="num">${rp(m.deposit)}</td>
      <td class="num">${rp(salaryOf(m))}</td>
    </tr>`;
  }).join('');
  $('#salaryRows').innerHTML = rows ||
    '<tr><td colspan="5" class="muted">Belum ada member.</td></tr>';
}

function drawReferral() {
  const adminOptions = state.admins.map(a =>
    `<option value="${a.id}">${a.name}</option>`).join('');
  
  $('#memberAdmin').innerHTML = 
    `<option value="" disabled ${state.admins.length ? '' : 'selected'}>-- Pilih Admin --</option>` + adminOptions;

  $('#referralList').innerHTML = state.admins.length
    ? state.admins.map(a => {
        const members = state.members.filter(m => m.adminId === a.id);
        const total = members.reduce((s, m) => s + m.deposit, 0);
        const rows = members.map(m => `
          <div class="member-row">
            <span class="member-name">${m.name}</span>
            <span class="member-type ${m.type}">
              ${m.type === 'first' ? 'Deposit Pertama' : 'Redeposit'}
            </span>
            <span class="muted">${rp(m.deposit)}</span>
            <span class="member-salary">${rp(salaryOf(m))}</span>
            <button class="mini" data-del-member="${m.id}">Hapus</button>
          </div>`).join('');
        return `<div class="ref-admin">
          <header>
            <strong>${a.name}</strong>
            <span>${members.length} member · ${rp(total)}
              <button class="mini" data-del-admin="${a.id}">Hapus admin</button>
            </span>
          </header>
          <div class="members">${rows || '<span class="muted">Belum ada member.</span>'}</div>
        </div>`;
      }).join('')
    : '<p class="muted">Belum ada admin referral.</p>';
}

function drawCosts() {
  const rows = state.costs.map(c => `<tr>
    <td>${c.desc}</td>
    <td class="num">${rp(c.amount)}</td>
    <td><button class="mini" data-del-cost="${c.id}">Hapus</button></td>
  </tr>`).join('');
  $('#costRows').innerHTML = rows ||
    '<tr><td colspan="3" class="muted">Belum ada biaya.</td></tr>';
}

function drawPayout() {
  $('#payoutCount').value = state.payout;
  setText('#payoutInfo',
    state.payout > 0
      ? `${state.payout}x pencairan · fee flat ${rp(FEE)}`
      : 'Belum ada pencairan hari ini.');
}

function drawCharts() {
  const m = state.lock || metrics();
  const color = textColor();
  const labels = state.admins.map(a => a.name);
  const data = state.admins.map(a =>
    state.members.filter(x => x.adminId === a.id)
      .reduce((s, x) => s + x.deposit, 0));

  charts.deposit?.destroy();
  charts.deposit = new Chart($('#chartDeposit'), {
    type: 'bar',
    data: { labels, datasets: [{
      data, borderRadius: 8,
      backgroundColor: 'rgba(56,189,248,.55)', borderColor: '#38bdf8', borderWidth: 1
    }]},
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color }, grid: { color: 'transparent' } },
        y: { ticks: { color }, grid: { color: 'rgba(148,163,184,.15)' } }
      }
    }
  });

  charts.composition?.destroy();
  charts.composition = new Chart($('#chartComposition'), {
    type: 'doughnut',
    data: {
      labels: ['Gaji Admin', 'Biaya Ops', 'Fee', 'Bersih'],
      datasets: [{
        data: [m.salary, m.ops, m.fee, Math.max(m.net, 0)],
        backgroundColor: ['#a855f7', '#f59e0b', '#f472b6', '#22c55e'],
        borderWidth: 0
      }]
    },
    options: { plugins: { legend: { labels: { color } } } }
  });
}

function render() {
  drawStats(); drawSalaryRows(); drawReferral();
  drawCosts(); drawPayout(); drawCharts();
}

/* ===== Navigasi & Tema ===== */
const PAGE_TITLE = {
  dashboard: 'Dashboard', referral: 'Referral
