/**
 * Helper utilities for formatting Job Salary and Deadlines.
 */

/**
 * Format salary/stipend in Indian Rupees (₹).
 * Returns null if salary is empty, undisclosed, or falsy.
 */
export function formatSalary(salary) {
  if (!salary) return null;
  const trimmed = String(salary).trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === 'competitive' ||
    trimmed.toLowerCase() === 'not disclosed' ||
    trimmed.toLowerCase() === 'undisclosed'
  ) {
    return null;
  }

  // If old data had dollar signs, replace $ with ₹
  let formatted = trimmed.replace(/\$/g, '₹');

  // If it's a plain number or range without currency or LPA, add ₹ prefix
  if (/^[0-9]+(\s*-\s*[0-9]+)?(\s*\/\s*(mo|month|yr|year|hr))?$/i.test(formatted)) {
    formatted = `₹${formatted}`;
  }

  return formatted;
}

/**
 * Format job start date. Returns status and label.
 */
export function formatStartDate(startDate) {
  if (!startDate) {
    return {
      hasStartDate: false,
      isUpcoming: false,
      text: 'Immediate',
      label: 'Immediate',
      date: null,
    };
  }

  const d = new Date(startDate);
  if (isNaN(d.getTime())) {
    return {
      hasStartDate: false,
      isUpcoming: false,
      text: String(startDate),
      label: String(startDate),
      date: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDay = new Date(d);
  startDay.setHours(0, 0, 0, 0);

  const isUpcoming = startDay > today;
  const formattedDate = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    hasStartDate: true,
    isUpcoming,
    date: d,
    text: isUpcoming ? `Starts: ${formattedDate}` : `Started: ${formattedDate}`,
    label: formattedDate,
  };
}

/**
 * Format job deadline. Returns status and label.
 */
export function formatDeadline(deadline) {
  if (!deadline) {
    return {
      hasDeadline: false,
      isExpired: false,
      text: 'Rolling / No expiry',
      label: 'Rolling basis',
      date: null,
    };
  }

  const d = new Date(deadline);
  if (isNaN(d.getTime())) {
    return {
      hasDeadline: false,
      isExpired: false,
      text: String(deadline),
      label: String(deadline),
      date: null,
    };
  }

  // Compare with current date (start of today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isExpired = d < today;

  const formattedDate = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    hasDeadline: true,
    isExpired,
    date: d,
    text: isExpired ? `Expired (${formattedDate})` : `Deadline: ${formattedDate}`,
    label: formattedDate,
  };
}

/**
 * Format complete application window (Start Date -> Deadline / Expiry).
 */
