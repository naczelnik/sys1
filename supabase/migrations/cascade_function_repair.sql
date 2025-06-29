/*
  # Naprawa funkcji PostgreSQL z CASCADE

  1. Usunięcie funkcji z CASCADE
    - DROP CASCADE wszystkich konfliktowych funkcji
    - Automatyczne usunięcie zależnych polityk
  
  2. Odtworzenie funkcji
    - Nowe funkcje z poprawnymi sygnaturami
    - Zachowanie funkcjonalności
  
  3. Odtworzenie polityk RLS
    - Wszystkie polityki bezpieczeństwa
    - Pełna funkcjonalność Super Admin
*/

-- Krok 1: Usuń wszystkie istniejące funkcje z CASCADE (usuwa też zależne polityki)
DROP FUNCTION IF EXISTS assign_super_admin_role(text) CASCADE;
DROP FUNCTION IF EXISTS check_super_admin_exists() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS has_permission(text) CASCADE;
DROP FUNCTION IF EXISTS has_permission(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS list_super_admins() CASCADE;

-- Krok 1.5: Usuń wszystkie istniejące polityki, które mogły zostać
DROP POLICY IF EXISTS "Super admin can manage all roles" ON roles;
DROP POLICY IF EXISTS "Users can view roles" ON roles;
DROP POLICY IF EXISTS "Super admin can manage all permissions" ON permissions;
DROP POLICY IF EXISTS "Users can view permissions" ON permissions;
DROP POLICY IF EXISTS "Super admin can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Super admin can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin can manage resource allocations" ON resource_allocations;
DROP POLICY IF EXISTS "Users can view own resource allocations" ON resource_allocations;
DROP POLICY IF EXISTS "Users can manage flows" ON flows;
DROP POLICY IF EXISTS "Users can manage funnels" ON funnels;
DROP POLICY IF EXISTS "Users can manage integrations" ON integrations;
DROP POLICY IF EXISTS "Users can manage templates" ON templates;
DROP POLICY IF EXISTS "Users can manage analytics" ON analytics;
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;

-- Krok 2: Odtwórz funkcje z poprawnymi sygnaturami

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
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
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
  
  -- Usuń istniejące role użytkownika (oprócz super_admin)
  DELETE FROM user_roles 
  WHERE user_id = user_uuid 
  AND role_id != super_admin_role_id;
  
  -- Przydziel rolę super_admin
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (user_uuid, super_admin_role_id, user_uuid, true)
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = now(),
    assigned_by = user_uuid;
  
  -- Upewnij się, że profil istnieje
  INSERT INTO profiles (id, email, full_name)
  VALUES (user_uuid, user_email, 'Artur Ścibisz')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  
  -- Ustaw nieograniczone zasoby dla Super Admin
  INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by)
  VALUES 
    (user_uuid, 'flows', -1, user_uuid),
    (user_uuid, 'funnels', -1, user_uuid),
    (user_uuid, 'integrations', -1, user_uuid),
    (user_uuid, 'templates', -1, user_uuid),
    (user_uuid, 'users', -1, user_uuid),
    (user_uuid, 'storage', -1, user_uuid)
  ON CONFLICT (user_id, resource_type) DO UPDATE SET
    resource_limit = -1,
    allocated_by = user_uuid,
    allocated_at = now();
  
  RETURN true;
END;
$$;

-- Funkcja sprawdzająca czy użytkownik jest Super Admin (bez parametru)
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
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$;

-- Funkcja sprawdzająca czy konkretny użytkownik jest Super Admin (z parametrem)
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND r.name = 'super_admin'
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$;

