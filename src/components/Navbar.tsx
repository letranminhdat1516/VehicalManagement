"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "GUARD"] },
    { href: "/vehicles", label: "Vehicles", roles: ["ADMIN", "GUARD"] },
    { href: "/rentals", label: "Rentals", roles: ["ADMIN", "GUARD"] },
    { href: "/branches", label: "Branches", roles: ["ADMIN"] },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <nav style={{
      padding: "1rem 2rem",
      background: "#1e293b",
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold" }}>
          Vehicle Rental
        </h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.25rem",
                textDecoration: "none",
                color: pathname === item.href ? "#60a5fa" : "white",
                background: pathname === item.href ? "#1e40af" : "transparent",
                fontWeight: pathname === item.href ? "600" : "normal",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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
          Logout
        </button>
      </div>
    </nav>
  );
}
