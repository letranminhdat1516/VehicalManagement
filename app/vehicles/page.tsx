"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useVehicles } from "@/src/hooks/useVehicles";
import DashboardLayout from "@/src/components/DashboardLayout";
import { useState } from "react";
import { Vehicle, VehicleType, VehicleStatus } from "@/src/types";

export default function VehiclesPage() {
  const { user } = useAuth();
  const { vehicles, loading, createVehicle, updateVehicle, deleteVehicle, updateVehicleStatus } =
    useVehicles(user?.role || "GUARD", user?.branch_id || null);

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    type: "CAR" as VehicleType,
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    plate_number: "",
    status: "AVAILABLE" as VehicleStatus,
    branch_id: user?.branch_id || "",
    daily_rate: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingVehicle) {
      const result = await updateVehicle(editingVehicle.id, formData);
      if (result.success) {
        alert("Đã cập nhật phương tiện thành công!");
        resetForm();
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    } else {
      const result = await createVehicle(formData);
      if (result.success) {
        alert("Đã tạo phương tiện thành công!");
        resetForm();
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      type: "CAR",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      plate_number: "",
      status: "AVAILABLE",
      branch_id: user?.branch_id || "",
      daily_rate: 0,
    });
    setEditingVehicle(null);
    setShowForm(false);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      code: vehicle.code,
      type: vehicle.type,
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || new Date().getFullYear(),
      plate_number: vehicle.plate_number || "",
      status: vehicle.status,
      branch_id: vehicle.branch_id,
      daily_rate: vehicle.daily_rate,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phương tiện này?")) return;

    const result = await deleteVehicle(id);
    if (result.success) {
      alert("Đã xóa phương tiện thành công!");
    } else {
      alert(`Lỗi: ${result.error}`);
    }
  };

  const handleStatusChange = async (id: string, status: VehicleStatus) => {
    const result = await updateVehicleStatus(id, status);
    if (result.success) {
      alert("Đã cập nhật trạng thái thành công!");
    } else {
      alert(`Lỗi: ${result.error}`);
    }
  };

  const getVehicleStatusLabel = (status: VehicleStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "Sẵn Sàng";
      case "RENTED":
        return "Đang Thuê";
      case "MAINTENANCE":
        return "Bảo Trì";
      default:
        return status;
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Phương Tiện</h1>
          {user.role === "ADMIN" && (
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
              {showForm ? "Hủy" : "Thêm Phương Tiện"}
            </button>
          )}
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
              {editingVehicle ? "Chỉnh Sửa Phương Tiện" : "Tạo Phương Tiện Mới"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Mã xe"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                >
                  <option value="CAR">Ô tô</option>
                  <option value="MOTORCYCLE">Xe máy</option>
                  <option value="TRUCK">Xe tải</option>
                  <option value="VAN">Xe van</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Hãng xe"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
                <input
                  type="text"
                  placeholder="Mẫu xe"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input
                  type="number"
                  placeholder="Năm sản xuất"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
                <input
                  type="text"
                  placeholder="Biển số xe"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input
                  type="number"
                  placeholder="Giá thuê/ngày"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) })}
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                >
                  <option value="AVAILABLE">Sẵn sàng</option>
                  <option value="RENTED">Đang thuê</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>
              </div>

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
                  {editingVehicle ? "Cập Nhật" : "Tạo Mới"}
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
          <div>Đang tải phương tiện...</div>
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
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Mã</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Loại</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Hãng</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Mẫu</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Biển số</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Trạng thái</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Giá/Ngày</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem" }}>{vehicle.code}</td>
                    <td style={{ padding: "0.75rem" }}>{vehicle.type}</td>
                    <td style={{ padding: "0.75rem" }}>{vehicle.brand}</td>
                    <td style={{ padding: "0.75rem" }}>{vehicle.model}</td>
                    <td style={{ padding: "0.75rem" }}>{vehicle.plate_number}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        background: vehicle.status === "AVAILABLE" ? "#d1fae5" :
                                   vehicle.status === "RENTED" ? "#fed7aa" : "#fecaca",
                        color: vehicle.status === "AVAILABLE" ? "#065f46" :
                               vehicle.status === "RENTED" ? "#92400e" : "#991b1b",
                      }}>
                        {getVehicleStatusLabel(vehicle.status)}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>${vehicle.daily_rate}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {user.role === "ADMIN" && (
                          <>
                            <button
                              onClick={() => handleEdit(vehicle)}
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
                              onClick={() => handleDelete(vehicle.id)}
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
                          </>
                        )}
                        {vehicle.status === "AVAILABLE" && (
                          <button
                            onClick={() => handleStatusChange(vehicle.id, "MAINTENANCE")}
                            style={{
                              padding: "0.25rem 0.75rem",
                              background: "#f59e0b",
                              color: "white",
                              border: "none",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                            }}
                          >
                            Bảo trì
                          </button>
                        )}
                        {vehicle.status === "MAINTENANCE" && (
                          <button
                            onClick={() => handleStatusChange(vehicle.id, "AVAILABLE")}
                            style={{
                              padding: "0.25rem 0.75rem",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                            }}
                          >
                            Sẵn sàng
                          </button>
                        )}
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
