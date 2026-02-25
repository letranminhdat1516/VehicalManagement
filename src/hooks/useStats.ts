"use client";

import { useState, useEffect } from "react";
import { statsService } from "@/src/services/statsService";
import { DashboardStats, UserRole } from "@/src/types";

export function useStats(userRole: UserRole, branchId: string | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [userRole, branchId]);

  const loadStats = async () => {
    setLoading(true);
    const response = await statsService.getDashboardStats(userRole, branchId);
    
    if (response.error || !response.data) {
      setError(response.error);
      setStats(null);
    } else {
      setStats(response.data);
      setError(null);
    }
    
    setLoading(false);
  };

  return {
    stats,
    loading,
    error,
    refresh: loadStats,
  };
}
