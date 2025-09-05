"use client";

import React, { useState, useRef } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import UserAvatar from "./UserAvatar";
import { User } from "@/types";
import ConfirmationModal from "./ConfirmationModal";

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageChange?: (url: string | null) => void;
  size?: "sm" | "md" | "lg" | "xl";
  showUploadButton?: boolean;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  size = "lg",
  showUploadButton = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-36 h-36",
    xl: "w-44 h-44",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya tipini kontrol et
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen sadece resim dosyası seçin");
      return;
    }

    // Dosya boyutunu kontrol et (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    // Preview oluştur
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Dosyayı yükle
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await api.post("/api/upload/profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Profil fotoğrafı başarıyla yüklendi");
        // Cloudinary URL'i dönüyor olabilir
        const url = response.data.imageUrl;
        onImageChange && onImageChange(url || null);
        setPreviewUrl(null);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(
        error.response?.data?.message || "Fotoğraf yüklenirken hata oluştu"
      );
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImageClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteImageConfirm = async () => {
    try {
      setDeleting(true);
      await api.delete("/api/upload/profile-image");
      toast.success("Profil fotoğrafı silindi");
      onImageChange && onImageChange("");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Fotoğraf silinirken hata oluştu");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteImageCancel = () => {
    setShowDeleteModal(false);
  };

  // Geçici kullanıcı objesi oluştur (preview için)
  const tempUser = {
    _id: "",
    name: "Kullanıcı",
    email: "",
    role: "user" as const,
    position: "",
    profileImageUrl: previewUrl || currentImageUrl || undefined,
    isActive: true,
    isApproved: true,
    subscription: {
      plan: "free",
      status: "active",
      customerId: "",
      subscriptionId: "",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Profil Fotoğrafı */}
      <div className={`${sizeClasses[size]} relative group`}>
        <UserAvatar
          user={tempUser}
          size={
            size === "xl"
              ? "5xl"
              : size === "lg"
              ? "4xl"
              : size === "md"
              ? "3xl"
              : "2xl"
          }
        />

        {/* Hover Overlay */}
        {showUploadButton && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Fotoğraf değiştir"
              >
                {uploading ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>

              {currentImageUrl && (
                <button
                  onClick={handleDeleteImageClick}
                  className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  title="Fotoğrafı sil"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dosya Input (Gizli) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Butonu */}
      {showUploadButton && (
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <svg
                  className="w-4 h-4 mr-2 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Yükleniyor...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Fotoğraf Yükle
              </>
            )}
          </button>

          {currentImageUrl && (
            <button
              onClick={handleDeleteImageClick}
              className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Sil
            </button>
          )}
        </div>
      )}

      {/* Bilgi Metni */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        JPG, PNG veya GIF formatında, maksimum 5MB boyutunda resim
        yükleyebilirsiniz.
      </p>

      {/* Onay Modalı */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteImageCancel}
        onConfirm={handleDeleteImageConfirm}
        title="Profil Fotoğrafı Silme Onayı"
        message="Profil fotoğrafını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default ProfileImageUpload;
