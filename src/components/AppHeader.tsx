import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

const AppHeader: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-app-light-border px-10 py-3">
      <div className="flex items-center gap-4 text-app-dark-text">
        <div className="size-4 flex items-center justify-center">
          <img src="/pencil-icon.png" alt="JobRewrite Icon" className="h-full w-full object-contain" />
        </div>
        <h2 className="text-app-dark-text text-lg font-bold leading-tight tracking-[-0.015em]">JobRewrite</h2>
      </div>
      <nav className="flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-9">
          <Link
            to="/"
            className={cn(
              "text-app-dark-text text-sm font-medium leading-normal hover:text-app-blue transition-colors",
              location.pathname === '/' && "text-app-blue font-bold"
            )}
          >
            Resume Analyzer
          </Link>
          <Link
            to="/job-rewrite"
            className={cn(
              "text-app-dark-text text-sm font-medium leading-normal hover:text-app-blue transition-colors",
              location.pathname === '/job-rewrite' && "text-app-blue font-bold"
            )}
          >
            Job Rewrite
          </Link>
          
          <Link
            to="/dashboard"
            className={cn(
              "text-app-dark-text text-sm font-medium leading-normal hover:text-app-blue transition-colors",
              location.pathname === '/dashboard' && "text-app-blue font-bold"
            )}
          >
            Dashboard
          </Link>
          
          <a className="text-app-dark-text text-sm font-medium leading-normal" href="https://www.maxabardo.work/" target="_blank" rel="noopener noreferrer">Made for free by Max A</a>
          {isAuthenticated && (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-app-dark-text text-sm font-medium leading-normal hover:text-app-blue transition-colors"
            >
              Logout
            </Button>
          )}
          
          {/* Login and Signup links are now hidden */}
          {/*
          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className={cn(
                  "text-app-dark-text text-sm font-medium leading-normal hover:text-app-blue transition-colors",
                  location.pathname === '/login' && "text-app-blue font-bold"
                )}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={cn(
                  "text-app-dark-text text-sm font-medium leading-normal hover:text-app-blue transition-colors",
                  location.pathname === '/signup' && "text-app-blue font-bold"
                )}
              >
                Sign Up
              </Link>
            </>
          )}
          */}
        </div>
      </nav>
    </header>
  );
};

export default AppHeader;