import { DashboardStats } from "@/src/types";

interface StatsCardProps {
  title: string;
  value: number | string;
  color?: string;
}

function StatsCard({ title, value, color = "#3b82f6" }: StatsCardProps) {
  return (
    <div style={{
      padding: "1.5rem",
      borderRadius: "0.5rem",
      background: "white",
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}>
      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
        {title}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: "bold", color }}>
        {value}
      </div>
    </div>
  );
}

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem",
    }}>
      <StatsCard
        title="Tổng Phương Tiện"
        value={stats.totalVehicles}
        color="#3b82f6"
      />
      <StatsCard
        title="Sẵn Sàng"
        value={stats.availableVehicles}
        color="#10b981"
      />
      <StatsCard
        title="Đang Thuê"
        value={stats.rentedVehicles}
        color="#f59e0b"
      />
      <StatsCard
        title="Bảo Trì"
        value={stats.maintenanceVehicles}
        color="#ef4444"
      />
      <StatsCard
        title="Đơn Thuê Hôm Nay"
        value={stats.rentalsToday}
        color="#8b5cf6"
      />
      <StatsCard
        title="Đơn Thuê Tháng Này"
        value={stats.rentalsThisMonth}
        color="#ec4899"
      />
      <StatsCard
        title="Tổng Doanh Thu"
        value={`${stats.totalRevenue.toLocaleString()} VNĐ`}
        color="#059669"
      />
    </div>
  );
}
