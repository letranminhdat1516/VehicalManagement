import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ Xác Nhận",
  BORROWING: "Đang Mượn",
  RETURNED: "Đã Trả",
  CANCELLED: "Đã Hủy",
};

const fmt = (val: string | null | undefined) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to");     // YYYY-MM-DD

    let query = supabaseAdmin
      .from("rentals")
      .select("*, vehicles(code, type)")
      .order("borrow_time", { ascending: false });

    if (from) {
      query = query.gte("borrow_time", `${from}T00:00:00`);
    }
    if (to) {
      query = query.lte("borrow_time", `${to}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = (data || []).map((r: any, i: number) => ({
      "STT": i + 1,
      "Mã Xe": r.vehicles?.code ?? r.vehicle_id,
      "Loại Xe": r.vehicles?.type ?? "",
      "Khách Hàng": r.customer_name ?? "",
      "Số Điện Thoại": r.phone ?? "",
      "CCCD (4 số cuối)": r.citizen_id_last4 ?? "",
      "Trạng Thái": STATUS_LABEL[r.status] ?? r.status,
      "Thời Gian Mượn": fmt(r.borrow_time),
      "Thời Gian Duyệt": fmt(r.approved_at),
      "Thời Gian Trả": fmt(r.return_time),
      "Ghi Chú": r.note ?? "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 5 },  // STT
      { wch: 12 }, // Mã Xe
      { wch: 14 }, // Loại Xe
      { wch: 22 }, // Khách Hàng
      { wch: 15 }, // SĐT
      { wch: 16 }, // CCCD
      { wch: 16 }, // Trạng Thái
      { wch: 20 }, // Mượn
      { wch: 20 }, // Duyệt
      { wch: 20 }, // Trả
      { wch: 24 }, // Ghi Chú
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Đơn Thuê");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const dateRange = from && to ? `_${from}_den_${to}` : from ? `_tu_${from}` : to ? `_den_${to}` : "";
    const fileName = `don_thue${dateRange}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
