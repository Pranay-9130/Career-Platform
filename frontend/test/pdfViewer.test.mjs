import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('PdfViewer component file exists and exports a default component', () => {
  const filePath = path.resolve('src/components/common/PdfViewer.jsx');
  assert.ok(fs.existsSync(filePath), 'PdfViewer.jsx should exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('export default function PdfViewer'), 'Must export PdfViewer');
  assert.ok(content.includes('pdfjsLib.getDocument'), 'Must use PDF.js getDocument');
  assert.ok(content.includes('canvasRef'), 'Must use HTML5 Canvas for rendering');
  assert.ok(content.includes('ZoomIn'), 'Must provide ZoomIn control');
  assert.ok(content.includes('ZoomOut'), 'Must provide ZoomOut control');
  assert.ok(content.includes('Maximize2'), 'Must provide Fullscreen control');
});

test('TemplatesPage integrates PdfViewer and avoids iframe blob blocking', () => {
  const filePath = path.resolve('src/pages/public/TemplatesPage.jsx');
  const content = fs.readFileSync(filePath, 'utf-8');

  assert.ok(content.includes("import PdfViewer from '@/components/common/PdfViewer'"), 'Must import PdfViewer');
  assert.ok(content.includes('<PdfViewer'), 'Must render PdfViewer component');
  assert.ok(!content.includes('<iframe'), 'Must not render iframe for PDF preview');
  assert.ok(content.includes('templateBlobCacheRef'), 'Must cache PDF blobs to avoid duplicate downloads');
});

test('vercel.json allows blob and worker in Content-Security-Policy', () => {
  const filePath = path.resolve('vercel.json');
  const content = fs.readFileSync(filePath, 'utf-8');
  const config = JSON.parse(content);

  const cspHeader = config.headers
    ?.find((h) => h.source === '/(.*)')
    ?.headers?.find((k) => k.key === 'Content-Security-Policy');

  assert.ok(cspHeader, 'CSP header must exist in vercel.json');
  assert.ok(cspHeader.value.includes("frame-src 'self' blob:"), 'frame-src must permit blob: URLs');
  assert.ok(cspHeader.value.includes("worker-src 'self' blob:"), 'worker-src must permit web workers');
});

