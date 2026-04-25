import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { error: touristError } = await supabase
    .from("tourists")
    .select("phone_number")
    .limit(1);
    
  console.log("Tourist phone_number error:", touristError?.message || 'Success');

  const { error: touristPhoneError } = await supabase
    .from("tourists")
    .select("phone")
    .limit(1);
    
  console.log("Tourist phone error:", touristPhoneError?.message || 'Success');

  const { error: contactsError } = await supabase
    .from("emergency_contacts")
    .select("phone_number")
    .limit(1);
    
  console.log("Contacts phone_number error:", contactsError?.message || 'Success');

  const { error: contactsPhoneError } = await supabase
    .from("emergency_contacts")
    .select("phone")
    .limit(1);
    
  console.log("Contacts phone error:", contactsPhoneError?.message || 'Success');
}

test();
