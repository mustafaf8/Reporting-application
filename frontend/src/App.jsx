import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import CreateProposalPage from "./features/proposals/components/CreateProposalPage";
import LoginPage from "./features/auth/components/LoginPage";
import ProposalsListPage from "./features/proposals/components/ProposalsListPage";
import ProposalDetailPage from "./features/proposals/components/ProposalDetailPage";
import ProfilePage from "./features/profile/components/ProfilePage";

// Gelecekte eklenebilecek diğer sayfalar için bir örnek
const NotFoundPage = () => (
  <h2 className="text-center">404 - Sayfa Bulunamadı</h2>
);

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
        <Route path="profile" element={<ProfilePage />} />
        {/* Eşleşmeyen tüm yollar için 404 sayfası */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
