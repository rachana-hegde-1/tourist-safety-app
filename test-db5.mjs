import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
  const json = await res.json();
  const table = json.definitions?.emergency_contacts;
  if (table) {
    console.log(Object.keys(table.properties));
  } else {
    console.log("Not found in definitions. Keys in definitions:", Object.keys(json.definitions || {}).filter(k => k.includes('contact')));
  }
}

test();
