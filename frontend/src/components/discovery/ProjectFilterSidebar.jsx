import React, { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Check, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  X,
  Layers,
  Sparkles,
  Clock,
  Code2
} from 'lucide-react';
import { Badge, Button } from '@/components/common';

const DIFFICULTY_CONFIG = [
  { value: 'All', label: 'All Difficulties', color: 'bg-slate-400' },
  { value: 'Beginner', label: 'Beginner', color: 'bg-emerald-500' },
  { value: 'Intermediate', label: 'Intermediate', color: 'bg-blue-500' },
  { value: 'Advanced', label: 'Advanced', color: 'bg-purple-500' },
];

const DURATION_OPTIONS = [
  { value: 'All', label: 'Any Duration' },
  { value: '1-2 weeks', label: '1 - 2 weeks (Quick build)' },
  { value: '2-3 weeks', label: '2 - 3 weeks (Standard)' },
  { value: '3-4 weeks', label: '3 - 4 weeks (Comprehensive)' },
  { value: '4+ weeks', label: '4+ weeks (Deep architecture)' },
];

export default function ProjectFilterSidebar({
  selectedDomain = 'All',
  onSelectDomain,
  selectedDifficulty = 'All',
  onSelectDifficulty,
  selectedDuration = 'All',
  onSelectDuration,
  selectedTechs = [],
  onToggleTech,
  onResetFilters,
  facets = { domains: [], difficulties: [], technologies: [] },
  activeFilterCount = 0,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) {
  const [techSearch, setTechSearch] = useState('');
  const [showAllTechs, setShowAllTechs] = useState(false);

  // Available technologies filtered by search query
  const allTechnologies = facets.technologies || [];
  const filteredTechnologies = allTechnologies.filter((t) =>
    t.toLowerCase().includes(techSearch.toLowerCase())
  );
  const displayedTechs = showAllTechs ? filteredTechnologies : filteredTechnologies.slice(0, 10);

  // Domain map for counts
  const domainCounts = {};
  (facets.domains || []).forEach((d) => {
    domainCounts[d.name] = d.count;
  });

  const totalAllCount = (facets.domains || []).reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className={`flex flex-col gap-6 ${isMobileDrawer ? 'p-4' : 'w-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-veryLight text-brand-primary flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-brand-text">Filter Catalog</h3>
            {activeFilterCount > 0 && (
              <span className="text-[11px] text-brand-primary font-medium">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-brand-muted hover:text-brand-primary flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-100"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Domains Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-primary" />
            Domain / Category
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onSelectDomain('All')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedDomain === 'All'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>All Domains</span>
            {totalAllCount > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedDomain === 'All'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {totalAllCount}
              </span>
            )}
          </button>

          {(facets.domains || []).map((domain) => {
            const isSelected = selectedDomain.toLowerCase() === domain.name.toLowerCase();
            return (
              <button
                key={domain.name}
                type="button"
                onClick={() => onSelectDomain(domain.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate pr-2 text-left">{domain.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {domain.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Difficulty Section */}
      <div className="space-y-3 pt-2 border-t border-brand-border">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
          Skill Difficulty
        </label>

        <div className="grid grid-cols-2 gap-1.5">
          {DIFFICULTY_CONFIG.map((item) => {
            const isSelected = selectedDifficulty.toLowerCase() === item.value.toLowerCase();
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelectDifficulty(item.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-brand-veryLight border-brand-primary text-brand-primary font-semibold shadow-xs'
                    : 'bg-white border-brand-border text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Duration Section */}
      <div className="space-y-3 pt-2 border-t border-brand-border">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-primary" />
          Project Duration
        </label>

        <div className="flex flex-col gap-1">
          {DURATION_OPTIONS.map((item) => {
            const isSelected = selectedDuration === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelectDuration(item.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'bg-brand-veryLight text-brand-primary font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Technologies Multi-Select Tags */}
      <div className="space-y-3 pt-2 border-t border-brand-border">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-brand-primary" />
            Technologies ({selectedTechs.length > 0 ? selectedTechs.length : 'All'})
          </label>
          {selectedTechs.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleTech('__CLEAR_ALL__')}
              className="text-[11px] text-brand-primary hover:underline font-medium"
            >
              Clear tech
            </button>
          )}
        </div>

        {/* Mini search inside technologies */}
        {allTechnologies.length > 8 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={techSearch}
              onChange={(e) => setTechSearch(e.target.value)}
              placeholder="Search tech stack..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-brand-border bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
          {displayedTechs.map((tech) => {
            const isSelected = selectedTechs.includes(tech);
            return (
              <button
                key={tech}
                type="button"
                onClick={() => onToggleTech(tech)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-all ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'bg-white text-slate-600 border-brand-border hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {tech}
              </button>
            );
          })}
          {displayedTechs.length === 0 && (
            <span className="text-xs text-brand-muted py-2">No matching technologies</span>
          )}
        </div>

        {filteredTechnologies.length > 10 && (
          <button
            type="button"
            onClick={() => setShowAllTechs(!showAllTechs)}
            className="text-xs text-brand-primary hover:text-brand-secondary font-medium flex items-center gap-1 pt-1"
          >
            {showAllTechs ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Show all ({filteredTechnologies.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Mobile Drawer Bottom Apply Button */}
      {isMobileDrawer && (
        <div className="pt-4 border-t border-brand-border mt-auto">
          <Button
            variant="primary"
            className="w-full justify-center"
            onClick={onCloseMobileDrawer}
          >
            Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
