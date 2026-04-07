import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

function makeToken() {
  // 32 chars URL-safe.
  return crypto.randomBytes(24).toString("base64url").slice(0, 32);
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const token = makeToken();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("tracking_links").insert({
    tourist_id: userId,
    token,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    active: true,
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    token,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });
}

