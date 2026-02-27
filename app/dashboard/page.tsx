"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useStats } from "@/src/hooks/useStats";
import DashboardLayout from "@/src/components/DashboardLayout";
import StatsGrid from "@/src/components/StatsGrid";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, loading: statsLoading } = useStats(
    user?.role || "GUARD",
    user?.branch_id || null
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <div style={{ padding: 40 }}>Đang tải...</div>;
  }

  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
          Tổng Quan
        </h1>

        {statsLoading ? (
          <div>Đang tải thống kê...</div>
        ) : stats ? (
          <StatsGrid stats={stats} />
        ) : (
          <div>Không có dữ liệu thống kê</div>
        )}

        {user.role === "ADMIN" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}>
            <div style={{
              padding: "1.5rem",
              background: "white",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Quản trị nhanh
              </h3>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <a href="/vehicles" style={{
                  padding: "0.75rem 1rem",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  fontWeight: "500",
                }}>Quản lý phương tiện</a>
                <a href="/rentals" style={{
                  padding: "0.75rem 1rem",
                  background: "#ecfdf5",
                  color: "#047857",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  fontWeight: "500",
                }}>Quản lý đơn thuê</a>
                <a href="/qr" style={{
                  padding: "0.75rem 1rem",
                  background: "#fef3c7",
                  color: "#92400e",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  fontWeight: "500",
                }}>Xem QR thiết bị</a>
              </div>
            </div>

            <div style={{
              padding: "1.5rem",
              background: "white",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Tóm tắt vận hành
              </h3>
              <div style={{ display: "grid", gap: "0.5rem", color: "#374151" }}>
                <div>Đang sẵn sàng: <strong>{stats?.availableVehicles ?? 0}</strong></div>
                <div>Đang cho thuê: <strong>{stats?.rentedVehicles ?? 0}</strong></div>
                <div>Đang bảo trì: <strong>{stats?.maintenanceVehicles ?? 0}</strong></div>
                <div>Doanh thu tháng: <strong>{(stats?.totalRevenue ?? 0).toLocaleString()} VNĐ</strong></div>
              </div>
            </div>

            <div style={{
              padding: "1.5rem",
              background: "white",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem" }}>
                Hướng dẫn nhanh
              </h3>
              <ol style={{ margin: 0, paddingLeft: "1.25rem", color: "#4b5563", lineHeight: 1.6 }}>
                <li>In/hiển thị QR để khách quét.</li>
                <li>Khách điền form và gửi yêu cầu.</li>
                <li>Bảo vệ xác nhận và bàn giao xe.</li>
                <li>Trả xe: quét QR để hoàn tất.</li>
              </ol>
            </div>
          </div>
        )}

        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "white",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Chào mừng, {user.full_name}!
          </h2>
          <p style={{ color: "#6b7280" }}>
            Vai trò: <strong>{user.role}</strong>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}