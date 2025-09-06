const ejs = require("ejs");
const path = require("path");
const fs = require("fs").promises;
const logger = require("../config/logger");

class BlockEditorService {
  constructor() {
    this.templateCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 dakika
  }

  // Blokları HTML'e dönüştürme
  async renderBlocksToHTML(blocks, globalStyles, canvasSize, data = {}) {
    try {
      let html = "";

      for (const block of blocks) {
        const blockHTML = await this.renderBlock(block, globalStyles, data);
        html += blockHTML;
      }

      return this.wrapInDocument(html, globalStyles, canvasSize);
    } catch (error) {
      logger.error("Error rendering blocks to HTML", {
        error: error.message,
        blockCount: blocks.length,
      });
      throw error;
    }
  }

  // Tek blok render etme
  async renderBlock(block, globalStyles, data = {}) {
    const { type, content, styles, metadata } = block;

    // Global stilleri blok stilleriyle birleştir
    const combinedStyles = this.mergeStyles(globalStyles, styles);

    switch (type) {
      case "text":
        return this.renderTextBlock(content, combinedStyles, data);

      case "heading":
        return this.renderHeadingBlock(content, combinedStyles, data);

      case "image":
        return this.renderImageBlock(content, combinedStyles, data);

      case "table":
        return this.renderTableBlock(content, combinedStyles, data);

      case "spacer":
        return this.renderSpacerBlock(content, combinedStyles);

      case "divider":
        return this.renderDividerBlock(content, combinedStyles);

      case "customer":
        return this.renderCustomerBlock(content, combinedStyles, data);

      case "company":
        return this.renderCompanyBlock(content, combinedStyles, data);

      case "pricing":
        return this.renderPricingBlock(content, combinedStyles, data);

      case "signature":
        return this.renderSignatureBlock(content, combinedStyles, data);

      default:
        logger.warn("Unknown block type", { type });
        return `<div class="unknown-block">Bilinmeyen blok türü: ${type}</div>`;
    }
  }

  // Metin bloğu render etme
  renderTextBlock(content, styles, data) {
    const text = this.replacePlaceholders(content.text || "", data);
    const styleString = this.generateStyleString(styles);

    return `
      <div class="block text-block" style="${styleString}">
        <p>${text}</p>
      </div>
    `;
  }

  // Başlık bloğu render etme
  renderHeadingBlock(content, styles, data) {
    const text = this.replacePlaceholders(content.text || "", data);
    const level = content.level || 1;
    const styleString = this.generateStyleString(styles);

    return `
      <div class="block heading-block" style="${styleString}">
        <h${level}>${text}</h${level}>
      </div>
    `;
  }

  // Resim bloğu render etme
  renderImageBlock(content, styles, data) {
    const imageUrl = this.replacePlaceholders(content.imageUrl || "", data);
    const alt = this.replacePlaceholders(content.alt || "Resim", data);
    const styleString = this.generateStyleString(styles);

    return `
      <div class="block image-block" style="${styleString}">
        <img src="${imageUrl}" alt="${alt}" style="max-width: 100%; height: auto;" />
      </div>
    `;
  }

