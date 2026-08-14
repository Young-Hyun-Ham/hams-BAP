import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Node } from '@xyflow/react';
import dynamic from 'next/dynamic';

import styles from '../SideBar.module.css';
import { useGraphStore } from '../store/useGraphStore';

const PdfViewer = dynamic(() => import('@/components/common/PdfViewer'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={32} />
    </Box>
  ),
});

interface SourceDocumentsTabProps {
  selectedNode?: Node | null;
}

/**
 * "Source Documents" tab: auto-loads PDF viewer and chunk highlight
 * when the selected node has docuFilId and chnkId in its data.
 *
 * Flow:
 *   Node selected → check node.data.docu_fil_id & node.data.chnk_id
 *     → YES: call getDocViewerUrlByDocuFilId + getChunkInfoByChnkId in parallel
 *            → show PDF at chunk position with highlights
 *     → NO:  show empty state
 */
const SourceDocumentsTab = ({ selectedNode }: SourceDocumentsTabProps) => {
  const { t } = useTranslation();

  // Local state for document and chunk details
  const [docViewerUrl, setDocViewerUrl] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<any>(null);
  const [docLoading, setDocLoading] = useState<boolean>(false);

  // ─── Auto-load doc & chunk when node changes ──────────────
  const nodeData = selectedNode?.data || {};
  const docuFilId = nodeData.docu_fil_id as string | undefined;
  const isL3OrL4 = selectedNode?.type === 'L3' || selectedNode?.type === 'L4';
  const chnkId = isL3OrL4 ? '' : (nodeData.chnk_id as string | undefined);
  const elemId = isL3OrL4 ? (nodeData.node_id as string) || '' : '';

  // Effect 1: Load PDF URL (Only runs when docuFilId changes)
  useEffect(() => {
    let cancelled = false;

    const loadDoc = async () => {
      if (!docuFilId) {
        setDocViewerUrl(null);
        setDocLoading(false);
        return;
      }

      const cachedDocUrl = useGraphStore
        .getState()
        .docViewerUrlCache.get(docuFilId);
      if (cachedDocUrl !== undefined) {
        setDocViewerUrl(cachedDocUrl || null);
        setDocLoading(false);
        return;
      }

      setDocLoading(true);
      setDocViewerUrl(null);

      try {
        // const docRes = await chunkService.getDocViewerUrlByDocuFilId(docuFilId);
        const docRes: any = {};
        if (cancelled) return;

        if (docRes?.access_url) {
          useGraphStore
            .getState()
            .setDocViewerUrlCache(docuFilId, docRes.access_url);
          setDocViewerUrl(docRes.access_url);
        } else {
          useGraphStore.getState().setDocViewerUrlCache(docuFilId, '');
          setDocViewerUrl(null);
        }
      } catch (error) {
        console.error('Failed to load document info:', error);
        if (!cancelled) {
          useGraphStore.getState().setDocViewerUrlCache(docuFilId, '');
          setDocViewerUrl(null);
        }
      } finally {
        if (!cancelled) {
          setDocLoading(false);
        }
      }
    };

    loadDoc();

    return () => {
      cancelled = true;
    };
  }, [docuFilId]);

  // Effect 2: Load Chunk Info (Only runs when valid IDs exist)
  useEffect(() => {
    let cancelled = false;

    const loadChunk = async () => {
      if (!docuFilId || (!chnkId && !elemId)) {
        setSelectedChunk(null);
        return;
      }

      const cacheKey = `${docuFilId}_${chnkId || ''}_${elemId || ''}`;
      const cachedChunk = useGraphStore.getState().chunkBboxCache.get(cacheKey);
      if (cachedChunk !== undefined) {
        setSelectedChunk(cachedChunk);
        return;
      }

      try {
        // const chunkRes = await graphService.getChunkBboxInfo(
        //   docuFilId,
        //   chnkId,
        //   elemId,
        // );
        const chunkRes: any = {};
        if (cancelled) return;

        if (Array.isArray(chunkRes) && chunkRes.length > 0) {
          const bboxes = chunkRes.map((item) => {
            const page = parseInt(item.page_nr, 10) || 1;
            const left = parseFloat(item.pos_lft_val) || 0;
            const top = parseFloat(item.pos_top_val) || 0;
            const right = parseFloat(item.pos_rgt_val) || 0;
            const bottom = parseFloat(item.pos_bttm_val) || 0;

            return {
              page,
              left,
              top,
              width: right - left,
              height: bottom - top,
            };
          });
          const chunkData = { bboxes };
          useGraphStore.getState().setChunkBboxCache(cacheKey, chunkData);
          setSelectedChunk(chunkData);
        } else {
          const emptyChunkData = { bboxes: [] };
          useGraphStore.getState().setChunkBboxCache(cacheKey, emptyChunkData);
          setSelectedChunk(emptyChunkData);
        }
      } catch (error) {
        console.error('Failed to load chunk info:', error);
        if (!cancelled) {
          const emptyChunkData = { bboxes: [] };
          useGraphStore.getState().setChunkBboxCache(cacheKey, emptyChunkData);
          setSelectedChunk(emptyChunkData);
        }
      }
    };

    loadChunk();

    return () => {
      cancelled = true;
    };
  }, [docuFilId, chnkId, elemId]);

  // ─── Derived data ─────────────────────────────────────────
  const hasDocChunk = !!(docuFilId && (chnkId || elemId));
  // const chunkInfo: ChunkInfoRes | null = selectedChunk?.chunkInfo || null;

  // ─── Render ───────────────────────────────────────────────

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Chunk Info Header */}
      {/* {chunkInfo && !docLoading && (
        <Box
          sx={{
            p: '10px 12px',
            borderBottom: '1px solid #e5e7eb',
            bgcolor: '#fafafe',
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              mb: 0.5,
            }}
          >
            {t('Chunk Information')}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: '#22223b',
              lineHeight: 1.4,
              mb: 0.5,
            }}
          >
            {chunkInfo.chnk_ti_cntn}
          </Typography>
          {chunkInfo.page_no && (
            <Typography
              variant="caption"
              sx={{
                color: '#6366f1',
                fontWeight: 700,
                fontSize: '9px',
                fontFamily: 'IBM Plex Mono',
                mr: 1,
              }}
            >
              {t('Page')} {chunkInfo.page_no}
            </Typography>
          )}
          {chunkInfo.chnk_txt_val && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '11px',
                color: '#64748b',
                lineHeight: 1.4,
                mt: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {chunkInfo.chnk_txt_val}
            </Typography>
          )}
        </Box>
      )} */}

      {/* PDF Viewer Segment */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          bgcolor: '#f0f2f7',
          position: 'relative',
        }}
      >
        {docLoading ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : docViewerUrl ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <PdfViewer
              url={docViewerUrl}
              highlights={selectedChunk?.bboxes || []}
              minWidth={0}
            />
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            p={3}
            sx={{ textAlign: 'center' }}
          >
            <Typography variant="body2" color="text.secondary">
              {hasDocChunk
                ? t('Failed to load document. Please try again.')
                : t('This node has no linked document.')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SourceDocumentsTab;
