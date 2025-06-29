/*
  # Ostateczne naprawienie systemu użytkowników

  1. Usuń wszystkie stare tabele powodujące konflikty
  2. Upewnij się, że nowe tabele istnieją
  3. Usuń wszystkie stare funkcje
  4. Upewnij się, że RLS działa poprawnie
*/

-- KROK 1: Usuń wszystkie stare tabele powodujące konflikty
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS resource_allocations CASCADE;

-- KROK 2: Upewnij się, że tabela app_users istnieje z poprawnymi kolumnami
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

-- KROK 3: Upewnij się, że tabela app_user_roles istnieje
CREATE TABLE IF NOT EXISTS app_user_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KROK 4: Wstaw podstawowe role
INSERT INTO app_user_roles (name, display_name, description) VALUES
('super_admin', 'Super Administrator', 'Pełne uprawnienia do systemu'),
('admin', 'Administrator', 'Uprawnienia administracyjne'),
('user', 'Użytkownik', 'Standardowy użytkownik'),
('viewer', 'Przeglądający', 'Tylko do odczytu')
ON CONFLICT (name) DO NOTHING;

-- KROK 5: Włącz RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;

-- KROK 6: Usuń wszystkie stare polityki
DROP POLICY IF EXISTS "Anyone can read roles" ON app_user_roles;
DROP POLICY IF EXISTS "Authenticated users can read users" ON app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

-- KROK 7: Utwórz nowe, proste polityki
CREATE POLICY "Anyone can read roles"
  ON app_user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage users"
  ON app_users
  FOR ALL
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

-- KROK 9: Usuń wszystkie stare funkcje powodujące konflikty
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_super_admin CASCADE;
DROP FUNCTION IF EXISTS add_app_user CASCADE;
DROP FUNCTION IF EXISTS update_app_user CASCADE;
DROP FUNCTION IF EXISTS delete_app_user CASCADE;
DROP FUNCTION IF EXISTS get_all_app_users CASCADE;
