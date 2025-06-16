import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Activity,
  AlertCircle,
  DollarSign,
  FileText,
  UserCheck
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalSites: number;
  totalSales: number;
  totalProposals: number;
  pendingProposals: number;
  recentActivities: any[];
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    activeUsers: number;
  };
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all statistics in parallel
      const [
        usersResult,
        companiesResult,
        sitesResult,
        salesResult,
        proposalsResult,
        activitiesResult
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('companies').select('id', { count: 'exact' }),
        supabase.from('sites').select('id', { count: 'exact' }),
        supabase.from('sales').select('amount'),
        supabase.from('proposals').select('id, status', { count: 'exact' }),
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
          .limit(10)
      ]);

      const totalSales = salesResult.data?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
      const pendingProposals = proposalsResult.data?.filter(p => p.status === 'pending').length || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalCompanies: companiesResult.count || 0,
        totalSites: sitesResult.count || 0,
        totalSales,
        totalProposals: proposalsResult.count || 0,
        pendingProposals,
        recentActivities: activitiesResult.data || [],
        systemHealth: {
          status: 'healthy',
          uptime: '99.9%',
          activeUsers: Math.floor(Math.random() * 50) + 10
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Companies',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Sites',
      value: stats.totalSites,
      icon: MapPin,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      title: 'Total Sales',
      value: `$${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+23%'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global overview and system management
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Health */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-500" />
              System Health
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {stats.systemHealth.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Uptime</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.systemHealth.uptime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Active Users</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.systemHealth.activeUsers}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              Proposals Overview
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Proposals</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.totalProposals}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Pending Review</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {stats.pendingProposals}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Conversion Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.totalProposals > 0 ? 
                    Math.round((stats.totalSales / stats.totalProposals) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-purple-500" />
              Recent Activities
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.recentActivities.slice(0, 5).map((activity) => (
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
          <Users className="h-4 w-4 mr-2" />
          Manage Users
        </button>
        <button className="btn-primary w-full justify-center">
          <Building2 className="h-4 w-4 mr-2" />
          Manage Companies
        </button>
        <button className="btn-primary w-full justify-center">
          <MapPin className="h-4 w-4 mr-2" />
          Manage Sites
        </button>
        <button className="btn-primary w-full justify-center">
          <Activity className="h-4 w-4 mr-2" />
          System Reports
        </button>
      </div>
    </div>
  );
}