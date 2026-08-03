import React from 'react';
import { CustomCellRendererProps } from 'ag-grid-react';
import { Box, Chip, Typography } from '@mui/material';

import { SelectOption } from './SelectBoxCellEditor';

export interface SelectBoxCellRendererParams extends CustomCellRendererProps {
  options?: SelectOption[];
}

export default function SelectBoxCellRenderer(
  params: SelectBoxCellRendererParams,
) {
  const { value, options } = params;

  // Find label for the current value
  const selectedOption = options?.find((opt) => opt.value === value);
  // Use valueFormatted (from refData) or lookup in options or fallback to value
  const displayValue =
    params.valueFormatted ?? (selectedOption ? selectedOption.label : value);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        cursor: 'pointer', // Suggests interactivity
        px: 1, // Add padding to match Editor
      }}
    >
      <span
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flexGrow: 1,
          color: !value && value !== 0 ? '#aaa' : 'inherit', // Gray out placeholder
        }}
      >
        {!value && value !== 0 ? 'Not selected' : displayValue}
      </span>
      <Typography fontSize={10} color="text.secondary">
        ▼
      </Typography>
    </Box>
  );
}
