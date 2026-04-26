import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('locations').insert({
    tourist_id: '123e4567-e89b-12d3-a456-426614174000',
    latitude: 10,
    longitude: 20
  });
  console.log("Error:", error);
}

test();
