# Dokumentasi Implementasi OTP — Stories Between Us

> Ditulis: 13 Maret 2026  
> Stack: React + TypeScript + Supabase Auth + Gmail SMTP

---

## Daftar Isi

1. [Apa itu OTP dalam konteks ini?](#1-apa-itu-otp-dalam-konteks-ini)
2. [Arsitektur sistem](#2-arsitektur-sistem)
3. [Alur kerja lengkap](#3-alur-kerja-lengkap)
4. [Kode yang terlibat](#4-kode-yang-terlibat)
5. [Mengapa 8 digit, bukan 6?](#5-mengapa-8-digit-bukan-6)
6. [Keamanan](#6-keamanan)
7. [Risiko dan mitigasi](#7-risiko-dan-mitigasi)
8. [Saran untuk production](#8-saran-untuk-production)

---

## 1. Apa itu OTP dalam konteks ini?

**OTP (One-Time Password)** adalah kode angka yang:
- Dibuat secara acak oleh server
- Dikirim ke email user
- Hanya berlaku **sekali**
- Kadaluarsa setelah **1 jam** (default Supabase)

Fungsinya di sini adalah **verifikasi email saat register** — membuktikan bahwa user benar-benar memiliki akses ke email yang mereka daftarkan.

---

## 2. Arsitektur Sistem

Lihat diagram: `OTP-Flow.drawio` (buka dengan ekstensi draw.io di VS Code)

```
┌─────────────┐     register()     ┌──────────────────┐
│   Browser   │ ─────────────────► │  Supabase Auth   │
│ (React App) │                    │  (gotrue server) │
└─────────────┘                    └────────┬─────────┘
       ▲                                    │
       │                                    │ perintah kirim email
       │ verifyOtp()                        ▼
       │                           ┌──────────────────┐
       │ ◄─── token valid? ──────  │  Gmail SMTP      │
       │                           │ fairuzo1dyck@... │
       │                           └────────┬─────────┘
       │                                    │
       │                                    │ email berisi kode
       │                                    ▼
       │                           ┌──────────────────┐
       └─────── input kode ─────── │  Inbox user      │
                                   └──────────────────┘
```

**3 komponen utama:**

| Komponen | Peran |
|---|---|
| **Supabase Auth** | Generate OTP, validasi OTP, kelola sesi |
| **Gmail SMTP** | Pengirim email (transport layer) |
| **RegisterForm.tsx** | UI input 8 kotak + kirim ke Supabase |

---

## 3. Alur Kerja Lengkap

### Fase 1 — Register

```
User isi form (username, email, password)
    │
    ▼
signUp() di useAuth.ts
    │  supabase.auth.signUp({ email, password, options: { data: { username } } })
    ▼
Supabase:
  1. Buat user baru di auth.users
  2. Generate OTP 8 digit → simpan hash(OTP) di database
  3. Kirim perintah ke Gmail SMTP: "kirim email dengan token ini ke {email}"
    │
    ▼
Gmail SMTP kirim email ke user
    │
    ▼
UI berubah → tampil 8 kotak input OTP
```

### Fase 2 — Verifikasi

```
User buka Gmail → lihat kode 8 digit
    │
    ▼
User ketik/paste kode di 8 kotak input
    │
    ▼
handleVerify() dipanggil
    │  supabase.auth.verifyOtp({ email, token, type: 'signup' })
    ▼
Supabase:
  1. Cari hash(token) yang cocok di database
  2. Cek apakah sudah expired (> 1 jam)
  3. Jika valid → tandai email sebagai confirmed
  4. Buat session (JWT access token + refresh token)
    │
    ▼
onSuccess() → user masuk ke app
    │
    ▼
Trigger handle_new_user() jalan otomatis di database
    │  INSERT INTO profiles (id, username) VALUES (user.id, metadata.username)
    ▼
Profile row terbuat → user bisa posting cerita
```

### Fase 3 — Login berikutnya

```
User login dengan email + password
    │
    ▼
signInWithPassword() → Supabase cek password hash
    │
    ▼
Jika email belum verified → error "email not confirmed"
Jika sudah verified → session diberikan
    │
    ▼
fetchProfileAndBan() → ambil data profile dari tabel profiles
    │
    ▼
Jika profile belum ada (edge case) → fallback upsert dari metadata
```

---

## 4. Kode yang Terlibat

### `src/hooks/useAuth.ts` — fungsi signUp

```typescript
const signUp = useCallback(async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },  // ← username disimpan di metadata
  })
  if (error) throw error
  return data
}, [])
```

**Catatan penting:** `username` disimpan di `user_metadata`, bukan langsung di tabel `profiles`.  
Tabel `profiles` dibuat otomatis oleh trigger SQL `handle_new_user()` saat email dikonfirmasi.

---

### `src/components/auth/RegisterForm.tsx` — UI OTP

```typescript
// State: array 8 string kosong
const [otp, setOtp] = useState(['', '', '', '', '', '', '', ''])

// Verifikasi ke Supabase
const handleVerify = async () => {
  const token = otp.join('')  // gabung jadi "84309361"
  const { error } = await supabase.auth.verifyOtp({ 
    email, 
    token, 
    type: 'signup'    // ← tipe ini penting, harus 'signup' bukan yang lain
  })
  if (error) throw error
  onSuccess()
}
```

**Fitur UX yang diimplementasikan:**
- Auto-focus ke kotak berikutnya saat angka diketik
- Backspace otomatis balik ke kotak sebelumnya
- Paste kode langsung mengisi semua 8 kotak
- Tombol Verify tidak aktif sampai 8 kotak terisi semua

---

### `SQL Trigger` — auto-create profile

```sql
-- Jalan otomatis saat user baru dikonfirmasi
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Template Email di Supabase

Diubah dari link konfirmasi menjadi kode OTP:

```html
<!-- Sebelum -->
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>

<!-- Sesudah -->
<p>Your verification code: <strong>{{ .Token }}</strong></p>
```

`{{ .Token }}` adalah variabel Supabase yang diisi otomatis dengan kode 8 digit.

---

## 5. Mengapa 8 Digit, Bukan 6?

Ini hardcoded di library internal Supabase (`gotrue`). Tidak bisa diubah dari dashboard.

**Penjelasan teknis:**  
Supabase generate token sebagai string hexadecimal (0-9, a-f), lalu di template email dikirim dalam format numerik. Konversinya menghasilkan 8 digit.

**Perbandingan keamanan:**

| Panjang | Jumlah kemungkinan | Brute force @ 1000/detik |
|---|---|---|
| 4 digit | 10.000 | 10 detik ❌ |
| 6 digit | 1.000.000 | 17 menit ⚠️ |
| **8 digit** | **100.000.000** | **27 jam ✅** |

8 digit justru **lebih aman** dari 6 digit. Tidak perlu diubah.

**Satu-satunya cara dapat 6 digit:** Self-host Supabase di server sendiri dan edit konfigurasi `gotrue`. Untuk hosted plan di supabase.com, tidak bisa.

---

## 6. Keamanan

### Yang sudah aman ✅

| Aspek | Implementasi |
|---|---|
| OTP satu kali pakai | Token langsung invalid setelah dipakai |
| OTP ada expiry | Default 1 jam, lalu harus request ulang |
| Token disimpan sebagai hash | Database tidak simpan `84309361`, tapi `bcrypt(84309361)` |
| Transport terenkripsi | Semua request pakai HTTPS/TLS |
| App Password Gmail | Berbeda dari password Gmail utama |
| Password user di-hash | Supabase pakai bcrypt, tidak bisa di-reverse |
| RLS (Row Level Security) | Setiap tabel punya policy, user hanya bisa akses data sendiri |

### Cara Supabase melindungi database

```
User login → dapat JWT token (valid 1 jam)
    │
    ▼
Setiap request ke database menyertakan JWT di header
    │
    ▼
Supabase cek: auth.uid() dari JWT = data yang diminta?
    │
    ├─ Ya  → data diberikan
    └─ Tidak → 403 Forbidden
```

Ini berarti meskipun seseorang tahu URL database kamu, mereka tidak bisa baca data tanpa JWT token yang valid.

---

## 7. Risiko dan Mitigasi

### Risiko 1: Gmail SMTP diretas

**Skenario:** Attacker dapat App Password Gmail `fairuzo1dyck@gmail.com`

| Yang bisa dilakukan attacker | Yang TIDAK bisa |
|---|---|
| Kirim email dari akun kamu | Login ke Gmail utama |
| Intercept OTP yang belum dibaca | Akses database Supabase |
| Spam email ke semua user | Decrypt password user |

**Mitigasi:**
- Aktifkan 2FA di akun Gmail
- Rotate (ganti) App Password secara berkala
- Untuk production: gunakan dedicated SMTP (Resend, SendGrid)

---

### Risiko 2: Email user diretas

**Skenario:** Inbox email user (penerima OTP) diretas

Attacker bisa dapat OTP yang belum expired → login sebagai user tersebut.

**Mitigasi:**
- OTP expiry 1 jam (sudah ada)
- Tambahkan 2FA berbasis authenticator app (belum diimplementasikan)
- User harus segera confirm OTP setelah terima email

---

### Risiko 3: Brute force OTP

**Skenario:** Attacker coba semua kombinasi 8 digit (00000000 sampai 99999999)

Supabase punya built-in rate limiting:
- Max ~5 attempt per IP dalam waktu singkat
- Setelah gagal beberapa kali, IP di-block sementara

Di 100 juta kemungkinan dengan rate limit, brute force practically impossible.

---

### Risiko 4: Gmail limit 500 email/hari

**Skenario:** Website kamu tumbuh dan ada >500 register per hari

Gmail SMTP akan mulai reject email → user tidak bisa verifikasi.

**Mitigasi:** Ganti ke dedicated SMTP service.

---

## 8. Saran untuk Production

### SMTP — jangan pakai Gmail pribadi

| Service | Free | Paid mulai | Keunggulan |
|---|---|---|---|
| **Resend** | 3.000/bulan | $20/bulan | API modern, DX bagus |
| **SendGrid** | 100/hari selamanya | $19.95/bulan | Paling populer |
| **Brevo** | 300/hari | €25/bulan | Ada marketing tools |
| **Postmark** | 100/bulan | $15/bulan | Deliverability tinggi |

Cara setup sama persis dengan Gmail SMTP di Supabase — hanya ganti host, port, username, password.

---

### Checklist sebelum production

- [ ] Ganti Gmail SMTP ke dedicated service
- [ ] Setup custom domain email (`noreply@storiesbetween.us`)
- [ ] Tambahkan SPF dan DKIM record di DNS (agar email tidak masuk spam)
- [ ] Aktifkan 2FA di akun Gmail / email sender
- [ ] Pastikan Supabase URL Configuration sudah pakai domain production (bukan localhost)
- [ ] Upgrade Supabase plan jika MAU > 50.000
- [ ] Aktifkan Point-in-Time Recovery (backup database) di Supabase
- [ ] Monitor Auth logs di Supabase secara berkala

---

## Ringkasan Singkat

```
Register → Supabase generate OTP 8 digit
        → Gmail SMTP kirim ke email user
        → User buka email, ketik kode di 8 kotak
        → Supabase verifikasi → session dibuat
        → Trigger SQL buat profile → user masuk app

Keamanan: CUKUP untuk dev/staging.
Untuk production serius: ganti Gmail ke dedicated SMTP + aktifkan 2FA.
```
