import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: tourists } = await supabase.from('tourists').select('*').limit(1);
  const touristId = tourists[0].id;
  
  const { error } = await supabase.from('alerts').insert({
    tourist_id: touristId,
    type: 'panic',
    status: 'OPEN',
    latitude: 10,
    longitude: 20,
    created_at: new Date().toISOString()
  });
  console.log("Error inserting with tourist_id:", error);
}

test();
