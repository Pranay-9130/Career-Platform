import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  GraduationCap,
  Briefcase,
  IndianRupee,
  Percent,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Zap,
  TrendingUp,
  Award,
  BookOpen,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getBreadcrumbListSchema } from '@/utils/seoSchemas';

const SURVIVAL_TOOLS_PREVIEW = [
  {
    id: 'attendance',
    name: 'Attendance Calculator',
    tagline: 'Track attendance and plan your attendance recovery.',
    description:
      'Avoid detention and hall ticket issues. Calculate your exact percentage, find how many consecutive classes you must attend to reach 75% or 85%, or see how many safe leaves you have left.',
    icon: CalendarCheck2,
    badge: 'Detention Shield',
    color: 'emerald',
    iconBg: 'bg-emerald-50 text-emerald-600',
    link: '/college-survival-kit/attendance',
    features: ['75% & 85% Threshold Presets', 'Consecutive Recovery Days', 'Safe Bunk / Leave Buffer'],
  },
  {
    id: 'cgpa',
    name: 'CGPA / SGPA Calculator',
    tagline: 'Calculate academic performance and target future CGPA.',
    description:
      'Grade points shouldn’t be a mystery. Compute your semester SGPA with weighted course credits, convert between CGPA and percentage, and plan the exact grades you need in upcoming semesters.',
    icon: GraduationCap,
    badge: 'Semester Planner',
    color: 'blue',
    iconBg: 'bg-blue-50 text-blue-600',
    link: '/college-survival-kit/cgpa',
    features: ['Custom Credit Weightages', 'Future Target Planner', 'Percentage & 9.5x Equivalence'],
  },
  {
    id: 'placement-eligibility',
    name: 'Placement Eligibility Checker',
    tagline: 'Understand whether you meet placement criteria.',
    description:
      'Evaluate your profile instantly against top recruiter benchmarks: Tier-1 Product Giants (FAANG/MAMAA), FinTech & Quant firms, IT Services (TCS, Infosys, Wipro), and High-Growth Startups.',
    icon: Briefcase,
    badge: 'Career Filter',
    color: 'indigo',
    iconBg: 'bg-indigo-50 text-indigo-600',
    link: '/college-survival-kit/placement-eligibility',
    features: ['Tier-1 Recruiter Benchmarks', 'Backlog & Gap Year Rules', 'Actionable Fix Recommendations'],
  },
  {
    id: 'salary',
    name: 'CTC to In-Hand Salary Calculator',
    tagline: 'Estimate your monthly take-home salary.',
    description:
      'Demystify confusing campus CTC numbers. Break down annual packages into monthly in-hand take-home salary, Employee PF, Gratuity, Professional Tax, and Income Tax under the New Tax Regime.',
    icon: IndianRupee,
    badge: 'Offer Analyzer',
    color: 'amber',
    iconBg: 'bg-amber-50 text-amber-600',
    link: '/college-survival-kit/salary',
    features: ['CTC vs Monthly In-Hand', 'EPF & Gratuity Deductions', 'FY 2025-26 New Tax Regime'],
  },
  {
    id: 'marks',
    name: 'Marks & Percentage Calculator',
    tagline: 'Calculate marks and academic percentages.',
    description:
      'Quickly convert raw marks to percentage, aggregate multi-subject semester scores, identify your top and focus subjects, and calculate the exact score you need in end-sem exams.',
    icon: Percent,
    badge: 'Exam Assistant',
    color: 'cyan',
    iconBg: 'bg-cyan-50 text-cyan-600',
    link: '/college-survival-kit/marks',
    features: ['Single & Multi-Subject Modes', 'End-Sem Target Finder', 'Division & Honors Classifier'],
  },
];

