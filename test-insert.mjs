import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: tourists, error: error1 } = await supabase.from('tourists').select('*').limit(1);
  if (!tourists || tourists.length === 0) {
    console.log("No tourists found!");
    return;
  }
  
  const touristId = tourists[0].id;
  console.log("Found tourist:", touristId);

  const { data, error: error2 } = await supabase.from('locations').insert({
    tourist_id: touristId,
    latitude: 20.5937,
    longitude: 78.9629,
    accuracy: 10,
    source: 'app',
    created_at: new Date().toISOString()
  });
  
  console.log("Inserted location error:", error2);
}

test();
