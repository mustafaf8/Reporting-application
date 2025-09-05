"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/contexts/AuthContext";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import useDebounce from "@/hooks/useDebounce";
import { Proposal } from "@/types";

const ProposalsListPage: React.FC = () => {
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("q", debouncedSearch);
        if (statusFilter) params.append("status", statusFilter);

        const { data } = await api.get(`/api/proposals?${params.toString()}`);
        if (mounted) setItems(data.items || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Teklifler yüklenemedi");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch, statusFilter]);

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

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    try {
      setUpdatingStatus(proposalId);
      await api.patch(`/api/proposals/${proposalId}/status`, {
        status: newStatus,
      });

      // Local state'i güncelle
      setItems((prev) =>
        prev.map((proposal) =>
          proposal._id === proposalId
            ? { ...proposal, status: newStatus as any }
            : proposal
        )
      );

      toast.success("Teklif durumu güncellendi");
    } catch (err) {
      toast.error("Durum güncellenirken hata oluştu");
      console.error("Status update error:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleGeneratePdf = async (proposal: Proposal) => {
    try {
      const payload = {
        proposalId: proposal._id,
        customerName: proposal.customerName,
        items: proposal.items,
        vatRate: proposal.vatRate ?? 0,
        discountRate: proposal.discountRate ?? 0,
        extraCosts: proposal.extraCosts ?? 0,
        status: proposal.status,
        customizations: proposal.customizations ?? {},
      };
      const isPro = (user?.role || "user") === "admin"; // Simplified check
      const endpoint = isPro ? "/api/generate-pdf-hq" : "/api/generate-pdf";
      const res = await api.post(endpoint, payload);
      if (res.status === 202) {
        toast.success(
          "Teklifiniz hazırlanıyor. Tamamlandığında bildirim alacaksınız."
        );
        // Optimistic local mark
        setItems((prev) =>
          prev.map((p) =>
            p._id === proposal._id
              ? {
                  ...p,
                  // Add PDF status to proposal if needed
                }
              : p
          )
        );
      }
    } catch (err) {
      toast.error("PDF kuyruğa eklenemedi");
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Teklifler yükleniyor..." />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Teklif Listesi</h2>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="mr-2">+</span>
            Yeni Teklif Oluştur
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Adı ile Ara
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Müşteri adı girin..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durum Filtresi
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="sent">Gönderildi</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            title="Henüz teklif bulunmuyor"
            description="İlk teklifinizi oluşturmak için aşağıdaki butonu kullanın."
            action={
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <span className="mr-2">+</span>
                Teklif Oluştur
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teklif Durumu
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((proposal) => (
                  <tr
                    key={proposal._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {proposal.customerName}
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {proposal.grandTotal?.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <select
                        value={proposal.status}
                        onChange={(e) =>
                          handleStatusChange(proposal._id, e.target.value)
                        }
                        disabled={updatingStatus === proposal._id}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50"
                      >
                        <option value="draft">Taslak</option>
                        <option value="sent">Gönderildi</option>
                        <option value="approved">Onaylandı</option>
                        <option value="rejected">Reddedildi</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        -
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <Link
                          href={`/proposals/${proposal._id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                        >
                          Görüntüle
                        </Link>
                        <Link
                          href={`/proposals/${proposal._id}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                        >
                          Düzenle
                        </Link>
                        <button
                          onClick={() => handleGeneratePdf(proposal)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          PDF Oluştur
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsListPage;
