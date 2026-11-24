import React, { useState, useId } from 'react';
import {
  IndianRupee,
  RotateCcw,
  Sparkles,
  HelpCircle,
  TrendingDown,
  Info,
  CheckCircle2,
  DollarSign,
  Briefcase,
  PieChart,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';

export default function SalaryCalculator() {
  const [annualCtc, setAnnualCtc] = useState(800000); // 8 LPA default
  const [variableBonusPct, setVariableBonusPct] = useState(10); // 10%
  const [basicPct, setBasicPct] = useState(40); // 40% of CTC is Basic
  const [includeGratuity, setIncludeGratuity] = useState(true);
  const [includeInsurance, setIncludeInsurance] = useState(true);

  const customCtcInputId = useId();

  const ctc = Math.max(100000, parseFloat(annualCtc) || 0);
  const varPct = Math.min(50, Math.max(0, parseFloat(variableBonusPct) || 0));
  const bPct = Math.min(60, Math.max(30, parseFloat(basicPct) || 40));

  // 1. Variable Pay (Annual)
  const annualVariablePay = (ctc * varPct) / 100;
  const fixedAnnualCtc = ctc - annualVariablePay;

  // 2. Basic Salary (40% of total CTC is standard in Indian tech offers)
  const annualBasic = (ctc * bPct) / 100;

  // 3. Retirals & Employer Contributions (included in CTC)
  const annualEmployerPf = annualBasic * 0.12; // 12% of basic
  const annualGratuity = includeGratuity ? annualBasic * 0.0481 : 0; // 4.81% of basic
  const annualInsurance = includeInsurance ? 12000 : 0; // ₹ 1,000/month typical group medical

  // 4. Gross Salary (Cost to Employee before personal deductions)
  // CTC = Gross + Employer PF + Gratuity + Employer Insurance
  const annualGrossSalary = Math.max(0, ctc - annualEmployerPf - annualGratuity - annualInsurance - annualVariablePay);
  const monthlyGross = annualGrossSalary / 12;

  // 5. Employee Deductions from Monthly Pay
  const monthlyEmployeePf = annualEmployerPf / 12; // 12% of basic matched by employee
  const monthlyProfTax = 200; // ₹ 2,400/yr standard across major tech states (KA, MH, TS)

  // 6. Income Tax / TDS Estimation (FY 2025-26 New Tax Regime with ₹ 75,000 Standard Deduction)
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, annualGrossSalary + annualVariablePay - standardDeduction);

  let annualTds = 0;
  if (taxableIncome > 1200000) {
    annualTds = 60000 + (taxableIncome - 1200000) * 0.20;
  } else if (taxableIncome > 800000) {
    annualTds = 20000 + (taxableIncome - 800000) * 0.10;
  } else if (taxableIncome > 400000) {
    annualTds = (taxableIncome - 400000) * 0.05;
  }
  // Section 87A rebate for taxable income <= 7.75 Lakhs in New Regime (zero tax)
  if (annualGrossSalary + annualVariablePay <= 775000) {
    annualTds = 0;
  }
  const monthlyTds = annualTds / 12;

  // 7. Net In-Hand Monthly Take-Home Salary
  const monthlyTotalDeductions = monthlyEmployeePf + monthlyProfTax + monthlyTds;
  const monthlyInHand = Math.max(0, monthlyGross - monthlyTotalDeductions);
  const annualInHand = monthlyInHand * 12;

  const presets = [
    { label: '3.6 LPA', val: 360000 },
    { label: '6 LPA', val: 600000 },
    { label: '8 LPA', val: 800000 },
    { label: '12 LPA', val: 1200000 },
    { label: '18 LPA', val: 1800000 },
    { label: '25 LPA', val: 2500000 },
  ];

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const handleReset = () => {
    setAnnualCtc(800000);
    setVariableBonusPct(10);
    setBasicPct(40);
    setIncludeGratuity(true);
    setIncludeInsurance(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">CTC to In-Hand Salary Calculator</h3>
            <p className="text-xs text-slate-600">Estimate your real monthly take-home salary after PF, Gratuity, Bonus, and Taxes.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} leftIcon={RotateCcw}>
          Reset Inputs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CTC & Component Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-6 border-slate-200 shadow-card bg-white space-y-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offer Package Details</h4>

            {/* Quick Preset Chips */}
            <div className="space-y-1.5">
              <label htmlFor={customCtcInputId} className="text-xs font-semibold text-slate-700">Quick Package Presets</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setAnnualCtc(p.val)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                      annualCtc === p.val
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom CTC Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={customCtcInputId} className="text-xs font-semibold text-slate-700">Annual Cost to Company (CTC)</label>
                <span className="text-xs font-mono font-bold text-indigo-700">{formatCurrency(ctc)}/yr</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  id={customCtcInputId}
                  type="number"
                  min="100000"
                  max="10000000"
                  step="50000"
                  value={annualCtc}
                  onChange={(e) => setAnnualCtc(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                />
              </div>
            </div>

            {/* Sliders for Structure */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Performance Bonus / Variable Pay</span>
                  <span className="font-bold text-slate-900">{varPct}% ({formatCurrency(annualVariablePay)})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={variableBonusPct}
                  onChange={(e) => setVariableBonusPct(e.target.value)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Basic Salary Ratio</span>
                  <span className="font-bold text-slate-900">{bPct}% ({formatCurrency(annualBasic)})</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="50"
                  step="5"
                  value={basicPct}
                  onChange={(e) => setBasicPct(e.target.value)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGratuity}
                  onChange={(e) => setIncludeGratuity(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Include Gratuity in CTC (4.81% of Basic)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInsurance}
                  onChange={(e) => setIncludeInsurance(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Include Corporate Health Insurance (~₹ 1,000/mo)</span>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Column: Net In-Hand Highlight & Deductions Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-6 border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Monthly Take-Home</span>
              <Badge variant="primary" size="sm">
                In-Hand Salary
              </Badge>
            </div>

            <div>
              <span className="text-4xl sm:text-5xl font-extrabold font-display text-indigo-700">
                {formatCurrency(monthlyInHand)}
              </span>
              <span className="text-xs font-medium text-slate-500 block mt-1">
                Credited to your bank account every month (~{formatCurrency(annualInHand)}/year)
              </span>
            </div>

            {/* Monthly Waterfall Table */}
            <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Monthly Gross Pay:</span>
                <span className="font-bold text-slate-900">{formatCurrency(monthlyGross)}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-700">
                <span>- Employee PF (12% of Basic):</span>
                <span>{formatCurrency(monthlyEmployeePf)}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-700">
                <span>- Professional Tax (PT):</span>
                <span>{formatCurrency(monthlyProfTax)}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-700">
                <span>- Estimated TDS / Income Tax (New Regime):</span>
                <span>{formatCurrency(monthlyTds)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold border-t border-slate-200 text-slate-900">
                <span>Total Monthly Deductions:</span>
                <span className="text-rose-700">-{formatCurrency(monthlyTotalDeductions)}</span>
              </div>
            </div>

            {/* Why CTC is different info note */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                Why is In-Hand less than CTC?
              </span>
              <p className="leading-relaxed">
                CTC contains employer contributions (PF: {formatCurrency(annualEmployerPf)}/yr, Gratuity: {formatCurrency(annualGratuity)}/yr) and variable bonus ({formatCurrency(annualVariablePay)}/yr disbursed annually based on appraisals).
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
