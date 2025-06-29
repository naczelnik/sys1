/*
  # Kompletna architektura systemu Funnel Flow

  1. Tabele użytkowników
    - `app_users` - główna tabela użytkowników
    - `app_user_roles` - role użytkowników
    - `app_user_sessions` - sesje impersonacji

  2. Tabele przepływów i lejków
    - `flows` - przepływy marketingowe
    - `funnels` - lejki sprzedażowe
    - `flow_steps` - kroki przepływów
    - `funnel_steps` - kroki lejków

  3. Tabele integracji i analityki
    - `integrations` - integracje zewnętrzne
    - `analytics_events` - wydarzenia analityczne
    - `templates` - szablony

  4. Bezpieczeństwo
    - RLS włączone na wszystkich tabelach
    - Polityki dla różnych ról
    - Funkcje zarządzania
*/

-- KROK 1: Usuń wszystkie stare tabele
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS flows CASCADE;
DROP TABLE IF EXISTS funnels CASCADE;
DROP TABLE IF EXISTS flow_steps CASCADE;
DROP TABLE IF EXISTS funnel_steps CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS app_user_roles CASCADE;
DROP TABLE IF EXISTS app_user_sessions CASCADE;

-- KROK 2: Utwórz tabele użytkowników

-- Tabela ról
CREATE TABLE app_user_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Główna tabela użytkowników
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  password_hash TEXT,
  role_name TEXT DEFAULT 'user' REFERENCES app_user_roles(name),
  is_active BOOLEAN DEFAULT true,
  is_lifetime_access BOOLEAN DEFAULT false,
  account_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela sesji dla impersonacji
CREATE TABLE app_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID REFERENCES auth.users(id),
  impersonated_user_id UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- KROK 3: Utwórz tabele biznesowe

-- Tabela przepływów
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT DEFAULT 'manual',
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela kroków przepływów
CREATE TABLE flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  step_type TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela lejków
CREATE TABLE funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  conversion_goal TEXT,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela kroków lejków
CREATE TABLE funnel_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  step_type TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  config JSONB DEFAULT '{}',
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela integracji
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela wydarzeń analitycznych
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela szablonów
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  template_type TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KROK 4: Wstaw podstawowe dane

-- Role użytkowników
INSERT INTO app_user_roles (name, display_name, description) VALUES
('super_admin', 'Super Administrator', 'Pełne uprawnienia do systemu'),
('admin', 'Administrator', 'Uprawnienia administracyjne'),
('user', 'Użytkownik', 'Standardowy użytkownik'),
('viewer', 'Przeglądający', 'Tylko do odczytu')
ON CONFLICT (name) DO NOTHING;

-- Super Administrator
INSERT INTO app_users (
  email,
  full_name,
  password_hash,
  role_name,
  is_lifetime_access,
  account_expires_at
) VALUES (
  'naczelnik@gmail.com',
  'Super Administrator',
  crypt('naczelnik@gmail.com', gen_salt('bf')),
  'super_admin',
  true,
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Przykładowe przepływy
INSERT INTO flows (name, description, trigger_type) VALUES
('Powitanie nowych użytkowników', 'Automatyczny przepływ powitalny dla nowych rejestracji', 'registration'),
('Reaktywacja nieaktywnych', 'Kampania reaktywacyjna dla nieaktywnych użytkowników', 'scheduled'),
('Upselling premium', 'Przepływ sprzedażowy dla użytkowników premium', 'manual')
ON CONFLICT DO NOTHING;

-- Przykładowe lejki
INSERT INTO funnels (name, description, conversion_goal) VALUES
('Rejestracja użytkowników', 'Lejek konwersji od odwiedzin do rejestracji', 'registration'),
('Sprzedaż premium', 'Lejek sprzedażowy planów premium', 'purchase'),
('Webinar marketing', 'Lejek konwersji webinarów marketingowych', 'attendance')
ON CONFLICT DO NOTHING;

-- Przykładowe szablony
INSERT INTO templates (name, category, template_type, content, is_public) VALUES
('Email powitalny', 'email', 'welcome', '{"subject": "Witamy w Funnel Flow!", "body": "Dziękujemy za rejestrację..."}', true),
('Landing page podstawowy', 'landing', 'basic', '{"title": "Twoja strona docelowa", "sections": []}', true),
('Formularz kontaktowy', 'form', 'contact', '{"fields": ["name", "email", "message"]}', true)
ON CONFLICT DO NOTHING;

-- KROK 5: Włącz RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- KROK 6: Polityki RLS

-- Role - wszyscy mogą czytać
CREATE POLICY "Anyone can read roles"
  ON app_user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Użytkownicy - zalogowani mogą czytać
CREATE POLICY "Authenticated users can read users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Użytkownicy - admini mogą zarządzać
CREATE POLICY "Admins can manage users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND au.role_name IN ('super_admin', 'admin')
      AND au.is_active = true
    )
  );

-- Przepływy - użytkownicy mogą zarządzać swoimi
CREATE POLICY "Users can manage their flows"
  ON flows
  FOR ALL
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM app_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Kroki przepływów - dziedziczą uprawnienia z flows
CREATE POLICY "Users can manage their flow steps"
  ON flow_steps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flows f
      WHERE f.id = flow_steps.flow_id
      AND f.created_by = (
        SELECT id FROM app_users 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Lejki - użytkownicy mogą zarządzać swoimi
CREATE POLICY "Users can manage their funnels"
  ON funnels
  FOR ALL
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM app_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Kroki lejków - dziedziczą uprawnienia z funnels
CREATE POLICY "Users can manage their funnel steps"
  ON funnel_steps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funnels f
      WHERE f.id = funnel_steps.funnel_id
      AND f.created_by = (
        SELECT id FROM app_users 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Integracje - użytkownicy mogą zarządzać swoimi
CREATE POLICY "Users can manage their integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM app_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Wydarzenia analityczne - wszyscy mogą dodawać, tylko swoje czytać
CREATE POLICY "Users can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    user_id = (
      SELECT id FROM app_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )::text::uuid
  );

-- Szablony - publiczne może czytać każdy, prywatne tylko właściciel
CREATE POLICY "Anyone can read public templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can manage their templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM app_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Sesje impersonacji
CREATE POLICY "Users can manage their sessions"
  ON app_user_sessions
  FOR ALL
  TO authenticated
  USING (original_user_id = auth.uid());

-- KROK 7: Indeksy dla wydajności
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_role ON app_users(role_name);
CREATE INDEX idx_flows_created_by ON flows(created_by);
CREATE INDEX idx_funnels_created_by ON funnels(created_by);
CREATE INDEX idx_flow_steps_flow_id ON flow_steps(flow_id);
CREATE INDEX idx_funnel_steps_funnel_id ON funnel_steps(funnel_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_public ON templates(is_public);
