import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need postgres-level access, but via REST we can't do arbitrary queries unless there's an RPC or we use pg module.
// Let's use the node pg module to connect directly to the database.
// The connection string can be found in .env.local or we can derive it.
import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
console.log(envFile.split('\n').filter(l => l.includes('DATABASE_URL')).join('\n'));

