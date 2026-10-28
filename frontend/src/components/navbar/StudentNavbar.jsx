import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Home,
  FolderGit2,
  FileText,
  Sparkles,
  Send,
  Bookmark,
  PlusCircle,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function StudentNavbar({ onToggleSidebar }) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
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
    navigate('/login', { replace: true });
  };

  const pageMeta = {
    '/dashboard': { label: 'Dashboard Overview', icon: null },
    '/my-projects': { label: 'My Projects', icon: FolderGit2 },
    '/projects/submit': { label: 'Submit Project', icon: PlusCircle },
    '/resume-builder': { label: 'Resume Builder', icon: FileText },
    '/ats-analyzer': { label: 'ATS Resume Analyzer', icon: Sparkles },
    '/applications': { label: 'Applications Tracker', icon: Send },
    '/saved': { label: 'Saved Bookmarks', icon: Bookmark },
    '/profile': { label: 'Profile & Settings', icon: User },
  };

  const currentMeta = pageMeta[location.pathname] || {
    label: location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Workspace',
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/projects?search=${encodeURIComponent(query)}`);
    setSearchQuery('');
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
  const displayEmail = user?.email || 'student@aspirepath.com';
  const displayHeadline = user?.headline || 'Computer Science Student';

  return (
    <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-3 sm:px-6 lg:px-8 z-30 sticky top-0 transition-all">
      {/* Left: Mobile Sidebar Toggle & Interactive Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation sidebar"
            className="p-2 rounded-xl text-slate-500 hover:text-brand-text hover:bg-slate-100 lg:hidden transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Dynamic, Clickable Breadcrumbs Trail */}
        <nav aria-label="Breadcrumb navigation" className="flex items-center gap-1.5 text-xs truncate">
          <Link
            to="/"
            className="hidden md:inline-flex items-center text-slate-400 hover:text-brand-primary transition-colors p-1 rounded"
            title="Return to Public Home"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>

          <ChevronRight className="hidden md:inline-block w-3 h-3 text-slate-300" aria-hidden="true" />

          <Link
            to="/dashboard"
            className="font-medium text-slate-500 hover:text-brand-primary transition-colors truncate hidden sm:inline"
          >
            Workspace
          </Link>

          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" aria-hidden="true" />

          <span
            aria-current="page"
            className="font-bold text-brand-text truncate flex items-center gap-1"
          >
            {currentMeta.icon && (
              <currentMeta.icon className="w-3.5 h-3.5 text-brand-primary shrink-0 hidden sm:inline" />
            )}
            <span className="capitalize">{currentMeta.label}</span>
          </span>
        </nav>
      </div>

      {/* Middle: Quick Search */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-4 lg:mx-8">
        <form onSubmit={handleSearch} className="relative w-full" role="search">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search projects, technologies..."
            aria-label="Search projects"
            className="w-full text-xs bg-slate-50 border border-brand-border rounded-xl pl-9 pr-3 py-2 text-brand-text placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
        </form>
      </div>

      {/* Right: Actions, Notifications & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Admin Console Switcher if user is ADMIN */}
        {user?.role === 'ADMIN' && (
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors shadow-xs"
            title="Go to Admin Console"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin Console</span>
          </Link>
        )}

        {/* Link to public site */}
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-primary px-2.5 py-1.5 rounded-lg hover:bg-brand-veryLight transition-colors"
          title="Browse public marketplace"
        >
          <span>Explore Public</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* In-App Notification Center */}
        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-brand-border transition-all focus:outline-none"
            aria-expanded={profileDropdownOpen}
            aria-label="Student Account Menu"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-cyan text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {getInitials(displayName)}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-brand-text leading-tight">{displayName}</div>
              <div className="text-slate-400 text-[10px] truncate max-w-[120px]">{displayHeadline}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-brand-border shadow-modal py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
              <div className="px-4 py-2.5">
                <p className="text-xs font-bold text-brand-text truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
              </div>

              <div className="py-1 text-xs">
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-amber-700 font-semibold bg-amber-50/70 hover:bg-amber-100/70 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Go to Admin Console</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors font-medium"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile & Settings</span>
                </Link>

                <Link
                  to="/my-projects"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                >
                  <FolderGit2 className="w-4 h-4 text-slate-400" />
                  <span>My Projects</span>
                </Link>

                <Link
                  to="/applications"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                >
                  <Send className="w-4 h-4 text-slate-400" />
                  <span>My Applications</span>
                </Link>

                {user?.username && (
                  <Link
                    to={`/u/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      <span>Public Portfolio</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">@{user.username}</span>
                  </Link>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold text-left"
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