-- Funkcja sprawdzająca uprawnienia użytkownika
CREATE OR REPLACE FUNCTION has_permission(permission_name text, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Super admin ma wszystkie uprawnienia
  IF is_super_admin(user_uuid) THEN
    RETURN true;
  END IF;

  -- Sprawdź konkretne uprawnienie
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid 
    AND p.name = permission_name
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$;

-- Funkcja listująca wszystkich Super Admin
CREATE OR REPLACE FUNCTION list_super_admins()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  assigned_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', 'Unknown') as full_name,
    ur.assigned_at
  FROM auth.users au
  JOIN user_roles ur ON au.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  LEFT JOIN profiles p ON au.id = p.id
  WHERE r.name = 'super_admin' 
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ORDER BY ur.assigned_at;
END;
$$;

-- Krok 3: Upewnij się, że role systemowe istnieją
INSERT INTO roles (name, description, is_system_role) VALUES
  ('super_admin', 'Super Administrator - pełny dostęp do systemu', true),
  ('admin', 'Administrator - zarządzanie użytkownikami i systemem', true),
  ('user', 'Użytkownik - standardowy dostęp', true),
  ('viewer', 'Przeglądający - tylko odczyt', true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role;

-- Krok 4: Upewnij się, że uprawnienia istnieją
INSERT INTO permissions (name, description, resource, action) VALUES
  ('users.create', 'Tworzenie użytkowników', 'users', 'create'),
  ('users.read', 'Odczyt użytkowników', 'users', 'read'),
  ('users.update', 'Aktualizacja użytkowników', 'users', 'update'),
  ('users.delete', 'Usuwanie użytkowników', 'users', 'delete'),
  ('users.manage_roles', 'Zarządzanie rolami użytkowników', 'users', 'manage_roles'),
  ('roles.create', 'Tworzenie ról', 'roles', 'create'),
  ('roles.read', 'Odczyt ról', 'roles', 'read'),
  ('roles.update', 'Aktualizacja ról', 'roles', 'update'),
  ('roles.delete', 'Usuwanie ról', 'roles', 'delete'),
  ('permissions.manage', 'Zarządzanie uprawnieniami', 'permissions', 'manage'),
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
  ('resources.allocate', 'Alokacja zasobów', 'resources', 'allocate'),
  ('billing.read', 'Odczyt rozliczeń', 'billing', 'read'),
  ('billing.update', 'Aktualizacja rozliczeń', 'billing', 'update'),
  ('support.read', 'Odczyt wsparcia', 'support', 'read')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Krok 5: Przydziel wszystkie uprawnienia do roli super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'super_admin'),
  p.id
FROM permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Krok 6: Przydziel podstawowe uprawnienia do innych ról
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

-- Krok 7: Odtwórz wszystkie polityki RLS (po upewnieniu się, że nie istnieją)

-- Polityki dla tabeli roles
CREATE POLICY "Super admin can manage all roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Polityki dla tabeli permissions
CREATE POLICY "Super admin can manage all permissions"
  ON permissions
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Polityki dla tabeli role_permissions
CREATE POLICY "Super admin can manage role permissions"
  ON role_permissions
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Polityki dla tabeli user_roles
CREATE POLICY "Super admin can manage all user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_super_admin());

-- Polityki dla tabeli resource_allocations
CREATE POLICY "Super admin can manage resource allocations"
  ON resource_allocations
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own resource allocations"
  ON resource_allocations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_super_admin());

-- Polityki dla tabeli flows
CREATE POLICY "Users can manage flows"
  ON flows
  FOR ALL
  TO authenticated
  USING (is_super_admin() OR auth.uid() = user_id)
  WITH CHECK (is_super_admin() OR auth.uid() = user_id);

-- Polityki dla tabeli funnels
CREATE POLICY "Users can manage funnels"
  ON funnels
  FOR ALL
  TO authenticated
  USING (is_super_admin() OR auth.uid() = user_id)
  WITH CHECK (is_super_admin() OR auth.uid() = user_id);

-- Polityki dla tabeli integrations
CREATE POLICY "Users can manage integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (is_super_admin() OR auth.uid() = user_id)
  WITH CHECK (is_super_admin() OR auth.uid() = user_id);

-- Polityki dla tabeli templates
CREATE POLICY "Users can manage templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (is_super_admin() OR auth.uid() = user_id OR is_public = true)
  WITH CHECK (is_super_admin() OR auth.uid() = user_id);

-- Polityki dla tabeli analytics
CREATE POLICY "Users can manage analytics"
  ON analytics
  FOR ALL
  TO authenticated
  USING (is_super_admin() OR auth.uid() = user_id)
  WITH CHECK (is_super_admin() OR auth.uid() = user_id);

-- Polityki dla tabeli profiles
CREATE POLICY "Users can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_super_admin() OR auth.uid() = id);

CREATE POLICY "Users can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_super_admin() OR auth.uid() = id)
  WITH CHECK (is_super_admin() OR auth.uid() = id);

-- Krok 8: Przydziel rolę Super Admin do istniejącego użytkownika
DO $$
DECLARE
  user_uuid uuid;
  super_admin_role_id uuid;
BEGIN
  -- Znajdź użytkownika naczelnik@gmail.com
  SELECT au.id INTO user_uuid
  FROM auth.users au
  WHERE au.email = 'naczelnik@gmail.com';
  
  -- Znajdź rolę super_admin
  SELECT id INTO super_admin_role_id
  FROM roles
  WHERE name = 'super_admin';
  
  -- Jeśli użytkownik i rola istnieją, przydziel rolę
  IF user_uuid IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
    VALUES (user_uuid, super_admin_role_id, user_uuid, true)
    ON CONFLICT (user_id, role_id) DO UPDATE SET
      is_active = true,
      assigned_at = now(),
      assigned_by = user_uuid;
    
    -- Upewnij się, że profil istnieje
    INSERT INTO profiles (id, email, full_name)
    VALUES (user_uuid, 'naczelnik@gmail.com', 'Artur Ścibisz')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
    
    -- Ustaw nieograniczone zasoby
    INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by)
    VALUES 
      (user_uuid, 'flows', -1, user_uuid),
      (user_uuid, 'funnels', -1, user_uuid),
      (user_uuid, 'integrations', -1, user_uuid),
      (user_uuid, 'templates', -1, user_uuid),
      (user_uuid, 'users', -1, user_uuid),
      (user_uuid, 'storage', -1, user_uuid)
    ON CONFLICT (user_id, resource_type) DO UPDATE SET
      resource_limit = -1,
      allocated_by = user_uuid,
      allocated_at = now();
  END IF;
END $$;
