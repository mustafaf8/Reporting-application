"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { Proposal } from "@/types";

interface ProposalDetailPageProps {
  proposalId: string;
}

const ProposalDetailPage: React.FC<ProposalDetailPageProps> = ({
  proposalId,
}) => {
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/proposals/${proposalId}`);
      setProposal(data.proposal || data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Teklif yüklenemedi");
      toast.error("Teklif yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/api/proposals/${proposalId}/status`, {
        status: newStatus,
      });
      setProposal((prev) =>
        prev ? { ...prev, status: newStatus as any } : null
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
        <LoadingSpinner size="lg" text="Teklif yükleniyor..." />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || "Teklif bulunamadı"}</p>
        <button
          onClick={() => router.push("/proposals")}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Teklifler Listesine Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teklif Detayı</h1>
            <p className="text-gray-600 mt-1">
              Müşteri: {proposal.customerName}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                proposal.status
              )}`}
            >
              {getStatusText(proposal.status)}
            </span>
            <select
              value={proposal.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="draft">Taslak</option>
              <option value="sent">Gönderildi</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Oluşturulma:{" "}
            {new Date(proposal.createdAt).toLocaleDateString("tr-TR")}
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/proposals/${proposal._id}/edit`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Düzenle
            </Link>
            <button
              onClick={() => router.push("/proposals")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>

      {/* Açıklama alanı kaldırıldı: Proposal tipinde açıklama yok */}

      {/* Kalemler */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kalemler</h2>
        {proposal.items && proposal.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kalem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Birim Fiyat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proposal.items.map((it, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {it.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {it.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {it.unitPrice.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {(
                        it.lineTotal ?? it.quantity * it.unitPrice
                      ).toLocaleString("tr-TR")}{" "}
                      ₺
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-right text-sm font-medium text-gray-900"
                  >
                    Genel Toplam:
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {proposal.grandTotal.toLocaleString("tr-TR")} ₺
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Bu teklifte ürün bulunmuyor.</p>
        )}
      </div>
    </div>
  );
};

export default ProposalDetailPage;
