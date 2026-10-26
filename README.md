# Rakhawastu Motors — BTNG Frontend

Website showroom mobil untuk **Tugas Akhir BTNG Kelas Frontend**. Dibangun dengan HTML5, CSS3, dan JavaScript native (vanilla), tanpa framework atau build tool apa pun.

**Demo langsung:** <https://nadeshin.github.io/BTNG-Frontend-DywaRusydiRakhawastu/>

Data mobil diambil langsung dari endpoint resmi panitia:

```
https://api-web.dnccudinus.org/api/mobil
```

## Fitur

- **Beranda dinamis** — unit unggulan, statistik koleksi, dan daftar merek dirender dari API.
- **Katalog** — pencarian (merek/model), filter merek, bahan bakar, transmisi, status, serta pengurutan harga/tahun/nama. Filter aktif ditampilkan sebagai chip yang bisa dihapus, dan state tersimpan di URL (bisa dibagikan).
- **Detail unit** — galeri, spesifikasi, deskripsi, status unit, CTA WhatsApp, dan mobil serupa.
- **Simulasi kredit** — DP 20–80%, tenor 12–60 bulan, bunga flat 7,5%/tahun, hasil dihitung langsung di browser.
- **Favorit** — disimpan di `localStorage`, bisa dibuka lewat panel samping dari ikon hati di header.
- **State lengkap** — skeleton loading, empty state, error state dengan tombol coba lagi, dan halaman "unit tidak ditemukan".
- **Responsif** — mobile-first, diuji pada 360 px, 390 px, 768 px, dan 1440 px.
- **Aksesibilitas** — HTML semantik, `aria-live` untuk hasil pencarian, `aria-pressed` pada favorit, focus ring, focus trap pada panel favorit, dukungan `prefers-reduced-motion`.

## Struktur proyek

```
BTNG-Frontend-DywaRusydiRakhawastu/
├── index.html            # Beranda
├── katalog.html          # Katalog + filter
├── detail.html           # Detail unit (?id=61)
├── css/
│   └── style.css         # Design token, komponen, section, responsif
├── js/
│   ├── api.js            # fetch(), normalisasi data, ApiError
│   ├── utils.js          # format Rupiah, debounce, favorit, toast
│   ├── components.js     # kartu, skeleton, state panel, header, panel favorit
│   ├── main.js           # Logika beranda
│   ├── katalog.js        # Logika katalog
│   └── detail.js         # Logika detail + simulasi kredit
├── assets/
│   └── favicon.svg
└── README.md
```

## Cara menjalankan

Karena data diambil dengan `fetch()` ke domain lain, buka proyek melalui server lokal (jangan double-click `index.html`).

```bash
# dari folder proyek
python3 -m http.server 8088
```

Lalu buka <http://localhost:8088>.

Alternatif: ekstensi Live Server di VS Code, atau deploy ke GitHub Pages.

## Integrasi API

`js/api.js` adalah satu-satunya tempat pemanggilan API:

1. `fetch()` dengan header `Accept: application/json` dan `AbortSignal` opsional.
2. Cek `response.ok`, lalu validasi `payload.success === true` dan `Array.isArray(payload.data)`.
3. Data dinormalisasi (harga → angka, status → `tersedia`/`sold`, nama pendek untuk judul kartu).
4. Hasil di-cache di memori agar perpindahan halaman tidak memanggil API berulang; tombol "Coba lagi" memaksa pengambilan ulang.

Field yang dipakai: `id`, `nama`, `brand`, `harga`, `tahun`, `transmisi`, `bahan_bakar`, `status`, `foto`.

Semua elemen data dirender lewat `document.createElement` dan `textContent` (bukan `innerHTML` untuk data API), sehingga aman dari injeksi HTML.

## Desain

Palet dari [ColorHunt](https://colorhunt.co/palette/e3f2fd90caf92196f30d47a1):

| Token | Warna | Penggunaan |
| --- | --- | --- |
| `--color-bg` | `#E3F2FD` | Latar halaman dan section terang |
| `--color-soft` | `#90CAF9` | Border, chip, aksen lembut, dekorasi |
| `--color-accent` | `#2196F3` | Ikon, garis, highlight besar |
| `--color-ink` | `#0D47A1` | Judul, teks utama, tombol primer, footer |

Kontras dijaga: tombol primer memakai `#0D47A1` dengan teks putih, bukan `#2196F3` dengan teks putih (rasio kontrasnya tidak cukup untuk teks kecil). Tipografi memakai **Plus Jakarta Sans** dengan fallback `system-ui`.

## Catatan

- Nomor WhatsApp `6281234567890` dan alamat showroom adalah data placeholder. Ganti di `js/detail.js`, `index.html`, dan footer setiap halaman bila ingin dipakai sungguhan.
- Foto unit berasal dari field `foto` API. Bila gambar gagal dimuat, website menampilkan placeholder SVG otomatis.
- Draft desain awal dibuat dengan bantuan Antigravity CLI, lalu dirapikan, disatukan class-nya, dan diintegrasikan dengan API secara manual.

## Penulis

**Dywa Rusydi Rakhawastu** — Tugas Akhir BTNG Kelas Frontend, 2026.
