/*
  # Ustawienie domyślnej ważności dla istniejących użytkowników

  1. Aktualizacja danych
    - Super Admin: dożywotni dostęp (NULL)
    - Inni użytkownicy: roczny dostęp
*/

-- Ustaw domyślną ważność dla istniejących użytkowników
UPDATE profiles SET
  account_expires_at = CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = profiles.id 
      AND r.name = 'super_admin' 
      AND ur.is_active = true
    ) THEN NULL  -- Super Admin ma dożywotni dostęp
    ELSE now() + interval '1 year'  -- Inni mają roczny dostęp
  END
WHERE account_expires_at IS NULL;
