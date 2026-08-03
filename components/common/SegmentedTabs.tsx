'use client';

import { Tab, Tabs } from '@mui/material';
import { COLORS } from '@/lib/constants/color';

export type SegmentedTabItem = {
  value: string;
  label: string;
};

export type SegmentedTabsProps = {
  value: string;
  onChange: (value: string) => void;
  items: SegmentedTabItem[];
  ariaLabel?: string;
};

export default function SegmentedTabs({
  value,
  onChange,
  items,
  ariaLabel,
}: SegmentedTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, v) => onChange(v)}
      aria-label={ariaLabel}
      variant="fullWidth"
      sx={{
        minHeight: 36,
        bgcolor: COLORS.grey[100],
        borderRadius: 2,
        '& .MuiTab-root': {
          minHeight: 36,
          transition: 'color 200ms ease',
          position: 'relative',
          lineHeight: 1,
          zIndex: 1,
        },
        '& .MuiTabs-indicator': {
          height: 'calc(100% - 8px)',
          top: 4,
          bottom: 'auto',
          backgroundColor: 'white',
          borderRadius: 2,
          boxShadow: '0 0 4px 0 rgba(23, 28, 60, 0.48)',
          transition: 'left 240ms ease, width 240ms ease',
          zIndex: 0,
          pointerEvents: 'none',
        },
      }}
    >
      {items.map((item) => (
        <Tab
          key={item.value}
          value={item.value}
          label={item.label}
          sx={{
            m: 0.5,
            p: '6px 10px',
            textTransform: 'none',
            '&.Mui-selected': {
              color: 'text.primary',
              backgroundColor: 'transparent',
              borderRadius: 2,
              m: 0.5,
              boxShadow: 'none',
            },
          }}
          disableRipple
        />
      ))}
    </Tabs>
  );
}
