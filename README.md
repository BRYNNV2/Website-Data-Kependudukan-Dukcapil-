# 🇮🇩 Sistem Informasi Data Kependudukan (SI-PENDUDUK)

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/React-18-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8) ![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e)

Sistem Informasi Data Kependudukan adalah aplikasi web modern yang dirancang untuk membantu Dinas Kependudukan dan Pencatatan Sipil (Dukcapil) dalam mengelola data administrasi kependudukan secara efisien, aman, dan digital.

## ✨ Fitur Unggulan

### 1. 📊 Dashboard Interaktif
Memberikan ringkasan visual data kependudukan secara *real-time*, termasuk statistik pertumbuhan penduduk, jumlah kartu keluarga, dan grafik surat keterangan.

### 2. 📂 Manajemen Data Lengkap
Aplikasi ini mendukung input, edit, dan manajemen data untuk berbagai dokumen kependudukan:
*   **Kartu Keluarga (KK)**
*   **KTP Elektronik**
*   **Akta Kelahiran**
*   **Akta Kematian**
*   **Akta Perkawinan**
*   **Akta Perceraian**

### 3. 🛡️ Keamanan & Safety Net (Recycle Bin)
Fitur **Anti-Hapus Tidak Sengaja**! Data yang dihapus tidak langsung hilang, melainkan masuk ke **"Tempat Sampah" (Recycle Bin)**.
*   **Soft Delete**: Data hanya ditandai terhapus.
*   **Restore**: Kembalikan data yang tidak sengaja terhapus dengan satu klik.
*   **Hapus Permanen**: Opsi untuk membersihkan data selamanya jika benar-benar tidak dibutuhkan.

### 4. 📈 Import & Export Excel Massal
Mempermudah migrasi dan pelaporan data.
*   **Import Excel**: Upload ratusan data sekaligus dari file `.xlsx`.
*   **Export Excel**: Download laporan data dalam format Excel yang rapi.

### 5. 🖨️ Cetak Laporan PDF
Setiap kategori data dapat dicetak langsung menjadi laporan PDF resmi dengan format tabel standar dinas.

### 6. 🌐 Peta Persebaran (GIS Lite)
Visualisasi lokasi tempat tinggal penduduk (Latitude/Longitude) untuk pemetaan demografis sederhana.

### 7. 🔍 Global Smart Search (Google-Style)
Pencarian super cepat di seluruh database (KTP, KK, Akta, dll) tanpa reload halaman.
*   **Autocomplete**: Hasil muncul seketika saat mengetik.
*   **Smart Link**: Klik hasil pencarian langsung membuka detail data dan **otomatis memfilter** tabel di halaman tujuan.

### 8. 💾 Backup Data Aman (JSON)
Fitur penyelamatan data (Disaster Recovery) yang memungkinkan administrator mengunduh cadangan seluruh database dalam format JSON yang terstruktur dan aman.
*   **Backup Full System**: Satu klik untuk mengamankan semua tabel.
*   **Backup Parsial**: Download per kategori data (misal: hanya Akta Kelahiran).

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend**: React + Vite (TypeScript)
*   **Styling**: Tailwind CSS + Shadcn/UI
*   **Backend / Database**: Supabase (PostgreSQL)
*   **Icons**: Lucide React
*   **Utilities**:
    *   `xlsx` (Manipulasi Excel)
    *   `jspdf` & `jspdf-autotable` (Generate PDF)
    *   `react-router-dom` (Navigasi)

---

## 🚀 Cara Menjalankan Project

### Prasyarat
*   Node.js (versi 18 atau terbaru)
*   Akun Supabase (untuk database)

### Instalasi & Setup

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username-anda/si-penduduk.git
    cd si-penduduk
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Buat file `.env` di root project dan isi dengan kredensial Supabase Anda:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Buka browser di `http://localhost:5173`.

---

## 📸 Tampilan Aplikasi
<img width="1900" height="911" alt="image" src="https://github.com/user-attachments/assets/e829e626-e7be-43e6-845b-c202cea543f1" />



---

## 📝 Catatan Pengembang (Developer Notes)

*   **Database Schema**: Script SQL untuk setup tabel dan fitur *soft delete* tersedia di folder `src/lib/*.sql` (File ini di-ignore oleh git untuk keamanan).
*   **Avatar Storage**: Menggunakan Supabase Storage bucket `avatars` (Public).

---

## 🤝 Kontribusi

Project ini dikembangkan untuk tujuan magang/praktik kerja lapangan oleh Muhammad Febri Yansah Mahasiswa Universitas Maritim Raja Ali Haji. Saran dan masukan sangat diapresiasi!

---
2026 © SI-PENDUDUK Dukcapil.
