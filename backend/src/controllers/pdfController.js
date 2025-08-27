const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

const templatePath = path.join(__dirname, '..', 'templates', 'proposal-template.ejs');

function formatCurrencyTRY(value) {
	return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(Number(value || 0));
}

async function generateProposalPdf(req, res) {
	try {
		const { customerName, items, vatRate = 0, discountRate = 0, extraCosts = 0, status, company } = req.body || {};
		if (!customerName || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: 'Geçersiz veri. Müşteri adı ve en az bir malzeme gereklidir.' });
		}

		const subtotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
		const discountAmount = subtotal * (Number(discountRate) / 100);
		const withExtras = subtotal - discountAmount + Number(extraCosts);
		const vatAmount = withExtras * (Number(vatRate) / 100);
		const grandTotal = Math.round((withExtras + vatAmount) * 100) / 100;

		const html = await ejs.renderFile(templatePath, {
			customerName,
			items,
			createdAt: Date.now(),
			status,
			subtotal,
			vatRate: Number(vatRate),
			vatAmount,
			discountRate: Number(discountRate),
			extraCosts: Number(extraCosts),
			grandTotal,
			company,
			formatCurrency: (v) => formatCurrencyTRY(v)
		}, { async: true });

		const browser = await puppeteer.launch({
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: 'networkidle0' });
		const pdfBuffer = await page.pdf({
			format: 'A4',
			margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
			printBackground: true
		});
		await browser.close();

		const fileName = `${customerName.replace(/\s/g, '_')}-teklifi.pdf`;
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
		return res.status(200).send(pdfBuffer);
	} catch (error) {
		console.error('PDF oluşturma hatası:', error);
		return res.status(500).json({ message: 'Sunucu hatası. PDF oluşturulamadı.' });
	}
}

module.exports = { generateProposalPdf };


