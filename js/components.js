/**
 * components.js — komponen UI yang dipakai di lebih dari satu halaman:
 * kartu mobil, skeleton, state panel, header/nav, dan panel favorit.
 */

import {
  attachImageFallback,
  FALLBACK_IMAGE,
  formatRupiah,
  getFavoriteIds,
  toggleFavorite,
  showToast,
} from './utils.js';

const HEART_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>`;

const ARROW_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>`;

const EMPTY_SVG = `
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.2" y2="16.2" />
  </svg>`;

const ERROR_SVG = `
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>`;

const TRASH_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>`;

/** Helper singkat pembuat elemen. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const detailUrl = (id) => `detail.html?id=${encodeURIComponent(id)}`;

/* -------------------------------------------------------------------------- */
/*  Kartu mobil                                                               */
/* -------------------------------------------------------------------------- */

export function createCarCard(car, index = 0) {
  const card = el('article', 'car-card');
  card.dataset.id = String(car.id);
  card.style.setProperty('--i', String(index));
  if (car.status === 'sold') card.classList.add('car-card--sold');

  /* --- Gambar + badge + tombol favorit --- */
  const imageWrap = el('div', 'car-card__image-wrap');

  const image = el('img', 'car-card__image');
  image.src = car.foto || FALLBACK_IMAGE;
  image.alt = `Foto ${car.nama}`;
  image.width = 600;
  image.height = 375;
  image.loading = index < 3 ? 'eager' : 'lazy';
  image.decoding = 'async';
  attachImageFallback(image);
  imageWrap.append(image);

  const badge = el(
    'span',
    `car-card__badge badge ${car.status === 'sold' ? 'badge--muted' : 'badge--accent'}`,
    car.statusLabel
  );
  imageWrap.append(badge);

  const favButton = el('button', 'car-card__fav js-fav');
  favButton.type = 'button';
  favButton.dataset.id = String(car.id);
  favButton.dataset.name = car.nama;
  favButton.setAttribute('aria-pressed', 'false');
  favButton.setAttribute('aria-label', `Simpan ${car.nama} ke favorit`);
  favButton.innerHTML = HEART_SVG;
  imageWrap.append(favButton);

  /* --- Isi kartu --- */
  const body = el('div', 'car-card__body');

  const meta = el('p', 'car-card__meta');
  meta.append(el('span', null, car.brand));
  meta.append(el('span', 'car-card__meta-dot'));
  meta.append(el('span', null, String(car.tahun ?? '—')));
  body.append(meta);

  const title = el('h3', 'car-card__title');
  const titleLink = el('a', 'car-card__title-link', car.namaSingkat || car.nama);
  titleLink.href = detailUrl(car.id);
  title.append(titleLink);
  body.append(title);

  const chips = el('div', 'car-card__chips');
  chips.append(el('span', 'chip', car.transmisi));
  chips.append(el('span', 'chip chip--ink', car.bahanBakar));
  body.append(chips);

  const price = el('p', 'car-card__price');
  price.append(el('span', 'car-card__price-label', 'Harga'));
  price.append(document.createTextNode(formatRupiah(car.harga)));
  body.append(price);

  /* --- Footer kartu --- */
  const footer = el('div', 'car-card__footer');
  const detailLink = el('a', 'car-card__detail-link', 'Lihat detail');
  detailLink.href = detailUrl(car.id);
  detailLink.insertAdjacentHTML('beforeend', ARROW_SVG);
  footer.append(detailLink);

  card.append(imageWrap, body, footer);
  return card;
}

export function renderCarCards(container, cars) {
  if (!container) return;
  container.replaceChildren(...cars.map((car, index) => createCarCard(car, index)));
  container.setAttribute('aria-busy', 'false');
}

export function createSkeletonCard() {
  const card = el('article', 'car-card car-card--skeleton');
  card.setAttribute('aria-hidden', 'true');

  const image = el('div', 'car-card__image-wrap skeleton skeleton--image');
  const body = el('div', 'car-card__body');
  body.append(
    el('span', 'skeleton skeleton--line skeleton--short'),
    el('span', 'skeleton skeleton--line skeleton--title'),
    el('span', 'skeleton skeleton--line'),
    el('span', 'skeleton skeleton--line skeleton--price')
  );

  card.append(image, body);
  return card;
}

export function renderSkeletons(container, count = 6) {
  if (!container) return;
  container.setAttribute('aria-busy', 'true');
  container.replaceChildren(...Array.from({ length: count }, createSkeletonCard));
}

/* -------------------------------------------------------------------------- */
/*  State panel (kosong / error)                                              */
/* -------------------------------------------------------------------------- */

export function createStatePanel({ title, description, actionLabel, onAction, tone = 'empty' }) {
  const panel = el('div', `empty-state${tone === 'error' ? ' empty-state--error' : ''}`);

  const icon = el('span', 'empty-state__icon');
  icon.innerHTML = tone === 'error' ? ERROR_SVG : EMPTY_SVG;
  icon.setAttribute('aria-hidden', 'true');

  panel.append(icon, el('h2', 'empty-state__title', title));
  if (description) panel.append(el('p', 'empty-state__desc', description));

  if (actionLabel && onAction) {
    const button = el('button', 'btn btn--primary', actionLabel);
    button.type = 'button';
    button.addEventListener('click', onAction);
    panel.append(button);
  }

  return panel;
}

/* -------------------------------------------------------------------------- */
/*  Favorit: panel samping                                                    */
/* -------------------------------------------------------------------------- */

let catalogCars = [];
let lastDrawerTrigger = null;

export function setCatalog(cars) {
  catalogCars = Array.isArray(cars) ? cars : [];
}

function buildDrawer() {
  const mount = document.getElementById('fav-drawer');
  if (!mount || mount.dataset.ready) return;

  mount.innerHTML = `
    <div class="fav-drawer" id="fav-drawer-panel" aria-hidden="true">
      <div class="fav-drawer__overlay" data-fav-close></div>
      <aside class="fav-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="fav-drawer-title">
        <header class="fav-drawer__header">
          <div>
            <p class="fav-drawer__eyebrow">Koleksi pribadi</p>
            <h2 class="fav-drawer__title" id="fav-drawer-title">Mobil favorit</h2>
          </div>
          <button type="button" class="fav-drawer__close" data-fav-close aria-label="Tutup panel favorit">&times;</button>
        </header>
        <div class="fav-drawer__body" id="fav-list"></div>
        <footer class="fav-drawer__footer">
          <a href="katalog.html" class="btn btn--primary">Jelajahi katalog</a>
        </footer>
      </aside>
    </div>`;
  mount.dataset.ready = 'true';
}

function renderFavoritesList() {
  const list = document.getElementById('fav-list');
  if (!list) return;

  const ids = getFavoriteIds();
  const cars = ids
    .map((id) => catalogCars.find((car) => car.id === id))
    .filter(Boolean);

  list.replaceChildren();

  if (!ids.length) {
    const empty = el('div', 'fav-empty');
    empty.innerHTML = `
      <span class="fav-empty__icon" aria-hidden="true">${HEART_SVG}</span>
      <p class="fav-empty__title">Belum ada mobil favorit</p>
      <p class="fav-empty__desc">Tekan ikon hati pada kartu mobil untuk menyimpannya di sini.</p>`;
    list.append(empty);
    return;
  }

  if (!cars.length) {
    list.append(el('p', 'fav-empty__desc', 'Memuat daftar favorit…'));
    return;
  }

  cars.forEach((car) => {
    const item = el('article', 'fav-item');

    const image = el('img', 'fav-item__image');
    image.src = car.foto || FALLBACK_IMAGE;
    image.alt = '';
    image.width = 96;
    image.height = 72;
    image.loading = 'lazy';
    attachImageFallback(image);

    const body = el('div', 'fav-item__body');
    const link = el('a', 'fav-item__title', car.namaSingkat || car.nama);
    link.href = detailUrl(car.id);
    body.append(link);
    body.append(el('p', 'fav-item__meta', `${car.brand} · ${car.tahun ?? '—'}`));
    body.append(el('p', 'fav-item__price', formatRupiah(car.harga)));

    const remove = el('button', 'fav-item__remove js-fav');
    remove.type = 'button';
    remove.dataset.id = String(car.id);
    remove.dataset.name = car.nama;
    remove.setAttribute('aria-pressed', 'true');
    remove.setAttribute('aria-label', `Hapus ${car.nama} dari favorit`);
    remove.innerHTML = TRASH_SVG;

    item.append(image, body, remove);
    list.append(item);
  });
}

export function openFavorites(trigger) {
  buildDrawer();
  const drawer = document.querySelector('.fav-drawer');
  if (!drawer) return;

  renderFavoritesList();
  lastDrawerTrigger = trigger ?? null;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-drawer');

  document.querySelectorAll('.js-open-favorites').forEach((btn) => btn.setAttribute('aria-expanded', 'true'));
  drawer.querySelector('.fav-drawer__close')?.focus();
}

export function closeFavorites() {
  const drawer = document.querySelector('.fav-drawer');
  if (!drawer || !drawer.classList.contains('is-open')) return;

  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('has-drawer');
  document.querySelectorAll('.js-open-favorites').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
  lastDrawerTrigger?.focus();
}

/* -------------------------------------------------------------------------- */
/*  Header, nav mobile, sinkronisasi favorit                                  */
/* -------------------------------------------------------------------------- */

function setYear() {
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

function toggleMobileNav(force) {
  const nav = document.getElementById('mobile-nav');
  const button = document.querySelector('.js-nav-toggle');
  if (!nav || !button) return;

  const open = typeof force === 'boolean' ? force : !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  nav.setAttribute('aria-hidden', String(!open));
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  document.body.classList.toggle('nav-open', open);
}

export function updateFavoriteUI() {
  const ids = getFavoriteIds();

  document.querySelectorAll('[data-fav-count]').forEach((node) => {
    node.textContent = String(ids.length);
    node.hidden = ids.length === 0;
  });

  document.querySelectorAll('.js-fav').forEach((button) => {
    const active = ids.includes(Number(button.dataset.id));
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    if (button.dataset.name) {
      button.setAttribute('aria-label', `${active ? 'Hapus' : 'Simpan'} ${button.dataset.name} ${active ? 'dari' : 'ke'} favorit`);
    }
  });

  const detailButton = document.querySelector('.js-fav-detail');
  if (detailButton && detailButton.dataset.id) {
    const active = ids.includes(Number(detailButton.dataset.id));
    detailButton.setAttribute('aria-pressed', String(active));
    const label = detailButton.querySelector('[data-fav-label]');
    if (label) label.textContent = active ? 'Tersimpan di favorit' : 'Simpan ke favorit';
  }
}

function handleFavoriteClick(button) {
  const id = Number(button.dataset.id);
  if (!Number.isFinite(id)) return;

  const added = toggleFavorite(id);
  const name = button.dataset.name || 'Mobil';
  showToast(added ? `${name} ditambahkan ke favorit.` : `${name} dihapus dari favorit.`);
  updateFavoriteUI();

  if (document.querySelector('.fav-drawer.is-open')) renderFavoritesList();
}

function onDocumentClick(event) {
  const navToggle = event.target.closest('.js-nav-toggle');
  if (navToggle) {
    toggleMobileNav();
    return;
  }

  const openButton = event.target.closest('.js-open-favorites');
  if (openButton) {
    event.preventDefault();
    openFavorites(openButton);
    return;
  }

  if (event.target.closest('[data-fav-close]')) {
    closeFavorites();
    return;
  }

  const favButton = event.target.closest('.js-fav');
  if (favButton) {
    event.preventDefault();
    handleFavoriteClick(favButton);
    return;
  }

  const detailFav = event.target.closest('.js-fav-detail');
  if (detailFav) {
    event.preventDefault();
    handleFavoriteClick(detailFav);
    return;
  }

  if (event.target.closest('#mobile-nav a')) toggleMobileNav(false);
}

function onKeydown(event) {
  trapDrawerFocus(event);
  if (event.key !== 'Escape') return;
  closeFavorites();
  toggleMobileNav(false);
}

/** Menahan fokus keyboard di dalam panel favorit selama panel terbuka. */
function trapDrawerFocus(event) {
  if (event.key !== 'Tab') return;

  const drawer = document.querySelector('.fav-drawer.is-open');
  if (!drawer) return;

  const focusable = [...drawer.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((node) => node.offsetParent !== null);

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** Dipanggil sekali di setiap halaman. */
export function initSite() {
  setYear();
  buildDrawer();
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('favorites:change', updateFavoriteUI);
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 640) toggleMobileNav(false);
  });
  updateFavoriteUI();
}
