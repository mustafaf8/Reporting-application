# Reporting App API Dokümantasyonu

## Genel Bakış

Reporting App API, yeni nesil, dinamik ve gerçek zamanlı blok editörü için geliştirilmiş kapsamlı bir RESTful API'dir. Bu API, Canva'nın esnekliği ve Figma'nın performansını hedefleyen, tamamen modüler, API tabanlı ve sunucu tarafında işlenebilen bir blok editör sistemi sağlar.

## Özellikler

### 🎨 Blok Editörü

- **Esnek Blok Sistemi**: Metin, başlık, görsel, tablo, spacer, divider ve özel bloklar
- **Gerçek Zamanlı Düzenleme**: WebSocket tabanlı canlı işbirliği
- **Sürükle-Bırak**: Kullanıcı dostu arayüz
- **Anlık Önizleme**: Değişikliklerin anında görüntülenmesi

### 🔐 Güvenlik

- **XSS Koruması**: Tüm girişlerin sanitize edilmesi
- **SQL Injection Koruması**: NoSQL injection saldırılarına karşı koruma
- **Rate Limiting**: API isteklerinin sınırlandırılması
- **CSRF Koruması**: Cross-site request forgery koruması
- **JWT Authentication**: Güvenli token tabanlı kimlik doğrulama

### 📊 Performans

- **Redis Caching**: Sık kullanılan verilerin önbelleğe alınması
- **Database Optimization**: Optimize edilmiş MongoDB sorguları
- **Load Testing**: Kapsamlı performans testleri
- **Memory Management**: Bellek kullanımının optimize edilmesi

### 🤝 İşbirliği

- **Gerçek Zamanlı Paylaşım**: Canlı işbirliği özellikleri
- **İzin Yönetimi**: Detaylı erişim kontrolü
- **Sürüm Kontrolü**: Değişiklik geçmişinin takibi
- **Fork Sistemi**: Şablonların kopyalanması ve özelleştirilmesi

### 🔄 Dinamik Veri Entegrasyonu

- **Yer Tutucu Sistemi**: `{{variable}}` formatında dinamik veri
- **Çoklu Veri Kaynağı**: Kullanıcı, şirket, müşteri, ürün verileri
- **Otomatik Doldurma**: Şablonların gerçek verilerle doldurulması
- **EJS Desteği**: Mevcut EJS şablonlarıyla uyumluluk

## API Endpoints

### Kimlik Doğrulama

- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/logout` - Kullanıcı çıkışı
- `GET /api/auth/profile` - Kullanıcı profili

### Şablon Yönetimi

- `GET /api/templates` - Şablonları listele
- `POST /api/templates` - Yeni şablon oluştur
- `GET /api/templates/:id` - Şablon detayını getir
- `PUT /api/templates/:id` - Şablonu güncelle
- `DELETE /api/templates/:id` - Şablonu sil

### Blok Editörü

- `GET /api/block-editor/templates/:id/blocks` - Blokları getir
- `POST /api/block-editor/templates/:id/blocks` - Blok ekle
- `PUT /api/block-editor/templates/:id/blocks/:blockId` - Bloku güncelle
- `DELETE /api/block-editor/templates/:id/blocks/:blockId` - Bloku sil
- `POST /api/block-editor/templates/:id/blocks/reorder` - Blokları yeniden sırala

### Paylaşım ve İşbirliği

- `POST /api/sharing/templates/:id/share` - Şablonu paylaş
- `DELETE /api/sharing/templates/:id/unshare` - Paylaşımı kaldır
- `GET /api/sharing/templates/accessible` - Erişilebilir şablonlar
- `POST /api/sharing/templates/:id/fork` - Şablonu fork et

### Dinamik Veri

- `POST /api/dynamic-data/templates/:id/populate` - Şablonu doldur
- `POST /api/dynamic-data/templates/:id/preview` - Önizleme oluştur
- `GET /api/dynamic-data/templates/:id/placeholders` - Yer tutucuları getir

### Güvenlik

- `POST /api/security/sanitize-text` - Metni temizle
- `POST /api/security/sanitize-html` - HTML temizle
- `POST /api/security/validate-email` - E-posta doğrula
- `POST /api/security/generate-csrf-token` - CSRF token oluştur

### Performans

- `GET /api/performance/health` - Sistem sağlık durumu
- `GET /api/performance/metrics` - Performans metrikleri
- `POST /api/performance/test-endpoint` - Endpoint testi
- `POST /api/performance/load-test` - Yük testi

## Veri Modelleri

### User (Kullanıcı)

```json
{
  "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "role": "user",
  "subscription": {
    "plan": "pro",
    "status": "active",
    "features": {
      "templates": 100,
      "blocks": 1000,
      "assets": 200,
      "collaborators": 10
    }
  },
  "stats": {
    "totalTemplates": 15,
    "totalProposals": 45,
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

### Template (Şablon)

```json
{
  "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
  "name": "Teklif Şablonu",
  "description": "Müşteriler için özel teklif şablonu",
  "blocks": [
    {
      "id": "block-1",
      "type": "heading",
      "content": {
        "text": "Teklif Başlığı",
        "level": 1
      },
      "styles": {
        "fontSize": 24,
        "color": "#333333",
        "textAlign": "center"
      },
      "position": {
        "x": 100,
        "y": 50,
        "width": 400,
        "height": 60
      },
      "order": 1
    }
  ],
  "globalStyles": {
    "primaryColor": "#4f46e5",
    "fontFamily": "Inter, sans-serif",
    "fontSize": 16
  },
  "owner": "60f7b3b3b3b3b3b3b3b3b3b3",
  "isPublic": false,
  "status": "published"
}
```

### Block (Blok)

```json
{
  "id": "block-1",
  "type": "text",
  "content": {
    "text": "Merhaba {{customerName}}!",
    "fontSize": 16,
    "color": "#000000"
  },
  "styles": {
    "fontSize": 16,
    "color": "#000000",
    "textAlign": "left",
    "lineHeight": 1.5
  },
  "position": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 50
  },
  "metadata": {
    "placeholder": "customerName",
    "required": true
  },
  "order": 1
}
```

## Kimlik Doğrulama

API, JWT (JSON Web Token) tabanlı kimlik doğrulama kullanır. Tüm korumalı endpoint'lere erişim için Authorization header'ında Bearer token gönderilmelidir.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Hata Yönetimi

API, standart HTTP durum kodlarını kullanır:

- `200 OK` - İşlem başarılı
- `201 Created` - Kaynak oluşturuldu
- `400 Bad Request` - Geçersiz istek
- `401 Unauthorized` - Yetkisiz erişim
- `403 Forbidden` - Erişim reddedildi
- `404 Not Found` - Kaynak bulunamadı
- `429 Too Many Requests` - Çok fazla istek
- `500 Internal Server Error` - Sunucu hatası

Hata yanıtları aşağıdaki formatta döner:

```json
{
  "success": false,
  "message": "Hata mesajı",
  "error": "Detaylı hata bilgisi"
}
```

## Rate Limiting

API, güvenlik ve performans için rate limiting uygular:

- **Genel API**: 100 istek/15 dakika
- **Kimlik Doğrulama**: 5 istek/15 dakika
- **Dosya Yükleme**: 10 istek/15 dakika
- **Performans Testleri**: 5 istek/15 dakika

## Önbellekleme

API, performans optimizasyonu için Redis önbellekleme kullanır:

- **Şablonlar**: 1 saat
- **Kullanıcı Verileri**: 30 dakika
- **Asset Listesi**: 2 saat
- **Performans Metrikleri**: 5 dakika

## WebSocket Events

Gerçek zamanlı işbirliği için WebSocket eventleri:

### Client → Server

- `join_template` - Şablon odasına katıl
- `leave_template` - Şablon odasından ayrıl
- `block_change` - Blok değişikliği
- `cursor_position` - İmleç pozisyonu
- `selection` - Seçim durumu

### Server → Client

- `template_updated` - Şablon güncellendi
- `block_added` - Blok eklendi
- `block_updated` - Blok güncellendi
- `block_deleted` - Blok silindi
- `user_joined` - Kullanıcı katıldı
- `user_left` - Kullanıcı ayrıldı

## Örnek Kullanım

### 1. Kullanıcı Girişi

```javascript
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
  }),
});

const data = await response.json();
const token = data.token;
```

### 2. Şablon Oluşturma

```javascript
const response = await fetch("/api/templates", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: "Yeni Teklif Şablonu",
    description: "Müşteriler için özel teklif şablonu",
    blocks: [
      {
        id: "block-1",
        type: "heading",
        content: { text: "Teklif Başlığı" },
        styles: { fontSize: 24, color: "#333" },
        position: { x: 100, y: 50, width: 400, height: 60 },
        order: 1,
      },
    ],
  }),
});
```

### 3. Blok Ekleme

```javascript
const response = await fetch(
  `/api/block-editor/templates/${templateId}/blocks`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: "text",
      content: { text: "Merhaba {{customerName}}!" },
      styles: { fontSize: 16, color: "#000" },
      position: { x: 100, y: 200, width: 300, height: 50 },
      order: 2,
    }),
  }
);
```

### 4. Dinamik Veri ile Doldurma

```javascript
const response = await fetch(
  `/api/dynamic-data/templates/${templateId}/populate`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        customerName: "Ahmet Yılmaz",
        customerEmail: "ahmet@example.com",
        projectName: "Web Sitesi Geliştirme",
        totalAmount: 50000,
      },
    }),
  }
);
```

## Geliştirme Ortamı

### Gereksinimler

- Node.js 18+
- MongoDB 5.0+
- Redis 6.0+
- npm veya yarn

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
cp .env.example .env

# Veritabanını başlat
npm run db:start

# Uygulamayı başlat
npm run dev
```

### Test

```bash
# Unit testleri çalıştır
npm run test

# Integration testleri çalıştır
npm run test:integration

# E2E testleri çalıştır
npm run test:e2e
```

## API Dokümantasyonu

Canlı API dokümantasyonu için:

- **Swagger UI**: `http://localhost:5000/api-docs`
- **OpenAPI Spec**: `http://localhost:5000/api-docs.json`

## Destek

API ile ilgili sorularınız için:

- **E-posta**: support@reportingapp.com
- **Dokümantasyon**: [API Docs](http://localhost:5000/api-docs)
- **GitHub**: [Repository](https://github.com/reportingapp/api)

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.
