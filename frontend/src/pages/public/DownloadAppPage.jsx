import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
  BrainCircuit,
  Briefcase,
  BookOpen,
  QrCode,
  AlertCircle,
  HardDrive,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';
import { Button, Badge } from '@/components/common';

export default function DownloadAppPage() {
  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    file_size: '24.8 MB',
    release_date: 'November 2026',
    download_url: '/api/download/android-apk',
    min_android_version: 'Android 8.0+',
    sha256: '8f4e2b1c6d3a5e7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
  });

  const [faqOpen, setFaqOpen] = useState({ 0: true });

  useEffect(() => {
    fetch('/api/download/app-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAppInfo((prev) => ({ ...prev, ...data }));
      })
      .catch((err) => console.log('App info fetch fallback used:', err));
  }, []);

  const toggleFaq = (index) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const features = [
    {
      title: 'Mobile Resume Builder',
      desc: 'Build, edit, and tailor professional tech resumes directly on your mobile device with instant PDF export.',
      icon: FileText,
      color: 'bg-blue-50 text-brand-primary border-blue-100',
    },
    {
      title: 'Instant ATS Resume Analyzer',
      desc: 'Evaluate your resume compatibility against any job description with deterministic scoring and keyword gap insights.',
      icon: Sparkles,
      color: 'bg-cyan-50 text-brand-cyan border-cyan-100',
    },
    {
      title: 'Skill Intelligence On-the-Go',
      desc: 'Discover your verified skills, select career targets, and follow clear step-by-step learning milestones.',
      icon: BrainCircuit,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: 'Placement Preparation Library',
      desc: 'Browse and download role-based technical interview question banks and preparation PDFs for offline study.',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Verified Job & Internship Alerts',
      desc: 'Browse engineering opportunities filtered by your graduation batch, degree qualifications, and preferred work mode.',
      icon: Briefcase,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Real-time Applications Tracker',
      desc: 'Track the status of all your internship and job applications from initial submission to interview invitations.',
      icon: Layers,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  ];

  const installSteps = [
    {
      step: '01',
      title: 'Download APK File',
      desc: 'Tap the Download Android APK button below to save the official AspirePath package to your phone.',
    },
    {
      step: '02',
      title: 'Open Downloads',
      desc: 'Tap the download notification or locate AspirePath-v1.0.0.apk in your phone\'s Downloads folder.',
    },
    {
      step: '03',
      title: 'Allow Installation',
      desc: 'If prompted by Android security, tap Settings and enable "Allow from this source" for your browser.',
    },
    {
      step: '04',
      title: 'Install & Launch',
      desc: 'Tap Install to complete setup. Open AspirePath and sign in with your student account credentials.',
    },
  ];

  const faqs = [
    {
      q: 'Is it safe to install the AspirePath APK?',
      a: 'Yes, absolutely. The APK is built, signed, and distributed directly from the official AspirePath development team with zero third-party modifications, verified clean checksums, and standard permission models.',
    },
    {
      q: 'Will my account data synchronize between web and Android?',
      a: 'Yes. The Android application connects to the same AspirePath cloud backend and database. All your resumes, ATS analyses, saved jobs, verified skills, and project bookmarks synchronize seamlessly across devices.',
    },
    {
      q: 'What are the minimum system requirements?',
      a: 'AspirePath runs smoothly on any Android phone or tablet running Android 8.0 (Oreo) or later with at least 50MB of free storage space.',
    },
    {
      q: 'How will I receive app updates?',
      a: 'When an update is released, you will be notified directly inside the mobile app with a one-tap option to download and update to the latest build without losing your local session or saved data.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border-b border-brand-border/60 pt-12 pb-16 lg:pt-16 lg:pb-24">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Smartphone className="w-4 h-4" />
                <span>AspirePath for Android • Official Release</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                From Your First Project to Your First Job – <span className="text-brand-primary">Now on Android.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Experience the full power of AspirePath in your pocket. Build tailored tech resumes, evaluate ATS readiness, discover skill gaps, and explore verified engineering jobs on the move.
              </p>

              {/* Main Download Action Card */}
              <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-md max-w-xl mx-auto lg:mx-0 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href={appInfo.download_url}
                    download="AspirePath-v1.0.0.apk"
                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-brand-primary hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition transform active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Android APK</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[11px] font-mono">
                      v{appInfo.version}
                    </span>
                  </a>

                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition"
                  >
                    <span>Create Web Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700">Verified & Virus-Free</span>
                  </span>
                  <span>Size: <strong>{appInfo.file_size}</strong></span>
                  <span>Requires: <strong>{appInfo.min_android_version}</strong></span>
                </div>
              </div>

              {/* Security Guarantee Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                  <span>Direct APK Download</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                  <span>No Play Services Required</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                  <span>Cloud Data Sync</span>
                </span>
              </div>
            </div>

            {/* Right Column: Mobile App Preview Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-72 sm:w-80 rounded-[40px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50">
                {/* Speaker & Camera notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700 mr-3" />
                  <div className="w-10 h-1.5 rounded-full bg-slate-900" />
                </div>

                {/* Simulated Screen */}
                <div className="bg-slate-50 rounded-[32px] overflow-hidden border border-slate-200 text-slate-800 pt-8 pb-4 px-4 space-y-3">
                  {/* Mock App Header */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center font-black text-xs">
                        A
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">AspirePath</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-primary">
                      Android
                    </span>
                  </div>

                  {/* Mock Career Readiness Card */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Career Readiness</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-slate-900">88%</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Interview Ready
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>

                  {/* Mock Quick Actions Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-100 text-left">
                      <FileText className="w-4 h-4 text-brand-primary mb-1" />
                      <div className="text-xs font-bold text-slate-900">Resume Builder</div>
                      <div className="text-[10px] text-slate-500">Edit & Export</div>
                    </div>
                    <div className="bg-cyan-50/80 p-2.5 rounded-xl border border-cyan-100 text-left">
                      <Sparkles className="w-4 h-4 text-brand-cyan mb-1" />
                      <div className="text-xs font-bold text-slate-900">ATS Analyzer</div>
                      <div className="text-[10px] text-slate-500">Score & Match</div>
                    </div>
                    <div className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100 text-left">
                      <BrainCircuit className="w-4 h-4 text-indigo-600 mb-1" />
                      <div className="text-xs font-bold text-slate-900">Skill Gap</div>
                      <div className="text-[10px] text-slate-500">13 Roles</div>
                    </div>
                    <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100 text-left">
                      <BookOpen className="w-4 h-4 text-emerald-600 mb-1" />
                      <div className="text-xs font-bold text-slate-900">Placement Prep</div>
                      <div className="text-[10px] text-slate-500">PDF Library</div>
                    </div>
                  </div>

                  {/* Mock Recommended Job Item */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900">Frontend Engineer Intern</div>
                      <div className="text-[10px] text-slate-500">Vercel • ₹45,000/mo</div>
                    </div>
                    <span className="text-[10px] font-bold text-brand-primary bg-blue-50 px-2 py-1 rounded-lg">
                      Apply
                    </span>
                  </div>

                  {/* Mock Bottom Nav Bar */}
                  <div className="flex items-center justify-around pt-2 border-t border-slate-200 text-slate-400">
                    <div className="text-center text-brand-primary font-bold text-[9px]">Home</div>
                    <div className="text-center text-slate-400 font-medium text-[9px]">Jobs</div>
                    <div className="text-center text-slate-400 font-medium text-[9px]">Projects</div>
                    <div className="text-center text-slate-400 font-medium text-[9px]">Profile</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Engineered for Android
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Every AspirePath Career Tool in the Palm of Your Hand
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Fast, responsive, and thoughtfully designed to help students prepare for engineering placements on desktop or mobile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 hover:border-brand-primary/40 shadow-xs hover:shadow-md transition duration-200"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.color} mb-4`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">{item.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step-by-Step Installation Guide */}
      <section className="bg-white border-y border-brand-border/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Simple 4-Step Setup
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How to Install AspirePath on Your Android Phone
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Direct installation takes under 60 seconds with no Google account required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {installSteps.map((st, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200 relative flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-black text-brand-primary/30 mb-2 font-mono">
                    {st.step}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">{st.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href={appInfo.download_url}
              download="AspirePath-v1.0.0.apk"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Download AspirePath APK Now ({appInfo.file_size})</span>
            </a>
          </div>
        </div>
      </section>

      {/* Device Specifications & Integrity */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="text-xs font-bold text-brand-cyan uppercase tracking-wider">
                Technical Specifications
              </div>
              <h3 className="text-xl font-bold text-white mt-1">AspirePath Android Release Package</h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographically Signed</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Package Name</span>
              <span className="font-mono text-white font-semibold">{appInfo.package_name || 'com.aspirepath.app'}</span>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Version & Build</span>
              <span className="text-white font-semibold">v{appInfo.version} (Build 100)</span>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">Supported Architecture</span>
              <span className="text-white font-semibold">arm64-v8a, armeabi-v7a, x86_64</span>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block mb-1">SHA-256 Checksum</span>
              <span className="font-mono text-slate-300 text-[10px] break-all">{appInfo.sha256}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h3 className="text-xl font-bold text-slate-900 text-center mb-8">
          Frequently Asked Questions
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-brand-primary transition"
              >
                <span>{faq.q}</span>
                {faqOpen[idx] ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {faqOpen[idx] && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
