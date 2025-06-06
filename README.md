# Mindfulness Chatbot

## Deskripsi Proyek

Mindfulness adalah sebuah chatbot interaktif yang dirancang untuk membantu mahasiswa dalam menghadapi tantangan kesehatan mental. Proyek ini bertujuan menyediakan ruang aman, privat, dan suportif melalui teknologi Natural Language Processing (NLP), di mana pengguna dapat mengekspresikan perasaannya dan mendapatkan respons yang empatik serta relevan.

## Business Understanding
**Tujuan**
- Membantu mahasiswa mengenali kondisi emosionalnya secara mandiri.
- Membantu mengidentifikasi potensi gangguan mental.

**Analisis SWOT**
- Kekuatan (Strengths) Chatbot yang dibangun memberikan ruang privasi bagi pengguna, sehingga pengguna menjadi lebih leluasa dalam mengutarakan isi pikiran mereka.
- Kelemahan (Weaknesses) Chatbot mindfulness hanya memiliki satu fitur
- Peluang (Opportunities) Target pasar dari chatbot mindfulness cakupannya cukup luas dari kalangan mahasiswa. Mindfulness memungkinkan untuk memiliki pengguna mahasiswa yang bervariasi
- Ancaman (Threats) Telah banyak chat bot yang memiliki fungsional serupa dengan mindfulness. 

## Data Understanding
https://www.kaggle.com/datasets/thedevastator/nlp-mental-health-conversations

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
- **Docker** - Lingkungan Python konsisten

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
├── Python/                           # Backend Python (Flask AI)
│   ├── model/                        # Model IndoBERT dan corpus
│   ├── scripts/                      # Preprocessing, translasi, dll.
│   ├── applicaiton.py                # Server Flask utama
│   └── requirements.txt              # Dependensi Python
|   └── Dockerfile                    # buat jalanin flask (termasuk deploy flask)
|   └── Procfile                      # menentukan perintah
|   └── nltk_data/                    # didalamnya ada pustaka bahasa
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

## Mockup Website
|            Halaman            |                                   Gambar                                                 |
|:-----------------------------:|:----------------------------------------------------------------------------------------:|
|      **Halaman Chat**         |![image](https://github.com/user-attachments/assets/0970cca7-ae54-4f62-8d3b-28a76649e045) |
|    **Login dan Register**     |![image](https://github.com/user-attachments/assets/f8ca9bd0-30cc-4955-a218-b0d640c320bc) |
|         **Home**              |![image](https://github.com/user-attachments/assets/5ab08ed9-0a45-49b4-84f1-10b328edd843) |
|       **About Us**            |![image](https://github.com/user-attachments/assets/f2a59f26-c174-4631-beb4-9a08990ce425) |



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
Flask Python
docker build -t (nama file) .
docker run -p 8080:8080 (nama file) << untuk 8080 yaitu url nya

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
