/*
  # Naprawa systemu Super Admin

  1. Funkcje pomocnicze
    - Sprawdzenie istnienia Super Admin
    - Przydzielenie roli Super Admin
    - Sprawdzenie statusu Super Admin
  
  2. Bezpieczeństwo
    - Aktualizacja polityk RLS
    - Naprawa uprawnień
  
  3. Dane testowe
    - Upewnienie się, że role systemowe istnieją
    - Upewnienie się, że uprawnienia istnieją
*/

-- Funkcja sprawdzająca czy Super Admin istnieje
CREATE OR REPLACE FUNCTION check_super_admin_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'super_admin'
  );
END;
$$;

-- Funkcja przydzielająca rolę Super Admin
CREATE OR REPLACE FUNCTION assign_super_admin_role(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid uuid;
  super_admin_role_id uuid;
BEGIN
  -- Znajdź użytkownika po emailu
  SELECT au.id INTO user_uuid
  FROM auth.users au
  WHERE au.email = user_email;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Znajdź rolę super_admin
  SELECT id INTO super_admin_role_id
  FROM roles
  WHERE name = 'super_admin';
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found';
  END IF;
  
  -- Usuń istniejące role użytkownika
  DELETE FROM user_roles WHERE user_id = user_uuid;
  
  -- Przydziel rolę super_admin
  INSERT INTO user_roles (user_id, role_id)
  VALUES (user_uuid, super_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  -- Upewnij się, że profil istnieje
  INSERT INTO profiles (id, email, full_name)
  VALUES (user_uuid, user_email, 'Artur Ścibisz')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  
  RETURN true;
END;
$$;

-- Funkcja sprawdzająca czy użytkownik jest Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
  );
END;
$$;

-- Upewnij się, że role systemowe istnieją
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Super Administrator - pełny dostęp do systemu'),
  ('admin', 'Administrator - zarządzanie użytkownikami i systemem'),
  ('user', 'Użytkownik - standardowy dostęp'),
  ('viewer', 'Przeglądający - tylko odczyt')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- Upewnij się, że uprawnienia istnieją
INSERT INTO permissions (name, description, resource, action) VALUES
  ('users.create', 'Tworzenie użytkowników', 'users', 'create'),
  ('users.read', 'Odczyt użytkowników', 'users', 'read'),
  ('users.update', 'Aktualizacja użytkowników', 'users', 'update'),
  ('users.delete', 'Usuwanie użytkowników', 'users', 'delete'),
  ('roles.create', 'Tworzenie ról', 'roles', 'create'),
  ('roles.read', 'Odczyt ról', 'roles', 'read'),
  ('roles.update', 'Aktualizacja ról', 'roles', 'update'),
  ('roles.delete', 'Usuwanie ról', 'roles', 'delete'),
  ('flows.create', 'Tworzenie przepływów', 'flows', 'create'),
  ('flows.read', 'Odczyt przepływów', 'flows', 'read'),
  ('flows.update', 'Aktualizacja przepływów', 'flows', 'update'),
  ('flows.delete', 'Usuwanie przepływów', 'flows', 'delete'),
  ('funnels.create', 'Tworzenie lejków', 'funnels', 'create'),
  ('funnels.read', 'Odczyt lejków', 'funnels', 'read'),
  ('funnels.update', 'Aktualizacja lejków', 'funnels', 'update'),
  ('funnels.delete', 'Usuwanie lejków', 'funnels', 'delete'),
  ('integrations.create', 'Tworzenie integracji', 'integrations', 'create'),
  ('integrations.read', 'Odczyt integracji', 'integrations', 'read'),
  ('integrations.update', 'Aktualizacja integracji', 'integrations', 'update'),
  ('integrations.delete', 'Usuwanie integracji', 'integrations', 'delete'),
  ('templates.create', 'Tworzenie szablonów', 'templates', 'create'),
  ('templates.read', 'Odczyt szablonów', 'templates', 'read'),
  ('templates.update', 'Aktualizacja szablonów', 'templates', 'update'),
  ('templates.delete', 'Usuwanie szablonów', 'templates', 'delete'),
  ('analytics.read', 'Odczyt analityki', 'analytics', 'read'),
  ('system.admin', 'Administracja systemu', 'system', 'admin'),
  ('billing.read', 'Odczyt rozliczeń', 'billing', 'read'),
  ('billing.update', 'Aktualizacja rozliczeń', 'billing', 'update'),
  ('support.read', 'Odczyt wsparcia', 'support', 'read')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Przydziel wszystkie uprawnienia do roli super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'super_admin'),
  p.id
FROM permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Przydziel podstawowe uprawnienia do roli admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'admin'),
  p.id
FROM permissions p
WHERE p.name IN (
  'users.read', 'users.update',
  'roles.read',
  'flows.create', 'flows.read', 'flows.update', 'flows.delete',
  'funnels.create', 'funnels.read', 'funnels.update', 'funnels.delete',
  'integrations.create', 'integrations.read', 'integrations.update', 'integrations.delete',
  'templates.create', 'templates.read', 'templates.update', 'templates.delete',
  'analytics.read',
  'support.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Przydziel podstawowe uprawnienia do roli user
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'user'),
  p.id
FROM permissions p
WHERE p.name IN (
  'flows.create', 'flows.read', 'flows.update', 'flows.delete',
  'funnels.create', 'funnels.read', 'funnels.update', 'funnels.delete',
  'integrations.read', 'integrations.update',
  'templates.read',
  'analytics.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Przydziel uprawnienia tylko do odczytu dla roli viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'viewer'),
  p.id
FROM permissions p
WHERE p.name IN (
  'flows.read',
  'funnels.read',
  'integrations.read',
  'templates.read',
  'analytics.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Aktualizuj polityki RLS dla lepszego bezpieczeństwa
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_super_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_super_admin());

-- Polityki dla ról (tylko Super Admin może zarządzać)
DROP POLICY IF EXISTS "Super admin can manage roles" ON roles;
CREATE POLICY "Super admin can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admin can manage user roles" ON user_roles;
CREATE POLICY "Super admin can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admin can manage permissions" ON permissions;
CREATE POLICY "Super admin can manage permissions"
  ON permissions
  FOR ALL
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admin can manage role permissions" ON role_permissions;
CREATE POLICY "Super admin can manage role permissions"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (is_super_admin());

-- Upewnij się, że alokacje zasobów istnieją
INSERT INTO resource_allocations (name, description, max_flows, max_funnels, max_integrations, max_templates, max_users) VALUES
  ('unlimited', 'Nieograniczone zasoby dla Super Admin', -1, -1, -1, -1, -1),
  ('enterprise', 'Plan Enterprise', 1000, 500, 100, 200, 50),
  ('professional', 'Plan Professional', 100, 50, 20, 50, 10),
  ('basic', 'Plan Basic', 10, 5, 5, 10, 3)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  max_flows = EXCLUDED.max_flows,
  max_funnels = EXCLUDED.max_funnels,
  max_integrations = EXCLUDED.max_integrations,
  max_templates = EXCLUDED.max_templates,
  max_users = EXCLUDED.max_users;
