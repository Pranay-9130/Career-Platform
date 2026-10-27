export const MINIMUM_PROJECT_SCREENSHOTS = 3;

export const hasMinimumProjectScreenshots = (screenshots) =>
  (screenshots || []).length >= MINIMUM_PROJECT_SCREENSHOTS;

export const shouldReplaceCoverWithScreenshot = (coverUrl, presetCoverUrls) =>
  !coverUrl || presetCoverUrls.has(coverUrl);

export const validateFeatureInput = (input, existingFeatures = []) => {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter a feature before clicking Add Feature.',
    };
  }
  const isDuplicate = (existingFeatures || []).some(
    (feat) => feat.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    return {
      isValid: false,
      error: 'This feature has already been added to your list.',
    };
  }
  return {
    isValid: true,
    feature: trimmed,
    error: null,
  };
};

export const isStep1BasicInfoValid = (formData) => {
  return Boolean(
    formData?.title?.trim()?.length >= 3 &&
    Boolean(formData?.domain)
  );
};

export const isStep2ProblemAndFeaturesValid = (formData) => {
  return Boolean(
    formData?.problem_statement?.trim()?.length >= 10 &&
    (formData?.features || []).length >= 1
  );
};
