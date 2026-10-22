import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APPLICATION_METHODS,
  isValidSafeHttpsUrl,
  isValidGoogleFormUrl,
  isValidEmail,
  getRecruiterMailtoLink,
  getJobApplicationDestination,
} from '../src/utils/jobHelpers.js';

test('APPLICATION_METHODS defines all 4 supported methods with labels and helper text', () => {
  assert.equal(APPLICATION_METHODS.INTERNAL.value, 'INTERNAL');
  assert.equal(APPLICATION_METHODS.GOOGLE_FORM.value, 'GOOGLE_FORM');
  assert.equal(APPLICATION_METHODS.EMAIL.value, 'EMAIL');
  assert.equal(APPLICATION_METHODS.EXTERNAL_URL.value, 'EXTERNAL_URL');
  assert.ok(APPLICATION_METHODS.GOOGLE_FORM.helpText.length > 0);
  assert.ok(APPLICATION_METHODS.EMAIL.helpText.length > 0);
});

test('isValidSafeHttpsUrl validates safe HTTPS URLs and rejects unsafe schemes', () => {
  assert.equal(isValidSafeHttpsUrl('https://careers.google.com/jobs/123'), true);
  assert.equal(isValidSafeHttpsUrl('https://sub.domain.co.uk/path?arg=1#top'), true);

  // Insecure and unsafe schemes
  assert.equal(isValidSafeHttpsUrl('http://insecure-site.com'), false);
  assert.equal(isValidSafeHttpsUrl('javascript:alert(1)'), false);
  assert.equal(isValidSafeHttpsUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isValidSafeHttpsUrl('ftp://example.com/file'), false);
  assert.equal(isValidSafeHttpsUrl(''), false);
  assert.equal(isValidSafeHttpsUrl(null), false);
  assert.equal(isValidSafeHttpsUrl('not-a-url'), false);
});

test('isValidGoogleFormUrl validates Google Form URLs and rejects non-Google domains', () => {
  // Valid Google form links
  assert.equal(isValidGoogleFormUrl('https://forms.gle/xyz987Abc'), true);
  assert.equal(isValidGoogleFormUrl('https://docs.google.com/forms/d/e/1FAIpQLSc/viewform'), true);
  assert.equal(isValidGoogleFormUrl('https://docs.google.com/forms/d/123/edit'), true);

  // Invalid / non-Google domains
  assert.equal(isValidGoogleFormUrl('https://phishing-google.com/forms/123'), false);
  assert.equal(isValidGoogleFormUrl('https://docs.google.com/document/d/123'), false);
  assert.equal(isValidGoogleFormUrl('http://forms.gle/insecure'), false);
  assert.equal(isValidGoogleFormUrl('javascript:alert(1)'), false);
  assert.equal(isValidGoogleFormUrl(''), false);
  assert.equal(isValidGoogleFormUrl(null), false);
});

test('isValidEmail validates email formats correctly', () => {
  assert.equal(isValidEmail('recruiter@company.com'), true);
  assert.equal(isValidEmail('talent.team+jobs@careers.co.uk'), true);

  assert.equal(isValidEmail('plainaddress'), false);
  assert.equal(isValidEmail('@missinguser.com'), false);
  assert.equal(isValidEmail('missingdomain@'), false);
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail(null), false);
});

test('getRecruiterMailtoLink creates mailto link with encoded subject and body', () => {
  const mailto = getRecruiterMailtoLink('recruiter@acme.com', 'Senior Engineer', 'Acme Corp');
  assert.ok(mailto.startsWith('mailto:recruiter@acme.com?subject='));
  assert.ok(mailto.includes('Senior%20Engineer'));
  assert.ok(mailto.includes('Acme%20Corp'));
});

test('getJobApplicationDestination correctly formats destination for each application method', () => {
  // 1. Internal Application
  const internalJob = {
    id: 101,
    title: 'Frontend Developer',
    company_name: 'TechLabs',
    application_method: 'INTERNAL',
  };
  const internalDest = getJobApplicationDestination(internalJob);
  assert.equal(internalDest.method, 'INTERNAL');
  assert.equal(internalDest.isExternal, false);
  assert.equal(internalDest.isInternal, true);
  assert.equal(internalDest.buttonText, 'Apply Now');
  assert.equal(internalDest.url, '/jobs/101');

  // 2. Google Form
  const googleFormJob = {
    id: 102,
    title: 'Data Analyst',
    company_name: 'Alpha Data',
    application_method: 'GOOGLE_FORM',
    application_url: 'https://forms.gle/abcdef123',
    application_instructions: 'Complete the screening form before Friday.',
  };
  const googleFormDest = getJobApplicationDestination(googleFormJob);
  assert.equal(googleFormDest.method, 'GOOGLE_FORM');
  assert.equal(googleFormDest.isExternal, true);
  assert.equal(googleFormDest.url, 'https://forms.gle/abcdef123');
  assert.equal(googleFormDest.buttonText, 'Apply via Google Form');

  // 3. Recruiter Email
  const emailJob = {
    id: 103,
    title: 'Product Designer',
    company_name: 'DesignStudio',
    application_method: 'EMAIL',
    recruiter_email: 'hiring@designstudio.io',
  };
  const emailDest = getJobApplicationDestination(emailJob);
  assert.equal(emailDest.method, 'EMAIL');
  assert.equal(emailDest.isExternal, true);
  assert.equal(emailDest.isMailto, true);
  assert.ok(emailDest.url.startsWith('mailto:hiring@designstudio.io'));
  assert.equal(emailDest.buttonText, 'Email Recruiter');

  // 4. External URL
  const externalJob = {
    id: 104,
    title: 'Backend Engineer',
    company_name: 'CloudCo',
    application_method: 'EXTERNAL_URL',
    application_url: 'https://careers.cloudco.com/jobs/999',
  };
  const extDest = getJobApplicationDestination(externalJob);
  assert.equal(extDest.method, 'EXTERNAL_URL');
  assert.equal(extDest.isExternal, true);
  assert.equal(extDest.isMailto, false);
  assert.equal(extDest.url, 'https://careers.cloudco.com/jobs/999');
  assert.equal(extDest.buttonText, 'Apply on Company Site');

  // 5. Legacy job with no application_method (defaults to INTERNAL)
  const legacyJob = {
    id: 105,
    title: 'DevOps Engineer',
    company_name: 'LegacySys',
  };
  const legacyDest = getJobApplicationDestination(legacyJob);
  assert.equal(legacyDest.method, 'INTERNAL');
  assert.equal(legacyDest.isInternal, true);
  assert.equal(legacyDest.buttonText, 'Apply Now');

  // 6. Misconfigured external job falls back gracefully to internal details
  const misconfiguredJob = {
    id: 106,
    title: 'Security Lead',
    company_name: 'SecureNet',
    application_method: 'EXTERNAL_URL',
    application_url: '', // Missing
  };
  const misconfiguredDest = getJobApplicationDestination(misconfiguredJob);
  assert.equal(misconfiguredDest.isInternal, true);
  assert.equal(misconfiguredDest.url, '/jobs/106');
});
