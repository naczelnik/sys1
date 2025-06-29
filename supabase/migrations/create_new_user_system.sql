/*
  # Nowy system zarządzania użytkownikami

  1. Nowe tabele
    - `app_users` - główna tabela użytkowników
    - `app_user_roles` - role użytkowników
    - `app_user_sessions` - sesje dla impersonacji

  2. Bezpieczeństwo
    - RLS włączone na wszystkich tabelach
    - Polityki dla różnych ról
    - Funkcje zarządzania użytkownikami

  3. Funkcjonalności
    - Dodawanie użytkowników
    - Edytowanie użytkowników
    - Usuwanie użytkowników
    - Impersonacja
*/

-- KROK 1: Usuń stare tabele jeśli istnieją
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- KROK 2: Utwórz nowe, proste tabele

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
CREATE TABLE IF NOT EXISTS app_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID REFERENCES auth.users(id),
  impersonated_user_id UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- KROK 3: Wstaw podstawowe role
INSERT INTO app_user_roles (name, display_name, description) VALUES
('super_admin', 'Super Administrator', 'Pełne uprawnienia do systemu'),
('admin', 'Administrator', 'Uprawnienia administracyjne'),
('user', 'Użytkownik', 'Standardowy użytkownik'),
('viewer', 'Przeglądający', 'Tylko do odczytu')
ON CONFLICT (name) DO NOTHING;

-- KROK 4: Włącz RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_sessions ENABLE ROW LEVEL SECURITY;

-- KROK 5: Polityki RLS

-- Wszyscy mogą czytać role
CREATE POLICY "Anyone can read roles"
  ON app_user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Zalogowani użytkownicy mogą czytać użytkowników
CREATE POLICY "Authenticated users can read users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Tylko admini mogą modyfikować użytkowników
CREATE POLICY "Admins can manage users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid()::text::uuid 
      AND au.role_name IN ('super_admin', 'admin')
      AND au.is_active = true
    )
  );

-- Sesje impersonacji
CREATE POLICY "Users can manage their sessions"
  ON app_user_sessions
  FOR ALL
  TO authenticated
  USING (original_user_id = auth.uid());

-- KROK 6: Funkcje zarządzania

-- Funkcja sprawdzania czy użytkownik jest adminem
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = user_id::text::uuid 
    AND role_name IN ('super_admin', 'admin')
    AND is_active = true
  );
END;
$$;

-- Funkcja sprawdzania czy użytkownik jest super adminem
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = user_id::text::uuid 
    AND role_name = 'super_admin'
    AND is_active = true
  );
END;
$$;

-- Funkcja dodawania użytkownika
CREATE OR REPLACE FUNCTION add_app_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role_name TEXT DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Sprawdź uprawnienia
  current_user_id := auth.uid();
  
  IF NOT is_admin(current_user_id) THEN
    RAISE EXCEPTION 'Brak uprawnień do dodawania użytkowników';
  END IF;

  -- Walidacja
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email jest wymagany';
  END IF;

  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Imię i nazwisko jest wymagane';
  END IF;

  -- Sprawdź czy email już istnieje
  IF EXISTS (SELECT 1 FROM app_users WHERE email = lower(trim(p_email))) THEN
    RAISE EXCEPTION 'Użytkownik z tym emailem już istnieje';
  END IF;

  -- Sprawdź czy rola istnieje
  IF NOT EXISTS (SELECT 1 FROM app_user_roles WHERE name = p_role_name) THEN
    RAISE EXCEPTION 'Nieznana rola: %', p_role_name;
  END IF;

  -- Utwórz użytkownika
  INSERT INTO app_users (
    email,
    full_name,
    password_hash,
    role_name,
    created_by
  ) VALUES (
    lower(trim(p_email)),
    trim(p_full_name),
    crypt(p_password, gen_salt('bf')),
    p_role_name,
    current_user_id
  ) RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$;

