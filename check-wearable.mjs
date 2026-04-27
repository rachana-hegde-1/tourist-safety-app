import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Check if AEGIS_BAND_01 exists in wearables
  const { data: wearable, error: wErr } = await supabase
    .from("wearables")
    .select("*")
    .eq("device_id", "AEGIS_BAND_01")
    .maybeSingle();

  console.log("=== Wearable lookup ===");
  console.log("Data:", JSON.stringify(wearable, null, 2));
  console.log("Error:", wErr);

  if (wearable?.tourist_id) {
    // Check if there are locations for this tourist
    const { data: loc, error: lErr } = await supabase
      .from("locations")
      .select("latitude, longitude, timestamp")
      .eq("tourist_id", wearable.tourist_id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("\n=== Latest location ===");
    console.log("Data:", JSON.stringify(loc, null, 2));
    console.log("Error:", lErr);
  } else {
    console.log("\n⚠ Device not linked to any tourist — the API will return 404");
  }

  // List all wearables for reference
  const { data: allWearables } = await supabase
    .from("wearables")
    .select("device_id, tourist_id, is_connected");
  console.log("\n=== All wearables ===");
  console.log(JSON.stringify(allWearables, null, 2));
}

check();
