import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: tourists } = await supabase.from("tourists").select("id, clerk_user_id").limit(1);
  console.log("Tourists:", tourists);

  const { data: wearables } = await supabase.from("wearables").select("device_id, tourist_id").limit(1);
  console.log("Wearables:", wearables);
}
main();
