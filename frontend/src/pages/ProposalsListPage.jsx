import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ProposalsListPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/proposals');
        if (mounted) setItems(data.items || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Teklifler yüklenemedi');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Kayıtlı Teklifler</h2>
        <Link to="/" className="text-indigo-600 hover:underline">Yeni Teklif Oluştur</Link>
      </div>
      {items.length === 0 ? (
        <p>Henüz teklif yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-2">Müşteri</th>
                <th className="text-left p-2">Durum</th>
                <th className="text-right p-2">Toplam</th>
                <th className="p-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} className="border-b">
                  <td className="p-2">{p.customerName}</td>
                  <td className="p-2">{p.status}</td>
                  <td className="p-2 text-right">{p.grandTotal?.toFixed(2)} TL</td>
                  <td className="p-2 text-center">
                    <Link className="text-indigo-600 hover:underline" to={`/proposals/${p._id}`}>Görüntüle</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProposalsListPage;


