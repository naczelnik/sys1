/*
  # Przydziel rangę Super Administrator dla naczelnik@gmail.com

  1. Sprawdzenie konta
    - Znajdź użytkownika naczelnik@gmail.com
    - Sprawdź obecne role

  2. Przydzielenie roli
    - Usuń wszystkie obecne role
    - Przydziel rolę super_admin
    - Ustaw nieograniczone zasoby

  3. Weryfikacja
    - Sprawdź czy rola została przydzielona
    - Wyświetl status konta
*/

-- NAJPIERW utwórz funkcję pomocniczą
CREATE OR REPLACE FUNCTION is_super_admin_for_user(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_super boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND r.name = 'super_admin'
    AND ur.is_active = true
  ) INTO is_super;
  
  RAISE NOTICE '🔍 Status Super Admin dla użytkownika %: %', user_uuid, is_super;
  
  RETURN is_super;
END;
$$;

-- TERAZ wykonaj przydzielenie roli
DO $$
DECLARE
  user_uuid uuid;
  super_admin_role_id uuid;
  current_roles text;
BEGIN
  -- Znajdź użytkownika
  SELECT au.id INTO user_uuid
  FROM auth.users au
  WHERE au.email = 'naczelnik@gmail.com';
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Użytkownik naczelnik@gmail.com nie został znaleziony! Musisz się najpierw zarejestrować.';
  END IF;
  
  RAISE NOTICE '✅ Znaleziono użytkownika: % (ID: %)', 'naczelnik@gmail.com', user_uuid;
  
  -- Sprawdź obecne role
  SELECT string_agg(r.name, ', ') INTO current_roles
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_uuid;
  
  RAISE NOTICE 'ℹ️ Obecne role: %', COALESCE(current_roles, 'BRAK');
  
  -- Znajdź rolę super_admin
  SELECT id INTO super_admin_role_id
  FROM roles
  WHERE name = 'super_admin';
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Rola super_admin nie istnieje!';
  END IF;
  
  -- Usuń wszystkie obecne role użytkownika
  DELETE FROM user_roles WHERE user_id = user_uuid;
  RAISE NOTICE '🗑️ Usunięto wszystkie poprzednie role';
  
  -- Przydziel rolę super_admin
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (user_uuid, super_admin_role_id, user_uuid, true);
  
  RAISE NOTICE '👑 Przydzielono rolę Super Administrator';
  
  -- Upewnij się, że profil istnieje
  INSERT INTO profiles (id, email, full_name)
  VALUES (user_uuid, 'naczelnik@gmail.com', 'Artur Ścibisz')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  
  RAISE NOTICE '👤 Profil zaktualizowany';
  
  -- Ustaw nieograniczone alokacje zasobów
  INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by)
  VALUES 
    (user_uuid, 'flows', -1, user_uuid),
    (user_uuid, 'funnels', -1, user_uuid),
    (user_uuid, 'integrations', -1, user_uuid),
    (user_uuid, 'templates', -1, user_uuid),
    (user_uuid, 'users', -1, user_uuid),
    (user_uuid, 'storage', -1, user_uuid)
  ON CONFLICT (user_id, resource_type) DO UPDATE SET
    resource_limit = -1,
    allocated_by = user_uuid,
    allocated_at = now();
  
  RAISE NOTICE '💎 Ustawiono nieograniczone zasoby';
  
  -- Weryfikacja - sprawdź czy wszystko działa (TERAZ funkcja już istnieje)
  PERFORM is_super_admin_for_user(user_uuid);
  
  RAISE NOTICE '🎉 SUKCES! Użytkownik naczelnik@gmail.com ma teraz rangę Super Administrator!';
  
END $$;

-- Sprawdź status po przydzieleniu
SELECT 
  au.email,
  au.id as user_id,
  r.name as role_name,
  ur.is_active,
  ur.assigned_at
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE au.email = 'naczelnik@gmail.com';
