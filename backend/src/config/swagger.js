const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Reporting App API',
      version: '1.0.0',
      description: 'Yeni nesil, dinamik ve gerçek zamanlı blok editörü API dokümantasyonu',
      contact: {
        name: 'API Support',
        email: 'support@reportingapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.reportingapp.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Kullanıcı ID\'si'
            },
            name: {
              type: 'string',
              description: 'Kullanıcı adı'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-posta adresi'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              description: 'Kullanıcı rolü'
            },
            subscription: {
              $ref: '#/components/schemas/Subscription'
            },
            stats: {
              $ref: '#/components/schemas/UserStats'
            },
            relationships: {
              $ref: '#/components/schemas/UserRelationships'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Güncellenme tarihi'
            }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            plan: {
              type: 'string',
              enum: ['free', 'basic', 'pro', 'enterprise'],
              description: 'Abonelik planı'
            },
            status: {
              type: 'string',
              enum: ['inactive', 'active', 'cancelled', 'past_due', 'trialing'],
              description: 'Abonelik durumu'
            },
            features: {
              $ref: '#/components/schemas/SubscriptionFeatures'
            },
            currentPeriodEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Mevcut dönem bitiş tarihi'
            }
          }
        },
        SubscriptionFeatures: {
          type: 'object',
          properties: {
            templates: {
              type: 'number',
              description: 'Maksimum şablon sayısı'
            },
            blocks: {
              type: 'number',
              description: 'Maksimum blok sayısı'
            },
            assets: {
              type: 'number',
              description: 'Maksimum asset sayısı'
            },
            collaborators: {
              type: 'number',
              description: 'Maksimum işbirlikçi sayısı'
            },
            versionHistory: {
              type: 'number',
              description: 'Maksimum sürüm geçmişi sayısı'
            },
            exports: {
              type: 'number',
              description: 'Maksimum export sayısı'
            }
          }
        },
        UserStats: {
          type: 'object',
          properties: {
            totalTemplates: {
              type: 'number',
              description: 'Toplam şablon sayısı'
            },
            totalProposals: {
              type: 'number',
              description: 'Toplam teklif sayısı'
            },
            totalProducts: {
              type: 'number',
              description: 'Toplam ürün sayısı'
            },
            totalAssets: {
              type: 'number',
              description: 'Toplam asset sayısı'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Son giriş tarihi'
            },
            loginCount: {
              type: 'number',
              description: 'Giriş sayısı'
            }
          }
        },
        UserRelationships: {
          type: 'object',
          properties: {
            ownedTemplates: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Sahip olunan şablonlar'
            },
            sharedTemplates: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Paylaşılan şablonlar'
            },
            createdProposals: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Oluşturulan teklifler'
            },
            collaborators: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Collaborator'
              },
              description: 'İşbirlikçiler'
            }
          }
        },
        Collaborator: {
          type: 'object',
          properties: {
            user: {
              type: 'string',
              description: 'Kullanıcı ID\'si'
            },
            permission: {
              type: 'string',
              enum: ['view', 'edit', 'admin'],
              description: 'İzin seviyesi'
            },
            addedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Eklenme tarihi'
            }
          }
        },
        Template: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Şablon ID\'si'
            },
            name: {
              type: 'string',
              description: 'Şablon adı'
            },
            description: {
              type: 'string',
              description: 'Şablon açıklaması'
            },
            blocks: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Block'
              },
              description: 'Şablon blokları'
            },
            globalStyles: {
              $ref: '#/components/schemas/GlobalStyles'
            },
            canvasSize: {
              $ref: '#/components/schemas/CanvasSize'
            },
            owner: {
              type: 'string',
              description: 'Sahip kullanıcı ID\'si'
            },
            isPublic: {
              type: 'boolean',
              description: 'Genel erişim durumu'
            },
            sharingPermissions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/SharingPermission'
              },
              description: 'Paylaşım izinleri'
            },
            version: {
              type: 'number',
              description: 'Mevcut sürüm numarası'
            },
            versionHistory: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/VersionHistory'
              },
              description: 'Sürüm geçmişi'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
              description: 'Şablon durumu'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Şablon etiketleri'
            },
            relationships: {
              $ref: '#/components/schemas/TemplateRelationships'
            },
            usageCount: {
              type: 'number',
              description: 'Kullanım sayısı'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Güncellenme tarihi'
            }
          }
        },
        Block: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Blok ID\'si'
            },
            type: {
              type: 'string',
              enum: ['text', 'heading', 'image', 'table', 'spacer', 'divider', 'customer', 'company', 'pricing', 'signature'],
              description: 'Blok türü'
            },
            content: {
              type: 'object',
              description: 'Blok içeriği'
            },
            styles: {
              type: 'object',
              description: 'Blok stilleri'
            },
            position: {
              type: 'object',
              description: 'Blok pozisyonu'
            },
            metadata: {
              type: 'object',
              description: 'Blok metadata'
            },
            order: {
              type: 'number',
              description: 'Blok sırası'
            }
          }
        },
        GlobalStyles: {
          type: 'object',
          properties: {
            primaryColor: {
              type: 'string',
              description: 'Ana renk'
            },
            secondaryColor: {
              type: 'string',
              description: 'İkincil renk'
            },
            fontFamily: {
              type: 'string',
              description: 'Font ailesi'
            },
            fontSize: {
              type: 'number',
              description: 'Font boyutu'
            },
            lineHeight: {
              type: 'number',
              description: 'Satır yüksekliği'
            },
            backgroundColor: {
              type: 'string',
              description: 'Arka plan rengi'
            },
            textColor: {
              type: 'string',
              description: 'Metin rengi'
            },
            borderRadius: {
              type: 'number',
              description: 'Köşe yuvarlaklığı'
            },
            spacing: {
              type: 'number',
              description: 'Boşluk'
            }
          }
        },
        CanvasSize: {
          type: 'object',
          properties: {
            width: {
              type: 'number',
              description: 'Genişlik'
            },
            height: {
              type: 'number',
              description: 'Yükseklik'
            },
            unit: {
              type: 'string',
              enum: ['px', 'mm', 'cm', 'in'],
              description: 'Birim'
            }
          }
        },
        SharingPermission: {
          type: 'object',
          properties: {
            user: {
              type: 'string',
              description: 'Kullanıcı ID\'si'
            },
            permission: {
              type: 'string',
              enum: ['view', 'edit', 'admin'],
              description: 'İzin seviyesi'
            },
            addedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Eklenme tarihi'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Son kullanma tarihi'
            },
            message: {
              type: 'string',
              description: 'Paylaşım mesajı'
            }
          }
        },
        VersionHistory: {
          type: 'object',
          properties: {
            version: {
              type: 'number',
              description: 'Sürüm numarası'
            },
            changes: {
              type: 'string',
              description: 'Yapılan değişiklikler'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            },
            createdBy: {
              type: 'string',
              description: 'Oluşturan kullanıcı ID\'si'
            },
            data: {
              type: 'object',
              description: 'Sürüm verisi'
            }
          }
        },
        TemplateRelationships: {
          type: 'object',
          properties: {
            usedInProposals: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kullanıldığı teklifler'
            },
            forkedFrom: {
              type: 'string',
              description: 'Fork edildiği şablon ID\'si'
            },
            forks: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Fork eden şablonlar'
            },
            categories: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kategoriler'
            },
            relatedTemplates: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'İlgili şablonlar'
            }
          }
        },
        Proposal: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Teklif ID\'si'
            },
            customerName: {
              type: 'string',
              description: 'Müşteri adı'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProposalItem'
              },
              description: 'Teklif kalemleri'
            },
            grandTotal: {
              type: 'number',
              description: 'Toplam tutar'
            },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'approved', 'rejected'],
              description: 'Teklif durumu'
            },
            owner: {
              type: 'string',
              description: 'Sahip kullanıcı ID\'si'
            },
            template: {
              type: 'string',
              description: 'Kullanılan şablon ID\'si'
            },
            customizations: {
              type: 'object',
              description: 'Özelleştirmeler'
            },
            vatRate: {
              type: 'number',
              description: 'KDV oranı'
            },
            discountRate: {
              type: 'number',
              description: 'İndirim oranı'
            },
            extraCosts: {
              type: 'number',
              description: 'Ek maliyetler'
            },
            relationships: {
              $ref: '#/components/schemas/ProposalRelationships'
            },
            metadata: {
              $ref: '#/components/schemas/ProposalMetadata'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Güncellenme tarihi'
            }
          }
        },
        ProposalItem: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Kalem adı'
            },
            quantity: {
              type: 'number',
              description: 'Miktar'
            },
            unitPrice: {
              type: 'number',
              description: 'Birim fiyat'
            },
            lineTotal: {
              type: 'number',
              description: 'Satır toplamı'
            }
          }
        },
        ProposalRelationships: {
          type: 'object',
          properties: {
            templateVersion: {
              type: 'number',
              description: 'Kullanılan şablon sürümü'
            },
            forkedFrom: {
              type: 'string',
              description: 'Fork edildiği teklif ID\'si'
            },
            forks: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Fork eden teklifler'
            },
            relatedProposals: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'İlgili teklifler'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Etiketler'
            },
            categories: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kategoriler'
            }
          }
        },
        ProposalMetadata: {
          type: 'object',
          properties: {
            clientEmail: {
              type: 'string',
              format: 'email',
              description: 'Müşteri e-posta adresi'
            },
            clientPhone: {
              type: 'string',
              description: 'Müşteri telefon numarası'
            },
            projectName: {
              type: 'string',
              description: 'Proje adı'
            },
            projectDescription: {
              type: 'string',
              description: 'Proje açıklaması'
            },
            validUntil: {
              type: 'string',
              format: 'date-time',
              description: 'Geçerlilik tarihi'
            },
            notes: {
              type: 'string',
              description: 'Notlar'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Ürün ID\'si'
            },
            name: {
              type: 'string',
              description: 'Ürün adı'
            },
            unit: {
              type: 'string',
              enum: ['adet', 'kg', 'm', 'm²', 'm³', 'lt', 'paket', 'set'],
              description: 'Birim'
            },
            unitPrice: {
              type: 'number',
              description: 'Birim fiyat'
            },
            category: {
              type: 'string',
              description: 'Kategori'
            },
            description: {
              type: 'string',
              description: 'Açıklama'
            },
            isActive: {
              type: 'boolean',
              description: 'Aktif durumu'
            },
            createdBy: {
              type: 'string',
              description: 'Oluşturan kullanıcı ID\'si'
            },
            relationships: {
              $ref: '#/components/schemas/ProductRelationships'
            },
            metadata: {
              $ref: '#/components/schemas/ProductMetadata'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Güncellenme tarihi'
            }
          }
        },
        ProductRelationships: {
          type: 'object',
          properties: {
            usedInProposals: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kullanıldığı teklifler'
            },
            usedInTemplates: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kullanıldığı şablonlar'
            },
            relatedProducts: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'İlgili ürünler'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Etiketler'
            },
            categories: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kategoriler'
            }
          }
        },
        ProductMetadata: {
          type: 'object',
          properties: {
            sku: {
              type: 'string',
              description: 'SKU kodu'
            },
            barcode: {
              type: 'string',
              description: 'Barkod'
            },
            weight: {
              type: 'number',
              description: 'Ağırlık'
            },
            dimensions: {
              $ref: '#/components/schemas/Dimensions'
            },
            supplier: {
              type: 'string',
              description: 'Tedarikçi'
            },
            notes: {
              type: 'string',
              description: 'Notlar'
            }
          }
        },
        Dimensions: {
          type: 'object',
          properties: {
            length: {
              type: 'number',
              description: 'Uzunluk'
            },
            width: {
              type: 'number',
              description: 'Genişlik'
            },
            height: {
              type: 'number',
              description: 'Yükseklik'
            }
          }
        },
        Asset: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Asset ID\'si'
            },
            publicId: {
              type: 'string',
              description: 'Cloudinary public ID'
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Asset URL\'si'
            },
            metadata: {
              $ref: '#/components/schemas/AssetMetadata'
            },
            owner: {
              type: 'string',
              description: 'Sahip kullanıcı ID\'si'
            },
            relationships: {
              $ref: '#/components/schemas/AssetRelationships'
            },
            usage: {
              $ref: '#/components/schemas/AssetUsage'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Oluşturulma tarihi'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Güncellenme tarihi'
            }
          }
        },
        AssetMetadata: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Dosya adı'
            },
            mimeType: {
              type: 'string',
              description: 'MIME türü'
            },
            size: {
              type: 'number',
              description: 'Dosya boyutu'
            },
            width: {
              type: 'number',
              description: 'Genişlik (görsel için)'
            },
            height: {
              type: 'number',
              description: 'Yükseklik (görsel için)'
            },
            alt: {
              type: 'string',
              description: 'Alt metin'
            },
            title: {
              type: 'string',
              description: 'Başlık'
            }
          }
        },
        AssetRelationships: {
          type: 'object',
          properties: {
            usedInTemplates: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kullanıldığı şablonlar'
            },
            usedInProposals: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kullanıldığı teklifler'
            },
            relatedAssets: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'İlgili assetler'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Etiketler'
            },
            categories: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Kategoriler'
            }
          }
        },
        AssetUsage: {
          type: 'object',
          properties: {
            downloadCount: {
              type: 'number',
              description: 'İndirme sayısı'
            },
            viewCount: {
              type: 'number',
              description: 'Görüntülenme sayısı'
            },
            lastUsed: {
              type: 'string',
              format: 'date-time',
              description: 'Son kullanım tarihi'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Hata mesajı'
            },
            error: {
              type: 'string',
              description: 'Detaylı hata bilgisi'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Başarı mesajı'
            },
            data: {
              type: 'object',
              description: 'Dönen veri'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Yetkisiz erişim',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Yetkisiz erişim',
                error: 'Token gerekli'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Erişim reddedildi',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Erişim reddedildi',
                error: 'Bu işlem için yetkiniz yok'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Kaynak bulunamadı',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Kaynak bulunamadı',
                error: 'İstenen kaynak mevcut değil'
              }
            }
          }
        },
        ValidationError: {
          description: 'Doğrulama hatası',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Doğrulama hatası',
                error: 'Gerekli alanlar eksik'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Sunucu hatası',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Sunucu hatası',
                error: 'Beklenmeyen bir hata oluştu'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi
};
