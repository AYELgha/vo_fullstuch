import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types/auth';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  DollarSign,
  FileText,
  UserPlus,
  Building,
  Activity
} from 'lucide-react';

interface CompanyStats {
  totalUsers: number;
  totalSites: number;
  totalSales: number;
  totalProposals: number;
  recentActivities: any[];
  sites: any[];
}

interface CompanyAdminDashboardProps {
  userRole: UserRole;
}

export default function CompanyAdminDashboard({ userRole }: CompanyAdminDashboardProps) {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole.company) {
      fetchCompanyData();
    }
  }, [userRole.company]);

  const fetchCompanyData = async () => {
    if (!userRole.company) return;

    try {
      const companyId = userRole.company.id;

      // Fetch company-specific statistics
      const [
        usersResult,
        sitesResult,
        salesResult,
        proposalsResult,
        activitiesResult,
        sitesDetailResult
      ] = await Promise.all([
        supabase
          .from('user_roles')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId),
        supabase
          .from('sites')
          .select('id', { count: 'exact' })
          .eq('company_id', companyId),
        supabase
          .from('sales')
          .select(`
            amount,
            proposal:proposals!inner(
              client:clients!inner(company_id)
            )
          `)
          .eq('proposal.client.company_id', companyId),
        supabase
          .from('proposals')
          .select(`
            id,
            status,
            client:clients!inner(company_id)
          `, { count: 'exact' })
          .eq('client.company_id', companyId),
        supabase
          .from('activity_logs')
          .select(`
            id,
            action,
            resource_type,
            created_at,
            user:users(first_name, last_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('sites')
          .select(`
            id,
            name,
            description,
            is_active,
            user_roles(
              id,
              user:users(first_name, last_name, email),
              role:roles(name)
            )
          `)
          .eq('company_id', companyId)
      ]);

      const totalSales = salesResult.data?.reduce((sum, sale) => sum + sale.amount, 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalSites: sitesResult.count || 0,
        totalSales,
        totalProposals: proposalsResult.count || 0,
        recentActivities: activitiesResult.data || [],
        sites: sitesDetailResult.data || []
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats || !userRole.company) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No company assigned</h3>
          <p className="mt-1 text-sm text-gray-500">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Company Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+8%'
    },
    {
      title: 'Sites',
      value: stats.totalSites,
      icon: MapPin,
      color: 'bg-green-500',
      change: '+12%'
    },
    {
      title: 'Total Sales',
      value: `$${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+18%'
    },
    {
      title: 'Proposals',
      value: stats.totalProposals,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+15%'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Company Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Managing {userRole.company.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sites Overview */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-500" />
              Company Sites
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.sites.map((site) => (
                <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{site.name}</h4>
                    <p className="text-xs text-gray-500">{site.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {site.user_roles?.length || 0} staff members
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      site.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {site.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
              {stats.sites.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No sites found. Create your first site to get started.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-500" />
              Recent Activities
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.recentActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {activity.user?.first_name} {activity.user?.last_name}
                      </span>{' '}
                      {activity.action} {activity.resource_type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Management Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="btn-primary w-full justify-center">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
        <button className="btn-primary w-full justify-center">
          <MapPin className="h-4 w-4 mr-2" />
          Create Site
        </button>
        <button className="btn-primary w-full justify-center">
          <FileText className="h-4 w-4 mr-2" />
          View Reports
        </button>
        <button className="btn-primary w-full justify-center">
          <Building className="h-4 w-4 mr-2" />
          Company Settings
        </button>
      </div>
    </div>
  );
}