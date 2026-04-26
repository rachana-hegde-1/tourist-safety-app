import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = (searchParams.get("deviceId") ?? "").trim();

    if (!deviceId) {
      return NextResponse.json(
        { ok: false, available: false, reason: "missing_device_id" },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials for admin client.");
      return NextResponse.json(
        { ok: false, available: false, reason: "db_error", error: "Missing admin credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { data, error } = await supabase
      .from("wearables")
      .select("device_id, linked_user_id")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, available: false, reason: "db_error", error: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({
        ok: true,
        available: false,
        reason: "not_found",
      });
    }

    if (data.linked_user_id) {
      return NextResponse.json({
        ok: true,
        available: false,
        reason: "already_linked",
      });
    }

    return NextResponse.json({ ok: true, available: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
