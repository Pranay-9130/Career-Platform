import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  Download,
  ArrowRight,
  Sparkles,
  CheckCircle,
  FileText,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { resumeService } from '../../services/resumeService';
import { useAuth } from '../../context/AuthContext';
import SEO from '@/components/common/SEO';
import { getSoftwareApplicationSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await resumeService.getTemplates();
        const activeList = Array.isArray(data)
          ? data.filter((t) => t.is_active !== false)
          : [];
        setTemplates(activeList);
      } catch (err) {
        console.error('Failed to load templates:', err);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const handleUseTemplate = (templateId) => {
    if (!user) {
      const destination = `/resume-builder?template=${encodeURIComponent(templateId)}`;
      navigate(`/login?redirect=${encodeURIComponent(destination)}`);
    } else {
      navigate(`/resume-builder?template=${templateId}`);
    }
  };

  const handleDownloadTemplate = async (template) => {
    if (template.download_url && template.download_url.trim()) {
      let downloadLink = template.download_url;
      if (downloadLink.startsWith('/api/')) {
        downloadLink = `${downloadLink}${downloadLink.includes('?') ? '&' : '?'}download=1`;
      }
      const url =
        downloadLink.startsWith('http') || downloadLink.startsWith('data:')
          ? downloadLink
          : `${import.meta.env.VITE_API_URL || ''}${downloadLink}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = template.uploaded_file_name || `${template.name || 'resume-template'}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      setDownloadingId(template.id);
      const payload = {
        title: `${template.name || 'Sample'} Resume`,
        template_id: template.id || 'template-1',
        personal_info: {
          full_name: 'MOUNIKA RAYOTH',
          headline: 'Software Engineer',
          email: 'mounika.rayoth@example.com',
          phone: '+91 9876543210',
          location: 'Hyderabad, India',
          github: 'github.com/mounika',
          linkedin: 'linkedin.com/in/mounika',
        },
        summary:
          'Proactive software engineer skilled in building scalable web platforms, REST APIs, and responsive web user interfaces. Passionate about clean code, automated testing, and agile team workflows.',
        education: [
          {
            institution: 'Osmania University, Hyderabad',
            degree: 'B.Tech in Computer Science and Engineering',
            end_date: '2024',
            gpa: '8.2 / 10.0',
            highlights: 'Data Structures, Database Systems, Web Technologies',
          },
        ],
        experience: [
          {
            role: 'Software Developer Intern',
            company: 'Tech Solutions Inc',
            start_date: 'Jan 2024',
            end_date: 'Jul 2024',
            location: 'Hyderabad',
            bullets: [
              'Contributed to development of internal admin portal using React and Python REST services.',
              'Optimized database queries reducing search response latency by 32%.',
              'Participated in sprint reviews and automated integration tests.',
            ],
          },
        ],
        projects: [
          {
            name: 'Career & Hiring Platform',
            tech_stack: 'React, Tailwind CSS, Python, SQLite',
            link: 'github.com/mounika/hiring-platform',
            bullets: [
              'Built student portfolio and resume builder supporting instant vector PDF generation.',
              'Implemented role-based admin moderation and real-time job application tracking.',
            ],
          },
        ],
        skills: ['Python', 'JavaScript', 'React', 'HTML/CSS', 'MySQL', 'Git', 'Docker'],
        certifications: [
          { name: 'Full Stack Web Development', issuer: 'Coursera', date: '2023' },
        ],
      };

      const blob = await resumeService.previewPdf(payload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${template.name || 'Resume'}_Template.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download resume template:', err);
      alert('Could not download sample PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Resume Templates"
        description="Choose from our professionally designed templates to create your perfect resume."
        canonical="/templates"
        schema={[
          getSoftwareApplicationSchema(
            'Resume Templates',
            'Professional resume templates for students and developers.',
            '/templates'
          ),
          getBreadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Resume Templates', path: '/templates' },
          ]),
        ]}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section styled with website brand color */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-veryLight border border-brand-border text-xs font-semibold text-brand-primary mb-3">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
              Curated Career Formats
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-primary tracking-tight font-display">
              Resume Templates
            </h1>
            <p className="text-sm sm:text-base text-brand-muted mt-2">
              Choose from our professionally designed templates to create your perfect resume
            </p>
          </div>
          <Link
            to="/resume-builder"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-primary to-brand-cyan hover:opacity-95 shadow-sm transition-all shrink-0 self-start sm:self-center"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Resume Builder</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-brand-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-brand-muted font-medium">Loading templates...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-brand-border p-8 space-y-4 max-w-2xl mx-auto shadow-sm">
            <div className="w-14 h-14 bg-brand-veryLight text-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No Resume Templates Available Yet</h3>
              <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-md mx-auto">
                Templates added and published from the Admin Portal will appear here.
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="pt-2">
                <Link
                  to="/admin/templates"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Go to Admin Portal to Add Templates
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Templates Grid matching brand website colors */}
        {!loading && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {templates.map((tpl, index) => (
              <div
                key={tpl.id || index}
                className="group bg-white rounded-2xl border border-brand-border shadow-xs hover:shadow-lg hover:border-brand-primary/40 transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Document Mockup Preview Container */}
                <div className="h-72 sm:h-80 bg-[#1e232a] relative overflow-hidden flex items-center justify-center p-3.5 border-b border-brand-border">
                  {tpl.preview_image_url ? (
                    <img
                      src={tpl.preview_image_url}
                      alt={tpl.name}
                      className="w-full h-full object-contain rounded shadow"
                    />
                  ) : (
                    <div className="w-full h-full bg-white rounded shadow-md p-3.5 text-[8px] text-slate-700 overflow-y-auto space-y-2 select-none pointer-events-none">
                      {/* Resume Header */}
                      <div className="text-center pb-1.5 border-b border-slate-300">
                        <div className="font-extrabold text-[10px] text-slate-900 tracking-wider">
                          {index === 0
                            ? 'MOUNIKA RAYOTH'
                            : index === 1
                            ? 'K MEGHANA'
                            : 'FIRST LAST'}
                        </div>
                        <div className="text-[6.5px] text-slate-500 mt-0.5">
                          Mobile: +91 9391033355 | Email: student@example.com
                        </div>
                        <div className="text-[6.5px] text-brand-primary mt-0.5">
                          LinkedIn: linkedin.com/in/profile | GitHub: github.com/profile
                        </div>
                      </div>

                      {/* Profile Summary */}
                      <div>
                        <div className="font-bold text-[7.5px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                          PROFILE SUMMARY
                        </div>
                        <div className="text-[6.5px] text-slate-500 mt-0.5 leading-tight">
                          Dedicated engineering graduate with hands-on experience in full stack software development and clean system design.
                        </div>
                      </div>

                      {/* Education */}
                      <div>
                        <div className="font-bold text-[7.5px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                          EDUCATION
                        </div>
                        <div className="flex justify-between items-center text-[7px] text-slate-800 font-semibold mt-0.5">
                          <span>Osmania University, Hyderabad</span>
                          <span>CGPA: 8.5 / 10</span>
                        </div>
                        <div className="text-[6.5px] text-slate-500">
                          B.Tech in Computer Science and Engineering (2024)
                        </div>
                      </div>

                      {/* Technical Skills */}
                      <div>
                        <div className="font-bold text-[7.5px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                          TECHNICAL SKILLS
                        </div>
                        <div className="text-[6.5px] text-slate-600 space-y-0.5 mt-0.5">
                          <div>
                            <span className="font-semibold text-slate-800">• Frontend:</span> HTML, CSS, JavaScript, React.js
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">• Backend:</span> Python, Node.js, Express
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">• Databases:</span> MySQL, MongoDB
                          </div>
                        </div>
                      </div>

                      {/* Work Experience */}
                      <div>
                        <div className="font-bold text-[7.5px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                          WORK EXPERIENCE
                        </div>
                        <div className="flex justify-between items-center text-[7px] text-slate-800 font-semibold mt-0.5">
                          <span>Software Developer Intern</span>
                          <span className="text-slate-500 text-[6.5px]">Jan - Jul 2024</span>
                        </div>
                        <div className="text-[6.5px] text-slate-500">
                          • Contributed to development of server APIs that have been deployed to production.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Content Details */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Title */}
                    <h3 className="font-bold text-lg text-slate-900 tracking-tight group-hover:text-brand-primary transition-colors">
                      {tpl.name || `Template ${index + 1}`}
                    </h3>

                    {/* Category Badge matching website color */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-veryLight text-brand-primary border border-brand-border">
                        {tpl.badge || 'Professional'}
                      </span>
                      {tpl.download_url && (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {tpl.download_url.toLowerCase().includes('.docx')
                            ? 'DOCX'
                            : tpl.download_url.toLowerCase().includes('.pdf')
                            ? 'PDF'
                            : tpl.download_url.toLowerCase().includes('.zip')
                            ? 'ZIP'
                            : 'Template File'}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-xs sm:text-sm text-brand-muted leading-relaxed line-clamp-2">
                      {tpl.description || 'Ready-to-use professional resume format'}
                    </p>
                  </div>

                  {/* Actions Row matching website theme */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    {/* ViewFull Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(tpl)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>ViewFull</span>
                    </button>

                    {/* Download Button */}
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate(tpl)}
                      disabled={downloadingId === tpl.id}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-brand-primary text-brand-primary hover:bg-brand-veryLight font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Download className={`w-4 h-4 ${downloadingId === tpl.id ? 'animate-bounce' : ''}`} />
                      <span>{downloadingId === tpl.id ? 'Downloading...' : 'Download'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ViewFull Live Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full border border-brand-border shadow-2xl overflow-hidden my-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-veryLight">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white text-brand-primary shadow-xs border border-brand-border">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {previewTemplate.name || 'Template Preview'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-brand-primary border border-brand-border">
                        {previewTemplate.badge || 'Professional'}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {previewTemplate.description || 'Ready-to-use professional resume format'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(previewTemplate.id)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary hover:bg-blue-600 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>Use in Builder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(null)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    aria-label="Close Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Full Canvas Display */}
              <div className="p-4 sm:p-6 bg-[#1e232a] flex justify-center max-h-[75vh] overflow-y-auto">
                {previewTemplate.preview_image_url ? (
                  <img
                    src={previewTemplate.preview_image_url}
                    alt={previewTemplate.name}
                    className="max-w-2xl w-full rounded shadow-xl object-contain bg-white"
                  />
                ) : previewTemplate.download_url && (previewTemplate.download_url.toLowerCase().includes('.pdf') || previewTemplate.uploaded_file_name?.toLowerCase().endsWith('.pdf')) ? (
                  <iframe
                    src={previewTemplate.download_url.startsWith('http') ? previewTemplate.download_url : `${import.meta.env.VITE_API_URL || ''}${previewTemplate.download_url}`}
                    title={previewTemplate.name}
                    className="w-full max-w-3xl h-[68vh] rounded-2xl bg-white shadow-2xl border-0"
                  />
                ) : (
                  <div className="w-full max-w-2xl bg-white p-8 sm:p-10 rounded shadow-2xl text-slate-800 text-xs space-y-4">
                    {/* Header */}
                    <div className="text-center border-b pb-4 border-slate-300">
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        MOUNIKA RAYOTH
                      </h2>
                      <p className="text-slate-600 text-xs mt-1">Software Engineer (Full Stack)</p>
                      <p className="text-slate-500 text-[11px] mt-1">
                        +91 9391033355 • mounika.rayoth@example.com • Hyderabad, India
                      </p>
                      <p className="text-brand-primary text-[11px] mt-0.5">
                        linkedin.com/in/mounika-rayoth • github.com/mounika-rayoth
                      </p>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
                        Profile Summary
                      </h4>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        Results-driven software engineer with background developing robust web architectures, reactive client dashboards, and automated test pipelines. Solid understanding of data structures, algorithm efficiency, and modern cloud deployment frameworks.
                      </p>
                    </div>

                    {/* Education */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
                        Education
                      </h4>
                      <div className="flex justify-between items-start text-[11px]">
                        <div>
                          <div className="font-bold text-slate-900">Osmania University, Hyderabad</div>
                          <div className="text-slate-700">Bachelor of Technology in Computer Science & Engineering</div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-800">CGPA: 8.5 / 10.0</span>
                          <div className="text-slate-500 text-[10px]">2020 – 2024</div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Skills */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
                        Technical Skills
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800">Languages: </span>
                          <span className="text-slate-700">Python, JavaScript, TypeScript, SQL, HTML5/CSS3</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">Frameworks: </span>
                          <span className="text-slate-700">React.js, FastAPI, Node.js, Express, Tailwind CSS</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">Databases: </span>
                          <span className="text-slate-700">PostgreSQL, MySQL, SQLite, MongoDB</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">Developer Tools: </span>
                          <span className="text-slate-700">Git, GitHub, Docker, Postman, Linux/Unix</span>
                        </div>
                      </div>
                    </div>

                    {/* Work Experience */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
                        Work Experience
                      </h4>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-900">
                            Software Developer Intern — <span className="font-medium text-slate-700">Tech Solutions Inc</span>
                          </span>
                          <span className="text-slate-500 text-[10px]">Jan 2024 – Jul 2024</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                          <li>Developed scalable REST APIs with automated validation and JWT authentication.</li>
                          <li>Integrated reactive UI components with real-time feedback using React.</li>
                          <li>Implemented unit and integration test runners achieving 90%+ branch coverage.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-brand-veryLight border-t border-brand-border flex flex-wrap justify-between items-center gap-3">
                <span className="text-xs text-brand-muted">
                  Ready-to-use template optimized for applicant tracking systems.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate(previewTemplate)}
                    disabled={downloadingId === previewTemplate.id}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-brand-primary bg-white hover:bg-blue-50 border border-brand-border transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className={`w-3.5 h-3.5 ${downloadingId === previewTemplate.id ? 'animate-bounce' : ''}`} />
                    <span>{downloadingId === previewTemplate.id ? 'Downloading...' : 'Download Template'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseTemplate(previewTemplate.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-blue-600 shadow-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Use in Builder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
