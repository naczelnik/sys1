/*
  # Triggery dla automatycznego zarządzania ważnością konta

  1. Triggery
    - Automatyczne ustawianie ważności dla nowych użytkowników
    - Automatyczne przypisywanie roli 'user'
*/

-- Funkcja do ustawiania domyślnej ważności konta (1 rok)
CREATE OR REPLACE FUNCTION set_default_account_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Jeśli to nowy profil i nie ma ustawionej daty ważności
  IF NEW.account_expires_at IS NULL THEN
    -- Super Admin ma dożywotni dostęp (NULL = bez ograniczeń)
    IF EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = NEW.id 
      AND r.name = 'super_admin' 
      AND ur.is_active = true
    ) THEN
      NEW.account_expires_at = NULL;
    ELSE
      -- Standardowi użytkownicy mają roczny dostęp
      NEW.account_expires_at = now() + interval '1 year';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Funkcja do automatycznego przypisywania roli 'user' nowym użytkownikom
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_id uuid;
BEGIN
  -- Pobierz ID roli 'user'
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  
  -- Przypisz rolę 'user' jeśli użytkownik nie ma żadnej roli
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = NEW.id
  ) THEN
    INSERT INTO user_roles (user_id, role_id, is_active)
    VALUES (NEW.id, user_role_id, true);
  END IF;

  RETURN NEW;
END;
$$;

-- Dodaj trigger dla automatycznego ustawiania ważności
DROP TRIGGER IF EXISTS set_account_expiration_trigger ON profiles;
CREATE TRIGGER set_account_expiration_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_default_account_expiration();

-- Dodaj trigger dla automatycznego przypisywania roli
DROP TRIGGER IF EXISTS assign_default_role_trigger ON profiles;
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_default_user_role();
