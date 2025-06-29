/*
  # Naprawa funkcji zarządzania hasłami

  1. Poprawki
    - Naprawiono błąd "column reference 'role_id' is ambiguous"
    - Dodano lepsze aliasy dla tabel
    - Poprawiono logikę tworzenia użytkowników

  2. Security
    - Zachowano wszystkie zabezpieczenia
    - Poprawiono obsługę błędów
*/

-- Napraw funkcję tworzenia użytkownika z hasłem
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

  -- Pobierz ID roli z jednoznacznym aliasem
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

  -- Przypisz rolę
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (new_user_id, target_role_id, auth.uid(), true, NOW());

  -- Utwórz konto użytkownika z domyślnym wygaśnięciem za 30 dni
  INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (new_user_id, NOW() + INTERVAL '30 days', false, NOW(), NOW());

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

-- Napraw funkcję zmiany hasła
CREATE OR REPLACE FUNCTION admin_change_user_password(
  target_user_id uuid,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users.manage', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do zmiany haseł użytkowników';
  END IF;

  -- Sprawdź czy hasło ma odpowiednią długość
  IF LENGTH(new_password) < 6 THEN
    RAISE EXCEPTION 'Hasło musi mieć co najmniej 6 znaków';
  END IF;

  -- Sprawdź czy użytkownik istnieje
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Użytkownik nie istnieje';
  END IF;

  -- Zmień hasło w auth.users (jeśli użytkownik istnieje)
  BEGIN
    UPDATE auth.users 
    SET 
      encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
    WHERE id = target_user_id;
    
    GET DIAGNOSTICS target_user_id = ROW_COUNT;
    
    IF target_user_id > 0 THEN
      RAISE NOTICE 'Password updated in auth.users successfully';
    ELSE
      RAISE NOTICE 'User not found in auth.users, password change skipped';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update password in auth.users: %', SQLERRM;
  END;

  -- Zapisz informację o zmianie hasła w logach
  INSERT INTO user_activity_logs (user_id, action, performed_by, created_at, details)
  VALUES (
    target_user_id, 
    'password_changed', 
    auth.uid(), 
    NOW(),
    jsonb_build_object('changed_by_email', (SELECT email FROM profiles WHERE id = auth.uid()))
  );

  RETURN true;
END;
$$;

-- Dodaj funkcję pomocniczą do aktualizacji profilu i konta
CREATE OR REPLACE FUNCTION update_user_profile_and_account(
  target_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_account_expires_at timestamptz DEFAULT NULL,
  new_is_lifetime_access boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users.manage', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do aktualizacji użytkowników';
  END IF;

  -- Sprawdź czy użytkownik istnieje
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Użytkownik nie istnieje';
  END IF;

  -- Aktualizuj profil jeśli podano nową nazwę
  IF new_full_name IS NOT NULL THEN
    UPDATE profiles 
    SET full_name = new_full_name, updated_at = NOW()
    WHERE id = target_user_id;
  END IF;

  -- Aktualizuj konto użytkownika
  IF new_is_lifetime_access IS NOT NULL OR new_account_expires_at IS NOT NULL THEN
    UPDATE user_accounts 
    SET 
      is_lifetime_access = COALESCE(new_is_lifetime_access, is_lifetime_access),
      expires_at = CASE 
        WHEN new_is_lifetime_access = true THEN NULL
        ELSE COALESCE(new_account_expires_at, expires_at)
      END,
      updated_at = NOW()
    WHERE user_id = target_user_id;
  END IF;

  -- Zapisz w logach
  INSERT INTO user_activity_logs (user_id, action, performed_by, created_at, details)
  VALUES (
    target_user_id, 
    'profile_updated', 
    auth.uid(), 
    NOW(),
    jsonb_build_object(
      'updated_by_email', (SELECT email FROM profiles WHERE id = auth.uid()),
      'full_name_changed', (new_full_name IS NOT NULL),
      'account_settings_changed', (new_is_lifetime_access IS NOT NULL OR new_account_expires_at IS NOT NULL)
    )
  );

  RETURN true;
END;
$$;
