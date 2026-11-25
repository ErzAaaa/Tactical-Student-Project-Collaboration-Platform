# PRD: Frontend Alur Inti (25–27 Nov 2026)

**Proyek:** Tactical Student Project Collaboration Platform (STACK 2026, fase Semifinal)

**Pemilik:** Difvo (programming dan desain) · **Rekan:** Jenar (data dan backend), Adit (naskah video)

**Status:** Draft v1.1 · **Freeze fitur:** Jumat 27 Nov malam · **Rekaman video:** Sabtu 28 Nov

**Pembaruan v1.1 (25 Nov):** AI Matchmaking ditambahkan sebagai alat bantu keputusan. Detailnya ada di bagian 13, dan jadwal serta cut-line di bagian 13 menggantikan bagian 9 untuk fitur AI.

## 1. Tujuan

Membangun frontend prototipe yang bisa diklik dari awal sampai akhir untuk alur inti: creator memposting proyek, applicant menelusuri dan melamar, lalu creator memutuskan (shortlist, accept, atau decline dengan pesan sopan). Hasilnya dipakai untuk video demo (maksimal 2 menit) dan menjadi titik awal prototipe untuk fase berikutnya.

Kriteria sukses fase ini:

- Satu skenario demo berjalan dari posting sampai keputusan tanpa error, 3 kali berturut-turut.
- Setiap layar jujur soal statusnya: data demo dan fitur simulasi diberi label.
- Terhubung ke backend jika Jenar siap. Jika belum, alur tetap berjalan penuh dengan data mock.

## 2. Konteks dan batasan (dari handbook)

- Semifinal menilai proposal dan video (maksimal 2 menit, 1080p). Video harus menunjukkan user flow atau prototipe awal dan menyatakan apa yang sudah selesai dan apa yang belum. Produk jadi tidak wajib.
- Fitur terencana tidak boleh disajikan sebagai fitur jadi. Mockup, data simulasi, dan fitur belum selesai wajib diberi label jelas.
- Dokumen, video, dan presentasi wajib berbahasa Inggris, jadi teks antarmuka sebaiknya English.
- Pustaka dan komponen publik boleh dipakai dengan atribusi (catat untuk bagian referensi proposal). Penggunaan AI yang material wajib diungkap di proposal dan README.
- Kapasitas: 3 hari, satu orang untuk kode sekaligus desain. Scope harus ketat.

## 3. Pengguna dan skenario demo

Satu akun punya dua peran: **Creator** dan **Applicant**. Skenario demo untuk video (nama fiktif, bukan nama anggota tim atau responden):

1. Creator (Rani) memposting proyek hackathon dengan dua peran: UI/UX dan Frontend.
2. Applicant (Dimas) membuka daftar proyek, memfilter peran UI/UX, membuka detail, lalu melamar dengan pitch singkat.
3. Creator membuka halaman keputusan dan melihat 3 pelamar. Satu di-accept, satu di-decline dengan template sopan, satu tetap pending dengan penanda `Auto-closes in 4 days`.
4. (P1) Applicant melihat pesan penolakan sopan di halaman My Applications.

## 4. Scope

| Masuk (P0) | Masuk jika waktu cukup (P1) | Tidak masuk fase ini |
| --- | --- | --- |
| Daftar proyek dengan pencarian dan filter dasar | My Applications (status dan pesan penolakan) | Reliability Score yang dihitung (hanya tampil dari data seed) |
| Detail proyek | Edit atau tutup proyek | Check-in, komitmen, konfirmasi hasil |
| Posting proyek (multi-peran) | Notifikasi in-app | Scheduler auto-close dan email (disimulasikan di UI) |
| Form apply dengan snapshot profil dan pitch | Halaman profil sendiri | Verifikasi GitHub asli jika OAuth belum siap |
| Halaman keputusan creator (shortlist, accept, decline dengan template) | Dark mode | Chat, challenge/bounty, skill barter, oprec |
| Label demo dan badge status | Decline otomatis sisa pelamar saat slot penuh | Landing page marketing |

