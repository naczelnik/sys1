/*
  # Ręczne dodanie Administratora

  1. Konto Administratora
    - Email: admin@example.com
    - Hasło: admin123
    - Imię i nazwisko: Administrator Systemu
    - Rola: admin

  2. Proces
    - Sprawdź czy użytkownik już istnieje
    - Utwórz profil
    - Przydziel rolę admin
    - Ustaw konto z wygaśnięciem za 365 dni
    - Wyświetl potwierdzenie
*/

DO $$
DECLARE
  user_uuid uuid;
  admin_role_id uuid;
  user_email text := 'admin@example.com';
  user_password text := 'admin123';
  user_name text := 'Administrator Systemu';
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
  
  RAISE NOTICE '🔄 Tworzenie administratora: %', user_email;
  
  -- Znajdź rolę admin
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'admin';
  
  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Rola admin nie istnieje!';
  END IF;
  
  -- Utwórz profil
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (user_uuid, user_name, user_email, NOW(), NOW());
  
  RAISE NOTICE '👤 Profil utworzony';
  
  -- Przydziel rolę admin
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (user_uuid, admin_role_id, user_uuid, true, NOW());
  
  RAISE NOTICE '🔑 Rola admin przydzielona';
  
  -- Utwórz konto z wygaśnięciem za rok
  INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (user_uuid, NOW() + INTERVAL '365 days', false, NOW(), NOW());
  
  RAISE NOTICE '📅 Konto ważne przez 365 dni';
  
  -- Ustaw alokacje zasobów dla admina
  INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by, allocated_at)
  VALUES 
    (user_uuid, 'flows', 100, user_uuid, NOW()),
    (user_uuid, 'funnels', 100, user_uuid, NOW()),
    (user_uuid, 'integrations', 50, user_uuid, NOW()),
    (user_uuid, 'templates', 100, user_uuid, NOW()),
    (user_uuid, 'users', 50, user_uuid, NOW()),
    (user_uuid, 'storage', 10000, user_uuid, NOW());
  
  RAISE NOTICE '💎 Zasoby przydzielone';
  
  RAISE NOTICE '🎉 SUKCES! Administrator utworzony:';
  RAISE NOTICE '📧 Email: %', user_email;
  RAISE NOTICE '🔐 Hasło: %', user_password;
  RAISE NOTICE '👤 Imię: %', user_name;
  RAISE NOTICE '🆔 ID: %', user_uuid;
  
END $$;

-- Sprawdź utworzonego administratora
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
WHERE p.email = 'admin@example.com';
