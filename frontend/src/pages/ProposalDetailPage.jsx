import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const ProposalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/proposals/${id}`);
        setProposal(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Teklif getirilemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/proposals/${id}`);
      navigate('/proposals');
    } catch (err) {
      alert('Silme işlemi başarısız');
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
          <button onClick={handleDelete} className="bg-red-600 text-white px-3 py-1 rounded-md">Sil</button>
        </div>
      </div>
      <div>
        <p><strong>Durum:</strong> {proposal.status}</p>
        <p><strong>Toplam:</strong> {proposal.grandTotal?.toFixed(2)} TL</p>
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
    </div>
  );
};

export default ProposalDetailPage;


