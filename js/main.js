/**
 * main.js — halaman beranda.
 * Mengambil data sekali, lalu memakainya untuk hero, statistik,
 * kartu unggulan, dan daftar merek.
 */

import { clearCarCache, fetchCars } from './api.js';
import {
  createStatePanel,
  initSite,
  renderCarCards,
  renderSkeletons,
  setCatalog,
} from './components.js';
import { attachImageFallback, FALLBACK_IMAGE, formatRupiah } from './utils.js';

const featuredGrid = document.getElementById('featured-grid');
const featuredState = document.getElementById('featured-state');
const brandStrip = document.getElementById('brand-strip');

const heroImage = document.getElementById('hero-image');
const heroName = document.getElementById('hero-name');
const heroPrice = document.getElementById('hero-price');
const heroMeta = document.getElementById('hero-meta');

initSite();
loadHome();

async function loadHome() {
  renderSkeletons(featuredGrid, 6);
  hideState(featuredState);

  try {
    const cars = await fetchCars();
    setCatalog(cars);
    renderStats(cars);
    renderHero(cars);
    renderFeatured(cars);
    renderBrandStrip(cars);
  } catch (error) {
    renderFeaturedError(error);
    renderHeroFallback();
  }
}

/* -------------------------------------------------------------------------- */
/*  Statistik & hero                                                          */
/* -------------------------------------------------------------------------- */

function renderStats(cars) {
  const brands = new Set(cars.map((car) => car.brand));
  const available = cars.filter((car) => car.status === 'tersedia').length;

  setText('stat-units', String(cars.length));
  setText('stat-brands', String(brands.size));
  setText('stat-available', String(available));
}

function renderHero(cars) {
  const available = cars.filter((car) => car.status === 'tersedia');
  // Unit terbaru dipakai sebagai wajah beranda.
  const hero = [...available].sort((a, b) => b.id - a.id)[0] ?? cars[0];
  if (!hero) return;

  heroImage.src = hero.foto || FALLBACK_IMAGE;
  heroImage.alt = `${hero.nama} — unit unggulan Rakhawastu Motors`;
  attachImageFallback(heroImage);

  heroName.textContent = hero.nama;
  heroPrice.textContent = formatRupiah(hero.harga);
  heroMeta.textContent = `${hero.tahun ?? '—'} · ${hero.transmisi} · ${hero.bahanBakar}`;
}

function renderHeroFallback() {
  heroImage.src = FALLBACK_IMAGE;
  heroImage.alt = 'Ilustrasi mobil — foto belum tersedia';
  heroName.textContent = 'Data unit belum tersedia';
  heroPrice.textContent = 'Periksa koneksi lalu muat ulang halaman.';
  heroMeta.textContent = '';
}

/* -------------------------------------------------------------------------- */
/*  Unggulan & merek                                                          */
/* -------------------------------------------------------------------------- */

function renderFeatured(cars) {
  const featured = cars
    .filter((car) => car.status === 'tersedia')
    .sort((a, b) => b.id - a.id)
    .slice(0, 6);

  if (!featured.length) {
    featuredGrid.replaceChildren();
    showState(
      featuredState,
      createStatePanel({
        title: 'Belum ada unit unggulan',
        description: 'Saat ini semua unit sedang terjual. Silakan cek katalog secara berkala.',
        actionLabel: 'Muat ulang',
        onAction: () => loadHome(),
      })
    );
    return;
  }

  renderCarCards(featuredGrid, featured);
}

function renderBrandStrip(cars) {
  if (!brandStrip) return;

  const brands = [...new Set(cars.map((car) => car.brand))].sort((a, b) => a.localeCompare(b));
  brandStrip.replaceChildren();

  brands.forEach((brand) => {
    const link = document.createElement('a');
    link.className = 'brand-strip__item';
    link.href = `katalog.html?brand=${encodeURIComponent(brand)}`;
    link.setAttribute('aria-label', `Lihat mobil merek ${brand}`);

    const name = document.createElement('span');
    name.className = 'brand-strip__name';
    name.textContent = brand;

    link.append(name);
    brandStrip.append(link);
  });
}

function renderFeaturedError(error) {
  featuredGrid.replaceChildren();
  featuredGrid.setAttribute('aria-busy', 'false');
  showState(
    featuredState,
    createStatePanel({
      tone: 'error',
      title: 'Gagal memuat data mobil',
      description: error?.message ?? 'Terjadi kesalahan tak terduga.',
      actionLabel: 'Coba lagi',
      onAction: () => {
        clearCarCache();
        loadHome();
      },
    })
  );
}

/* -------------------------------------------------------------------------- */
/*  Helper kecil                                                              */
/* -------------------------------------------------------------------------- */

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function showState(mount, panel) {
  mount.replaceChildren(panel);
  mount.hidden = false;
}

function hideState(mount) {
  mount.replaceChildren();
  mount.hidden = true;
}
