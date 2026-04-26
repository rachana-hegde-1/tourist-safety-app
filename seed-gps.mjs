// Quick script to seed a GPS coordinate for AEGIS_BAND_01
// Run with: node seed-gps.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function seedGPS() {
  // Step 1: Find the tourist_id linked to AEGIS_BAND_01
  const wearableRes = await fetch(`${SUPABASE_URL}/rest/v1/wearables?device_id=eq.AEGIS_BAND_01&select=tourist_id`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  const wearables = await wearableRes.json();
  console.log('Wearable lookup:', wearables);

  if (!wearables.length || !wearables[0].tourist_id) {
    console.error('Device AEGIS_BAND_01 not found or not linked to a tourist!');
    return;
  }

  const touristId = wearables[0].tourist_id;
  console.log('Tourist ID:', touristId);

  // Step 2: Insert a test GPS coordinate (Bangalore, India)
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      tourist_id: touristId,
      latitude: 13.08879,
      longitude: 77.54498,
      source: 'phone_gps',
      timestamp: new Date().toISOString(),
    })
  });

  if (insertRes.ok) {
    console.log('✅ GPS coordinate seeded! The watch should show LAT: 13.08879, LON: 77.54498 on next poll.');
  } else {
    const err = await insertRes.text();
    console.error('❌ Failed to seed GPS:', insertRes.status, err);
  }
}

seedGPS();
