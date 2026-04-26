import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data } = await supabase.from('alerts').select('*').limit(1);
  console.log("Alert schema columns:", data ? Object.keys(data[0] || {}) : "No alerts");
}

test();
