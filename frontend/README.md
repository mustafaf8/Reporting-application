# Frontend - Güneş Enerjisi Teklif Sistemi

## Ortam Değişkenleri

Bu projeyi çalıştırmak için aşağıdaki ortam değişkenlerini `.env` dosyasında tanımlamanız gerekir:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:5000
```

## Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. `.env` dosyasını oluşturun ve yukarıdaki değişkenleri tanımlayın

3. Development sunucusunu başlatın:

```bash
npm run dev
```

## Özellikler

- **Kullanıcı Kimlik Doğrulama**: Giriş/kayıt sistemi
- **Teklif Yönetimi**: Teklif oluşturma, listeleme ve düzenleme
- **Profil Yönetimi**: Kullanıcı profil bilgileri ve düzenleme
- **Performans Dashboard**: Kullanıcı performans göstergeleri
- **PDF Oluşturma**: Teklif PDF'lerini otomatik oluşturma
- **Responsive Tasarım**: Mobil uyumlu arayüz

## Teknolojiler

- React 18
- React Router
- Axios
- Tailwind CSS
- React Hot Toast
- Vite
