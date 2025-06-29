/*
  # Fix Users Function

  1. Database Function Fix
    - Poprawka funkcji `get_all_users_with_roles`
    - Dodanie brakujących kolumn i poprawne JOINy
    - Zapewnienie zwracania wszystkich potrzebnych danych

  2. User Data Structure
    - Wszystkie potrzebne pola dla interfejsu użytkowników
    - Poprawne obliczanie dni pozostałych do wygaśnięcia
    - Status konta i informacje o rolach
*/

-- Poprawiona funkcja pobierania użytkowników z rolami
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  user_role text,
  role_description text,
  account_expires_at timestamptz,
  is_lifetime_access boolean,
  days_remaining integer,
  is_expired boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    COALESCE(p.full_name, au.raw_user_meta_data->>'full_name')::text as full_name,
    au.created_at,
    COALESCE(r.name, 'user')::text as user_role,
    COALESCE(r.description, 'Standardowy użytkownik')::text as role_description,
    ua.account_expires_at,
    COALESCE(ua.is_lifetime_access, false) as is_lifetime_access,
    CASE 
      WHEN ua.is_lifetime_access = true THEN NULL
      WHEN ua.account_expires_at IS NULL THEN NULL
      WHEN ua.account_expires_at < NOW() THEN 0
      ELSE EXTRACT(DAY FROM ua.account_expires_at - NOW())::integer
    END as days_remaining,
    CASE 
      WHEN ua.is_lifetime_access = true THEN false
      WHEN ua.account_expires_at IS NULL THEN false
      ELSE ua.account_expires_at < NOW()
    END as is_expired
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  LEFT JOIN user_roles ur ON ur.user_id = au.id AND ur.is_active = true
  LEFT JOIN roles r ON r.id = ur.role_id
  LEFT JOIN user_accounts ua ON ua.user_id = au.id
  WHERE au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;