-- Funkcja edytowania użytkownika
CREATE OR REPLACE FUNCTION update_app_user(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_role_name TEXT DEFAULT NULL,
  p_is_lifetime_access BOOLEAN DEFAULT NULL,
  p_account_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_new_password TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Sprawdź uprawnienia
  current_user_id := auth.uid();
  
  IF NOT is_admin(current_user_id) THEN
    RAISE EXCEPTION 'Brak uprawnień do edytowania użytkowników';
  END IF;

  -- Sprawdź czy użytkownik istnieje
  IF NOT EXISTS (SELECT 1 FROM app_users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Użytkownik nie istnieje';
  END IF;

  -- Aktualizuj dane
  UPDATE app_users SET
    full_name = COALESCE(p_full_name, full_name),
    role_name = COALESCE(p_role_name, role_name),
    is_lifetime_access = COALESCE(p_is_lifetime_access, is_lifetime_access),
    account_expires_at = CASE 
      WHEN p_is_lifetime_access = true THEN NULL
      ELSE COALESCE(p_account_expires_at, account_expires_at)
    END,
    password_hash = CASE 
      WHEN p_new_password IS NOT NULL THEN crypt(p_new_password, gen_salt('bf'))
      ELSE password_hash
    END,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- Funkcja usuwania użytkownika
CREATE OR REPLACE FUNCTION delete_app_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  target_user_role TEXT;
BEGIN
  -- Sprawdź uprawnienia
  current_user_id := auth.uid();
  
  IF NOT is_admin(current_user_id) THEN
    RAISE EXCEPTION 'Brak uprawnień do usuwania użytkowników';
  END IF;

  -- Nie można usunąć samego siebie
  IF p_user_id::text::uuid = current_user_id THEN
    RAISE EXCEPTION 'Nie możesz usunąć samego siebie';
  END IF;

  -- Sprawdź rolę usuwanego użytkownika
  SELECT role_name INTO target_user_role 
  FROM app_users 
  WHERE id = p_user_id;

  IF target_user_role IS NULL THEN
    RAISE EXCEPTION 'Użytkownik nie istnieje';
  END IF;

  -- Tylko super admin może usuwać innych super adminów
  IF target_user_role = 'super_admin' AND NOT is_super_admin(current_user_id) THEN
    RAISE EXCEPTION 'Tylko Super Administrator może usuwać innych Super Administratorów';
  END IF;

  -- Usuń sesje impersonacji
  DELETE FROM app_user_sessions WHERE impersonated_user_id = p_user_id;

  -- Usuń użytkownika
  DELETE FROM app_users WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- Funkcja pobierania wszystkich użytkowników z dodatkowymi informacjami
CREATE OR REPLACE FUNCTION get_all_app_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  user_role TEXT,
  role_description TEXT,
  is_active BOOLEAN,
  is_lifetime_access BOOLEAN,
  account_expires_at TIMESTAMPTZ,
  days_remaining INTEGER,
  is_expired BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień do przeglądania użytkowników';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role_name as user_role,
    r.display_name as role_description,
    u.is_active,
    u.is_lifetime_access,
    u.account_expires_at,
    CASE 
      WHEN u.is_lifetime_access THEN NULL
      WHEN u.account_expires_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (u.account_expires_at - NOW()))::INTEGER
    END as days_remaining,
    CASE 
      WHEN u.is_lifetime_access THEN false
      WHEN u.account_expires_at IS NULL THEN false
      ELSE u.account_expires_at < NOW()
    END as is_expired,
    u.created_at
  FROM app_users u
  LEFT JOIN app_user_roles r ON u.role_name = r.name
  ORDER BY u.created_at DESC;
END;
$$;

-- KROK 7: Utwórz Super Admina jeśli nie istnieje
DO $$
DECLARE
  super_admin_id UUID;
BEGIN
  -- Sprawdź czy Super Admin już istnieje
  SELECT id INTO super_admin_id 
  FROM app_users 
  WHERE email = 'naczelnik@gmail.com';

  IF super_admin_id IS NULL THEN
    -- Utwórz Super Admina
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
    );
    
    RAISE NOTICE 'Super Administrator został utworzony: naczelnik@gmail.com';
  ELSE
    RAISE NOTICE 'Super Administrator już istnieje';
  END IF;
END $$;
