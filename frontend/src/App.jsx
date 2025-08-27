import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import CreateProposalPage from './pages/CreateProposalPage';
import LoginPage from './pages/LoginPage';
import ProposalsListPage from './pages/ProposalsListPage';
import ProposalDetailPage from './pages/ProposalDetailPage';

// Gelecekte eklenebilecek diğer sayfalar için bir örnek
const NotFoundPage = () => <h2 className="text-center">404 - Sayfa Bulunamadı</h2>;

function App() {
  return (
    <Routes>
      {/* MainLayout'u ana route olarak tanımlıyoruz. 
          Bunun içindeki tüm alt route'lar bu layout'u miras alacak. */}
      <Route path="/" element={<MainLayout />}>
        {/* index=true, path="/" ile aynı anlama gelir. Ana sayfadır. */}
        <Route index element={<CreateProposalPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="proposals" element={<ProposalsListPage />} />
        <Route path="proposals/:id" element={<ProposalDetailPage />} />
        {/* Eşleşmeyen tüm yollar için 404 sayfası */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;