# Deploy ke bdmflow.web.id

Ditulis untuk deploy pertama di **Vercel Hobby dengan paywall mati** — gratis dan
sah, karena Hobby melarang penggunaan *komersial* dan produk yang belum menagih
belum komersial. Naikkan ke Pro saat tombol bayar dinyalakan.

Build produksi sudah diverifikasi lulus di mesin lokal (25 halaman, tanpa error).

---

## 1. Repo belum ada

Folder ini **bukan repo git**. Vercel men-deploy dari repo, jadi ini langkah nol.

```bash
git init
git add .
git commit -m "Initial commit"
```

`.gitignore` sudah menutup `.env.local`, `.env.*`, `node_modules/`, `.next/`, dan
folder backup Parquet. **Periksa sekali sebelum push** — token MotherDuck dan
service-role key ada di `.env.local`, dan sekali ter-push ke repo publik, keduanya
harus dianggap bocor dan diputar ulang:

```bash
git status --short | grep -i env    # harus kosong
```

Lalu buat repo di GitHub dan push.

---

## 2. Environment variables di Vercel

Aplikasi hanya membaca **lima**. Ini hasil pemindaian `process.env` di seluruh
`src/`, bukan salinan `.env.example`:

| Variabel | Isi |
|---|---|
| `MOTHERDUCK_TOKEN` | token gudang aktif |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iwvzjkpxggdvtbehicxm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key |
| `ENFORCE_PRO_GATING` | `false` untuk launch |

**Jangan** salin `MOTHERDUCK_TOKEN_B`, `GOOGLE_SERVICE_ACCOUNT_JSON`,
`TOKEN_SHEET_ID`, atau `CLOUDFLARE_*`. Tidak satu pun dibaca aplikasi — semuanya
milik ETL, yang jalan di GitHub Actions.

Dua hal yang sering menggigit:

- `.env.local` **tidak ikut ter-deploy**. Nilai harus diisi di dashboard Vercel.
- Variabel `NEXT_PUBLIC_*` dipanggang saat build. Mengubahnya butuh **redeploy**,
  bukan sekadar simpan.

---

## 3. Region

Project Settings → Functions → pilih **Singapore (sin1)**.

Default Vercel adalah Washington D.C. Pengukuran kita: RTT ke MotherDuck
(Virginia) 298 ms dari Jakarta. Menaruh fungsi di Singapura memperpendek jarak ke
pengguna Anda; setelah lapisan penyajian pindah ke Supabase Singapura, keduanya
jadi dekat.

---

## 4. Domain

Vercel → Settings → Domains → tambahkan `bdmflow.web.id`.

Di panel registrar .web.id Anda, arahkan sesuai instruksi yang Vercel tampilkan
(umumnya A record ke IP Vercel, atau CNAME untuk subdomain). Propagasi DNS bisa
sampai beberapa jam.

---

## 5. Supabase: izinkan domain produksi

**Ini yang paling sering terlewat dan membuat login gagal diam-diam.**

Kode mengirim `emailRedirectTo` dan `redirectTo` ke `${origin}/auth`
([auth-context.tsx:113](src/context/auth-context.tsx:113) dan
[:136](src/context/auth-context.tsx:136)). Supabase menolak redirect ke URL yang
tidak terdaftar — pendaftaran dan Google sign-in akan gagal tanpa pesan jelas.

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://bdmflow.web.id`
- **Redirect URLs**: tambahkan `https://bdmflow.web.id/auth` dan
  `https://bdmflow.web.id/**`, serta biarkan `http://localhost:3000/**` untuk
  pengembangan lokal

---

## 6. Verifikasi setelah deploy

Jangan anggap selesai sampai kelimanya lulus:

1. Beranda terbuka di `https://bdmflow.web.id`
2. **Daftar akun baru** dengan email sungguhan → cek di Supabase Table Editor
   bahwa baris `profiles` terbuat, `plan='free'`, `trial_ends_at` terisi 7 hari
3. Login, lalu buka `/smart-money` dan `/ksei1persen` → harus tampil data (paywall
   mati)
4. Tambahkan satu saham ke `/watchlist` → tersimpan dan muncul kembali setelah
   reload
