/**
 * katalog.js — pencarian, filter, dan pengurutan di sisi klien.
 * Data diambil satu kali, lalu semua interaksi bekerja pada array lokal.
 */

import { clearCarCache, fetchCars } from './api.js';
import {
  createStatePanel,
  initSite,
  renderCarCards,
  renderSkeletons,
  setCatalog,
} from './components.js';
import { debounce, getParam, setParams } from './utils.js';

const grid = document.getElementById('catalog-grid');
const stateMount = document.getElementById('catalog-state');
const countLabel = document.getElementById('result-count');
const chipsMount = document.getElementById('active-filters');
const searchInput = document.getElementById('search');
const resetButton = document.getElementById('reset-filters');

const controls = {
  brand: document.getElementById('filter-brand'),
  fuel: document.getElementById('filter-fuel'),
  transmission: document.getElementById('filter-transmission'),
  status: document.getElementById('filter-status'),
  sort: document.getElementById('filter-sort'),
};

const SORT_OPTIONS = ['terbaru', 'harga-asc', 'harga-desc', 'tahun-desc', 'nama-asc'];
const STATUS_OPTIONS = ['tersedia', 'sold'];

const state = {
  q: getParam('q') ?? '',
  brand: getParam('brand') ?? '',
  fuel: getParam('fuel') ?? '',
  transmission: getParam('transmission') ?? '',
  status: STATUS_OPTIONS.includes(getParam('status')) ? getParam('status') : '',
  sort: SORT_OPTIONS.includes(getParam('sort')) ? getParam('sort') : 'terbaru',
};

let allCars = [];

initSite();
loadCatalog();

