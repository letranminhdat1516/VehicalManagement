"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Tổng Quan", roles: ["ADMIN", "GUARD"] },
    { href: "/vehicles", label: "Phương Tiện", roles: ["ADMIN", "GUARD"] },
    { href: "/rentals", label: "Đơn Thuê", roles: ["ADMIN", "GUARD"] },
    { href: "/users", label: "Tài Khoản", roles: ["ADMIN"] },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <nav style={{ background: "#1e293b", color: "white" }}>
      {/* Main bar */}
      <div style={{
        padding: "1rem 1.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        {/* Left: Logo + desktop nav links */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
            🚗 Quản Lý Thuê Xe
          </h2>
          {/* Desktop nav */}
          <div className="nav-desktop" style={{ display: "flex", gap: "0.5rem" }}>
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "0.5rem 0.875rem",
                  borderRadius: "0.25rem",
                  textDecoration: "none",
                  color: pathname === item.href ? "#60a5fa" : "white",
                  background: pathname === item.href ? "#1e40af" : "transparent",
                  fontWeight: pathname === item.href ? "600" : "normal",
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: User info + logout (desktop) */}
        <div className="nav-right-desktop" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: "500" }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
              {user.role}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              background: "#dc2626",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            Đăng Xuất
          </button>
        </div>

        {/* Hamburger button (mobile only) */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            padding: "0.4rem",
            fontSize: "1.5rem",
            lineHeight: 1,
          }}
          aria-label="Mở menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown menu - chỉ render khi mobileOpen = true */}
      {mobileOpen && (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "0.75rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}>
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
              color: pathname === item.href ? "#60a5fa" : "white",
              background: pathname === item.href ? "#1e40af" : "transparent",
              fontWeight: pathname === item.href ? "600" : "normal",
              fontSize: "0.95rem",
            }}
          >
            {item.label}
          </Link>
        ))}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
          <div style={{ fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem", opacity: 0.8 }}>
            {user.full_name} <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>({user.role})</span>
          </div>
          <button
            onClick={() => { handleSignOut(); setMobileOpen(false); }}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "0.25rem",
              background: "#dc2626",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              width: "100%",
            }}
          >
            Đăng Xuất
          </button>
        </div>
        </div>
      )}
    </nav>
  );
}