  // Tablo bloğu render etme
  renderTableBlock(content, styles, data) {
    const headers = content.headers || [];
    const rows = content.rows || [];
    const styleString = this.generateStyleString(styles);

    let tableHTML = `
      <div class="block table-block" style="${styleString}">
        <table style="width: 100%; border-collapse: collapse;">
    `;

    // Başlık satırı
    if (headers.length > 0) {
      tableHTML += "<thead><tr>";
      headers.forEach((header) => {
        const headerText = this.replacePlaceholders(header, data);
        tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">${headerText}</th>`;
      });
      tableHTML += "</tr></thead>";
    }

    // Veri satırları
    if (rows.length > 0) {
      tableHTML += "<tbody>";
      rows.forEach((row) => {
        tableHTML += "<tr>";
        row.forEach((cell) => {
          const cellText = this.replacePlaceholders(cell, data);
          tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${cellText}</td>`;
        });
        tableHTML += "</tr>";
      });
      tableHTML += "</tbody>";
    }

    tableHTML += "</table></div>";
    return tableHTML;
  }

  // Boşluk bloğu render etme
  renderSpacerBlock(content, styles) {
    const height = content.height || 20;
    const styleString = this.generateStyleString(styles);

    return `
      <div class="block spacer-block" style="${styleString}; height: ${height}px;"></div>
    `;
  }

  // Ayırıcı bloğu render etme
  renderDividerBlock(content, styles) {
    const styleString = this.generateStyleString(styles);
    const color = content.color || "#ddd";
    const thickness = content.thickness || 1;

    return `
      <div class="block divider-block" style="${styleString}">
        <hr style="border: none; border-top: ${thickness}px solid ${color}; margin: 10px 0;" />
      </div>
    `;
  }

  // Müşteri bloğu render etme
  renderCustomerBlock(content, styles, data) {
    const customerData = data.customer || {};
    const name = this.replacePlaceholders(
      content.name || customerData.name || "Müşteri Adı",
      data
    );
    const email = this.replacePlaceholders(
      content.email || customerData.email || "",
      data
    );
    const phone = this.replacePlaceholders(
      content.phone || customerData.phone || "",
      data
    );
    const address = this.replacePlaceholders(
      content.address || customerData.address || "",
      data
    );
    const styleString = this.generateStyleString(styles);

    return `
      <div class="block customer-block" style="${styleString}">
        <h3>Müşteri Bilgileri</h3>
        <p><strong>Ad:</strong> ${name}</p>
        ${email ? `<p><strong>E-posta:</strong> ${email}</p>` : ""}
        ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ""}
        ${address ? `<p><strong>Adres:</strong> ${address}</p>` : ""}
      </div>
    `;
  }

  // Şirket bloğu render etme
  renderCompanyBlock(content, styles, data) {
    const companyData = data.company || {};
    const name = this.replacePlaceholders(
      content.name || companyData.name || "Şirket Adı",
      data
    );
    const email = this.replacePlaceholders(
      content.email || companyData.email || "",
      data
    );
    const phone = this.replacePlaceholders(
      content.phone || companyData.phone || "",
      data
    );
    const address = this.replacePlaceholders(
      content.address || companyData.address || "",
      data
    );
    const logo = this.replacePlaceholders(
      content.logo || companyData.logo || "",
      data
    );
    const styleString = this.generateStyleString(styles);

    return `
      <div class="block company-block" style="${styleString}">
        ${
          logo
            ? `<img src="${logo}" alt="${name}" style="max-height: 50px; margin-bottom: 10px;" />`
            : ""
        }
        <h3>${name}</h3>
        ${email ? `<p><strong>E-posta:</strong> ${email}</p>` : ""}
        ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ""}
        ${address ? `<p><strong>Adres:</strong> ${address}</p>` : ""}
      </div>
    `;
  }

  // Fiyatlandırma bloğu render etme
  renderPricingBlock(content, styles, data) {
    const items = content.items || [];
    const total = content.total || 0;
    const currency = content.currency || "TL";
    const styleString = this.generateStyleString(styles);

    let tableHTML = `
      <div class="block pricing-block" style="${styleString}">
        <h3>Fiyatlandırma</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Açıklama</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Miktar</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Birim Fiyat</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Toplam</th>
            </tr>
          </thead>
          <tbody>
    `;

    items.forEach((item) => {
      const description = this.replacePlaceholders(
        item.description || "",
        data
      );
      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      const itemTotal = quantity * unitPrice;

      tableHTML += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${description}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${quantity}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${unitPrice.toFixed(
            2
          )} ${currency}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${itemTotal.toFixed(
            2
          )} ${currency}</td>
        </tr>
      `;
    });

    tableHTML += `
          </tbody>
          <tfoot>
            <tr style="background-color: #f0f0f0; font-weight: bold;">
              <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;">TOPLAM:</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${total.toFixed(
                2
              )} ${currency}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    return tableHTML;
  }

  // İmza bloğu render etme
  renderSignatureBlock(content, styles, data) {
    const signature = this.replacePlaceholders(content.signature || "", data);
    const name = this.replacePlaceholders(content.name || "", data);
    const title = this.replacePlaceholders(content.title || "", data);
    const date = this.replacePlaceholders(
      content.date || new Date().toLocaleDateString("tr-TR"),
      data
    );
    const styleString = this.generateStyleString(styles);

    return `
      <div class="block signature-block" style="${styleString}">
        <div style="margin-top: 40px;">
          ${
            signature
              ? `<div style="margin-bottom: 20px;"><img src="${signature}" alt="İmza" style="max-height: 100px;" /></div>`
              : ""
          }
          <div>
            ${name ? `<p><strong>${name}</strong></p>` : ""}
            ${title ? `<p>${title}</p>` : ""}
            <p>Tarih: ${date}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Yer tutucuları değiştirme
  replacePlaceholders(text, data) {
    if (typeof text !== "string") return text;

    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      const keys = key.split(".");
      let value = data;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return match; // Yer tutucu bulunamadı, olduğu gibi bırak
        }
      }

      return value || match;
    });
  }

  // Stil birleştirme
  mergeStyles(globalStyles, blockStyles) {
    return {
      ...globalStyles,
      ...blockStyles,
    };
  }

  // Stil string'i oluşturma
  generateStyleString(styles) {
    const styleProps = [];

    if (styles.fontSize) styleProps.push(`font-size: ${styles.fontSize}px`);
    if (styles.fontFamily) styleProps.push(`font-family: ${styles.fontFamily}`);
    if (styles.color) styleProps.push(`color: ${styles.color}`);
    if (styles.backgroundColor)
      styleProps.push(`background-color: ${styles.backgroundColor}`);
    if (styles.textAlign) styleProps.push(`text-align: ${styles.textAlign}`);
    if (styles.margin) styleProps.push(`margin: ${styles.margin}px`);
    if (styles.padding) styleProps.push(`padding: ${styles.padding}px`);
    if (styles.borderRadius)
      styleProps.push(`border-radius: ${styles.borderRadius}px`);
    if (styles.border) styleProps.push(`border: ${styles.border}`);
    if (styles.width) styleProps.push(`width: ${styles.width}`);
    if (styles.height) styleProps.push(`height: ${styles.height}`);
    if (styles.maxWidth) styleProps.push(`max-width: ${styles.maxWidth}`);
    if (styles.maxHeight) styleProps.push(`max-height: ${styles.maxHeight}`);

    return styleProps.join("; ");
  }

  // HTML'i belge içine sarma
  wrapInDocument(html, globalStyles, canvasSize) {
    const { width, height, unit } = canvasSize;
    const { fontFamily, fontSize, backgroundColor, textColor } = globalStyles;

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şablon Önizleme</title>
        <style>
          body {
            font-family: ${fontFamily};
            font-size: ${fontSize}px;
            background-color: ${backgroundColor};
            color: ${textColor};
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          .document {
            width: ${width}${unit};
            min-height: ${height}${unit};
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 40px;
            box-sizing: border-box;
          }
          .block {
            margin-bottom: 20px;
          }
          .block:last-child {
            margin-bottom: 0;
          }
        </style>
      </head>
      <body>
        <div class="document">
          ${html}
        </div>
      </body>
      </html>
    `;
  }

  // EJS şablonu render etme (eski sistem uyumluluğu için)
  async renderEJSTemplate(templateId, data = {}) {
    try {
      const templatePath = path.join(
        __dirname,
        "..",
        "templates",
        `${templateId}.ejs`
      );

      // Cache kontrolü
      const cacheKey = `${templateId}_${JSON.stringify(data)}`;
      if (this.templateCache.has(cacheKey)) {
        const cached = this.templateCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.html;
        }
      }

      const templateContent = await fs.readFile(templatePath, "utf8");
      const html = ejs.render(templateContent, data);

      // Cache'e ekle
      this.templateCache.set(cacheKey, {
        html,
        timestamp: Date.now(),
      });

      return html;
    } catch (error) {
      logger.error("Error rendering EJS template", {
        error: error.message,
        templateId,
      });
      throw error;
    }
  }

  // Cache temizleme
  clearCache() {
    this.templateCache.clear();
    logger.info("Block editor service cache cleared");
  }

  // Eski cache'leri temizleme
  cleanOldCache() {
    const now = Date.now();
    for (const [key, value] of this.templateCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.templateCache.delete(key);
      }
    }
  }
}

module.exports = new BlockEditorService();
