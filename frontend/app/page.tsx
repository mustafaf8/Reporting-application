"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import TemplateSelectionPage from "@/components/features/templates/TemplateSelectionPage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function HomePage() {
  const { user, bootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!bootstrapping && !user) {
      router.push("/login");
    }
  }, [user, bootstrapping, router]);

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <LoadingSpinner size="lg" text="Yükleniyor..." />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <TemplateSelectionPage />;
}
