import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import CompanyAdminDashboard from './dashboards/CompanyAdminDashboard';
import SiteManagerDashboard from './dashboards/SiteManagerDashboard';
import CommercialDashboard from './dashboards/CommercialDashboard';
import Header from './Header';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user || !user.roles.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Role Assigned</h2>
          <p className="mt-2 text-gray-600">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Get the highest level role (lowest number = highest level)
  const primaryRole = user.roles.reduce((highest, current) => 
    current.role.level < highest.role.level ? current : highest
  );

  const renderDashboard = () => {
    switch (primaryRole.role.name) {
      case 'Super Admin':
        return <SuperAdminDashboard />;
      case 'Company Admin':
        return <CompanyAdminDashboard userRole={primaryRole} />;
      case 'Site Manager':
        return <SiteManagerDashboard userRole={primaryRole} />;
      case 'Commercial':
        return <CommercialDashboard userRole={primaryRole} />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Unknown Role</h2>
            <p className="mt-2 text-gray-600">Role: {primaryRole.role.name}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} primaryRole={primaryRole} />
      <main className="py-6">
        {renderDashboard()}
      </main>
    </div>
  );
}