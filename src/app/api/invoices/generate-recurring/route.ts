import { NextRequest, NextResponse } from "next/server";
import { generateRecurringInvoices } from "@/lib/actions/invoices";

// 此 route 用於 cron job 或手動觸發定期發票生成
// 需要提供 CRON_SECRET header 作為驗證
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateRecurringInvoices();

  return NextResponse.json({
    success: true,
    generated: result.generated,
    errors: result.errors,
  });
}
