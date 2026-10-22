import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, DollarSign, Calendar, Bookmark, ArrowRight, Briefcase } from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';

import { formatSalary, formatDeadline, formatApplicationWindow } from '@/utils/jobHelpers';

export default function JobCard({
  id = '1',
  slug,
  title,
  role = 'Software Engineer',
  companyName,
  company_name,
  companyLogo,
  company_logo_url,
  jobType,
  job_type = 'Full-time',
  workMode,
  work_mode = 'Remote',
  location = 'Remote',
  salary,
  stipend_or_salary = '',
  skills,
  skills_required = [],
  application_start_date,
  applicationStartDate,
  deadline,
  apply_url,
  is_featured = false,
  isVerified = true,
  onSave,
  onSelect,
  isSaved: initialSaved = false,
}) {
  const displayTitle = title || role;
  const displayCompany = companyName || company_name || 'Acme Tech';
  const displayLogo = companyLogo || company_logo_url;
  const displayType = jobType || job_type;
  const displayMode = workMode || work_mode;
  const formattedSalary = formatSalary(salary || stipend_or_salary);
  const windowInfo = formatApplicationWindow(application_start_date || applicationStartDate, deadline);
  const deadlineInfo = windowInfo.deadline;
  const displaySkills = skills || skills_required || [];
  const [saved, setSaved] = useState(initialSaved);

  const handleSaveToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    if (onSave) onSave(!saved);
  };

  return (
    <Card hoverable className="flex flex-col justify-between h-full group">
      <div>
        {/* Top: Company info & bookmark */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight border border-brand-border flex items-center justify-center text-brand-primary font-bold text-sm shrink-0 overflow-hidden">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={displayCompany}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain p-1 rounded-xl"
                />
              ) : (
                displayCompany.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <span>{displayCompany}</span>
                {isVerified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-success" title="Verified employer" />
                )}
                {is_featured && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                    Featured
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-brand-text group-hover:text-brand-primary transition-colors line-clamp-1">
                <Link to={`/jobs/${id}`}>{displayTitle}</Link>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveToggle}
            aria-label={saved ? 'Remove saved job' : 'Save job'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-veryLight transition-colors"
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-brand-primary text-brand-primary' : ''}`} />
          </button>
        </div>

        {/* Badges: Type & Work Mode & Optional Salary */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={displayType === 'Internship' ? 'cyan' : 'primary'} size="sm">
            {displayType}
          </Badge>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {displayMode}
          </span>
          {formattedSalary && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
              {formattedSalary}
            </span>
          )}
        </div>

        {/* Location & Application Window */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {location}
          </span>
          {windowInfo.isUpcoming ? (
            <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              {windowInfo.start.text}
            </span>
          ) : (
            <span className={`flex items-center gap-1 ${deadlineInfo.isExpired ? 'text-rose-600 font-semibold' : ''}`}>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {deadlineInfo.text}
            </span>
          )}
        </div>

        {/* Skills Required */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {displaySkills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-brand-border"
            >
              {skill}
            </span>
          ))}
          {displaySkills.length > 4 && (
            <span className="text-[11px] text-slate-400 self-center">
              +{displaySkills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer: View action */}
      <div className="pt-3 border-t border-brand-border flex items-center justify-between">
        <span className="text-[11px] text-brand-muted">Easy apply available</span>
        <Link to={`/jobs/${id}`}>
          <Button size="sm" variant="secondary" rightIcon={ArrowRight} className="text-xs py-1 px-3">
            View Details
          </Button>
        </Link>
      </div>
    </Card>
  );
}
