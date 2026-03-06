"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useStats } from "@/src/hooks/useStats";
import DashboardLayout from "@/src/components/DashboardLayout";
import StatsGrid from "@/src/components/StatsGrid";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  GUARD: "Bảo vệ",
  USER: "Người dùng",
};

const ROLE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  GUARD: { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
  USER: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, loading: statsLoading, refresh } = useStats(
    user?.role || "GUARD",
    user?.branch_id || null
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#6b7280" }}>
        Đang tải...
      </div>
    );
  }

  const role = user.role as string;
  const roleStyle = ROLE_COLOR[role] || ROLE_COLOR.USER;
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Chào buổi sáng" : now.getHours() < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)",
          borderRadius: "1rem",
          padding: "1.75rem 2rem",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div>
            <div style={{ fontSize: "0.875rem", opacity: 0.75, marginBottom: "0.25rem" }}>
              {greeting} 👋
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "700", margin: 0 }}>
              {user.full_name}
            </h1>
            <span style={{
              display: "inline-block",
              marginTop: "0.5rem",
              padding: "0.2rem 0.75rem",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: "500",
            }}>
              {ROLE_LABEL[role] || role}
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              {now.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <button
              onClick={refresh}
              style={{
                marginTop: "0.5rem",
                padding: "0.4rem 1rem",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "0.5rem",
                color: "white",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div style={{
            padding: "3rem",
            textAlign: "center",
            color: "#9ca3af",
            background: "white",
            borderRadius: "0.75rem",
            border: "1px solid #e5e7eb",
          }}>
            ⏳ Đang tải thống kê...
          </div>
        ) : stats ? (
          <StatsGrid stats={stats} />
        ) : (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            color: "#9ca3af",
            background: "white",
            borderRadius: "0.75rem",
            border: "1px solid #e5e7eb",
          }}>
            Không có dữ liệu thống kê
          </div>
        )}

        {/* Quick actions */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}>
          <a href="/vehicles" style={{
            padding: "1.25rem 1.5rem",
            background: "white",
            border: "1px solid #bfdbfe",
            borderRadius: "0.75rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            transition: "box-shadow 0.2s",
          }}>
            <span style={{ fontSize: "1.75rem" }}>🚗</span>
            <div>
              <div style={{ fontWeight: "600", color: "#1e40af" }}>Phương Tiện</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {stats ? `${stats.availableVehicles} sẵn sàng / ${stats.totalVehicles} tổng` : "Xem danh sách"}
              </div>
            </div>
          </a>

          <a href="/rentals" style={{
            padding: "1.25rem 1.5rem",
            background: "white",
            border: "1px solid #bbf7d0",
            borderRadius: "0.75rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <span style={{ fontSize: "1.75rem" }}>📋</span>
            <div>
              <div style={{ fontWeight: "600", color: "#166534" }}>Đơn Thuê</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {stats && stats.pendingRentals > 0
                  ? <span style={{ color: "#7c3aed", fontWeight: 600 }}>⚠️ {stats.pendingRentals} đơn chờ xác nhận</span>
                  : "Xem & xử lý đơn thuê"}
              </div>
            </div>
          </a>

          <a href="/qr" style={{
            padding: "1.25rem 1.5rem",
            background: "white",
            border: "1px solid #fde68a",
            borderRadius: "0.75rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <span style={{ fontSize: "1.75rem" }}>📱</span>
            <div>
              <div style={{ fontWeight: "600", color: "#92400e" }}>Mã QR</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>In QR cho từng xe</div>
            </div>
          </a>

          {user.role === "ADMIN" && (
            <a href="/users" style={{
              padding: "1.25rem 1.5rem",
              background: "white",
              border: "1px solid #e9d5ff",
              borderRadius: "0.75rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <span style={{ fontSize: "1.75rem" }}>👤</span>
              <div>
                <div style={{ fontWeight: "600", color: "#6b21a8" }}>Tài Khoản</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Quản lý bảo vệ</div>
              </div>
            </a>
          )}
        </div>

        {/* Workflow guide */}
        <div style={{
          padding: "1.5rem",
          background: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e5e7eb",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#374151", marginBottom: "1rem", marginTop: 0 }}>
            📌 Quy trình mượn xe
          </h3>
          <div style={{ display: "flex", gap: "0", flexWrap: "wrap" }}>
            {[
              { step: "1", label: "Khách quét QR", desc: "Quét mã trên xe", color: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
              { step: "2", label: "Gửi yêu cầu", desc: "Điền thông tin & CCCD", color: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
              { step: "3", label: "Bảo vệ xác nhận", desc: "Duyệt đơn → bàn giao xe", color: "#fffbeb", border: "#fde68a", text: "#92400e" },
              { step: "4", label: "Trả xe", desc: "Bảo vệ hoàn tất trả xe", color: "#fdf4ff", border: "#f5d0fe", text: "#701a75" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0" }}>
                <div style={{
                  padding: "0.75rem 1rem",
                  background: item.color,
                  border: `1px solid ${item.border}`,
                  borderRadius: "0.5rem",
                  minWidth: "130px",
                }}>
                  <div style={{ fontSize: "0.7rem", color: item.text, fontWeight: "700", marginBottom: "0.1rem" }}>
                    BƯỚC {item.step}
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: "600", color: item.text }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: item.text, opacity: 0.75 }}>{item.desc}</div>
                </div>
                {i < 3 && (
                  <div style={{ padding: "0 0.5rem", color: "#9ca3af", fontSize: "1.25rem", flexShrink: 0 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}