## 5. Kebutuhan per halaman

### 5.1 Daftar Proyek (`/projects`) — P0

- Kartu proyek berisi judul, nama creator, peran yang dibuka (chip), sisa slot, batas lamaran, estimasi komitmen (jam per minggu × jumlah minggu), dan badge status.
- Pencarian judul, filter peran atau skill, dan filter status (default: Open).
- State: loading skeleton, kosong (`No projects match your filters`), dan error dengan tombol retry.
- **Acceptance:** filter mengubah daftar tanpa reload. Kartu tampil benar di lebar 360px dan 1280px. Klik kartu membuka detail.

### 5.2 Detail Proyek (`/projects/[id]`) — P0

- Deskripsi, daftar peran (nama, skill, slot terisi dari total), dan info creator: nama, fakultas, Reliability ringkas (skor, atau `No track record yet` bila kurang dari 2 komitmen) dan response rate.
- Tombol `Apply` per peran. Nonaktif jika peran penuh atau lamaran sudah ditutup, dengan alasan yang terlihat. Jika viewer adalah creator, tombol berubah menjadi `View applicants`.
- **Acceptance:** peran penuh tidak bisa dilamar. Creator tidak bisa melamar proyeknya sendiri.

### 5.3 Posting Proyek (`/projects/new`) — P0

- Field: judul (maks 80 karakter), deskripsi (maks 1000), batas lamaran (tanggal, minimal besok), estimasi komitmen (jam per minggu dan jumlah minggu), dan peran 1 sampai 5 (nama, skill tag, slot 1 sampai 5). Ada tombol `Add role` dan `Remove role`.
- Validasi inline per field dengan pesan yang jelas.
- Submit membuat proyek, muncul di daftar, lalu redirect ke detail dengan toast sukses.
- **Acceptance:** tidak bisa submit tanpa minimal 1 peran. Data tetap ada setelah refresh (persist mock atau backend).

### 5.4 Form Apply (modal atau drawer dari detail) — P0

- Peran terpilih otomatis dari tombol yang diklik. Pitch maksimal 300 karakter dengan penghitung.
- Pratinjau `Your profile snapshot`: nama, fakultas, dan item Proof-of-Work dengan label tingkat verifikasi (`Verified` untuk GitHub, `Self-declared`, `Completed on platform`). Teks pengingat bahwa creator melihat snapshot per tanggal melamar.
- Submit menampilkan state sukses: `Application sent. You will get a decision or a notice by {date}.`
- Lamaran ganda pada peran yang sama dicegah (tombol berubah menjadi `Applied`).
- **Acceptance:** pitch kosong tidak bisa dikirim. Penghitung karakter akurat. Snapshot di halaman creator sama dengan yang tampil saat melamar.

### 5.5 Halaman Keputusan Creator (`/projects/[id]/applicants`) — P0, paling penting

- Hanya creator yang bisa membuka. Pengguna lain melihat pesan akses ditolak.
- Pelamar dikelompokkan per peran, dengan filter status (All, Pending, Shortlisted, Accepted, Declined).
- Kartu pelamar: nama, fakultas, pitch, item Proof-of-Work berlabel (tautan dibuka di tab baru), Reliability (`No track record yet` bila kurang dari 2 komitmen), tanggal melamar, penghitung `Decision due in N days`, dan badge status.
- Aksi: `Shortlist`, `Accept`, `Decline`.
- **Decline** membuka dialog: pilih template alasan (wajib), catatan opsional (maks 200 karakter), pratinjau pesan yang dikirim sistem, dan tombol konfirmasi `Send courteous decline`. Template: `The role has been filled`, `Skills are not a close match for this role`, `The schedule or commitment does not fit`.
- Lamaran yang melewati batas keputusan tampil sebagai `Auto-closed (no decision)`. Di fase ini status itu **disimulasikan** (scheduler belum ada) dan diberi tag `Simulated`.
- **Alur status:** pending → shortlisted → accepted atau declined; pending → accepted atau declined; pending atau shortlisted → expired (oleh sistem). Status akhir tidak bisa diubah.
- **Acceptance:** status berubah langsung setelah aksi (optimistic, dengan rollback jika gagal). Decline tidak bisa dikirim tanpa template. Setiap aksi punya feedback (toast atau perubahan badge).

