import { Box, Button, IconButton } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { ReactNode, FormEventHandler } from 'react';

import { useTranslation } from 'react-i18next';
import { COLORS } from '@/lib/constants/color';

interface SearchAreaProps {
  children: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onReset?: () => void;

  px?: number; // outer horizontal padding
  gap?: number; // gap between inputs
}

export function SearchArea({
  children,
  onSubmit,
  onReset,
  px = 0,
  gap = 1, // 8px (design spec)
}: SearchAreaProps) {
  const { t } = useTranslation();
  return (
    <Box px={px}>
      <Box
        border={1}
        borderColor={COLORS.blueGrey[100]}
        borderRadius={2}
        p={1.5} // 12px inner padding
        mb={1}
      >
        <Box
          component="form"
          onSubmit={onSubmit}
          display="flex"
          flexWrap="wrap" // 🔑 multi-line support
          alignItems="flex-end" // 🔑 correct vertical alignment
          gap={gap}
        >
          {/* SEARCH INPUT AREA (Fill / Wrap) */}
          <Box display="flex" flexWrap="wrap" gap={gap} flex={1} minWidth={0}>
            {children}
          </Box>

          {/* ACTION AREA (Hug) */}
          <Box display="flex" gap={gap} flexShrink={0} alignItems="center">
            {onReset && (
              <IconButton
                size="small"
                onClick={onReset}
                sx={{
                  width: 32,
                  height: 32,
                  border: 1,
                  borderColor: COLORS.blueGrey[100],
                  borderRadius: '50%',
                }}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            )}

            <Button
              type="submit"
              variant="contained"
              size="small"
              sx={{ height: 32 }}
            >
              {t('Search')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
