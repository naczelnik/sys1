/*
  # Naprawa struktury tabeli user_accounts

  1. Sprawdzenie i naprawa struktury tabeli user_accounts
    - Dodanie brakujących kolumn jeśli nie istnieją
    - Zapewnienie zgodności z funkcjami

  2. Poprawki funkcji
    - Dostosowanie do rzeczywistej struktury tabeli
    - Dodanie sprawdzania istnienia kolumn
*/

-- Sprawdź i dodaj brakujące kolumny w tabeli user_accounts
DO $$
BEGIN
  -- Sprawdź czy tabela user_accounts istnieje
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') THEN
    -- Utwórz tabelę user_accounts jeśli nie istnieje
    CREATE TABLE user_accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      expires_at timestamptz,
      is_lifetime_access boolean DEFAULT false,
      created_at timestamptz DEFAULT NOW(),
      updated_at timestamptz DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    RAISE NOTICE 'Created user_accounts table';
  ELSE
    -- Dodaj brakujące kolumny jeśli nie istnieją
    
    -- Kolumna expires_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_accounts' AND column_name = 'expires_at'
    ) THEN
      ALTER TABLE user_accounts ADD COLUMN expires_at timestamptz;
      RAISE NOTICE 'Added expires_at column to user_accounts';
    END IF;
    
    -- Kolumna is_lifetime_access
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_accounts' AND column_name = 'is_lifetime_access'
    ) THEN
      ALTER TABLE user_accounts ADD COLUMN is_lifetime_access boolean DEFAULT false;
      RAISE NOTICE 'Added is_lifetime_access column to user_accounts';
    END IF;
    
    -- Kolumna created_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_accounts' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE user_accounts ADD COLUMN created_at timestamptz DEFAULT NOW();
      RAISE NOTICE 'Added created_at column to user_accounts';
    END IF;
    
    -- Kolumna updated_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_accounts' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE user_accounts ADD COLUMN updated_at timestamptz DEFAULT NOW();
      RAISE NOTICE 'Added updated_at column to user_accounts';
    END IF;
  END IF;
END $$;

-- Włącz RLS dla tabeli user_accounts
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Dodaj polityki RLS tylko jeśli nie istnieją
DO $$
BEGIN
  -- Sprawdź i dodaj politykę dla użytkowników
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_accounts' AND policyname = 'Users can read own account data'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read own account data"
      ON user_accounts
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid())';
    RAISE NOTICE 'Created policy: Users can read own account data';
  END IF;

  -- Sprawdź i dodaj politykę dla adminów
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_accounts' AND policyname = 'Admins can manage all accounts'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage all accounts"
      ON user_accounts
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid() 
          AND ur.is_active = true
          AND r.name IN (''super_admin'', ''admin'')
        )
      )';
    RAISE NOTICE 'Created policy: Admins can manage all accounts';
  END IF;
END $$;

-- Napraw funkcję tworzenia użytkownika z bezpiecznym sprawdzaniem kolumn
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
  has_expires_at boolean;
  has_lifetime_access boolean;
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

  -- Sprawdź jakie kolumny istnieją w tabeli user_accounts
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_accounts' AND column_name = 'expires_at'
  ) INTO has_expires_at;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_accounts' AND column_name = 'is_lifetime_access'
  ) INTO has_lifetime_access;

  -- Utwórz konto użytkownika z dynamicznym SQL
  IF has_expires_at AND has_lifetime_access THEN
    -- Pełna wersja z wszystkimi kolumnami
    INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access, created_at, updated_at)
    VALUES (new_user_id, NOW() + INTERVAL '30 days', false, NOW(), NOW());
  ELSIF has_expires_at THEN
    -- Tylko z expires_at
    INSERT INTO user_accounts (user_id, expires_at, created_at, updated_at)
    VALUES (new_user_id, NOW() + INTERVAL '30 days', NOW(), NOW());
  ELSE
    -- Minimalna wersja
    INSERT INTO user_accounts (user_id, created_at, updated_at)
    VALUES (new_user_id, NOW(), NOW());
  END IF;

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

-- Napraw funkcję aktualizacji profilu i konta
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
DECLARE
  has_expires_at boolean;
  has_lifetime_access boolean;
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

  -- Sprawdź jakie kolumny istnieją w tabeli user_accounts
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_accounts' AND column_name = 'expires_at'
  ) INTO has_expires_at;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_accounts' AND column_name = 'is_lifetime_access'
  ) INTO has_lifetime_access;

  -- Aktualizuj konto użytkownika tylko jeśli kolumny istnieją
  IF (new_is_lifetime_access IS NOT NULL OR new_account_expires_at IS NOT NULL) THEN
    IF has_expires_at AND has_lifetime_access THEN
      -- Pełna aktualizacja
      UPDATE user_accounts 
      SET 
        is_lifetime_access = COALESCE(new_is_lifetime_access, is_lifetime_access),
        expires_at = CASE 
          WHEN COALESCE(new_is_lifetime_access, is_lifetime_access) = true THEN NULL
          ELSE COALESCE(new_account_expires_at, expires_at)
        END,
        updated_at = NOW()
      WHERE user_id = target_user_id;
    ELSIF has_expires_at THEN
      -- Tylko expires_at
      UPDATE user_accounts 
      SET 
        expires_at = COALESCE(new_account_expires_at, expires_at),
        updated_at = NOW()
      WHERE user_id = target_user_id;
    ELSE
      -- Tylko updated_at
      UPDATE user_accounts 
      SET updated_at = NOW()
      WHERE user_id = target_user_id;
    END IF;
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