5. Buka satu halaman saham, misal `/stock/BBCA` → chart dan tabel broker terisi

---

## 7. Mengukur minat: verifikasi email + funnel daftar

Saat ini siapa pun bisa memakai aplikasi tanpa akun. Tujuannya bukan memblokir
pengunjung, tapi **menghitung berapa yang bersedia daftar + verifikasi email**
sebelum memutuskan pasang payment gateway.

**Satu langkah manual di dashboard Supabase** (tidak bisa dilakukan lewat kode):

Supabase Dashboard → Authentication → Providers → Email →
aktifkan **Confirm email** (wajib verifikasi saat daftar). Setelah aktif,
pendaftaran baru mengirim link konfirmasi; kode di `/auth` sudah menampilkan
layar "Cek Email Anda".

Yang sudah berjalan otomatis dari kode:

- **Nudge daftar** — tamu yang sudah membuka ≥3 halaman mendapat modal "Daftar
  gratis" (bisa ditutup permanen, tidak memblokir). Kunci localStorage:
  `bdmflow_views` dan `bdmflow_nudge_dismissed`.
- **Event funnel** di Vercel Analytics:
  `nudge_shown` → `nudge_click`/`nudge_dismissed` → `signup_submitted` →
  `signup_verified` (dipicu sekali per user per browser saat akun
  terverifikasi masuk; `provider` = email/google) → `login_success`.

Angka pendaftar & verifikasi juga terlihat langsung di Supabase Dashboard →
Authentication → Users (kolom **Email Confirmed At**).

**Baca angka:** bandingkan `signup_verified` dengan `signup_submitted` (konversi
verifikasi) dan dengan total page view (minat → daftar). Kalau rasionya sehat,
lanjut ke langkah "Setelah ada pembeli" di bawah.

### Halaman kepatuhan (wajib untuk review payment gateway)

Halaman `/terms` (Syarat &amp; Ketentuan), `/privacy` (Kebijakan Privasi), dan
`/contact` (Kontak: email + WhatsApp) sudah tersedia dan ditautkan dari footer
landing, pricing, auth, dan seluruh halaman aplikasi (footer di app shell).
Reviewer gateway membuka situs dan memeriksa: deskripsi produk yang jelas,
kontak yang dapat dihubungi, dan halaman legal — ketiganya sekarang ada.

---

## Setelah ada pembeli

Backend billing sudah terpasang (sandbox-ready) — tinggal hubungkan kredensial
gateway dan uji end-to-end:

1. **Daftar Xendit** (perorangan: KTP + rekening untuk payout; bisnis: + NIB).
2. Apply **`supabase/migrations/002_billing.sql`** di SQL Editor (tambah
   `plan_expires_at`, tabel `billing_invoices` & `billing_webhooks`, fungsi
   `grant_pro_subscription`).
3. Di Vercel, tambah env: `XENDIT_API_KEY` + `XENDIT_WEBHOOK_TOKEN` (nilai bebas,
   harus sama dengan yang diisi di dashboard Xendit).
4. Dashboard Xendit → Settings → **Callbacks**: arahkan invoice callback ke
   `https://bdmflow.web.id/api/billing/webhook`, isi Webhook Verification Token
   dengan nilai `XENDIT_WEBHOOK_TOKEN`.
5. **Uji end-to-end** (sandbox atau transaksi kecil riil): login → POST
   `/api/billing/checkout` → bayar → cek `profiles.plan='pro'` +
   `plan_expires_at` terisi, dan event kedua (retry webhook) tidak menggandakan
   masa aktif.
6. Vercel **Pro** ($20/bln) — Hobby melarang komersial. (Jika belum ingin
   membayar: tetap Hobby untuk sementara atas risiko Anda sendiri; upgrade
   begitu pelanggan pertama masuk.)
7. Aktifkan tombol bayar di `/pricing`, ganti CTA "Segera Hadir" di landing.
8. `ENFORCE_PRO_GATING=true` di Vercel, lalu redeploy.

Paywall-nya sendiri sudah diuji dan benar di kelima keadaan: anonim, sedang
trial, trial kedaluwarsa, berbayar, dan query gratis. `plan_expires_at`
berakhir otomatis → user kembali ke tier free tanpa intervensi manual.
