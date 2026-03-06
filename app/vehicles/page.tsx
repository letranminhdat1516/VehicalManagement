"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useVehicles } from "@/src/hooks/useVehicles";
import DashboardLayout from "@/src/components/DashboardLayout";
import { VehicleStatus } from "@/src/types";

export default function VehiclesPage() {
  const { user } = useAuth();
  const { vehicles, loading, deleteVehicle, updateVehicleStatus } =
    useVehicles(user?.role || "GUARD", user?.branch_id || null);

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
    console.log("Updating vehicle status:", id, status);
    const result = await updateVehicleStatus(id, status);
    console.log("Update result:", result);
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
      case "BORROWING":
        return "Đang Mượn";
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
        <div className="page-header">
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold" }}>Phương Tiện</h1>
        </div>

        {loading ? (
          <div>Đang tải phương tiện...</div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            overflowX: "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Mã</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Loại</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Trạng thái</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600", whiteSpace: "nowrap" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>{vehicle.code}</td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>{vehicle.type}</td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                        background: vehicle.status === "AVAILABLE" ? "#d1fae5" :
                                   vehicle.status === "BORROWING" ? "#fed7aa" : "#fecaca",
                        color: vehicle.status === "AVAILABLE" ? "#065f46" :
                               vehicle.status === "BORROWING" ? "#92400e" : "#991b1b",
                      }}>
                        {getVehicleStatusLabel(vehicle.status)}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
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
