import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Alert,
  Modal,
  Spinner,
  Skeleton,
} from '@/components/common';
import {
  Sparkles,
  ArrowRight,
  Search,
  Mail,
  Lock,
  CheckCircle,
  HelpCircle,
  Download,
  Trash2,
} from 'lucide-react';

export default function DesignSystemShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [testInputValue, setTestInputValue] = useState('');

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-veryLight border border-brand-border text-brand-primary text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Design System v1.0
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-brand-text">
          Light Blue Design System & UI Tokens
        </h1>
        <p className="mt-2 text-brand-muted max-w-2xl text-sm sm:text-base">
          Standardized visual tokens, typography, and atomic components for the Student Career Platform.
        </p>
      </div>

      {/* 1. Color Palette */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-brand-text border-b border-brand-border pb-2">
          1. Brand Colors & Tokens
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <div className="p-3 bg-white rounded-xl border border-brand-border shadow-sm">
            <div className="h-14 rounded-lg bg-[#3B82F6] mb-2 shadow-inner" />
            <div className="text-xs font-bold text-brand-text">Primary Blue</div>
            <div className="text-[11px] text-brand-muted">#3B82F6</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-brand-border shadow-sm">
            <div className="h-14 rounded-lg bg-[#60A5FA] mb-2 shadow-inner" />
            <div className="text-xs font-bold text-brand-text">Light Blue</div>
            <div className="text-[11px] text-brand-muted">#60A5FA</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-brand-border shadow-sm">
            <div className="h-14 rounded-lg bg-[#06B6D4] mb-2 shadow-inner" />
            <div className="text-xs font-bold text-brand-text">Cyan Accent</div>
            <div className="text-[11px] text-brand-muted">#06B6D4</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-brand-border shadow-sm">
            <div className="h-14 rounded-lg bg-[#EFF6FF] border border-blue-100 mb-2" />
            <div className="text-xs font-bold text-brand-text">Very Light Blue</div>
            <div className="text-[11px] text-brand-muted">#EFF6FF</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-brand-border shadow-sm">
            <div className="h-14 rounded-lg bg-[#22C55E] mb-2 shadow-inner" />
            <div className="text-xs font-bold text-brand-text">Success Green</div>
            <div className="text-[11px] text-brand-muted">#22C55E</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-brand-border shadow-sm">
            <div className="h-14 rounded-lg bg-[#EF4444] mb-2 shadow-inner" />
            <div className="text-xs font-bold text-brand-text">Error Red</div>
            <div className="text-[11px] text-brand-muted">#EF4444</div>
          </div>
        </div>
      </section>

      {/* 2. Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-brand-text border-b border-brand-border pb-2">
          2. Buttons & Actions
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="gradient" rightIcon={ArrowRight}>
            Gradient CTA
          </Button>
          <Button variant="destructive" leftIcon={Trash2}>
            Delete
          </Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="primary" isLoading>
            Loading State
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center pt-2">
          <Button size="sm" variant="primary">
            Small Button
          </Button>
          <Button size="md" variant="primary">
            Medium Button
          </Button>
          <Button size="lg" variant="primary">
            Large Button
          </Button>
        </div>
      </section>

      {/* 3. Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-brand-text border-b border-brand-border pb-2">
          3. Badges & Project Statuses
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="draft" dot>
            Draft
          </Badge>
          <Badge variant="underReview" dot>
            Under Review
          </Badge>
          <Badge variant="approved" dot>
            Approved
          </Badge>
          <Badge variant="published" dot>
            Published
          </Badge>
          <Badge variant="changesRequested" dot>
            Changes Requested
          </Badge>
          <Badge variant="rejected" dot>
            Rejected
          </Badge>
          <Badge variant="primary">React 18</Badge>
          <Badge variant="cyan">FastAPI</Badge>
          <Badge variant="neutral">PostgreSQL</Badge>
        </div>
      </section>

      {/* 4. Form Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-brand-text border-b border-brand-border pb-2">
          4. Form Inputs & Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Email Address"
            placeholder="student@university.edu"
            leftIcon={Mail}
            value={testInputValue}
            onChange={(e) => setTestInputValue(e.target.value)}
            helperText="We'll send your 6-digit OTP to this email."
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={Lock}
            required
          />
          <Input
            label="Project Slug (Error State)"
            defaultValue="invalid/slug!@"
            error="Only lowercase letters, numbers, and hyphens allowed."
          />
          <Select
            label="Target Domain"
            options={[
              { value: 'web', label: 'Web Application' },
              { value: 'ai', label: 'AI / Machine Learning' },
              { value: 'mobile', label: 'Mobile App' },
              { value: 'cloud', label: 'Cloud & DevOps' },
            ]}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Problem Statement"
              placeholder="Describe the challenge your project addresses..."
              rows={3}
              helperText="Maximum 500 characters."
            />
          </div>
        </div>
      </section>

      {/* 5. Alerts */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-brand-text border-b border-brand-border pb-2">
          5. Alerts & Notifications
        </h2>
        <div className="space-y-3">
          <Alert variant="info" title="Submission Guidelines">
            Ensure your project ZIP does not contain private credentials, .env files, or executable binaries.
          </Alert>
          <Alert variant="success" title="Project Approved">
            Your project "AI Resume Analyzer" has been reviewed and published to the showcase!
          </Alert>
          <Alert variant="warning" title="Changes Requested">
            Reviewer requested: Please add at least 2 screenshots showing the main application UI.
          </Alert>
          {!alertDismissed && (
            <Alert
              variant="error"
              title="Upload Failed"
              onClose={() => setAlertDismissed(true)}
            >
              The selected file exceeds the 50MB maximum upload limit. Please compress assets and try again.
            </Alert>
          )}
        </div>
      </section>

      {/* 6. Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-bold text-brand-text border-b border-brand-border pb-2">
          6. Cards & Elevation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverable>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="published" dot>
                  Published
                </Badge>
                <span className="text-xs text-brand-muted">Intermediate</span>
              </div>
              <CardTitle>AI Resume Matcher</CardTitle>
              <CardDescription>
                Fullstack NLP platform matching candidate resumes to job descriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="primary" size="sm">
                  Python
                </Badge>
                <Badge variant="cyan" size="sm">
                  FastAPI
                </Badge>
                <Badge variant="neutral" size="sm">
                  React
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-brand-muted">Created by Alex Chen</span>
              <Button size="sm" variant="outline" rightIcon={ArrowRight}>
                View
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interactive Modal Demo</CardTitle>
              <CardDescription>
                Test keyboard navigation, backdrop dismissal, and focus trapping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-brand-muted">
                Modals comply with WCAG 2.1 AA dialog guidelines with backdrop blurring.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Demo Modal
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading & Skeletons</CardTitle>
              <CardDescription>Visual state indicators during network fetching.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Spinner size="md" />
                <span className="text-xs text-brand-muted">Loading project data...</span>
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Accessible Modal Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Submission"
        description="Please confirm you are ready to submit your project for review."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Project submitted for review!');
                setIsModalOpen(false);
              }}
            >
              Submit for Review
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-brand-muted leading-relaxed">
            By submitting, your project will enter the <strong>Under Review</strong> queue. Our team
            checks for security compliance, project ZIP integrity, and clear documentation.
          </p>
          <div className="p-3 bg-brand-veryLight rounded-lg border border-brand-border text-xs text-brand-primary">
            ✓ Estimated review turnaround: 24–48 hours.
          </div>
        </div>
      </Modal>
    </div>
  );
}
