import React, { useState } from 'react';
import axios from 'axios';
import {
  Mail,
  MessageSquare,
  HelpCircle,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  Linkedin,
  Instagram,
  Share2,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  Alert,
  Badge,
} from '@/components/common';
import SEO from '@/components/common/SEO';
import { getOrganizationSchema, getBreadcrumbListSchema } from '@/utils/seoSchemas';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Question',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const subjectOptions = [
    { value: 'General Question', label: 'General Inquiry / Feedback' },
    { value: 'Student Support', label: 'Student Workspace & Profile Support' },
    { value: 'Project Submission', label: 'Project Submission & Review Help' },
    { value: 'Recruiter & Hiring', label: 'Recruiter / Company Partnerships' },
    { value: 'Security Disclosure', label: 'Security & Bug Bounty Disclosure' },
  ];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Please provide your full name (at least 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = 'Please enter a message with at least 10 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await axios.post('/api/contact', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
      });

      if (response.data && response.data.success) {
        setSuccessMessage(response.data.message || 'Your inquiry has been submitted successfully.');
        setFormData({
          name: '',
          email: '',
          subject: 'General Question',
          message: '',
        });
        setErrors({});
      } else {
        setErrorMessage('Failed to send message. Please try again.');
      }
    } catch (err) {
      const serverMsg =
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.message ||
        'Unable to submit contact form. Please check your connection and try again.';
      setErrorMessage(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const faqs = [
    {
      q: 'Is the Student Career Platform free for students?',
      a: 'Yes. All core student features — including project discovery, submission, portfolio showcase, ATS resume builder, and job search — are 100% free for students worldwide.',
    },
    {
      q: 'Do I need prior GitHub or cloud deployment experience to submit a project?',
      a: 'No. You can either provide a public GitHub repository link or upload your project code directly as a ZIP archive. Live demo links are completely optional.',
    },
    {
      q: 'How does the ATS Resume Analyzer evaluate my resume?',
      a: 'The ATS Analyzer uses Google Gemini via our secure backend proxy to cross-reference your resume text directly with the target job description, identifying matched skills, missing keywords, and formatting scores.',
    },
    {
      q: 'How long does project moderation take?',
      a: 'Submitted projects are typically reviewed by platform moderators within 24 to 48 hours. You will receive notification updates once approved or if changes are requested.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Contact Us & Platform Support"
        description="Have questions about student project submission, ATS resume scores, or employer partnerships? Contact the Student Career Platform team."
        canonical="/contact"
        schema={[
          getOrganizationSchema(),
          getBreadcrumbListSchema([
            { name: "Home", path: "/" },
            { name: "Contact Us", path: "/contact" },
          ]),
        ]}
      />
      {/* 1. Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold uppercase tracking-wider mb-2">
          <MessageSquare className="w-3.5 h-3.5" />
          Get In Touch
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-brand-text">
          Contact Our Team
        </h1>
        <p className="text-base sm:text-lg text-brand-muted leading-relaxed">
          Have a question about project submissions, resume templates, or company partnerships?
          We are here to support your career journey.
        </p>
      </div>

      {/* 2. Grid: Contact Info & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Contact Cards */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">Direct Email</h3>
            <p className="mt-1 text-xs text-brand-muted">For urgent questions or partnership inquiries:</p>
            <a
              href="mailto:aspirepath.team@gmail.com"
              className="mt-2 inline-block text-xs font-semibold text-brand-primary hover:underline"
            >
              aspirepath.team@gmail.com
            </a>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">Official Social Media</h3>
            <p className="mt-1 text-xs text-brand-muted mb-3">
              Connect with AspirePath on our official platforms:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.linkedin.com/company/aspirepath-career-platform/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-brand-border text-xs font-semibold text-slate-700 hover:text-brand-primary hover:bg-brand-veryLight hover:border-brand-primary/30 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                <span>LinkedIn</span>
              </a>
              <a
                href="https://www.instagram.com/aspirepath.official/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-brand-border text-xs font-semibold text-slate-700 hover:text-brand-primary hover:bg-brand-veryLight hover:border-brand-primary/30 transition-colors"
              >
                <Instagram className="w-4 h-4 text-[#E4405F]" />
                <span>Instagram</span>
              </a>
            </div>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">Response Time</h3>
            <p className="mt-1 text-xs text-brand-muted">
              We typically review student inquiries and partner requests within <strong>24 business hours</strong>.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-brand-veryLight text-brand-primary flex items-center justify-center mb-3">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-brand-text">Global Community</h3>
            <p className="mt-1 text-xs text-brand-muted">
              Supporting ambitious students and universities across North America, Europe, Asia, and globally.
            </p>
          </Card>
        </div>

        {/* Right Column: Interactive Contact Form (Span 2) */}
        <div className="lg:col-span-2">
          <Card className="p-8 sm:p-10 shadow-card">
            <h2 className="text-2xl font-display font-bold text-brand-text mb-2">
              Send Us a Message
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mb-6">
              Fill in your details below and a team member will reach out via email.
            </p>

            {/* Success Alert */}
            {successMessage && (
              <Alert variant="success" title="Inquiry Sent" className="mb-6">
                {successMessage}
              </Alert>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <Alert
                variant="error"
                title="Submission Error"
                className="mb-6"
                onClose={() => setErrorMessage(null)}
              >
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Your Full Name"
                  id="contact-name"
                  placeholder="e.g. Alex Chen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                />
                <Input
                  label="Email Address"
                  id="contact-email"
                  type="email"
                  placeholder="student@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  required
                />
              </div>

              <Select
                label="Inquiry Category"
                id="contact-subject"
                options={subjectOptions}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />

              <Textarea
                label="Your Message"
                id="contact-message"
                placeholder="Please describe how we can assist you..."
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                error={errors.message}
                helperText="Minimum 10 characters."
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={Send}
                  className="w-full sm:w-auto px-8"
                >
                  Send Message
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* 3. Frequently Asked Questions (FAQ) */}
      <section className="pt-8 border-t border-brand-border space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="primary" size="sm" className="mb-2">
            Answers to Common Inquiries
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-text">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {faqs.map((faq) => (
            <Card key={faq.q} className="p-6 space-y-2">
              <h3 className="font-display font-bold text-sm sm:text-base text-brand-text flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-brand-primary shrink-0 mt-1" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted pl-6 leading-relaxed">
                {faq.a}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
