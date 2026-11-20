import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  FileText,
  Download,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Database,
  Code2,
  Lock,
  Layers,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/common/SEO';
import { getBreadcrumbListSchema } from '@/utils/seoSchemas';

const TOPIC_FILTERS = [
  { id: 'ALL', name: 'All Preparation Topics' },
  { id: 'oop', name: 'Python OOP Concepts' },
  { id: 'exception-handling', name: 'Exception Handling' },
  { id: 'advanced-python', name: 'Advanced Python' },
  { id: 'sql', name: 'SQL Interview Questions' },
  { id: 'coding-questions', name: 'Python Coding Questions' },
];

const SAMPLE_PREPARATION_MATERIALS = [
  {
    id: 'mat-oop',
    topicId: 'oop',
    topicName: 'OOP Concepts',
    title: 'Python OOP Concepts',
    fileName: 'AspirePath_Python_OOPs_Theory_Questions_and_Answers.pdf',
    description: 'Comprehensive guide covering classes, encapsulation, inheritance patterns, polymorphism, abstract base classes, and dunder methods.',
    fileSizeFormatted: '1.3 MB',
    pageCount: 6,
    downloadCount: 148,
    categoryBadge: 'Interview Questions',
  },
  {
    id: 'mat-exc',
    topicId: 'exception-handling',
    topicName: 'Exception Handling',
    title: 'Exception Handling',
    fileName: 'AspirePath_Python_Exception_Handling_Theory_Questions_and_Answers.pdf',
    description: 'Master try-except-else-finally blocks, custom exception hierarchies, context managers with `__enter__` and `__exit__`, and clean error handling.',
    fileSizeFormatted: '1.3 MB',
    pageCount: 5,
    downloadCount: 112,
    categoryBadge: 'Core Concepts',
  },
  {
    id: 'mat-adv',
    topicId: 'advanced-python',
    topicName: 'Advanced Python',
    title: 'Advanced Python',
    fileName: 'AspirePath_Advanced_Python_Theory_Questions_and_Answers.pdf',
    description: 'Deep dive into Python GIL internals, memory management, garbage collection, generators, decorators, metaclasses, and asyncio event loops.',
    fileSizeFormatted: '1.3 MB',
    pageCount: 6,
    downloadCount: 204,
    categoryBadge: 'Deep Dive',
  },
  {
    id: 'mat-sql',
    topicId: 'sql',
    topicName: 'SQL',
    title: 'SQL Interview Questions',
    fileName: 'AspirePath_SQL_Theory_Questions_and_Answers.pdf',
    description: 'High-frequency relational database questions covering indexing strategies, ACID guarantees, complex multi-table joins, subqueries, and window functions.',
    fileSizeFormatted: '1.4 MB',
    pageCount: 7,
    downloadCount: 189,
    categoryBadge: 'Database Mastery',
  },
  {
    id: 'mat-coding',
    topicId: 'coding-questions',
    topicName: 'Coding Questions',
    title: 'Python Coding Interview Questions',
    fileName: 'AspirePath_Python_Coding_Questions_and_Solutions.pdf',
    description: 'Curated technical coding problems with optimal time and space complexity explanations, edge case handling, and step-by-step code walkthroughs.',
    fileSizeFormatted: '1.3 MB',
    pageCount: 7,
    downloadCount: 236,
    categoryBadge: 'Practical Coding',
  },
  {
    id: 'mat-guide',
    topicId: 'ALL',
    topicName: 'Interview Questions',
    title: 'Python Interview Preparation',
    fileName: 'AspirePath_Complete_Python_Interview_Guide.pdf',
    description: 'End-to-end Python developer interview guide featuring 120+ screened questions, company interview frameworks, and behavioral engineering tips.',
    fileSizeFormatted: '1.3 MB',
    pageCount: 12,
    downloadCount: 310,
    categoryBadge: 'Master Guide',
  },
];

