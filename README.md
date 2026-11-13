# SSMUSS.AZ

Node.js + Express + SQLite əsaslı ilkin musiqi platforması.

## Lokal işə salmaq
1. Node.js 20 və ya daha yenisini quraşdırın.
2. Bu qovluqda terminal açın və `npm install` yazın.
3. `.env.example` faylını `.env` adı ilə kopyalayın.
4. `.env` daxilində uzun və unikal `ADMIN_PASSWORD` təyin edin.
5. `npm start` yazın.
6. Brauzerdə `http://localhost:3000` açın.

## Funksiyalar
- Hamı üçün açıq mahnı kataloqu və axtarış
- Serverdən audio stream
- Audio faylı yükləmə
- Admin şifrəsi ilə audio əlavə etmək
- SQLite metadatası və diskdə audio saxlama

## İnternetə yerləşdirməzdən əvvəl
- HTTPS aktiv edin və güclü admin şifrəsi istifadə edin.
- Hostingdə `data/` və `uploads/` qovluqlarının daimi diskdə saxlandığını yoxlayın.
- Fayl ölçüsü, trafik limiti, ehtiyat nüsxə və giriş məhdudiyyətləri qurun.
- Admin panelinə əlavə giriş qoruması, rate limiting və audit log əlavə edin.
- Müəllif hüquqları sizə məxsus olan və ya paylaşılmasına icazə verilən audio faylları yükləyin.
- Bu ilkin paketdə istifadəçi qeydiyyatı, playlist, cover upload və ödəniş sistemi yoxdur.
