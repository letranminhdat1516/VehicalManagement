"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useRentals } from "@/src/hooks/useRentals";
import { useVehicles } from "@/src/hooks/useVehicles";
import DashboardLayout from "@/src/components/DashboardLayout";
import QRScanner from "@/src/components/QRScanner";
import CccdImage from "@/src/components/CccdImage";
import { supabase } from "@/src/lib/supabaseClient";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Rental, RentalStatus } from "@/src/types";

// Lightbox image with auto-signed URL
function LightboxImg({ src }: { src: string | null }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!src) return;
    setLoading(true);
    fetch(`/api/cccd-signed-url?path=${encodeURIComponent(src)}`)
      .then(r => r.json())
      .then(d => { if (d.signedUrl) setSignedUrl(d.signedUrl); })
      .finally(() => setLoading(false));
  }, [src]);
  if (!src) return null;
  if (loading) return (
    <div style={{ width: 320, height: 200, background: "#111", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
      Đang tải...
    </div>
  );
  return (
    <img
      src={signedUrl ?? ""}
      alt="CCCD"
      style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: "0.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "block" }}
    />
  );
}

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
  const [cccdPreview, setCccdPreview] = useState<string | null>(null);
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

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [exportFrom, setExportFrom] = useState(firstOfMonth);
  const [exportTo, setExportTo] = useState(today);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportFrom) params.set("from", exportFrom);
      if (exportTo) params.set("to", exportTo);
      const res = await fetch(`/api/export/rentals?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        alert(`Lỗi export: ${err.error}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `don_thue_${exportFrom}_den_${exportTo}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const availableVehicles = vehicles.filter(
    (v) => v.status === "AVAILABLE"
  );

  useEffect(() => {
    if (!user) return;
    const vehicleCode = searchParams.get("vehicle");
    if (!vehicleCode || !vehicles.length) return;

    const matched = vehicles.find(
      (v) => v.code === vehicleCode
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
    if (!vehicleCode) {
      alert("Mã xe không hợp lệ.");
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
      (v) => v.code === code || String(v.id) === code
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
      (v) => v.code === code || String(v.id) === code
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

          {/* Export Excel */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.25rem",
            padding: "0.875rem 1.25rem",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>📊 Xuất Excel:</span>
            <label style={{ fontSize: "0.8rem", color: "#6b7280" }}>Từ ngày</label>
            <input
              type="date"
              value={exportFrom}
              onChange={e => setExportFrom(e.target.value)}
              style={{ padding: "0.35rem 0.6rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
            />
            <label style={{ fontSize: "0.8rem", color: "#6b7280" }}>Đến ngày</label>
            <input
              type="date"
              value={exportTo}
              onChange={e => setExportTo(e.target.value)}
              style={{ padding: "0.35rem 0.6rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem" }}
            />
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: "0.4rem 1.25rem",
                background: exporting ? "#9ca3af" : "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: exporting ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              {exporting ? "Đang xuất..." : "⬇ Tải Excel"}
            </button>
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
                    <th style={{ padding: "0.75rem", textAlign: "left", fontWeight: "600" }}>Ảnh</th>
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
                      <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: "500" }}>
                        {vehicles.find(v => String(v.id) === String(rental.vehicle_id))?.code ?? String(rental.vehicle_id)}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {rental.citizen_image_path ? (
                          <CccdImage
                            src={rental.citizen_image_path}
                            onClick={() => setCccdPreview(rental.citizen_image_path!)}
                          />
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>—</span>
                        )}
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
        <div style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {/* Header */}
          <div style={{ width: "100%", maxWidth: 480, marginBottom: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🚗</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0c4a6e", margin: 0 }}>
              Go Mall Rental
            </h1>
            <p style={{ color: "#0369a1", fontSize: "0.85rem", marginTop: "0.25rem", marginBottom: 0 }}>
              Phiếu Mượn Xe
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: 480 }}>
            <div style={{
              background: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}>
              {publicSubmitted ? (
                /* SUCCESS */
                <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
                  <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>✅</div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#065f46", margin: "0 0 0.5rem" }}>
                    Gửi yêu cầu thành công!
                  </h2>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    Vui lòng đưa màn hình này cho bảo vệ để xác nhận.
                  </p>
                  {publicReceipt && (
                    <div style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "0.75rem",
                      padding: "1rem 1.25rem",
                      textAlign: "left",
                      fontSize: "0.9rem",
                      marginBottom: "1.5rem",
                      display: "grid",
                      gap: "0.5rem",
                    }}>
                      {([
                        ["🚗 Mã xe", publicReceipt.vehicleCode],
                        ["👤 Khách hàng", publicReceipt.customerName],
                        ["📞 Số điện thoại", publicReceipt.customerPhone],
                        ["📝 Ghi chú", publicReceipt.notes || "—"],
                        ["🪪 Ảnh CCCD", publicReceipt.cccdFileName],
                        ["🕐 Thời gian", publicReceipt.submittedAt],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                          <span style={{ color: "#6b7280", minWidth: 130, flexShrink: 0 }}>{label}:</span>
                          <span style={{ fontWeight: "600", color: "#111827", wordBreak: "break-word" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1.5rem",
                    background: "#d1fae5",
                    color: "#065f46",
                    borderRadius: "9999px",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                  }}>
                    ⏳ Chờ bảo vệ xác nhận
                  </div>
                </div>
              ) : (
                /* FORM */
                <>
                  <div style={{
                    background: "linear-gradient(135deg, #0c4a6e, #0369a1)",
                    padding: "1.25rem 1.5rem",
                    color: "white",
                  }}>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                      Điền thông tin mượn xe
                    </h2>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", opacity: 0.8 }}>
                      Tất cả các trường có dấu * là bắt buộc
                    </p>
                  </div>

                  <form onSubmit={handlePublicSubmit} style={{ padding: "1.25rem 1.5rem", display: "grid", gap: "1rem" }}>
                    {/* Mã xe */}
                    <div style={{
                      padding: "0.75rem 1rem",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: "600",
                      color: "#1e40af",
                      fontSize: "0.95rem",
                    }}>
                      🚗 Mã xe: <span style={{ fontSize: "1.1rem" }}>{vehicleCodeParam}</span>
                    </div>

                    {/* Họ tên */}
                    <div style={{ display: "grid", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#374151" }}>Họ và tên *</label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        required
                        style={{
                          padding: "0.7rem 0.875rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.5rem",
                          fontSize: "1rem",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* SĐT */}
                    <div style={{ display: "grid", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#374151" }}>Số điện thoại *</label>
                      <input
                        type="tel"
                        placeholder="0912 345 678"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        required
                        style={{
                          padding: "0.7rem 0.875rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.5rem",
                          fontSize: "1rem",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* CCCD upload */}
                    <div style={{ display: "grid", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#374151" }}>Ảnh CCCD / CMND *</label>
                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.9rem",
                        border: `2px dashed ${cccdFile ? "#10b981" : "#d1d5db"}`,
                        borderRadius: "0.5rem",
                        background: cccdFile ? "#f0fdf4" : "#f9fafb",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: cccdFile ? "#065f46" : "#6b7280",
                        fontWeight: "500",
                      }}>
                        {cccdFile ? `✅ ${cccdFile.name}` : "📷 Chụp hoặc chọn ảnh CCCD"}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => setCccdFile(e.target.files?.[0] || null)}
                          required
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    {/* Ghi chú */}
                    <div style={{ display: "grid", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#374151" }}>Ghi chú (tùy chọn)</label>
                      <textarea
                        placeholder="Yêu cầu đặc biệt..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        style={{
                          padding: "0.7rem 0.875rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.5rem",
                          fontSize: "1rem",
                          resize: "vertical",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={publicSubmitting}
                      style={{
                        padding: "0.9rem",
                        background: publicSubmitting ? "#9ca3af" : "linear-gradient(135deg, #0c4a6e, #0369a1)",
                        color: "white",
                        border: "none",
                        borderRadius: "0.625rem",
                        cursor: publicSubmitting ? "not-allowed" : "pointer",
                        fontWeight: "700",
                        fontSize: "1.05rem",
                      }}
                    >
                      {publicSubmitting ? "⏳ Đang gửi..." : "Gửi yêu cầu mượn xe →"}
                    </button>

                    <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
                      Sau khi gửi, hãy đưa màn hình cho bảo vệ xác nhận
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CCCD Lightbox */}
      {cccdPreview && (
        <div
          onClick={() => setCccdPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <LightboxImg src={cccdPreview} />
            <button
              onClick={() => setCccdPreview(null)}
              style={{
                position: "absolute",
                top: "-0.75rem",
                right: "-0.75rem",
                width: 32,
                height: 32,
                borderRadius: "9999px",
                background: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              ✕
            </button>
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
