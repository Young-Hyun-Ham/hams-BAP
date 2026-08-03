'use client';

import { forwardRef, useMemo } from 'react';
import {
  Box,
  Chip,
  MenuItem,
  Select,
  SelectProps,
  Checkbox,
  Divider,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import { lighten, SxProps } from '@mui/system';
import { Close } from '@mui/icons-material';

import type { Theme } from '@mui/material/styles';
import { COLORS } from '@/lib/constants/color';

/* ================= Types ================= */

export interface MultiSelectWithLabelOption {
  label: string;
  value: string;
  code?: string;
  chipColor?: {
    bg: string;
    color: string;
  };
}

export interface MultiSelectWithLabelProps extends Omit<
  SelectProps<string[]>,
  'size' | 'multiple' | 'value' | 'onChange'
> {
  label: string;
  size?: 'small' | 'medium';
  options: MultiSelectWithLabelOption[];
  value: string;
  onChange?: (event: { target: { name: string; value: string } }) => void;
  sx?: SxProps<Theme>;
  hasCode?: 'Y' | 'N';
  isChip?: 'Y' | 'N';
  showLabelWithChip?: 'Y' | 'N';
  requiredAtLeastOne?: boolean;
}

/* ================= Component ================= */

const MultiSelectWithLabel = forwardRef<
  HTMLDivElement,
  MultiSelectWithLabelProps
>(function MultiSelectWithLabel(
  {
    label,
    size = 'medium',
    options,
    value = '',
    name = '',
    onChange,
    sx,
    hasCode = 'N',
    isChip = 'N',
    showLabelWithChip = 'N', // Default to 'N' (hide label)
    requiredAtLeastOne = false,
    // ...props,
    ...rest
  },
  ref,
) {
  const ALL_VALUE = 'all';
  const { onChange: formOnChange, ...props } = rest as any;
  const allOptions = options.filter((o) => o.value !== ALL_VALUE);
  const isAllSelected = value === ALL_VALUE;

  const internalValue = useMemo(() => {
    if (value === ALL_VALUE) {
      return allOptions.map((opt) => opt.value);
    }
    if (typeof value === 'string') {
      return value ? value.split(',') : [];
    }
    if (Array.isArray(value)) {
      return value;
    }

    return [];
  }, [value, allOptions]);
  /* ---------- Handlers ---------- */
  const handleChange = (selected: string[]) => {
    let finalValue: string;
    if (selected.includes(ALL_VALUE)) {
      // If currently All -> User wants to deselect all.
      // If requiredAtLeastOne is true, fallback to the first option instead of empty string.
      if (isAllSelected) {
        if (requiredAtLeastOne && allOptions.length > 0) {
          finalValue = allOptions[0].value;
        } else {
          finalValue = '';
        }
      } else {
        // If not currently All -> Select everything
        finalValue = ALL_VALUE;
      }
    } else {
      if (selected.length === allOptions.length && allOptions.length > 0) {
        finalValue = ALL_VALUE;
      } else {
        finalValue = selected.join(',');
      }
    }
    // Mandatory Selection Logic: If requiredAtLeastOne is true and result is empty, block the update
    if (requiredAtLeastOne && finalValue === '') {
      return;
    }

    const customEvent = { target: { name, value: finalValue } };
    if (onChange) onChange(customEvent);
    if (formOnChange) formOnChange(customEvent);
  };
  // remove chip option
  const handleDeleteMapping = (deletedId: string) => {
    let newValue: string = '';

    if (value === ALL_VALUE) {
      // If 'all' is selected, removing one item means we list all others
      newValue = allOptions
        .filter((opt) => opt.value !== deletedId)
        .map((opt) => opt.value)
        .join(',');
    } else {
      // Remove the specific ID from the comma-separated string
      const currentArray = value.split(',');
      const newArray = currentArray.filter((id) => id !== deletedId);
      newValue = newArray.join(',');
    }

    // Mandatory check: fallback to first item if empty and required
    if (requiredAtLeastOne && newValue === '') {
      if (allOptions.length > 0) newValue = allOptions[0].value;
    }

    // Trigger the update
    const customEvent = { target: { name, value: newValue } };
    if (onChange) onChange(customEvent);
    if (formOnChange) formOnChange(customEvent);
  };

  /* ---------- Render Code Chip ---------- */
  const renderCodePill = (
    text?: string,
    chipColor?: { bg: string; color: string },
    deleteValue?: string, // New parameter to handle deletion
  ) => {
    if (!text || isChip === 'N') return null;

    return (
      <Chip
        label={text}
        size="small"
        deleteIcon={
          <Close style={{ fontSize: size === 'small' ? '12px' : '13px' }} />
        }
        // Show delete icon only if deleteValue is provided
        onDelete={
          deleteValue ? () => handleDeleteMapping(deleteValue) : undefined
        }
        // Prevent Select menu from opening when clicking delete icon
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          height: size === 'small' ? 16 : 24,
          borderRadius: 9999,
          px: 0.5,
          py: 1,
          fontWeight: 500,
          fontSize: size === 'small' ? '12px' : '13px',
          bgcolor: chipColor
            ? chipColor.bg
            : (t) => lighten(t.palette.info.light, 0.35),
          color: chipColor
            ? chipColor.color
            : (t) => t.palette.getContrastText(t.palette.info.light),
        }}
      />
    );
  };

  /* ---------- Render Selected Value ---------- */
  const renderValue = (selected: string[]) => {
    if (
      !value ||
      value === '' ||
      value === ALL_VALUE ||
      selected.length === 0
    ) {
      return <Box component="span">All</Box>;
    }

    if (isChip === 'N') {
      const labelString = allOptions
        .filter((o) => selected.includes(o.value))
        .map((opt) => opt.label)
        .join(', ');

      return (
        <Typography
          sx={{
            fontSize: '13px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {labelString}
        </Typography>
      );
    }

    return (
      <Box
        display="flex"
        gap={0.5}
        // flexWrap="wrap"
        sx={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {allOptions
          .filter((o) => selected.includes(o.value))
          .map((opt) =>
            hasCode === 'Y' ? (
              <Box key={opt.value} display="flex" alignItems="center" gap={0.5}>
                {isChip === 'Y' &&
                  renderCodePill(opt.code, opt.chipColor, opt.value)}
                {showLabelWithChip === 'Y' && (
                  <Box component="span">{opt.label}</Box>
                )}
              </Box>
            ) : (
              <Box key={opt.value}>
                {isChip === 'Y'
                  ? renderCodePill(opt.label, opt.chipColor, opt.value)
                  : opt.label}
              </Box>
            ),
          )}
      </Box>
    );
  };

  return (
    <Box display="flex" flexDirection="column">
      <Typography
        variant="caption"
        color="text.primary"
        lineHeight={size === 'small' ? 1 : 1.3}
        fontWeight={size === 'small' ? 400 : 500}
        m="2px"
      >
        {label}
      </Typography>

      <Select
        // {...props}
        ref={ref}
        multiple
        value={internalValue}
        name={name}
        displayEmpty
        renderValue={renderValue}
        onChange={(e) => handleChange(e.target.value as string[])}
        sx={{
          height: size === 'small' ? 24 : 36,
          '.MuiOutlinedInput-input': {
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: size === 'small' ? '0 8px' : '0 12px',
            fontSize: size === 'small' ? '12px' : '13px',
          },
          ...(sx as SxProps),
        }}
        MenuProps={{
          disableAutoFocusItem: true,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          PaperProps: {
            sx: {
              maxHeight: 'calc(80vh - 40px)',
              mt: '4px',
              '& .MuiMenuItem-root': {
                minHeight: 30,
                height: 30,
              },
            },
          },
        }}
      >
        <MenuItem
          value={ALL_VALUE}
          sx={{
            fontSize: 13,
            lineHeight: 1.3,
            fontWeight: 400,
            p: 1,
            gap: 2,
            minHeight: 28,
            mb: '2px',
            '&.Mui-selected': {
              backgroundColor: COLORS.background.default,
            },
            '&:hover': {
              backgroundColor: COLORS.text.states.hover,
            },
          }}
        >
          <Checkbox
            size="small"
            checked={isAllSelected}
            indeterminate={!isAllSelected && internalValue.length > 0}
          />
          All
        </MenuItem>

        <Divider sx={{ width: '100%', my: '4px !important' }} />

        {allOptions.flatMap((option) => {
          const checked = internalValue.includes(option.value);

          // const isAll = option.value === ALL_VALUE;

          const items = [
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{
                fontSize: 13,
                lineHeight: 1.3,
                fontWeight: 400,
                p: 1,
                gap: 2,
                minHeight: 28,
                mb: '2px',
                '&.Mui-selected': {
                  backgroundColor: COLORS.background.default,
                },
                '&:hover': {
                  backgroundColor: COLORS.text.states.hover,
                },
              }}
            >
              <Checkbox size="small" checked={checked} />

              {hasCode === 'Y' ? (
                <>
                  {isChip === 'Y' &&
                    renderCodePill(option.code, option.chipColor)}
                  {option.label}
                </>
              ) : isChip === 'Y' ? (
                renderCodePill(option.label, option.chipColor)
              ) : (
                option.label
              )}
            </MenuItem>,
          ];
          return items;
        })}
      </Select>
    </Box>
  );
});

export default MultiSelectWithLabel;
