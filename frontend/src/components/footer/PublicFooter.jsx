import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Instagram, Mail, Sparkles, Smartphone } from 'lucide-react';
import logoPng from '@/assets/logo.png';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const [logoError, setLogoError] = useState(false);

  return (
    <footer className="bg-white border-t border-brand-border text-brand-text">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 group" aria-label="AspirePath Home">
              {!logoError ? (
                <img
                  src={logoPng}
                  alt="AspirePath"
                  width="150"
                  height="40"
                  loading="lazy"
                  onError={() => setLogoError(true)}
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
                    A
                  </div>
                  <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
                    Aspire<span className="text-brand-primary">Path</span>
                  </span>
                </div>
              )}
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
                href="https://www.linkedin.com/company/aspirepath-career-platform/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-slate-50 border border-brand-border flex items-center justify-center text-slate-500 hover:text-brand-primary hover:bg-brand-veryLight transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/aspirepath.official/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-slate-50 border border-brand-border flex items-center justify-center text-slate-500 hover:text-brand-primary hover:bg-brand-veryLight transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>

            {/* Official Contact Email */}
            <div className="pt-1">
              <a
                href="mailto:aspirepath.team@gmail.com"
                className="inline-flex items-center gap-2 text-xs text-brand-muted hover:text-brand-primary transition-colors font-medium group"
              >
                <Mail className="w-3.5 h-3.5 text-brand-primary group-hover:scale-110 transition-transform" />
                <span>aspirepath.team@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Platform</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/features/ats-analyzer" className="text-brand-muted hover:text-brand-primary transition-colors">
                  ATS Resume Analyzer
                </Link>
              </li>
              <li>
                <Link to="/features/skill-intelligence" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Skill Intelligence
                </Link>
              </li>
              <li>
                <Link to="/features/placement-preparation" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Placement Preparation
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Resume Templates
                </Link>
              </li>
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
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Resources</h3>
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
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Company & Legal</h3>
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
                <Link to="/privacy" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-brand-muted hover:text-brand-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sub-Footer */}
      <div className="border-t border-brand-border bg-slate-50/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-muted">
          <div>
            © {currentYear} AspirePath. Built for students worldwide.
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
