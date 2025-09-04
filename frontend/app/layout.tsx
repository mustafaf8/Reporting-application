import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import MainLayout from "@/components/layout/MainLayout";
import I18nProvider from "@/components/providers/I18nProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reporting App",
  description: "Teklif ve rapor oluşturma uygulaması",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <I18nProvider>
          <AuthProvider>
            <MainLayout>{children}</MainLayout>
            <Toaster
              position="bottom-left"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#4ade80",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
