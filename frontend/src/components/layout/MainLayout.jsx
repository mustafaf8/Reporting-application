import React from "react";
import { Outlet, Link } from "react-router-dom"; // Outlet'i import ediyoruz
import { useAuth } from "../../features/auth/hooks/useAuth";

const MainLayout = () => {
  const { user, logout } = useAuth();
  return (
    <div className="bg-slate-100 min-h-screen text-slate-800">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-indigo-600">
            Güneş Enerjisi Teklif Sistemi
          </h1>
          <div className="mt-3 flex gap-4 text-sm">
            <Link className="text-indigo-600 hover:underline" to="/">
              Yeni Teklif
            </Link>
            <Link className="text-indigo-600 hover:underline" to="/proposals">
              Teklifler
            </Link>
            {user && (
              <Link className="text-indigo-600 hover:underline" to="/profile">
                Profilim
              </Link>
            )}
            <span className="flex-1"></span>
            {user ? (
              <>
                <span className="text-gray-600">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-red-600 hover:underline"
                >
                  Çıkış
                </button>
              </>
            ) : (
              <Link className="text-indigo-600 hover:underline" to="/login">
                Giriş
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 mt-8">
        {/*
          React Router, bu Outlet'in yerine mevcut route'a uygun
          olan page bileşenini (örn: CreateProposalPage) yerleştirecek.
        */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
