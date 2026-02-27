"use client";

import DashboardLayout from "@/src/components/DashboardLayout";
import { useAuth } from "@/src/hooks/useAuth";
import { useVehicles } from "@/src/hooks/useVehicles";
import { QRCodeCanvas } from "qrcode.react";
import { useMemo } from "react";
import { ALLOWED_QR_CODES } from "@/src/lib/allowedQrCodes";

export default function QRPage() {
  const { user } = useAuth();
  const { vehicles } = useVehicles(user?.role || "GUARD", user?.branch_id || null);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
          QR Cho Form Thuê Xe
        </h1>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1rem",
        }}>
          {ALLOWED_QR_CODES.map((code) => {
            const matched = vehicles.find((v) => v.code === code);
            const qrValue = `${origin}/rentals?vehicle=${encodeURIComponent(code)}`;
            return (
              <div key={code} style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "1rem",
              }}>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  {code} - {matched ? `${matched.brand} ${matched.model}` : "Chưa gán xe"}
                </div>
                <QRCodeCanvas value={qrValue} size={180} />
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
                  Quét QR để mở form thuê xe
                </div>
                {!matched && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#dc2626" }}>
                    Mã này chưa tồn tại trong danh sách xe
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
