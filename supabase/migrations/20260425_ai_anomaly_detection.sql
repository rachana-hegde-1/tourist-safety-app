-- AI Anomaly Detection System Schema

-- Anomaly patterns and rules
CREATE TABLE IF NOT EXISTS anomaly_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('location', 'behavioral', 'safety_score', 'communication', 'wearable', 'geo_fence')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  threshold_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anomaly detections and alerts
CREATE TABLE IF NOT EXISTS anomaly_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES anomaly_patterns(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('location', 'behavioral', 'safety_score', 'communication', 'wearable', 'geo_fence')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  anomaly_data JSONB NOT NULL DEFAULT '{}',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tourist behavioral baselines
CREATE TABLE IF NOT EXISTS tourist_baselines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  baseline_type TEXT NOT NULL CHECK (baseline_type IN ('location_patterns', 'activity_hours', 'communication_frequency', 'safety_zones')),
  baseline_data JSONB NOT NULL DEFAULT '{}',
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clerk_user_id, baseline_type)
);

-- Anomaly feedback for ML model improvement
CREATE TABLE IF NOT EXISTS anomaly_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anomaly_id UUID NOT NULL REFERENCES anomaly_detections(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('true_positive', 'false_positive', 'true_negative', 'false_negative')),
  feedback_data JSONB DEFAULT '{}',
  provided_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anomaly detection logs
CREATE TABLE IF NOT EXISTS anomaly_detection_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES tourists(clerk_user_id) ON DELETE CASCADE,
  detection_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  processing_time_ms INTEGER,
  result JSONB NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS anomaly_detections_clerk_user_id_idx ON anomaly_detections(clerk_user_id);
CREATE INDEX IF NOT EXISTS anomaly_detections_type_idx ON anomaly_detections(type);
CREATE INDEX IF NOT EXISTS anomaly_detections_severity_idx ON anomaly_detections(severity);
CREATE INDEX IF NOT EXISTS anomaly_detections_status_idx ON anomaly_detections(status);
CREATE INDEX IF NOT EXISTS anomaly_detections_created_at_idx ON anomaly_detections(created_at DESC);

CREATE INDEX IF NOT EXISTS tourist_baselines_clerk_user_id_idx ON tourist_baselines(clerk_user_id);
CREATE INDEX IF NOT EXISTS tourist_baselines_type_idx ON tourist_baselines(baseline_type);

CREATE INDEX IF NOT EXISTS anomaly_feedback_anomaly_id_idx ON anomaly_feedback(anomaly_id);
CREATE INDEX IF NOT EXISTS anomaly_detection_logs_clerk_user_id_idx ON anomaly_detection_logs(clerk_user_id);
CREATE INDEX IF NOT EXISTS anomaly_detection_logs_created_at_idx ON anomaly_detection_logs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_anomaly_patterns_updated_at BEFORE UPDATE ON anomaly_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anomaly_detections_updated_at BEFORE UPDATE ON anomaly_detections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default anomaly patterns
INSERT INTO anomaly_patterns (name, description, type, severity, threshold_config) VALUES
('Unusual Location Pattern', 'Tourist in unexpected or restricted area', 'location', 'high', '{"min_confidence": 0.7, "restricted_zones": ["military", "industrial", "border"]}'),
('Extended Inactivity', 'No location updates for extended period', 'communication', 'medium', '{"max_inactive_hours": 6, "min_confidence": 0.6}'),
('Safety Score Drop', 'Sudden significant drop in safety score', 'safety_score', 'high', '{"min_drop_percentage": 30, "min_confidence": 0.8}'),
('Geo Fence Breach', 'Tourist outside designated safe zone', 'geo_fence', 'critical', '{"min_confidence": 0.9}'),
('Wearable Disconnection', 'Wearable device offline for extended period', 'wearable', 'medium', '{"max_offline_minutes": 30, "min_confidence": 0.7}'),
('Unusual Movement Speed', 'Movement speed exceeds normal walking/transport patterns', 'behavioral', 'low', '{"max_speed_kmh": 15, "min_confidence": 0.6}')
ON CONFLICT DO NOTHING;
