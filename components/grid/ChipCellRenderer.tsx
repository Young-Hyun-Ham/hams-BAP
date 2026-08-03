import { alpha, Box, Chip } from '@mui/material';
import { ICellRendererParams } from 'ag-grid-community';
import CircleIcon from '@mui/icons-material/Circle';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';

import { COLORS } from '@/lib/theme';

interface ChipConfig {
  column?: string;
}

const getChipColors = (column: string, rawCode: string) => {
  if (column === 'dmn_tag_id') {
    return { bgcolor: COLORS.grey[200], color: COLORS.grey[700] };
  }
  if (column == 'cand_tp_nm') {
    return { bgcolor: '#E3F2FD', color: '#1565C0' };
  }
  if (column === 'act_tp_cd') {
    switch (rawCode) {
      case 'C':
        return {
          bgcolor: alpha(COLORS.success.light, 0.3),
          color: COLORS.success.dark,
        };
      case 'U':
        return {
          bgcolor: alpha(COLORS.warning.light, 0.3),
          color: COLORS.warning.dark,
        };
      case 'D':
        return {
          bgcolor: alpha(COLORS.error.light, 0.3),
          color: COLORS.error.dark,
        };
    }
  }
  if (column === 'tag_tp_cd' || column === 'dic_tp_cd') {
    // STD = grey, others = purple
    return rawCode === 'STD'
      ? { bgcolor: COLORS.grey[200], color: COLORS.grey[700] }
      : { bgcolor: alpha('#7C4DFF', 0.12), color: '#5E35B1' };
  }
  return { bgcolor: COLORS.grey[200], color: COLORS.grey[700] };
};

const ChangeTypeIcon = ({
  type,
  iconColor,
}: {
  type: string;
  iconColor: string;
}) => {
  switch (type) {
    case 'C':
      return <CircleIcon sx={{ color: iconColor, fontSize: 16 }} />;
    case 'U':
      return <BuildIcon sx={{ color: iconColor, fontSize: 16 }} />;
    case 'D':
      return <CloseIcon sx={{ color: iconColor, fontSize: 16 }} />;
    default:
      return null;
  }
};

export default function ChipCellRenderer(
  params: ICellRendererParams & { chipConfig?: ChipConfig },
) {
  const value = params.value; // label (mapped by valueGetter)
  const column = params.chipConfig?.column ?? '';
  if (!value) return null;

  // Use raw code from params.data for color logic
  const rawCode = column ? (params.data?.[column] ?? value) : value;
  const { bgcolor, color } = getChipColors(column, rawCode);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Chip
        {...(column === 'act_tp_cd' && {
          avatar: <ChangeTypeIcon type={rawCode} iconColor={color} />,
        })}
        label={value}
        size="small"
        sx={{
          fontWeight: 600,
          bgcolor,
          color,
          borderRadius: column === 'dmn_tag_id' ? '4px' : '12px',
          height: '22px',
          fontSize: '0.72rem',
          border: 'none',
          p: 1,
        }}
      />
    </Box>
  );
}
