export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  roles: UserRole[];
}

export interface UserRole {
  id: string;
  role: Role;
  company?: Company;
  site?: Site;
  is_active: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  level: number;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export interface Site {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface Client {
  id: string;
  company_id: string;
  site_id?: string;
  assigned_to?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  client_id: string;
  created_by: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Sale {
  id: string;
  proposal_id: string;
  closed_by: string;
  amount: number;
  commission?: number;
  closed_at: string;
  notes?: string;
  created_at: string;
  proposal?: Proposal;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}