import { Box, Typography } from '@mui/material';
import React from 'react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTranslation } from 'react-i18next';

export function CustomNoRowsOverlay({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'text.secondary',
      }}
    >
      <DescriptionOutlinedIcon
        sx={{ fontSize: 40, mb: 1.5, color: '#DDE4EA' }}
      />
      <Typography variant="body1" sx={{ color: '#DDE4EA' }}>
        {message || t('No Rows To Show')}
      </Typography>
    </Box>
  );
}
