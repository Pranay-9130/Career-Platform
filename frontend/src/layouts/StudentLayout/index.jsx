import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  FileText,
  Sparkles,
  Send,
  Bookmark,
  User,
  Settings,
  X,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StudentNavbar } from '@/components/navbar';

export default function StudentLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Projects', path: '/my-projects', icon: FolderGit2, badge: '2' },
    { name: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { name: 'ATS Analyzer', path: '/ats-analyzer', icon: Sparkles, badge: 'New' },
    { name: 'Applications', path: '/applications', icon: Send, badge: '3' },
    { name: 'Saved Items', path: '/saved', icon: Bookmark },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const displayName = user?.full_name || 'Student';
  const displayHeadline = user?.headline || 'Computer Science Student';

  const renderNavLinks = () => (
    <nav className="p-3 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-brand-veryLight text-brand-primary shadow-xs'
                : 'text-brand-muted hover:bg-slate-50 hover:text-brand-text'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-brand-primary' : 'text-slate-400'
                }`}
              />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  item.badge === 'New'
                    ? 'bg-brand-primary text-white'
                    : isActive
                    ? 'bg-blue-100 text-brand-primary'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.badge}
              </span>
            )}
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

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-brand-border bg-white flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-brand-border justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 font-display font-extrabold text-base text-brand-text"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-cyan flex items-center justify-center text-white text-xs font-bold shadow-sm">
              CP
            </div>
            <span className="tracking-tight">
              Career<span className="text-brand-primary">Platform</span>
            </span>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-2">{renderNavLinks()}</div>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-brand-border bg-slate-50/60">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-brand-border transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-brand-text truncate">
                  {displayName}
                </p>
                {user?.is_verified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-brand-muted truncate">
                {displayHeadline}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </Link>
        </div>
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
                to="/dashboard"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2 font-display font-extrabold text-base text-brand-text"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-cyan flex items-center justify-center text-white text-xs font-bold">
                  CP
                </div>
                <span>Workspace</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-brand-text hover:bg-slate-100 transition-colors"
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
        <StudentNavbar onToggleSidebar={() => setMobileSidebarOpen(true)} />
        <main id="main-content" tabIndex="-1" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