export function formatApplicationWindow(startDate, deadline) {
  const startInfo = formatStartDate(startDate);
  const deadlineInfo = formatDeadline(deadline);

  const isUpcoming = startInfo.isUpcoming;
  const isExpired = deadlineInfo.isExpired;
  const isOpen = !isUpcoming && !isExpired;

  let badge = {
    label: 'Open (Rolling)',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  if (isUpcoming) {
    badge = {
      label: `Opens ${startInfo.label}`,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  } else if (isExpired) {
    badge = {
      label: `Closed (${deadlineInfo.label})`,
      colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  } else if (deadlineInfo.hasDeadline) {
    badge = {
      label: `Closes ${deadlineInfo.label}`,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  return {
    start: startInfo,
    deadline: deadlineInfo,
    isUpcoming,
    isExpired,
    isOpen,
    badge,
  };
}

export const APPLICATION_METHODS = [
  {
    value: 'INTERNAL',
    label: 'Apply on AspirePath (Internal Application)',
    shortLabel: 'Internal Application',
    description: 'Students apply directly through AspirePath with their student workspace and projects.',
    helpText: 'Students apply directly through AspirePath with their student workspace and projects.',
  },
  {
    value: 'GOOGLE_FORM',
    label: 'External Google Form',
    shortLabel: 'Google Form',
    description: "Directs applicants to the company's official Google Form response page.",
    helpText: "Directs applicants to the company's official Google Form response page.",
  },
  {
    value: 'EMAIL',
    label: 'Recruiter Email',
    shortLabel: 'Recruiter Email',
    description: "Opens the applicant's default mail client addressed to the hiring recruiter.",
    helpText: "Opens the applicant's default mail client addressed to the hiring recruiter.",
  },
  {
    value: 'EXTERNAL_URL',
    label: 'External Application Website',
    shortLabel: 'External Website',
    description: "Directs applicants to the company's external career site or ATS portal.",
    helpText: "Directs applicants to the company's external career site or ATS portal.",
  },
];

APPLICATION_METHODS.INTERNAL = APPLICATION_METHODS[0];
APPLICATION_METHODS.GOOGLE_FORM = APPLICATION_METHODS[1];
APPLICATION_METHODS.EMAIL = APPLICATION_METHODS[2];
APPLICATION_METHODS.EXTERNAL_URL = APPLICATION_METHODS[3];

/**
 * Validates whether a URL uses secure HTTPS and has no forbidden schemes.
 */
export function isValidSafeHttpsUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.toLowerCase().startsWith('https://')) return false;
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Validates Google Form URL (forms.gle or docs.google.com/forms).
 */
export function isValidGoogleFormUrl(url) {
  if (!isValidSafeHttpsUrl(url)) return false;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'forms.gle') return true;
    if (host === 'docs.google.com' && parsed.pathname.toLowerCase().includes('/forms')) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Validates simple email format.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(trimmed);
}

/**
 * Construct safe mailto URI for recruiter email application.
 * Accepts either a job object or (email, title, company_name) arguments.
 */
export function getRecruiterMailtoLink(jobOrEmail, maybeTitle, maybeCompany) {
  let email = '';
  let title = 'Open Position';
  let company = 'Company';

  if (typeof jobOrEmail === 'string') {
    email = jobOrEmail.trim();
    if (maybeTitle) title = maybeTitle.trim();
    if (maybeCompany) company = maybeCompany.trim();
  } else if (jobOrEmail && typeof jobOrEmail === 'object') {
    email = jobOrEmail.recruiter_email ? jobOrEmail.recruiter_email.trim() : '';
    if (jobOrEmail.title) title = jobOrEmail.title.trim();
    if (jobOrEmail.company_name) company = jobOrEmail.company_name.trim();
  }

  if (!email) return '';
  const subject = encodeURIComponent(`Application for ${title} at ${company}`);
  return `mailto:${email}?subject=${subject}`;
}

/**
 * Resolve display and action details based on configured application method.
 */
export function getJobApplicationDestination(job) {
  const method = (job?.application_method || 'INTERNAL').toUpperCase();

  switch (method) {
    case 'GOOGLE_FORM': {
      const url = job?.application_url || job?.apply_url;
      const isMissing = !url || !isValidSafeHttpsUrl(url);
      const targetUrl = isMissing ? (job?.id ? `/jobs/${job.id}` : '#') : url;
      return {
        method: 'GOOGLE_FORM',
        type: isMissing ? 'internal' : 'link',
        href: targetUrl,
        url: targetUrl,
        buttonText: 'Apply via Google Form',
        isExternal: !isMissing,
        isInternal: isMissing,
        isMailto: false,
        instructions: job?.application_instructions || '',
        isMissingTarget: isMissing,
        helperText: 'Opens the company Google Form in a new tab.',
      };
    }

    case 'EMAIL': {
      const email = job?.recruiter_email;
      const isMissing = !email || !isValidEmail(email);
      const mailtoUrl = isMissing ? (job?.id ? `/jobs/${job.id}` : '#') : getRecruiterMailtoLink(job);
      return {
        method: 'EMAIL',
        type: isMissing ? 'internal' : 'mailto',
        href: mailtoUrl,
        url: mailtoUrl,
        buttonText: 'Email Recruiter',
        isExternal: !isMissing,
        isInternal: isMissing,
        isMailto: !isMissing,
        instructions: job?.application_instructions || '',
        isMissingTarget: isMissing,
        helperText: `Sends email directly to ${email || 'recruiter'}.`,
      };
    }

    case 'EXTERNAL_URL': {
      const url = job?.application_url || job?.apply_url;
      const isMissing = !url || !isValidSafeHttpsUrl(url);
      const targetUrl = isMissing ? (job?.id ? `/jobs/${job.id}` : '#') : url;
      return {
        method: 'EXTERNAL_URL',
        type: isMissing ? 'internal' : 'link',
        href: targetUrl,
        url: targetUrl,
        buttonText: 'Apply on Company Site',
        isExternal: !isMissing,
        isInternal: isMissing,
        isMailto: false,
        instructions: job?.application_instructions || '',
        isMissingTarget: isMissing,
        helperText: 'Opens the official career page in a new tab.',
      };
    }

    case 'INTERNAL':
    default: {
      const internalHref = `/jobs/${job?.id || ''}`;
      return {
        method: 'INTERNAL',
        type: 'internal',
        href: internalHref,
        url: internalHref,
        buttonText: 'Apply Now',
        isExternal: false,
        isInternal: true,
        isMailto: false,
        instructions: job?.application_instructions || '',
        isMissingTarget: false,
        helperText: 'Submit directly through AspirePath.',
      };
    }
  }
}

/**
 * Job Eligibility Constants & Helpers
 */
export const ELIGIBLE_BATCH_OPTIONS = [
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  'All Batches',
];

export const CANDIDATE_TYPE_OPTIONS = [
  'Freshers Only',
  'Experienced Only',
  'Both Freshers and Experienced',
];

export const ELIGIBLE_QUALIFICATION_OPTIONS = [
  'B.Tech',
  'B.E.',
  'M.Tech',
  'M.E.',
  'BCA',
  'MCA',
  'B.Sc',
  'M.Sc',
  'MBA',
  'Diploma',
  'Other',
];

export function getJobEligibilityDetails(job) {
  const batches = Array.isArray(job?.eligible_batches) ? job.eligible_batches : [];
  const candidateType = job?.candidate_type || null;
  const qualifications = Array.isArray(job?.eligible_qualifications) ? job.eligible_qualifications : [];

  const batchesText = batches.length > 0 ? batches.join(', ') : 'Not Specified';
  const candidateTypeText = candidateType || 'Not Specified';
  const qualificationsText = qualifications.length > 0 ? qualifications.join(', ') : 'Not Specified';

  const hasAnyEligibility = batches.length > 0 || Boolean(candidateType) || qualifications.length > 0;

  return {
    batches,
    batchesText,
    candidateType,
    candidateTypeText,
    qualifications,
    qualificationsText,
    hasAnyEligibility,
    isBatchesSpecified: batches.length > 0,
    isCandidateTypeSpecified: Boolean(candidateType),
    isQualificationsSpecified: qualifications.length > 0,
  };
}

export function checkProfileEligibilityMatch(job, profile) {
  if (!profile) {
    return {
      status: 'unknown',
      label: 'Eligibility cannot be determined',
      details: 'Sign in to see if this opportunity matches your academic profile.',
    };
  }

  const { batches, qualifications, hasAnyEligibility } = getJobEligibilityDetails(job);

  if (!hasAnyEligibility) {
    return {
      status: 'open',
      label: 'Open to all candidates',
      details: 'No specific graduation batch or degree restrictions specified.',
    };
  }

  const studentYear = profile.graduation_year ? String(profile.graduation_year).trim() : null;
  const studentDegree = profile.degree ? profile.degree.trim() : null;

  if (!studentYear && !studentDegree) {
    return {
      status: 'unknown',
      label: 'Eligibility cannot be determined',
      details: 'Add graduation year and degree to your profile to check matching status.',
    };
  }

  let batchMatch = true;
  if (batches.length > 0) {
    if (!studentYear) {
      batchMatch = null;
    } else if (batches.includes('All Batches') || batches.includes(studentYear)) {
      batchMatch = true;
    } else {
      batchMatch = false;
    }
  }

  let qualMatch = true;
  if (qualifications.length > 0) {
    if (!studentDegree) {
      qualMatch = null;
    } else {
      const lowerDegree = studentDegree.toLowerCase().replace(/[\.\s]/g, '');
      qualMatch = qualifications.some((q) => {
        const cleanQ = q.toLowerCase().replace(/[\.\s]/g, '');
        return lowerDegree.includes(cleanQ) || (q === 'Other' && true);
      });
    }
  }

  if (batchMatch === false || qualMatch === false) {
    return {
      status: 'mismatch',
      label: 'May not match all criteria',
      details: 'Your profile details differ from the preferred graduation batch or qualification.',
    };
  }

  if (batchMatch === true && qualMatch === true) {
    return {
      status: 'match',
      label: 'Matches your profile',
      details: 'Your graduation year and qualification match this job opening.',
    };
  }

  return {
    status: 'partial',
    label: 'Partially matches profile',
    details: 'Some criteria could not be determined from your profile.',
  };
}

