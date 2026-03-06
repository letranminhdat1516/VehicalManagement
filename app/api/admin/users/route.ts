import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, full_name, branch_id } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc (email, mật khẩu, họ tên)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Insert into app_users profile table
    const { data, error } = await supabaseAdmin
      .from("app_users")
      .insert([
        {
          id: authData.user.id,
          email,
          full_name,
          role: "GUARD",
          branch_id: branch_id || null,
        },
      ])
      .select()
      .single();

    if (error) {
      // Rollback: delete the auth user if profile insert failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
