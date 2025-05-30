# Mindfulness Chatbot

## Deskripsi Proyek

Mindfulness adalah sebuah chatbot interaktif yang dirancang untuk membantu mahasiswa dalam menghadapi tantangan kesehatan mental. Proyek ini bertujuan menyediakan ruang aman, privat, dan suportif melalui teknologi Natural Language Processing (NLP), di mana pengguna dapat mengekspresikan perasaannya dan mendapatkan respons yang empatik serta relevan.

## Fitur Utama

- **Otentikasi Pengguna**
  - Registrasi akun baru
  - Login dan logout pengguna
  - Fitur lupa dan reset password

- **Chatbot Interaktif**
  - Antarmuka chat real-time dengan AI
  - Mendukung pengiriman pesan teks dan emoji
  - Pemfilteran kata-kata terlarang
  - Interupsi saat respons sedang diproses jika ada pesan baru

- **Manajemen Sesi Chat**
  - Penyimpanan riwayat chat berbasis local storage
  - Membuat dan mengelola sesi percakapan
  - Melanjutkan sesi sebelumnya
  - Hapus riwayat sesi

Team & Kontribusi

- **Halaman Informasi**
  - Beranda interaktif dengan slideshow dan testimoni otomatis
  - Halaman "Tentang Kami" berisi informasi tim dan sistem klasifikasi chatbot

## Teknologi yang Digunakan

### Frontend

- **React (Vite)** – framework utama pengembangan antarmuka pengguna
- **Tailwind CSS** – styling cepat dan responsif
- **React Router DOM** – navigasi multi-halaman
- **React Hook Form + Yup** – validasi dan manajemen form
- **Axios** – koneksi HTTP ke backend
- **Lucide React** – ikon UI
- **Emoji-Picker-React** – dukungan input emoji

### Backend (Node.js & Express.js)

- **Express.js** – framework API
- **Prisma ORM** – integrasi database PostgreSQL
- **Supabase** – penyedia database berbasis PostgreSQL
- **Bcrypt.js** – enkripsi password
- **JWT (JSON Web Token)** – autentikasi pengguna
- **Dotenv & CORS** – konfigurasi variabel lingkungan dan cross-origin

### Backend AI (Python & Flask)

- **Flask** – API untuk menjalankan model AI
- **Transformers (Hugging Face)** – model IndoBERT untuk respons natural
- **FAISS** – pencarian vektor cepat untuk similarity
- **TensorFlow** – backend model IndoBERT
- **NumPy, Pandas, NLTK** – manipulasi dan preprocessing data

## Struktur Proyek

```
mindfulness-project/
├── Backend/                          # Backend Express.js
│   ├── apps/                         # Logika API (controllers, services)
│   ├── prisma/                       # Skema Prisma dan file migrasi
│   ├── routes/                       # Rute API
│   ├── index.js                      # Entry point server
│   └── .env                          # Variabel lingkungan backend
│
├── DATASET NLP/                      # Backend Python (Flask AI)
│   ├── model/                        # Model IndoBERT dan corpus
│   ├── scripts/                      # Preprocessing, translasi, dll.
│   ├── main.py                       # Server Flask utama
│   └── requirements.txt              # Dependensi Python
│
├── Frontend/                         # Frontend React (Vite)
│   ├── src/
│   │   ├── api/                      # Interaksi dengan backend
│   │   ├── assets/                   # Gambar, ikon, dan aset statis
│   │   ├── pages/                    # Komponen halaman aplikasi
│   │   ├── provider/                 # Penyedia context (AuthProvider, dll.)
│   │   └── routes/                   # Konfigurasi React Router
│   ├── index.html                    # HTML utama
│   └── vite.config.js                # Konfigurasi Vite
│
└── README.md                         # Dokumentasi proyek
```

## Instalasi dan Setup Lokal

## Panduan Instalasi Lokal

Pastikan sudah menginstal **Node.js**, **npm**, dan **Python (versi 3.10)**.

```
cd Backend
npm install
cp .env

Edit file .env dan sesuaikan DATABASE_URL

npx prisma generate
npx prisma migrate dev
npm run dev
Server berjalan di <http://localhost:3000>
```

```
Pastikan file model IndoBERT (model/), corpus_final.json, dan mindfulness_index.faiss tersedia di jalur yang sesuai.
python main.py
pip install ..... (semuanya ikuti yang belum terinstal)
python main.py
Server berjalan di <http://127.0.0.1:5000/>
```

```
cd Frontend
npm install
Pastikan VITE_API_BASE_URL mengarah ke <http://localhost:3000/api>
npm run dev
Frontend aktif di <http://localhost:5173>
```

## Team

```
Sulistiani           - Machine Learning Engineer
Faqih Muhammad Ihsan - Machine Learning Engineer
Revo Hendriansyah    - Machine Learning Engineer
Andi Surya Priyadi   - Front End and Back End Developer
Anggreany Dwi Andiny - Front End and Back End Developer
Ibnu Fajar           - Front End and Back End Developer
```
