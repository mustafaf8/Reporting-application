"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { User } from "@/types";

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/users");
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Kullanıcılar yüklenemedi");
      toast.error("Kullanıcılar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, role: newRole as "user" | "admin" }
            : user
        )
      );
      toast.success("Kullanıcı rolü güncellendi");
    } catch (err) {
      toast.error("Rol güncellenirken hata oluştu");
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/api/admin/users/${userId}/status`, {
        isActive: !isActive,
      });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: !isActive } : user
        )
      );
      toast.success("Kullanıcı durumu güncellendi");
    } catch (err) {
      toast.error("Durum güncellenirken hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Kullanıcılar yükleniyor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Kullanıcı Yönetimi
        </h2>

        {users.length === 0 ? (
          <EmptyState
            title="Henüz kullanıcı bulunmuyor"
            description="Sistemde kayıtlı kullanıcı bulunmuyor."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="user">Kullanıcı</option>
                        <option value="admin">Yönetici</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive !== false
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive !== false ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() =>
                          handleToggleStatus(user.id, user.isActive !== false)
                        }
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          user.isActive !== false
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {user.isActive !== false
                          ? "Pasifleştir"
                          : "Aktifleştir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
