import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, User, Settings, LogOut, ChevronDown, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function StudentNavbar({ onToggleSidebar }) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setProfileDropdownOpen(false);
    logout();
    navigate('/login');
  };

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
  const displayEmail = user?.email || 'student@university.edu';
  const displayHeadline = user?.headline || 'Computer Science Student';

  return (
    <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0">
      {/* Left: Mobile Sidebar Toggle & Page Context */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation sidebar"
            className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-slate-100 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="font-semibold text-brand-text">Student Workspace</span>
          <span className="text-slate-300">/</span>
          <span className="text-brand-muted">Overview</span>
        </div>
      </div>

      {/* Middle: Quick Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, jobs, templates..."
            className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg pl-9 pr-3 py-2 text-brand-text placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Link to public site */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-primary px-2.5 py-1.5 rounded-lg hover:bg-brand-veryLight transition-colors font-medium"
        >
          <span>Explore Public</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* In-App Notification Center */}
        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
            aria-expanded={profileDropdownOpen}
          >
            <div className="w-8 h-8 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary flex items-center justify-center font-bold text-xs">
              {getInitials(displayName)}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-brand-text leading-tight">{displayName}</div>
              <div className="text-slate-400 text-[11px] truncate max-w-[120px]">{displayHeadline}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-brand-border shadow-modal py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-brand-border">
                <p className="text-xs font-semibold text-brand-text truncate">{displayName}</p>
                <p className="text-[11px] text-brand-muted truncate">{displayEmail}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-brand-text hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-brand-text hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
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
