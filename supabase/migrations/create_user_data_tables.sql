/*
  # Create user data tables with RLS

  1. New Tables
    - `flows` - Marketing automation flows
    - `funnels` - Sales funnels
    - `integrations` - Third-party integrations
    - `templates` - Flow and funnel templates
    - `analytics` - Analytics data

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Proper foreign key relationships

  3. Features
    - All tables have user_id foreign key
    - Timestamps for created_at and updated_at
    - Proper indexing for performance
*/

-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create funnels table
CREATE TABLE IF NOT EXISTS funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  config jsonb DEFAULT '{}',
  conversion_rate decimal(5,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  config jsonb DEFAULT '{}',
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL CHECK (type IN ('flow', 'funnel')),
  category text DEFAULT 'custom',
  config jsonb DEFAULT '{}',
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('flow', 'funnel')),
  entity_id uuid NOT NULL,
  metric_name text NOT NULL,
  metric_value decimal(10,2) NOT NULL,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flows
CREATE POLICY "Users can manage own flows"
  ON flows
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for funnels
CREATE POLICY "Users can manage own funnels"
  ON funnels
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for integrations
CREATE POLICY "Users can manage own integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for templates
CREATE POLICY "Users can manage own templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Create RLS policies for analytics
CREATE POLICY "Users can manage own analytics"
  ON analytics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS flows_user_id_idx ON flows(user_id);
CREATE INDEX IF NOT EXISTS flows_status_idx ON flows(status);
CREATE INDEX IF NOT EXISTS flows_created_at_idx ON flows(created_at DESC);

CREATE INDEX IF NOT EXISTS funnels_user_id_idx ON funnels(user_id);
CREATE INDEX IF NOT EXISTS funnels_status_idx ON funnels(status);
CREATE INDEX IF NOT EXISTS funnels_created_at_idx ON funnels(created_at DESC);

CREATE INDEX IF NOT EXISTS integrations_user_id_idx ON integrations(user_id);
CREATE INDEX IF NOT EXISTS integrations_status_idx ON integrations(status);
CREATE INDEX IF NOT EXISTS integrations_type_idx ON integrations(type);

CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);
CREATE INDEX IF NOT EXISTS templates_type_idx ON templates(type);
CREATE INDEX IF NOT EXISTS templates_category_idx ON templates(category);
CREATE INDEX IF NOT EXISTS templates_public_idx ON templates(is_public);

CREATE INDEX IF NOT EXISTS analytics_user_id_idx ON analytics(user_id);
CREATE INDEX IF NOT EXISTS analytics_entity_idx ON analytics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS analytics_recorded_at_idx ON analytics(recorded_at DESC);

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_flows_updated_at ON flows;
CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_funnels_updated_at ON funnels;
CREATE TRIGGER update_funnels_updated_at
  BEFORE UPDATE ON funnels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