async function loadCatalog() {
  renderSkeletons(grid, 6);
  countLabel.textContent = 'Memuat data…';
  hideState();

  try {
    allCars = await fetchCars();
    setCatalog(allCars);
    populateFilters(allCars);
    syncControls();
    applyFilters();
  } catch (error) {
    grid.replaceChildren();
    grid.setAttribute('aria-busy', 'false');
    countLabel.textContent = 'Gagal memuat';
    showState(
      createStatePanel({
        tone: 'error',
        title: 'Katalog tidak dapat dimuat',
        description: error?.message ?? 'Terjadi kesalahan tak terduga.',
        actionLabel: 'Coba lagi',
        onAction: () => {
          clearCarCache();
          loadCatalog();
        },
      })
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Filter                                                                    */
/* -------------------------------------------------------------------------- */

function populateFilters(cars) {
  fillSelect(controls.brand, uniqueSorted(cars.map((car) => car.brand)), state.brand);
  fillSelect(controls.fuel, uniqueSorted(cars.map((car) => car.bahanBakar)), state.fuel);
  fillSelect(controls.transmission, uniqueSorted(cars.map((car) => car.transmisi)), state.transmission);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
}

function fillSelect(select, values, selected) {
  if (!select) return;
  const firstOption = select.options[0];
  select.replaceChildren(firstOption);

  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });

  // Nilai dari URL yang tidak ada di data tetap ditampilkan agar filter tidak "hilang".
  if (selected && !values.includes(selected)) {
    const option = document.createElement('option');
    option.value = selected;
    option.textContent = selected;
    select.append(option);
  }
}

function applyFilters() {
  const query = state.q.trim().toLowerCase();

  let result = allCars.filter((car) => {
    const haystack = `${car.nama} ${car.brand} ${car.bahanBakar} ${car.transmisi}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (state.brand && car.brand !== state.brand) return false;
    if (state.fuel && car.bahanBakar !== state.fuel) return false;
    if (state.transmission && car.transmisi !== state.transmission) return false;
    if (state.status && car.status !== state.status) return false;
    return true;
  });

  result = sortCars(result, state.sort);

  renderCarCards(grid, result);
  updateCount(result.length);
  renderChips();
  syncControls();
  syncUrl();

  if (!result.length) {
    showState(
      createStatePanel({
        title: 'Tidak ada mobil yang cocok',
        description: 'Coba hapus salah satu filter atau gunakan kata kunci yang lebih umum.',
        actionLabel: 'Reset semua filter',
        onAction: resetFilters,
      })
    );
  } else {
    hideState();
  }
}

function sortCars(cars, sort) {
  const sorted = [...cars];

  switch (sort) {
    case 'harga-asc':
      return sorted.sort((a, b) => a.harga - b.harga || a.nama.localeCompare(b.nama, 'id'));
    case 'harga-desc':
      return sorted.sort((a, b) => b.harga - a.harga || a.nama.localeCompare(b.nama, 'id'));
    case 'tahun-desc':
      return sorted.sort((a, b) => (b.tahun ?? 0) - (a.tahun ?? 0) || b.id - a.id);
    case 'nama-asc':
      return sorted.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    case 'terbaru':
    default:
      return sorted.sort((a, b) => b.id - a.id);
  }
}

function updateCount(shown) {
  if (!allCars.length) return;
  const label = shown === allCars.length
    ? `Menampilkan ${shown} unit`
    : `Menampilkan ${shown} dari ${allCars.length} unit`;
  countLabel.textContent = label;
}

/* -------------------------------------------------------------------------- */
/*  Chip filter aktif                                                         */
/* -------------------------------------------------------------------------- */

function renderChips() {
  if (!chipsMount) return;
  chipsMount.replaceChildren();

  const active = [
    ['q', state.q.trim() ? `“${state.q.trim()}”` : ''],
    ['brand', state.brand],
    ['fuel', state.fuel],
    ['transmission', state.transmission],
    ['status', state.status === 'tersedia' ? 'Tersedia' : state.status === 'sold' ? 'Terjual' : ''],
  ].filter(([, value]) => value);

  if (!active.length) {
    chipsMount.hidden = true;
    return;
  }

  chipsMount.hidden = false;

  active.forEach(([key, label]) => {
    const chip = document.createElement('span');
    chip.className = 'filter-chips__chip';

    const text = document.createElement('span');
    text.textContent = label;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'filter-chips__remove';
    remove.setAttribute('aria-label', `Hapus filter ${label}`);
    remove.innerHTML = '&times;';
    remove.addEventListener('click', () => {
      state[key] = '';
      if (key === 'q') searchInput.value = '';
      applyFilters();
    });

    chip.append(text, remove);
    chipsMount.append(chip);
  });
}

/* -------------------------------------------------------------------------- */
/*  Sinkronisasi kontrol & URL                                                */
/* -------------------------------------------------------------------------- */

function syncControls() {
  if (searchInput.value !== state.q) searchInput.value = state.q;
  controls.brand.value = state.brand;
  controls.fuel.value = state.fuel;
  controls.transmission.value = state.transmission;
  controls.status.value = state.status;
  controls.sort.value = state.sort;
}

function syncUrl() {
  setParams({
    q: state.q.trim(),
    brand: state.brand,
    fuel: state.fuel,
    transmission: state.transmission,
    status: state.status,
    sort: state.sort === 'terbaru' ? '' : state.sort,
  });
}

function resetFilters() {
  Object.assign(state, { q: '', brand: '', fuel: '', transmission: '', status: '', sort: 'terbaru' });
  searchInput.value = '';
  applyFilters();
  searchInput.focus();
}

/* -------------------------------------------------------------------------- */
/*  Event                                                                     */
/* -------------------------------------------------------------------------- */

const applySearch = debounce(applyFilters, 200);

// state.q diperbarui langsung supaya filter lain tidak memakai kata kunci lama
// saat pengguna mengetik lalu cepat mengganti dropdown.
searchInput?.addEventListener('input', () => {
  state.q = searchInput.value;
  applySearch();
});

Object.entries(controls).forEach(([key, select]) => {
  select?.addEventListener('change', () => {
    state[key] = select.value;
    applyFilters();
  });
});

resetButton?.addEventListener('click', resetFilters);

function showState(panel) {
  stateMount.replaceChildren(panel);
  stateMount.hidden = false;
}

function hideState() {
  stateMount.replaceChildren();
  stateMount.hidden = true;
}
