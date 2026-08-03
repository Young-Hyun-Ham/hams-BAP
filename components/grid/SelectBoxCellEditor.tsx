import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
} from 'react';
import { Box, Paper, List, ListItemButton, Typography } from '@mui/material';
import { CustomCellEditorProps } from 'ag-grid-react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectBoxCellEditorParams extends CustomCellEditorProps {
  options?: SelectOption[];
}

const SelectBoxCellEditor = forwardRef(
  (params: SelectBoxCellEditorParams, ref) => {
    const [value, setValue] = useState<string | number>(params.value ?? '');
    const valueRef = useRef(params.value ?? '');
    const options = params.options || [];
    const width = params.column.getActualWidth();

    useImperativeHandle(ref, () => {
      return {
        getValue() {
          return valueRef.current;
        },
        isPopup() {
          return true;
        },
      };
    });

    useEffect(() => {
      // Initialize value, handle null/undefined
      const initialValue = params.value ?? '';
      setValue(initialValue);
      valueRef.current = initialValue;
    }, [params.value]);

    const handleSelect = (option: SelectOption) => {
      // 1. Force update the cell value via Grid API
      try {
        if (params.node && params.node.setDataValue) {
          params.node.setDataValue(params.column, option.value);
        }
      } catch (e) {
        console.error('setDataValue failed', e);
      }

      // 2. Update internal state
      valueRef.current = option.value;
      setValue(option.value);

      // 3. CANCEL editing.
      setTimeout(() => {
        if (params.api) {
          params.api.stopEditing(true);
        }
      }, 0);
    };

    const getLabel = (val: string | number) => {
      const opt = options.find((o) => o.value === val);
      return opt ? opt.label : val;
    };

    return (
      <Paper
        elevation={4}
        sx={{
          width,
          overflow: 'hidden',
          // mt: 0.5, // Check this margin
          // border: '1px solid',
          // borderColor: 'primary.main',
          borderRadius: 0,
        }}
      >
        {/* Header / Input Area - Mimics the renderer but active */}
        <Box
          sx={{
            height: params.node?.rowHeight ? params.node.rowHeight - 2 : 38, // Adjust for border
            px: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            cursor: 'pointer',
            // Visual separation from list if needed, but usually seamless is better for "open" state
            border: '2px solid',
            borderColor: 'primary.main',
            // borderColor: 'divider',
          }}
          onClick={() => {
            // Optional: toggle behavior if we wanted to allow closing without selecting,
            // but usually clicking away closes logic is handled by grid.
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: 'inherit',
              color:
                value === '' || value === null || value === undefined
                  ? 'text.secondary'
                  : 'text.primary',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {value === '' || value === null || value === undefined
              ? 'Select'
              : getLabel(value)}
          </Typography>
          <Typography fontSize={10} color="text.secondary">
            ▲
          </Typography>
        </Box>

        {/* Options */}
        <List disablePadding sx={{ maxHeight: 200, overflow: 'auto' }}>
          {options.map((opt) => (
            <ListItemButton
              key={opt.value}
              onClick={() => handleSelect(opt)}
              selected={opt.value === value}
              sx={{
                py: 0.5,
                px: 1,
                fontSize: 'inherit',
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: 'inherit',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {opt.label}
              </Typography>
            </ListItemButton>
          ))}
        </List>
      </Paper>
    );
  },
);

SelectBoxCellEditor.displayName = 'SelectBoxCellEditor';

export default SelectBoxCellEditor;
