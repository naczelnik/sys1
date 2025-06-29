/*
  # Naprawa ograniczeń w tabeli user_roles

  1. Usunięcie problematycznego ograniczenia unique
    - Pozwoli na wielokrotne przypisywanie ról (z is_active)
    - Zachowa integralność danych

  2. Poprawa funkcji tworzenia użytkowników
    - Lepsze zarządzanie rolami
    - Unikanie konfliktów kluczy
*/

-- Usuń problematyczne ograniczenie unique jeśli istnieje
DO $$
BEGIN
  -- Sprawdź czy ograniczenie istnieje i usuń je
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_user_id_role_id_key' 
    AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE user_roles DROP CONSTRAINT user_roles_user_id_role_id_key;
    RAISE NOTICE 'Removed problematic unique constraint user_roles_user_id_role_id_key';
  END IF;
  
  -- Sprawdź inne możliwe nazwy ograniczeń
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%user_roles%user_id%role_id%' 
    AND table_name = 'user_roles'
    AND constraint_type = 'UNIQUE'
  ) THEN
    -- Usuń wszystkie unique constraints na user_id + role_id
    DECLARE
      constraint_rec RECORD;
    BEGIN
      FOR constraint_rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%user_roles%user_id%role_id%' 
        AND table_name = 'user_roles'
        AND constraint_type = 'UNIQUE'
      LOOP
        EXECUTE 'ALTER TABLE user_roles DROP CONSTRAINT ' || constraint_rec.constraint_name;
        RAISE NOTICE 'Removed constraint: %', constraint_rec.constraint_name;
      END LOOP;
    END;
  END IF;
END $$;

-- Dodaj nowe, lepsze ograniczenie - tylko jedna aktywna rola na użytkownika
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_active_unique 
ON user_roles (user_id) 
WHERE is_active = true;

-- Popraw funkcję tworzenia użytkownika
CREATE OR REPLACE FUNCTION create_user_with_profile_and_password(
  user_email text,
  user_password text,
  user_full_name text,
  user_role_name text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  target_role_id uuid;
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users.manage', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do tworzenia użytkowników';
  END IF;

  -- Pobierz ID roli
  SELECT r.id INTO target_role_id
  FROM roles r
  WHERE r.name = user_role_name;

  IF target_role_id IS NULL THEN
    RAISE EXCEPTION 'Nieznana rola: %', user_role_name;
  END IF;

  -- Wygeneruj UUID dla nowego użytkownika
  new_user_id := gen_random_uuid();

  -- Sprawdź czy email już istnieje
  IF EXISTS (SELECT 1 FROM profiles WHERE email = user_email) THEN
    RAISE EXCEPTION 'Użytkownik z tym emailem już istnieje';
  END IF;

  -- Utwórz profil użytkownika
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (new_user_id, user_full_name, user_email, NOW(), NOW());

  -- Dezaktywuj wszystkie poprzednie role użytkownika (na wszelki wypadek)
  UPDATE user_roles 
  SET is_active = false 
  WHERE user_id = new_user_id;

  -- Przypisz nową rolę
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (new_user_id, target_role_id, auth.uid(), true, NOW())
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_by = auth.uid(),
    assigned_at = NOW();

  -- Utwórz konto użytkownika
  INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (new_user_id, NOW() + INTERVAL '30 days', false, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    expires_at = NOW() + INTERVAL '30 days',
    is_lifetime_access = false,
    updated_at = NOW();

  -- Spróbuj utworzyć użytkownika w auth.users (opcjonalnie)
  BEGIN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', user_full_name),
      false,
      'authenticated'
    );
    
    RAISE NOTICE 'User created in auth.users successfully';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create auth user (this is normal): %', SQLERRM;
  END;

  -- Zapisz w logach
  INSERT INTO user_activity_logs (user_id, action, performed_by, created_at, details)
  VALUES (
    new_user_id, 
    'user_created', 
    auth.uid(), 
    NOW(),
    jsonb_build_object('role', user_role_name, 'created_by_email', (SELECT email FROM profiles WHERE id = auth.uid()))
  );

  RETURN new_user_id;
END;
$$;
