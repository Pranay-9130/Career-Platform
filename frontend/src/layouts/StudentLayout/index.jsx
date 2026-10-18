import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  FileText,
  Sparkles,
  Send,
  Bookmark,
  User,
  X,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Briefcase,
  Compass,
  FileCheck,
  BrainCircuit,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StudentNavbar } from '@/components/navbar';
import { dashboardService } from '@/services/dashboardService';

export default function StudentLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({ projects: null, applications: null, saved: null });
  const location = useLocation();
  const { user } = useAuth();

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const summary = await dashboardService.getSummary();
      if (summary?.stats) {
        setCounts({
          projects: summary.stats.projects_count ?? 0,
          applications: summary.stats.active_applications_count ?? 0,
          saved: summary.stats.saved_items_count ?? 0,
        });
      }
    } catch (err) {
      console.error('Failed to load workspace counts for sidebar:', err);
      setCounts((prev) => ({
        projects: prev.projects ?? 0,
        applications: prev.applications ?? 0,
        saved: prev.saved ?? 0,
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchCounts();
    const handleWorkspaceUpdate = () => {
      fetchCounts();
    };
    window.addEventListener('workspace-counts-updated', handleWorkspaceUpdate);
    return () => {
      window.removeEventListener('workspace-counts-updated', handleWorkspaceUpdate);
    };
  }, [fetchCounts, location.pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileSidebarOpen]);

  const navSections = [
    {
      title: 'Workspace',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          description: 'Overview & metrics',
        },
        {
          name: 'My Projects',
          path: '/my-projects',
          icon: FolderGit2,
          badge: counts.projects !== null ? String(counts.projects) : null,
          description: 'Blueprints & submissions',
        },
        {
          name: 'Applications',
          path: '/applications',
          icon: Send,
          badge: counts.applications !== null ? String(counts.applications) : null,
          description: 'Job tracking & status',
        },
        {
          name: 'Saved Items',
          path: '/saved',
          icon: Bookmark,
          badge: counts.saved !== null && counts.saved > 0 ? String(counts.saved) : null,
          description: 'Bookmarked jobs & projects',
        },
      ],
    },
    {
      title: 'Career Tools',
      items: [
        {
          name: 'Resume Builder',
          path: '/resume-builder',
          icon: FileText,
          description: 'Tailored tech resumes',
        },
        {
          name: 'ATS Analyzer',
          path: '/ats-analyzer',
          icon: Sparkles,
          description: 'AI match & optimization',
        },
        {
          name: 'Skill Intelligence',
          path: '/skill-intelligence',
          icon: BrainCircuit,
          description: 'Gap analysis & roadmap',
        },
      ],
    },
    {
      title: 'Explore Platform',
      items: [
        {
          name: 'Browse Projects',
          path: '/projects',
          icon: Compass,
          description: 'Peer showcase & ideas',
        },
        {
          name: 'Find Jobs',
          path: '/jobs',
          icon: Briefcase,
          description: 'Verified opportunities',
        },
        {
          name: 'Resume Templates',
          path: '/templates',
          icon: FileCheck,
          description: 'Industry-standard formats',
        },
      ],
    },
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
  const workspaceLabel = user?.role === 'CONTRIBUTOR' ? 'Job Seeker Workspace' : 'Student Workspace';

  const renderNavLinks = () => (
    <div className="p-3 space-y-6">

      {/* Categorized Nav Sections */}
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {section.title}
          </div>
          <nav className="space-y-0.5" aria-label={section.title}>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all relative ${
                    isActive
                      ? 'bg-brand-veryLight text-brand-primary font-bold shadow-xs border-l-4 border-brand-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-brand-primary' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-brand-primary text-white'
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
        </div>
      ))}
    </div>
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
            className="flex items-center gap-2.5 font-display font-extrabold text-base text-brand-text group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-cyan flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:shadow transition-all">
              CP
            </div>
            <div className="flex flex-col">
              <span className="tracking-tight leading-none">
                Career<span className="text-brand-primary">Platform</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                {workspaceLabel}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-2">{renderNavLinks()}</div>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-brand-border bg-slate-50/60 space-y-2">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-brand-border transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-brand-text truncate">
                  {displayName}
                </p>
                {user?.is_verified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {displayHeadline}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </Link>

          {user?.username && (
            <Link
              to={`/u/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-brand-primary hover:bg-brand-veryLight transition-colors"
            >
              <span>View Public Portfolio</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
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

          <div className="relative w-72 max-w-[85vw] h-full bg-white border-r border-brand-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-brand-border">
              <Link
                to="/dashboard"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2 font-display font-extrabold text-base text-brand-text"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-cyan flex items-center justify-center text-white text-xs font-bold">
                  CP
                </div>
                <span>{workspaceLabel}</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-text hover:bg-slate-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>

            <div className="p-3 border-t border-brand-border bg-slate-50/60">
              <Link
                to="/profile"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white"
              >
                <div className="w-8 h-8 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary flex items-center justify-center font-bold text-xs">
                  {getInitials(displayName)}
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-bold text-brand-text truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400">Settings & Profile</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <StudentNavbar onToggleSidebar={() => setMobileSidebarOpen(true)} />
        <main
          id="main-content"
          tabIndex="-1"
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto outline-none"
        >
          <Outlet context={{ refreshSidebarCounts: fetchCounts }} />
        </main>
      </div>
    </div>
  );
}
