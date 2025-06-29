/*
  # Fix Super Admin Delete Permissions

  1. Problem
    - Super Admin nie może usuwać użytkowników
    - Funkcje uprawnień nie rozpoznają Super Admin statusu
    - Brak pełnych uprawnień dla Super Admin

  2. Solution
    - Napraw funkcję can_delete_user
    - Super Admin ma WSZYSTKIE uprawnienia
    - Błyskawiczne usuwanie bez ograniczeń
*/

-- Napraw funkcję sprawdzającą uprawnienia do usuwania
CREATE OR REPLACE FUNCTION can_delete_user(target_user_id uuid, current_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_is_super_admin boolean;
  current_is_super_admin boolean;
BEGIN
  -- Sprawdź czy obecny użytkownik jest Super Adminem
  current_is_super_admin := is_super_admin(current_user_id);
  
  -- SUPER ADMIN MA WSZYSTKIE UPRAWNIENIA!
  IF current_is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Sprawdź czy target jest Super Adminem
  target_is_super_admin := is_user_super_admin(target_user_id);
  
  -- Jeśli target jest Super Adminem, tylko Super Admin może go usunąć
  IF target_is_super_admin THEN
    RETURN false;
  END IF;
  
  -- W innych przypadkach sprawdź standardowe uprawnienia
  RETURN has_permission('users:delete', current_user_id);
END;
$$;

-- Napraw funkcję usuwania użytkownika
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  current_is_super_admin boolean;
  target_is_super_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Sprawdź czy obecny użytkownik jest Super Adminem
  current_is_super_admin := is_super_admin(current_user_id);
  
  -- SUPER ADMIN MOŻE USUNĄĆ KAŻDEGO!
  IF current_is_super_admin THEN
    -- Nie pozwól na usunięcie samego siebie
    IF target_user_id = current_user_id THEN
      RAISE EXCEPTION 'Nie możesz usunąć własnego konta';
    END IF;
    
    -- Super Admin może usunąć każdego innego użytkownika
    RETURN true;
  END IF;
  
  -- Dla innych użytkowników sprawdź standardowe uprawnienia
  IF NOT can_delete_user(target_user_id, current_user_id) THEN
    target_is_super_admin := is_user_super_admin(target_user_id);
    
    IF target_is_super_admin THEN
      RAISE EXCEPTION 'Tylko Super Administrator może usuwać innych Super Administratorów';
    ELSE
      RAISE EXCEPTION 'Brak uprawnień do usuwania użytkowników';
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Upewnij się że funkcja is_super_admin działa prawidłowo
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true 
    AND r.name = 'super_admin'
  );
END;
$$;

-- Dodaj funkcję sprawdzającą czy użytkownik ma jakiekolwiek uprawnienia administratora
CREATE OR REPLACE FUNCTION has_admin_privileges(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Super Admin ma wszystkie uprawnienia
  IF is_super_admin(user_uuid) THEN
    RETURN true;
  END IF;
  
  -- Sprawdź czy ma rolę admin
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true 
    AND r.name IN ('admin', 'super_admin')
  );
END;
$$;
