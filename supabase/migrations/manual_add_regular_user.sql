/*
  # Ręczne dodanie zwykłego użytkownika

  1. Konto użytkownika
    - Email: user@example.com
    - Hasło: user123
    - Imię i nazwisko: Jan Kowalski
    - Rola: user

  2. Proces
    - Sprawdź czy użytkownik już istnieje
    - Utwórz profil
    - Przydziel rolę user
    - Ustaw konto z wygaśnięciem za 30 dni
    - Wyświetl potwierdzenie
*/

DO $$
DECLARE
  user_uuid uuid;
  user_role_id uuid;
  user_email text := 'user@example.com';
  user_password text := 'user123';
  user_name text := 'Jan Kowalski';
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
  
  -- Znajdź rolę user
  SELECT id INTO user_role_id
  FROM roles
  WHERE name = 'user';
  
  IF user_role_id IS NULL THEN
    RAISE EXCEPTION 'Rola user nie istnieje!';
  END IF;
  
  -- Utwórz profil
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (user_uuid, user_name, user_email, NOW(), NOW());
  
  RAISE NOTICE '👤 Profil utworzony';
  
  -- Przydziel rolę user
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (user_uuid, user_role_id, user_uuid, true, NOW());
  
  RAISE NOTICE '🔑 Rola user przydzielona';
  
  -- Utwórz konto z wygaśnięciem za 30 dni
  INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (user_uuid, NOW() + INTERVAL '30 days', false, NOW(), NOW());
  
  RAISE NOTICE '📅 Konto ważne przez 30 dni';
  
  -- Ustaw podstawowe alokacje zasobów dla użytkownika
  INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by, allocated_at)
  VALUES 
    (user_uuid, 'flows', 10, user_uuid, NOW()),
    (user_uuid, 'funnels', 5, user_uuid, NOW()),
    (user_uuid, 'integrations', 3, user_uuid, NOW()),
    (user_uuid, 'templates', 10, user_uuid, NOW()),
    (user_uuid, 'users', 0, user_uuid, NOW()),
    (user_uuid, 'storage', 1000, user_uuid, NOW());
  
  RAISE NOTICE '💎 Zasoby przydzielone';
  
  RAISE NOTICE '🎉 SUKCES! Użytkownik utworzony:';
  RAISE NOTICE '📧 Email: %', user_email;
  RAISE NOTICE '🔐 Hasło: %', user_password;
  RAISE NOTICE '👤 Imię: %', user_name;
  RAISE NOTICE '🆔 ID: %', user_uuid;
  
END $$;

-- Sprawdź utworzonego użytkownika
SELECT 
  p.email,
  p.full_name,
  r.name as rola,
  ua.expires_at as wygasa,
  EXTRACT(days FROM (ua.expires_at - NOW()))::integer as dni_pozostalo
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_accounts ua ON p.id = ua.user_id
WHERE p.email = 'user@example.com';
