import { Box, Typography } from '@mui/material';

import { ActiveChip } from './StatusChip';

const ActiveBadgeRenderer = (params: any) => {
  const isActive = params.value;

  return (
    <Box
      sx={{
        px: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <ActiveChip active={isActive} />
      {/* Only show the dropdown arrow if the column is editable */}
      {(typeof params.colDef?.editable === 'function'
        ? params.colDef.editable(params)
        : params.colDef?.editable) && (
        <Typography fontSize={10} color="text.secondary">
          ▼
        </Typography>
      )}
    </Box>
  );
};

export default ActiveBadgeRenderer;
