/**
 * api.js — satu-satunya pintu keluar menuju API panitia.
 * Semua halaman memakai fungsi ini supaya penanganan error dan
 * normalisasi data tidak ditulis berulang.
 */

const API_URL = 'https://api-web.dnccudinus.org/api/mobil';

/** Error khusus supaya UI bisa membedakan masalah jaringan dan masalah data. */
export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.cause = options.cause;
  }
}

let cache = null;
let inFlight = null;

/**
 * Mengambil daftar mobil dari endpoint resmi.
 * @param {{ force?: boolean, signal?: AbortSignal }} options
 * @returns {Promise<Array<object>>}
 */
export async function fetchCars({ force = false, signal } = {}) {
  if (cache && !force) return cache;
  if (inFlight && !force) return inFlight;

  inFlight = (async () => {
    let response;

    try {
      response = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
        signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError('Tidak dapat menghubungi server. Periksa koneksi internet Anda.', { cause: error });
    }

    if (!response.ok) {
      throw new ApiError(`Server mengembalikan status ${response.status}. Coba beberapa saat lagi.`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new ApiError('Respons server bukan JSON yang valid.', { cause: error });
    }

    if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
      throw new ApiError('Format data dari server tidak sesuai.');
    }

    cache = payload.data.map(normalizeCar).filter(Boolean);
    return cache;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/** Membersihkan data mentah API menjadi bentuk yang konsisten untuk UI. */
function normalizeCar(raw) {
  if (!raw || raw.id == null) return null;

  const brand = String(raw.brand ?? '').trim();
  const fullName = String(raw.nama ?? '').trim();
  const price = Number(raw.harga) || 0;
  const status = String(raw.status ?? '').toLowerCase() === 'sold' ? 'sold' : 'tersedia';

  // "Toyota Fortuner 2.8 ..." -> "Fortuner 2.8 ..." agar judul kartu tidak mengulang merek.
  // Model bernama angka ("Mazda 3 Hatchback") tetap memakai nama lengkap supaya tidak rancu.
  const withoutBrand = brand && fullName.toLowerCase().startsWith(brand.toLowerCase())
    ? fullName.slice(brand.length).trim()
    : '';
  const namaSingkat = withoutBrand && !/^\d/.test(withoutBrand) ? withoutBrand : fullName;

  return {
    id: Number(raw.id),
    nama: fullName,
    namaSingkat,
    brand,
    harga: price,
    tahun: Number(raw.tahun) || null,
    transmisi: String(raw.transmisi ?? '-').trim(),
    bahanBakar: String(raw.bahan_bakar ?? '-').trim(),
    status,
    statusLabel: status === 'sold' ? 'Terjual' : 'Tersedia',
    foto: String(raw.foto ?? '').trim(),
    dibuat: raw.created_at ?? null,
  };
}

/** Dipakai tombol "Coba lagi" agar cache lama tidak dipakai. */
export function clearCarCache() {
  cache = null;
}
