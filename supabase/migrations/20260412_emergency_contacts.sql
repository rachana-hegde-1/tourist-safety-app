-- Create emergency_contacts table for storing tourist emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS emergency_contacts_clerk_user_id_idx ON emergency_contacts(clerk_user_id);
CREATE INDEX IF NOT EXISTS emergency_contacts_phone_number_idx ON emergency_contacts(phone_number);