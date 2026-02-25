import { supabase } from "@/src/lib/supabaseClient";
import { AppUser, ApiResponse } from "@/src/types";

export const authService = {
  async signIn(email: string, password: string): Promise<ApiResponse<AppUser>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { data: null, error: authError.message };
      }

      if (!authData.user) {
        return { data: null, error: "No user returned" };
      }

      const { data: profile, error: profileError } = await supabase
        .from("app_users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        return { data: null, error: profileError.message };
      }

      return { data: profile as AppUser, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { data: null, error: error.message };
      }
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getCurrentUser(): Promise<ApiResponse<AppUser>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { data: null, error: "Not authenticated" };
      }

      const { data: profile, error: profileError } = await supabase
        .from("app_users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        return { data: null, error: profileError.message };
      }

      return { data: profile as AppUser, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    return { data, error };
  },
};
