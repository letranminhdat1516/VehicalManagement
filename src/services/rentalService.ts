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
      if (!rental.vehicle_id) {
        return { data: null, error: "Vehicle ID is required" };
      }

      const vehicleResponse = await vehicleService.getVehicleById(rental.vehicle_id);
      if (vehicleResponse.error || !vehicleResponse.data) {
        return { data: null, error: "Vehicle not found" };
      }
      if (vehicleResponse.data.status !== "AVAILABLE") {
        return { data: null, error: "Vehicle is not available" };
      }

      const { data, error } = await supabase
        .from("rentals")
        .insert([rental])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Vehicle stays AVAILABLE until guard approves
      return { data: data as Rental, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async approveRental(id: string): Promise<ApiResponse<Rental>> {
    try {
      const rentalResponse = await this.getRentalById(id);
      if (rentalResponse.error || !rentalResponse.data) {
        return { data: null, error: "Rental not found" };
      }

      const rental = rentalResponse.data;
      if (rental.status !== "PENDING") {
        return { data: null, error: "Chỉ có thể xác nhận đơn ở trạng thái chờ" };
      }

      // Check vehicle still available
      const vehicleResponse = await vehicleService.getVehicleById(rental.vehicle_id);
      if (vehicleResponse.data?.status !== "AVAILABLE") {
        return { data: null, error: "Xe đã được mượn bởi người khác" };
      }

      const { data, error } = await supabase
        .from("rentals")
        .update({ status: "BORROWING", approved_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Lock the vehicle
      await vehicleService.updateVehicleStatus(rental.vehicle_id, "BORROWING");

      return { data: data as Rental, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async completeRental(
    id: string,
    totalAmount: number
  ): Promise<ApiResponse<Rental>> {
    try {
      const rentalResponse = await this.getRentalById(id);
      if (rentalResponse.error || !rentalResponse.data) {
        return { data: null, error: "Rental not found" };
      }

      const rental = rentalResponse.data;
      if (rental.status !== "BORROWING") {
        return { data: null, error: "Chỉ có thể trả xe đang ở trạng thái đang mượn" };
      }

      const returnedAt = new Date().toISOString();

      const { data, error } = await supabase
        .from("rentals")
        .update({ status: "RETURNED", return_time: returnedAt })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

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

      // Only release vehicle if it was actively borrowed (not pending)
      if (rental.status === "BORROWING") {
        await vehicleService.updateVehicleStatus(rental.vehicle_id, "AVAILABLE");
      }

      return { data: data as Rental, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};
