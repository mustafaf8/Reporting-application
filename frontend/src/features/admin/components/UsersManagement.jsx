import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import api from "../../../services/api";
import toast from "react-hot-toast";
import UserAvatar from "../../../components/ui/UserAvatar";

const UsersManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user, currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/users", {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
        },
      });
      setUsers(response.data.users);
      setTotalPages(Math.ceil(response.data.total / 20));
    } catch (error) {
      toast.error("Kullanıcılar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success("Kullanıcı rolü güncellendi");
      fetchUsers();
    } catch (error) {
      toast.error("Rol güncellenirken hata oluştu");
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive });
      toast.success("Kullanıcı durumu güncellendi");
      fetchUsers();
    } catch (error) {
      toast.error("Durum güncellenirken hata oluştu");
    }
  };

  const handleApprovalChange = async (userId, isApproved) => {
    try {
      await api.put(`/api/admin/users/${userId}/approve`, { isApproved });
      toast.success(`Kullanıcı ${isApproved ? "onaylandı" : "reddedildi"}`);
      fetchUsers();
    } catch (error) {
      toast.error("Onay durumu güncellenirken hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Kullanıcı Yönetimi
          </h2>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

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
                  Onay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserAvatar user={user} size="md" showName={true} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value)
                      }
                      disabled={user._id === user._id} // Kendi rolünü değiştiremez
                      className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-indigo-500 rounded"
                    >
                      <option value="user">Kullanıcı</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isApproved
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.isApproved ? "Onaylı" : "Bekliyor"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleStatusChange(user._id, !user.isActive)
                        }
                        disabled={user._id === user._id} // Kendi durumunu değiştiremez
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          user.isActive
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {user.isActive ? "Pasif Yap" : "Aktif Yap"}
                      </button>
                      {!user.isApproved && (
                        <button
                          onClick={() => handleApprovalChange(user._id, true)}
                          className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          Onayla
                        </button>
                      )}
                      {user.isApproved && (
                        <button
                          onClick={() => handleApprovalChange(user._id, false)}
                          className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        >
                          Reddet
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? "text-indigo-600 bg-indigo-100 border border-indigo-300"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