const SAMPLE_INTERVIEW_QUESTIONS = [
  {
    question: 'How do Python OOP inheritance and the Method Resolution Order (MRO) work?',
    category: 'Python OOP Concepts',
    answer:
      'Python utilizes the C3 Linearization algorithm to determine the Method Resolution Order in multiple inheritance scenarios. You can inspect the resolution hierarchy on any class using ClassName.__mro__ or ClassName.mro(). Super() dynamically traverses this linearized list rather than directly calling the immediate parent.',
  },
  {
    question: 'Explain how Exception Handling with else and finally works under the hood.',
    category: 'Exception Handling',
    answer:
      'In Python try-except blocks, the `else` clause executes only if no exception was raised in the `try` block, preventing accidental catching of unrelated exceptions. The `finally` clause is guaranteed to run before leaving the block, even if a return, break, or unhandled exception occurs, making it ideal for resource cleanup.',
  },
  {
    question: 'What is the Global Interpreter Lock (GIL) and how does it affect concurrency?',
    category: 'Advanced Python',
    answer:
      'The GIL is a mutex that prevents multiple native threads from executing Python bytecodes simultaneously in CPython. For I/O-bound operations (network requests, disk reads), Python threads release the GIL. For CPU-bound tasks, multiprocessing or C extensions are preferred over multithreading to achieve true multicore parallelism.',
  },
  {
    question: 'How do window functions like ROW_NUMBER() and DENSE_RANK() work in SQL?',
    category: 'SQL Interview Questions',
    answer:
      'Window functions perform calculations across a set of table rows related to the current row without collapsing rows like GROUP BY does. ROW_NUMBER() assigns a unique sequential integer starting at 1, while DENSE_RANK() assigns rankings without skipping numbers when ties occur in the ORDER BY clause.',
  },
];

