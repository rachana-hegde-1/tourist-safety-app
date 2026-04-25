import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: cols } = await supabase.rpc('get_columns', { table_name: 'tourists' });
  // Wait, RPC might not exist. Let's just fetch one row and log the keys.
  const { data: rows } = await supabase.from('tourists').select('*').limit(1);
  if (rows && rows.length > 0) {
    console.log("Tourists columns:", Object.keys(rows[0]));
  } else {
    // let's insert a dummy row or fetch from information_schema via a trick
    // the only way to get columns with empty table in supabase js without rpc is trying columns and catching errors
    // but we know phone and phone_number both succeeded.
  }
}
test();
