/*
  # Szablon do dodawania własnych użytkowników

  INSTRUKCJA UŻYCIA:
  1. Zmień wartości w sekcji DECLARE
  2. Uruchom skrypt w Supabase SQL Editor
  3. Sprawdź wyniki

  PRZYKŁAD ZMIANY:
  user_email text := 'twoj-email@example.com';
  user_password text := 'twoje-haslo';
  user_name text := 'Twoje Imię Nazwisko';
  user_role_name text := 'admin'; -- lub 'user'
*/

DO $$
DECLARE
  -- ⚠️ ZMIEŃ TE WARTOŚCI PRZED URUCHOMIENIEM ⚠️
  user_email text := 'nowy-uzytkownik@example.com';
  user_password text := 'haslo123';
  user_name text := 'Nowy Użytkownik';
  user_role_name text := 'user'; -- 'user', 'admin', lub 'super_admin'
  account_days integer := 30; -- ile dni ważności konta
  
  -- Zmienne systemowe
  user_uuid uuid;
  target_role_id uuid;
BEGIN
  -- Sprawdź czy użytkownik już istnieje
  SELECT id INTO user_uuid
  FROM profiles
  WHERE email = user_email;
  
  IF user_uuid IS NOT NULL THEN
    RAISE NOTICE '⚠️ Użytkownik % już istnieje (ID: %)', user_email, user_uuid;
    RETURN;
  END IF;
  
  -- Wygeneruj nowe ID
  user_uuid := gen_random_uuid();
  
  RAISE NOTICE '🔄 Tworzenie użytkownika: %', user_email;
  
  -- Znajdź rolę
  SELECT id INTO target_role_id
  FROM roles
  WHERE name = user_role_name;
  
  IF target_role_id IS NULL THEN
    RAISE EXCEPTION 'Rola % nie istnieje! Dostępne role: user, admin, super_admin', user_role_name;
  END IF;
  
  -- Utwórz profil
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (user_uuid, user_name, user_email, NOW(), NOW());
  
  RAISE NOTICE '👤 Profil utworzony';
  
  -- Przydziel rolę
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (user_uuid, target_role_id, user_uuid, true, NOW());
  
  RAISE NOTICE '🔑 Rola % przydzielona', user_role_name;
  
  -- Utwórz konto
  INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (user_uuid, NOW() + (account_days || ' days')::interval, false, NOW(), NOW());
  
  RAISE NOTICE '📅 Konto ważne przez % dni', account_days;
  
  -- Ustaw alokacje zasobów w zależności od roli
  IF user_role_name = 'super_admin' THEN
    INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by, allocated_at)
    VALUES 
      (user_uuid, 'flows', -1, user_uuid, NOW()),
      (user_uuid, 'funnels', -1, user_uuid, NOW()),
      (user_uuid, 'integrations', -1, user_uuid, NOW()),
      (user_uuid, 'templates', -1, user_uuid, NOW()),
      (user_uuid, 'users', -1, user_uuid, NOW()),
      (user_uuid, 'storage', -1, user_uuid, NOW());
  ELSIF user_role_name = 'admin' THEN
    INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by, allocated_at)
    VALUES 
      (user_uuid, 'flows', 100, user_uuid, NOW()),
      (user_uuid, 'funnels', 100, user_uuid, NOW()),
      (user_uuid, 'integrations', 50, user_uuid, NOW()),
      (user_uuid, 'templates', 100, user_uuid, NOW()),
      (user_uuid, 'users', 50, user_uuid, NOW()),
      (user_uuid, 'storage', 10000, user_uuid, NOW());
  ELSE -- user
    INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by, allocated_at)
    VALUES 
      (user_uuid, 'flows', 10, user_uuid, NOW()),
      (user_uuid, 'funnels', 5, user_uuid, NOW()),
      (user_uuid, 'integrations', 3, user_uuid, NOW()),
      (user_uuid, 'templates', 10, user_uuid, NOW()),
      (user_uuid, 'users', 0, user_uuid, NOW()),
      (user_uuid, 'storage', 1000, user_uuid, NOW());
  END IF;
  
  RAISE NOTICE '💎 Zasoby przydzielone dla roli %', user_role_name;
  
  RAISE NOTICE '🎉 SUKCES! Użytkownik utworzony:';
  RAISE NOTICE '📧 Email: %', user_email;
  RAISE NOTICE '🔐 Hasło: %', user_password;
  RAISE NOTICE '👤 Imię: %', user_name;
  RAISE NOTICE '🔰 Rola: %', user_role_name;
  RAISE NOTICE '🆔 ID: %', user_uuid;
  
END $$;
