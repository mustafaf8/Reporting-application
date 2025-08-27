import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import CreateProposalPage from './pages/CreateProposalPage';

// Gelecekte eklenebilecek diğer sayfalar için bir örnek
const ProposalsListPage = () => <h2>Kaydedilmiş Teklifler</h2>;
const NotFoundPage = () => <h2 className="text-center">404 - Sayfa Bulunamadı</h2>;

function App() {
  return (
    <Routes>
      {/* MainLayout'u ana route olarak tanımlıyoruz. 
          Bunun içindeki tüm alt route'lar bu layout'u miras alacak. */}
      <Route path="/" element={<MainLayout />}>
        {/* index=true, path="/" ile aynı anlama gelir. Ana sayfadır. */}
        <Route index element={<CreateProposalPage />} />
        
        {/* Örnek: Gelecekte teklif listesi sayfası eklemek isterseniz: */}
        {/* <Route path="proposals" element={<ProposalsListPage />} /> */}

        {/* Eşleşmeyen tüm yollar için 404 sayfası */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;