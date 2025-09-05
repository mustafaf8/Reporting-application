"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Proposal, UpdateProposalRequest } from "@/types";

interface EditProposalPageProps {
  proposalId: string;
}

const EditProposalPage: React.FC<EditProposalPageProps> = ({ proposalId }) => {
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientName: "",
    clientEmail: "",
    status: "draft" as const,
  });

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/proposals/${proposalId}`);
      setProposal(data.proposal);
      setFormData({
        title: data.proposal.title,
        description: data.proposal.description,
        clientName: data.proposal.clientName,
        clientEmail: data.proposal.clientEmail,
        status: data.proposal.status,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Teklif yüklenemedi");
      router.push("/proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        ...formData,
      };
      await api.put(`/api/proposals/${proposalId}`, updateData);
      toast.success("Teklif başarıyla güncellendi");
      router.push(`/proposals/${proposalId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Teklif yükleniyor..." />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Teklif bulunamadı</p>
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Teklif Düzenle
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teklif Başlığı *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Teklif başlığını girin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="draft">Taslak</option>
                <option value="sent">Gönderildi</option>
                <option value="approved">Onaylandı</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Teklif açıklamasını girin"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri Adı *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Müşteri adını girin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri E-posta *
              </label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Müşteri e-posta adresini girin"
              />
            </div>
          </div>

          {/* Ürünler Listesi (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürünler
            </label>
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              {proposal.items && proposal.items.length > 0 ? (
                <div className="space-y-2">
                  {proposal.items.map((it, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>
                        {it.name} x {it.quantity}
                      </span>
                      <span className="font-medium">
                        {(
                          it.lineTotal ?? it.quantity * it.unitPrice
                        ).toLocaleString("tr-TR")}{" "}
                        ₺
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Toplam:</span>
                      <span>
                        {(proposal.grandTotal as number).toLocaleString(
                          "tr-TR"
                        )}{" "}
                        ₺
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Bu teklifte ürün bulunmuyor.</p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ürünleri düzenlemek için teklif oluşturma sayfasını kullanın.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push(`/proposals/${proposalId}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Kaydediliyor..." : "Güncelle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProposalPage;
