import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '@/components/navbar';
import { PublicFooter } from '@/components/footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-brand-primary focus:text-white focus:text-xs focus:font-bold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white transition"
      >
        Skip to main content
      </a>

      {/* Primary Public Navbar */}
      <PublicNavbar />

      {/* Main Routed Page Area */}
      <main id="main-content" tabIndex="-1" className="flex-1 outline-none">
        <Outlet />
      </main>

      {/* Primary Public Footer */}
      <PublicFooter />
    </div>
  );
}
