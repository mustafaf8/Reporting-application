/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Kullanıcı kimlik doğrulama işlemleri
 *   - name: Users
 *     description: Kullanıcı yönetimi
 *   - name: Templates
 *     description: Şablon yönetimi
 *   - name: Blocks
 *     description: Blok editörü işlemleri
 *   - name: Proposals
 *     description: Teklif yönetimi
 *   - name: Products
 *     description: Ürün yönetimi
 *   - name: Assets
 *     description: Dosya yönetimi
 *   - name: Sharing
 *     description: Paylaşım ve işbirliği
 *   - name: Collaboration
 *     description: Gerçek zamanlı işbirliği
 *   - name: Dynamic Data
 *     description: Dinamik veri entegrasyonu
 *   - name: Security
 *     description: Güvenlik işlemleri
 *   - name: Performance
 *     description: Performans testleri ve optimizasyon
 *   - name: Relationships
 *     description: Veritabanı ilişkileri
 *   - name: Migration
 *     description: Veritabanı migrasyonu
 *   - name: Audit Logs
 *     description: İşlem günlükleri
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Kullanıcı girişi
 *     description: E-posta ve şifre ile kullanıcı girişi yapar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Giriş başarılı"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/templates:
 *   get:
 *     tags: [Templates]
 *     summary: Şablonları listele
 *     description: Kullanıcının erişebileceği şablonları getirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Şablon durumu
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Arama terimi
 *     responses:
 *       200:
 *         description: Şablon listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Şablonlar başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     templates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Template'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/templates:
 *   post:
 *     tags: [Templates]
 *     summary: Yeni şablon oluştur
 *     description: Yeni bir şablon oluşturur
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Yeni Teklif Şablonu"
 *               description:
 *                 type: string
 *                 example: "Müşteriler için özel teklif şablonu"
 *               blocks:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Block'
 *               globalStyles:
 *                 $ref: '#/components/schemas/GlobalStyles'
 *               canvasSize:
 *                 $ref: '#/components/schemas/CanvasSize'
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["teklif", "müşteri", "satış"]
 *     responses:
 *       201:
 *         description: Şablon başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Şablon başarıyla oluşturuldu"
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     tags: [Templates]
 *     summary: Şablon detayını getir
 *     description: Belirli bir şablonun detaylarını getirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *     responses:
 *       200:
 *         description: Şablon detayı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Şablon detayı getirildi"
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     tags: [Templates]
 *     summary: Şablonu güncelle
 *     description: Mevcut bir şablonu günceller
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Güncellenmiş Şablon Adı"
 *               description:
 *                 type: string
 *                 example: "Güncellenmiş açıklama"
 *               blocks:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Block'
 *               globalStyles:
 *                 $ref: '#/components/schemas/GlobalStyles'
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: "published"
 *     responses:
 *       200:
 *         description: Şablon başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Şablon başarıyla güncellendi"
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     tags: [Templates]
 *     summary: Şablonu sil
 *     description: Bir şablonu siler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *     responses:
 *       200:
 *         description: Şablon başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Şablon başarıyla silindi"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/block-editor/templates/{id}/blocks:
 *   get:
 *     tags: [Blocks]
 *     summary: Şablon bloklarını getir
 *     description: Belirli bir şablonun bloklarını getirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *     responses:
 *       200:
 *         description: Blok listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Bloklar başarıyla getirildi"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Block'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/block-editor/templates/{id}/blocks:
 *   post:
 *     tags: [Blocks]
 *     summary: Yeni blok ekle
 *     description: Şablona yeni bir blok ekler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [text, heading, image, table, spacer, divider, customer, company, pricing, signature]
 *                 example: "text"
 *               content:
 *                 type: object
 *                 example:
 *                   text: "Merhaba dünya!"
 *                   fontSize: 16
 *                   color: "#000000"
 *               styles:
 *                 type: object
 *                 example:
 *                   fontSize: 16
 *                   color: "#000000"
 *                   textAlign: "left"
 *               position:
 *                 type: object
 *                 example:
 *                   x: 100
 *                   y: 200
 *                   width: 300
 *                   height: 50
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Blok başarıyla eklendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Blok başarıyla eklendi"
 *                 data:
 *                   $ref: '#/components/schemas/Block'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/block-editor/templates/{id}/blocks/{blockId}:
 *   put:
 *     tags: [Blocks]
 *     summary: Bloku güncelle
 *     description: Mevcut bir bloku günceller
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blok ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *                 example:
 *                   text: "Güncellenmiş metin"
 *               styles:
 *                 type: object
 *                 example:
 *                   fontSize: 18
 *                   color: "#333333"
 *               position:
 *                 type: object
 *                 example:
 *                   x: 150
 *                   y: 250
 *     responses:
 *       200:
 *         description: Blok başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Blok başarıyla güncellendi"
 *                 data:
 *                   $ref: '#/components/schemas/Block'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/block-editor/templates/{id}/blocks/{blockId}:
 *   delete:
 *     tags: [Blocks]
 *     summary: Bloku sil
 *     description: Bir bloku siler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blok ID'si
 *     responses:
 *       200:
 *         description: Blok başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Blok başarıyla silindi"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/sharing/templates/{id}/share:
 *   post:
 *     tags: [Sharing]
 *     summary: Şablonu paylaş
 *     description: Şablonu başka kullanıcılarla paylaşır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sharingData
 *             properties:
 *               sharingData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - userId
 *                     - permission
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     permission:
 *                       type: string
 *                       enum: [view, edit, admin]
 *                       example: "view"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-12-31T23:59:59Z"
 *                     message:
 *                       type: string
 *                       example: "Bu şablonu inceleyebilirsiniz"
 *     responses:
 *       200:
 *         description: Şablon başarıyla paylaşıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Şablon başarıyla paylaşıldı"
 *                 result:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           permission:
 *                             type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/dynamic-data/templates/{id}/populate:
 *   post:
 *     tags: [Dynamic Data]
 *     summary: Şablonu dinamik verilerle doldur
 *     description: Şablon içindeki yer tutucuları gerçek verilerle doldurur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Şablon ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 example:
 *                   customerName: "Ahmet Yılmaz"
 *                   customerEmail: "ahmet@example.com"
 *                   projectName: "Web Sitesi Geliştirme"
 *                   totalAmount: 50000
 *               options:
 *                 type: object
 *                 properties:
 *                   includeUserData:
 *                     type: boolean
 *                     default: true
 *                   includeSystemData:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       200:
 *         description: Şablon başarıyla dolduruldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Şablon başarıyla dolduruldu"
 *                 template:
 *                   $ref: '#/components/schemas/Template'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/performance/health:
 *   get:
 *     tags: [Performance]
 *     summary: Sistem sağlık durumu
 *     description: Sistem sağlık durumunu kontrol eder
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sistem sağlık durumu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sistem sağlık durumu kontrol edildi"
 *                 health:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     checks:
 *                       type: object
 *                       properties:
 *                         memory:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [ok, warning, error]
 *                             usage:
 *                               type: number
 *                               example: 75.5
 *                             threshold:
 *                               type: number
 *                               example: 90
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [ok, error]
 *                             collections:
 *                               type: number
 *                               example: 5
 *                             dataSize:
 *                               type: number
 *                               example: 1024000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/security/sanitize-text:
 *   post:
 *     tags: [Security]
 *     summary: Metni temizle
 *     description: Metni XSS saldırılarına karşı temizler
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "<script>alert('XSS')</script>Merhaba dünya!"
 *               options:
 *                 type: object
 *                 properties:
 *                   ALLOWED_TAGS:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["b", "i", "em", "strong"]
 *     responses:
 *       200:
 *         description: Metin başarıyla temizlendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Metin başarıyla temizlendi"
 *                 originalText:
 *                   type: string
 *                   example: "<script>alert('XSS')</script>Merhaba dünya!"
 *                 sanitizedText:
 *                   type: string
 *                   example: "Merhaba dünya!"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

module.exports = {};
