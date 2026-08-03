'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Divider,
  InputBase,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Menu as MenuIcon,
  FitScreen as FitScreenIcon,
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';

import { COLORS } from '@/lib/constants/color';

// Import styles for react-pdf (optional but recommended for text selection)
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker from local pdfjs-dist library (using legacy build for better compatibility)
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PdfViewerProps {
  url: string;
  highlights?: any[];
  style?: 'fill' | 'outline' | 'modern';
  minWidth?: string | number;
}

export default function PdfViewer({
  url,
  highlights = [],
  style = 'modern',
  minWidth = 450,
}: PdfViewerProps) {
  const initialPage =
    highlights && highlights.length > 0 && Number(highlights[0].page) > 0
      ? Number(highlights[0].page)
      : 1;

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const [showSidebar, setShowSidebar] = useState(false);
  const [pageData, setPageData] = useState<{
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
  } | null>(null);
  const [pageInput, setPageInput] = useState<string>(initialPage.toString());
  const [prevCurrentPage, setPrevCurrentPage] = useState(initialPage);
  const [prevHighlights, setPrevHighlights] = useState(highlights);

  if (currentPage !== prevCurrentPage) {
    setPrevCurrentPage(currentPage);
    setPageInput(currentPage.toString());
    setPageData(null);
  }

  if (highlights !== prevHighlights) {
    setPrevHighlights(highlights);
    if (highlights && highlights.length > 0) {
      const firstPage = Number(highlights[0].page);
      if (firstPage && firstPage > 0) {
        if (currentPage !== firstPage) {
          setCurrentPage(firstPage);
        }
      }
    }
  }

  const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const p = parseInt(pageInput);
      if (!isNaN(p) && p >= 1 && p <= numPages) {
        setCurrentPage(p);
      } else {
        setPageInput(currentPage.toString());
      }
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error('Error loading PDF:', err);
    setError('Failed to load PDF file.');
    setLoading(false);
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          // Maximize width, with a tiny 2px safety margin to prevent rounding-related scrollbars
          setContainerWidth(width - 2);
        }
      }
    };

    const observer = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return;
        const width = entries[0].contentRect.width;
        if (width > 0) {
          setContainerWidth(width - 2);
        }
      });
    });

    observer.observe(containerRef.current);

    // Initial measurement
    updateWidth();

    // Safety check after a short delay to handle transitions/modals opening
    const timer = setTimeout(updateWidth, 150);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [showSidebar, loading]);

  const scrollToHighlight = (pageInfo?: {
    width: number;
    originalWidth: number;
  }) => {
    const data = pageInfo || pageData;
    if (
      !highlights ||
      highlights.length === 0 ||
      !data ||
      !containerRef.current
    )
      return;

    // Find the first highlight for the current page
    const relevantHl =
      highlights.find((hl) => Number(hl.page) === currentPage) || highlights[0];
    const target = relevantHl.bbox || relevantHl;
    const y = target.top ?? target.y ?? 0;
    const currentScale = data.width / data.originalWidth;

    const containerHeight = containerRef.current.clientHeight;
    const hlHeight = (target.height || 0) * currentScale;
    const absoluteTop = y * currentScale;
    const targetScroll = absoluteTop - containerHeight / 2 + hlHeight / 2;

    containerRef.current.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth',
    });
  };

  // Auto-navigate to page and scroll if highlights change
  useEffect(() => {
    if (highlights && highlights.length > 0) {
      const firstPage = Number(highlights[0].page);
      if (firstPage && firstPage > 0) {
        if (currentPage === firstPage) {
          // If already on page and page metadata is ready, scroll immediately
          if (pageData) {
            scrollToHighlight();
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlights, pageData]);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        '& .pdf-document-container': {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        },
        '& .pdf-viewer-toolbar': {
          display: 'flex !important',
          alignItems: 'center !important',
          justifyContent: 'space-between !important',
          padding: '4px 8px !important',
          width: '100% !important',
          maxWidth: '100% !important',
          minWidth: '0 !important',
          borderRadius: '0 !important',
          borderBottom: '1px solid #cfd8dc !important',
          backgroundColor: '#ffffff !important',
          zIndex: '2 !important',
          overflowX: 'auto !important',
          whiteSpace: 'nowrap !important',
          boxSizing: 'border-box !important',
          '&::-webkit-scrollbar': { height: '3px' },
        },
      }}
    >
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              bgcolor: '#f0f2f7',
            }}
          >
            <CircularProgress size={32} />
          </Box>
        }
        className="pdf-document-container"
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
          }}
        >
          {/* Controls */}
          <Paper elevation={0} className="pdf-viewer-toolbar">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                onClick={() => setShowSidebar(!showSidebar)}
                color={showSidebar ? 'primary' : 'default'}
                size="small"
                title="Toggle Sidebar"
              >
                <MenuIcon fontSize="small" />
              </IconButton>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, height: 20, my: 'auto' }}
              />

              <IconButton
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                size="small"
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mx: 0.5,
                }}
              >
                <InputBase
                  value={pageInput}
                  onChange={handlePageChange}
                  onKeyDown={handlePageSubmit}
                  onBlur={() => setPageInput(currentPage.toString())}
                  sx={{
                    width: 35,
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    bgcolor: COLORS.blueGrey[50],
                    borderRadius: 1,
                    '& input': { textAlign: 'center', p: 0 },
                  }}
                />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                >
                  / {numPages || '-'}
                </Typography>
              </Box>

              <IconButton
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages || loading}
                size="small"
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                disabled={loading}
                size="small"
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ minWidth: 36, textAlign: 'center' }}
              >
                {Math.round(zoom * 100)}%
              </Typography>
              <IconButton
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                disabled={loading}
                size="small"
              >
                <AddIcon fontSize="small" />
              </IconButton>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, height: 20, my: 'auto' }}
              />

              <IconButton
                onClick={() => setZoom(1.0)}
                disabled={loading || zoom === 1.0}
                size="small"
                title="Fit View"
              >
                <FitScreenIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>

          <Box
            sx={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              width: '100%',
              minHeight: 0,
            }}
          >
            {/* Sidebar - Thumbnails */}
            {showSidebar && !error && (
              <Box
                sx={{
                  width: 200,
                  borderRight: '1px solid',
                  borderColor: COLORS.blueGrey[100],
                  bgcolor: COLORS.grey[100],
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                }}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Box key={`thumb_${index + 1}`} sx={{ textAlign: 'center' }}>
                    <Paper
                      elevation={currentPage === index + 1 ? 4 : 1}
                      onClick={() => setCurrentPage(index + 1)}
                      sx={{
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor:
                          currentPage === index + 1
                            ? COLORS.primary.main
                            : 'transparent',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        mb: 0.5,
                      }}
                    >
                      <Page
                        pageNumber={index + 1}
                        width={140}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Paper>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 600 }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Main Viewer */}
            <Box
              ref={containerRef}
              sx={{
                flex: 1,
                minWidth,
                minHeight: 0,
                overflow: 'auto',
                overflowX: zoom > 1.01 ? 'auto' : 'hidden', // Force hide horizontal scrollbar at 100% zoom
                scrollbarGutter: 'stable', // Prevent layout shift when scrollbar appears/disappears
                position: 'relative',
                bgcolor: '#f0f2f7',
              }}
            >
              {error ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                  }}
                >
                  <Typography color="error">{error}</Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 0,
                    py: 0, // Removed vertical padding as requested
                    width: '100%',
                    minHeight: '100%', // Prevent container collapse during page transitions
                    minWidth: zoom > 1.01 ? containerWidth * zoom : '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: zoom > 1.01 ? 'flex-start' : 'center',
                    '& .pdf-page-render': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Subtler shadow for edge-to-edge view
                      borderRadius: '2px',
                      flexShrink: 0,
                    },
                  }}
                >
                  {containerWidth > 0 && (
                    <Page
                      pageNumber={currentPage}
                      width={containerWidth * zoom}
                      className="pdf-page-render"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onLoadSuccess={(page) => {
                        setPageData({
                          width: page.width,
                          height: page.height,
                          originalWidth: page.originalWidth,
                          originalHeight: page.originalHeight,
                        });
                      }}
                    >
                      {pageData && (
                        <div
                          style={{
                            pointerEvents: 'none',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: pageData.width,
                            height: pageData.height,
                          }}
                        >
                          {highlights
                            .filter((hl) => hl.page === currentPage)
                            .map((hl, idx) => {
                              const target = hl.bbox || hl;
                              const x = target.left ?? target.x;
                              const y = target.top ?? target.y;
                              const width = target.width;
                              const height = target.height;

                              if (
                                typeof x === 'undefined' ||
                                typeof y === 'undefined'
                              )
                                return null;

                              const marginX = style === 'modern' ? 4 : 0;
                              const marginY = style === 'modern' ? 2 : 0;
                              const currentScale =
                                pageData.width / pageData.originalWidth;

                              return (
                                <Box
                                  key={idx}
                                  sx={{
                                    position: 'absolute',
                                    left: (x - marginX) * currentScale,
                                    top: (y - marginY) * currentScale,
                                    width: (width + marginX * 2) * currentScale,
                                    height:
                                      (height + marginY * 2) * currentScale,
                                    zIndex: 10,
                                    animation:
                                      'highlightPulse 2s ease-in-out infinite',
                                    '@keyframes highlightPulse': {
                                      '0%': {
                                        opacity: 0.7,
                                        transform: 'scale(1)',
                                      },
                                      '50%': {
                                        opacity: 1,
                                        transform: 'scale(1.02)',
                                      },
                                      '100%': {
                                        opacity: 0.7,
                                        transform: 'scale(1)',
                                      },
                                    },
                                    ...(style === 'modern'
                                      ? {
                                          backgroundColor:
                                            'rgba(255, 251, 235, 0.8)',
                                          mixBlendMode: 'multiply',
                                          border:
                                            '1px solid rgba(251, 191, 36, 0.3)',
                                          borderLeft: `${Math.max(4, 4 * currentScale)}px solid #f97316`,
                                          borderRadius: '4px',
                                          boxShadow:
                                            '0 2px 8px rgba(249, 115, 22, 0.2)',
                                        }
                                      : {
                                          backgroundColor:
                                            style === 'fill'
                                              ? 'rgba(255, 255, 0, 0.4)'
                                              : 'transparent',
                                          border:
                                            style === 'outline'
                                              ? '2px solid #ef4444'
                                              : '1px solid rgba(255, 200, 0, 0.8)',
                                          boxShadow:
                                            style === 'outline'
                                              ? '0 0 10px rgba(239, 68, 68, 0.3)'
                                              : 'none',
                                          borderRadius: '2px',
                                        }),
                                  }}
                                />
                              );
                            })}
                        </div>
                      )}
                    </Page>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Document>
    </Box>
  );
}
