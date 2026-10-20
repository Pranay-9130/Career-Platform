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
 * Format job deadline. Returns status and label.
 */
export function formatDeadline(deadline) {
  if (!deadline) {
    return {
      hasDeadline: false,
      isExpired: false,
      text: 'Rolling / No expiry',
      label: 'Rolling basis',
    };
  }

  const d = new Date(deadline);
  if (isNaN(d.getTime())) {
    return {
      hasDeadline: false,
      isExpired: false,
      text: String(deadline),
      label: String(deadline),
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
