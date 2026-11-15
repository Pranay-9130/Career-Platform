export type UserRole = 'STUDENT' | 'CONTRIBUTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string | null;
  headline?: string | null;
  profile?: Profile | null;
}

export interface Profile {
  id: string;
  user_id: string;
  username?: string | null;
  university?: string | null;
  degree?: string | null;
  graduation_year?: number | null;
  bio?: string | null;
  skills: string[];
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
}

export interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url?: string | null;
  company_website?: string | null;
  domain: string;
  job_type: string;
  work_mode: string;
  location: string;
  stipend_or_salary?: string | null;
  experience_level: string;
  skills_required: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  apply_url?: string | null;
  application_method: string;
  is_active: boolean;
  is_featured: boolean;
  eligible_batches?: string[];
  candidate_type?: string | null;
  eligible_qualifications?: string[];
  created_at: string;
  has_applied?: boolean;
  is_bookmarked?: boolean;
}

export interface JobApplication {
  id: string;
  job_id: string;
  student_id: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'OFFERED';
  applied_at: string;
  cover_letter?: string | null;
  resume_url?: string | null;
  job?: Job;
}

export interface Project {
  id: string;
  title: string;
  tagline?: string | null;
  description: string;
  domain: string;
  tags: string[];
  github_url?: string | null;
  live_url?: string | null;
  cover_image_url?: string | null;
  screenshots?: string[];
  status: 'Draft' | 'Submitted' | 'Published' | 'Rejected';
  author_id: string;
  author_name?: string | null;
  author_avatar?: string | null;
  stars_count: number;
  bookmarks_count: number;
  comments_count: number;
  created_at: string;
  is_starred?: boolean;
  is_bookmarked?: boolean;
}

export interface PreparationRole {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_name: string;
  is_active: boolean;
  display_order: number;
  material_count: number;
  topics: PreparationTopic[];
}

export interface PreparationTopic {
  id: string;
  role_id: string;
  name: string;
  slug: string;
  description?: string | null;
  display_order: number;
  material_count: number;
}

export interface PreparationMaterial {
  id: string;
  role_id: string;
  role_name?: string | null;
  role_slug?: string | null;
  topic_id?: string | null;
  topic_name?: string | null;
  title: string;
  description?: string | null;
  file_name: string;
  file_size_bytes: number;
  file_size_formatted?: string | null;
  page_count: number;
  is_published: boolean;
  download_count: number;
  created_at: string;
}

export interface StudentDashboardSummary {
  ats_score: number;
  target_role: string;
  skills_verified: number;
  total_required_skills: number;
  projects_count: number;
  applications_count: number;
  readiness_percentage: number;
}
