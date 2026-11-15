import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  FolderGit2,
  FileText,
  Sparkles,
  Send,
  Bookmark,
  User,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Compass,
  BrainCircuit,
  Download,
} from 'lucide-react';
import { Button } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import { getDashboardPath } from '@/utils/navigation';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);

  const userMenuRef = useRef(null);
  const featuresMenuRef = useRef(null);
  const featuresTimeoutRef = useRef(null);

  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setFeaturesMenuOpen(false);
    setMobileFeaturesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Handle click outside dropdowns and Escape key navigation
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (featuresMenuRef.current && !featuresMenuRef.current.contains(e.target)) {
        setFeaturesMenuOpen(false);
      }
    };

    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setFeaturesMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Features mega-menu list — STRICTLY only the three core career tools
  const featureTools = [
    {
      name: 'ATS Resume Analyzer',
      description: 'Analyze resumes, evaluate ATS compatibility, identify missing skills and receive improvement suggestions.',
      path: '/features/ats-analyzer',
      icon: Sparkles,
      iconBg: 'bg-blue-50 text-brand-primary',
      badge: 'ATS Scoring',
    },
    {
      name: 'Skill Intelligence',
      description: 'Extract skills from resumes, identify skill gaps and understand suitability for a target job role.',
      path: '/features/skill-intelligence',
      icon: BrainCircuit,
      iconBg: 'bg-cyan-50 text-brand-cyan',
      badge: '13-Role Matrix',
    },
    {
      name: 'Resume Builder',
      description: 'Create, edit and customize professional, ATS-friendly resumes.',
      path: '/features/resume-builder',
      icon: FileText,
      iconBg: 'bg-indigo-50 text-indigo-600',
      badge: 'PDF Export',
    },
  ];

  // Primary top-level navigation links in exact required structure:
  // Home | Projects | Jobs | Templates | About | Contact | Download App
  const secondaryNavLinks = [
    { name: 'Projects', path: '/projects' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Templates', path: '/templates' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    {
      name: 'Download App',
      path: '/download-app',
      icon: Download,
      isDownloadApp: true,
    },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isFeaturesActive = location.pathname.startsWith('/features') ||
    location.pathname === '/ats-analyzer' ||
    location.pathname === '/skill-intelligence' ||
    location.pathname === '/resume-builder';

  const handleFeaturesMouseEnter = () => {
    if (featuresTimeoutRef.current) clearTimeout(featuresTimeoutRef.current);
    setFeaturesMenuOpen(true);
  };

  const handleFeaturesMouseLeave = () => {
    featuresTimeoutRef.current = setTimeout(() => {
      setFeaturesMenuOpen(false);
    }, 180);
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
  const displayEmail = user?.email || '';
  const workspaceLabel = user?.role === 'CONTRIBUTOR' ? 'Job Seeker' : 'Student';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group shrink-0"
        >
          <picture>
            <source srcSet="/logo.webp" type="image/webp" />
            <img
              src="/logo.png"
              alt="AspirePath"
              width="135"
              height="36"
              decoding="async"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </picture>
        </Link>

        {/* Desktop Navigation Links: Home | Features ▼ | About | Jobs | Projects | Templates | Contact */}
        <nav
          aria-label="Primary Public Navigation"
          className="hidden md:flex items-center gap-1 lg:gap-1.5"
        >
          {/* Home Link */}
          <Link
            to="/"
            aria-current={isActive('/') ? 'page' : undefined}
            className={`relative px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              isActive('/')
                ? 'text-brand-primary font-bold bg-brand-veryLight ring-1 ring-brand-primary/20 shadow-xs'
                : 'text-slate-600 hover:text-brand-primary hover:bg-slate-50 font-medium'
            }`}
          >
            <span>Home</span>
            {isActive('/') && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            )}
          </Link>

          {/* Features Mega-Menu Dropdown (Desktop) */}
          <div
            className="relative"
            ref={featuresMenuRef}
            onMouseEnter={handleFeaturesMouseEnter}
            onMouseLeave={handleFeaturesMouseLeave}
          >
            <button
              type="button"
              onClick={() => setFeaturesMenuOpen(!featuresMenuOpen)}
              aria-expanded={featuresMenuOpen}
              aria-haspopup="true"
              className={`relative px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${
                isFeaturesActive
                  ? 'text-brand-primary font-bold bg-brand-veryLight ring-1 ring-brand-primary/20 shadow-xs'
                  : 'text-slate-600 hover:text-brand-primary hover:bg-slate-50 font-medium'
              }`}
            >
              <span>Features</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  featuresMenuOpen ? 'rotate-180 text-brand-primary' : 'text-slate-400'
                }`}
              />
              {isFeaturesActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              )}
            </button>

            {/* Features Mega-Menu Panel */}
            {featuresMenuOpen && (
              <div
                role="menu"
                aria-label="Career Features Menu"
                className="absolute top-full left-0 mt-1.5 w-[390px] sm:w-[420px] bg-white rounded-2xl border border-brand-border shadow-modal p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 pt-2 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Core Career Tools
                  </span>
                  <span className="text-[10px] font-semibold text-brand-primary bg-blue-50 px-2 py-0.5 rounded-md">
                    Deterministic AI
                  </span>
                </div>

                <div className="py-1.5 space-y-1">
                  {featureTools.map((tool) => (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      role="menuitem"
                      onClick={() => setFeaturesMenuOpen(false)}
                      className="group flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-brand-veryLight/90 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl ${tool.iconBg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-xs`}>
                        <tool.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                            {tool.name}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-brand-primary transition-colors">
                            {tool.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-muted leading-relaxed mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Links: Projects | Jobs | Templates | About | Contact | Download App */}
          {secondaryNavLinks.map((link) => {
            const active = isActive(link.path);
            if (link.isDownloadApp) {
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 font-bold shadow-xs ${
                    active
                      ? 'text-white bg-brand-primary border border-brand-primary'
                      : 'text-brand-primary bg-blue-50/90 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/90'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download App</span>
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    APK
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                  active
                    ? 'text-brand-primary font-bold bg-brand-veryLight ring-1 ring-brand-primary/20 shadow-xs'
                    : 'text-slate-600 hover:text-brand-primary hover:bg-slate-50 font-medium'
                }`}
              >
                <span>{link.name}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions: Auth / User Profile */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Quick Submit Project CTA */}
              <Link to="/projects/submit">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={PlusCircle}
                  className="border-brand-primary/30 text-brand-primary hover:bg-brand-veryLight font-semibold text-xs px-3"
                >
                  Submit Project
                </Button>
              </Link>

              {/* User Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-label="User Account Menu"
                  className="flex items-center gap-2.5 p-1.5 rounded-xl border border-brand-border bg-slate-50/60 hover:bg-white hover:border-brand-primary/40 hover:shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-cyan text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {getInitials(displayName)}
                  </div>
                  <div className="text-left hidden lg:block text-xs pr-1">
                    <p className="font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-brand-primary font-medium">
                      {user?.role === 'ADMIN' ? 'Administrator' : `${workspaceLabel} Workspace`}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-brand-border shadow-modal py-2 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
                    {/* User summary header */}
                    <div className="px-4 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-brand-text truncate">{displayName}</p>
                        {user?.role === 'ADMIN' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Admin
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-brand-primary border border-brand-border">
                            {workspaceLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{displayEmail}</p>
                    </div>

                    {/* Primary Workspace Links */}
                    <div className="py-1 text-xs">
                      <Link
                        to={getDashboardPath(user)}
                        className="flex items-center gap-2.5 px-4 py-2 text-brand-text hover:bg-brand-veryLight hover:text-brand-primary transition-colors font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-primary" />
                        <span>Workspace Overview</span>
                      </Link>

                      {user?.role !== 'ADMIN' && (
                        <>
                          <Link
                            to="/my-projects"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                          >
                            <FolderGit2 className="w-4 h-4 text-slate-400" />
                            <span>My Projects</span>
                          </Link>

                          <Link
                            to="/resume-builder"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                          >
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span>Resume Builder</span>
                          </Link>

                          <Link
                            to="/ats-analyzer"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-slate-400" />
                            <span>ATS Resume Analyzer</span>
                          </Link>

                          <Link
                            to="/skill-intelligence"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                          >
                            <BrainCircuit className="w-4 h-4 text-slate-400" />
                            <span>Skill Intelligence</span>
                          </Link>

                          <Link
                            to="/applications"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                          >
                            <Send className="w-4 h-4 text-slate-400" />
                            <span>My Applications</span>
                          </Link>

                          <Link
                            to="/saved"
                            className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                          >
                            <Bookmark className="w-4 h-4 text-slate-400" />
                            <span>Saved Items</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Account Settings & Profile */}
                    <div className="py-1 text-xs">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-brand-veryLight hover:text-brand-primary transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile & Settings</span>
                      </Link>
                      {user?.username && (
                        <Link
                          to={`/u/${user.username}`}
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

                    {/* Sign out */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={logout}
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
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-600 hover:text-brand-primary px-3 py-2 rounded-lg transition-colors"
              >
                Log in
              </Link>
              <Link to="/register">
                <Button size="sm" variant="gradient" rightIcon={ArrowRight} className="font-bold text-xs px-4">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && (
            <Link
              to={getDashboardPath(user)}
              className="p-1.5 rounded-lg bg-brand-veryLight text-brand-primary border border-brand-border"
              title="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="p-2 rounded-lg text-slate-600 hover:text-brand-text hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden border-b border-brand-border bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl max-h-[85vh] max-h-[85dvh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Section: Explore Platform */}
          <div>
            <div className="px-3 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-brand-primary" />
              <span>Explore Platform</span>
            </div>

            <div className="space-y-0.5">
              {/* Home */}
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive('/') ? 'page' : undefined}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/')
                    ? 'text-brand-primary bg-brand-veryLight ring-1 ring-brand-primary/20'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Home</span>
                {isActive('/') && <span className="w-2 h-2 rounded-full bg-brand-primary" />}
              </Link>

              {/* Expandable Features Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isFeaturesActive
                      ? 'text-brand-primary bg-brand-veryLight ring-1 ring-brand-primary/20'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-primary" />
                    <span>Features</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      mobileFeaturesOpen ? 'rotate-180 text-brand-primary' : ''
                    }`}
                  />
                </button>

                {mobileFeaturesOpen && (
                  <div className="pl-4 pr-1 py-1.5 space-y-1 bg-slate-50/70 rounded-xl mt-1 border border-slate-100">
                    {featureTools.map((tool) => (
                      <Link
                        key={tool.path}
                        to={tool.path}
                        onClick={() => {
                          setMobileFeaturesOpen(false);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-lg ${tool.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <tool.icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-brand-text">{tool.name}</p>
                          <p className="text-[10px] text-brand-muted line-clamp-1">{tool.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Secondary Navigation Links */}
              {secondaryNavLinks.map((link) => {
                const active = isActive(link.path);
                if (link.isDownloadApp) {
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-brand-primary border border-blue-200/60 my-1 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-brand-primary" />
                        <span>{link.name}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-primary text-white">
                        APK
                      </span>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'text-brand-primary bg-brand-veryLight ring-1 ring-brand-primary/20'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{link.name}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-brand-primary" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: Workspace (if authenticated) */}
          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-100">
              <div className="px-3 pb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  My Workspace
                </span>
                <span className="text-xs font-semibold text-slate-600 truncate max-w-[140px]">
                  {displayName}
                </span>
              </div>

              <div className="space-y-1">
                <Link
                  to={getDashboardPath(user)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-brand-primary bg-blue-50/60"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard Overview</span>
                </Link>

                <Link
                  to="/projects/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-brand-primary hover:bg-brand-veryLight"
                >
                  <PlusCircle className="w-4 h-4 text-brand-primary" />
                  <span>Submit Project</span>
                </Link>

                {user?.role !== 'ADMIN' && (
                  <>
                    <Link
                      to="/my-projects"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <FolderGit2 className="w-4 h-4 text-slate-400" />
                      <span>My Projects</span>
                    </Link>

                    <Link
                      to="/resume-builder"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Resume Builder</span>
                    </Link>

                    <Link
                      to="/ats-analyzer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>ATS Analyzer</span>
                    </Link>

                    <Link
                      to="/skill-intelligence"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <BrainCircuit className="w-4 h-4 text-slate-400" />
                      <span>Skill Intelligence</span>
                    </Link>

                    <Link
                      to="/applications"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Send className="w-4 h-4 text-slate-400" />
                      <span>Applications</span>
                    </Link>

                    <Link
                      to="/saved"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      <span>Saved Items</span>
                    </Link>
                  </>
                )}

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile & Settings</span>
                </Link>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-brand-border hover:bg-slate-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold gradient-brand text-white shadow-sm transition-opacity"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