### 5.6 My Applications (`/my-applications`) — P1

Daftar lamaran milik applicant dengan status, dan pesan decline yang diterima (template beserta catatan). Dipakai untuk adegan polite rejection di video. Dibangun hanya jika Adit memasukkannya ke naskah.

## 6. Data dan kontrak backend

Daftar ini berasal dari rancangan awal. Samakan dengan kesepakatan halaman dan data bersama Jenar pada 24 Nov. Jika berbeda, kontrak yang disepakati dengan Jenar yang berlaku dan PRD ini diperbarui.

| Entitas | Field kunci untuk frontend |
| --- | --- |
| Profile | id, name, faculty, githubUsername (opsional), reliability (skor atau null, jumlah komitmen, completion rate), responseRate, powItems\[\] |
| PoWItem | kind (github, behance, figma, drive, other), title, url, level (verified, self\_declared, platform\_earned) |
| Project | id, creatorId, title, description, applyDeadline, hoursPerWeek, weeks, status (open, closed, filled), roles\[\], createdAt |
| Role | id, projectId, name, skills\[\], slots, filled |
| Application | id, roleId, applicantId, pitch, powSnapshot\[\], status (pending, shortlisted, accepted, declined, expired), declineTemplate, declineNote, createdAt, decisionDueAt, decidedAt |

Operasi yang dibutuhkan frontend (nama bebas):

| Operasi | Dipakai di |
| --- | --- |
| getCurrentUser | Semua halaman |
| listProjects(filters) | 5.1 |
| getProject(id) | 5.2 |
| createProject(input dan roles\[\]) | 5.3 |
| createApplication(roleId, pitch), server menyalin snapshot Proof-of-Work | 5.4 |
| listApplications(projectId), khusus creator | 5.5 |
| updateApplication(id, action, template, note) | 5.5 |
| listMyApplications | 5.6 |

Aturan data:

- Waktu disimpan sebagai ISO UTC. `decisionDueAt` = `createdAt` + 7 hari.
- `decidedAt` terisi saat keputusan dibuat. Ini diperlukan nanti untuk metrik share of applicants who receive a decision dan time to decision.
- Snapshot Proof-of-Work disalin saat melamar dan tidak diambil ulang.
- Reliability bersifat read-only di fase ini (nilai seed, bukan hasil perhitungan).

**Strategi integrasi:** satu lapisan data di `lib/data` dengan interface `DataClient` dan dua implementasi, `mock` (data seed, persist di localStorage, tombol `Reset demo data`) dan `supabase`. Pilih lewat env `NEXT_PUBLIC_DATA_SOURCE`. Komponen UI tidak boleh memanggil Supabase langsung. Pembatasan akses sesungguhnya (creator-only) harus ada di RLS backend. Guard di frontend hanya untuk UX.

**Autentikasi:** GitHub OAuth jika Jenar siap. Fallback: pengganti pengguna demo (Creator, Applicant A/B/C) di header, berlabel `Demo mode`.

## 7. Desain

- Satu font, satu warna aksen, skala spasi 4/8. Komponen dasar: Button, Input dan Textarea (dengan counter), Select dan Chip, Badge status, Card, Dialog atau Drawer, Toast, Skeleton, EmptyState.
- Status tidak hanya dibedakan lewat warna: selalu ikon dan teks. Kontras teks minimal 4.5:1. Semua input berlabel, fokus keyboard terlihat, dialog bisa ditutup dengan Esc.
- Label kejujuran: pita kecil permanen `Demo build · synthetic data`, item Proof-of-Work berlabel tingkat verifikasi, dan fitur simulasi bertag `Simulated`.
- Desktop-first untuk rekaman 1920×1080, tetap responsif sampai 360px.
- Bahasa antarmuka: English.

