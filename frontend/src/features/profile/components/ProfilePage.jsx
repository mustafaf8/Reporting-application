import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import api from "../../../services/api";

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [profileResponse, performanceResponse] = await Promise.all([
          api.get("/api/users/me/profile"),
          api.get("/api/users/me/performance"),
        ]);

        setProfileData(profileResponse.data);
        setPerformanceData(performanceResponse.data);
      } catch (err) {
        setError("Profil verileri yüklenemedi");
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const handleStatusChange = async (proposalId, newStatus) => {
    try {
      await api.put(`/api/proposals/${proposalId}`, { status: newStatus });

      // Local state'i güncelle
      setProfileData((prev) => ({
        ...prev,
        proposals: prev.proposals.map((proposal) =>
          proposal._id === proposalId
            ? { ...proposal, status: newStatus }
            : proposal
        ),
      }));

      // Performance verilerini yeniden yükle
      const performanceResponse = await api.get("/api/users/me/performance");
      setPerformanceData(performanceResponse.data);
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Onaylandı";
      case "rejected":
        return "Reddedildi";
      case "sent":
        return "Gönderildi";
      case "draft":
        return "Taslak";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Kullanıcı Bilgileri */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Profil Bilgileri
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ad Soyad
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {profileData?.user?.name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {profileData?.user?.email}
            </p>
          </div>
          {profileData?.user?.position && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pozisyon
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {profileData.user.position}
              </p>
            </div>
          )}
          {profileData?.user?.department && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Departman
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {profileData.user.department}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Performans Göstergeleri */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Toplam Teklif
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceData.totalProposals}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Onaylanan</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceData.approvedProposals}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Başarı Oranı
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  %{performanceData.successRate}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Toplam Ciro</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceData.totalRevenue.toLocaleString("tr-TR")} ₺
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teklif Listesi */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Son Tekliflerim
        </h2>
        {profileData?.proposals?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profileData.proposals.map((proposal) => (
                  <tr key={proposal._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {proposal.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {proposal.grandTotal.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          proposal.status
                        )}`}
                      >
                        {getStatusText(proposal.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(proposal.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={proposal.status}
                        onChange={(e) =>
                          handleStatusChange(proposal._id, e.target.value)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="draft">Taslak</option>
                        <option value="sent">Gönderildi</option>
                        <option value="approved">Onaylandı</option>
                        <option value="rejected">Reddedildi</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Henüz teklif bulunmuyor.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
