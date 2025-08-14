import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log("ProtectedRoute - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    // Optionally render a loading spinner or skeleton here
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading user session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute - Redirecting to /login because not authenticated.");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;