## 8. Teknis

- Next.js App Router, TypeScript, Tailwind. Deploy preview di Vercel setiap push.
- Tidak ada secret di repo (`.env.local` di-ignore, sediakan `.env.example`).
- Catat semua pustaka dan komponen pihak ketiga (misalnya shadcn/ui jika dipakai) untuk referensi proposal, dan catat penggunaan AI untuk pengungkapan.

## 9. Rencana kerja

| Hari | Target | Selesai bila |
| --- | --- | --- |
| Rabu 25 Nov (hari ini) | Design tokens dan komponen dasar, tipe data, mock client dan seed, layout dengan pita demo, Daftar Proyek, Detail Proyek | Daftar ke detail berjalan dengan data seed dan responsif |
| Kamis 26 Nov | Posting Proyek, Form Apply (snapshot, validasi, state sukses), mulai Halaman Keputusan (kartu pelamar dan badge status) | Alur posting ke apply tersimpan dan terlihat |
| Jumat 27 Nov | Halaman Keputusan lengkap (shortlist, accept, decline dengan dialog), My Applications bila masuk naskah, state loading/kosong/error, swap ke backend bila siap, deploy, seed skenario demo, uji 3 kali | Definition of Done terpenuhi, lalu freeze malam |

Sabtu 28 Nov: tidak ada fitur baru, hanya perbaikan bug yang menghalangi rekaman.

**Checkpoint:** akhir 26 Nov Halaman Keputusan sudah mulai dikerjakan. Jika belum, langsung jalankan cut-line.

**Cut-line (urutan pemangkasan jika terlambat):** 1) My Applications, 2) filter skill (sisakan pencarian judul), 3) preview dan edit proyek, 4) integrasi backend (tetap pakai mock), 5) animasi. **Tidak boleh dipangkas:** Halaman Keputusan dan dialog decline dengan template.

## 10. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Backend belum siap | Mock client, kontrak data disepakati, swap pada 27 Nov |
| Halaman Keputusan membengkak | Batasi state machine, pangkas P1 |
| Data demo tampak palsu | Label jelas, narasi video menyebut synthetic data |
| Bug saat merekam video | Freeze 27 Nov, tombol Reset demo, skenario diuji 3 kali |
| Waktu terpotong tugas lain | Cut-line di atas |

## 11. Definition of Done dan handoff ke video

- Skenario demo (bagian 3) berjalan 3 kali berturut-turut di build Vercel yang akan direkam.
- Seed demo: 1 creator, 5 proyek, 1 proyek utama dengan 3 pelamar (satu dengan GitHub verified dan link self-declared, satu `No track record yet`, satu hampir kedaluwarsa).
- Setiap layar punya state loading, kosong, dan error.
- Tidak ada fitur roadmap yang tampil seolah sudah selesai.
- Daftar jujur untuk video dan proposal, dikirim ke Adit sebelum 28 Nov: **Built** (UI berjalan dengan data mock atau nyata), **Simulated** (auto-close, notifikasi, nilai Reliability), **Roadmap**.

## 12. Pertanyaan terbuka

1. Apakah GitHub OAuth dan tabel Supabase dari Jenar siap sebelum 27 Nov? Ini menentukan mock atau real.
2. Apakah daftar halaman dan field yang disepakati pada 24 Nov sama dengan bagian 6?
3. Apakah naskah video Adit menampilkan sisi applicant (My Applications)? Jika tidak, jangan dibangun.

## 13. Pembaruan v1.1: AI Matchmaking (Match Insight)

AI Matchmaking ditambahkan sebagai alat bantu keputusan di halaman creator, bukan pengganti keputusan, dan hanya diberi label AI bila komponen LLM benar-benar berjalan di build yang direkam atau diserahkan.

