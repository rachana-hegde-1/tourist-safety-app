-- Create SMS logs table for tracking simulated SMS notifications

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  tourist_id TEXT NOT NULL REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for SMS logs
CREATE INDEX IF NOT EXISTS sms_logs_alert_id_idx ON sms_logs(alert_id);
CREATE INDEX IF NOT EXISTS sms_logs_tourist_id_idx ON sms_logs(tourist_id);
CREATE INDEX IF NOT EXISTS sms_logs_sent_at_idx ON sms_logs(sent_at);