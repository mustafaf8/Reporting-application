import React, { useState } from 'react';
import axios from 'axios';
import api from '../services/api';

// Bu bileşenin tek sorumluluğu, bir teklif formu göstermek,
// kullanıcı girdilerini yönetmek ve PDF oluşturma işlemini tetiklemektir.
const ProposalForm = () => {
    // --- STATE YÖNETİMİ ---

    // Müşteri adını tutan state
    const [customerName, setCustomerName] = useState('');

    // Eklenen malzemelerin listesini (bir dizi nesne) tutan state
    const [items, setItems] = useState([]);

    // Malzeme ekleme formundaki anlık girdileri tutan state
    const [currentItem, setCurrentItem] = useState({
        name: '',
        quantity: 1,
        unitPrice: 0
    });

    // KDV, iskonto, ek maliyet
    const [vatRate, setVatRate] = useState(0);
    const [discountRate, setDiscountRate] = useState(0);
    const [extraCosts, setExtraCosts] = useState(0);

    // API isteği sırasında yüklenme durumunu yöneten state (butonun deaktif olması için)
    const [loading, setLoading] = useState(false);
   

    // --- FONKSİYONLAR ---

    // Malzeme ekleme formundaki girdileri listeye ekleyen fonksiyon
    const handleAddItem = () => {
        // Basit bir doğrulama: Malzeme adı boş olamaz, miktar ve fiyat 0'dan büyük olmalı
        if (currentItem.name && currentItem.quantity > 0 && currentItem.unitPrice > 0) {
            // Mevcut listeyi koruyarak yeni malzemeyi sona ekle (immutable state update)
            setItems([...items, currentItem]);
            // Malzeme eklendikten sonra formu temizle
            setCurrentItem({ name: '', quantity: 1, unitPrice: 0 });
        } else {
            alert('Lütfen tüm malzeme alanlarını doğru bir şekilde doldurun.');
        }
    };

    // Listeden bir malzemeyi çıkaran fonksiyon
    const handleRemoveItem = (indexToRemove) => {
        // filter metodu ile kaldırılmak istenen index dışındaki tüm elemanlardan yeni bir dizi oluştur
        setItems(items.filter((_, index) => index !== indexToRemove));
    };

    // Backend'e istek atıp PDF'i oluşturan ve indiren ana fonksiyon
    const handleGeneratePdf = async () => {
        // Müşteri adı veya malzeme listesi boşsa işlemi başlatma
        if (!customerName || items.length === 0) {
            alert('PDF oluşturmak için lütfen müşteri adı girin ve en az bir malzeme ekleyin.');
            return;
        }

        setLoading(true); // Yüklenme durumunu başlat

        try {
            // Backend'deki API endpoint'ine POST isteği gönder
            const response = await api.post(
                '/api/generate-pdf',
                { customerName, items, vatRate, discountRate, extraCosts },
                { responseType: 'blob' }
            );

            // 1. Gelen blob verisinden geçici bir URL oluştur
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // 2. Gizli bir link ('a' tagı) oluştur
            const link = document.createElement('a');
            link.href = url;
            
            // 3. İndirilecek dosyanın adını belirle
            const fileName = `${customerName.replace(/\s/g, '_')}-teklifi.pdf`;
            link.setAttribute('download', fileName);
            
            // 4. Linki DOM'a ekle ve programatik olarak tıkla
            document.body.appendChild(link);
            link.click();
            
            // 5. İşlem bittikten sonra oluşturulan linki ve URL'yi temizle (hafıza sızıntısını önlemek için)
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('PDF oluşturma ve indirme sırasında hata:', error);
            alert('PDF oluşturulurken sunucuda bir hata oluştu.');
        } finally {
            // İşlem başarılı da olsa, başarısız da olsa yüklenme durumunu bitir
            setLoading(false);
        }
    };


    // --- RENDER (JSX) ---

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4">Yeni Teklif Detayları</h2>

            {/* Müşteri Adı Alanı */}
            <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı</label>
                <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Proje veya Müşteri Adı"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Malzeme Ekleme Formu */}
            <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">Malzeme Listesi</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Malzeme Adı</label>
                        <input type="text" value={currentItem.name} onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })} placeholder="450W Monokristal Panel" className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Miktar</label>
                        <input type="number" min="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })} className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Birim Fiyat (TL)</label>
                        <input type="number" min="0" step="0.01" value={currentItem.unitPrice} onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })} placeholder="Örn: 2500" className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <button onClick={handleAddItem} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Ekle
                    </button>
                </div>
            </div>

            {/* Vergi/İskonto/Ek Maliyet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">KDV Oranı (%)</label>
                    <input type="number" min="0" step="0.01" value={vatRate} onChange={(e)=>setVatRate(parseFloat(e.target.value)||0)} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">İskonto Oranı (%)</label>
                    <input type="number" min="0" step="0.01" value={discountRate} onChange={(e)=>setDiscountRate(parseFloat(e.target.value)||0)} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ek Maliyetler (TL)</label>
                    <input type="number" min="0" step="0.01" value={extraCosts} onChange={(e)=>setExtraCosts(parseFloat(e.target.value)||0)} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
                </div>
            </div>
            
            {/* Eklenen Malzemeler Listesi */}
            <div className="space-y-2">
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-slate-100 p-3 rounded-md animate-fade-in">
                            <div>
                                <p className="font-semibold text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-600">{item.quantity} adet &times; {item.unitPrice.toFixed(2)} TL</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="font-semibold text-gray-900">{(item.quantity * item.unitPrice).toFixed(2)} TL</p>
                                <button onClick={() => handleRemoveItem(index)} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600 transition-colors">
                                    Kaldır
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-4">Teklife henüz malzeme eklenmedi.</p>
                )}
            </div>

            {/* Toplam Tutar ve PDF Oluşturma Butonu */}
            <div className="border-t pt-4 space-y-4">
                <div className="flex justify-end items-center text-xl font-bold">
                    <span className="text-gray-600 mr-4">Genel Toplam (yaklaşık):</span>
                    <span className="text-indigo-600">
                        {(() => {
                            const subtotal = items.reduce((t, it)=> t + it.quantity*it.unitPrice, 0);
                            const discounted = subtotal * (1 - (discountRate/100));
                            const withExtras = discounted + extraCosts;
                            const withVat = withExtras * (1 + (vatRate/100));
                            return withVat.toFixed(2);
                        })()} TL
                    </span>
                </div>
                <button 
                    onClick={handleGeneratePdf} 
                    disabled={loading || items.length === 0 || !customerName} 
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 text-lg rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Oluşturuluyor...
                        </>
                    ) : 'Teklif PDF\'ini Oluştur ve İndir'}
                </button>
            </div>
        </div>
    );
};

export default ProposalForm;