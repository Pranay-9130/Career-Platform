import React, { useState, useId } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award,
  Building,
  Briefcase,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';

export default function PlacementEligibilityChecker() {
  const [tenthMarks, setTenthMarks] = useState(78);
  const [twelfthMarks, setTwelfthMarks] = useState(75);
  const [degreeCgpa, setDegreeCgpa] = useState(7.6);
  const [activeBacklogs, setActiveBacklogs] = useState(0);
  const [deadBacklogs, setDeadBacklogs] = useState(0);
  const [gapYears, setGapYears] = useState(0);

  const tenthInputId = useId();
  const twelfthInputId = useId();
  const cgpaInputId = useId();
  const activeBacklogsInputId = useId();
  const deadBacklogsInputId = useId();
  const gapYearsInputId = useId();

  const tenth = Math.min(100, Math.max(0, parseFloat(tenthMarks) || 0));
  const twelfth = Math.min(100, Math.max(0, parseFloat(twelfthMarks) || 0));
  const cgpa = Math.min(10, Math.max(0, parseFloat(degreeCgpa) || 0));
  const activeBk = Math.max(0, parseInt(activeBacklogs, 10) || 0);
  const deadBk = Math.max(0, parseInt(deadBacklogs, 10) || 0);
  const gaps = Math.max(0, parseInt(gapYears, 10) || 0);

  // Criteria Tiers
  const tiers = [
    {
      id: 'tier1',
      name: 'Product Companies & Tech Giants',
      examples: 'Google, Microsoft, Amazon, Uber, Atlassian',
      packageRange: '14 LPA – 45+ LPA',
      badge: 'Super Dream',
      badgeVariant: 'primary',
      rules: [
        { label: '10th Marks >= 70%', passed: tenth >= 70, current: `${tenth}%` },
        { label: '12th/Diploma >= 70%', passed: twelfth >= 70, current: `${twelfth}%` },
        { label: 'Degree CGPA >= 7.5', passed: cgpa >= 7.5, current: `${cgpa} CGPA` },
        { label: '0 Active Backlogs', passed: activeBk === 0, current: `${activeBk} backlogs` },
        { label: 'Max 1 Year Education Gap', passed: gaps <= 1, current: `${gaps} yrs` },
      ],
    },
    {
      id: 'tier2_fintech',
      name: 'FinTech & High-Paying Services',
      examples: 'TCS Digital, Infosys SP, Cognizant GenC Elevate, JP Morgan',
      packageRange: '7 LPA – 14 LPA',
      badge: 'Dream Tier',
      badgeVariant: 'cyan',
      rules: [
        { label: '10th Marks >= 65%', passed: tenth >= 65, current: `${tenth}%` },
        { label: '12th/Diploma >= 65%', passed: twelfth >= 65, current: `${twelfth}%` },
        { label: 'Degree CGPA >= 6.8', passed: cgpa >= 6.8, current: `${cgpa} CGPA` },
        { label: '0 Active Backlogs', passed: activeBk === 0, current: `${activeBk} backlogs` },
        { label: 'Max 1 Year Education Gap', passed: gaps <= 1, current: `${gaps} yrs` },
      ],
    },
    {
      id: 'mass_it',
      name: 'IT Services & Mass Recruiters',
      examples: 'TCS Ninja, Infosys SE, Wipro, Accenture, Capgemini, Cognizant',
      packageRange: '3.6 LPA – 5.5 LPA',
      badge: 'Standard IT',
      badgeVariant: 'neutral',
      rules: [
        { label: '10th Marks >= 60%', passed: tenth >= 60, current: `${tenth}%` },
        { label: '12th/Diploma >= 60%', passed: twelfth >= 60, current: `${twelfth}%` },
        { label: 'Degree CGPA >= 6.0', passed: cgpa >= 6.0, current: `${cgpa} CGPA` },
        { label: 'Max 1 Active Backlog allowed (some 0)', passed: activeBk <= 1, current: `${activeBk} backlogs` },
        { label: 'Max 2 Years Education Gap', passed: gaps <= 2, current: `${gaps} yrs` },
      ],
    },
    {
      id: 'startups',
      name: 'High-Growth Tech Startups',
      examples: 'Early-stage tech ventures, Series A/B firms, Product studios',
      packageRange: '6 LPA – 20 LPA',
      badge: 'Skills Focused',
      badgeVariant: 'warning',
      rules: [
        { label: 'Degree CGPA >= 6.0', passed: cgpa >= 6.0, current: `${cgpa} CGPA` },
        { label: 'No strict 10th/12th cutoffs (Skill prioritized)', passed: true, current: 'Skills/Projects' },
        { label: 'Open to candidates with cleared backlogs', passed: activeBk === 0, current: `${activeBk} backlogs` },
      ],
    },
  ];

  const handleReset = () => {
    setTenthMarks(78);
    setTwelfthMarks(75);
    setDegreeCgpa(7.6);
    setActiveBacklogs(0);
    setDeadBacklogs(0);
    setGapYears(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campus Placement Eligibility Checker</h3>
            <p className="text-xs text-slate-600">Simulate company cutoffs across Tier-1, FinTech, and mass IT recruiters.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} leftIcon={RotateCcw}>
          Reset Inputs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Academic Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 border-slate-200 shadow-card bg-white space-y-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Academic Profile</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor={tenthInputId} className="text-xs font-semibold text-slate-700">10th Marks (%)</label>
                <input
                  id={tenthInputId}
                  type="number"
                  min="35"
                  max="100"
                  value={tenthMarks}
                  onChange={(e) => setTenthMarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={twelfthInputId} className="text-xs font-semibold text-slate-700">12th / Diploma (%)</label>
                <input
                  id={twelfthInputId}
                  type="number"
                  min="35"
                  max="100"
                  value={twelfthMarks}
                  onChange={(e) => setTwelfthMarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={cgpaInputId} className="text-xs font-semibold text-slate-700">Current Graduation CGPA (10-point scale)</label>
              <input
                id={cgpaInputId}
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={degreeCgpa}
                onChange={(e) => setDegreeCgpa(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label htmlFor={activeBacklogsInputId} className="text-xs font-semibold text-slate-700">Active Backlogs</label>
                <input
                  id={activeBacklogsInputId}
                  type="number"
                  min="0"
                  max="10"
                  value={activeBacklogs}
                  onChange={(e) => setActiveBacklogs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={deadBacklogsInputId} className="text-xs font-semibold text-slate-700">Dead / Cleared</label>
                <input
                  id={deadBacklogsInputId}
                  type="number"
                  min="0"
                  max="15"
                  value={deadBacklogs}
                  onChange={(e) => setDeadBacklogs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={gapYearsInputId} className="text-xs font-semibold text-slate-700">Education Gap</label>
                <input
                  id={gapYearsInputId}
                  type="number"
                  min="0"
                  max="5"
                  value={gapYears}
                  onChange={(e) => setGapYears(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-100">
              <span className="font-bold text-slate-800 block">Pro Tip for Placements:</span>
              <p>Most enterprise recruiting portals run automated SQL filters based on 10th, 12th, and CGPA thresholds before test invites are dispatched.</p>
            </div>
          </Card>
        </div>

        {/* Right Column: Company Tier Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {tiers.map((tier) => {
              const allPassed = tier.rules.every((r) => r.passed);
              const failedRules = tier.rules.filter((r) => !r.passed);

              return (
                <Card
                  key={tier.id}
                  className={`p-5 border transition-all ${
                    allPassed
                      ? 'border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-card-hover'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{tier.name}</h4>
                        <Badge variant={allPassed ? 'success' : 'danger'} size="sm">
                          {allPassed ? 'Eligible' : 'Not Eligible'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{tier.examples}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-brand-primary">{tier.packageRange}</span>
                    </div>
                  </div>

                  {/* Criteria Checklist */}
                  <div className="pt-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Evaluation Criteria:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {tier.rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg flex items-center justify-between ${
                            rule.passed
                              ? 'bg-emerald-50/60 text-emerald-900 border border-emerald-100'
                              : 'bg-rose-50/60 text-rose-900 border border-rose-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {rule.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                            <span className="truncate">{rule.label}</span>
                          </div>
                          <span className="font-mono text-[10px] font-bold shrink-0">{rule.current}</span>
                        </div>
                      ))}
                    </div>

                    {!allPassed && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 mt-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Bottleneck:</strong> Needs {failedRules.map((f) => f.label).join(', ')} to qualify.
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
