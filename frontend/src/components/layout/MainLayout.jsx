import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet'i import ediyoruz

const MainLayout = () => {
  return (
    <div className="bg-slate-100 min-h-screen text-slate-800">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-indigo-600">
            Güneş Enerjisi Teklif Sistemi
          </h1>
          {/* Gelecekte buraya navigasyon linkleri eklenebilir */}
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