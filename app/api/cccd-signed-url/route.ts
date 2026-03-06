import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export const runtime = "nodejs";

// Extract storage path from full Supabase URL
// e.g. https://xxx.supabase.co/storage/v1/object/public/citizen-ids/cccd/public/file.jpg
// → cccd/public/file.jpg
function extractPath(urlOrPath: string): string {
  try {
    const marker = "/citizen-ids/";
    const idx = urlOrPath.indexOf(marker);
    if (idx !== -1) return urlOrPath.slice(idx + marker.length);
  } catch {}
  return urlOrPath;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("path");

    if (!raw) {
      return NextResponse.json({ error: "Thiếu path" }, { status: 400 });
    }

    const filePath = extractPath(decodeURIComponent(raw));

    const { data, error } = await supabaseAdmin.storage
      .from("citizen-ids")
      .createSignedUrl(filePath, 60 * 30); // 30 phút

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || "Không thể tạo signed URL" }, { status: 400 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
