import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: rows } = await supabase.from('emergency_contacts').select('*').limit(1);
  if (rows && rows.length > 0) {
    console.log("Emergency Contacts columns:", Object.keys(rows[0]));
  } else {
    // Let's insert a dummy row then delete it to see the columns
    const { data: insertData, error: insertError } = await supabase.from('emergency_contacts').insert({ name: 'test', clerk_user_id: 'test' }).select();
    if (insertError) {
      console.log(insertError);
    } else {
      console.log("Emergency Contacts columns:", Object.keys(insertData[0]));
      await supabase.from('emergency_contacts').delete().eq('id', insertData[0].id);
    }
  }
}
test();
