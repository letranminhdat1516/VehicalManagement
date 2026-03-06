"use client";

import { useAuth } from "@/src/hooks/useAuth";
import DashboardLayout from "@/src/components/DashboardLayout";
import { useState, useEffect } from "react";
import { AppUser } from "@/src/types";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  });

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    if (user) {
      loadUsers();
    }
  }, [user, router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (res.ok) setUsers(json.data || []);
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${json.error}`);
      } else {
        alert("Đã tạo tài khoản bảo vệ thành công!");
        resetForm();
        loadUsers();
      }
    } catch (err: any) {
      alert(err.message || "Không thể tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (targetUser: AppUser) => {
    if (targetUser.id === user?.id) {
      alert("Không thể xóa tài khoản của chính mình.");
      return;
    }
    if (!confirm(`Xóa tài khoản "${targetUser.full_name}" (${targetUser.email})?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${json.error}`);
      } else {
        alert("Đã xóa tài khoản thành công!");
        loadUsers();
      }
    } catch (err: any) {
      alert(err.message || "Không thể xóa tài khoản");
    }
  };

  const resetForm = () => {
    setFormData({ email: "", password: "", full_name: "" });
    setShowForm(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Quản trị viên";
      case "GUARD": return "Bảo vệ";
      default: return role;
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  return (
    <DashboardLayout>
      <div>
        <div className="page-header">
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold" }}>Tài Khoản Bảo Vệ</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: "500",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {showForm ? "Hủy" : "+ Tạo Tài Khoản Mới"}
          </button>
        </div>

        {showForm && (
          <div style={{
            padding: "1.5rem",
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            marginBottom: "1.5rem",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Tạo Tài Khoản Bảo Vệ
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <input
                  type="text"
                  placeholder="Họ và tên *"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
                />

              <div className="grid-2col">
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
                />
                <input
                  type="password"
                  placeholder="Mật khẩu (ít nhất 6 ký tự) *"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
                />
              </div>

              <div style={{
                padding: "0.75rem",
                background: "#eff6ff",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                color: "#1d4ed8",
              }}>
                Tài khoản sẽ được tạo với quyền <strong>Bảo Vệ</strong>. Bảo vệ có thể xác nhận mượn xe và trả xe.
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "500",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Đang tạo..." : "Tạo Tài Khoản"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div>Đang tải tài khoản...</div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            overflowX: "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Họ tên</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Email</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Vai trò</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Ngày tạo</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", fontWeight: u.id === user.id ? "600" : "normal", whiteSpace: "nowrap" }}>
                      {u.full_name} {u.id === user.id && <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>(Bạn)</span>}
                    </td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>{u.email}</td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                        background: u.role === "ADMIN" ? "#dbeafe" : "#d1fae5",
                        color: u.role === "ADMIN" ? "#1e40af" : "#065f46",
                      }}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                      {u.id !== user.id && u.role !== "ADMIN" && (
                        <button
                          onClick={() => handleDelete(u)}
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "0.25rem",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                      Chưa có tài khoản nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
