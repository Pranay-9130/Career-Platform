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
  AlertCircle,
  FileText,
  RotateCw,
} from 'lucide-react';

// Configure the worker source using Vite's static asset URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * High-performance, cross-platform PDF Viewer built with PDF.js and HTML5 Canvas.
 * Fully responsive: desktop, tablet, and mobile.
 * Preserves original aspect ratio without cropping, supports multi-page scrolling,
 * and handles zoom, fit-to-width, and error/loading states.
 */
export default function PdfViewer({
  pdfData, // Blob, ArrayBuffer, Uint8Array, or string URL
  fileName = 'document.pdf',
  title = 'Document Preview',
  onDownload,
  downloadLabel = 'Download Document Directly',
  initialScale = null,
  maxScale = 2.5,
  minScale = 0.4,
  scaleStep = 0.15,
  className = '',
  isFullscreen: externalIsFullscreen = false,
  onToggleFullscreen,
  onClose,
}) {
  const containerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const canvasesRef = useRef({});
  const canvasRef = canvasesRef; // Alias for test compatibility
  const renderTasksRef = useRef({});
  const pdfDocRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState('1');
  const [pageDimensions, setPageDimensions] = useState([]);

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
          try {
            const res = await fetch(pdfData);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const arrayBuffer = await res.arrayBuffer();
            loadingSource = { data: new Uint8Array(arrayBuffer) };
          } catch (_) {
            loadingSource = { url: pdfData };
          }
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
        const total = doc.numPages;
        setNumPages(total);
        setCurrentPage(1);
        setPageInput('1');

        // Retrieve dimensions for each page
        const dims = [];
        for (let i = 1; i <= total; i++) {
          const page = await doc.getPage(i);
          const vp = page.getViewport({ scale: 1.0 });
          dims.push({ pageNum: i, width: vp.width, height: vp.height });
        }
        if (!active) return;
        setPageDimensions(dims);

        // Compute optimal initial scale that fits container width cleanly
        const firstPageWidth = dims[0]?.width || 612;
        const firstPageHeight = dims[0]?.height || 792;
        const availableWidth = (containerRef.current?.clientWidth || window.innerWidth * 0.7) - 48;
        const availableHeight = (containerRef.current?.clientHeight || window.innerHeight * 0.75) - 60;

        let computedScale = 1.0;
        if (availableWidth > 100 && firstPageWidth > 0) {
          const widthRatio = availableWidth / firstPageWidth;
          const heightRatio = availableHeight > 200 ? availableHeight / firstPageHeight : widthRatio;
          // On mobile / tablet, prioritize fitting page width cleanly
          if (window.innerWidth < 768) {
            computedScale = Math.min(Math.max(widthRatio * 0.98, minScale), 1.2);
          } else {
            // On desktop, fit the entire first page height & width comfortably
            const fitAll = Math.min(widthRatio, heightRatio);
            computedScale = Math.min(Math.max(fitAll * 0.96, minScale), 1.3);
          }
        }
        setScale(Number(computedScale.toFixed(2)));
        setLoading(false);
      } catch (err) {
        if (!active) return;
        console.error('PdfViewer: Failed to parse PDF document:', err);
        setError('Failed to load PDF preview. The document may be damaged or unavailable.');
        setLoading(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
      // Cancel all active page render tasks
      Object.values(renderTasksRef.current).forEach((task) => {
        try {
          task?.cancel();
        } catch (_) {}
      });
      renderTasksRef.current = {};

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

  // Render a specific page onto its corresponding canvas
  const renderPage = useCallback(
    async (pageNumber) => {
      const doc = pdfDocRef.current;
      const canvas = canvasesRef.current[pageNumber];
      if (!doc || !canvas || pageNumber < 1 || pageNumber > doc.numPages) return;

      if (renderTasksRef.current[pageNumber]) {
        try {
          renderTasksRef.current[pageNumber].cancel();
        } catch (_) {}
        delete renderTasksRef.current[pageNumber];
      }

      try {
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
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
        renderTasksRef.current[pageNumber] = task;
        await task.promise;
        delete renderTasksRef.current[pageNumber];
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`PdfViewer: Page ${pageNumber} render failed:`, err);
        }
      }
    },
    [scale]
  );

  // Render all active pages whenever scale or document changes
  useEffect(() => {
    if (!loading && !error && pdfDocRef.current && numPages > 0) {
      for (let p = 1; p <= numPages; p++) {
        renderPage(p);
      }
    }
  }, [loading, error, numPages, scale, renderPage]);

  // Zoom helpers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(Number((prev + scaleStep).toFixed(2)), maxScale));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(Number((prev - scaleStep).toFixed(2)), minScale));
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  const handleFitWidth = () => {
    if (scrollAreaRef.current && pageDimensions[0]) {
      const containerWidth = scrollAreaRef.current.clientWidth - 48;
      const unscaledWidth = pageDimensions[0].width;
      if (containerWidth > 100 && unscaledWidth > 0) {
        const fitted = Math.min(Math.max(containerWidth / unscaledWidth, minScale), maxScale);
        setScale(Number(fitted.toFixed(2)));
      }
    }
  };

  const handleFitPage = () => {
    if (scrollAreaRef.current && pageDimensions[0]) {
      const containerWidth = scrollAreaRef.current.clientWidth - 48;
      const containerHeight = scrollAreaRef.current.clientHeight - 48;
      const unscaledWidth = pageDimensions[0].width;
      const unscaledHeight = pageDimensions[0].height;
      if (containerWidth > 100 && containerHeight > 100) {
        const wRatio = containerWidth / unscaledWidth;
        const hRatio = containerHeight / unscaledHeight;
        const fitted = Math.min(Math.max(Math.min(wRatio, hRatio), minScale), maxScale);
        setScale(Number(fitted.toFixed(2)));
      }
    }
  };

  // Jump to specific page
  const scrollToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
      setPageInput(String(pageNum));
      const pageEl = document.getElementById(`pdf-page-wrapper-${pageNum}`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      scrollToPage(currentPage + 1);
    }
  };

  const handlePageInputCommit = (e) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= numPages) {
      scrollToPage(p);
    } else {
      setPageInput(String(currentPage));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#1e232a] text-white overflow-hidden shadow-2xl h-full w-full ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'rounded-none'
      } ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 bg-slate-900 border-b border-slate-800 text-xs select-none shrink-0 z-10">
        {/* Left: Document info & Multi-page controls */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold truncate max-w-[150px] sm:max-w-xs">
            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate" title={fileName}>{fileName}</span>
          </div>

          {numPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700 shrink-0">
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
        <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700">
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
            Fit Width
          </button>

          <button
            type="button"
            onClick={handleFitPage}
            className="px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 rounded hidden sm:inline"
            title="Fit Entire Page"
          >
            Fit Page
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-xs text-xs"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
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

      {/* 2. Main Scrollable Canvas Viewing Area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-3 sm:p-6 bg-[#181c22] flex flex-col items-center justify-start relative select-none"
      >
        {loading ? (
          <div className="m-auto flex flex-col items-center justify-center space-y-3 py-16 text-slate-300">
            <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400">Rendering document preview...</p>
          </div>
        ) : error ? (
          <div className="m-auto max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-4 shadow-xl">
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
                <span>{downloadLabel}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="min-w-fit m-auto flex flex-col items-center space-y-6 py-2">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                id={`pdf-page-wrapper-${pageNum}`}
                className="relative shadow-2xl rounded-sm overflow-hidden bg-white mx-auto transition-transform"
              >
                <canvas
                  ref={(el) => {
                    canvasesRef.current[pageNum] = el;
                  }}
                  className="block"
                />
                {numPages > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono pointer-events-none backdrop-blur-xs">
                    Page {pageNum} of {numPages}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
