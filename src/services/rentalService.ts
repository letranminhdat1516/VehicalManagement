import { supabase } from "@/src/lib/supabaseClient";
import { Rental, ApiResponse, UserRole } from "@/src/types";
import { vehicleService } from "./vehicleService";

export const rentalService = {
  async getRentals(
    userRole: UserRole,
    branchId: string | null
  ): Promise<ApiResponse<Rental[]>> {
    try {
      let query = supabase.from("rentals").select("*").order("created_at", { ascending: false });

      // Role-based filtering
      if (userRole !== "ADMIN" && branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Rental[], error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getRentalById(id: string): Promise<ApiResponse<Rental>> {
    try {
      const { data, error } = await supabase
        .from("rentals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Rental, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async createRental(rental: Partial<Rental>): Promise<ApiResponse<Rental>> {
    try {
      // Check if vehicle is available
      if (rental.vehicle_id) {
        const vehicleResponse = await vehicleService.getVehicleById(rental.vehicle_id);
        
        if (vehicleResponse.error || !vehicleResponse.data) {
          return { data: null, error: "Vehicle not found" };
        }

        if (vehicleResponse.data.status !== "AVAILABLE") {
          return { data: null, error: "Vehicle is not available" };
        }

        // Create rental
        const { data, error } = await supabase
          .from("rentals")
          .insert([rental])
          .select()
          .single();

        if (error) {
          return { data: null, error: error.message };
        }

        // Update vehicle status to RENTED
        await vehicleService.updateVehicleStatus(rental.vehicle_id, "RENTED");

        return { data: data as Rental, error: null };
      }

      return { data: null, error: "Vehicle ID is required" };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async completeRental(
    id: string,
    totalAmount: number
  ): Promise<ApiResponse<Rental>> {
    try {
      // Get rental details
      const rentalResponse = await this.getRentalById(id);
      
      if (rentalResponse.error || !rentalResponse.data) {
        return { data: null, error: "Rental not found" };
      }

      const rental = rentalResponse.data;

      const completedAt = new Date().toISOString();
      const payloads = [
        { status: "COMPLETED", end_date: completedAt, total_amount: totalAmount },
        { status: "COMPLETED", returned_at: completedAt, total_amount: totalAmount },
        { status: "COMPLETED", completed_at: completedAt, total_amount: totalAmount },
        { status: "COMPLETED" },
      ];

      let data: Rental | null = null;
      let error: { message: string } | null = null;

      for (const payload of payloads) {
        const result = await supabase
          .from("rentals")
          .update(payload)
          .eq("id", id)
          .select()
          .single();

        if (!result.error) {
          data = result.data as Rental;
          error = null;
          break;
        }

        error = result.error;
      }

      if (error || !data) {
        return { data: null, error: error?.message || "Update failed" };
      }

      // Update vehicle status to AVAILABLE
      await vehicleService.updateVehicleStatus(rental.vehicle_id, "AVAILABLE");

      return { data: data as Rental, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async cancelRental(id: string): Promise<ApiResponse<Rental>> {
    try {
      const rentalResponse = await this.getRentalById(id);
      
      if (rentalResponse.error || !rentalResponse.data) {
        return { data: null, error: "Rental not found" };
      }

      const rental = rentalResponse.data;

      const { data, error } = await supabase
        .from("rentals")
        .update({ status: "CANCELLED" })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Update vehicle status to AVAILABLE
      await vehicleService.updateVehicleStatus(rental.vehicle_id, "AVAILABLE");

      return { data: data as Rental, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};
