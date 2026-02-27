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