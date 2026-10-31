import test from 'node:test';
import assert from 'node:assert/strict';

// Helper validator logic matching AtsAnalyzerPage.jsx
function validateResumeFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }
  const validExtensions = /\.(pdf|docx)$/i;
  if (!validExtensions.test(file.name)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx).',
    };
  }
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum allowed size is 5 MB.`,
    };
  }
  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty. Please upload a valid document.',
    };
  }
  return { valid: true, error: null };
}

function checkIsResumeReady({ resumeMode, uploadedExtractedText, pastedResumeText, selectedResumeId }) {
  if (resumeMode === 'upload') {
    return Boolean(uploadedExtractedText && uploadedExtractedText.trim().length > 0);
  }
  if (resumeMode === 'saved') {
    return Boolean(selectedResumeId);
  }
  return Boolean(pastedResumeText && pastedResumeText.trim().length > 0);
}

function buildAtsAnalysisPayload({ resumeMode, uploadedExtractedText, pastedResumeText, selectedResumeId, jobDescription }) {
  const payload = {};
  if (resumeMode === 'upload') {
    if (!uploadedExtractedText || !uploadedExtractedText.trim()) {
      throw new Error('Please upload a valid resume (PDF or DOCX) before running the analysis.');
    }
    payload.resume_text = uploadedExtractedText.trim();
  } else if (resumeMode === 'saved') {
    if (!selectedResumeId) {
      throw new Error('Please select a saved resume or switch to Upload / Paste to provide your resume.');
    }
    payload.resume_id = selectedResumeId;
  } else {
    if (!pastedResumeText || !pastedResumeText.trim()) {
      throw new Error('Please provide your resume text before running the analysis.');
    }
    payload.resume_text = pastedResumeText.trim();
  }

  if (!jobDescription || !jobDescription.trim()) {
    throw new Error('Please paste the target job description before running the analysis.');
  }
  payload.job_description = jobDescription.trim();

  return payload;
}

test('validateResumeFile accepts valid PDF files', () => {
  const res = validateResumeFile({ name: 'Candidate_Resume.pdf', size: 1024 * 200 });
  assert.equal(res.valid, true);
  assert.equal(res.error, null);
});

test('validateResumeFile accepts valid DOCX files', () => {
  const res = validateResumeFile({ name: 'Software_Engineer_CV.docx', size: 1024 * 500 });
  assert.equal(res.valid, true);
  assert.equal(res.error, null);
});

test('validateResumeFile rejects unsupported file formats like images, text, and zip', () => {
  assert.equal(validateResumeFile({ name: 'resume.txt', size: 500 }).valid, false);
  assert.equal(validateResumeFile({ name: 'scan.png', size: 500 }).valid, false);
  assert.equal(validateResumeFile({ name: 'archive.zip', size: 500 }).valid, false);
  assert.equal(validateResumeFile({ name: 'document.odt', size: 500 }).valid, false);
});

test('validateResumeFile rejects files exceeding the 5 MB threshold', () => {
  const res = validateResumeFile({ name: 'giant_resume.pdf', size: 6 * 1024 * 1024 });
  assert.equal(res.valid, false);
  assert.ok(res.error.includes('Maximum allowed size is 5 MB'));
});

test('validateResumeFile rejects 0-byte empty files', () => {
  const res = validateResumeFile({ name: 'empty.pdf', size: 0 });
  assert.equal(res.valid, false);
  assert.ok(res.error.includes('empty'));
});

test('checkIsResumeReady returns true for upload mode when text was extracted', () => {
  const ready = checkIsResumeReady({
    resumeMode: 'upload',
    uploadedExtractedText: 'Jane Doe\nFull Stack Developer\nPython, React',
    pastedResumeText: '',
    selectedResumeId: '',
  });
  assert.equal(ready, true);
});

test('checkIsResumeReady returns false for upload mode when no text was extracted', () => {
  const ready = checkIsResumeReady({
    resumeMode: 'upload',
    uploadedExtractedText: '   ',
    pastedResumeText: '',
    selectedResumeId: '',
  });
  assert.equal(ready, false);
});

test('checkIsResumeReady preserves readiness for paste and saved modes', () => {
  // Paste mode
  assert.equal(
    checkIsResumeReady({
      resumeMode: 'paste',
      uploadedExtractedText: '',
      pastedResumeText: 'Experienced Python Engineer with 3+ years',
      selectedResumeId: '',
    }),
    true
  );

  // Saved mode
  assert.equal(
    checkIsResumeReady({
      resumeMode: 'saved',
      uploadedExtractedText: '',
      pastedResumeText: '',
      selectedResumeId: 'resume-uuid-1234',
    }),
    true
  );
});

test('buildAtsAnalysisPayload passes extracted text into resume_text identically to paste mode', () => {
  const uploadPayload = buildAtsAnalysisPayload({
    resumeMode: 'upload',
    uploadedExtractedText: 'Jane Doe Software Engineer React FastAPI Docker',
    pastedResumeText: '',
    selectedResumeId: '',
    jobDescription: 'Looking for a Software Engineer proficient in React and FastAPI.',
  });

  const pastePayload = buildAtsAnalysisPayload({
    resumeMode: 'paste',
    uploadedExtractedText: '',
    pastedResumeText: 'Jane Doe Software Engineer React FastAPI Docker',
    selectedResumeId: '',
    jobDescription: 'Looking for a Software Engineer proficient in React and FastAPI.',
  });

  // Verify that the ATS pipeline receives identical resume_text and job_description
  assert.deepEqual(uploadPayload, pastePayload);
  assert.equal(uploadPayload.resume_text, 'Jane Doe Software Engineer React FastAPI Docker');
  assert.equal(uploadPayload.job_description, 'Looking for a Software Engineer proficient in React and FastAPI.');
});

test('buildAtsAnalysisPayload passes selected resume_id when in saved mode', () => {
  const savedPayload = buildAtsAnalysisPayload({
    resumeMode: 'saved',
    uploadedExtractedText: '',
    pastedResumeText: '',
    selectedResumeId: 'draft-id-999',
    jobDescription: 'Frontend Developer React',
  });

  assert.equal(savedPayload.resume_id, 'draft-id-999');
  assert.equal(savedPayload.job_description, 'Frontend Developer React');
  assert.equal(savedPayload.resume_text, undefined);
});
