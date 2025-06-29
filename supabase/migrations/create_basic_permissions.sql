/*
  # Podstawowe uprawnienia systemu

  1. Nowe uprawnienia
    - Dodanie podstawowych uprawnień dla różnych sekcji aplikacji
    - Dashboard, przepływy, lejki, integracje, analityka, szablony, ustawienia
    - Uprawnienia administracyjne do zarządzania użytkownikami

  2. Przypisanie uprawnień do ról
    - Super Admin: wszystkie uprawnienia
    - Admin: większość uprawnień oprócz zarządzania Super Adminami
    - User: podstawowe uprawnienia do przeglądania i tworzenia
*/

-- Dodaj podstawowe uprawnienia jeśli nie istnieją
INSERT INTO permissions (name, description, resource, action) VALUES
  ('dashboard.view', 'Dostęp do dashboardu', 'dashboard', 'view'),
  ('flows.view', 'Przeglądanie przepływów', 'flows', 'view'),
  ('flows.create', 'Tworzenie przepływów', 'flows', 'create'),
  ('flows.edit', 'Edycja przepływów', 'flows', 'edit'),
  ('flows.delete', 'Usuwanie przepływów', 'flows', 'delete'),
  ('funnels.view', 'Przeglądanie lejków', 'funnels', 'view'),
  ('funnels.create', 'Tworzenie lejków', 'funnels', 'create'),
  ('funnels.edit', 'Edycja lejków', 'funnels', 'edit'),
  ('funnels.delete', 'Usuwanie lejków', 'funnels', 'delete'),
  ('integrations.view', 'Przeglądanie integracji', 'integrations', 'view'),
  ('integrations.manage', 'Zarządzanie integracjami', 'integrations', 'manage'),
  ('analytics.view', 'Dostęp do analityki', 'analytics', 'view'),
  ('templates.view', 'Przeglądanie szablonów', 'templates', 'view'),
  ('templates.create', 'Tworzenie szablonów', 'templates', 'create'),
  ('templates.edit', 'Edycja szablonów', 'templates', 'edit'),
  ('templates.delete', 'Usuwanie szablonów', 'templates', 'delete'),
  ('settings.view', 'Dostęp do ustawień', 'settings', 'view'),
  ('settings.edit', 'Edycja ustawień', 'settings', 'edit'),
  ('users.manage', 'Zarządzanie użytkownikami', 'users', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Przypisz wszystkie uprawnienia do roli super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Przypisz większość uprawnień do roli admin (oprócz zarządzania użytkownikami)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name IN (
  'dashboard.view',
  'flows.view', 'flows.create', 'flows.edit', 'flows.delete',
  'funnels.view', 'funnels.create', 'funnels.edit', 'funnels.delete',
  'integrations.view', 'integrations.manage',
  'analytics.view',
  'templates.view', 'templates.create', 'templates.edit', 'templates.delete',
  'settings.view', 'settings.edit',
  'users.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Przypisz podstawowe uprawnienia do roli user
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user'
AND p.name IN (
  'dashboard.view',
  'flows.view', 'flows.create', 'flows.edit',
  'funnels.view', 'funnels.create', 'funnels.edit',
  'integrations.view',
  'analytics.view',
  'templates.view',
  'settings.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
