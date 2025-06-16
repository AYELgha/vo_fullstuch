import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types/auth';
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  FileText,
  UserPlus,
  MapPin,
  Activity,
  Target
} from 'lucide-react';

interface SiteStats {
  totalCommercials: number;
  totalSales: number;
  totalProposals: number;
  conversionRate: number;
  recentActivities: any[];
  commercials: any[];
  topPerformers: any[];
}

interface SiteManagerDashboardProps {
  userRole: UserRole;
}

export default function SiteManagerDashboard({ userRole }: SiteManagerDashboardProps) {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole.site) {
      fetchSiteData();
    }
  }, [userRole.site]);

  const fetchSiteData = async () => {
    if (!userRole.site) return;

    try {
      const siteId = userRole.site.id;

      // Fetch site-specific statistics
      const [
        commercialsResult,
        salesResult,
        proposalsResult,
        activitiesResult,
        commercialsDetailResult
      ] = await Promise.all([
        supabase
          .from('user_roles')
          .select(`
            id,
            user:users(id, first_name, last_name, email),
            role:roles!inner(name)
          `, { count: 'exact' })
          .eq('site_id', siteId)
          .eq('role.name', 'Commercial'),
        supabase
          .from('sales')
          .select(`
            amount,
            commission,
            closed_by,
            proposal:proposals!inner(
              client:clients!inner(site_id)
            )
          `)
          .eq('proposal.client.site_id', siteId),
        supabase
          .from('proposals')
          .select(`
            id,
            status,
            amount,
            client:clients!inner(site_id)
          `, { count: 'exact' })
          .eq('client.site_id', siteId),
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
          .from('user_roles')
          .select(`
            id,
            user:users(id, first_name, last_name, email),
            role:roles!inner(name)
          `)
          .eq('site_id', siteId)
          .eq('role.name', 'Commercial')
      ]);

      const totalSales = salesResult.data?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
      const closedProposals = proposalsResult.data?.filter(p => p.status === 'closed').length || 0;
      const conversionRate = proposalsResult.count ? (closedProposals / proposalsResult.count) * 100 : 0;

      // Calculate top performers
      const performanceMap = new Map();
      salesResult.data?.forEach(sale => {
        const userId = sale.closed_by;
        if (!performanceMap.has(userId)) {
          performanceMap.set(userId, { sales: 0, commission: 0 });
        }
        const current = performanceMap.get(userId);
        performanceMap.set(userId, {
          sales: current.sales + sale.amount,
          commission: current.commission + (sale.commission || 0)
        });
      });

      const topPerformers = Array.from(performanceMap.entries())
        .map(([userId, performance]) => ({
          userId,
          ...performance
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setStats({
        totalCommercials: commercialsResult.count || 0,
        totalSales,
        totalProposals: proposalsResult.count || 0,
        conversionRate,
        recentActivities: activitiesResult.data || [],
        commercials: commercialsDetailResult.data || [],
        topPerformers
      });
    } catch (error) {
      console.error('Error fetching site data:', error);
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

  if (!stats || !userRole.site) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No site assigned</h3>
          <p className="mt-1 text-sm text-gray-500">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Commercial Team',
      value: stats.totalCommercials,
      icon: Users,
      color: 'bg-blue-500',
      change: '+5%'
    },
    {
      title: 'Site Sales',
      value: `$${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+22%'
    },
    {
      title: 'Proposals',
      value: stats.totalProposals,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+18%'
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: Target,
      color: 'bg-yellow-500',
      change: '+3%'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Site Manager Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Managing {userRole.site.name} - {userRole.company?.name}
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
        {/* Commercial Team */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Commercial Team
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.commercials.map((commercial) => (
                <div key={commercial.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {commercial.user.first_name} {commercial.user.last_name}
                    </h4>
                    <p className="text-xs text-gray-500">{commercial.user.email}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              ))}
              {stats.commercials.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No commercial team members assigned yet.
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
              Recent Site Activities
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
          Add Commercial
        </button>
        <button className="btn-primary w-full justify-center">
          <FileText className="h-4 w-4 mr-2" />
          View Proposals
        </button>
        <button className="btn-primary w-full justify-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Sales Report
        </button>
        <button className="btn-primary w-full justify-center">
          <Target className="h-4 w-4 mr-2" />
          Set Targets
        </button>
      </div>
    </div>
  );
}