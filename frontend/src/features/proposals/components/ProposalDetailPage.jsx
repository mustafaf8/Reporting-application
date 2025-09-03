import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import toast from "react-hot-toast";

const ProposalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/proposals/${id}`);
        setProposal(data);
      } catch (err) {
        setError(err.response?.data?.message || "Teklif getirilemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await api.delete(`/api/proposals/${id}`);
      navigate("/proposals");
    } catch (err) {
      alert("Silme işlemi başarısız");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleGeneratePdf = async () => {
    try {
      setPdfProcessing(true);
      const payload = {
        proposalId: proposal._id,
        customerName: proposal.customerName,
        items: proposal.items,
        vatRate: proposal.vatRate,
        discountRate: proposal.discountRate,
        extraCosts: proposal.extraCosts,
        status: proposal.status,
        customizations: proposal.customizations || {},
      };
      const res = await api.post("/api/generate-pdf", payload);
      if (res.status === 202) {
        toast.success(
          "Teklifiniz hazırlanıyor. Tamamlandığında bildirim alacaksınız."
        );
        setProposal((prev) => ({
          ...prev,
          customizations: {
            ...(prev.customizations || {}),
            pdfStatus: "processing",
          },
        }));
      }
    } catch (err) {
      toast.error("PDF kuyruğa eklenemedi");
    } finally {
      setPdfProcessing(false);
    }
  };

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!proposal) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{proposal.customerName}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Siliniyor..." : "Sil"}
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={pdfProcessing}
            className="bg-slate-700 text-white px-3 py-1 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {pdfProcessing ? "Kuyruğa ekleniyor..." : "PDF Oluştur"}
          </button>
        </div>
      </div>
      <div>
        <p>
          <strong>Durum:</strong> {proposal.status}
        </p>
        <p>
          <strong>Toplam:</strong> {proposal.grandTotal?.toFixed(2)} TL
        </p>
        <p>
          <strong>PDF:</strong>{" "}
          {proposal.customizations?.pdfStatus === "ready"
            ? "Hazır"
            : proposal.customizations?.pdfStatus === "processing"
            ? "Oluşturuluyor..."
            : "-"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left p-2">Kalem</th>
              <th className="text-right p-2">Miktar</th>
              <th className="text-right p-2">Birim Fiyat</th>
              <th className="text-right p-2">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {proposal.items?.map((it, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{it.name}</td>
                <td className="p-2 text-right">{it.quantity}</td>
                <td className="p-2 text-right">{it.unitPrice.toFixed(2)} TL</td>
                <td className="p-2 text-right">{it.lineTotal.toFixed(2)} TL</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onay Modalı */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Teklif Silme Onayı"
        message="Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default ProposalDetailPage;
