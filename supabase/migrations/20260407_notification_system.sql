-- Create tables for notification system

-- Push subscriptions table for browser notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);

-- Add notification settings to tourists table
ALTER TABLE tourists 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN DEFAULT false;

-- Add notification tracking to alerts table
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_results JSONB;

-- Create notification logs table for tracking all notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'push', 'email', 'sms'
  recipient TEXT NOT NULL, -- email, phone number, or endpoint
  status TEXT NOT NULL, -- 'sent', 'failed', 'pending'
  message TEXT,
  error_details TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notification logs
CREATE INDEX IF NOT EXISTS notification_logs_alert_id_idx ON notification_logs(alert_id);
CREATE INDEX IF NOT EXISTS notification_logs_user_id_idx ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS notification_logs_channel_idx ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS notification_logs_status_idx ON notification_logs(status);
CREATE INDEX IF NOT EXISTS notification_logs_sent_at_idx ON notification_logs(sent_at DESC);

-- Create notification preferences table for fine-grained control
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'panic', 'geo_fence', 'low_battery', 'fall_detected', 'daily_summary'
  channel TEXT NOT NULL, -- 'push', 'email', 'sms'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, alert_type, channel)
);

-- Create indexes for notification preferences
CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS notification_preferences_alert_type_idx ON notification_preferences(alert_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
