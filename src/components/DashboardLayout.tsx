"use client";

import { ReactNode } from "react";
import Navbar from "./Navbar";
import { useAuth } from "@/src/hooks/useAuth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "1.25rem",
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <Navbar />
      <main className="main-content" style={{ padding: "2rem" }}>
        {children}
      </main>
    </div>
  );
}
