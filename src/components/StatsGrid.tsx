import { DashboardStats } from "@/src/types";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  subtitle?: string;
}

function StatsCard({ title, value, icon, bgColor, textColor, borderColor, subtitle }: StatsCardProps) {
  return (
    <div style={{
      padding: "1.25rem 1.5rem",
      borderRadius: "0.75rem",
      background: bgColor,
      border: `1px solid ${borderColor}`,
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    }}>
      <div style={{
        fontSize: "2rem",
        width: "3rem",
        height: "3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.8rem", color: textColor, opacity: 0.75, fontWeight: 500 }}>
          {title}
        </div>
        <div style={{ fontSize: "1.75rem", fontWeight: "700", color: textColor, lineHeight: 1.2 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: "0.75rem", color: textColor, opacity: 0.6, marginTop: "0.1rem" }}>
            {subtitle}
          </div>
        )}
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
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem",
    }}>
      <StatsCard
        title="Tổng Phương Tiện"
        value={stats.totalVehicles}
        icon="🚗"
        bgColor="#eff6ff"
        textColor="#1e40af"
        borderColor="#bfdbfe"
      />
      <StatsCard
        title="Sẵn Sàng"
        value={stats.availableVehicles}
        icon="✅"
        bgColor="#f0fdf4"
        textColor="#166534"
        borderColor="#bbf7d0"
        subtitle={`${stats.totalVehicles > 0 ? Math.round(stats.availableVehicles / stats.totalVehicles * 100) : 0}% tổng số`}
      />
      <StatsCard
        title="Đang Mượn"
        value={stats.borrowingVehicles}
        icon="🔄"
        bgColor="#fffbeb"
        textColor="#92400e"
        borderColor="#fde68a"
      />
      <StatsCard
        title="Bảo Trì"
        value={stats.maintenanceVehicles}
        icon="🔧"
        bgColor="#fef2f2"
        textColor="#991b1b"
        borderColor="#fecaca"
      />
      <StatsCard
        title="Chờ Xác Nhận"
        value={stats.pendingRentals}
        icon="⏳"
        bgColor="#faf5ff"
        textColor="#6b21a8"
        borderColor="#e9d5ff"
        subtitle="cần xử lý"
      />
      <StatsCard
        title="Đơn Thuê Hôm Nay"
        value={stats.rentalsToday}
        icon="📋"
        bgColor="#f0f9ff"
        textColor="#0c4a6e"
        borderColor="#bae6fd"
      />
      <StatsCard
        title="Đơn Thuê Tháng Này"
        value={stats.rentalsThisMonth}
        icon="📅"
        bgColor="#fdf4ff"
        textColor="#701a75"
        borderColor="#f5d0fe"
      />
    </div>
  );
}
