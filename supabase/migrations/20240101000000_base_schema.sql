-- Base schema for Aegistrack tourist safety app

-- Create tourists table
CREATE TABLE IF NOT EXISTS tourists (
  clerk_user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  id_type TEXT NOT NULL CHECK (id_type IN ('Aadhaar', 'Passport')),
  id_number TEXT NOT NULL,
  destination TEXT,
  trip_start_date DATE,
  trip_end_date DATE,
  preferred_language TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  device_id TEXT,
  safety_score INTEGER DEFAULT 80 CHECK (safety_score >= 0 AND safety_score <= 100),
  photo_url TEXT,
  digital_id_hash TEXT,
  digital_id_qr TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PANIC', 'GEO_FENCE', 'LOW_BATTERY', 'FALL_DETECTED')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'RESOLVED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wearables table
CREATE TABLE IF NOT EXISTS wearables (
  device_id TEXT PRIMARY KEY,
  linked_user_id TEXT REFERENCES tourists(clerk_user_id) ON DELETE SET NULL,
  device_type TEXT NOT NULL DEFAULT 'generic',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'linked', 'offline', 'maintenance')),
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS tourists_clerk_user_id_idx ON tourists(clerk_user_id);
CREATE INDEX IF NOT EXISTS tourists_phone_number_idx ON tourists(phone_number);
CREATE INDEX IF NOT EXISTS tourists_email_idx ON tourists(email);
CREATE INDEX IF NOT EXISTS tourists_device_id_idx ON tourists(device_id);
CREATE INDEX IF NOT EXISTS tourists_created_at_idx ON tourists(created_at DESC);

CREATE INDEX IF NOT EXISTS alerts_clerk_user_id_idx ON alerts(clerk_user_id);
CREATE INDEX IF NOT EXISTS alerts_type_idx ON alerts(type);
CREATE INDEX IF NOT EXISTS alerts_status_idx ON alerts(status);
CREATE INDEX IF NOT EXISTS alerts_created_at_idx ON alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS wearables_linked_user_id_idx ON wearables(linked_user_id);
CREATE INDEX IF NOT EXISTS wearables_status_idx ON wearables(status);
CREATE INDEX IF NOT EXISTS wearables_device_type_idx ON wearables(device_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tourists_updated_at BEFORE UPDATE ON tourists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wearables_updated_at BEFORE UPDATE ON wearables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
