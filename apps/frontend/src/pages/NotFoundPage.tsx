import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <h1 className="text-6xl font-black text-agri-700">404</h1>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        The requested domain module page does not exist or has not been unlocked in Sprint 1.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
};
