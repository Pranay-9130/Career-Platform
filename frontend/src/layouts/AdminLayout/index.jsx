import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, CheckSquare, Briefcase, Users, FileText, X } from 'lucide-react';
import { AdminNavbar } from '@/components/navbar';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Moderate Projects', path: '/admin/projects', icon: CheckSquare },
    { name: 'Manage Jobs', path: '/admin/jobs', icon: Briefcase },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Resume Templates', path: '/admin/templates', icon: FileText },
  ];

  const renderNavLinks = () => (
    <nav className="p-4 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-veryLight text-brand-primary font-semibold'
                : 'text-brand-muted hover:bg-slate-50 hover:text-brand-text'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-slate-400'}`} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-brand-bg text-brand-text">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-brand-primary focus:text-white focus:text-xs focus:font-bold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white transition"
      >
        Skip to main content
      </a>

      {/* Desktop Persistent Admin Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-brand-border bg-white flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-brand-border">
          <Link to="/admin/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-slate-800">
            <Shield className="w-5 h-5 text-brand-primary" />
            Admin Console
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full bg-white border-r border-brand-border shadow-xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-brand-border">
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2 font-display font-extrabold text-base text-slate-800"
              >
                <Shield className="w-4 h-4 text-brand-primary" />
                <span>Admin Console</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar onToggleSidebar={() => setMobileSidebarOpen(true)} />
        <main id="main-content" tabIndex="-1" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
