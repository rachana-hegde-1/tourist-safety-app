import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { error } = await supabase.from('alerts').insert({
    clerk_user_id: 'fake_clerk_id',
    type: 'panic',
    status: 'OPEN',
    latitude: 10,
    longitude: 20,
    created_at: new Date().toISOString()
  });
  console.log("Error inserting with fake clerk_id:", error);
}

test();
