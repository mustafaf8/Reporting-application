const companyConfig = {
  name: "Şirket Adı",
  address: "Şirket Adresi",
  phone: "+90 555 123 45 67",
  email: "info@sirket.com",
  website: "www.sirket.com",
  taxNumber: "1234567890",
  logo: "/logo.png",
};

export const buildCompanyForPdf = async () => {
  // Bu fonksiyon PDF oluşturma için şirket bilgilerini hazırlar
  return {
    ...companyConfig,
    // PDF için ek formatlamalar
    formattedAddress: companyConfig.address.replace(/\n/g, "<br>"),
    formattedPhone: companyConfig.phone,
    formattedEmail: companyConfig.email,
  };
};

export default companyConfig;
