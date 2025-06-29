/*
  # Bezpośrednia weryfikacja ról bez funkcji

  1. Problem
    - Funkcje nie mogą być utworzone w tym środowisku
    - Potrzebujemy bezpośredniego dostępu do ról

  2. Rozwiązanie
    - Użyj bezpośrednich zapytań SELECT
    - Sprawdź role bezpośrednio w tabeli app_users
    - Upewnij się że Super Admin istnieje
*/

-- KROK 1: Upewnij się że Super Admin istnieje w app_users
DO $$
DECLARE
    user_uuid uuid;
    existing_user_id uuid;
BEGIN
    -- Znajdź UUID użytkownika naczelnik@gmail.com w auth.users
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'naczelnik@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Sprawdź czy już istnieje w app_users
        SELECT id INTO existing_user_id
        FROM app_users 
        WHERE id = user_uuid;
        
        IF existing_user_id IS NULL THEN
            -- Wstaw nowego Super Admina
            INSERT INTO app_users (
                id,
                email,
                full_name,
                role_name,
                is_active,
                is_lifetime_access,
                account_expires_at,
                created_at,
                updated_at
            ) VALUES (
                user_uuid,
                'naczelnik@gmail.com',
                'Super Administrator',
                'super_admin',
                true,
                true,
                NULL,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Super Admin utworzony: %', user_uuid;
        ELSE
            -- Zaktualizuj istniejącego
            UPDATE app_users SET
                role_name = 'super_admin',
                is_active = true,
                is_lifetime_access = true,
                account_expires_at = NULL,
                updated_at = NOW()
            WHERE id = user_uuid;
            
            RAISE NOTICE 'Super Admin zaktualizowany: %', user_uuid;
        END IF;
    ELSE
        RAISE NOTICE 'Nie znaleziono użytkownika naczelnik@gmail.com w auth.users';
    END IF;
END $$;

-- KROK 2: Sprawdź czy tabela app_users ma poprawną strukturę
DO $$
DECLARE
    table_exists boolean;
    column_count integer;
BEGIN
    -- Sprawdź czy tabela istnieje
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_users'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Policz kolumny
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'app_users';
        
        RAISE NOTICE 'Tabela app_users istnieje z % kolumnami', column_count;
    ELSE
        RAISE NOTICE 'Tabela app_users NIE ISTNIEJE!';
    END IF;
END $$;
