import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldX } from 'lucide-react';
import { Button, Card } from '@/components/common';

export default function RoleGuard({ allowedRoles, fallbackUrl, children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-brand-muted">Validating authorization privileges...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const isAuthorized = roles.includes(user?.role);

  if (!isAuthorized) {
    if (fallbackUrl) {
      return <Navigate to={fallbackUrl} replace />;
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4 shadow-card">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
            <ShieldX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-bold text-brand-text">Administrative Privilege Required</h2>
          <p className="text-sm text-brand-muted leading-relaxed">
            This module requires administrative clearance ({roles.join(', ')}). Your current role is{' '}
            <span className="font-semibold text-brand-text">{user?.role || 'Guest'}</span>.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Return to Previous Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
