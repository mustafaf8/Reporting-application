const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const templatePath = path.join(__dirname, '..', 'templates', 'proposal-template.html');

function formatCurrencyTRY(value) {
	return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value);
}

function buildHtml({ customerName, items }) {
	const rowsHtml = items.map((item, index) => {
		const lineTotal = Number(item.quantity) * Number(item.unitPrice);
		return `
			<tr>
				<td style="padding:8px;border:1px solid #e5e7eb;">${index + 1}</td>
				<td style="padding:8px;border:1px solid #e5e7eb;">${item.name}</td>
				<td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
				<td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatCurrencyTRY(Number(item.unitPrice))}</td>
				<td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatCurrencyTRY(lineTotal)}</td>
			</tr>`;
	}).join('');

	const grandTotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);

	// Basit bir inline stilli şablon (SSR HTML)
	return `
	<!doctype html>
	<html lang="tr">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Teklif - ${customerName}</title>
		<style>
			body{ font-family: Arial, Helvetica, sans-serif; color:#111827; }
			.container{ max-width:900px; margin:0 auto; padding:24px; }
			h1{ color:#4f46e5; }
			table{ width:100%; border-collapse: collapse; margin-top:16px; }
			th{ background:#f3f4f6; text-align:left; padding:10px; border:1px solid #e5e7eb; }
			td{ font-size:14px; }
			.footer{ margin-top:24px; font-size:12px; color:#6b7280; }
		</style>
	</head>
	<body>
		<div class="container">
			<h1>Teklif</h1>
			<p><strong>Müşteri/Proje:</strong> ${customerName}</p>
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>Malzeme Adı</th>
						<th style="text-align:right;">Miktar</th>
						<th style="text-align:right;">Birim Fiyat</th>
						<th style="text-align:right;">Tutar</th>
					</tr>
				</thead>
				<tbody>
					${rowsHtml}
					<tr>
						<td colspan="4" style="padding:10px; border:1px solid #e5e7eb; text-align:right; font-weight:bold;">Genel Toplam</td>
						<td style="padding:10px; border:1px solid #e5e7eb; text-align:right; font-weight:bold;">${formatCurrencyTRY(grandTotal)}</td>
					</tr>
				</tbody>
			</table>
			<div class="footer">
				<p>Not: Bu teklif bilgilendirme amaçlıdır. Fiyatlara KDV dahil değildir (isteğe göre güncellenebilir).</p>
			</div>
		</div>
	</body>
	</html>
	`;
}

async function generateProposalPdf(req, res) {
	try {
		const { customerName, items } = req.body || {};
		if (!customerName || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: 'Geçersiz veri. Müşteri adı ve en az bir malzeme gereklidir.' });
		}

		const html = buildHtml({ customerName, items });

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


