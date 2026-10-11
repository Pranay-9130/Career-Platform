import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="py-24 text-center px-4">
      <h1 className="text-6xl font-display font-extrabold text-brand-primary">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-brand-text">Page Not Found</h2>
      <p className="mt-2 text-brand-muted">The page you are looking for does not exist or has been moved.</p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center px-5 py-2.5 rounded-button bg-brand-primary text-white font-medium hover:bg-blue-600 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
