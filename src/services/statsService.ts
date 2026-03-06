import { supabase } from "@/src/lib/supabaseClient";
import { DashboardStats, ApiResponse, UserRole } from "@/src/types";

export const statsService = {
  async getDashboardStats(
    userRole: UserRole,
    branchId: string | null
  ): Promise<ApiResponse<DashboardStats>> {
    try {
      // Build vehicle query
      let vehicleQuery = supabase.from("vehicles").select("id, status");
      if (userRole !== "ADMIN" && branchId) {
        vehicleQuery = vehicleQuery.eq("branch_id", branchId);
      }

      // Build rental query
      let rentalQuery = supabase.from("rentals").select("id, created_at, status");
      if (userRole !== "ADMIN" && branchId) {
        rentalQuery = rentalQuery.eq("branch_id", branchId);
      }

      const [vehiclesResponse, rentalsResponse] = await Promise.all([
        vehicleQuery,
        rentalQuery,
      ]);

      if (vehiclesResponse.error) {
        return { data: null, error: vehiclesResponse.error.message };
      }

      if (rentalsResponse.error) {
        return { data: null, error: rentalsResponse.error.message };
      }

      const vehicles = vehiclesResponse.data || [];
      const rentals = rentalsResponse.data || [];

      // Calculate stats
      const totalVehicles = vehicles.length;
      const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE").length;
      const borrowingVehicles = vehicles.filter((v) => v.status === "BORROWING").length;
      const maintenanceVehicles = vehicles.filter((v) => v.status === "MAINTENANCE").length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const pendingRentals = rentals.filter((r) => r.status === "PENDING").length;

      const rentalsToday = rentals.filter((r) => {
        const createdAt = new Date(r.created_at);
        return createdAt >= today;
      }).length;

      const rentalsThisMonth = rentals.filter((r) => {
        const createdAt = new Date(r.created_at);
        return createdAt >= startOfMonth;
      }).length;

      const stats: DashboardStats = {
        totalVehicles,
        availableVehicles,
        borrowingVehicles,
        maintenanceVehicles,
        pendingRentals,
        rentalsToday,
        rentalsThisMonth,
      };

      return { data: stats, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};