export default function PublicCollegeSurvivalKitPage() {
  const { isAuthenticated } = useAuth();

  const breadcrumbs = [
    { name: 'Home', url: 'https://aspirepath.com' },
    { name: 'Features', url: 'https://aspirepath.com/features' },
    { name: 'College Survival Kit', url: 'https://aspirepath.com/features/college-survival-kit' },
  ];

  const studentBenefits = [
    {
      title: 'Zero Guesswork in College Life',
      desc: 'Whether it is managing attendance before exams or figuring out what a 10 LPA offer actually pays every month, get clear answers in seconds.',
      icon: Zap,
    },
    {
      title: 'Placement-Ready Decisions',
      desc: 'Know your eligibility before recruitment season starts. Fix backlogs and target academic benchmarks proactively.',
      icon: TrendingUp,
    },
    {
      title: 'Private & Instant',
      desc: 'All calculations are computed instantly in your browser without saving sensitive personal data or requiring complex setups.',
      icon: ShieldCheck,
    },
    {
      title: 'Built by Engineers for Students',
      desc: 'Tailored specifically for Indian university and engineering college grading schemes (AICTE, Autonomous, State Universities).',
      icon: Award,
    },
  ];

  const faqs = [
    {
      q: 'Do I need to create an account to use the College Survival Kit?',
      a: 'No! All five calculators in the College Survival Kit are completely free and accessible without login. Registered AspirePath students can also access them directly inside their student dashboard alongside their resume builder and skill analytics.',
    },
    {
      q: 'How does the Attendance Calculator calculate recovery days?',
      a: 'If your current attendance is below 75% (or your chosen target), the calculator uses the formula: (Target × Total - 100 × Attended) / (100 - Target). This gives you the exact number of consecutive classes you must attend without taking any leaves to cross the safety threshold.',
    },
    {
      q: 'How is the In-Hand Salary calculated from CTC?',
      a: 'Cost to Company (CTC) includes non-cash components and retirals like Employer Provident Fund (12% of basic), Gratuity (~4.81% of basic), group medical insurance, and variable bonus. Our calculator strips these out and applies Employee PF, Professional Tax, and Income Tax to give you realistic monthly bank credit estimates.',
    },
    {
      q: 'Can I use the CGPA Calculator for my university’s credit system?',
      a: 'Yes. You can customize credit values (e.g. 4 credits for core subjects, 1.5 credits for labs) and enter letter grades from O (10) down to F (0) according to standard 10-point scales.',
    },
  ];

  return (
    <div className="space-y-20 pb-24 overflow-hidden">
      <SEO
        title="College Survival Kit – Everyday College Calculators & Tools | AspirePath"
        description="Your college life, simplified. Free attendance calculator, CGPA/SGPA planner, placement eligibility checker, CTC to in-hand salary calculator, and marks percentage tools."
        keywords="college survival kit, attendance calculator, college attendance recovery, cgpa calculator, placement eligibility checker, in hand salary calculator, aspirepath college tools"
        structuredData={[getBreadcrumbListSchema(breadcrumbs)]}
      />

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-brand-primary shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
          <span>College Survival Kit</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-normal">Your college life, simplified.</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Every Essential Calculator You Need To{' '}
          <span className="bg-gradient-to-r from-brand-primary via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            Survive & Excel
          </span>{' '}
          in College.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          From tracking attendance and calculating CGPA to checking placement eligibility and understanding salary packages, get the essential tools you need to manage your college journey.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/college-survival-kit">
            <Button size="lg" className="shadow-md shadow-brand-primary/20 flex items-center gap-2 px-8 py-3.5">
              <span>Explore College Survival Kit</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {isAuthenticated ? (
            <Link to="/student/dashboard">
              <Button variant="outline" size="lg" className="px-6 py-3.5">
                Go to Student Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button variant="outline" size="lg" className="px-6 py-3.5">
                Create Free Student Account
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Five Interactive Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Five Purpose-Built Calculators for Students
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Click on any tool below to launch the calculator and run instant calculations with zero setup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SURVIVAL_TOOLS_PREVIEW.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                className="p-6 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-200 group bg-white border border-slate-200/80 rounded-2xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tool.iconBg}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="text-[11px] font-semibold text-slate-600">
                      {tool.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs font-semibold text-brand-primary mt-0.5">
                      {tool.tagline}
                    </p>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {tool.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link to={tool.link}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2 text-brand-primary border-brand-primary/30 hover:bg-brand-primary hover:text-white group-hover:bg-brand-primary group-hover:text-white transition-all font-semibold"
                    >
                      <span>Open Calculator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}

          {/* Bonus Sixth Card: All-in-One Hub */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-primary to-blue-700 text-white flex flex-col justify-between shadow-md">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <Badge className="bg-white/20 text-white border-none text-[11px]">
                  All Tools in One Place
                </Badge>
                <h3 className="text-xl font-bold mt-2 text-white">
                  College Survival Kit Hub
                </h3>
                <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                  Switch between calculators seamlessly with synced tabs and unified calculations tailored for Indian engineering students.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link to="/college-survival-kit">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-white text-brand-primary font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Launch All Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Student Benefits Showcase */}
      <section className="bg-slate-50 py-16 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Why Every Student Needs the Survival Kit
            </h2>
            <p className="text-sm text-slate-600">
              Stop stressing over manual formulas and spreadsheets. Focus your energy where it counts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {studentBenefits.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600">
            Everything you need to know about the AspirePath College Survival Kit.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-6 border border-slate-200/80 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-900 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-2.5 pl-6.5 leading-relaxed">
                {faq.a}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-primary via-blue-700 to-indigo-800 p-8 sm:p-12 text-white text-center space-y-6 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for effortless college planning?</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black max-w-2xl mx-auto leading-tight">
            Take Control of Your College Journey Today
          </h2>

          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
            Free access to all five calculators. No subscriptions, no hidden limits. Start calculating now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/college-survival-kit">
              <Button size="lg" className="bg-white text-brand-primary hover:bg-blue-50 font-bold px-8 py-3.5 shadow-md">
                Open College Survival Kit Now
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <Button variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 px-6 py-3.5">
                  Sign Up with Student Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
