"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/types";

interface UserAvatarProps {
  user: User | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  showName?: boolean;
  showRole?: boolean;
  className?: string;
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  showName = false,
  showRole = false,
  className = "",
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // User değiştiğinde imageError'ı sıfırla
  useEffect(() => {
    setImageError(false);
    setImageLoading(false);
  }, [user?.profileImageUrl]);

  // Boyut sınıfları
  const sizeClasses = {
    xs: "w-6 h-6", // 24px
    sm: "w-8 h-8", // 32px
    md: "w-10 h-10", // 40px
    lg: "w-12 h-12", // 48px
    xl: "w-16 h-16", // 64px
    "2xl": "w-20 h-20", // 80px
    "3xl": "w-24 h-24", // 96px
    "4xl": "w-32 h-32", // 128px
    "5xl": "w-40 h-40", // 160px
  };

  // İkon boyutları
  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
    "2xl": "w-10 h-10",
    "3xl": "w-12 h-12",
    "4xl": "w-16 h-16",
    "5xl": "w-20 h-20",
  };

  // Metin boyutları
  const textSizes = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl",
    "3xl": "text-2xl",
    "4xl": "text-3xl",
    "5xl": "text-4xl",
  };

  // Resim URL'ini oluştur (Cloudinary doğrudan URL)
  const getImageUrl = () => {
    const avatar = (user as any)?.avatar as string | undefined;
    const img = avatar || user?.profileImageUrl;
    if (!img) return null;
    const ts = Date.now();
    if (img.includes("res.cloudinary.com")) {
      return `${img}?t=${ts}`;
    }
    return img;
  };

  // Kullanıcı adının ilk harfini al
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Avatar bileşeni
  const AvatarComponent = () => (
    <div
      className={`
        ${sizeClasses[size]} 
        ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
        ${className}
      `}
      onClick={onClick || undefined}
    >
      <div
        className={`
        ${sizeClasses[size]} 
        rounded-full 
        overflow-hidden 
        border-2 
        border-white 
        shadow-lg 
        bg-gradient-to-r 
        from-indigo-500 
        to-purple-600 
        flex 
        items-center 
        justify-center
        relative
      `}
      >
        {getImageUrl() && !imageError ? (
          <img
            src={getImageUrl() || undefined}
            alt={`${user?.name || "Kullanıcı"} profil fotoğrafı`}
            className="w-full h-full object-cover"
            onLoadStart={() => {
              setImageLoading(true);
            }}
            onLoad={() => {
              setImageLoading(false);
            }}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : null}

        {/* Fallback - İsim baş harfleri */}
        <div
          className={`
             w-full h-full 
             flex items-center justify-center 
             text-white font-semibold
             ${textSizes[size]}
             ${
               getImageUrl() && !imageError && !imageLoading ? "hidden" : "flex"
             }
           `}
        >
          {imageLoading ? (
            <svg
              className={`${iconSizes[size]} animate-spin`}
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
            getInitials(user?.name || "")
          )}
        </div>
      </div>
    </div>
  );

  // Sadece avatar göster
  if (!showName && !showRole) {
    return <AvatarComponent />;
  }

  // Avatar + isim/rol göster
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <AvatarComponent />

      {(showName || showRole) && (
        <div className="flex flex-col">
          {showName && (
            <span className={`font-medium text-gray-900 ${textSizes[size]}`}>
              {user?.name || "Kullanıcı"}
            </span>
          )}
          {showRole && user?.role && (
            <span className={`text-gray-500 capitalize ${textSizes[size]}`}>
              {user.role === "admin" ? "Yönetici" : "Kullanıcı"}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
