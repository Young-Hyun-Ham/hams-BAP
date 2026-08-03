import React from 'react';
import { CustomCellRendererProps } from 'ag-grid-react';
import { Box, Typography } from '@mui/material';

export default function RangeCellRenderer(params: CustomCellRendererProps) {
  const { value } = params;

  // Handle non-object values or null/undefined
  if (!value || typeof value !== 'object') {
    return (
      <Box sx={{ px: 1, color: 'text.secondary', fontStyle: 'italic' }}>~</Box>
    );
  }

  const { from_val, to_val } = value;

  // Format display
  let display = '';
  if (from_val == null && to_val == null) {
    display = '';
  } else if (from_val != null && to_val == null) {
    display = `${from_val} ~ ...`;
  } else if (from_val == null && to_val != null) {
    display = `... ~ ${to_val}`;
  } else {
    display = `${from_val} ~ ${to_val}`;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        px: 1,
        gap: 1,
      }}
    >
      <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
        {display}
      </Typography>
    </Box>
  );
}
