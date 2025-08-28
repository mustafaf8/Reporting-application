const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

const templatePath = path.join(__dirname, '..', 'templates', 'proposal-template.ejs');

function formatCurrencyTRY(value) {
	return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(Number(value || 0));
}

function readImageAsDataUrl(filename) {
	try {
		const imgPath = path.join(__dirname, '..', 'templates', filename);
		const buffer = fs.readFileSync(imgPath);
		const ext = path.extname(filename).slice(1) || 'png';
		return `data:image/${ext};base64,${buffer.toString('base64')}`;
	} catch (_) {
		return null;
	}
}

async function generateProposalPdf(req, res) {
	try {
		const { customerName, items, vatRate = 0, discountRate = 0, extraCosts = 0, status, company, customer, issuer } = req.body || {};
		if (!customerName || !Array.isArray(items) || items.length === 0) {
			return res.error('Geçersiz veri. Müşteri adı ve en az bir malzeme gereklidir.', 400);
		}

		// Debug: Gelen payload'da issuer var mı?
		try { console.log('PDF issuer:', issuer); } catch (_) {}

		const subtotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
		const discountAmount = subtotal * (Number(discountRate) / 100);
		const withExtras = subtotal - discountAmount + Number(extraCosts);
		const vatAmount = withExtras * (Number(vatRate) / 100);
		const grandTotal = Math.round((withExtras + vatAmount) * 100) / 100;

		const aboutRmr = {
			// Görseller için fonksiyonlarınızı burada çağırabilirsiniz.
			images: [
			  readImageAsDataUrl('logo.png'),
			  readImageAsDataUrl('logo.png')
			].filter(Boolean),
	
			title: 'RMR Enerji: Geleceği Güneşle Şekillendiriyoruz',
			
			description: `Güneş enerjisi sektöründeki 14 yılı aşkın derin tecrübemizle, RMR Enerji olarak misyonumuz, sürdürülebilir ve yenilikçi enerji çözümleri sunarak dünyamızı daha temiz, yaşanabilir ve verimli bir geleceğe taşımaktır. Güneşin sonsuz gücünden ilham alarak, hem çevre dostu hem de ekonomik açıdan verimli enerji alternatifleriyle geleceği bugünden şekillendiriyoruz. Müşterilerimize sadece bir ürün veya hizmet değil, aynı zamanda daha parlak bir gelecek vaadi sunuyoruz.`,
	
			// Sayfayı doldurmak için birden fazla bölüm ekleyebiliriz.
			sections: [
					{
							title: 'Vizyonumuz ve Değerlerimiz',
							content: 'Vizyonumuz, Türkiye’de ve bölgede yenilenebilir enerji dönüşümünün öncüsü olmaktır. Bu vizyon doğrultusunda benimsediğimiz temel değerler şunlardır:',
							bullets: [
									'**Müşteri Odaklılık:** Her projede müşterilerimizin ihtiyaç ve beklentilerini ilk sıraya koyarak, onlara özel, anahtar teslim çözümler üretiyoruz.',
									'**Kalite ve Güvenilirlik:** Yalnızca en yüksek kalitede, sertifikalı ve verimliliği kanıtlanmış panel, invertör ve diğer ekipmanları kullanıyoruz.',
									'**İnovasyon:** Sektördeki en son teknolojileri ve mühendislik yaklaşımlarını yakından takip ederek projelerimize entegre ediyoruz.',
									'**Sürdürülebilirlik:** Faaliyetlerimizin her aşamasında ekolojik dengeyi gözetiyor, karbon ayak izini azaltmayı hedefliyoruz.'
							]
					},
					{
							title: 'Neden RMR Enerji?',
							content: 'Enerji ihtiyacınız için bizi tercih etmeniz, sadece bir yatırım değil, aynı zamanda güvenilir bir ortaklık anlamına gelir. İşte bizi farklı kılanlar:',
							bullets: [
									'**Uçtan Uca Proje Yönetimi:** Keşif ve projelendirmeden, TEDAŞ onay süreçlerine, kurulumdan devreye almaya ve uzun dönemli bakıma kadar tüm süreci sizin için yönetiyoruz.',
									'**Uzman Kadro:** Alanında deneyimli mühendislerimiz ve sertifikalı teknik ekiplerimizle projelerinizi uluslararası standartlarda hayata geçiriyoruz.',
									'**Finansal Avantajlar:** Güneş enerjisi yatırımınızın geri dönüş süresini (amortisman) en aza indirecek, optimum maliyetli ve yüksek verimli sistemler tasarlıyoruz.',
									'**Mevzuat Hakimiyeti:** Lisanssız üretim yönetmeliği ve diğer yasal süreçlerdeki güncel bilgi birikimimizle, projenizin sorunsuz ilerlemesi için danışmanlık sağlıyoruz.'
							]
					},
					{
							title: 'Sunduğumuz Çözümler ve Yetkinlikler',
							content: 'Geniş bir yelpazede, her ihtiyaca uygun güneş enerjisi çözümleri sunuyoruz:',
							bullets: [
									'**Çatı ve Arazi Tipi GES Projeleri:** Endüstriyel tesisler, ticari binalar, tarım arazileri ve konutlar için 50’den fazla başarılı GES projesini hayata geçirdik.',
									'**Kurulum ve Montaj Hizmetleri:** Güvenlik standartlarından ödün vermeden, hızlı ve profesyonel kurulum hizmetleri sunuyoruz.',
									'**Bakım, Onarım ve İzleme:** Kurulum sonrası sistemlerinizin performansını anlık olarak izliyor, periyodik bakımlarla maksimum verimlilikte çalışmasını sağlıyoruz.',
									'**Yüksek Verimli Ekipman Tedariki:** Dünyanın önde gelen markalarından yüksek verimli güneş panelleri, invertörler ve taşıyıcı konstrüksiyon sistemleri tedarik ediyoruz.'
							]
					}
			],
			
			closingStatement: 'RMR Enerji ile güneşin gücünü işinize ve hayatınıza taşıyın. Temiz enerjiye geçiş yolculuğunuzda güvenilir çözüm ortağınız olmak için buradayız.'
	};

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
			customer,
			issuer,
			aboutRmr,
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
		return res.error('Sunucu hatası. PDF oluşturulamadı.', 500);
	}
}

module.exports = { generateProposalPdf };


