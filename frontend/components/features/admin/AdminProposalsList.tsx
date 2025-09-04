"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import { Proposal } from "@/types";

const AdminProposalsList: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (statusFilter) params.append("status", statusFilter);

      const { data } = await api.get(
        `/api/admin/proposals?${params.toString()}`
      );
      setProposals(data.proposals || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Teklifler yüklenemedi");
      toast.error("Teklifler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    try {
      await api.patch(`/api/admin/proposals/${proposalId}/status`, {
        status: newStatus,
      });
      setProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === proposalId
            ? { ...proposal, status: newStatus as any }
            : proposal
        )
      );
      toast.success("Teklif durumu güncellendi");
    } catch (err) {
      toast.error("Durum güncellenirken hata oluştu");
    }
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tüm Teklifler</h2>

        {/* Filtreler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

        {proposals.length === 0 ? (
          <EmptyState
            title="Henüz teklif bulunmuyor"
            description="Sistemde kayıtlı teklif bulunmuyor."
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
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {proposal.clientName}
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
                      {proposal.totalAmount?.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <select
                        value={proposal.status}
                        onChange={(e) =>
                          handleStatusChange(proposal.id, e.target.value)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="draft">Taslak</option>
                        <option value="sent">Gönderildi</option>
                        <option value="approved">Onaylandı</option>
                        <option value="rejected">Reddedildi</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                        >
                          Görüntüle
                        </Link>
                        <Link
                          href={`/proposals/${proposal.id}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                        >
                          Düzenle
                        </Link>
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

export default AdminProposalsList;
