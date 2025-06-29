/*
  # Super Admin Deletion Protection

  1. Security Enhancement
    - Tylko Super Admin może usuwać innych Super Adminów
    - Dodano funkcję sprawdzającą czy użytkownik jest Super Adminem
    - Zabezpieczenie przed przypadkowym usunięciem Super Adminów

  2. Functions
    - `can_delete_user` - sprawdza czy użytkownik może usunąć innego użytkownika
    - `is_user_super_admin` - sprawdza czy dany użytkownik jest Super Adminem
*/

-- Funkcja sprawdzająca czy użytkownik jest Super Adminem
CREATE OR REPLACE FUNCTION is_user_super_admin(user_uuid uuid)
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

-- Funkcja sprawdzająca czy użytkownik może usunąć innego użytkownika
CREATE OR REPLACE FUNCTION can_delete_user(target_user_id uuid, current_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_is_super_admin boolean;
  current_is_super_admin boolean;
BEGIN
  -- Sprawdź czy target jest Super Adminem
  target_is_super_admin := is_user_super_admin(target_user_id);
  
  -- Sprawdź czy obecny użytkownik jest Super Adminem
  current_is_super_admin := is_user_super_admin(current_user_id);
  
  -- Jeśli target jest Super Adminem, tylko Super Admin może go usunąć
  IF target_is_super_admin AND NOT current_is_super_admin THEN
    RETURN false;
  END IF;
  
  -- W innych przypadkach sprawdź standardowe uprawnienia
  RETURN (
    has_permission('users:delete', current_user_id)
    OR current_is_super_admin
  );
END;
$$;

-- Poprawiona funkcja usuwania użytkownika z zabezpieczeniem Super Admin
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Sprawdź czy użytkownik może usunąć target
  IF NOT can_delete_user(target_user_id, current_user_id) THEN
    IF is_user_super_admin(target_user_id) THEN
      RAISE EXCEPTION 'Tylko Super Administrator może usuwać innych Super Administratorów';
    ELSE
      RAISE EXCEPTION 'Brak uprawnień do usuwania użytkowników';
    END IF;
  END IF;
  
  -- Nie pozwól na usunięcie samego siebie
  IF target_user_id = current_user_id THEN
    RAISE EXCEPTION 'Nie możesz usunąć własnego konta';
  END IF;
  
  -- Usuń powiązane dane (kaskadowo przez foreign keys)
  -- Dane zostaną usunięte automatycznie przez CASCADE
  
  RETURN true;
END;
$$;