### 13.1 Dasar handbook

Tidak ada aturan di handbook yang melarang penambahan ini, selama kelima hal berikut dipenuhi. Kepastian tambahan bisa ditanyakan ke contact person di halaman terakhir handbook.

| Aturan handbook | Implikasi untuk fitur ini |
| --- | --- |
| AI bersifat opsional dan tidak otomatis menambah poin (Technology and AI Usage, no. 3 dan 9) | AI harus dibenarkan lewat manfaat bagi pengguna, bukan karena tren |
| Proyek yang sama dikembangkan dari Preliminary sampai Final (General Rules no. 2, Originality) | AI memperkuat alur yang sama (menyeleksi pelamar), bukan mengganti proyek |
| Isi abstrak tidak dikunci. Perubahan yang butuh persetujuan komite hanya susunan anggota tim (Eligibility no. 8) | Boleh menambah fitur, tetapi Communication (10%) menilai proposal dan video yang konsisten dan akurat, jadi tulis di proposal bahwa AI ditambahkan setelah abstrak |
| Fitur terencana tidak boleh disajikan sebagai selesai. Mockup dan data simulasi wajib diberi label (General Rules no. 6 dan 7) | Aturan penamaan label di 13.5 |
| AI yang material wajib diungkap di proposal dan README beserta alat dan perannya (Technology and AI Usage, no. 4) | Catat model untuk fitur ini dan AI yang dipakai untuk menulis kode |
| Data pribadi dan API key wajib dilindungi, dan demo memakai data sintetis atau yang diizinkan (no. 7 dan 8) | Minimisasi data, kunci hanya di server, data seed sintetis |

### 13.2 Posisi AI dan masalah yang dijawab

AI di sini membantu creator membaca bukti Proof-of-Work dengan cepat. AI tidak menyelesaikan ghosting. Dari wawancara awal (8 orang, sampel kenalan sendiri, bersifat indikatif), 7 dari 8 pernah punya rekan yang tidak berkontribusi, dan itu dijawab oleh Reliability Score dan closed loop, bukan oleh AI. AI menjawab temuan lain: hanya 1 dari 8 yang menyebut portofolio, dan 2 dari 8 menghindari atau melewatkan lomba tim ketika lingkaran kenalannya tidak tersedia.

Klaim yang aman di proposal: AI membantu menilai kecocokan keahlian dari bukti yang tersedia. Jangan menulis bahwa AI mengurangi ghosting. Manfaatnya diuji sebagai hipotesis (13.9).

### 13.3 Prinsip desain

1. **Alat bantu, bukan penentu.** Tidak ada status lamaran yang berubah karena output AI. Creator selalu memutuskan.
2. **Dapat dijelaskan.** Setiap hasil menampilkan skill yang terbukti, bukti yang dipakai, dan tingkat verifikasinya.
3. **Inti deterministik, LLM hanya untuk menormalkan dan menjelaskan.** Kecocokan dihitung dengan aturan. LLM memetakan frasa bebas ke kosakata skill dan menulis ringkasan pendek.
4. **Data minimal.** Nama, fakultas, foto, dan URL pribadi tidak dikirim ke model. Reliability Score tidak dipakai dalam kecocokan, supaya keahlian dan keandalan tidak tercampur dan pengguna baru tidak dihukum.
5. **Gagal dengan aman.** Jika LLM gagal atau lambat, hasil berbasis aturan tetap tampil.

### 13.4 Scope fitur AI

| Masuk (P0) | Jika waktu cukup | Tidak masuk |
| --- | --- | --- |
| Panel Match Insight di kartu pelamar (band, skill terbukti, bukti) | P1: toggle `Sort by fit` (default tetap urut tanggal lamar) | Keputusan accept atau decline otomatis |
| Ringkasan `Why this match` dari LLM, berlabel | P2: rekomendasi peran untuk applicant di detail proyek | Chatbot, embedding atau vector search, fine-tuning |
| Teks pemberitahuan di form apply |  | AI untuk menghitung Reliability Score |
| Fallback aturan dan cache hasil |  | Pesan penolakan yang ditulis AI (tetap template) |
|  |  | Penilaian atribut pribadi pelamar |

