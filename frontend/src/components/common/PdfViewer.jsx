import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowRight,
  RotateCw,
  AlertCircle,
  FileText,
} from 'lucide-react';

// Configure the worker source using Vite's static asset URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * High-performance, cross-platform PDF Viewer built with PDF.js and HTML5 Canvas.
 * Fully compatible with desktop, tablet, and mobile browsers.
 * Bypasses iframe CSP and browser plugin limitations.
 */
export default function PdfViewer({
  pdfData, // Blob, ArrayBuffer, Uint8Array, or string URL
  fileName = 'document.pdf',
  title = 'Document Preview',
  onDownload,
  onUseTemplate,
  useTemplateLabel = 'Use in Builder',
  initialScale = 1.0,
  maxScale = 2.5,
  minScale = 0.5,
  scaleStep = 0.25,
  className = '',
  isFullscreen: externalIsFullscreen = false,
  onToggleFullscreen,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pdfDocRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState('1');

  const isFullscreen = externalIsFullscreen || internalFullscreen;

  // Toggle fullscreen state
  const handleToggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen(!isFullscreen);
    } else {
      setInternalFullscreen(!internalFullscreen);
    }
  };

  // Load the PDF document
  useEffect(() => {
    let active = true;
    let loadingTask = null;

    async function loadDocument() {
      if (!pdfData) {
        setLoading(false);
        setError('No document data provided.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let loadingSource;

        if (pdfData instanceof Blob) {
          const arrayBuffer = await pdfData.arrayBuffer();
          loadingSource = { data: new Uint8Array(arrayBuffer) };
        } else if (pdfData instanceof ArrayBuffer) {
          loadingSource = { data: new Uint8Array(pdfData) };
        } else if (pdfData instanceof Uint8Array) {
          loadingSource = { data: pdfData };
        } else if (typeof pdfData === 'string') {
          loadingSource = { url: pdfData };
        } else {
          throw new Error('Unsupported PDF data format');
        }

        loadingTask = pdfjsLib.getDocument(loadingSource);
        const doc = await loadingTask.promise;

        if (!active) {
          doc.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setPageInput('1');
        setLoading(false);
      } catch (err) {
        if (!active) return;
        console.error('PdfViewer: Failed to parse PDF document:', err);
        setError('Failed to load PDF document. The file may be corrupt or inaccessible.');
        setLoading(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy();
        } catch (_) {}
        pdfDocRef.current = null;
      }
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch (_) {}
      }
    };
  }, [pdfData]);

  // Render the current page onto the canvas
  const renderCurrentPage = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || currentPage < 1 || currentPage > doc.numPages) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (_) {}
      renderTaskRef.current = null;
    }

    try {
      const page = await doc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      // Support high-DPI (Retina) screens for sharp text rendering
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('PdfViewer: Page render failed:', err);
      }
    }
  }, [currentPage, scale]);

  useEffect(() => {
    if (!loading && !error && pdfDocRef.current) {
      renderCurrentPage();
    }
  }, [loading, error, currentPage, scale, renderCurrentPage]);

  // Zoom helpers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + scaleStep, maxScale));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - scaleStep, minScale));
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  const handleFitWidth = () => {
    if (containerRef.current && pdfDocRef.current) {
      pdfDocRef.current.getPage(currentPage).then((page) => {
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const containerWidth = containerRef.current.clientWidth - 48; // padding
        if (containerWidth > 100 && unscaledViewport.width > 0) {
          const fitted = Math.min(Math.max(containerWidth / unscaledViewport.width, minScale), maxScale);
          setScale(Number(fitted.toFixed(2)));
        }
      });
    }
  };

  // Page navigation helpers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const nextP = currentPage - 1;
      setCurrentPage(nextP);
      setPageInput(String(nextP));
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const nextP = currentPage + 1;
      setCurrentPage(nextP);
      setPageInput(String(nextP));
    }
  };

  const handlePageInputCommit = (e) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= numPages) {
      setCurrentPage(p);
    } else {
      setPageInput(String(currentPage));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#1e232a] text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'w-full'
      } ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs select-none">
        {/* Left: Document info & Page controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold truncate max-w-[200px] sm:max-w-xs">
            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate" title={fileName}>{fileName}</span>
          </div>

          {numPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                aria-label="Previous Page"
                className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <form onSubmit={handlePageInputCommit} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageInputCommit}
                  aria-label="Current Page Number"
                  className="w-8 text-center bg-slate-900 border border-slate-700 rounded text-xs py-0.5 text-white focus:outline-none focus:border-blue-400"
                />
                <span className="text-slate-400">/ {numPages}</span>
              </form>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                aria-label="Next Page"
                className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= minScale}
            aria-label="Zoom Out"
            title="Zoom Out"
            className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleZoomReset}
            title="Reset to 100%"
            className="px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:bg-slate-700 rounded"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= maxScale}
            aria-label="Zoom In"
            title="Zoom In"
            className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3 bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={handleFitWidth}
            className="px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 rounded"
            title="Fit to Width"
          >
            Fit
          </button>
        </div>

        {/* Right: Actions (Download, Fullscreen, Use In Builder) */}
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold transition"
              title="Download Template"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          {onUseTemplate && (
            <button
              type="button"
              onClick={onUseTemplate}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-xs"
              title={useTemplateLabel}
            >
              <span>{useTemplateLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Main Canvas Viewing Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center min-h-[350px] max-h-[82vh] relative bg-[#181c22]">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-16 text-slate-300">
            <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Rendering document preview...</p>
          </div>
        ) : error ? (
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Preview Unavailable</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{error}</p>
            </div>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition inline-flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template Directly</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white flex items-center justify-center transition-transform">
            <canvas ref={canvasRef} className="block max-w-full h-auto" />
          </div>
        )}
      </div>
    </div>
  );
}

