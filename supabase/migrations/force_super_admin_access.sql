/*
  # Wymuś dostęp Super Admina bez sprawdzania ról

  1. Problem
    - Funkcje sprawdzania ról nie działają
    - Użytkownik ma standardowe konto zamiast Super Admin
    - Niechciane wyświetlanie statusu ról

  2. Rozwiązanie
    - Wymuś Super Admin w bazie danych
    - Usuń sprawdzanie ról z interfejsu
    - Zapewnij pełny dostęp
*/

-- KROK 1: Wymuś Super Admin dla naczelnik@gmail.com
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Znajdź użytkownika w auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'naczelnik@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Usuń istniejący rekord jeśli istnieje
        DELETE FROM app_users WHERE id = target_user_id;
        
        -- Wstaw nowy rekord Super Admina
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
            target_user_id,
            'naczelnik@gmail.com',
            'Super Administrator',
            'super_admin',
            true,
            true,
            NULL,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Super Admin WYMUSZONY dla: %', target_user_id;
    ELSE
        RAISE NOTICE 'Nie znaleziono użytkownika naczelnik@gmail.com';
    END IF;
END $$;

-- KROK 2: Sprawdź czy Super Admin został utworzony
DO $$
DECLARE
    admin_count integer;
    admin_role text;
BEGIN
    SELECT COUNT(*), MAX(role_name) INTO admin_count, admin_role
    FROM app_users 
    WHERE email = 'naczelnik@gmail.com' AND role_name = 'super_admin';
    
    RAISE NOTICE 'Super Admin count: %, role: %', admin_count, admin_role;
END $$;