### 13.5 Kebutuhan fungsional

**Panel Match Insight** (di kartu pelamar, halaman 5.5), P0:

- Band `Strong fit`, `Partial fit`, atau `Limited fit` (ikon dan teks, bukan warna saja), dihitung dari seberapa banyak skill peran yang punya bukti.
- Tampilkan hitungan, bukan persentase: `3 of 4 skills evidenced · 2 verified`.
- Chip skill: terbukti (centang dan penanda `Verified` atau `Self-declared`) dan belum ada bukti (outline).
- `Why this match`: 1 sampai 3 kalimat (maks 280 karakter) berlabel `AI-assisted · may be wrong`, ditambah `Evidence used` yang bisa dibuka berisi item Proof-of-Work yang dirujuk beserta tautannya.
- State: `Analyzing…` (skeleton), `AI summary unavailable` (hasil aturan tetap tampil), dan `No evidence yet` untuk pelamar tanpa item Proof-of-Work (band Limited dengan penjelasan netral).
- Catatan permanen di panel: `Decision support only. You decide.`
- **Acceptance:** panel tidak mengubah status lamaran. Setiap skill berstatus terbukti punya minimal satu tautan bukti. Payload ke model tidak memuat nama atau fakultas (diperiksa lewat log lokal). Saat LLM dimatikan, panel tetap tampil.

**Form apply (5.4)**, P0: tambahkan teks `The creator will see an AI-assisted fit summary based on your profile snapshot.` sebelum tombol submit. Acceptance: teks selalu terlihat sebelum submit.

**Sort by fit**, P1: toggle di halaman keputusan. Default `Date applied`. Saat aktif tampil label `Sorted by skill fit. Review every applicant.`

**Aturan penamaan label.** `AI-assisted` hanya dipakai bila LLM benar-benar menghasilkan ringkasan pada build yang direkam atau diserahkan. Jika LLM belum berjalan, panel dinamai `Skill match` dan AI ditulis sebagai Planned di video dan proposal. Hasil yang dihitung sebelumnya dan disimpan untuk data seed diberi tag `Precomputed`.

### 13.6 Logika kecocokan

| Langkah | Isi |
| --- | --- |
| 1. Input | `role.skills`, item Proof-of-Work (id, level, title, summary, skills), dan pitch. Tanpa nama, fakultas, foto, atau URL pribadi |
| 2. Normalisasi (LLM, opsional) | Memetakan frasa bebas ke kosakata skill peran, misalnya `Figma prototyping` ke `UI/UX`. Setiap pemetaan wajib menyebut `evidenceId` |
| 3. Coverage (aturan) | Skill peran dianggap terbukti bila ada minimal satu bukti yang memuatnya. Bobot bukti: Verified dan Completed on platform = 1.0, Self-declared = 0.6. Skor skill = bobot tertinggi dari bukti yang memuatnya. Coverage = rata-rata skor atas semua skill peran |
| 4. Band | Coverage 0.75 atau lebih = Strong, 0.40 sampai 0.74 = Partial, di bawah 0.40 = Limited. Ambang awal, dikalibrasi dengan set uji di 13.9 |
| 5. Penjelasan (LLM) | Ringkasan coverage, dengan catatan bila bukti hanya Self-declared |
| 6. Validasi | Skema JSON ketat. `evidenceId` yang tidak ada dibuang. Klaim tanpa bukti dihapus. Jika semua gagal, tampil hasil aturan saja |

Parameter (bobot dan ambang) disimpan di satu file konfigurasi supaya bisa disetel tanpa mengubah kode.

### 13.7 Data dan API

Perubahan data (samakan dengan Jenar):

