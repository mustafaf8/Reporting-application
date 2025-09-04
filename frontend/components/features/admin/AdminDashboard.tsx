"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

interface AdminStats {
  users: {
    total: number;
    active: number;
    pending: number;
  };
  proposals: {
    total: number;
    approved: number;
    approvalRate: number;
  };
  revenue: {
    total: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/admin/stats");
      setStats(response.data);
    } catch (error) {
      toast.error("İstatistikler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">İstatistikler yüklenemedi</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Sistem İstatistikleri
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Kullanıcı İstatistikleri */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">
                  Toplam Kullanıcı
                </p>
                <p className="text-2xl font-semibold text-blue-900">
                  {stats.users.total}
                </p>
                <p className="text-sm text-blue-500">
                  {stats.users.active} aktif
                </p>
                {stats.users.pending > 0 && (
                  <p className="text-sm text-yellow-600 font-medium">
                    {stats.users.pending} onay bekliyor
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Teklif İstatistikleri */}
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">
                  Toplam Teklif
                </p>
                <p className="text-2xl font-semibold text-green-900">
                  {stats.proposals.total}
                </p>
                <p className="text-sm text-green-500">
                  {stats.proposals.approved} onaylanan
                </p>
              </div>
            </div>
          </div>

          {/* Onay Oranı */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">
                  Onay Oranı
                </p>
                <p className="text-2xl font-semibold text-yellow-900">
                  %{stats.proposals.approvalRate}
                </p>
                <p className="text-sm text-yellow-500">Başarı oranı</p>
              </div>
            </div>
          </div>

          {/* Toplam Ciro */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">
                  Toplam Ciro
                </p>
                <p className="text-2xl font-semibold text-purple-900">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  }).format(stats.revenue.total)}
                </p>
                <p className="text-sm text-purple-500">Onaylanan teklifler</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı Erişim Menüsü */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hızlı Erişim
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                Kullanıcı Yönetimi
              </p>
              <p className="text-sm text-gray-500">
                Kullanıcıları görüntüle ve yönet
              </p>
            </div>
          </Link>

          <Link
            href="/admin/proposals"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Tüm Teklifler</p>
              <p className="text-sm text-gray-500">
                Sistemdeki tüm teklifleri görüntüle
              </p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Ürün Yönetimi</p>
              <p className="text-sm text-gray-500">
                Sistemdeki tüm ürünleri görüntüle
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
