/*
  # FlowCraft Database Schema

  1. New Tables
    - `profiles` - User profiles with additional information
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `flows` - Marketing automation flows
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text)
      - `status` (enum: active, inactive, draft)
      - `config` (jsonb) - Flow configuration
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `integrations` - Third-party service integrations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `type` (text)
      - `status` (enum: connected, disconnected, error)
      - `config` (jsonb) - Integration configuration
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `flow_logs` - Execution logs for flows
      - `id` (uuid, primary key)
      - `flow_id` (uuid, references flows)
      - `status` (enum: success, error, pending)
      - `data` (jsonb) - Log data
      - `created_at` (timestamp)
    
    - `templates` - Flow templates
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `config` (jsonb) - Template configuration
      - `is_public` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for templates
*/

-- Create custom types
CREATE TYPE flow_status AS ENUM ('active', 'inactive', 'draft');
CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error');
CREATE TYPE log_status AS ENUM ('success', 'error', 'pending');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Flows table
CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  status flow_status DEFAULT 'draft',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  status integration_status DEFAULT 'disconnected',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Flow logs table
CREATE TABLE IF NOT EXISTS flow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  status log_status DEFAULT 'pending',
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  config jsonb DEFAULT '{}',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Flows policies
CREATE POLICY "Users can manage own flows"
  ON flows
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Integrations policies
CREATE POLICY "Users can manage own integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Flow logs policies
CREATE POLICY "Users can read own flow logs"
  ON flow_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = flow_logs.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert flow logs"
  ON flow_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = flow_logs.flow_id
      AND flows.user_id = auth.uid()
    )
  );

-- Templates policies
CREATE POLICY "Everyone can read public templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flows_status ON flows(status);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_flow_logs_flow_id ON flow_logs(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_logs_created_at ON flow_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
