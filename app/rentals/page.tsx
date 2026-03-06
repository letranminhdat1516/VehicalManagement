"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useRentals } from "@/src/hooks/useRentals";
import { useVehicles } from "@/src/hooks/useVehicles";
import DashboardLayout from "@/src/components/DashboardLayout";
import QRScanner from "@/src/components/QRScanner";
import { supabase } from "@/src/lib/supabaseClient";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Rental, RentalStatus } from "@/src/types";
import { ALLOWED_QR_CODES, isAllowedQrCode } from "@/src/lib/allowedQrCodes";

function RentalsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const vehicleCodeParam = searchParams.get("vehicle");
  const isPublic = !user && !!vehicleCodeParam;
  const { rentals, loading, createRental, completeRental, cancelRental, approveRental } =
    useRentals(user?.role || "GUARD", user?.branch_id || null);
  const { vehicles } = useVehicles(user?.role || "GUARD", user?.branch_id || null);

  const [showForm, setShowForm] = useState(false);
  const [showScanRent, setShowScanRent] = useState(false);
  const [showScanReturn, setShowScanReturn] = useState(false);
  const [cccdFile, setCccdFile] = useState<File | null>(null);
  const [publicSubmitting, setPublicSubmitting] = useState(false);
  const [publicSubmitted, setPublicSubmitted] = useState(false);
  const [publicReceipt, setPublicReceipt] = useState<{
    vehicleCode: string;
    customerName: string;
    customerPhone: string;
    notes: string;
    cccdFileName: string;
    submittedAt: string;
  } | null>(null);

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "-";
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  };

  const pickDate = (rental: Rental, keys: string[]) => {
    const data = rental as Record<string, any>;
    for (const key of keys) {
      if (data?.[key]) return data[key];
    }
    return null;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ Xác Nhận";
      case "BORROWING":
        return "Đang Mượn";
      case "RETURNED":
        return "Đã Trả";
      case "CANCELLED":
        return "Đã Hủy";
      default:
        return status;
    }
  };
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
    if (!user) return;
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
    const fileName = `${Date.now()}.${fileExt}`;

    const res = await fetch("/api/public-cccd-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        contentType: file.type || "image/jpeg",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Không thể tạo link upload");
    }

    const uploadRes = await fetch(data.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Upload CCCD thất bại");
    }

    return data.publicUrl as string;
  };

  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vehicleCode = vehicleCodeParam?.trim() || "";
    if (!vehicleCode || !isAllowedQrCode(vehicleCode)) {
      alert("Mã xe không hợp lệ. Chỉ cho phép 6 mã cố định.");
      return;
    }

    let cccdUrl: string | null = null;
    if (cccdFile) {
      try {
        cccdUrl = await uploadCccd(cccdFile);
      } catch (err: any) {
        alert(`Lỗi upload CCCD: ${err?.message || "Không thể tải lên"}`);
        return;
      }
    }

    const notesWithCccd = `${formData.notes ? formData.notes + "\n" : ""}CCCD: ${cccdUrl}`;

    setPublicSubmitting(true);
    try {
      const response = await fetch("/api/public-rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_code: vehicleCode,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          start_date: formData.start_date,
          notes: notesWithCccd,
          cccd_url: cccdUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result?.error || "Không thể tạo đơn thuê");
        return;
      }

      setPublicReceipt({
        vehicleCode,
        customerName: formData.customer_name,
        customerPhone: formData.customer_phone,
        notes: formData.notes || "-",
        cccdFileName: cccdFile?.name || "Ảnh CCCD",
        submittedAt: new Date().toLocaleString(),
      });
      setPublicSubmitted(true);
    } catch (err: any) {
      alert(err?.message || "Không thể gửi yêu cầu");
    } finally {
      setPublicSubmitting(false);
    }
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
      vehicle_id: formData.vehicle_id,
      customer_name: formData.customer_name,
      phone: formData.customer_phone,
      branch_id: user?.branch_id || selectedVehicle.branch_id,
      status: "PENDING" as RentalStatus,
      borrow_time: new Date().toISOString(),
      note: notesWithCccd,
      citizen_image_path: cccdUrl || undefined,
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
    const confirmed = confirm("Xác nhận trả xe?");
    if (!confirmed) return;

    const result = await completeRental(rental.id, 0);
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

  const handleApprove = async (rental: Rental) => {
    if (!confirm("Xác nhận cho khách mượn xe?")) return;

    const result = await approveRental(rental.id);
    if (result.success) {
      alert("Đã xác nhận mượn xe thành công!");
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
      (r) => r.status === "BORROWING" && r.vehicle_id === matched.id
    );

    if (!rental) {
      alert("Không có đơn thuê đang hoạt động cho phương tiện này");
      return;
    }

    setShowScanReturn(false);
    handleComplete(rental);
  };

  if (!user && !isPublic) return null;

  return (
    <div>
      {user ? (
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
              <form
                onSubmit={isPublic ? handlePublicSubmit : handleSubmit}
                style={{ display: "grid", gap: "1rem" }}
              >
                {!isPublic && (
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
                )}
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
                      {vehicle.code} - {vehicle.type}
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
                    disabled={publicSubmitting}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontWeight: "500",
                      opacity: publicSubmitting ? 0.7 : 1,
                    }}
                  >
                    {publicSubmitting ? "Đang gửi..." : "Tạo Đơn Thuê"}
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
                    
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Trạng thái</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((rental) => (
                    <tr key={rental.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "0.75rem" }}>{rental.customer_name}</td>
                      <td style={{ padding: "0.75rem" }}>{rental.phone}</td>
                      <td style={{ padding: "0.75rem", fontSize: "0.75rem" }}>
                        {String(rental.vehicle_id).substring(0, 8)}...
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {formatDate(
                          pickDate(rental, ["borrow_time", "created_at"])
                        )}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {formatDate(
                          pickDate(rental, ["return_time"])
                        )}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          background: rental.status === "PENDING" ? "#fef3c7" :
                                     rental.status === "BORROWING" ? "#dbeafe" :
                                     rental.status === "RETURNED" ? "#d1fae5" : "#fecaca",
                          color: rental.status === "PENDING" ? "#92400e" :
                                 rental.status === "BORROWING" ? "#1e40af" :
                                 rental.status === "RETURNED" ? "#065f46" : "#991b1b",
                        }}>
                          {getStatusLabel(rental.status)}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {rental.status === "PENDING" && (
                            <button
                              onClick={() => handleApprove(rental)}
                              style={{
                                padding: "0.25rem 0.75rem",
                                background: "#f59e0b",
                                color: "white",
                                border: "none",
                                borderRadius: "0.25rem",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                              }}
                            >
                              ✓ Xác Nhận Mượn
                            </button>
                          )}
                          {rental.status === "BORROWING" && (
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
                              Trả Xe
                            </button>
                          )}
                          {(rental.status === "PENDING" || rental.status === "BORROWING") && user?.role === "ADMIN" && (
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
      ) : (
        <div style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Phiếu Mượn Xe
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Vui lòng điền thông tin để mượn xe. Sau khi gửi, hãy đưa cho bảo vệ xác nhận.
          </p>
          <div style={{
            padding: "1.5rem",
            background: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            marginBottom: "1.5rem",
          }}>
            {publicSubmitted ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.75rem" }}>
                  Gửi yêu cầu thành công
                </div>
                <div style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                  Vui lòng đưa điện thoại cho bảo vệ để xác nhận.
                </div>
                {publicReceipt && (
                  <div style={{
                    textAlign: "left",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    marginBottom: "1.5rem",
                    background: "#f9fafb",
                    fontSize: "0.95rem",
                  }}>
                    <div><strong>Mã xe:</strong> {publicReceipt.vehicleCode}</div>
                    <div><strong>Khách hàng:</strong> {publicReceipt.customerName}</div>
                    <div><strong>Số điện thoại:</strong> {publicReceipt.customerPhone}</div>
                    <div><strong>Ghi chú:</strong> {publicReceipt.notes}</div>
                    <div><strong>Ảnh CCCD:</strong> {publicReceipt.cccdFileName}</div>
                    <div><strong>Thời gian:</strong> {publicReceipt.submittedAt}</div>
                  </div>
                )}
                <div style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  background: "#d1fae5",
                  color: "#065f46",
                  borderRadius: "9999px",
                  fontWeight: "600",
                }}>
                  Chờ xác nhận
                </div>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
                  Tạo Đơn Thuê Mới
                </h2>
                <form
                  onSubmit={handlePublicSubmit}
                  style={{ display: "grid", gap: "1rem" }}
                >
                  <div style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    background: "#f9fafb",
                    fontWeight: "500",
                  }}>
                    Mã xe: {vehicleCodeParam}
                  </div>

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
                      disabled={publicSubmitting}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontWeight: "500",
                        opacity: publicSubmitting ? 0.7 : 1,
                      }}
                    >
                      {publicSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RentalsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Đang tải...</div>}>
      <RentalsContent />
    </Suspense>
  );
}
