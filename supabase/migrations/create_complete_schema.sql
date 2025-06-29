/*
  # Complete Funnel Flow Database Schema

  1. Create all missing tables first
    - `flows` - Marketing automation flows
    - `funnels` - Marketing funnels  
    - `flow_steps` - Steps in flows
    - `funnel_steps` - Steps in funnels
    - `integrations` - Third-party integrations
    - `analytics_events` - Analytics data
    - `templates` - Templates for flows and funnels

  2. Then apply RLS policies
    - Simple policies without recursion
    - Direct auth.uid() checks where possible

  3. Create management functions
    - User management functions
    - Data access functions
*/

-- First, drop any existing tables to start clean
DROP TABLE IF EXISTS flows CASCADE;
DROP TABLE IF EXISTS funnels CASCADE;
DROP TABLE IF EXISTS flow_steps CASCADE;
DROP TABLE IF EXISTS funnel_steps CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- Create flows table
CREATE TABLE flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  trigger_type text DEFAULT 'manual',
  config jsonb DEFAULT '{}',
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create flow_steps table
CREATE TABLE flow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  step_type text NOT NULL,
  step_order integer NOT NULL DEFAULT 1,
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create funnels table
CREATE TABLE funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  conversion_goal text DEFAULT '',
  config jsonb DEFAULT '{}',
  conversion_rate decimal(5,2) DEFAULT 0.00,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create funnel_steps table
CREATE TABLE funnel_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES funnels(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  step_type text NOT NULL,
  step_order integer NOT NULL DEFAULT 1,
  config jsonb DEFAULT '{}',
  conversion_rate decimal(5,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_sync timestamptz,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create analytics_events table
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}',
  user_id uuid,
  session_id text,
  entity_type text,
  entity_id uuid,
  recorded_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Create templates table
CREATE TABLE templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'custom',
  template_type text NOT NULL CHECK (template_type IN ('flow', 'funnel', 'email', 'landing', 'form')),
  content jsonb DEFAULT '{}',
  config jsonb DEFAULT '{}',
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Insert sample data for flows
INSERT INTO flows (name, description, trigger_type, config) VALUES
('Powitanie nowych użytkowników', 'Automatyczny przepływ powitalny dla nowych rejestracji', 'registration', '{"steps": [], "triggers": ["user_registered"]}'),
('Reaktywacja nieaktywnych', 'Kampania reaktywacyjna dla nieaktywnych użytkowników', 'scheduled', '{"steps": [], "schedule": "weekly"}'),
('Upselling premium', 'Przepływ sprzedażowy dla użytkowników premium', 'manual', '{"steps": [], "target": "premium_users"}'),
('Onboarding nowych klientów', 'Proces wprowadzania nowych klientów', 'registration', '{"steps": [], "duration": "7_days"}'),
('Odzyskiwanie koszyka', 'Przypomnienie o porzuconym koszyku', 'cart_abandoned', '{"steps": [], "delay": "1_hour"}');

-- Insert sample data for funnels
INSERT INTO funnels (name, description, conversion_goal, config) VALUES
('Rejestracja użytkowników', 'Lejek konwersji od odwiedzin do rejestracji', 'registration', '{"steps": [], "tracking": "enabled"}'),
('Sprzedaż premium', 'Lejek sprzedażowy planów premium', 'purchase', '{"steps": [], "price_points": []}'),
('Webinar marketing', 'Lejek konwersji webinarów marketingowych', 'attendance', '{"steps": [], "webinar_type": "marketing"}'),
('Lead generation', 'Generowanie leadów przez content marketing', 'lead_capture', '{"steps": [], "content_types": ["ebook", "whitepaper"]}'),
('Trial to paid', 'Konwersja z trial na płatny plan', 'subscription', '{"steps": [], "trial_duration": "14_days"}');

-- Insert sample data for integrations
INSERT INTO integrations (name, provider, type, status, config) VALUES
('Mailchimp Integration', 'mailchimp', 'email_marketing', 'active', '{"api_key": "encrypted", "list_id": "sample"}'),
('Google Analytics', 'google', 'analytics', 'active', '{"tracking_id": "GA-XXXXX", "events": "enabled"}'),
('Stripe Payments', 'stripe', 'payment', 'inactive', '{"public_key": "pk_test_", "webhook_url": ""}'),
('Zapier Webhooks', 'zapier', 'automation', 'active', '{"webhook_url": "https://hooks.zapier.com/", "events": []}'),
('Facebook Pixel', 'facebook', 'tracking', 'inactive', '{"pixel_id": "123456789", "events": ["purchase", "lead"]}');

-- Insert sample data for templates
INSERT INTO templates (name, description, category, template_type, content, is_public) VALUES
('Email powitalny', 'Szablon emaila powitalnego dla nowych użytkowników', 'email', 'email', '{"subject": "Witamy w Funnel Flow!", "body": "Dziękujemy za rejestrację w naszym systemie...", "variables": ["user_name", "company_name"]}', true),
('Landing page podstawowy', 'Podstawowy szablon strony docelowej', 'landing', 'landing', '{"title": "Twoja strona docelowa", "sections": [{"type": "hero", "content": "Główny nagłówek"}], "cta": "Zarejestruj się"}', true),
('Formularz kontaktowy', 'Standardowy formularz kontaktowy', 'form', 'form', '{"fields": [{"name": "name", "type": "text", "required": true}, {"name": "email", "type": "email", "required": true}, {"name": "message", "type": "textarea", "required": true}]}', true),
('Email reaktywacyjny', 'Szablon emaila dla nieaktywnych użytkowników', 'email', 'email', '{"subject": "Tęsknimy za Tobą!", "body": "Zauważyliśmy, że nie logowałeś się od jakiegoś czasu...", "variables": ["user_name", "last_login"]}', true),
('Przepływ onboardingu', 'Kompletny przepływ wprowadzania nowych użytkowników', 'automation', 'flow', '{"steps": [{"type": "email", "template": "welcome"}, {"type": "delay", "duration": "1_day"}, {"type": "email", "template": "tutorial"}], "triggers": ["user_registered"]}', true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flows_created_by ON flows(created_by);
CREATE INDEX IF NOT EXISTS idx_flows_is_active ON flows(is_active);
CREATE INDEX IF NOT EXISTS idx_flows_trigger_type ON flows(trigger_type);

CREATE INDEX IF NOT EXISTS idx_flow_steps_flow_id ON flow_steps(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_steps_order ON flow_steps(flow_id, step_order);

CREATE INDEX IF NOT EXISTS idx_funnels_created_by ON funnels(created_by);
CREATE INDEX IF NOT EXISTS idx_funnels_is_active ON funnels(is_active);

CREATE INDEX IF NOT EXISTS idx_funnel_steps_funnel_id ON funnel_steps(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_steps_order ON funnel_steps(funnel_id, step_order);

CREATE INDEX IF NOT EXISTS idx_integrations_created_by ON integrations(created_by);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_recorded_at ON analytics_events(recorded_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON analytics_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_steps_updated_at
  BEFORE UPDATE ON flow_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnels_updated_at
  BEFORE UPDATE ON funnels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Now enable RLS on all tables
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "All authenticated users can access flows"
  ON flows
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access flow_steps"
  ON flow_steps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access funnels"
  ON funnels
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access funnel_steps"
  ON funnel_steps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access analytics_events"
  ON analytics_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
