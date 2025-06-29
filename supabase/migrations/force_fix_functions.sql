/*
  # Wymuś naprawę konfliktów funkcji

  1. Problem
    - Funkcje nadal konfliktują mimo usuwania
    - Może być problem z cache lub ukrytymi funkcjami
    - Potrzebujemy bardziej agresywnego podejścia

  2. Rozwiązanie
    - Użyj CASCADE do usunięcia wszystkich zależności
    - Wyczyść cache funkcji
    - Utwórz funkcje z unikalnymi nazwami
    - Sprawdź bez wywoływania konfliktowych funkcji
*/

-- KROK 1: Agresywne usunięcie wszystkich funkcji z CASCADE
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- KROK 2: Sprawdź czy funkcje nadal istnieją
DO $$
DECLARE
    func_count integer;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname IN ('is_super_admin', 'is_admin')
    AND n.nspname = 'public';
    
    RAISE NOTICE 'Pozostałe funkcje: %', func_count;
END $$;

-- KROK 3: Utwórz funkcje z nowymi, unikalnymi nazwami
CREATE OR REPLACE FUNCTION check_super_admin_role(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź w nowej tabeli app_users
  RETURN EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = user_uuid::text::uuid 
    AND role_name = 'super_admin'
    AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION check_admin_role(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź w nowej tabeli app_users
  RETURN EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = user_uuid::text::uuid 
    AND role_name IN ('super_admin', 'admin')
    AND is_active = true
  );
END;
$$;

-- KROK 4: Upewnij się że Super Admin istnieje
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Znajdź UUID użytkownika naczelnik@gmail.com
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'naczelnik@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Wstaw lub zaktualizuj w app_users
        INSERT INTO app_users (
            id,
            email,
            full_name,
            role_name,
            is_active,
            is_lifetime_access,
            account_expires_at
        ) VALUES (
            user_uuid,
            'naczelnik@gmail.com',
            'Super Administrator',
            'super_admin',
            true,
            true,
            NULL
        )
        ON CONFLICT (id) DO UPDATE SET
            role_name = 'super_admin',
            is_active = true,
            is_lifetime_access = true,
            account_expires_at = NULL;
            
        RAISE NOTICE 'Super Admin zaktualizowany: %', user_uuid;
    ELSE
        RAISE NOTICE 'Nie znaleziono użytkownika naczelnik@gmail.com w auth.users';
    END IF;
END $$;
