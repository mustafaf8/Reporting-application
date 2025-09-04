"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { User } from "@/types";

interface ProfileData {
  user: User & {
    position?: string;
    department?: string;
    company?: string;
    phone?: string;
    address?: string;
    bio?: string;
    profileImageUrl?: string;
  };
  proposals?: any[];
}

interface PerformanceData {
  totalProposals: number;
  approvedProposals: number;
  successRate: number;
  totalRevenue: number;
}

interface EditForm {
  name: string;
  position: string;
  department: string;
  company: string;
  phone: string;
  address: string;
  bio: string;
  profileImageUrl?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    position: "",
    department: "",
    company: "",
    phone: "",
    address: "",
    bio: "",
    profileImageUrl: "",
  });
  const hasLoaded = useRef(false);

  // Profil verilerini yükle
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
        // Edit form için başlangıç değerlerini ayarla
        setEditForm({
          name: profileResponse.data.user.name || "",
          position: profileResponse.data.user.position || "",
          department: profileResponse.data.user.department || "",
          company: profileResponse.data.user.company || "",
          phone: profileResponse.data.user.phone || "",
          address: profileResponse.data.user.address || "",
          bio: profileResponse.data.user.bio || "",
          profileImageUrl: profileResponse.data.user.profileImageUrl || "",
        });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Profil verileri yüklenemedi";
        setError(errorMessage);
        console.error("Profile fetch error:", err);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user && !hasLoaded.current) {
      hasLoaded.current = true;
      fetchProfileData();
    } else if (!user) {
      setLoading(false);
    }
  }, [user]);

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    try {
      await api.patch(`/api/proposals/${proposalId}/status`, {
        status: newStatus,
      });

      // Local state'i güncelle
      setProfileData((prev) => ({
        ...prev!,
        proposals: prev!.proposals!.map((proposal) =>
          proposal._id === proposalId
            ? { ...proposal, status: newStatus }
            : proposal
        ),
      }));

      toast.success("Teklif durumu güncellendi");
    } catch (err) {
      toast.error("Durum güncellenirken hata oluştu");
      console.error("Status update error:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/api/users/me/profile", editForm);
      // Profil verilerini güncelle
      setProfileData((prev) => ({
        ...prev!,
        user: { ...prev!.user, ...editForm },
      }));
      setIsEditing(false);
      toast.success("Profil başarıyla güncellendi");
    } catch (err) {
      toast.error("Profil güncellenirken hata oluştu");
      console.error("Profile update error:", err);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data } = await api.post("/api/billing/customer-portal");
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      toast.error("Abonelik portalı açılamadı");
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    // Form verilerini orijinal değerlere sıfırla
    setEditForm({
      name: profileData?.user?.name || "",
      position: profileData?.user?.position || "",
      department: profileData?.user?.department || "",
      company: profileData?.user?.company || "",
      phone: profileData?.user?.phone || "",
      address: profileData?.user?.address || "",
      bio: profileData?.user?.bio || "",
      profileImageUrl: profileData?.user?.profileImageUrl || "",
    });
  };

  const handleImageChange = (newImageUrl: string | null) => {
    setEditForm((prev) => ({
      ...prev,
      profileImageUrl: newImageUrl || "",
    }));

    // Profil verilerini de güncelle
    setProfileData((prev) => ({
      ...prev!,
      user: { ...prev!.user, avatar: newImageUrl || "" },
    }));
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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

  if (!user) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Lütfen giriş yapın</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Profil yükleniyor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Sayfayı Yenile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Kullanıcı Bilgileri */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Profil Bilgileri</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Düzenle
            </button>
          )}
        </div>
        <div className="mb-4">
          <button
            onClick={handleManageSubscription}
            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Aboneliği Yönet
          </button>
        </div>

        {!isEditing ? (
          <div className="space-y-6">
            {/* Profil Fotoğrafı */}
            <div className="flex flex-col items-center">
              <ProfileImageUpload
                currentImageUrl={profileData?.user?.profileImageUrl}
                onImageChange={handleImageChange}
                size="xl"
                showUploadButton={true}
              />
            </div>

            {/* Profil Bilgileri */}
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
                    Pozisyon (isteğe bağlı)
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData.user.position}
                  </p>
                </div>
              )}
              {profileData?.user?.department && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Departman (isteğe bağlı)
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData.user.department}
                  </p>
                </div>
              )}
              {profileData?.user?.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Şirket (isteğe bağlı)
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData.user.company}
                  </p>
                </div>
              )}
              {profileData?.user?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData.user.phone}
                  </p>
                </div>
              )}
              {profileData?.user?.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Adres
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData.user.address}
                  </p>
                </div>
              )}
              {profileData?.user?.bio && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Hakkımda
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profileData.user.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Profil Fotoğrafı */}
            <div className="flex flex-col items-center">
              <ProfileImageUpload
                currentImageUrl={editForm.profileImageUrl}
                onImageChange={handleImageChange}
                size="xl"
                showUploadButton={true}
              />
            </div>

            {/* Profil Bilgileri Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pozisyon (isteğe bağlı)
                </label>
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm({ ...editForm, position: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Departman (isteğe bağlı)
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm({ ...editForm, department: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Şirket (isteğe bağlı)
                </label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) =>
                    setEditForm({ ...editForm, company: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Adres
                </label>
                <textarea
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Hakkımda
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  rows={4}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>

            {/* Form Butonları */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleEditCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </form>
        )}
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
                  {performanceData.totalRevenue.toLocaleString("tr-TR")} TL
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teklif Listesi */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Son Teklifler
        </h3>
        {profileData?.proposals && profileData.proposals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(proposal.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proposal.grandTotal?.toLocaleString("tr-TR")} TL
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={proposal.status}
                        onChange={(e) =>
                          handleStatusChange(proposal._id, e.target.value)
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
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
