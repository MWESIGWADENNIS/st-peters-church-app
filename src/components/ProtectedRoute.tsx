import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute: React.FC<{ role?: string; permission?: string }> = ({ role, permission }) => {
  const { user, profile, loading, hasPermission } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check (e.g. must be admin to access admin section)
  if (role && profile?.role !== role && !profile?.is_super_admin) {
    return <Navigate to="/home" replace />;
  }

  // Permission check (granular access inside admin)
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
