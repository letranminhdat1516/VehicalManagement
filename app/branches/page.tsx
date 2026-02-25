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
        alert(`Error: ${result.error}`);
      } else {
        alert("Branch updated successfully!");
        resetForm();
        loadBranches();
      }
    } else {
      const result = await branchService.createBranch(formData);
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        alert("Branch created successfully!");
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
    if (!confirm("Are you sure you want to delete this branch?")) return;

    const result = await branchService.deleteBranch(id);
    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      alert("Branch deleted successfully!");
      loadBranches();
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  return (
    <DashboardLayout>
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Branches</h1>
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
            {showForm ? "Cancel" : "Add Branch"}
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
              {editingBranch ? "Edit Branch" : "Create New Branch"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Branch Name"
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
                placeholder="Address"
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
                placeholder="Phone"
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
                  {editingBranch ? "Update" : "Create"}
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div>Loading branches...</div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Name</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Address</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Phone</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "500" }}>{branch.name}</td>
                    <td style={{ padding: "0.75rem" }}>{branch.address || "-"}</td>
                    <td style={{ padding: "0.75rem" }}>{branch.phone || "-"}</td>
                    <td style={{ padding: "0.75rem" }}>
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
                          Edit
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
                          Delete
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
