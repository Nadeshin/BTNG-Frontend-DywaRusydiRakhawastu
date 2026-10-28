/**
 * utils.js — helper kecil yang dipakai lintas halaman.
 */

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const formatRupiah = (value) => rupiah.format(Number(value) || 0);

/** Batasi frekuensi pemanggilan (dipakai untuk input pencarian). */
export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Menulis state filter ke address bar tanpa menambah riwayat. */
export function setParams(params) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  });
  window.history.replaceState({}, '', url);
}

/** Placeholder SVG kalau foto dari API gagal dimuat. */
export const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" role="img" aria-label="Foto mobil tidak tersedia">
    <rect width="800" height="500" fill="#E3F2FD"/>
    <g fill="none" stroke="#90CAF9" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M190 300h420l-40-70a40 40 0 0 0-34-20H264a40 40 0 0 0-34 20z"/>
      <circle cx="285" cy="300" r="34"/>
      <circle cx="515" cy="300" r="34"/>
      <path d="M250 300h-30v-50h30M550 300h30v-50h-30"/>
    </g>
    <text x="400" y="400" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="22" fill="#0D47A1">Foto belum tersedia</text>
  </svg>
`)}`;

export function attachImageFallback(img) {
  if (!img || img.dataset.fallbackBound) return;
  img.dataset.fallbackBound = 'true';
  img.addEventListener(
    'error',
    () => {
      img.src = FALLBACK_IMAGE;
    },
    { once: true }
  );
}

/* -------------------------------------------------------------------------- */
/*  Favorit (localStorage)                                                    */
/* -------------------------------------------------------------------------- */

const FAV_KEY = 'dytransport:favorites';
let memoryFavorites = [];

function storageAvailable() {
  try {
    const probe = '__dytransport__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const hasStorage = storageAvailable();

export function getFavoriteIds() {
  if (!hasStorage) return [...memoryFavorites];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAV_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

function saveFavoriteIds(ids) {
  memoryFavorites = ids;
  if (hasStorage) {
    try {
      window.localStorage.setItem(FAV_KEY, JSON.stringify(ids));
    } catch {
      /* kuota penuh / mode privat: tetap jalan di memori */
    }
  }
  window.dispatchEvent(new CustomEvent('favorites:change', { detail: { ids } }));
}

export const isFavorite = (id) => getFavoriteIds().includes(Number(id));

/** @returns {boolean} true kalau unit barusan ditambahkan. */
export function toggleFavorite(id) {
  const numericId = Number(id);
  const ids = getFavoriteIds();
  const exists = ids.includes(numericId);
  const next = exists ? ids.filter((item) => item !== numericId) : [...ids, numericId];
  saveFavoriteIds(next);
  return !exists;
}

/* -------------------------------------------------------------------------- */
/*  Toast                                                                     */
/* -------------------------------------------------------------------------- */

let toastTimer;
export function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}
