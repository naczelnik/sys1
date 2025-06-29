/*
  # Napraw konflikt funkcji is_super_admin

  1. Problem
    - Istnieją duplikaty funkcji is_super_admin() w bazie
    - PostgreSQL nie wie której użyć
    - Blokuje to przywrócenie uprawnień Super Admin

  2. Rozwiązanie
    - Usuń wszystkie wersje konfliktowych funkcji
    - Utwórz jedną, czystą wersję każdej funkcji
    - Przywróć uprawnienia Super Admin
*/

-- KROK 1: Usuń wszystkie konfliktowe funkcje
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_super_admin(uuid);
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_admin(uuid);

-- KROK 2: Utwórz jedną, czystą wersję is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź w nowej tabeli app_users
  IF EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = user_uuid::text::uuid 
    AND role_name = 'super_admin'
    AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  -- Fallback - sprawdź w starej tabeli user_roles
  IF EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true 
    AND r.name = 'super_admin'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- KROK 3: Utwórz jedną, czystą wersję is_admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź w nowej tabeli app_users
  IF EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = user_uuid::text::uuid 
    AND role_name IN ('super_admin', 'admin')
    AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  -- Fallback - sprawdź w starej tabeli user_roles
  IF EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true 
    AND r.name IN ('super_admin', 'admin')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- KROK 4: Upewnij się że Super Admin istnieje w nowej tabeli
INSERT INTO app_users (
  id,
  email,
  full_name,
  role_name,
  is_active,
  is_lifetime_access,
  account_expires_at
) 
SELECT 
  id,
  email,
  'Super Administrator',
  'super_admin',
  true,
  true,
  NULL
FROM auth.users 
WHERE email = 'naczelnik@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role_name = 'super_admin',
  is_active = true,
  is_lifetime_access = true,
  account_expires_at = NULL;
