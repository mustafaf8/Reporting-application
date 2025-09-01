# Backend - Güneş Enerjisi Teklif Sistemi

## Ortam Değişkenleri

Bu projeyi çalıştırmak için aşağıdaki ortam değişkenlerini `.env` dosyasında tanımlamanız gerekir:

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/rmr_teklif

# JWT - Bu değeri production'da mutlaka değiştirin!
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Güvenlik Notları

- **JWT_SECRET**: Production ortamında mutlaka güçlü ve benzersiz bir değer kullanın
- **MONGODB_URI**: Production'da güvenli bir MongoDB bağlantı string'i kullanın
- **CORS_ORIGIN**: Production'da sadece güvenilir domain'leri belirtin

## Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. `.env` dosyasını oluşturun ve yukarıdaki değişkenleri tanımlayın

3. Sunucuyu başlatın:

```bash
npm start
```

## API Endpoints

- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kullanıcı kaydı
- `GET /api/users/me/profile` - Kullanıcı profili
- `PUT /api/users/me/profile` - Profil güncelleme
- `GET /api/users/me/performance` - Performans verileri
- `GET /api/proposals` - Teklif listesi
- `POST /api/proposals` - Yeni teklif oluşturma
- `PATCH /api/proposals/:id/status` - Teklif durumu güncelleme
