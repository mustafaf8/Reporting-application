// Şirket bilgilerini burada merkezi olarak tanımlayın
// Logo: frontend/public/logo.png içine kopyalayın.
// Uygulama, PDF için mutlak bir URL kullanır (puppeteer'ın erişebilmesi için).

const origin = typeof window !== 'undefined' ? window.location.origin : '';

const companyConfig = {
  name: 'RMR Enerji A.Ş.',
  taxNumber: '1234567890',
  address: 'Örnek Mah. Enerji Cad. No:10, İstanbul',
  // Örn: http://localhost:5173/logo.png (dev) veya prod origin + /logo.png
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


