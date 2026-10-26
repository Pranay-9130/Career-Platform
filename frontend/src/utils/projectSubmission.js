export const MINIMUM_PROJECT_SCREENSHOTS = 3;

export const hasMinimumProjectScreenshots = (screenshots) =>
  screenshots.length >= MINIMUM_PROJECT_SCREENSHOTS;

export const shouldReplaceCoverWithScreenshot = (coverUrl, presetCoverUrls) =>
  !coverUrl || presetCoverUrls.has(coverUrl);