| Entitas | Perubahan |
| --- | --- |
| PoWItem | Tambah `summary` (maks 200 karakter) dan `skills`. Untuk GitHub Verified, skills diisi dari bahasa dan topik repo. Untuk Self-declared, diisi pengguna. Untuk demo, boleh diisi manual pada data seed |
| MatchInsight (baru) | applicationId, band (strong, partial, limited), evidenced (daftar: skill, level, evidenceIds), missing, explanation (teks atau null), source (`rules` atau `rules+llm`), model (atau null), status (`pending`, `ok`, `ai_unavailable`), generatedAt |

- **Operasi baru:** `getMatchInsight(applicationId)`, ditambahkan ke `DataClient`. Implementasi `mock` membaca JSON seed yang diisi manual untuk 3 pelamar utama, jadi UI tidak menunggu backend.
- **Waktu hitung:** server menghitung insight saat `createApplication`, menyimpannya, dan melakukan cache per lamaran dan snapshot. Halaman tidak memanggil LLM setiap dibuka.
- **Fungsi server:** route handler Next.js atau Supabase Edge Function, misalnya `POST /api/match`.
- **Kontrak output LLM (JSON):** skills (skill dan evidenceIds), explanation (maks 280 karakter), caveats. Aturan prompt: gunakan hanya bukti yang diberikan, jangan menyimpulkan dari nama, fakultas, atau gaya bahasa, katakan bila bukti tidak ada, jangan merekomendasikan menerima atau menolak, tulis dalam English, suhu rendah, timeout 8 detik dengan satu kali retry.
- **Keamanan:** API key hanya di env server (tidak masuk bundle klien dan repo, sediakan `.env.example`). Log tidak menyimpan pitch atau Proof-of-Work mentah. Demo hanya memakai data sintetis.
- **Penyedia LLM:** bebas, handbook tidak mewajibkan vendor. Cek kuota dan batas laju sebelum rekaman.

### 13.8 Jadwal dan pembagian kerja (25–30 Nov)

Fitur AI layak dikerjakan dalam 6 hari hanya sebagai versi tipis dan setelah P0 aman. Estimasi kasar, belum memperhitungkan kondisi backend Jenar: Jenar sekitar 1 sampai 1,5 hari (skoring aturan 3 sampai 4 jam, LLM dengan validasi, fallback, dan cache 4 sampai 6 jam), Difvo sekitar 4 sampai 5 jam (panel, state, toggle), dan tim sekitar 2 sampai 3 jam untuk set uji. Totalnya 2 sampai 2,5 orang-hari yang bisa berjalan paralel.

| Hari | Jenar (data dan backend) | Difvo (UI) | Tim (Adit dan anggota lain) |
| --- | --- | --- | --- |
| Rabu 25 Nov | Go/no-go. Sepakati kontrak `MatchInsight` dan field baru PoWItem (30 menit) | Lanjut P0 (daftar dan detail proyek). Tambah tipe `MatchInsight` dan seed insight untuk 3 pelamar utama | Susun 10 pasangan pelamar-peran sintetis dan label band manual (set uji) |
| Kamis 26 Nov | Skoring aturan dan endpoint `/api/match` (tanpa LLM) | Posting proyek, form apply (dengan teks pemberitahuan AI), mulai halaman keputusan | Lanjut set uji. Mulai revisi proposal (Solution, Technical Design) |
| Jumat 27 Nov | Integrasi LLM, validasi skema, fallback, cache | Panel Match Insight di halaman keputusan beserta state loading dan unavailable | Jalankan set uji (band sistem vs label manual). Tulis bagian validasi AI |
| Sabtu 28 Nov | Hanya perbaikan bug | Rekam video. Label AI sesuai kondisi aktual (13.5) | Naskah memuat label jujur: live, precomputed, atau planned |
| Minggu 29 Nov | Freeze | Cek akhir build dan video | Finalisasi proposal (pengungkapan AI, privasi, bias) |
| Senin 30 Nov |  | Submit pagi |  |

