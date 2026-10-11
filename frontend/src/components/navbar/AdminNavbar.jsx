import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Shield, ExternalLink, LogOut, ChevronDown, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';

export default function AdminNavbar({ onToggleSidebar }) {
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
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
    navigate('/login');
  };

  const displayName = user?.full_name || 'Admin User';
  const displayEmail = user?.email || 'admin@careerplatform.com';

  return (
    <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0">
      {/* Left: Sidebar Toggle & Console Title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle admin sidebar"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-primary" />
          <span className="font-semibold text-xs text-slate-800 tracking-wide uppercase">
            Platform Administration
          </span>
        </div>
      </div>

      {/* Right: Moderation Status & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to="/admin/projects" className="hidden sm:inline-flex">
          <Badge variant="underReview" dot size="sm">
            Review Queue
          </Badge>
        </Link>

        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-primary px-2.5 py-1.5 rounded-lg hover:bg-brand-veryLight transition-colors font-medium"
        >
          <span>View Public Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="h-6 w-px bg-slate-200" />

        {/* Admin Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
            aria-expanded={adminDropdownOpen}
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">{displayName}</div>
              <div className="text-slate-400 text-[11px]">Super Administrator</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {adminDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-brand-border shadow-modal py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-brand-border">
                <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/admin/projects"
                  onClick={() => setAdminDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                >
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                  Moderate Projects
                </Link>
              </div>

              <div className="pt-1 border-t border-brand-border">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
