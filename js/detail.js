/**
 * detail.js — halaman detail unit.
 * Membaca ?id= dari URL, mencocokkan dengan data API, lalu merender
 * galeri, spesifikasi, simulasi kredit, dan mobil serupa.
 */

import { clearCarCache, fetchCars } from './api.js';
import {
  createStatePanel,
  initSite,
  renderCarCards,
  setCatalog,
  updateFavoriteUI,
} from './components.js';
import {
  attachImageFallback,
  FALLBACK_IMAGE,
  formatRupiah,
  getParam,
} from './utils.js';

const WHATSAPP_NUMBER = '6281234567890';
const FLAT_RATE = 0.075; // 7,5% per tahun (flat)

const statusMount = document.getElementById('detail-status');
const content = document.getElementById('detail-content');
const relatedSection = document.getElementById('related-section');
const relatedGrid = document.getElementById('related-grid');

const credit = { price: 0, dp: 30, tenor: 24 };

initSite();
loadDetail();

async function loadDetail() {
  renderSkeleton();
  content.hidden = true;
  relatedSection.hidden = true;

  const id = Number(getParam('id'));
  if (!Number.isFinite(id) || id <= 0) {
    showStatus(
      createStatePanel({
        title: 'Unit belum dipilih',
        description: 'Buka halaman ini dari katalog agar detail mobil dapat ditampilkan.',
        actionLabel: 'Lihat katalog',
        onAction: () => { window.location.href = 'katalog.html'; },
      })
    );
    return;
  }

  try {
    const cars = await fetchCars();
    setCatalog(cars);

    const car = cars.find((item) => item.id === id);
    if (!car) {
      showStatus(
        createStatePanel({
          title: 'Unit tidak ditemukan',
          description: 'Mobil ini mungkin sudah tidak ada di koleksi. Silakan pilih unit lain di katalog.',
          actionLabel: 'Kembali ke katalog',
          onAction: () => { window.location.href = 'katalog.html'; },
        })
      );
      return;
    }

    renderDetail(car, cars);
  } catch (error) {
    showStatus(
      createStatePanel({
        tone: 'error',
        title: 'Detail unit gagal dimuat',
        description: error?.message ?? 'Terjadi kesalahan tak terduga.',
        actionLabel: 'Coba lagi',
        onAction: () => {
          clearCarCache();
          loadDetail();
        },
      })
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Render                                                                    */
/* -------------------------------------------------------------------------- */

function renderDetail(car, cars) {
  statusMount.replaceChildren();
  content.hidden = false;

  document.title = `${car.nama} — Rakhawastu Motors`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute(
      'content',
      `${car.nama} tahun ${car.tahun}, ${car.transmisi}, ${car.bahanBakar}. Harga ${formatRupiah(car.harga)} di Rakhawastu Motors.`
    );
  }

  setText('detail-breadcrumb', car.namaSingkat || car.nama);
  setText('detail-title', car.nama);
  setText('detail-subtitle', `Kode unit #${car.id} · Koleksi Rakhawastu Motors`);

  const badge = document.getElementById('detail-badge');
  badge.textContent = car.statusLabel;
  badge.className = `badge ${car.status === 'sold' ? 'badge--muted' : 'badge--accent'}`;

  setText('detail-brand', car.brand);
  setText('detail-year', String(car.tahun ?? '—'));
  setText('detail-price', formatRupiah(car.harga));

  const image = document.getElementById('detail-image');
  image.src = car.foto || FALLBACK_IMAGE;
  image.alt = `${car.nama} — tampak eksterior`;
  image.fetchPriority = 'high';
  attachImageFallback(image);

  renderDescription(car);
  renderSpecs(car);
  setupCta(car);
  setupFavorite(car);
  setupCredit(car);
  renderRelated(car, cars);
}

function renderDescription(car) {
  const container = document.getElementById('detail-desc');
  container.replaceChildren();

  const paragraphs = [
    `${car.nama} adalah unit tahun ${car.tahun ?? '—'} dengan transmisi ${car.transmisi} dan bahan bakar ${car.bahanBakar}. Unit ini berada langsung di showroom Rakhawastu Motors dan dapat dilihat tanpa perantara.`,
    `Status unit saat ini ${car.statusLabel.toLowerCase()} dengan harga penawaran ${formatRupiah(car.harga)}. Harga tersebut belum termasuk biaya administrasi, asuransi, dan proses balik nama.`,
    'Setiap unit yang kami jual melewati pemeriksaan kondisi dan kelengkapan dokumen. Tim kami akan menunjukkan hasil pemeriksaan secara terbuka sebelum Anda memutuskan.',
  ];

  paragraphs.forEach((text) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    container.append(paragraph);
  });
}

function renderSpecs(car) {
  const specs = [
    ['Merek', car.brand, 'tag'],
    ['Tahun', String(car.tahun ?? '—'), 'calendar'],
    ['Transmisi', car.transmisi, 'gear'],
    ['Bahan bakar', car.bahanBakar, 'fuel'],
    ['Status unit', car.statusLabel, 'check'],
    ['Kode unit', `#${car.id}`, 'hash'],
  ];

  const grid = document.getElementById('detail-specs');
  grid.replaceChildren();

  specs.forEach(([label, value, icon]) => {
    const item = document.createElement('div');
    item.className = 'spec-grid__item';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'spec-grid__icon';
    iconWrap.innerHTML = ICONS[icon] ?? '';

    const labelNode = document.createElement('span');
    labelNode.className = 'spec-grid__label';
    labelNode.textContent = label;

    const valueNode = document.createElement('span');
    valueNode.className = 'spec-grid__value';
    valueNode.textContent = value;

    item.append(iconWrap, labelNode, valueNode);
    grid.append(item);
  });
}

function setupCta(car) {
  const cta = document.getElementById('detail-cta');
  const sold = car.status === 'sold';

  const message = sold
    ? `Halo Rakhawastu Motors, unit ${car.nama} sudah terjual. Saya ingin melihat unit serupa.`
    : `Halo Rakhawastu Motors, saya ingin menjadwalkan test drive untuk ${car.nama} (kode #${car.id}).`;

  cta.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  cta.textContent = sold ? 'Tanya unit serupa' : 'Jadwalkan test drive';
  cta.target = '_blank';
  cta.rel = 'noopener noreferrer';
}

function setupFavorite(car) {
  const button = document.getElementById('detail-fav');
  if (!button) return;
  button.dataset.id = String(car.id);
  button.dataset.name = car.nama;
  updateFavoriteUI();
}

/* -------------------------------------------------------------------------- */
/*  Simulasi kredit                                                           */
/* -------------------------------------------------------------------------- */

function setupCredit(car) {
  credit.price = car.harga;

  const dpInput = document.getElementById('credit-dp');
  const tenorSelect = document.getElementById('credit-tenor');

  credit.dp = Number(dpInput.value);
  credit.tenor = Number(tenorSelect.value);

  dpInput.addEventListener('input', () => {
    credit.dp = Number(dpInput.value);
    updateCredit();
  });

  tenorSelect.addEventListener('change', () => {
    credit.tenor = Number(tenorSelect.value);
    updateCredit();
  });

  updateCredit();
}

function updateCredit() {
  const dpAmount = (credit.price * credit.dp) / 100;
  const principal = credit.price - dpAmount;
  const totalDebt = principal * (1 + FLAT_RATE * (credit.tenor / 12));
  const monthly = credit.tenor > 0 ? totalDebt / credit.tenor : 0;

  setText('credit-monthly', credit.price ? formatRupiah(Math.round(monthly / 1000) * 1000) : '—');
  setText('credit-dp-value', `${credit.dp}%`);
  setText('credit-price', formatRupiah(credit.price));
  setText('credit-dp-amount', formatRupiah(dpAmount));
  setText('credit-principal', formatRupiah(principal));

  updateRangeFill();
}

/** Mengisi variabel CSS --range-progress agar track slider terlihat terisi. */
function updateRangeFill() {
  const dpInput = document.getElementById('credit-dp');
  if (!dpInput) return;

  const min = Number(dpInput.min) || 0;
  const max = Number(dpInput.max) || 100;
  const value = Number(dpInput.value) || min;
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;

  dpInput.style.setProperty('--range-progress', `${progress}%`);
}

/* -------------------------------------------------------------------------- */
/*  Mobil serupa                                                              */
/* -------------------------------------------------------------------------- */

function renderRelated(car, cars) {
  const others = cars.filter((item) => item.id !== car.id);
  const scored = others
    .map((item) => ({
      car: item,
      // Unit tersedia lebih relevan, lalu kesamaan merek dan bahan bakar.
      score: (item.status === 'tersedia' ? 4 : 0)
        + (item.brand === car.brand ? 2 : 0)
        + (item.bahanBakar === car.bahanBakar ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.car.harga - a.car.harga);

  const related = scored.slice(0, 3).map((entry) => entry.car);

  if (!related.length) {
    relatedSection.hidden = true;
    return;
  }

  renderCarCards(relatedGrid, related);
  relatedSection.hidden = false;
}

/* -------------------------------------------------------------------------- */
/*  State & skeleton                                                          */
/* -------------------------------------------------------------------------- */

function renderSkeleton() {
  statusMount.innerHTML = `
    <div class="detail-skeleton" aria-hidden="true">
      <div class="detail-skeleton__main">
        <span class="skeleton skeleton--line skeleton--short"></span>
        <span class="skeleton skeleton--line skeleton--title"></span>
        <span class="skeleton skeleton--hero"></span>
        <span class="skeleton skeleton--line"></span>
        <span class="skeleton skeleton--line skeleton--short"></span>
      </div>
      <div class="detail-skeleton__side">
        <span class="skeleton skeleton--panel"></span>
      </div>
    </div>`;
}

function showStatus(panel) {
  statusMount.replaceChildren(panel);
  content.hidden = true;
  relatedSection.hidden = true;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

/* -------------------------------------------------------------------------- */
/*  Ikon inline (konstan, bukan data dari API)                                */
/* -------------------------------------------------------------------------- */

const ICONS = {
  tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  fuel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M14 9h2a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L19 6"/><line x1="3" y1="22" x2="14" y2="22"/><rect x="5" y="10" width="6" height="4" rx="1"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  hash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
};
