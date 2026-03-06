import { DashboardStats } from "@/src/types";

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const pct = stats.totalVehicles > 0
    ? Math.round(stats.availableVehicles / stats.totalVehicles * 100)
    : 0;

  const cells = [
    { label: "Tổng xe",       value: stats.totalVehicles,      icon: "🚗", color: "#2563eb", bg: "#eff6ff" },
    { label: "Sẵn sàng",      value: stats.availableVehicles,  icon: "✅", color: "#059669", bg: "#ecfdf5", sub: `${pct}% tổng số` },
    { label: "Đang mượn",     value: stats.borrowingVehicles,  icon: "🔄", color: "#d97706", bg: "#fffbeb" },
    { label: "Bảo trì",       value: stats.maintenanceVehicles,icon: "🔧", color: "#dc2626", bg: "#fef2f2" },
    { label: "Chờ duyệt",     value: stats.pendingRentals,     icon: "⏳", color: "#7c3aed", bg: "#f5f3ff", alert: stats.pendingRentals > 0 },
    { label: "Hôm nay",       value: stats.rentalsToday,       icon: "📋", color: "#0284c7", bg: "#f0f9ff" },
    { label: "Tháng này",     value: stats.rentalsThisMonth,   icon: "📅", color: "#9333ea", bg: "#faf5ff" },
  ];

  return (
    <div style={{
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "0.75rem",
      overflow: "hidden",
      marginBottom: "0.5rem",
    }}>
      {/* Header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        borderBottom: "2px solid #e2e8f0",
        background: "#f8fafc",
      }}>
        {cells.map((c, i) => (
          <div key={i} style={{
            padding: "0.55rem 0.75rem",
            borderRight: i < cells.length - 1 ? "1px solid #e2e8f0" : "none",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: c.color,
              flexShrink: 0,
              display: "inline-block",
            }} />
            <span style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Value row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
      }}>
        {cells.map((c, i) => (
          <div key={i} style={{
            padding: "1rem 0.75rem 0.875rem",
            borderRight: i < cells.length - 1 ? "1px solid #f1f5f9" : "none",
            background: c.alert ? "#fdf4ff" : "white",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            outline: c.alert ? "2px solid #7c3aed" : "none",
            outlineOffset: -1,
            position: "relative",
          }}>
            <div style={{
              fontSize: "2rem",
              fontWeight: "800",
              color: c.alert ? c.color : "#0f172a",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}>
              {c.value}
            </div>
            {c.sub && (
              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{c.sub}</div>
            )}
            {c.alert && (
              <div style={{ fontSize: "0.65rem", color: c.color, fontWeight: 700 }}>⚠ cần xử lý</div>
            )}
            <span style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: "1rem",
              opacity: 0.35,
            }}>{c.icon}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
