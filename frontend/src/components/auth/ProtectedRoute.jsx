import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button, Card } from '@/components/common';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-brand-muted">Verifying session clearance...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasPermission = roles.includes(user?.role);

    if (!hasPermission) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-4 shadow-card">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-brand-text">Access Restricted</h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Your account ({user?.email}) has role <strong className="text-brand-text">{user?.role}</strong>,
              which does not have permission to view this section.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                leftIcon={ArrowLeft}
                onClick={() => window.history.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      );
    }
  }

  return children ? children : <Outlet />;
}
