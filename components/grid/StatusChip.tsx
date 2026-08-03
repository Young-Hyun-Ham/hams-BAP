import { Chip } from '@mui/material';

export interface ActiveChipProps {
  active: string;
}

export function ActiveChip({ active }: ActiveChipProps) {
  const isActive = active === 'Y';
  return (
    <Chip
      label={isActive ? 'Active' : 'Inactive'}
      size="small"
      sx={{
        minWidth: 70,
        height: 24,
        px: 0.5,
        fontWeight: 500,
        fontSize: 13,
        // Keeping 999px for capsule as per image.
        borderRadius: '999px',
        bgcolor: isActive ? '#B9F6CA' : '#FECDD2',
        color: isActive ? '#000000DE' : '#D32F2F',
        border: 'none',
        '& .MuiChip-label': {
          px: 1,
          display: 'block', // Fix for flex centering issues sometimes
          lineHeight: '24px', // Match height for vertical centering
        },
      }}
    />
  );
}
