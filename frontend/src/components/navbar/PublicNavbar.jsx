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

  // Features mega-menu list — core career platform tools
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

  // Primary top-level navigation links: Projects | Jobs | Templates | About | Contact
  const secondaryNavLinks = [
    { name: 'Projects', path: '/projects' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Templates', path: '/templates' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isFeaturesActive =
    location.pathname.startsWith('/features') ||
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
            <source srcSet="/brand-logo.svg" type="image/svg+xml" />
            <img
              src="/brand-logo.png"
              alt="AspirePath Logo"
              className="h-14 sm:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </picture>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {/* Home Link */}
          <Link
            to="/"
            aria-current={isActive('/') ? 'page' : undefined}
            className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/')
                ? 'text-brand-primary font-bold'
                : 'text-brand-muted hover:text-brand-primary hover:bg-brand-veryLight/60'
            }`}
          >
            Home
            {isActive('/') && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-primary rounded-full" />
            )}
          </Link>

          {/* Features Mega Dropdown */}
          <div
            ref={featuresMenuRef}
            className="relative"
            onMouseEnter={handleFeaturesMouseEnter}
            onMouseLeave={handleFeaturesMouseLeave}
          >
            <button
              type="button"
              onClick={() => setFeaturesMenuOpen((prev) => !prev)}
              aria-expanded={featuresMenuOpen}
              aria-haspopup="true"
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                isFeaturesActive || featuresMenuOpen
                  ? 'text-brand-primary font-bold bg-brand-veryLight/70'
                  : 'text-brand-muted hover:text-brand-primary hover:bg-brand-veryLight/60'
              }`}
            >
              <span>Features</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  featuresMenuOpen ? 'rotate-180 text-brand-primary' : 'text-slate-400'
                }`}
              />
              {isFeaturesActive && !featuresMenuOpen && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-primary rounded-full" />
              )}
            </button>

            {/* Dropdown Menu */}
            {featuresMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full pt-2 w-[340px] z-50 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 space-y-1">
                  <div className="px-3 pt-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Career Intelligence Tools
                    </span>
                    <span className="text-[10px] font-semibold text-brand-primary bg-blue-50 px-2 py-0.5 rounded-full">
                      Free Access
                    </span>
                  </div>

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

          {/* Secondary Links: Projects | Jobs | Templates | About | Contact */}
          {secondaryNavLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-brand-primary font-bold'
                    : 'text-brand-muted hover:text-brand-primary hover:bg-brand-veryLight/60'
                }`}
              >
                {link.name}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / User Section */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-brand-veryLight transition-colors"
              >
                <div className="w-8 h-8 rounded-full gradient-brand text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {getInitials(displayName)}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-brand-text leading-tight">{displayName}</p>
                  <p className="text-[10px] text-brand-muted font-medium">{workspaceLabel}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-brand-border/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-brand-text truncate">{displayName}</p>
                    <p className="text-[11px] text-brand-muted truncate">{displayEmail}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-brand-primary border border-blue-100">
                      <ShieldCheck className="w-3 h-3 text-brand-primary" />
                      <span>{workspaceLabel} Workspace</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to={getDashboardPath(user)}
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-brand-primary hover:bg-brand-veryLight transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand-primary" />
                      <span>Open Workspace</span>
                    </Link>

                    <Link
                      to="/project-submission"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-slate-400" />
                      <span>Submit Project</span>
                    </Link>

                    {user?.role !== 'ADMIN' && (
                      <>
                        <Link
                          to="/my-projects"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FolderGit2 className="w-4 h-4 text-slate-400" />
                          <span>My Projects</span>
                        </Link>

                        <Link
                          to="/resume-builder"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span>Resume Builder</span>
                        </Link>

                        <Link
                          to="/ats-analyzer"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-slate-400" />
                          <span>ATS Analyzer</span>
                        </Link>

                        <Link
                          to="/skill-intelligence"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <BrainCircuit className="w-4 h-4 text-slate-400" />
                          <span>Skill Intelligence</span>
                        </Link>

                        <Link
                          to="/applications"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Send className="w-4 h-4 text-slate-400" />
                          <span>Applications</span>
                        </Link>

                        <Link
                          to="/saved"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-slate-400" />
                          <span>Saved Items</span>
                        </Link>
                      </>
                    )}

                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile & Settings</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-brand-primary px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl gradient-brand text-white shadow-xs hover:shadow-md active:scale-95 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-xl text-slate-600 hover:text-brand-primary hover:bg-slate-50 border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-brand-border/80 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          {/* Main Links */}
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isActive('/') ? 'page' : undefined}
              className={`block px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/')
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {/* Features Accordion for Mobile */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/60 my-1">
              <button
                type="button"
                onClick={() => setMobileFeaturesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold text-slate-800"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                  <span>Features</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    mobileFeaturesOpen ? 'rotate-180 text-brand-primary' : ''
                  }`}
                />
              </button>

              {mobileFeaturesOpen && (
                <div className="px-2 pb-2.5 pt-1 space-y-1 bg-slate-50/90 border-t border-slate-200/60">
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
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`block px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-brand-primary font-bold border border-blue-100'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User Section in Mobile Drawer */}
          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-3 px-2 py-1">
                <div className="w-9 h-9 rounded-full gradient-brand text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {getInitials(displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-brand-text truncate">{displayName}</p>
                  <p className="text-[10px] text-brand-muted truncate">{displayEmail}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  to={getDashboardPath(user)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-brand-primary bg-blue-50/80 border border-blue-100"
                >
                  <LayoutDashboard className="w-4 h-4 text-brand-primary" />
                  <span>Open Workspace</span>
                </Link>

                <Link
                  to="/project-submission"
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
