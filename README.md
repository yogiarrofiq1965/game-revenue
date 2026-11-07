# Game Revenue Dashboard

Dashboard margin/revenue untuk website game, dengan perhitungan gaji admin referral.

## Rumus
- Pendapatan Kotor = Σ deposit
- Fee Pencairan = jumlah pencairan × Rp1.800
- Biaya Ops = Σ item biaya
- Gaji Admin = (50% × deposit pertama) + (40% × redeposit)
- **Pendapatan Bersih Owner = Kotor − Fee − Ops − Gaji Admin**

## Jalankan
Butuh Python 3 (sudah ada di hampir semua OS).

```bash
cd game-dashboard
python -m http.server 3000
