export const REGISTRATION_ROLE_OPTIONS = Object.freeze([
  Object.freeze({
    value: 'STUDENT',
    label: 'Student / Learner',
    defaultHeadline: 'Computer Science Student',
  }),
  Object.freeze({
    value: 'CONTRIBUTOR',
    label: 'Job Seeker',
    defaultHeadline: 'Software Developer',
  }),
]);

export const getDefaultHeadline = (role) =>
  REGISTRATION_ROLE_OPTIONS.find((option) => option.value === role)?.defaultHeadline ||
  REGISTRATION_ROLE_OPTIONS[0].defaultHeadline;
