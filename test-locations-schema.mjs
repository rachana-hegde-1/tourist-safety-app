import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.rpc('get_locations_schema_info');
  // Wait, Supabase RPC might not exist. 
  // Let's just do a raw SQL query if possible, or query information_schema using postgrest directly if exposed.
  // Actually, we can just insert a fake record and see the specific error.
  
  const { error: insertError } = await supabase.from('locations').insert({
    latitude: 10,
    longitude: 20
  });
  console.log("Insert without tourist_id error:", insertError);

  // Now try inserting with a fake tourist_id (uuid)
  const { error: insertError2 } = await supabase.from('locations').insert({
    tourist_id: '123e4567-e89b-12d3-a456-426614174000',
    latitude: 10,
    longitude: 20
  });
  console.log("Insert with fake tourist_id error:", insertError2);
}

test();
