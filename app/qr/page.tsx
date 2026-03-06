"use client";

import DashboardLayout from "@/src/components/DashboardLayout";
import { useAuth } from "@/src/hooks/useAuth";
import { useVehicles } from "@/src/hooks/useVehicles";
import { QRCodeCanvas } from "qrcode.react";
import { useMemo } from "react";

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
          {vehicles.map((vehicle) => {
            const qrValue = `${origin}/rentals?vehicle=${encodeURIComponent(vehicle.code)}`;
            return (
              <div key={vehicle.id} style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "1rem",
                textAlign: "center",
              }}>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "1rem" }}>
                  {vehicle.code}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.75rem" }}>
                  {vehicle.type}
                </div>
                <QRCodeCanvas value={qrValue} size={180} />
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
                  Quét QR để mở form thuê xe
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
