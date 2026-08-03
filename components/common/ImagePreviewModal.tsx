'use client';

import {
  Box,
  IconButton,
  Typography,
  Modal,
  CircularProgress,
} from '@mui/material';
import { Close, Image as ImageIcon } from '@mui/icons-material';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { COLORS } from '@/lib/constants/color';

function extractFileNameFromUrl(url: string): string {
  try {
    if (!url) return '';
    if (url.startsWith('data:')) return 'image';
    const u = new URL(
      url,
      typeof window !== 'undefined' ? window.location.href : undefined,
    );
    const pathname = u.pathname || '';
    const last = pathname.split('/').filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {
    // Fallback for relative or invalid URLs
  }
  try {
    const clean = url.split('?#')[0].split('#')[0].split('?')[0];
    const last = clean.split('/').filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {
    // ignore
  }
  return 'image';
}

export type ImagePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  url: string;
  index: number;
  ariaLabelledbyId: string;
  fileName?: string;
};

export function ImagePreviewModal({
  open,
  onClose,
  url,
  index,
  ariaLabelledbyId,
  fileName,
}: ImagePreviewModalProps) {
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);

  const displayedFileName = useMemo(
    () => fileName ?? extractFileNameFromUrl(url),
    [fileName, url],
  );

  const { displayWidth, displayHeight } = useMemo(() => {
    if (
      typeof window === 'undefined' ||
      naturalWidth == null ||
      naturalHeight == null
    ) {
      return { displayWidth: 0, displayHeight: 0 };
    }
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;
    const scale = Math.min(
      1,
      maxWidth / naturalWidth,
      maxHeight / naturalHeight,
    );
    return {
      displayWidth: Math.round(naturalWidth * scale),
      displayHeight: Math.round(naturalHeight * scale),
    };
  }, [naturalWidth, naturalHeight]);

  useEffect(() => {
    if (
      open &&
      (naturalWidth == null || naturalHeight == null) &&
      typeof window !== 'undefined'
    ) {
      const preload = new window.Image();
      preload.src = url;
      preload.onload = () => {
        setNaturalWidth(preload.naturalWidth);
        setNaturalHeight(preload.naturalHeight);
      };
    }
  }, [open, naturalWidth, naturalHeight, url]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby={ariaLabelledbyId}
      sx={{
        '& .MuiModal-backdrop': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
      }}
    >
      <Box>
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 1301,
          }}
        >
          <IconButton
            aria-label="Close preview"
            onClick={onClose}
            sx={{ color: COLORS.common.white, p: 1 }}
          >
            <Close />
          </IconButton>
          <ImageIcon sx={{ color: COLORS.error.main }} />
          <Typography
            fontSize={13}
            noWrap
            sx={{ color: COLORS.common.white, maxWidth: '60vw' }}
          >
            {displayedFileName}
          </Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {displayWidth > 0 && displayHeight > 0 ? (
            <Image
              src={url}
              alt={`attachment-preview-${index}-full`}
              width={displayWidth}
              height={displayHeight}
              style={{ display: 'block', borderRadius: 4 }}
              unoptimized
            />
          ) : (
            <Box
              sx={{
                width: '80vw',
                maxWidth: '80vw',
                maxHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={28} />
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
