import { supabase } from "@/src/lib/supabaseClient";
import { Branch, ApiResponse } from "@/src/types";

export const branchService = {
  async getBranches(): Promise<ApiResponse<Branch[]>> {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("name");

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Branch[], error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getBranchById(id: string): Promise<ApiResponse<Branch>> {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Branch, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async createBranch(branch: Partial<Branch>): Promise<ApiResponse<Branch>> {
    try {
      const { data, error } = await supabase
        .from("branches")
        .insert([branch])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Branch, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async updateBranch(id: string, updates: Partial<Branch>): Promise<ApiResponse<Branch>> {
    try {
      const { data, error } = await supabase
        .from("branches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Branch, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async deleteBranch(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from("branches")
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
};
