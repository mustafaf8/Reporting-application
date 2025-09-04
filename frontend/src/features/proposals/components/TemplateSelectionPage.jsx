import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";

const TemplateCard = ({ template }) => {
  const createHref = `/proposals/create?templateId=${template._id}`;
  const editHref = `/editor?templateId=${template._id}`;
  return (
    <div className="group rounded-lg border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow">
      <Link to={editHref} className="block">
        <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
          {template.previewImageUrl ? (
            <img
              src={template.previewImageUrl}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
              Önizleme yok
            </div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <div className="font-semibold text-gray-900 truncate">
          {template.name}
        </div>
        {template.category && (
          <div className="text-xs text-gray-500 mt-0.5">
            {template.category}
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            to={editHref}
            className="px-3 py-2 text-center text-sm bg-slate-100 hover:bg-slate-200 rounded"
          >
            Düzenle
          </Link>
          <Link
            to={createHref}
            className="px-3 py-2 text-center text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded"
          >
            Kullan
          </Link>
        </div>
      </div>
    </div>
  );
};

const TemplateSelectionPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/api/templates");
        if (mounted) setTemplates(data.items || []);
      } catch (err) {
        if (mounted)
          setError(
            err.response?.data?.message ||
              "Şablonlar yüklenirken bir hata oluştu"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Teklif Şablonu Seçin
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Aşağıdan bir şablon seçin. Seçim sonrası teklif bilgilerini
          dolduracağınız sayfaya yönlendirileceksiniz.
        </p>
      </div>

      {loading && <div className="text-gray-600">Yükleniyor...</div>}
      {error && (
        <div className="text-red-600 text-sm" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateCard key={t._id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateSelectionPage;