export default function PublicPlacementPrepPage() {
  const { isAuthenticated } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const filteredMaterials =
    selectedTopic === 'ALL'
      ? SAMPLE_PREPARATION_MATERIALS
      : SAMPLE_PREPARATION_MATERIALS.filter(
          (m) => m.topicId === selectedTopic || m.topicId === 'ALL'
        );

  const workflowSteps = [
    {
      step: '01',
      title: 'Role-Specific Curriculums',
      desc: 'Browse tailored tracks designed around actual placement interview patterns for Python Developers, Full Stack Engineers, and Data Analysts.',
    },
    {
      step: '02',
      title: 'Topic-Wise Learning Resources',
      desc: 'Deep-dive into modular topic categories: from OOP fundamentals and Exception Handling to Advanced Internals and relational SQL.',
    },
    {
      step: '03',
      title: 'Real Interview Question Banks',
      desc: 'Review high-frequency theoretical and coding questions asked by leading product and tech consulting placement panels.',
    },
    {
      step: '04',
      title: 'Verified PDF Study Guides',
      desc: 'Download authentic, comprehensive revision guides directly to your local device for offline placement preparation.',
    },
  ];

  return (
    <div className="space-y-20 pb-24 overflow-hidden">
      <SEO
        title="Placement Preparation Center | Technical Interview Questions & Guides | AspirePath"
        description="Prepare for technical interviews with structured questions and topic-wise learning resources covering Python OOP concepts, Exception Handling, Advanced Python, SQL, and Coding Questions."
        canonical="/features/placement-preparation"
        schema={[
          getBreadcrumbListSchema([
            { name: 'Home', item: '/' },
            { name: 'Features', item: '/features/placement-preparation' },
            { name: 'Placement Preparation', item: '/features/placement-preparation' },
          ]),
        ]}
      />

      {/* Hero Header */}
      <section className="relative pt-10 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-emerald-200/40 via-blue-100/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="cyan" size="sm" className="mb-4">
            <GraduationCap className="w-3.5 h-3.5 mr-1 text-brand-primary" />
            Interview Readiness Engine
          </Badge>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-brand-text tracking-tight leading-[1.15]">
            Placement Preparation Center
          </h1>

          <p className="mt-5 text-base sm:text-xl text-brand-muted leading-relaxed">
            Prepare for technical interviews with structured questions and topic-wise learning resources. Master Python OOP concepts, Exception Handling, Advanced Python, and SQL with verified revision guides.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/placement-preparation">
                <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="font-bold px-8 shadow-card">
                  Explore Placement Preparation
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register?redirect=/placement-preparation">
                  <Button size="lg" variant="gradient" rightIcon={ArrowRight} className="font-bold px-8 shadow-card">
                    Start Preparing
                  </Button>
                </Link>
                <Link to="/login?redirect=/placement-preparation">
                  <Button size="lg" variant="outline" className="font-semibold px-6 bg-white">
                    Sign In to Access Guides
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Curated by Senior Engineers • Offline PDF Revision • Real Placement Questions</span>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden">
          {/* Top Bar */}
          <div className="bg-slate-50 border-b border-brand-border px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Interactive Placement Preparation Preview • Python Developer Track</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
              <Info className="w-3.5 h-3.5" />
              <span>Interactive Catalog Preview</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Topic Filter Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Filter by Technical Preparation Topic:
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_FILTERS.map((topic) => {
                  const active = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        active
                          ? 'bg-brand-primary text-white shadow-card scale-102'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{topic.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Card Grid — Matching Authentic Student Card Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-card transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-4">
                    {/* Top Badges Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold text-xs">
                        PDF
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-primary font-semibold text-[11px]">
                          {material.categoryBadge}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Guide</span>
                        </span>
                      </div>
                    </div>

                    {/* Document Title & File Details */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                        {material.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{material.fileName}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {material.description}
                    </p>

                    {/* Metadata Row */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{material.fileSizeFormatted}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{material.pageCount} pages</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>{material.downloadCount} downloads</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100">
                    {isAuthenticated ? (
                      <Link to="/placement-preparation/python-developer">
                        <button
                          type="button"
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-brand-primary hover:bg-blue-600 text-white shadow-xs transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download PDF Guide</span>
                        </button>
                      </Link>
                    ) : (
                      <Link to="/login?redirect=/placement-preparation">
                        <button
                          type="button"
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-brand-primary hover:bg-blue-600 text-white shadow-xs transition-all"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Sign In to Download PDF</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Real Interview Question Bank Spotlight Preview */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Technical Question Spotlight
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">
                    High-Frequency Python & SQL Placement Questions
                  </h3>
                </div>
                <Badge variant="cyan" size="sm" className="bg-cyan-950 text-cyan-300 border-cyan-800">
                  Model Answers Included
                </Badge>
              </div>

              {/* Question Selection Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {SAMPLE_INTERVIEW_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`p-3 text-left rounded-xl text-xs font-semibold transition-all border ${
                      activeQuestionIndex === idx
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-cyan-300 mb-1">
                      {q.category}
                    </div>
                    <div className="line-clamp-2">{q.question}</div>
                  </button>
                ))}
              </div>

              {/* Active Question & Model Answer */}
              <div className="p-5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Question: {SAMPLE_INTERVIEW_QUESTIONS[activeQuestionIndex].question}</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans pl-6 border-l-2 border-cyan-500">
                  {SAMPLE_INTERVIEW_QUESTIONS[activeQuestionIndex].answer}
                </div>
              </div>
            </div>

            {/* Authenticated Callout Box */}
            <div className="rounded-2xl bg-brand-veryLight border border-brand-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-brand-primary border border-brand-border flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-text">
                    Access Complete Question Banks & Verified PDFs
                  </h4>
                  <p className="text-xs text-brand-muted">
                    Authenticate to view all technical interview categories, test your readiness, and download verified guides directly to your device.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto">
                <Link to="/register?redirect=/placement-preparation" className="w-full sm:w-auto">
                  <Button variant="gradient" size="sm" rightIcon={ArrowRight} className="w-full sm:w-auto font-bold px-6">
                    Start Preparing Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="cyan" size="sm" className="mb-2">
            Structured Preparation Flow
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-text">
            How AspirePath Placement Prep Works
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Deliberate preparation methodology engineered to give students technical mastery during placement drives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <Card key={step.step} className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center">
                {step.step}
              </div>
              <h3 className="font-bold text-base text-brand-text">{step.title}</h3>
              <p className="text-xs text-brand-muted leading-relaxed">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold">
              Ace Your Technical Placement Interviews
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Equip yourself with comprehensive question frameworks, architectural concepts, and domain-specific revision guides.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link to="/register?redirect=/placement-preparation">
                <Button size="lg" variant="white" className="!bg-white !text-emerald-800 font-bold px-8">
                  Start Preparing Free
                </Button>
              </Link>
              <Link to="/features/skill-intelligence">
                <Button size="lg" variant="outline" className="text-white border-white/60 hover:bg-white/10 px-6">
                  Check Skill Intelligence
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