**Gate Jumat 27 Nov pukul 12.00.** Jika halaman keputusan P0 belum berfungsi, UI AI tetap memakai data seed dan semua klaim AI di video dan proposal ditulis `Planned` atau `Simulated`. Jika LLM belum lolos 3 kali uji berturut-turut, rekam dengan hasil `Precomputed` yang berlabel, atau gunakan nama `Skill match` bila LLM tidak berjalan.

### 13.9 Validasi AI (untuk proposal)

Belum ada hasil apa pun. Jangan menulis angka di proposal sebelum pengujian benar-benar dijalankan, dan laporkan apa adanya.

- **Set uji kecocokan:** 10 pasangan pelamar-peran sintetis, band-nya dilabeli independen oleh 2 anggota tim sebelum melihat hasil sistem. Ukuran: berapa pasangan yang band-nya sama dengan label, dan apakah ada selisih dua band. Target awal: minimal 7 dari 10 sama dan tidak ada selisih dua band. Ini target, bukan klaim.
- **Uji konsistensi:** profil identik dengan nama dan fakultas berbeda harus menghasilkan band dan skill terbukti yang sama.
- **Uji pengguna kecil (rencana, periode product improvement):** 5 sampai 8 orang menyeleksi 3 pelamar dengan dan tanpa panel. Ukuran: waktu menyeleksi dan keyakinan pada keputusan.

### 13.10 Risiko tambahan

| Risiko | Mitigasi |
| --- | --- |
| AI menggeser pekerjaan P0 | Gate Jumat siang dan cut-line baru (13.11) |
| LLM berhalusinasi atau lambat | Skema JSON, `evidenceId` divalidasi, timeout 8 detik, fallback aturan, cache |
| Bias dan privasi | Tanpa nama, fakultas, foto. Reliability tidak dipakai. Sort default urut tanggal. Label `Decision support only`. Data sintetis di demo |
| Demo bergantung pada API eksternal | Hasil `Precomputed` untuk data seed, dilabeli jujur |
| Kuota atau batas laju API | Cek kuota penyedia yang dipilih sebelum rekaman |
| Klaim berlebihan di video atau proposal | Aturan penamaan label di 13.5 |

### 13.11 Cut-line baru (menggantikan bagian 9)

Urutan pemangkasan jika terlambat: 1) Sort by fit dan rekomendasi peran, 2) My Applications, 3) ringkasan LLM (panel tetap tampil sebagai `Skill match` berbasis aturan, AI ditulis Planned), 4) filter skill, 5) preview dan edit proyek, 6) integrasi backend (tetap mock), 7) animasi. **Tidak boleh dipangkas:** halaman keputusan, dialog decline dengan template, dan label demo.

### 13.12 Dampak ke dokumen lain

- **Proposal:** Proposed Solution (fitur pembeda, tulis bahwa AI ditambahkan setelah abstrak berdasarkan temuan wawancara), Technical Design (alur kecocokan dan model), Validation and Impact (13.9, privasi, bias), References and Declaration (penyedia dan model, perannya, serta AI yang dipakai untuk pengembangan).
- **Video:** tunjukkan panel dengan label jujur dan sebutkan apa yang sudah dan belum selesai.
- **README (nanti):** pengungkapan AI dan cara menjalankan tanpa API key (mode aturan saja).

### 13.13 Pertanyaan terbuka

1. Siapa yang mengerjakan `/api/match`, dan apakah Jenar punya kapasitas sekitar 1,5 hari sebelum Jumat siang?
2. Penyedia LLM mana yang dipakai, dan apakah kunci serta kuotanya sudah ada?
3. Dari mana `skills` pada PoWItem: otomatis dari GitHub API atau diisi manual pada data seed untuk demo?
4. Perlu konfirmasi ke panitia bahwa penambahan fitur setelah abstrak diperbolehkan? Handbook tidak melarang, tetapi bertanya tidak berisiko.
