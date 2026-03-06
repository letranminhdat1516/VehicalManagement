"use client";

import { useAuth } from "@/src/hooks/useAuth";
import DashboardLayout from "@/src/components/DashboardLayout";
import { useState, useEffect } from "react";
import { branchService } from "@/src/services/branchService";
import { Branch } from "@/src/types";
import { useRouter } from "next/navigation";

export default function BranchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadBranches();
  }, [user, router]);

  const loadBranches = async () => {
    setLoading(true);
    const response = await branchService.getBranches();
    if (response.data) {
      setBranches(response.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBranch) {
      const result = await branchService.updateBranch(editingBranch.id, formData);
      if (result.error) {
        alert(`Lỗi: ${result.error}`);
      } else {
        alert("Đã cập nhật chi nhánh thành công!");
        resetForm();
        loadBranches();
      }
    } else {
      const result = await branchService.createBranch(formData);
      if (result.error) {
        alert(`Lỗi: ${result.error}`);
      } else {
        alert("Đã tạo chi nhánh thành công!");
        resetForm();
        loadBranches();
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "" });
    setEditingBranch(null);
    setShowForm(false);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chi nhánh này?")) return;

    const result = await branchService.deleteBranch(id);
    if (result.error) {
      alert(`Lỗi: ${result.error}`);
    } else {
      alert("Đã xóa chi nhánh thành công!");
      loadBranches();
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  return (
    <DashboardLayout>
      <div>
        <div className="page-header">
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold" }}>Chi Nhánh</h1>
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
            }}
          >
            {showForm ? "Hủy" : "Thêm Chi Nhánh"}
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
              {editingBranch ? "Sửa Chi Nhánh" : "Tạo Chi Nhánh Mới"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Tên Chi Nhánh"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              />
              <input
                type="text"
                placeholder="Địa Chỉ"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              />
              <input
                type="tel"
                placeholder="Số Điện Thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              />

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="submit"
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  {editingBranch ? "Cập Nhật" : "Tạo Mới"}
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
          <div>Đang tải chi nhánh...</div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            overflowX: "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Tên</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>?ịa Chỉ</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Số Điện Thoại</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "500", whiteSpace: "nowrap" }}>{branch.name}</td>
                    <td style={{ padding: "0.75rem" }}>{branch.address || "-"}</td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>{branch.phone || "-"}</td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleEdit(branch)}
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "0.25rem",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
