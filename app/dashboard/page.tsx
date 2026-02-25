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
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
          Dashboard
        </h1>

        {statsLoading ? (
          <div>Loading stats...</div>
        ) : stats ? (
          <StatsGrid stats={stats} />
        ) : (
          <div>No stats available</div>
        )}

        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "white",
          borderRadius: "0.5rem",
          border: "1px solid #e5e7eb",
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>
            Welcome, {user.full_name}!
          </h2>
          <p style={{ color: "#6b7280" }}>
            Role: <strong>{user.role}</strong>
          </p>
          {user.branch_id && (
            <p style={{ color: "#6b7280" }}>
              Branch ID: <strong>{user.branch_id}</strong>
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}