import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

const TemplateCard = ({ template, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(template)}
      className="text-left bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-slate-200 overflow-hidden"
    >
      {template.previewImageUrl && (
        <div className="h-40 bg-slate-100 overflow-hidden">
          <img
            src={template.previewImageUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          {template.name}
        </h3>
        {template.category && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            {template.category}
          </span>
        )}
        {template.description && (
          <p className="text-sm text-slate-600 line-clamp-2">
            {template.description}
          </p>
        )}
      </div>
    </button>
  );
};

const TemplateGalleryPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/templates", {
          params: { limit: 100 },
        });
        setTemplates(data.items || data);
      } catch (err) {
        setError("Şablonlar yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = (tpl) => {
    navigate(`/editor?templateId=${tpl._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Şablon Galerisi</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Yeni teklifin için bir şablon seçerek başla.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <TemplateCard key={tpl._id} template={tpl} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
};

export default TemplateGalleryPage;
