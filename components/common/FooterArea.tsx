import React, { useEffect, useState } from 'react';
import { Box, IconButton, Portal, Stack, Typography } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import { COLORS } from '@/lib/constants/color';

interface FooterAreaProps {
  children?: React.ReactNode;
  updateTimestamp?: React.MutableRefObject<(value?: string | null) => void>;
}

function formatDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const FooterArea: React.FC<FooterAreaProps> = ({
  children,
  updateTimestamp,
}) => {
  const [displayText, setDisplayText] = useState<string | null>(null);

  const internalUpdateTimestamp = (value?: string | null) => {
    if (value === null) {
      setDisplayText(null);
    } else {
      setDisplayText(value ?? formatDate(new Date()));
    }
  };

  // expose internal function to parent
  useEffect(() => {
    if (!updateTimestamp) return;
    updateTimestamp.current = internalUpdateTimestamp;
  }, [updateTimestamp]);

  return (
    <Portal container={() => document.getElementById('knowledge-footer')}>
      <Box
        display="flex"
        height={'46px'}
        justifyContent="space-between"
        gap={1}
        bgcolor="white"
        px={2}
        py={1}
        borderTop={1}
        borderColor={COLORS.blueGrey[100]}
        sx={{
          '& .MuiButton-root': {
            px: '12px',
            py: '4px',
            fontWeight: 500,
            fontSize: '13px',
          },
        }}
      >
        {/* Left content */}
        <Stack direction="row" spacing={1} alignItems="center">
          {displayText && (
            <>
              <RestartAltIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {displayText}
              </Typography>
            </>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          {children}
        </Stack>
      </Box>
    </Portal>
  );
};

export default FooterArea;
