import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils'; // Assuming cn utility is available for conditional class names

const AppHeader: React.FC = () => {
  const location = useLocation();

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
            Job Rewrite
          </Link>
          <Link
            to="/resume-analyzer"
            className={cn(
              "text-app-dark-text text-sm font-medium leading-normal hover:text-app-blue transition-colors",
              location.pathname === '/resume-analyzer' && "text-app-blue font-bold"
            )}
          >
            Resume Analyzer
          </Link>
          <a className="text-app-dark-text text-sm font-medium leading-normal" href="https://www.maxabardo.work/" target="_blank" rel="noopener noreferrer">Made for free by Max A</a>
        </div>
      </nav>
    </header>
  );
};

export default AppHeader;