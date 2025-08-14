"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@heroui/react';
import AuthLanding from './AuthLanding';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary-50/30 to-success-50/30">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-default-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthLanding />;
  }

  return <>{children}</>;
}