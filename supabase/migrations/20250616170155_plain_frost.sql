/*
  # Complete Business Management Platform Schema

  1. New Tables
    - `users` - User accounts with authentication
    - `roles` - System roles (Super Admin, Company Admin, Site Manager, Commercial)
    - `permissions` - System permissions for fine-grained access control
    - `companies` - Business entities/tenants
    - `sites` - Physical locations belonging to companies
    - `user_roles` - Junction table linking users to roles with company/site context
    - `role_permissions` - Junction table linking roles to permissions
    - `clients` - Customer/prospect records
    - `proposals` - Sales proposals created for clients
    - `sales` - Closed deals/sales records
    - `activity_logs` - Audit trail of user actions

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for role-based access
    - Implement hierarchical access control

  3. Sample Data
    - Create test users for each role level
    - Add sample companies, sites, clients, proposals, and sales
    - Populate activity logs for realistic dashboard data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  level integer NOT NULL, -- 1=Super Admin, 2=Company Admin, 3=Site Manager, 4=Commercial
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  status text DEFAULT 'prospect',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount decimal(12,2) NOT NULL,
  status text DEFAULT 'draft',
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  closed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  amount decimal(12,2) NOT NULL,
  commission decimal(12,2),
  closed_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_site_id ON user_roles(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_company_id ON sites(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_site_id ON clients(site_id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_proposal_id ON sales(proposal_id);
CREATE INDEX IF NOT EXISTS idx_sales_closed_by ON sales(closed_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Insert roles
INSERT INTO roles (name, description, level) VALUES
  ('Super Admin', 'Full system access across all companies and sites', 1),
  ('Company Admin', 'Full access within assigned company', 2),
  ('Site Manager', 'Management access within assigned site', 3),
  ('Commercial', 'Sales and client management within assigned site', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('manage_users_global', 'Create, update, delete users globally', 'users', 'manage_global'),
  ('manage_users_company', 'Create, update, delete users within company', 'users', 'manage_company'),
  ('manage_users_site', 'Create, update, delete users within site', 'users', 'manage_site'),
  ('manage_companies', 'Create, update, delete companies', 'companies', 'manage'),
  ('manage_sites_global', 'Create, update, delete sites globally', 'sites', 'manage_global'),
  ('manage_sites_company', 'Create, update, delete sites within company', 'sites', 'manage_company'),
  ('manage_clients_global', 'Manage all clients globally', 'clients', 'manage_global'),
  ('manage_clients_company', 'Manage clients within company', 'clients', 'manage_company'),
  ('manage_clients_site', 'Manage clients within site', 'clients', 'manage_site'),
  ('manage_clients_personal', 'Manage own assigned clients', 'clients', 'manage_personal'),
  ('view_reports_global', 'View all reports globally', 'reports', 'view_global'),
  ('view_reports_company', 'View reports within company', 'reports', 'view_company'),
  ('view_reports_site', 'View reports within site', 'reports', 'view_site'),
  ('view_reports_personal', 'View personal reports', 'reports', 'view_personal')
ON CONFLICT (name) DO NOTHING;

-- Link roles to permissions
DO $$
DECLARE
  super_admin_id uuid;
  company_admin_id uuid;
  site_manager_id uuid;
  commercial_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM roles WHERE name = 'Super Admin';
  SELECT id INTO company_admin_id FROM roles WHERE name = 'Company Admin';
  SELECT id INTO site_manager_id FROM roles WHERE name = 'Site Manager';
  SELECT id INTO commercial_id FROM roles WHERE name = 'Commercial';

  -- Super Admin gets all permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT super_admin_id, id FROM permissions
  ON CONFLICT DO NOTHING;

  -- Company Admin permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT company_admin_id, id FROM permissions 
  WHERE action IN ('manage_company', 'view_company', 'manage')
  ON CONFLICT DO NOTHING;

  -- Site Manager permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT site_manager_id, id FROM permissions 
  WHERE action IN ('manage_site', 'view_site')
  ON CONFLICT DO NOTHING;

  -- Commercial permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT commercial_id, id FROM permissions 
  WHERE action IN ('manage_personal', 'view_personal')
  ON CONFLICT DO NOTHING;
END $$;

-- Insert sample data
DO $$
DECLARE
  super_admin_role_id uuid;
  company_admin_role_id uuid;
  site_manager_role_id uuid;
  commercial_role_id uuid;
  
  super_admin_user_id uuid;
  company_admin_user_id uuid;
  site_manager_user_id uuid;
  commercial_user_id uuid;
  
  company1_id uuid;
  company2_id uuid;
  
  site1_id uuid;
  site2_id uuid;
  site3_id uuid;
  
  client1_id uuid;
  client2_id uuid;
  client3_id uuid;
  client4_id uuid;
  
  proposal1_id uuid;
  proposal2_id uuid;
  proposal3_id uuid;
  proposal4_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Admin';
  SELECT id INTO company_admin_role_id FROM roles WHERE name = 'Company Admin';
  SELECT id INTO site_manager_role_id FROM roles WHERE name = 'Site Manager';
  SELECT id INTO commercial_role_id FROM roles WHERE name = 'Commercial';

  -- Insert users with bcrypt hashed passwords (password123)
  INSERT INTO users (id, email, password_hash, first_name, last_name, phone) VALUES
    (gen_random_uuid(), 'superadmin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super', 'Admin', '+1234567890'),
    (gen_random_uuid(), 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Company', 'Admin', '+1234567891'),
    (gen_random_uuid(), 'amine@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Amine', 'Manager', '+1234567892'),
    (gen_random_uuid(), 'soukaina@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Soukaina', 'Commercial', '+1234567893')
  ON CONFLICT (email) DO NOTHING;

  -- Get user IDs
  SELECT id INTO super_admin_user_id FROM users WHERE email = 'superadmin@example.com';
  SELECT id INTO company_admin_user_id FROM users WHERE email = 'admin@example.com';
  SELECT id INTO site_manager_user_id FROM users WHERE email = 'amine@example.com';
  SELECT id INTO commercial_user_id FROM users WHERE email = 'soukaina@example.com';

  -- Insert companies
  INSERT INTO companies (id, name, description, address, phone, email) VALUES
    (gen_random_uuid(), 'TechCorp Solutions', 'Leading technology solutions provider', '123 Tech Street, Silicon Valley, CA', '+1-555-0100', 'info@techcorp.com'),
    (gen_random_uuid(), 'Global Industries', 'International manufacturing and distribution', '456 Industrial Blvd, Detroit, MI', '+1-555-0200', 'contact@globalind.com')
  RETURNING id INTO company1_id;

  -- Get company IDs
  SELECT id INTO company1_id FROM companies WHERE name = 'TechCorp Solutions';
  SELECT id INTO company2_id FROM companies WHERE name = 'Global Industries';

  -- Insert sites
  INSERT INTO sites (id, company_id, name, description, address, phone) VALUES
    (gen_random_uuid(), company1_id, 'TechCorp HQ', 'Main headquarters and R&D center', '123 Tech Street, Silicon Valley, CA', '+1-555-0101'),
    (gen_random_uuid(), company1_id, 'TechCorp East', 'East coast sales office', '789 Business Ave, New York, NY', '+1-555-0102'),
    (gen_random_uuid(), company2_id, 'Global Manufacturing', 'Main production facility', '456 Industrial Blvd, Detroit, MI', '+1-555-0201')
  RETURNING id INTO site1_id;

  -- Get site IDs
  SELECT id INTO site1_id FROM sites WHERE name = 'TechCorp HQ';
  SELECT id INTO site2_id FROM sites WHERE name = 'TechCorp East';
  SELECT id INTO site3_id FROM sites WHERE name = 'Global Manufacturing';

  -- Assign user roles
  INSERT INTO user_roles (user_id, role_id, company_id, site_id, assigned_by) VALUES
    (super_admin_user_id, super_admin_role_id, NULL, NULL, super_admin_user_id),
    (company_admin_user_id, company_admin_role_id, company1_id, NULL, super_admin_user_id),
    (site_manager_user_id, site_manager_role_id, company1_id, site1_id, company_admin_user_id),
    (commercial_user_id, commercial_role_id, company1_id, site1_id, site_manager_user_id)
  ON CONFLICT DO NOTHING;

  -- Insert clients
  INSERT INTO clients (id, company_id, site_id, assigned_to, name, email, phone, address, status) VALUES
    (gen_random_uuid(), company1_id, site1_id, commercial_user_id, 'Acme Corporation', 'contact@acme.com', '+1-555-1001', '100 Business Plaza, Los Angeles, CA', 'active'),
    (gen_random_uuid(), company1_id, site1_id, commercial_user_id, 'Beta Industries', 'info@beta.com', '+1-555-1002', '200 Commerce St, San Francisco, CA', 'prospect'),
    (gen_random_uuid(), company1_id, site2_id, NULL, 'Gamma Enterprises', 'hello@gamma.com', '+1-555-1003', '300 Trade Center, Boston, MA', 'prospect'),
    (gen_random_uuid(), company2_id, site3_id, NULL, 'Delta Manufacturing', 'sales@delta.com', '+1-555-1004', '400 Factory Rd, Chicago, IL', 'active')
  RETURNING id INTO client1_id;

  -- Get client IDs
  SELECT id INTO client1_id FROM clients WHERE name = 'Acme Corporation';
  SELECT id INTO client2_id FROM clients WHERE name = 'Beta Industries';
  SELECT id INTO client3_id FROM clients WHERE name = 'Gamma Enterprises';
  SELECT id INTO client4_id FROM clients WHERE name = 'Delta Manufacturing';

  -- Insert proposals
  INSERT INTO proposals (id, client_id, created_by, title, description, amount, status, valid_until) VALUES
    (gen_random_uuid(), client1_id, commercial_user_id, 'Enterprise Software Solution', 'Complete ERP system implementation', 150000.00, 'closed', now() + interval '30 days'),
    (gen_random_uuid(), client2_id, commercial_user_id, 'Cloud Migration Services', 'Migration to cloud infrastructure', 75000.00, 'pending', now() + interval '45 days'),
    (gen_random_uuid(), client3_id, site_manager_user_id, 'Digital Transformation', 'Complete digital overhaul', 200000.00, 'draft', now() + interval '60 days'),
    (gen_random_uuid(), client4_id, company_admin_user_id, 'Manufacturing Automation', 'Automated production line setup', 500000.00, 'pending', now() + interval '90 days')
  RETURNING id INTO proposal1_id;

  -- Get proposal IDs
  SELECT id INTO proposal1_id FROM proposals WHERE title = 'Enterprise Software Solution';
  SELECT id INTO proposal2_id FROM proposals WHERE title = 'Cloud Migration Services';
  SELECT id INTO proposal3_id FROM proposals WHERE title = 'Digital Transformation';
  SELECT id INTO proposal4_id FROM proposals WHERE title = 'Manufacturing Automation';

  -- Insert sales (closed deals)
  INSERT INTO sales (proposal_id, closed_by, amount, commission, notes) VALUES
    (proposal1_id, commercial_user_id, 150000.00, 15000.00, 'Closed after successful demo and negotiation'),
    (proposal2_id, commercial_user_id, 75000.00, 7500.00, 'Quick close due to urgent timeline');

  -- Insert activity logs
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details) VALUES
    (super_admin_user_id, 'login', 'auth', NULL, '{"email": "superadmin@example.com"}'),
    (company_admin_user_id, 'login', 'auth', NULL, '{"email": "admin@example.com"}'),
    (site_manager_user_id, 'login', 'auth', NULL, '{"email": "amine@example.com"}'),
    (commercial_user_id, 'login', 'auth', NULL, '{"email": "soukaina@example.com"}'),
    (commercial_user_id, 'create', 'client', client1_id, '{"client_name": "Acme Corporation"}'),
    (commercial_user_id, 'create', 'proposal', proposal1_id, '{"proposal_title": "Enterprise Software Solution", "amount": 150000}'),
    (commercial_user_id, 'close', 'sale', proposal1_id, '{"amount": 150000, "commission": 15000}'),
    (site_manager_user_id, 'create', 'proposal', proposal3_id, '{"proposal_title": "Digital Transformation", "amount": 200000}'),
    (company_admin_user_id, 'create', 'proposal', proposal4_id, '{"proposal_title": "Manufacturing Automation", "amount": 500000}'),
    (super_admin_user_id, 'create', 'company', company2_id, '{"company_name": "Global Industries"}');

END $$;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Super admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND r.name = 'Super Admin'
      AND ur.is_active = true
    )
  );

-- Companies policies
CREATE POLICY "Super admins can manage all companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND r.name = 'Super Admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Company admins can view their company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.company_id = companies.id
      AND ur.is_active = true
    )
  );

-- Sites policies
CREATE POLICY "Super admins can manage all sites" ON sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND r.name = 'Super Admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Company admins can manage their company sites" ON sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.company_id = sites.company_id
      AND r.name = 'Company Admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Site managers can view their site" ON sites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.site_id = sites.id
      AND ur.is_active = true
    )
  );

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Super admins can manage all user roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND r.name = 'Super Admin'
      AND ur.is_active = true
    )
  );

-- Clients policies
CREATE POLICY "Users can view clients in their scope" ON clients
  FOR SELECT USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND r.name = 'Super Admin'
      AND ur.is_active = true
    )
    OR
    -- Company admin can see company clients
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.company_id = clients.company_id
      AND r.name = 'Company Admin'
      AND ur.is_active = true
    )
    OR
    -- Site manager can see site clients
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.site_id = clients.site_id
      AND ur.is_active = true
    )
    OR
    -- Commercial can see assigned clients
    (assigned_to::text = auth.uid()::text)
  );

-- Proposals policies
CREATE POLICY "Users can view proposals in their scope" ON proposals
  FOR SELECT USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND r.name = 'Super Admin'
      AND ur.is_active = true
    )
    OR
    -- Company admin can see company proposals
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN clients c ON c.id = proposals.client_id
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.company_id = c.company_id
      AND r.name = 'Company Admin'
      AND ur.is_active = true
    )
    OR
    -- Site manager can see site proposals
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN clients c ON c.id = proposals.client_id
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.site_id = c.site_id
      AND ur.is_active = true
    )
    OR
    -- Commercial can see their proposals
    (created_by::text = auth.uid()::text)
  );

-- Sales policies
CREATE POLICY "Users can view sales in their scope" ON sales
  FOR SELECT USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND r.name = 'Super Admin'
      AND ur.is_active = true
    )
    OR
    -- Company admin can see company sales
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN proposals p ON p.id = sales.proposal_id
      JOIN clients c ON c.id = p.client_id
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.company_id = c.company_id
      AND r.name = 'Company Admin'
      AND ur.is_active = true
    )
    OR
    -- Site manager can see site sales
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN proposals p ON p.id = sales.proposal_id
      JOIN clients c ON c.id = p.client_id
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.site_id = c.site_id
      AND ur.is_active = true
    )
    OR
    -- Commercial can see their sales
    (closed_by::text = auth.uid()::text)
  );

-- Activity logs policies
CREATE POLICY "Users can view activity logs in their scope" ON activity_logs
  FOR SELECT USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id::text = auth.uid()::text
      AND r.name = 'Super Admin'
      AND ur.is_active = true
    )
    OR
    -- Users can see their own activities
    (user_id::text = auth.uid()::text)
  );

-- Roles and permissions are read-only for most users
CREATE POLICY "Users can view roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Users can view permissions" ON permissions FOR SELECT USING (true);
CREATE POLICY "Users can view role permissions" ON role_permissions FOR SELECT USING (true);