import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, contentType } = body || {};

    if (!fileName) {
      return NextResponse.json({ error: "Thiếu tên file" }, { status: 400 });
    }

    const filePath = `cccd/public/${Date.now()}-${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from("citizen-ids")
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Không thể tạo link upload" }, { status: 400 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from("citizen-ids")
      .getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      publicUrl: publicData.publicUrl,
      contentType,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
