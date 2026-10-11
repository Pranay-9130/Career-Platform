import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, ArrowRight, Star, Code2, Eye } from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import { useAuth } from '@/context/AuthContext';

export default function ProjectCard({
  id = '1',
  slug = 'ai-resume-matcher',
  title = 'AI Resume Matcher & ATS Scorer',
  domain = 'AI / Machine Learning',
  description,
  short_description,
  technologies,
  tech_stack,
  authorName,
  author_name,
  authorAvatar,
  author_avatar,
  difficulty = 'Intermediate',
  duration,
  estimated_duration,
  stars,
  stars_count = 0,
  views_count = 0,
  bookmarks_count = 0,
  coverImage,
  cover_image_url,
  onSave,
  isSaved,
  is_bookmarked = false,
}) {
  const { isAuthenticated } = useAuth();
  const desc = description || short_description || '';
  const techList = technologies || tech_stack || [];
  const author = authorName || author_name || 'Contributor';
  const avatar = authorAvatar || author_avatar || author.slice(0, 2).toUpperCase();
  const dur = duration || estimated_duration || '2-3 weeks';
  const img = coverImage || cover_image_url;
  const initialSaved = isSaved !== undefined ? isSaved : is_bookmarked;
  const starCount = stars !== undefined ? stars : stars_count;

  const projectLink = isAuthenticated ? `/projects/${slug}` : '/login';
  const projectLinkState = !isAuthenticated
    ? { from: { pathname: `/projects/${slug}` }, message: 'Please log in with your credentials to view project blueprints and resources.' }
    : undefined;

  const [saved, setSaved] = useState(initialSaved);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const handleSaveToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextSaved = !saved;
    setSaved(nextSaved);
    if (onSave) onSave(nextSaved);
  };

  const difficultyVariant =
    difficulty === 'Beginner' ? 'approved' : difficulty === 'Intermediate' ? 'published' : 'changesRequested';

  return (
    <Card hoverable className="flex flex-col h-full overflow-hidden group">
      {/* Cover / Header Banner */}
      <div className="relative h-44 -mx-6 -mt-6 mb-4 bg-gradient-to-tr from-blue-100 via-sky-50 to-indigo-100 flex items-center justify-center overflow-hidden border-b border-brand-border">
        {img ? (
          <img
            src={img}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-brand-primary/80">
            <div className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-brand-primary">
              <Code2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{domain}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge variant={difficultyVariant} size="sm">
            {difficulty}
          </Badge>
        </div>

        {/* Save Bookmark Button */}
        <button
          type="button"
          onClick={handleSaveToggle}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark project'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur hover:bg-white text-slate-600 hover:text-brand-primary shadow-sm flex items-center justify-center transition-all"
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-brand-primary text-brand-primary' : ''}`} />
        </button>

        {/* Duration Chip */}
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-[11px] font-medium text-slate-600 flex items-center gap-1 shadow-sm">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{dur}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary mb-1">
            {domain}
          </div>

          <h3 className="font-display font-bold text-base text-brand-text group-hover:text-brand-primary transition-colors line-clamp-1">
            <Link to={projectLink} state={projectLinkState}>{title}</Link>
          </h3>

          <p className="mt-2 text-xs text-brand-muted line-clamp-2 leading-relaxed">
            {desc}
          </p>

          {/* Tech Badges */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {techList.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
              >
                {tech}
              </span>
            ))}
            {techList.length > 4 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100">
                +{techList.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Footer: Author & Explore Action */}
        <div className="mt-5 pt-3.5 border-t border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-veryLight text-brand-primary border border-brand-border text-[10px] font-bold flex items-center justify-center">
              {avatar}
            </div>
            <span className="text-xs text-slate-600 font-medium truncate max-w-[100px]">
              {author}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {starCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium" title={`${starCount} stars`}>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{starCount}</span>
              </div>
            )}
            <Link to={projectLink} state={projectLinkState}>
              <Button size="sm" variant="outline" rightIcon={ArrowRight} className="text-xs py-1 px-2.5">
                Explore
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
