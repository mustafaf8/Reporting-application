// Şirket bilgilerini burada merkezi olarak tanımlayın
// Logo: frontend/public/logo.png içine kopyalayın.
// Uygulama, PDF için mutlak bir URL kullanır (puppeteer'ın erişebilmesi için).

const origin = typeof window !== 'undefined' ? window.location.origin : '';

const companyConfig = {
  name: 'RMR Enerji',
  taxNumber: '+90 (532) 471 28 24',
  address: 'Fevziçakmak, 10777 Sk. No:1AC, 42250 Karatay/Konya',
  logoUrl: origin ? `${origin}/logo.png` : '/logo.png'
};

export default companyConfig;

// PDF için logo'yu base64 Data URL olarak ekle (internet erişimi olmayan backend'lerde sorun yaşamamak için)
export async function buildCompanyForPdf() {
  const withData = { ...companyConfig };
  try {
    if (withData.logoUrl && typeof window !== 'undefined') {
      const res = await fetch(withData.logoUrl, { cache: 'no-store' });
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      withData.logoDataUrl = dataUrl; // template'te öncelikli kullanılacak
    }
  } catch (_) {
    // Sessizce logoUrl'e düş
  }
  return withData;
}


