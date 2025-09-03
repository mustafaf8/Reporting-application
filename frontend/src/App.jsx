import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CreateProposalPage from "./features/proposals/components/CreateProposalPage";
import ProposalFormWithProducts from "./features/proposals/components/ProposalFormWithProducts";
import EditProposalPage from "./features/proposals/components/EditProposalPage";
import LoginPage from "./features/auth/components/LoginPage";
// PendingApprovalPage kaldırıldı; yeni akışta gerekli değil
import ProposalsListPage from "./features/proposals/components/ProposalsListPage";
import ProposalDetailPage from "./features/proposals/components/ProposalDetailPage";
import ProfilePage from "./features/profile/components/ProfilePage";
import ProductsListPage from "./features/products/components/ProductsListPage";
import ProductForm from "./features/products/components/ProductForm";
import AdminDashboard from "./features/admin/components/AdminDashboard";
import UsersManagement from "./features/admin/components/UsersManagement";
import AdminProposalsList from "./features/admin/components/AdminProposalsList";
import AdminProductsList from "./features/admin/components/AdminProductsList";

// Gelecekte eklenebilecek diğer sayfalar için bir örnek
const NotFoundPage = () => (
  <div className="min-h-96 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl font-bold text-indigo-600 mb-4">404</div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Sayfa Bulunamadı
      </h2>
      <p className="text-gray-600 mb-6">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <a
        href="/"
        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Ana Sayfaya Dön
      </a>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Login sayfası public - korumasız */}
        <Route path="/login" element={<LoginPage />} />

        {/* Onay bekleme sayfası kaldırıldı */}

        {/* Diğer tüm sayfalar korumalı */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* index=true, path="/" ile aynı anlama gelir. Ana sayfadır. */}
          <Route index element={<ProposalFormWithProducts />} />
          <Route path="proposals" element={<ProposalsListPage />} />
          <Route path="proposals/:id" element={<ProposalDetailPage />} />
          <Route path="proposals/:id/edit" element={<EditProposalPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="products" element={<ProductsListPage />} />
          <Route
            path="products/create"
            element={
              <ProtectedRoute requiredRole="admin">
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <ProtectedRoute requiredRole="admin">
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UsersManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/proposals"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProposalsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/products"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProductsList />
              </ProtectedRoute>
            }
          />

          {/* Eşleşmeyen tüm yollar için 404 sayfası */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
