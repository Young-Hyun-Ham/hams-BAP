import { Chip as MuiChip, ChipProps } from '@mui/material';

export function Chip({
  label,
  backgroundColor,
  ...props
}: {
  label: string;
  backgroundColor: string;
} & ChipProps) {
  return (
    <MuiChip
      size="small"
      label={label}
      sx={{ backgroundColor, borderRadius: 2 }}
      {...props}
    />
  );
}
