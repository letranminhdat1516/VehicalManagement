import { supabase } from "@/src/lib/supabaseClient";
import { Vehicle, ApiResponse, UserRole } from "@/src/types";

export const vehicleService = {
  async getVehicles(
    userRole: UserRole,
    branchId: string | null
  ): Promise<ApiResponse<Vehicle[]>> {
    try {
      let query = supabase.from("vehicles").select("*").order("created_at", { ascending: false });

      // Role-based filtering
      if (userRole !== "ADMIN" && branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Vehicle[], error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Vehicle, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async createVehicle(vehicle: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .insert([vehicle])
        .select();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: (data && data[0]) as Vehicle, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: (data && data[0]) as Vehicle, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async deleteVehicle(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async updateVehicleStatus(
    id: string,
    status: Vehicle["status"]
  ): Promise<ApiResponse<Vehicle>> {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .update({ status })
        .eq("id", id)
        .select();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: (data && data[0]) as Vehicle, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};
