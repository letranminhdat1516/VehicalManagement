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

        {/* ── Header banner ─────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)",
          borderRadius: "1rem",
          padding: "1.5rem 1.75rem",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div>
            <div style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: "0.2rem" }}>
              {greeting} 👋
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>
              {user.full_name}
            </h1>
            <span style={{
              display: "inline-block",
              marginTop: "0.4rem",
              padding: "0.2rem 0.75rem",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: "500",
            }}>
              {ROLE_LABEL[role] || role}
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.78rem", opacity: 0.7, marginBottom: "0.4rem" }}>
              {now.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <button
              onClick={refresh}
              style={{
                padding: "0.45rem 1rem",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: "0.5rem",
                color: "white",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: "500",
              }}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        {/* ── Section: Thống kê ─────────────────────────────────── */}
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}>
            <span style={{
              width: 4,
              height: 20,
              background: "#3b82f6",
              borderRadius: 9999,
              display: "inline-block",
              flexShrink: 0,
            }} />
            <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1e293b" }}>
              Thống kê tổng quan
            </span>
            <span style={{
              fontSize: "0.72rem",
              background: "#e0f2fe",
              color: "#0369a1",
              padding: "0.15rem 0.6rem",
              borderRadius: "9999px",
              fontWeight: "600",
            }}>
              Chỉ để xem
            </span>
          </div>

          {statsLoading ? (
            <div style={{
              padding: "2.5rem",
              textAlign: "center",
              color: "#9ca3af",
              background: "white",
              borderRadius: "0.75rem",
              border: "1px solid #e5e7eb",
            }}>
              ⏳ Đang tải thống kê...
            </div>
          ) : stats ? (
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 640 }}>
                <StatsGrid stats={stats} />
              </div>
            </div>
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
        </div>

        {/* ── Section: Truy cập nhanh ───────────────────────────── */}
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}>
            <span style={{
              width: 4,
              height: 20,
              background: "#10b981",
              borderRadius: 9999,
              display: "inline-block",
              flexShrink: 0,
            }} />
            <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1e293b" }}>
              Truy cập nhanh
            </span>
            <span style={{
              fontSize: "0.72rem",
              background: "#d1fae5",
              color: "#065f46",
              padding: "0.15rem 0.6rem",
              borderRadius: "9999px",
              fontWeight: "600",
            }}>
              Nhấn để đi đến
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.875rem",
          }}>
            {/* Phương tiện */}
            <a href="/vehicles" className="action-card" style={{
              padding: "1.1rem 1.25rem",
              background: "white",
              border: "2px solid #bfdbfe",
              borderRadius: "0.875rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "0.625rem",
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
              }}>🚗</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", color: "#1e40af", fontSize: "0.95rem" }}>Phương Tiện</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.1rem" }}>
                  {stats ? `${stats.availableVehicles} sẵn sàng / ${stats.totalVehicles} tổng` : "Xem danh sách"}
                </div>
              </div>
              <span style={{ color: "#93c5fd", fontSize: "1.1rem", flexShrink: 0 }}>›</span>
            </a>

            {/* Đơn thuê */}
            <a href="/rentals" className="action-card" style={{
              padding: "1.1rem 1.25rem",
              background: "white",
              border: `2px solid ${stats && stats.pendingRentals > 0 ? "#fbbf24" : "#bbf7d0"}`,
              borderRadius: "0.875rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              position: "relative",
            }}>
              {stats && stats.pendingRentals > 0 && (
                <span style={{
                  position: "absolute",
                  top: -8,
                  right: 12,
                  background: "#f59e0b",
                  color: "white",
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "9999px",
                }}>
                  {stats.pendingRentals} chờ duyệt
                </span>
              )}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "0.625rem",
                background: stats && stats.pendingRentals > 0 ? "#fef3c7" : "#d1fae5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
              }}>📋</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", color: "#166534", fontSize: "0.95rem" }}>Đơn Thuê</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.1rem" }}>
                  Xem &amp; xử lý đơn thuê
                </div>
              </div>
              <span style={{ color: "#6ee7b7", fontSize: "1.1rem", flexShrink: 0 }}>›</span>
            </a>

            {/* QR */}
            <a href="/qr" className="action-card" style={{
              padding: "1.1rem 1.25rem",
              background: "white",
              border: "2px solid #fde68a",
              borderRadius: "0.875rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "0.625rem",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
              }}>📱</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "700", color: "#92400e", fontSize: "0.95rem" }}>Mã QR</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.1rem" }}>
                  In QR cho từng xe
                </div>
              </div>
              <span style={{ color: "#fcd34d", fontSize: "1.1rem", flexShrink: 0 }}>›</span>
            </a>

            {user.role === "ADMIN" && (
              <a href="/users" className="action-card" style={{
                padding: "1.1rem 1.25rem",
                background: "white",
                border: "2px solid #e9d5ff",
                borderRadius: "0.875rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "0.625rem",
                  background: "#f3e8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  flexShrink: 0,
                }}>👤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "700", color: "#6b21a8", fontSize: "0.95rem" }}>Tài Khoản</div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.1rem" }}>
                    Quản lý bảo vệ
                  </div>
                </div>
                <span style={{ color: "#d8b4fe", fontSize: "1.1rem", flexShrink: 0 }}>›</span>
              </a>
            )}
          </div>
        </div>

        {/* ── Quy trình ─────────────────────────────────────────── */}
        <div style={{
          padding: "1.25rem 1.5rem",
          background: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e5e7eb",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}>
            <span style={{
              width: 4,
              height: 20,
              background: "#f59e0b",
              borderRadius: 9999,
              display: "inline-block",
              flexShrink: 0,
            }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
              Quy trình mượn xe
            </h3>
          </div>
          <div style={{ display: "flex", gap: "0", flexWrap: "wrap", rowGap: "0.5rem" }}>
            {[
              { step: "1", label: "Khách quét QR", desc: "Quét mã trên xe", color: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
              { step: "2", label: "Gửi yêu cầu", desc: "Điền thông tin & CCCD", color: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
              { step: "3", label: "Bảo vệ duyệt", desc: "Duyệt đơn → bàn giao xe", color: "#fffbeb", border: "#fde68a", text: "#92400e" },
              { step: "4", label: "Trả xe", desc: "Bảo vệ hoàn tất trả xe", color: "#fdf4ff", border: "#f5d0fe", text: "#701a75" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  padding: "0.6rem 0.875rem",
                  background: item.color,
                  border: `1px solid ${item.border}`,
                  borderRadius: "0.5rem",
                  minWidth: "110px",
                }}>
                  <div style={{ fontSize: "0.65rem", color: item.text, fontWeight: "700", marginBottom: "0.1rem", opacity: 0.7 }}>
                    BƯỚC {item.step}
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: item.text }}>{item.label}</div>
                  <div style={{ fontSize: "0.72rem", color: item.text, opacity: 0.7 }}>{item.desc}</div>
                </div>
                {i < 3 && (
                  <div style={{ padding: "0 0.4rem", color: "#d1d5db", fontSize: "1.1rem", flexShrink: 0 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}