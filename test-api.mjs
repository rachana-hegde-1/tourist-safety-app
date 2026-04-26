import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { error: e1 } = await supabase.from('locations').select('clerk_user_id').limit(1);
  console.log("clerk_user_id error:", e1);
  
  const { error: e2 } = await supabase.from('locations').select('tourist_id').limit(1);
  console.log("tourist_id error:", e2);
  
  const { error: e3 } = await supabase.from('locations').select('device_id').limit(1);
  console.log("device_id error:", e3);
}

test();
