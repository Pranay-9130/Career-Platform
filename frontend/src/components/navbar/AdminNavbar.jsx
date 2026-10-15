import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Shield,
  ExternalLink,
  LogOut,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Home,
  GraduationCap,
} from 'lucide-react';
import { Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';

export default function AdminNavbar({ onToggleSidebar }) {
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setAdminDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const pageLabels = {
    '/admin/dashboard': 'Dashboard Overview',
    '/admin/projects': 'Moderate Projects',
    '/admin/jobs': 'Manage Jobs',
    '/admin/students': 'Students Directory',
    '/admin/templates': 'Resume Templates',
  };

  const currentLabel = pageLabels[location.pathname] || 'Administration';

  const displayName = user?.full_name || 'Admin User';
  const displayEmail = user?.email || 'admin@careerplatform.com';

  return (
    <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0 transition-all">
      {/* Left: Sidebar Toggle & Clickable Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle admin sidebar"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav aria-label="Admin breadcrumb navigation" className="flex items-center gap-1.5 text-xs truncate">
          <Link
            to="/"
            className="hidden md:inline-flex items-center text-slate-400 hover:text-brand-primary transition-colors p-1 rounded"
            title="Return to Public Site"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>

          <ChevronRight className="hidden md:inline-block w-3 h-3 text-slate-300" aria-hidden="true" />

          <Link
            to="/admin/dashboard"
            className="font-medium text-slate-500 hover:text-brand-primary transition-colors truncate hidden sm:inline"
          >
            Admin Console
          </Link>

          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" aria-hidden="true" />

          <span aria-current="page" className="font-bold text-slate-900 truncate">
            {currentLabel}
          </span>
        </nav>
      </div>

      {/* Right: Moderation Status & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Link to="/admin/projects" className="hidden sm:inline-flex">
          <Badge variant="underReview" dot size="sm">
            Review Queue
          </Badge>
        </Link>

        {/* Link to Student Workspace */}
        <Link
          to="/dashboard"
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand-primary px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          title="Switch to Student Workspace view"
        >
          <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
          <span>Student View</span>
        </Link>

        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-primary px-2.5 py-1.5 rounded-lg hover:bg-brand-veryLight transition-colors font-medium"
        >
          <span>View Public</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Admin Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
            aria-expanded={adminDropdownOpen}
            aria-label="Admin Profile Menu"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              AD
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">{displayName}</div>
              <div className="text-slate-400 text-[10px]">Super Administrator</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {adminDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-brand-border shadow-modal py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
              <div className="px-4 py-2.5">
                <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
              </div>

              <div className="py-1 text-xs">
                <Link
                  to="/admin/projects"
                  onClick={() => setAdminDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors font-medium"
                >
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                  <span>Moderate Projects</span>
                </Link>

                <Link
                  to="/dashboard"
                  onClick={() => setAdminDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span>Student Workspace</span>
                </Link>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
