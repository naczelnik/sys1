/*
  # Kompletne wyczyszczenie i utworzenie nowego systemu użytkowników

  1. Usuń WSZYSTKIE stare tabele i funkcje
  2. Utwórz kompletnie nowy, prosty system
  3. Upewnij się, że nie ma żadnych konfliktów
*/

-- KROK 1: Usuń WSZYSTKIE stare tabele (nawet jeśli nie istnieją)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS resource_allocations CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;

-- KROK 2: Usuń WSZYSTKIE stare funkcje
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_super_admin CASCADE;
DROP FUNCTION IF EXISTS add_app_user CASCADE;
DROP FUNCTION IF EXISTS update_app_user CASCADE;
DROP FUNCTION IF EXISTS delete_app_user CASCADE;
DROP FUNCTION IF EXISTS get_all_app_users CASCADE;
DROP FUNCTION IF EXISTS check_user_role CASCADE;
DROP FUNCTION IF EXISTS get_user_permissions CASCADE;

-- KROK 3: Usuń stare polityki RLS
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can read users" ON user_accounts;

-- KROK 4: Utwórz kompletnie nowe, proste tabele

-- Tabela ról
CREATE TABLE IF NOT EXISTS app_user_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Główna tabela użytkowników
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role_name TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  is_lifetime_access BOOLEAN DEFAULT false,
  account_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KROK 5: Wstaw podstawowe role
INSERT INTO app_user_roles (name, display_name, description) VALUES
('super_admin', 'Super Administrator', 'Pełne uprawnienia do systemu'),
('admin', 'Administrator', 'Uprawnienia administracyjne'),
('user', 'Użytkownik', 'Standardowy użytkownik'),
('viewer', 'Przeglądający', 'Tylko do odczytu')
ON CONFLICT (name) DO NOTHING;

-- KROK 6: Włącz RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;

-- KROK 7: Utwórz bardzo proste polityki RLS
CREATE POLICY "Allow all for authenticated users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow read roles for authenticated users"
  ON app_user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- KROK 8: Upewnij się, że Super Admin istnieje
INSERT INTO app_users (
  email,
  full_name,
  role_name,
  is_lifetime_access,
  account_expires_at
) VALUES (
  'naczelnik@gmail.com',
  'Super Administrator',
  'super_admin',
  true,
  NULL
) ON CONFLICT (email) DO UPDATE SET
  role_name = 'super_admin',
  is_lifetime_access = true,
  account_expires_at = NULL,
  updated_at = NOW();
