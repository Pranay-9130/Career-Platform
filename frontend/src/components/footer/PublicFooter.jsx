import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-brand-border text-brand-text">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-xl text-brand-text">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-cyan flex items-center justify-center text-white text-sm font-bold shadow-sm">
                CP
              </div>
              <span className="tracking-tight">
                Career<span className="text-brand-primary">Platform</span>
              </span>
            </Link>

            <p className="text-sm font-medium text-brand-primary italic">
              “From your first project to your first job.”
            </p>

            <p className="text-xs text-brand-muted leading-relaxed max-w-sm">
              A unified career preparation platform empowering students to discover practical project ideas,
              showcase verified software portfolios, build ATS-ready resumes, and secure entry-level opportunities.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-lg bg-slate-50 border border-brand-border flex items-center justify-center text-slate-500 hover:text-brand-primary hover:bg-brand-veryLight transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-slate-50 border border-brand-border flex items-center justify-center text-slate-500 hover:text-brand-primary hover:bg-brand-veryLight transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="w-8 h-8 rounded-lg bg-slate-50 border border-brand-border flex items-center justify-center text-slate-500 hover:text-brand-primary hover:bg-brand-veryLight transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-text uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/projects" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Explore Projects
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Jobs & Internships
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Resume Templates
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Resume Builder
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-brand-muted hover:text-brand-primary transition-colors">
                  AI ATS Analyzer
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-text uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/design-system" className="text-brand-muted hover:text-brand-primary transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-brand-primary" />
                  UI Design System
                </Link>
              </li>
              <li>
                <Link to="/submission-guidelines" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Submission Rules
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Platform Architecture
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Help Center & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-text uppercase tracking-wider">Company & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="text-brand-muted hover:text-brand-primary transition-colors">
                  About Mission
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sub-Footer */}
      <div className="border-t border-brand-border bg-slate-50/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-muted">
          <div>
            © {currentYear} Student Career Platform. Built for students worldwide.
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-brand-success animate-pulse" />
            <span className="text-slate-500 font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
