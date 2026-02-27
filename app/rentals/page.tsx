"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useRentals } from "@/src/hooks/useRentals";
import { useVehicles } from "@/src/hooks/useVehicles";
import DashboardLayout from "@/src/components/DashboardLayout";
import QRScanner from "@/src/components/QRScanner";
import { supabase } from "@/src/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Rental, RentalStatus } from "@/src/types";
import { ALLOWED_QR_CODES, isAllowedQrCode } from "@/src/lib/allowedQrCodes";

export default function RentalsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { rentals, loading, createRental, completeRental, cancelRental } =
    useRentals(user?.role || "GUARD", user?.branch_id || null);
  const { vehicles } = useVehicles(user?.role || "GUARD", user?.branch_id || null);

  const [showForm, setShowForm] = useState(false);
  const [showScanRent, setShowScanRent] = useState(false);
  const [showScanReturn, setShowScanReturn] = useState(false);
  const [cccdFile, setCccdFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    customer_name: "",
    customer_phone: "",
    customer_id_number: "",
    start_date: new Date().toISOString().split("T")[0],
    daily_rate: 0,
    notes: "",
  });

  const availableVehicles = vehicles.filter(
    (v) => v.status === "AVAILABLE" && ALLOWED_QR_CODES.includes(v.code)
  );

  useEffect(() => {
    const vehicleCode = searchParams.get("vehicle");
    if (!vehicleCode || !vehicles.length) return;

    const matched = vehicles.find(
      (v) => v.code === vehicleCode && ALLOWED_QR_CODES.includes(v.code)
    );
    if (!matched) return;

    setFormData((prev) => ({ ...prev, vehicle_id: matched.id }));
    setShowForm(true);
  }, [searchParams, vehicles]);

  const uploadCccd = async (file: File) => {
    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `cccd/${user?.id || "anonymous"}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("citizen-ids")
      .upload(filePath, file, { upsert: true });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("citizen-ids").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);
    if (!selectedVehicle) {
      alert("Vui lòng chọn phương tiện");
      return;
    }

    if (!isAllowedQrCode(selectedVehicle.code)) {
      alert("Mã xe không hợp lệ. Chỉ cho phép 6 mã cố định.");
      return;
    }

    if (!cccdFile) {
      alert("Vui lòng chụp hoặc tải lên ảnh CCCD");
      return;
    }

    let cccdUrl: string | null = null;
    try {
      cccdUrl = await uploadCccd(cccdFile);
    } catch (err: any) {
      alert(`Lỗi upload CCCD: ${err?.message || "Không thể tải lên"}`);
      return;
    }

    const notesWithCccd = `${formData.notes ? formData.notes + "\n" : ""}CCCD: ${cccdUrl}`;

    const result = await createRental({
      ...formData,
      guard_id: user?.id || "",
      branch_id: user?.branch_id || selectedVehicle.branch_id,
      daily_rate: selectedVehicle.daily_rate,
      status: "ACTIVE" as RentalStatus,
      notes: notesWithCccd,
    });

    if (result.success) {
      alert("Đã tạo đơn thuê thành công!");
      resetForm();
    } else {
      alert(`Lỗi: ${result.error}`);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      customer_name: "",
      customer_phone: "",
      customer_id_number: "",
      start_date: new Date().toISOString().split("T")[0],
      daily_rate: 0,
      notes: "",
    });
    setCccdFile(null);
    setShowForm(false);
  };

  const handleComplete = async (rental: Rental) => {
    const days = prompt("Nhập số ngày thuê:");
    if (!days) return;

    const totalAmount = parseFloat(days) * rental.daily_rate;
    const confirmed = confirm(`Tổng tiền: ${totalAmount.toLocaleString()} VNĐ. Hoàn tất đơn thuê?`);
    
    if (!confirmed) return;

    const result = await completeRental(rental.id, totalAmount);
    if (result.success) {
      alert("Đã hoàn tất đơn thuê thành công!");
    } else {
      alert(`Lỗi: ${result.error}`);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn thuê này?")) return;

    const result = await cancelRental(id);
    if (result.success) {
      alert("Đã hủy đơn thuê thành công!");
    } else {
      alert(`Lỗi: ${result.error}`);
    }
  };

  const handleScanRent = (value: string) => {
    const code = value.trim();
    const matched = vehicles.find(
      (v) => (v.code === code || v.id === code) && ALLOWED_QR_CODES.includes(v.code)
    );
    if (!matched) {
      alert("Không tìm thấy phương tiện từ mã QR");
      return;
    }
    setFormData((prev) => ({ ...prev, vehicle_id: matched.id }));
    setShowScanRent(false);
  };

  const handleScanReturn = (value: string) => {
    const code = value.trim();
    const matched = vehicles.find(
      (v) => (v.code === code || v.id === code) && ALLOWED_QR_CODES.includes(v.code)
    );
    if (!matched) {
      alert("Không tìm thấy phương tiện từ mã QR");
      return;
    }

    const rental = rentals.find(
      (r) => r.status === "ACTIVE" && r.vehicle_id === matched.id
    );

    if (!rental) {
      alert("Không có đơn thuê đang hoạt động cho phương tiện này");
      return;
    }

    setShowScanReturn(false);
    handleComplete(rental);
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
          <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Đơn Thuê</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <a
              href="/qr"
              style={{
                padding: "0.75rem 1.5rem",
                background: "#111827",
                color: "white",
                borderRadius: "0.375rem",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Xem QR xe
            </a>
            <button
              onClick={() => setShowScanReturn(true)}
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
              Quét QR trả xe
            </button>
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
              {showForm ? "Hủy" : "Thuê Mới"}
            </button>
          </div>
        </div>

        {showScanRent && (
          <QRScanner
            title="Quét QR để chọn xe"
            onScan={handleScanRent}
            onClose={() => setShowScanRent(false)}
          />
        )}

        {showScanReturn && (
          <QRScanner
            title="Quét QR để xác nhận trả xe"
            onScan={handleScanReturn}
            onClose={() => setShowScanReturn(false)}
          />
        )}

        {showForm && (
          <div style={{
            padding: "1.5rem",
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            marginBottom: "1.5rem",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
              Tạo Đơn Thuê Mới
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <button
                type="button"
                onClick={() => setShowScanRent(true)}
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
                Quét QR chọn xe
              </button>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                required
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              >
                <option value="">Chọn phương tiện</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.code} - {vehicle.brand} {vehicle.model} ({vehicle.daily_rate?.toLocaleString() || '0'} VNĐ/ngày)
                  </option>
                ))}
              </select>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input
                  type="text"
                  placeholder="Tên khách hàng"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Số CMND/CCCD (Tùy chọn)"
                value={formData.customer_id_number}
                onChange={(e) => setFormData({ ...formData, customer_id_number: e.target.value })}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              />

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setCccdFile(e.target.files?.[0] || null)}
                required
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              />

              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                }}
              />

              <textarea
                placeholder="Ghi chú (Tùy chọn)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  resize: "vertical",
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
                  Tạo Đơn Thuê
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
          <div>Đang tải đơn thuê...</div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            overflow: "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Khách hàng</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Điện thoại</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Mã xe</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Ngày bắt đầu</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Ngày kết thúc</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Giá/Ngày</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Tổng</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Trạng thái</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "0.75rem" }}>{rental.customer_name}</td>
                    <td style={{ padding: "0.75rem" }}>{rental.customer_phone}</td>
                    <td style={{ padding: "0.75rem", fontSize: "0.75rem" }}>
                      {rental.vehicle_id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {new Date(rental.start_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {rental.end_date ? new Date(rental.end_date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>{rental.daily_rate.toLocaleString()} VNĐ</td>
                    <td style={{ padding: "0.75rem" }}>
                      {rental.total_amount ? `${rental.total_amount.toLocaleString()} VNĐ` : "-"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        background: rental.status === "ACTIVE" ? "#dbeafe" :
                                   rental.status === "COMPLETED" ? "#d1fae5" : "#fecaca",
                        color: rental.status === "ACTIVE" ? "#1e40af" :
                               rental.status === "COMPLETED" ? "#065f46" : "#991b1b",
                      }}>
                        {rental.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {rental.status === "ACTIVE" && (
                          <>
                            <button
                              onClick={() => handleComplete(rental)}
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
                              Hoàn Tất
                            </button>
                            <button
                              onClick={() => handleCancel(rental.id)}
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
                              Hủy
                            </button>
                          </>
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
