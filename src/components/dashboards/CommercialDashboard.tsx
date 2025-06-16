import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, 
  DollarSign,
  FileText,
  Users,
  Calendar,
  Target,
  Award,
  Clock
} from 'lucide-react';

interface CommercialStats {
  personalSales: number;
  personalProposals: number;
  personalClients: number;
  conversionRate: number;
  monthlyTarget: number;
  commission: number;
  recentProposals: any[];
  upcomingTasks: any[];
}

interface CommercialDashboardProps {
  userRole: UserRole;
}

export default function CommercialDashboard({ userRole }: CommercialDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommercialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCommercialData();
    }
  }, [user]);

  const fetchCommercialData = async () => {
    if (!user) return;

    try {
      // Fetch personal statistics
      const [
        salesResult,
        proposalsResult,
        clientsResult
      ] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            amount,
            commission,
            proposal:proposals!inner(
              client:clients!inner(assigned_to)
            )
          `)
          .eq('closed_by', user.id),
        supabase
          .from('proposals')
          .select(`
            id,
            title,
            amount,
            status,
            created_at,
            client:clients!inner(assigned_to, name)
          `, { count: 'exact' })
          .eq('created_by', user.id),
        supabase
          .from('clients')
          .select('id, name, status', { count: 'exact' })
          .eq('assigned_to', user.id)
      ]);

      const personalSales = salesResult.data?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
      const commission = salesResult.data?.reduce((sum, sale) => sum + (sale.commission || 0), 0) || 0;
      const closedProposals = proposalsResult.data?.filter(p => p.status === 'closed').length || 0;
      const conversionRate = proposalsResult.count ? (closedProposals / proposalsResult.count) * 100 : 0;

      // Mock monthly target (in real app, this would come from database)
      const monthlyTarget = 50000;

      // Get recent proposals
      const recentProposals = proposalsResult.data?.slice(0, 5) || [];

      // Mock upcoming tasks (in real app, this would come from a tasks table)
      const upcomingTasks = [
        {
          id: '1',
          title: 'Follow up with John Doe',
          type: 'call',
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high'
        },
        {
          id: '2',
          title: 'Prepare proposal for ABC Corp',
          type: 'proposal',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium'
        },
        {
          id: '3',
          title: 'Site visit - XYZ Company',
          type: 'meeting',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high'
        }
      ];

      setStats({
        personalSales,
        personalProposals: proposalsResult.count || 0,
        personalClients: clientsResult.count || 0,
        conversionRate,
        monthlyTarget,
        commission,
        recentProposals,
        upcomingTasks
      });
    } catch (error) {
      console.error('Error fetching commercial data:', error);
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
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const targetProgress = (stats.personalSales / stats.monthlyTarget) * 100;

  const statCards = [
    {
      title: 'Personal Sales',
      value: `$${stats.personalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+15%'
    },
    {
      title: 'My Proposals',
      value: stats.personalProposals,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+8%'
    },
    {
      title: 'My Clients',
      value: stats.personalClients,
      icon: Users,
      color: 'bg-purple-500',
      change: '+12%'
    },
    {
      title: 'Commission',
      value: `$${stats.commission.toLocaleString()}`,
      icon: Award,
      color: 'bg-yellow-500',
      change: '+20%'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          {userRole.site?.name} - {userRole.company?.name}
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
        {/* Monthly Target Progress */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-500" />
              Monthly Target
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {targetProgress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(targetProgress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  ${stats.personalSales.toLocaleString()}
                </span>
                <span className="text-gray-500">
                  ${stats.monthlyTarget.toLocaleString()}
                </span>
              </div>
              <div className="text-center">
                <span className={`text-sm font-medium ${
                  targetProgress >= 100 ? 'text-green-600' : 
                  targetProgress >= 75 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {targetProgress >= 100 ? 'Target Achieved! 🎉' :
                   targetProgress >= 75 ? 'Almost there!' :
                   `$${(stats.monthlyTarget - stats.personalSales).toLocaleString()} to go`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              Recent Proposals
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.recentProposals.map((proposal) => (
                <div key={proposal.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {proposal.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {proposal.client.name} • ${proposal.amount.toLocaleString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    proposal.status === 'closed' ? 'bg-green-100 text-green-800' :
                    proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {proposal.status}
                  </span>
                </div>
              ))}
              {stats.recentProposals.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No proposals yet. Create your first proposal to get started.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-500" />
              Upcoming Tasks
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    task.priority === 'high' ? 'bg-red-400' :
                    task.priority === 'medium' ? 'bg-yellow-400' :
                    'bg-green-400'
                  }`}></div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {task.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    task.type === 'call' ? 'bg-blue-100 text-blue-800' :
                    task.type === 'meeting' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {task.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="btn-primary w-full justify-center">
          <Users className="h-4 w-4 mr-2" />
          Add Client
        </button>
        <button className="btn-primary w-full justify-center">
          <FileText className="h-4 w-4 mr-2" />
          Create Proposal
        </button>
        <button className="btn-primary w-full justify-center">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Meeting
        </button>
        <button className="btn-primary w-full justify-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Log Sale
        </button>
      </div>
    </div>
  );
}